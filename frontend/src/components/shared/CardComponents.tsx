import React, { useState } from 'react';
import { BiChevronUp } from 'react-icons/bi';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <svg
      aria-hidden="true"
      className={`animate-spin text-gray-200 dark:text-gray-600 fill-indigo-500 ${sizeClasses[size]} ${className}`}
      viewBox="0 0 100 101"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
        fill="currentColor"
      />
      <path
        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
        fill="currentFill"
      />
    </svg>
  );
};

interface SubmitButtonProps {
  loading: boolean;
  disabled?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  className?: string;
  type?: 'button' | 'submit';
  onClick?: () => void;
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({
  loading,
  disabled = false,
  loadingText = 'Processing...',
  children,
  className = '',
  type = 'submit',
  onClick,
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      className={`
        flex items-center justify-center gap-2
        px-6 py-3 mt-4 rounded-xl
        bg-gradient-to-r from-indigo-500 to-indigo-600 
        text-white font-semibold
        shadow-lg shadow-indigo-500/25
        transition-all duration-300
        ${loading || disabled 
          ? 'opacity-60 cursor-not-allowed' 
          : 'hover:from-indigo-600 hover:to-indigo-700 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:scale-[0.98]'
        }
        ${className}
      `}
    >
      {loading ? (
        <>
          <LoadingSpinner size="sm" />
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  gradient?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  children?: React.ReactNode;
  icon?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  description,
  gradient = 'from-indigo-500 to-blue-500',
  collapsible = false,
  defaultExpanded = true,
  children,
  icon,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  const desc = subtitle || description;

  if (!collapsible) {
    return (
      <div className="mb-6 space-y-2">
        <div className="flex items-center gap-3">
          {icon && (
            <div className={`p-2 rounded-xl bg-gradient-to-br ${gradient} text-white`}>
              {icon}
            </div>
          )}
          <div>
            <h2 className={`text-2xl md:text-3xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
              {title}
            </h2>
            {desc && (
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                {desc}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="
          w-full flex items-center justify-between
          p-4 -m-4 mb-0
          rounded-xl
          bg-transparent
          hover:bg-slate-100/50 dark:hover:bg-slate-800/50
          transition-all duration-200
          group cursor-pointer
        "
      >
        <div className="flex items-center gap-3 text-left">
          {icon && (
            <div className={`
              p-2.5 rounded-xl 
              bg-gradient-to-br ${gradient} 
              text-white shadow-lg
              group-hover:scale-105 transition-transform
            `}>
              {icon}
            </div>
          )}
          <div>
            <h2 className={`text-xl md:text-2xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
              {title}
            </h2>
            {desc && (
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
                {desc}
              </p>
            )}
          </div>
        </div>
        <span className={`
          text-slate-400 
          group-hover:text-indigo-500 
          transition-all duration-300
          ${isExpanded ? 'rotate-0' : 'rotate-180'}
        `}>
          <BiChevronUp size={28} />
        </span>
      </button>

      <div className={`
        overflow-hidden transition-all duration-300 ease-in-out
        ${isExpanded ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'}
      `}>
        {children}
      </div>
    </div>
  );
};

interface CollapsibleCardProps {
  title: string;
  subtitle?: string;
  gradient?: string;
  icon?: React.ReactNode;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

export const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  title,
  subtitle,
  gradient = 'from-indigo-500 to-blue-500',
  icon,
  defaultExpanded = false,
  children,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="card-cont">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="
          w-full flex items-center justify-between
          bg-transparent border-none p-0
          focus:outline-none cursor-pointer
          group
        "
      >
        <div className="flex items-center gap-3 text-left">
          {icon && (
            <div className={`
              p-2.5 rounded-xl 
              bg-gradient-to-br ${gradient} 
              text-white shadow-lg shadow-indigo-500/20
              group-hover:scale-105 group-hover:shadow-xl
              transition-all duration-300
            `}>
              {icon}
            </div>
          )}
          <div>
            <h2 className={`text-xl md:text-2xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
              {title}
            </h2>
            {subtitle && (
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className={`
          p-2 rounded-full
          bg-slate-100 dark:bg-slate-800
          text-slate-400 
          group-hover:text-indigo-500 
          group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30
          transition-all duration-300
          ${isExpanded ? '' : 'rotate-180'}
        `}>
          <BiChevronUp size={24} />
        </div>
      </button>

      <div className={`
        overflow-hidden transition-all duration-300 ease-in-out
        ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}
      `}>
        <div className="pt-6 border-t border-slate-200/50 dark:border-slate-700/50 mt-4">
          {children}
        </div>
      </div>
    </div>
  );
};

interface FileListProps {
  files: File[];
  onRemove: (index: number) => void;
  maxFiles?: number;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  onRemove,
  maxFiles = 20,
}) => {
  if (files.length === 0) return null;

  return (
    <div className="mt-5 mb-5">
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Selected Files
        </label>
        <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-medium">
          {files.length}/{maxFiles}
        </span>
      </div>
      <div className="max-h-48 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
        {files.map((file, index) => (
          <div
            key={`${file.name}-${index}`}
            className="
              flex justify-between items-center 
              p-3 
              bg-white dark:bg-slate-700/50 
              rounded-lg 
              border border-slate-200 dark:border-slate-600
              hover:border-indigo-300 dark:hover:border-indigo-500/50
              hover:shadow-sm
              transition-all duration-200
              group
            "
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="min-w-0">
                <span className="block truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                  {file.name}
                </span>
                <span className="text-xs text-slate-400">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="
                ml-2 w-8 h-8 flex items-center justify-center
                text-slate-400 
                hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30
                rounded-lg
                opacity-0 group-hover:opacity-100
                transition-all duration-200
              "
              aria-label={`Remove ${file.name}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default { LoadingSpinner, SubmitButton, CardHeader, CollapsibleCard, FileList };
