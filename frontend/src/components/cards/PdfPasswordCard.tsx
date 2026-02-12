import React, { useState, useCallback } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { BiChevronDown, BiChevronUp, BiLock, BiLockOpen } from 'react-icons/bi';
import { buildApiUrl } from '../../lib/api';
import { FileDropZone } from '../shared/FileDropZone';
import { SubmitButton } from '../shared/CardComponents';
import { useDragDrop, downloadBlob } from '../shared/useFileHandling';

type Action = 'add' | 'remove';

const PdfPasswordCard: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [action, setAction] = useState<Action>('add');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const handleFileSelected = useCallback((fileList: FileList) => {
    const selectedFile = fileList[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      toast.success('PDF file selected');
    } else {
      toast.error('Please select a PDF file');
    }
  }, []);

  const validateFile = useCallback((file: File) => {
    return file.type === 'application/pdf';
  }, []);

  const { isDragActive, handleDragOver, handleDragLeave, handleDrop } = useDragDrop({
    onFilesDropped: handleFileSelected,
    validateFile,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast.error('Please select a PDF file');
      return;
    }

    if (!password) {
      toast.error('Please enter a password');
      return;
    }

    if (action === 'add' && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('action', action);
    formData.append('password', password);

    try {
      const res = await axios.post<Blob>(buildApiUrl('/pdf-password/'), formData, {
        responseType: 'blob',
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const prefix = action === 'add' ? 'protected' : 'unprotected';
      downloadBlob(res.data, `${prefix}_${file.name}`);
      toast.success(
        action === 'add' 
          ? 'PDF password protected successfully!' 
          : 'Password removed successfully!'
      );
      
      // Reset form
      setFile(null);
      setPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        const blob = error.response.data;
        const text = await blob.text();
        try {
          const json = JSON.parse(text);
          toast.error(json.detail || 'Operation failed');
        } catch {
          toast.error('Operation failed');
        }
      } else {
        toast.error('Operation failed');
      }
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
                PDF Password Protect
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm text-left">
                Add or remove password protection from PDFs
              </p>
            </div>
            <span className="text-slate-400 group-hover:text-indigo-500 transition-colors">
              {isExpanded ? <BiChevronUp size={24} /> : <BiChevronDown size={24} />}
            </span>
          </button>
        </div>

        {isExpanded && (
          <form onSubmit={handleSubmit} className="mt-4">
            {/* Action Toggle */}
            <div className="flex mb-6 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
              <button
                type="button"
                onClick={() => {
                  setAction('add');
                  setPassword('');
                  setConfirmPassword('');
                }}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md
                  transition-all duration-200 font-medium text-sm
                  ${action === 'add'
                    ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }
                `}
              >
                <BiLock size={18} />
                Add Password
              </button>
              <button
                type="button"
                onClick={() => {
                  setAction('remove');
                  setPassword('');
                  setConfirmPassword('');
                }}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md
                  transition-all duration-200 font-medium text-sm
                  ${action === 'remove'
                    ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }
                `}
              >
                <BiLockOpen size={18} />
                Remove Password
              </button>
            </div>

            <FileDropZone
              onFilesSelected={handleFileSelected}
              accept=".pdf,application/pdf"
              multiple={false}
              isDragActive={isDragActive}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              label="Select PDF file"
              hint="PDF files only"
              selectedFileName={file?.name}
            />

            {/* Password Input */}
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {action === 'add' ? 'New Password' : 'Current Password'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={action === 'add' ? 'Enter new password' : 'Enter current password'}
                  className="
                    w-full px-4 py-2.5 rounded-lg
                    border border-slate-300 dark:border-slate-600
                    bg-white dark:bg-slate-700
                    text-slate-900 dark:text-slate-100
                    placeholder-slate-400 dark:placeholder-slate-500
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                    transition-all duration-200
                  "
                />
              </div>

              {action === 'add' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="
                      w-full px-4 py-2.5 rounded-lg
                      border border-slate-300 dark:border-slate-600
                      bg-white dark:bg-slate-700
                      text-slate-900 dark:text-slate-100
                      placeholder-slate-400 dark:placeholder-slate-500
                      focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                      transition-all duration-200
                    "
                  />
                </div>
              )}
            </div>

            <SubmitButton
              loading={loading}
              disabled={!file || !password || (action === 'add' && !confirmPassword)}
              loadingText={action === 'add' ? 'Protecting...' : 'Removing...'}
            >
              {action === 'add' ? (
                <>
                  <BiLock size={18} />
                  Protect PDF
                </>
              ) : (
                <>
                  <BiLockOpen size={18} />
                  Remove Protection
                </>
              )}
            </SubmitButton>
          </form>
        )}
      </div>
    </div>
  );
};

export default PdfPasswordCard;
