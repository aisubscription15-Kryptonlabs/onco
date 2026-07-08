// Thin HTTP wrapper around the official HL7 FHIR validator_cli.jar.
// Accepts the same request/response shape as the hapifhir/fhir-validator-wrapper
// Docker image so the validate route works without any changes.
//
// POST /validate
//   Body: { cliContext: { sv: "4.0.1" }, filesToValidate: [{ fileContent: "<base64>", fileName: "..." }] }
//   Response: { outcomes: [{ issues: [{ level, message, location }] }] }

const http = require("http");
const { execFile } = require("child_process");
const { writeFileSync, readFileSync, unlinkSync, existsSync, mkdirSync } = require("fs");
const { tmpdir, homedir } = require("os");
const { join } = require("path");
const crypto = require("crypto");

const PORT = 8080;
const CACHE_DIR = process.env.CACHE_DIR || join(homedir(), ".cache", "fhir");
const JAR = join(CACHE_DIR, "validator_cli.jar");
const FHIR_VERSION = "4.0.1";

function severityToLevel(s) {
  if (s === "fatal" || s === "error") return "ERROR";
  if (s === "warning") return "WARNING";
  return "INFORMATION";
}

function parseOperationOutcome(filePath) {
  try {
    const raw = readFileSync(filePath, "utf8");
    const oo = JSON.parse(raw);
    return (oo.issue || []).map((i) => ({
      level: severityToLevel(i.severity),
      message: i.diagnostics || i.details?.text || "(no message)",
      location: i.location?.[0] || "",
    }));
  } catch {
    return [];
  }
}

function validate(bundleJson, sv, callback) {
  const id = crypto.randomBytes(8).toString("hex");
  const inputFile = join(tmpdir(), `fhir-in-${id}.json`);
  const outputFile = join(tmpdir(), `fhir-out-${id}.json`);

  try {
    writeFileSync(inputFile, bundleJson, "utf8");
  } catch (e) {
    return callback(new Error("Could not write temp file: " + e.message), []);
  }

  const args = [
    "-jar", JAR,
    inputFile,
    "-version", sv || FHIR_VERSION,
    "-output", outputFile,
    "-tx", "n/a",         // skip terminology server — works offline
    "-no-native",
  ];

  execFile("java", args, { timeout: 120_000 }, () => {
    // The validator exits non-zero when the resource has errors — that's expected.
    // We always read the output file regardless of exit code.
    const issues = parseOperationOutcome(outputFile);

    try { unlinkSync(inputFile); } catch {}
    try { unlinkSync(outputFile); } catch {}

    callback(null, issues);
  });
}

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", jar: existsSync(JAR) }));
    return;
  }

  if (req.method !== "POST" || req.url !== "/validate") {
    res.writeHead(404);
    res.end();
    return;
  }

  let body = "";
  req.on("data", (chunk) => { body += chunk; });
  req.on("end", () => {
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid JSON body" }));
      return;
    }

    const files = parsed?.filesToValidate;
    const sv = parsed?.cliContext?.sv || FHIR_VERSION;

    if (!Array.isArray(files) || files.length === 0) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "filesToValidate is required" }));
      return;
    }

    let bundleJson;
    try {
      bundleJson = Buffer.from(files[0].fileContent, "base64").toString("utf8");
    } catch {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid base64 in fileContent" }));
      return;
    }

    validate(bundleJson, sv, (err, issues) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
        return;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ outcomes: [{ issues }] }));
    });
  });
});

server.listen(PORT, () => {
  console.log(`[fhir-validator] Listening on http://localhost:${PORT}`);
  console.log(`[fhir-validator] JAR: ${JAR}`);
  if (!existsSync(JAR)) {
    console.warn("[fhir-validator] WARNING: validator_cli.jar not found — run entrypoint.sh to download it");
  }
});
