import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UploadDropzone } from "./UploadDropzone.jsx";

function makeFile(name, content = "x", type = "application/zip") {
  return new File([content], name, { type });
}

describe("UploadDropzone", () => {
  it("shows a validation error for a non-zip file dropped onto the zone", () => {
    // Real browsers filter the <input accept=".zip"> file picker itself,
    // so the only realistic way a non-zip file reaches validation is via
    // drag-and-drop, which bypasses the `accept` attribute entirely.
    const onSubmit = vi.fn();
    const { container } = render(<UploadDropzone onSubmit={onSubmit} />);
    const dropzone = container.querySelector(".border-dashed");

    const file = makeFile("notes.txt", "x", "text/plain");
    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });

    expect(screen.getByRole("alert")).toHaveTextContent("Only .zip archives are supported.");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows a validation error for an empty file", async () => {
    render(<UploadDropzone onSubmit={vi.fn()} />);
    const input = screen.getByLabelText("Upload repository ZIP file");

    await userEvent.upload(input, makeFile("repo.zip", ""));

    expect(screen.getByRole("alert")).toHaveTextContent("The selected file is empty.");
  });

  it("accepts a valid zip file and calls onSubmit when confirmed", async () => {
    const onSubmit = vi.fn();
    render(<UploadDropzone onSubmit={onSubmit} />);
    const input = screen.getByLabelText("Upload repository ZIP file");

    const file = makeFile("my-repo.zip");
    await userEvent.upload(input, file);

    expect(screen.getByText("my-repo.zip")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /scan this repository/i }));
    expect(onSubmit).toHaveBeenCalledWith(file);
  });

  it("clears the selection when Remove is clicked", async () => {
    render(<UploadDropzone onSubmit={vi.fn()} />);
    const input = screen.getByLabelText("Upload repository ZIP file");

    await userEvent.upload(input, makeFile("my-repo.zip"));
    expect(screen.getByText("my-repo.zip")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /remove/i }));
    expect(screen.queryByText("my-repo.zip")).not.toBeInTheDocument();
  });

  it("disables interaction while disabled prop is true", () => {
    render(<UploadDropzone onSubmit={vi.fn()} disabled />);
    expect(screen.getByLabelText("Upload repository ZIP file")).toBeDisabled();
  });
});
