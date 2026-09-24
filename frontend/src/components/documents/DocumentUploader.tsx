import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, X, AlertCircle } from 'lucide-react';
import { APP_CONFIG } from '../../config/constants';
import { formatBytes } from '../../utils/formatters';

interface DocumentUploaderProps {
  mode: 'policy' | 'contract';
  title?: string;
  description?: string;
  multiple?: boolean;
  existingNames?: string[];
  isUploading?: boolean;
  onUpload: (files: File[]) => Promise<void>;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  mode,
  title = mode === 'policy' ? 'Upload Policy Documents' : 'Upload Contract for Review',
  description,
  multiple = mode === 'policy',
  existingNames = [],
  isUploading = false,
  onUpload,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultDescription =
    description ||
    (mode === 'policy'
      ? `Upload 3–5 internal compliance policies. PDF only, up to ${formatBytes(
          APP_CONFIG.maxFileSizeBytes
        )} per document.`
      : `Upload exactly one contract to analyze. PDF only, up to ${formatBytes(
          APP_CONFIG.maxFileSizeBytes
        )}.`);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const validateAndStageFiles = (incomingList: FileList | File[]) => {
    const errors: string[] = [];
    const valid: File[] = [];

    const incomingArray = Array.from(incomingList);

    if (!multiple && incomingArray.length > 1) {
      errors.push('Only one contract file may be uploaded.');
      setValidationErrors(errors);
      return;
    }

    for (const file of incomingArray) {
      // 1. Extension / MIME check
      const isPdf =
        file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        errors.push(`"${file.name}" is not a PDF. Only PDF files are accepted.`);
        continue;
      }

      // 2. Size check
      if (file.size > APP_CONFIG.maxFileSizeBytes) {
        errors.push(
          `"${file.name}" exceeds the maximum allowed file size of ${formatBytes(
            APP_CONFIG.maxFileSizeBytes
          )}.`
        );
        continue;
      }

      // 3. Duplicate check against existing uploaded documents
      if (existingNames.some((name) => name.toLowerCase() === file.name.toLowerCase())) {
        errors.push(`"${file.name}" is already uploaded in the library.`);
        continue;
      }

      // 4. Duplicate check against already staged files
      if (stagedFiles.some((f) => f.name.toLowerCase() === file.name.toLowerCase())) {
        errors.push(`"${file.name}" is already in your staged upload list.`);
        continue;
      }

      valid.push(file);
    }

    if (!multiple) {
      if (valid.length > 0) {
        setStagedFiles([valid[0]]);
      }
    } else {
      setStagedFiles((prev) => [...prev, ...valid]);
    }

    setValidationErrors(errors);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndStageFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndStageFiles(e.target.files);
    }
    // Reset file input value so re-selecting same file triggers event
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeStagedFile = (index: number) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCommitUpload = async () => {
    if (stagedFiles.length === 0) return;
    try {
      await onUpload(stagedFiles);
      setStagedFiles([]);
      setValidationErrors([]);
    } catch {
      // Error handled by parent or mutation
    }
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-6 text-center transition-colors ${
          isDragOver
            ? 'border-sky-500 bg-sky-50/60'
            : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50/50'
        } ${isUploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple={multiple}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isUploading}
          aria-label={title}
        />

        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-sky-50 text-sky-700 group-hover:bg-sky-100 transition-colors">
          <UploadCloud size={24} aria-hidden="true" />
        </div>

        <p className="mt-3 text-xs font-semibold text-slate-800">
          <span className="text-sky-700 underline underline-offset-2">Click to browse</span> or drag & drop PDF files
        </p>
        <p className="mt-1 text-[11px] text-slate-500 max-w-sm">{defaultDescription}</p>
      </div>

      {/* Inline Validation Warnings */}
      {validationErrors.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
            <AlertCircle size={14} className="text-amber-700 shrink-0" />
            <span>Upload Notice</span>
          </div>
          <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-0.5 pl-1">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Staged Files List */}
      {stagedFiles.length > 0 && (
        <div className="rounded-md border border-slate-200 bg-slate-50/50 p-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs font-semibold text-slate-700">
            <span>Staged for Upload ({stagedFiles.length})</span>
            <button
              type="button"
              onClick={handleCommitUpload}
              disabled={isUploading}
              className="inline-flex items-center gap-1.5 rounded-md bg-sky-700 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-sky-800 disabled:opacity-50"
            >
              {isUploading
                ? 'Uploading...'
                : mode === 'policy'
                ? 'Upload Policies'
                : 'Upload Contract'}
            </button>
          </div>

          <div className="mt-2 divide-y divide-slate-200/70 max-h-48 overflow-y-auto">
            {stagedFiles.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center justify-between py-2 text-xs"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <FileText size={15} className="text-sky-700 shrink-0" />
                  <span className="font-medium text-slate-800 truncate" title={file.name}>
                    {file.name}
                  </span>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    ({formatBytes(file.size)})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeStagedFile(idx);
                  }}
                  disabled={isUploading}
                  className="text-slate-400 hover:text-slate-600 p-1"
                  aria-label={`Remove ${file.name}`}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
