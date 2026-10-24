import { useCallback, useRef, useState } from "react";
import { UploadCloud, FileArchive, X } from "lucide-react";
import { Button } from "../../components/Button.jsx";

// Client-side display/pre-check only. The server enforces the real limit
// (MAX_UPLOAD_SIZE_BYTES) independently and must never be trusted to be
// bypassed by this check.
const DISPLAY_MAX_SIZE_BYTES = 25 * 1024 * 1024;
const DISPLAY_MAX_SIZE_LABEL = "25 MB";

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadDropzone({ onSubmit, disabled }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef(null);

  const validateAndSetFile = useCallback((file) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".zip")) {
      setValidationError("Only .zip archives are supported.");
      setSelectedFile(null);
      return;
    }

    if (file.size === 0) {
      setValidationError("The selected file is empty.");
      setSelectedFile(null);
      return;
    }

    if (file.size > DISPLAY_MAX_SIZE_BYTES) {
      setValidationError(`The selected file exceeds the ${DISPLAY_MAX_SIZE_LABEL} limit.`);
      setSelectedFile(null);
      return;
    }

    setValidationError(null);
    setSelectedFile(file);
  }, []);

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      setIsDragOver(false);
      if (disabled) return;
      const file = event.dataTransfer.files?.[0];
      validateAndSetFile(file);
    },
    [disabled, validateAndSetFile]
  );

  const handleBrowseClick = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    validateAndSetFile(file);
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setValidationError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors duration-150 ${
          isDragOver ? "border-accent bg-accent/5" : "border-border bg-card"
        } ${disabled ? "opacity-60" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".zip,application/zip"
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled}
          aria-label="Upload repository ZIP file"
        />

        {selectedFile ? (
          <>
            <FileArchive size={28} className="text-accent" aria-hidden="true" />
            <div>
              <p className="font-mono text-sm text-ink">{selectedFile.name}</p>
              <p className="text-xs text-ink-faint">{formatBytes(selectedFile.size)}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => onSubmit(selectedFile)} disabled={disabled}>
                Scan this repository
              </Button>
              <Button variant="ghost" onClick={clearSelection} disabled={disabled}>
                <X size={14} aria-hidden="true" />
                Remove
              </Button>
            </div>
          </>
        ) : (
          <>
            <UploadCloud size={28} className="text-ink-faint" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-ink">
                Drag and drop a repository ZIP here
              </p>
              <p className="mt-1 text-xs text-ink-faint">
                Accepted format: .zip &middot; Max size: {DISPLAY_MAX_SIZE_LABEL}
              </p>
            </div>
            <Button variant="secondary" onClick={handleBrowseClick} disabled={disabled}>
              Browse files
            </Button>
          </>
        )}
      </div>

      {validationError ? (
        <p role="alert" className="text-sm text-danger">
          {validationError}
        </p>
      ) : null}
    </div>
  );
}
