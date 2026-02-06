import React, { useState, useCallback } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { buildApiUrl } from '../../lib/api';
import { FileDropZone } from '../shared/FileDropZone';
import { CardHeader, SubmitButton } from '../shared/CardComponents';
import { useDragDrop, downloadBlob } from '../shared/useFileHandling';

const CompressCard: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [nColors, setNColors] = useState<number>(4);
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
    return validTypes.includes(file.type);
  }, []);

  const { isDragActive, handleDragOver, handleDragLeave, handleDrop } = useDragDrop({
    onFilesDropped: handleFilesSelected,
    validateFile,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast.error('Please upload an image (JPG, PNG)');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('n_colors', nColors.toString());
    formData.append('file', file);

    try {
      const res = await axios.post<Blob>(buildApiUrl('/compress_image/'), formData, {
        responseType: 'blob',
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      downloadBlob(res.data, `compressed-${file.name}`);
      toast.success('Image compressed successfully!');
    } catch (error) {
      toast.error('Failed to compress image');
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
          title="KOK Image Compressor"
          description="AI-powered color reduction using KMeans clustering"
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
            hint="PNG or JPG (recommended: under 2MB)"
            selectedFileName={file?.name}
          />

          <div className="flex flex-col mt-5">
            <label htmlFor="n_colors" className="text-lg font-light mb-2">
              Number of Colors
            </label>
            <input
              id="n_colors"
              type="number"
              value={nColors}
              min={2}
              max={256}
              onChange={(e) => setNColors(Math.max(2, Math.min(256, parseInt(e.target.value) || 4)))}
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
              Lower values = smaller file size, fewer colors (2-256)
            </p>
          </div>

          <SubmitButton loading={loading} disabled={!file} loadingText="Compressing...">
            Compress Image
          </SubmitButton>
        </form>
      </div>
    </div>
  );
};

export default CompressCard;
