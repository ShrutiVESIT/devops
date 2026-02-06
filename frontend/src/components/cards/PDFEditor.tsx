import React, { useState, useCallback } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { buildApiUrl } from '../../lib/api';
import { FileDropZone } from '../shared/FileDropZone';
import { CardHeader, SubmitButton } from '../shared/CardComponents';
import { useDragDrop, downloadBlob } from '../shared/useFileHandling';

const PDFEditor: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pagesToRemove, setPagesToRemove] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleFilesSelected = useCallback((files: FileList) => {
    const selectedFile = files[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    setFile(selectedFile);
    toast.success(`Selected: ${selectedFile.name}`);
  }, []);

  const validateFile = useCallback((file: File) => {
    return file.type === 'application/pdf';
  }, []);

  const { isDragActive, handleDragOver, handleDragLeave, handleDrop } = useDragDrop({
    onFilesDropped: handleFilesSelected,
    validateFile,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast.error('Please upload a PDF file');
      return;
    }

    if (!pagesToRemove.trim()) {
      toast.error('Please specify pages to remove');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const endpoint = buildApiUrl(`/edit-pdf/?page_numbers=${encodeURIComponent(pagesToRemove)}`);
      const res = await axios.post<Blob>(endpoint, formData, {
        responseType: 'blob',
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      downloadBlob(res.data, `modified_${file.name}`);
      toast.success('PDF modified successfully!');
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.detail || 'Failed to modify PDF'
        : 'An unexpected error occurred';
      toast.error(message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-left">
      <Toaster position="top-right" />
      <div className="card-cont">
        <CardHeader
          title="PDF Page Remover"
          description="Remove specific pages from your PDF documents"
        />

        <form onSubmit={handleSubmit}>
          <FileDropZone
            onFilesSelected={handleFilesSelected}
            accept=".pdf"
            isDragActive={isDragActive}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            label="Select a PDF file"
            hint="PDF files only"
            selectedFileName={file?.name}
          />

          <div className="flex flex-col mt-5">
            <label htmlFor="pages-to-remove" className="text-lg font-light mb-2">
              Pages to remove
            </label>
            <input
              id="pages-to-remove"
              type="text"
              value={pagesToRemove}
              onChange={(e) => setPagesToRemove(e.target.value)}
              placeholder="e.g., 1, 3, 5-7, 10"
              className="
                p-3 rounded-lg
                bg-slate-100 dark:bg-slate-700 
                text-slate-700 dark:text-slate-200
                border border-slate-300 dark:border-slate-600
                focus:outline-none focus:ring-2 focus:ring-indigo-500
                transition-colors
              "
            />
            <p className="text-xs text-slate-500 mt-1">
              Use commas to separate pages, hyphens for ranges
            </p>
          </div>

          <SubmitButton
            loading={loading}
            disabled={!file || !pagesToRemove.trim()}
            loadingText="Processing..."
          >
            Remove Pages
          </SubmitButton>
        </form>
      </div>
    </div>
  );
};

export default PDFEditor;
