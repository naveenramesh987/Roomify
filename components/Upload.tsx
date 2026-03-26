import { CheckCircle2, ImageIcon, UploadIcon } from "lucide-react";
import React, { useState } from "react";
import { useOutletContext } from "react-router";
import {
  FILE_SIZE_LIMIT,
  PROGRESS_INTERVAL_MS,
  PROGRESS_STEP,
  REDIRECT_DELAY_MS,
} from "lib/constants";

interface UploadProps {
  onComplete: (base64: string) => void;
}

const Upload = ({ onComplete }: UploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const { isSignedIn } = useOutletContext<AuthContext>();

  const processFile = (selected: File) => {
    if (selected.size > FILE_SIZE_LIMIT) {
      setError("File exceeds the 50 MB limit. Please choose a smaller file.");
      return;
    }
    setError(null);
    setFile(selected);
    setProgress(0);

    const reader = new FileReader();

    reader.onload = (e) => {
      const base64 = e.target?.result as string;

      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => onComplete(base64), REDIRECT_DELAY_MS);
            return 100;
          }
          return prev + PROGRESS_STEP;
        });
      }, PROGRESS_INTERVAL_MS);
    };

    reader.readAsDataURL(selected);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isSignedIn) return;
    const selected = e.target.files?.[0];
    if (selected) processFile(selected);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isSignedIn) setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (!isSignedIn) return;
    const selected = e.dataTransfer.files?.[0];
    if (selected) processFile(selected);
  };

  return (
    <div className="upload">
      {!file ? (
        <div
          className={`dropzone ${isDragging ? "is-dragging" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            className="drop-input"
            accept=".jpg,.jpeg,.png"
            disabled={!isSignedIn}
            onChange={handleChange}
          />

          <div className="drop-content">
            <div className="drop-icon">
              <UploadIcon size={20} />
            </div>
            <p>
              {isSignedIn
                ? "Click to upload or just drag and drop"
                : "Sign in or sign up with Puter to upload"}
            </p>
            <p className="help">Maximum file size: 50 MB</p>
            {error && <p className="error">{error}</p>}
          </div>
        </div>
      ) : (
        <div className="upload-status">
          <div className="status-content">
            <div className="status-icon">
              {progress === 100 ? (
                <CheckCircle2 className="check" />
              ) : (
                <ImageIcon className="image" />
              )}
            </div>

            <h3>{file.name}</h3>

            <div className="progress">
              <div className="bar" style={{ width: `${progress}%` }} />

              <p className="status-text">
                {progress < 100 ? "Analyzing Floor Plan..." : "Redirecting..."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;
