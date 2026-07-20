import { useState, DragEvent, ChangeEvent } from "react";
import { UploadCloud, File, AlertCircle } from "lucide-react";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isUploading: boolean;
}

export default function UploadZone({ onFileSelect, isUploading }: UploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = (e: DragEvent<HTMLDivElement | HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const processFile = (file: File) => {
    // Arbitrary 25MB limit to prevent network timeouts, though server can support up to 50MB
    const maxSizeBytes = 25 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError("File size exceeds 25MB limit. Please upload a smaller file.");
      return;
    }
    setError(null);
    onFileSelect(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement | HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <label
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center border-2 border-dashed p-8 transition-colors duration-150 cursor-pointer text-center group ${
          isDragActive
            ? "border-blue-500 bg-blue-50/40 rounded-3xl"
            : "border-slate-200 bg-slate-50 hover:bg-slate-100/50 rounded-3xl"
        } ${isUploading ? "pointer-events-none opacity-60" : ""}`}
      >
        <input
          type="file"
          className="hidden"
          onChange={handleFileInputChange}
          disabled={isUploading}
        />

        <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-slate-100 transition-transform duration-200 group-hover:scale-105">
          <UploadCloud className="h-6 w-6 text-blue-500" />
        </div>

        <h2 className="text-slate-800 font-semibold text-base mb-1">
          {isDragActive ? "Drop your file here" : "Click to upload or drag and drop"}
        </h2>
        <p className="text-slate-500 text-xs mb-4 max-w-sm mx-auto">
          Support for documents, images, PDFs, or designs (max 25MB)
        </p>

        {isUploading ? (
          <div className="flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-medium animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-ping"></span>
            <span>Uploading sandbox file...</span>
          </div>
        ) : (
          <span
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-[0.98] select-none"
          >
            Select File
          </span>
        )}
      </label>

      {error && (
        <div className="mt-3 flex items-start space-x-2 bg-amber-50 text-amber-800 border border-amber-200 p-3 rounded-lg text-xs">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
