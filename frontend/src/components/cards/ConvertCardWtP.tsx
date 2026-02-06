import React, { useState, useCallback } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { buildApiUrl } from '../../lib/api';
import { FileDropZone } from '../shared/FileDropZone';
import { CardHeader, SubmitButton } from '../shared/CardComponents';
import { useDragDrop, downloadBlob, getFileNameWithoutExtension } from '../shared/useFileHandling';

const ConvertCardWtP: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleFilesSelected = useCallback((files: FileList) => {
    const selectedFile = files[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'image/webp' && !selectedFile.name.toLowerCase().endsWith('.webp')) {
      toast.error('Please select a valid WebP file');
      return;
    }

    setFile(selectedFile);
    toast.success(`Selected: ${selectedFile.name}`);
  }, []);

  const validateFile = useCallback((file: File) => {
    return file.type === 'image/webp' || file.name.toLowerCase().endsWith('.webp');
  }, []);

  const { isDragActive, handleDragOver, handleDragLeave, handleDrop } = useDragDrop({
    onFilesDropped: handleFilesSelected,
    validateFile,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast.error('Please upload a WebP file');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post<Blob>(buildApiUrl('/convert/webp-to-png'), formData, {
        responseType: 'blob',
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const baseName = getFileNameWithoutExtension(file.name);
      downloadBlob(res.data, `${baseName}.png`);
      toast.success('Converted to PNG successfully!');
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || 'Failed to convert file'
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
          title="WebP to PNG Converter"
          description="Convert WebP images to PNG format"
        />

        <form onSubmit={handleSubmit}>
          <FileDropZone
            onFilesSelected={handleFilesSelected}
            accept=".webp"
            isDragActive={isDragActive}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            label="Select a WebP file"
            hint="WebP format only"
            selectedFileName={file?.name}
          />

          <SubmitButton loading={loading} disabled={!file} loadingText="Converting...">
            Convert to PNG
          </SubmitButton>
        </form>
      </div>
    </div>
  );
};

export default ConvertCardWtP;
