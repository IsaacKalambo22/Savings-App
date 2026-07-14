import Image from "next/image";
import ThemeToggle from "./theme-toggle";

// Permanent APK — GitHub Release asset (never expires, unlike EAS artifacts).
const APK_URL =
  "https://github.com/IsaacKalambo22/Savings-App/releases/download/v1.0.0/nestkeep.apk";

/* ---------- Icons (inline, currentColor) ---------- */
const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const Icons = {
  wallet: (
    <svg {...iconProps}>
      <path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v2" />
      <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H5a2 2 0 0 1-2-2z" />
      <circle cx="16" cy="13" r="1.2" />
    </svg>
  ),
  bolt: (
    <svg {...iconProps}>
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
    </svg>
  ),
  grid: (
    <svg {...iconProps}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  chart: (
    <svg {...iconProps}>
      <path d="M4 20V4M4 20h16" />
      <path d="M8 16v-3M12 16V8M16 16v-6M20 16v-9" />
    </svg>
  ),
  search: (
    <svg {...iconProps}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),
  cloud: (
    <svg {...iconProps}>
      <path d="M17.5 19a4.5 4.5 0 0 0 .5-8.97A6 6 0 0 0 6.3 9.5 4 4 0 0 0 7 19h10.5z" />
      <path d="M12 12v5M9.5 14.5 12 12l2.5 2.5" />
    </svg>
  ),
  download: (
    <svg {...iconProps}>
      <path d="M12 3v12M7 10l5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  ),
  lock: (
    <svg {...iconProps}>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <circle cx="12" cy="15" r="1.2" />
    </svg>
  ),
  users: (
    <svg {...iconProps}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 5.2a3.2 3.2 0 0 1 0 5.6M17.5 20a6.5 6.5 0 0 0-3-5.5" />
    </svg>
  ),
  target: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  ),
};

const FEATURES: { icon: React.ReactNode; title: string; body: string }[] = [
  {
    icon: Icons.wallet,
    title: "Multiple accounts",
    body: "Track unlimited savings accounts, each with its own independent ledger, colour, and icon. Archive old ones without ever losing their history.",
  },
  {
    icon: Icons.bolt,
    title: "Fast transactions",
    body: "Log deposits, withdrawals, and transfers in seconds. Add notes and tags, and reverse a mistake with a clean audit trail instead of a delete.",
  },
  {
    icon: Icons.grid,
    title: "At-a-glance dashboard",
    body: "Open the app to your total savings and recent activity across every account — always up to date, always instant.",
  },
  {
    icon: Icons.chart,
    title: "Reports & charts",
    body: "Understand where your money moves with clear charts of inflows, outflows, and balances over time.",
  },
  {
    icon: Icons.search,
    title: "Search & filters",
    body: "Find any transaction instantly — filter by amount, note, tag, date range, type, or account.",
  },
  {
    icon: Icons.cloud,
    title: "Offline-first sync",
    body: "Everything works with no connection. Your device is the source of truth, and changes sync to the cloud automatically once you're back online.",
  },
  {
    icon: Icons.download,
    title: "Export & backup",
    body: "Export your records to share or back up whenever you like. Your data stays yours — take it with you at any time.",
  },
  {
    icon: Icons.lock,
    title: "Private & secure",
    body: "Lock NestKeep behind a PIN or biometrics (Face ID / fingerprint), with automatic locking after inactivity.",
  },
  {
    icon: Icons.users,
    title: "Shared households",
    body: "Invite family to a shared household with roles — owner, admin, member, or viewer — so everyone stays on the same page.",
  },
  {
    icon: Icons.target,
    title: "Savings goals",
    body: "Set a target amount and deadline for each goal, then watch your progress build toward it.",
  },
];

export default function Home() {
  return (
    <main className="page">
      <header className="nav">
        <div className="brand">
          <Image
            src="/logo.png"
            alt="NestKeep logo"
            width={36}
            height={36}
            className="brand-mark"
            priority
          />
          <span className="brand-name">NestKeep</span>
        </div>
        <nav className="nav-links">
          <a href="#features">Features</a>
          <a href="#get-app" className="nav-cta">
            Get the app
          </a>
          <ThemeToggle />
        </nav>
      </header>

      <section className="hero">
        <div className="hero-inner">
          <span className="eyebrow">Household savings, organized</span>
          <h1 className="hero-title">
            Every kwacha, every account —{" "}
            <span className="accent">in one place.</span>
          </h1>
          <p className="hero-sub">
            NestKeep is a private, offline-first savings tracker for your whole
            household. Log deposits and withdrawals in seconds, set goals, and
            keep every account balanced — with or without a connection.
          </p>
          <div className="hero-actions">
            <a href="#get-app" className="btn btn-primary">
              Download for Android
            </a>
            <a href="#features" className="btn btn-ghost">
              See all features
            </a>
          </div>
          <p className="hero-note">Free · Works offline · No account required</p>
        </div>

        <div className="hero-art" aria-hidden="true">
          <div className="hero-glow" />
          <Image
            src="/logo-full.png"
            alt=""
            width={420}
            height={420}
            className="hero-logo"
            priority
          />
        </div>
      </section>

      <section className="features-section" id="features">
        <div className="section-head">
          <span className="eyebrow">Features</span>
          <h2>Everything you need to track household savings</h2>
          <p>
            From logging a single deposit to sharing the books with your whole
            family — online or off, NestKeep covers the full loop.
          </p>
        </div>
        <div className="features">
          {FEATURES.map((f) => (
            <div className="feature" key={f.title}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-section" id="get-app">
        <div className="cta-card">
          <Image
            src="/logo.png"
            alt="NestKeep app icon"
            width={72}
            height={72}
            className="cta-icon"
          />
          <h2>Get NestKeep for Android</h2>
          <p>
            Download the app and start tracking your household savings today —
            free, offline-first, and no sign-up required to get going.
          </p>
          <div className="cta-buttons">
            <a
              href={APK_URL}
              className="btn btn-primary btn-lg"
              target="_blank"
              rel="noopener noreferrer"
            >
              Download APK
            </a>
            <span className="btn btn-ghost btn-lg btn-disabled">
              iOS — coming soon
            </span>
          </div>
          <p className="cta-req">Android 7.0+ · Free · Offline-first</p>
        </div>
      </section>

      <footer className="footer">
        <span>© {new Date().getFullYear()} NestKeep</span>
        <span>Organize every savings account in one place.</span>
      </footer>
    </main>
  );
}
