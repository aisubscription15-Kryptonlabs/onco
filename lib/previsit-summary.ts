export type SummaryBlock = {
  heading?: string;
  lines: string[];
  bulleted: boolean;
};

export type InlineSegment = {
  text: string;
  bold: boolean;
};

export function parseSummaryBlocks(text: string | null | undefined): SummaryBlock[] {
  if (!text?.trim()) return [];

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const blocks: SummaryBlock[] = [];
  let current: SummaryBlock | null = null;

  const pushCurrent = () => {
    if (current && current.lines.length > 0) {
      blocks.push(current);
    }
  };

  for (const rawLine of lines) {
    const isBullet = /^[-*•]\s+/.test(rawLine);
    const cleanedLine = rawLine.replace(/^[-*•]\s+/, "").trim();

    const headingOnlyMatch = cleanedLine.match(/^(.{2,80}):$/);
    if (headingOnlyMatch) {
      pushCurrent();
      current = {
        heading: headingOnlyMatch[1].trim(),
        lines: [],
        bulleted: false,
      };
      continue;
    }

    const inlineHeadingMatch = cleanedLine.match(/^([^:]{2,60}):\s+(.+)$/);
    if (inlineHeadingMatch && !isBullet) {
      pushCurrent();
      current = {
        heading: inlineHeadingMatch[1].trim(),
        lines: [inlineHeadingMatch[2].trim()],
        bulleted: false,
      };
      continue;
    }

    if (!current) {
      current = {
        lines: [],
        bulleted: isBullet,
      };
    }

    if (isBullet) {
      current.bulleted = true;
    }

    current.lines.push(cleanedLine);
  }

  pushCurrent();
  return blocks;
}

export function parseInlineSegments(line: string): InlineSegment[] {
  if (!line) return [];

  const segments: InlineSegment[] = [];
  const regex = /\*\*(.*?)\*\*/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        text: line.slice(lastIndex, match.index),
        bold: false,
      });
    }

    segments.push({
      text: match[1],
      bold: true,
    });

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < line.length) {
    segments.push({
      text: line.slice(lastIndex),
      bold: false,
    });
  }

  return segments;
}
