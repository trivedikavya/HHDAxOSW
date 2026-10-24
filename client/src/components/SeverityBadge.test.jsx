import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SeverityBadge } from "./SeverityBadge.jsx";

describe("SeverityBadge", () => {
  it("renders the human-readable label for a known severity", () => {
    render(<SeverityBadge severity="critical" />);
    expect(screen.getByText("Critical")).toBeInTheDocument();
  });

  it("renders an icon alongside the text (not color alone)", () => {
    const { container } = render(<SeverityBadge severity="medium" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(screen.getByText("Medium")).toBeInTheDocument();
  });

  it("falls back to the info style for an unrecognized severity", () => {
    render(<SeverityBadge severity="unknown-severity" />);
    expect(screen.getByText("Info")).toBeInTheDocument();
  });
});
