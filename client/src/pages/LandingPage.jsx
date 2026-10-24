import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Bug,
  BrainCircuit,
  FileText,
  Upload,
  PlayCircle,
  ArrowRight,
  GitPullRequest,
  Terminal,
} from "lucide-react";
import { CodeBlock } from "../components/CodeBlock.jsx";

const GITHUB_URL = import.meta.env.VITE_GITHUB_REPO_URL;

const STEPS = [
  {
    icon: Upload,
    title: "Upload a repository, or load the demo",
    description:
      "Drop in a .zip archive, or load the bundled demo repository to see results in seconds. Either way, the same pipeline runs.",
  },
  {
    icon: ShieldCheck,
    title: "Scanned safely, in memory",
    description:
      "Files are inspected for patterns only. Nothing is executed, built, installed, or run \u2014 ever.",
  },
  {
    icon: Bug,
    title: "Findings with real evidence",
    description:
      "Every finding shows the affected file, severity, category, and the exact evidence a deterministic rule found \u2014 never a guess.",
  },
  {
    icon: BrainCircuit,
    title: "Optional local AI explains and prioritizes",
    description:
      "Run a local Ollama model to get plain-language explanations, priority, and remediation steps for the findings above. It never invents new findings.",
  },
  {
    icon: FileText,
    title: "Export a Markdown report",
    description:
      "Take the full, honest scan result with you \u2014 real findings, real evidence, ready to paste into an issue or a PR description.",
  },
];

const SAFETY_POINTS = [
  "Never executes uploaded code, scripts, or build tools.",
  "Never installs dependencies from an uploaded repository.",
  "ZIP archives are extracted entirely in memory \u2014 nothing touches disk.",
  "Path traversal, symlinks, and zip-bomb-style archives are rejected before extraction.",
  "Upload size, file count, and per-file size are all capped and configurable.",
];

const TECH_BADGES = [
  "React",
  "Vite",
  "Tailwind CSS",
  "Node.js",
  "Express",
  "Zod",
  "Ollama (local AI)",
];

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">{eyebrow}</p>
      ) : null}
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h2>
      {description ? <p className="mt-3 text-ink-soft">{description}</p> : null}
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-base text-ink">
      {/* Top nav */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-8">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-accent" size={22} aria-hidden="true" />
            <span className="text-base font-semibold tracking-tight">RepoMedic AI</span>
          </div>
          <div className="flex items-center gap-3">
            {GITHUB_URL ? (
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="hidden items-center gap-1.5 text-sm text-ink-soft hover:text-ink sm:flex"
              >
                <GitPullRequest size={16} aria-hidden="true" />
                Source
              </a>
            ) : null}
            <Link
              to="/app"
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-base hover:bg-accent/90"
            >
              Try the live demo
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-8 sm:py-24">
        <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1.5 text-xs font-medium text-accent">
          Evidence first. AI second. Human control always.
        </span>
        <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Know your repository
          <br className="hidden sm:block" /> before you change it.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
          RepoMedic AI inspects a repository's files, runs deterministic checks to
          find real onboarding and maintenance gaps, and lets a local AI model
          explain and prioritize what it found &mdash; without ever executing a
          single line of your code.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/app"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-medium text-base hover:bg-accent/90 sm:w-auto"
          >
            <PlayCircle size={18} aria-hidden="true" />
            Try the live demo
          </Link>
          <a
            href="#run-locally"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-5 py-3 text-sm font-medium text-ink hover:bg-raised sm:w-auto"
          >
            <Terminal size={18} aria-hidden="true" />
            Run it locally
          </a>
        </div>
        <p className="mt-4 text-xs text-ink-faint">
          No account. No install required to try the live demo.
        </p>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-sidebar/40 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <SectionHeading
            eyebrow="How it works"
            title="Five steps, nothing hidden"
            description="Every step produces something you can see and verify \u2014 no fabricated scores, no invisible magic."
          />
          <ol className="mx-auto mt-12 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map(({ icon: Icon, title, description }, index) => (
              <li
                key={title}
                className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5"
              >
                <div className="flex items-center gap-2">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-raised font-mono text-xs text-ink-faint">
                    {index + 1}
                  </span>
                  <Icon size={18} className="text-accent" aria-hidden="true" />
                </div>
                <h3 className="text-sm font-semibold text-ink">{title}</h3>
                <p className="text-sm text-ink-soft">{description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Safety */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-8">
          <SectionHeading
            eyebrow="Safety"
            title="Your repository's code never runs"
            description="RepoMedic AI is a repository-maintenance and onboarding tool with limited, documented checks \u2014 not a full security audit."
          />
          <ul className="mx-auto mt-10 max-w-2xl space-y-3">
            {SAFETY_POINTS.map((point) => (
              <li
                key={point}
                className="flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm text-ink-soft"
              >
                <ShieldCheck size={16} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* AI honesty section */}
      <section className="border-t border-border bg-sidebar/40 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-8">
          <BrainCircuit size={28} className="mx-auto text-accent" aria-hidden="true" />
          <h2 className="mt-4 text-2xl font-semibold tracking-tight">
            AI runs locally. On purpose.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-ink-soft">
            The AI layer talks to a model you run yourself with{" "}
            <a
              href="https://ollama.com"
              target="_blank"
              rel="noreferrer"
              className="text-accent underline"
            >
              Ollama
            </a>{" "}
            &mdash; no API key, no paid dependency, no sending your repository to a
            third party. Because the live demo above runs on a hosted server
            without a local model attached, its AI badge will honestly show{" "}
            <span className="font-mono text-ink">AI: unavailable</span> &mdash; the
            deterministic scanner, findings, and report export all still work
            exactly as shown. To see real AI explanations, run RepoMedic AI
            locally with Ollama installed (below).
          </p>
        </div>
      </section>

      {/* Run locally */}
      <section id="run-locally" className="scroll-mt-8 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl px-4 sm:px-8">
          <SectionHeading eyebrow="Run it locally" title="Two terminals, no accounts" />
          <div className="mt-8 flex flex-col gap-3">
            <CodeBlock label="1. Install dependencies" code="npm install" />
            <CodeBlock
              label="2. Start the API server (terminal 1)"
              code="npm run dev:server"
            />
            <CodeBlock
              label="3. Start the web app (terminal 2)"
              code="npm run dev:client"
            />
            <CodeBlock
              label="Optional: enable local AI explanations"
              code={"ollama pull qwen2.5:1.5b\nollama serve"}
            />
          </div>
          <p className="mt-4 text-center text-sm text-ink-soft">
            Full setup, environment variables, and architecture docs are in
            the project README{GITHUB_URL ? (
              <>
                {" "}
                on{" "}
                <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="text-accent underline">
                  GitHub
                </a>
              </>
            ) : null}
            .
          </p>
        </div>
      </section>

      {/* Tech + footer */}
      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 sm:px-8">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {TECH_BADGES.map((tech) => (
              <span
                key={tech}
                className="rounded-full border border-border bg-card px-3 py-1 text-xs text-ink-soft"
              >
                {tech}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-ink-faint">
            <span>RepoMedic AI &middot; Apache License 2.0</span>
            <Link to="/app/about" className="hover:text-ink-soft">
              About
            </Link>
            {GITHUB_URL ? (
              <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="hover:text-ink-soft">
                Source code
              </a>
            ) : null}
          </div>
        </div>
      </footer>
    </div>
  );
}
