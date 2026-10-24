import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LandingPage } from "./LandingPage.jsx";

function renderLanding() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>
  );
}

describe("LandingPage", () => {
  it("renders the hero headline and product principle", () => {
    renderLanding();
    expect(
      screen.getByRole("heading", { name: /know your repository/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Evidence first. AI second. Human control always.")
    ).toBeInTheDocument();
  });

  it("links the primary CTA to the dashboard at /app", () => {
    renderLanding();
    const ctas = screen.getAllByRole("link", { name: /try the live demo/i });
    expect(ctas.length).toBeGreaterThan(0);
    for (const cta of ctas) {
      expect(cta).toHaveAttribute("href", "/app");
    }
  });

  it("provides a 'run it locally' anchor with copyable commands", () => {
    renderLanding();
    expect(screen.getByRole("link", { name: /run it locally/i })).toHaveAttribute(
      "href",
      "#run-locally"
    );
    expect(screen.getByText("npm install")).toBeInTheDocument();
    expect(screen.getByText("npm run dev:server")).toBeInTheDocument();
    expect(screen.getByText("npm run dev:client")).toBeInTheDocument();
  });

  it("honestly explains that the live demo's AI badge will show unavailable", () => {
    renderLanding();
    expect(screen.getByText(/AI: unavailable/)).toBeInTheDocument();
    expect(screen.getByText(/no api key, no paid dependency/i)).toBeInTheDocument();
  });

  it("never claims the scanner executes repository code", () => {
    renderLanding();
    expect(screen.getByText(/never executes uploaded code/i)).toBeInTheDocument();
  });

  it("does not render a source-code link when VITE_GITHUB_REPO_URL is not configured", () => {
    renderLanding();
    expect(screen.queryByRole("link", { name: /source/i })).not.toBeInTheDocument();
  });

  it("links to the in-app About page", () => {
    renderLanding();
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute(
      "href",
      "/app/about"
    );
  });
});
