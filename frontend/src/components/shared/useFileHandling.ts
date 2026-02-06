import { useState, useCallback } from 'react';

interface UseDragDropOptions {
  onFilesDropped: (files: FileList) => void;
  validateFile?: (file: File) => boolean;
}

export const useDragDrop = ({ onFilesDropped, validateFile }: UseDragDropOptions) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (validateFile) {
        const validFiles = Array.from(e.dataTransfer.files).filter(validateFile);
        if (validFiles.length > 0) {
          const dt = new DataTransfer();
          validFiles.forEach(file => dt.items.add(file));
          onFilesDropped(dt.files);
        }
      } else {
        onFilesDropped(e.dataTransfer.files);
      }
    }
  }, [onFilesDropped, validateFile]);

  return {
    isDragActive,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
};

interface UseFileUploadOptions {
  maxFiles?: number;
  acceptedTypes?: string[];
  onError?: (message: string) => void;
}

export const useFileUpload = (options: UseFileUploadOptions = {}) => {
  const { maxFiles = 1, acceptedTypes, onError } = options;
  const [files, setFiles] = useState<File[]>([]);

  const validateFile = useCallback((file: File): boolean => {
    if (acceptedTypes && acceptedTypes.length > 0) {
      const isValidType = acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.replace('/*', '/'));
        }
        return file.type === type || file.name.toLowerCase().endsWith(type.replace('.', ''));
      });
      if (!isValidType) {
        onError?.(`Invalid file type: ${file.name}`);
        return false;
      }
    }
    return true;
  }, [acceptedTypes, onError]);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const validFiles = fileArray.filter(validateFile);

    setFiles(prev => {
      const combined = [...prev, ...validFiles];
      if (combined.length > maxFiles) {
        onError?.(`Maximum ${maxFiles} file${maxFiles !== 1 ? 's' : ''} allowed`);
        return combined.slice(0, maxFiles);
      }
      return combined;
    });
  }, [maxFiles, validateFile, onError]);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  const moveFile = useCallback((fromIndex: number, toIndex: number) => {
    setFiles(prev => {
      if (toIndex < 0 || toIndex >= prev.length) return prev;
      const newFiles = [...prev];
      const [removed] = newFiles.splice(fromIndex, 1);
      newFiles.splice(toIndex, 0, removed);
      return newFiles;
    });
  }, []);

  return {
    files,
    file: files[0] || null,
    addFiles,
    removeFile,
    clearFiles,
    moveFile,
    setFiles,
    hasFiles: files.length > 0,
    fileCount: files.length,
  };
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const getFileNameWithoutExtension = (filename: string): string => {
  return filename.split('.').slice(0, -1).join('.') || filename;
};
