import React from 'react';

interface FileDropZoneProps {
  onFilesSelected: (files: FileList) => void;
  accept?: string;
  multiple?: boolean;
  isDragActive: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  label?: string;
  hint?: string;
  selectedFileName?: string;
  selectedFileCount?: number;
}

export const FileDropZone: React.FC<FileDropZoneProps> = ({
  onFilesSelected,
  accept = '*',
  multiple = false,
  isDragActive,
  onDragOver,
  onDragLeave,
  onDrop,
  label = 'Select a file',
  hint = 'PNG or JPG',
  selectedFileName,
  selectedFileCount,
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
    }
  };

  const displayText = selectedFileCount 
    ? `${selectedFileCount} file${selectedFileCount !== 1 ? 's' : ''} selected`
    : selectedFileName || 'Drop file here';

  return (
    <div className="flex flex-col mt-5">
      <label className="text-lg font-light mb-2">{label}</label>
      <div className="flex items-center justify-center w-full">
        <label
          className={`
            flex flex-col items-center justify-center w-full h-64 
            border-2 border-dashed rounded-lg cursor-pointer 
            transition-all duration-200 ease-in-out
            ${isDragActive 
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
              : 'border-slate-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700'
            }
            hover:bg-slate-100 dark:hover:bg-slate-800 
            hover:border-slate-400 dark:hover:border-slate-500
          `}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg
              className={`w-10 h-10 mb-4 transition-colors ${
                isDragActive ? 'text-indigo-500' : 'text-slate-400'
              }`}
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 20 16"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
              />
            </svg>
            <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>
            <p className={`text-xs mt-1 ${
              selectedFileName || selectedFileCount 
                ? 'text-indigo-500 font-medium' 
                : 'text-slate-400'
            }`}>
              {displayText}
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept={accept}
            multiple={multiple}
          />
        </label>
      </div>
    </div>
  );
};

export default FileDropZone;
