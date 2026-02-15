import React, { useState, useCallback } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { buildApiUrl } from '../../lib/api';
import { FileDropZone } from '../shared/FileDropZone';
import { CardHeader, SubmitButton } from '../shared/CardComponents';
import { useDragDrop, downloadBlob, getFileNameWithoutExtension } from '../shared/useFileHandling';

const ConvertCardIco: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleFilesSelected = useCallback((files: FileList) => {
    const selectedFile = files[0];
    if (selectedFile) {
      setFile(selectedFile);
      toast.success(`Selected: ${selectedFile.name}`);
    }
  }, []);

  const validateFile = useCallback((file: File) => {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    const validExtensions = ['.png', '.jpg', '.jpeg'];
    const hasValidType = validTypes.includes(file.type);
    const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    return hasValidType || hasValidExt;
  }, []);

  const { isDragActive, handleDragOver, handleDragLeave, handleDrop } = useDragDrop({
    onFilesDropped: handleFilesSelected,
    validateFile,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast.error('Please upload an image (PNG, JPG)');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post<Blob>(buildApiUrl('/convert-ico/'), formData, {
        responseType: 'blob',
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const baseName = getFileNameWithoutExtension(file.name);
      downloadBlob(res.data, `${baseName}.ico`);
      toast.success('Converted to ICO successfully!');
    } catch (error) {
      toast.error('Failed to convert image. Please try a different file.');
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
          title="Image to ICO Converter"
          description="Convert PNG/JPG images to ICO format for icons"
        />

        <form onSubmit={handleSubmit}>
          <FileDropZone
            onFilesSelected={handleFilesSelected}
            accept=".png,.jpg,.jpeg"
            isDragActive={isDragActive}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            label="Select an image"
            hint="PNG or JPG format"
            selectedFileName={file?.name}
          />

          <SubmitButton loading={loading} disabled={!file} loadingText="Converting...">
            Convert to ICO
          </SubmitButton>
        </form>
      </div>
    </div>
  );
};

export default ConvertCardIco; 