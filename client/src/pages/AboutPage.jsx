import { useOutletContext } from "react-router-dom";
import { Topbar } from "../components/Topbar.jsx";

export function AboutPage() {
  const { onOpenMenu } = useOutletContext();

  return (
    <>
      <Topbar title="About" description="What RepoMedic AI is, and isn't." onOpenMenu={onOpenMenu} />
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <div className="mx-auto flex max-w-2xl flex-col gap-6 text-sm leading-relaxed text-ink-soft">
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-ink">Product principle</h2>
            <p className="mt-2">Evidence first. AI second. Human control always.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">What this is</h2>
            <p className="mt-2">
              RepoMedic AI is a repository onboarding and maintenance
              assistant. It inspects a repository's files and runs a set of
              deterministic, rule-based checks to surface common onboarding
              and documentation gaps &mdash; nothing more.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">What this is not</h2>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Not a full security audit.</li>
              <li>Not a code-quality or style linter.</li>
              <li>Not an autonomous coding agent &mdash; it never modifies your repository.</li>
              <li>Not a generic chatbot.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">Current phase</h2>
            <p className="mt-2">
              The deterministic scanner (findings, evidence, reports) works
              fully on its own. An optional local AI layer can explain and
              prioritize those same findings using a model you run yourself
              with <a className="text-accent underline" href="https://ollama.com" target="_blank" rel="noreferrer">Ollama</a> &mdash;
              it never invents new findings, and everything keeps working if
              the AI model isn&apos;t available. See the &ldquo;AI: connected / unavailable&rdquo;
              badge on the Findings page.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
