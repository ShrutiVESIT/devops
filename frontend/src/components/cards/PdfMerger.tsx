import React, { useState, useCallback } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { BiChevronDown, BiChevronUp } from 'react-icons/bi';
import { buildApiUrl } from '../../lib/api';
import { FileDropZone } from '../shared/FileDropZone';
import { SubmitButton, FileList } from '../shared/CardComponents';
import { useDragDrop, downloadBlob } from '../shared/useFileHandling';

const MAX_FILES = 20;

const PdfMergerCard: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const handleFilesSelected = useCallback((fileList: FileList) => {
    const newFiles = Array.from(fileList).filter(file => 
      file.type.startsWith('image/') || file.type === 'application/pdf'
    );

    if (newFiles.length !== fileList.length) {
      toast.error('Only image and PDF files are allowed');
    }

    if (files.length + newFiles.length > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} files allowed`);
      const allowedCount = MAX_FILES - files.length;
      setFiles(prev => [...prev, ...newFiles.slice(0, allowedCount)]);
      return;
    }

    setFiles(prev => [...prev, ...newFiles]);
    toast.success(`${newFiles.length} file${newFiles.length !== 1 ? 's' : ''} added`);
  }, [files.length]);

  const validateFile = useCallback((file: File) => {
    return file.type.startsWith('image/') || file.type === 'application/pdf';
  }, []);

  const { isDragActive, handleDragOver, handleDragLeave, handleDrop } = useDragDrop({
    onFilesDropped: handleFilesSelected,
    validateFile,
  });

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    toast.success('File removed');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (files.length === 0) {
      toast.error('Please upload at least one file');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    files.forEach(file => formData.append('images', file));

    try {
      const res = await axios.post<Blob>(buildApiUrl('/convert-to-pdf/'), formData, {
        responseType: 'blob',
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      downloadBlob(res.data, 'merged_document.pdf');
      toast.success('PDF merged successfully!');
    } catch (error) {
      toast.error('Failed to merge files');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-left">
      <Toaster position="top-right" />
      <div className="card-cont">
        <div className="mb-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="
              w-full flex items-center justify-between
              bg-transparent border-none p-0
              focus:outline-none cursor-pointer
              group
            "
          >
            <div className="space-y-1">
              <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-500 to-blue-500 bg-clip-text text-transparent text-left">
                PDF Merger
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm text-left">
                Combine images and PDFs into one document
              </p>
            </div>
            <span className="text-slate-400 group-hover:text-indigo-500 transition-colors">
              {isExpanded ? <BiChevronUp size={24} /> : <BiChevronDown size={24} />}
            </span>
          </button>
        </div>

        {isExpanded && (
          <form onSubmit={handleSubmit} className="mt-4">
            <FileDropZone
              onFilesSelected={handleFilesSelected}
              accept="image/*,.pdf"
              multiple
              isDragActive={isDragActive}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              label={`Select files (max ${MAX_FILES})`}
              hint="Images (PNG, JPG) or PDF files"
              selectedFileCount={files.length > 0 ? files.length : undefined}
            />

            <FileList files={files} onRemove={removeFile} maxFiles={MAX_FILES} />

            <SubmitButton
              loading={loading}
              disabled={files.length === 0}
              loadingText="Merging..."
            >
              Merge Files
            </SubmitButton>
          </form>
        )}
      </div>
    </div>
  );
};

export default PdfMergerCard;