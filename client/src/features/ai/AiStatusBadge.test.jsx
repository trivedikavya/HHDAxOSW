import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AiContext } from "./AiContext.jsx";
import { AiStatusBadge } from "./AiStatusBadge.jsx";

function renderBadge(value) {
  return render(
    <AiContext.Provider
      value={{
        connectionStatus: "unknown",
        connectionMessage: null,
        modelId: null,
        checkConnection: vi.fn(),
        insightStatus: "idle",
        insightsByFindingId: {},
        insightMessage: null,
        insightWarnings: [],
        generateInsights: vi.fn(),
        resetInsights: vi.fn(),
        ...value,
      }}
    >
      <AiStatusBadge />
    </AiContext.Provider>
  );
}

describe("AiStatusBadge", () => {
  it("checks the connection once on mount", () => {
    const checkConnection = vi.fn();
    renderBadge({ checkConnection });
    expect(checkConnection).toHaveBeenCalledTimes(1);
  });

  it("shows a connected label with the model ID when available", () => {
    renderBadge({ connectionStatus: "available", modelId: "qwen2.5:1.5b", checkConnection: vi.fn() });
    expect(screen.getByText("AI: connected")).toBeInTheDocument();
    expect(screen.getByText("(qwen2.5:1.5b)")).toBeInTheDocument();
  });

  it("shows an unavailable label when the model service can't be reached", () => {
    renderBadge({ connectionStatus: "unavailable", checkConnection: vi.fn() });
    expect(screen.getByText("AI: unavailable")).toBeInTheDocument();
  });

  it("re-checks the connection when clicked", async () => {
    const checkConnection = vi.fn();
    renderBadge({ connectionStatus: "available", checkConnection });
    checkConnection.mockClear();
    await userEvent.click(screen.getByRole("button"));
    expect(checkConnection).toHaveBeenCalledTimes(1);
  });
});
