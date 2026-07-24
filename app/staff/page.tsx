import Link from "next/link";

type StaffRole = {
  title: string;
  description: string;
  href: string;
  icon: "doctor" | "admin" | "provider";
};

const staffRoles: StaffRole[] = [
  {
    title: "Doctor",
    description: "Review movement plans, symptom alerts, patient progress, and doctor summaries.",
    href: "/doctor/login",
    icon: "doctor",
  },
  {
    title: "Admin",
    description: "Manage clinic staff, patient access, care-team codes, and program settings.",
    href: "/admin/login",
    icon: "admin",
  },
  {
    title: "App provider",
    description: "Manage clinics, deployments, AI prompts, usage, billing, and support operations.",
    href: "/app-provider/login",
    icon: "provider",
  },
];

function RoleIcon({ icon }: { icon: StaffRole["icon"] }) {
  if (icon === "doctor") {
    return (
      <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 3v5a5 5 0 0 0 10 0V3" />
        <path d="M7 3H5" />
        <path d="M17 3h2" />
        <path d="M12 13v3a4 4 0 0 0 8 0v-1" />
        <circle cx="20" cy="14" r="1.5" />
      </svg>
    );
  }

  if (icon === "admin") {
    return (
      <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 21h16" />
        <path d="M6 21V7l6-3 6 3v14" />
        <path d="M9 10h1" />
        <path d="M14 10h1" />
        <path d="M9 14h1" />
        <path d="M14 14h1" />
        <path d="M11 21v-4h2v4" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="7" r="3.5" />
      <path d="M5 21a7 7 0 0 1 14 0" />
      <path d="M9 15l3 3 3-3" />
    </svg>
  );
}

export default function StaffAccessTemplatePage() {
  return (
    <main className="min-h-screen bg-[#F5F8F3] text-onco-ink">
      <section className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-7">
        <div className="rounded-full bg-white px-4 py-2 text-center text-xs font-bold text-[#537263] shadow-[0_10px_26px_-24px_rgba(30,58,45,0.45)]">
          staff.oncomotionrx.com
        </div>

        <div className="mt-7 flex items-center gap-3 text-[#174B38]">
          <img alt="" className="h-10 w-10 rounded-xl object-cover" src="/onco/icons/oncomotionrx-icon.png" />
          <div>
            <p className="onco-display text-[23px] font-extrabold leading-none text-[#174B38]">OncoMotionRx</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-[#6F8279]">Staff portal</p>
          </div>
        </div>

        <section className="mt-10">
          <h1 className="onco-display text-[34px] font-extrabold leading-[1.02] text-onco-ink">
            Care team access,
            <br />separate from patients.
          </h1>
          <p className="mt-4 text-[15px] leading-6 text-[#56615D]">
            Staff members sign in here to review patient plans, manage clinic settings, and support the OncoMotionRx program.
          </p>
        </section>

        <div className="mt-8 rounded-[18px] border border-[#DDE9DF] bg-[#EAF5ED] p-4 text-sm leading-6 text-[#275D49]">
          This page is only a template preview. In production, it can become a separate Vercel project or subdomain while the patient app stays on the main site.
        </div>

        <div className="mt-5 space-y-3">
          {staffRoles.map((role) => (
            <Link
              key={role.title}
              href={role.href}
              className="group flex min-h-[86px] cursor-pointer items-center gap-4 rounded-[16px] border border-[#E4DDD1] bg-white px-4 py-4 shadow-[0_12px_28px_-24px_rgba(30,58,45,0.55)] transition hover:border-[#2E6B57] hover:bg-[#EEF7F1] active:bg-[#2E6B57] active:text-white"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E1EFE6] text-[#2E6B57] group-active:bg-white/15 group-active:text-white">
                <RoleIcon icon={role.icon} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[17px] font-extrabold leading-tight">{role.title}</span>
                <span className="mt-1 block text-sm leading-5 text-[#65706B] group-active:text-white/80">{role.description}</span>
              </span>
              <span aria-hidden="true" className="text-2xl leading-none text-[#2E6B57] group-active:text-white">›</span>
            </Link>
          ))}
        </div>

        <div className="mt-auto pt-8">
          <Link
            href="/"
            className="block rounded-[14px] border border-[#D7D1C6] bg-white px-4 py-3 text-center text-sm font-extrabold text-[#174B38] hover:bg-[#F8FBF8]"
          >
            Back to patient app
          </Link>
        </div>
      </section>
    </main>
  );
}
