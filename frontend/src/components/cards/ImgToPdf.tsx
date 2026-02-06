import React, { useState, useCallback } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { buildApiUrl } from '../../lib/api';
import { FileDropZone } from '../shared/FileDropZone';
import { CardHeader, SubmitButton, FileList } from '../shared/CardComponents';
import { useDragDrop, downloadBlob } from '../shared/useFileHandling';

const MAX_FILES = 20;

const ImgToPdfCard: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const handleFilesSelected = useCallback((fileList: FileList) => {
    const newFiles = Array.from(fileList).filter(file => file.type.startsWith('image/'));
    
    if (newFiles.length !== fileList.length) {
      toast.error('Only image files are allowed');
    }

    if (files.length + newFiles.length > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} images allowed`);
      const allowedCount = MAX_FILES - files.length;
      setFiles(prev => [...prev, ...newFiles.slice(0, allowedCount)]);
      return;
    }

    setFiles(prev => [...prev, ...newFiles]);
    toast.success(`${newFiles.length} image${newFiles.length !== 1 ? 's' : ''} added`);
  }, [files.length]);

  const validateFile = useCallback((file: File) => {
    return file.type.startsWith('image/');
  }, []);

  const { isDragActive, handleDragOver, handleDragLeave, handleDrop } = useDragDrop({
    onFilesDropped: handleFilesSelected,
    validateFile,
  });

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    toast.success('Image removed');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (files.length === 0) {
      toast.error('Please upload at least one image');
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

      downloadBlob(res.data, 'converted_images.pdf');
      toast.success('PDF created successfully!');
    } catch (error) {
      toast.error('Failed to create PDF');
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
          title="Images to PDF"
          description="Combine multiple images into a single PDF document"
        />

        <form onSubmit={handleSubmit}>
          <FileDropZone
            onFilesSelected={handleFilesSelected}
            accept="image/*"
            multiple
            isDragActive={isDragActive}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            label={`Select images (max ${MAX_FILES})`}
            hint="PNG, JPG, JPEG, etc."
            selectedFileCount={files.length > 0 ? files.length : undefined}
          />

          <FileList files={files} onRemove={removeFile} maxFiles={MAX_FILES} />

          <SubmitButton
            loading={loading}
            disabled={files.length === 0}
            loadingText="Creating PDF..."
          >
            Create PDF
          </SubmitButton>
        </form>
      </div>
    </div>
  );
};

export default ImgToPdfCard;