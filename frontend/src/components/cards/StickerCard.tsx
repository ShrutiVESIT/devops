import React, { useMemo, useState, useCallback } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { buildApiUrl } from '../../lib/api';
import { FileDropZone } from '../shared/FileDropZone';
import { SubmitButton, CardHeader } from '../shared/CardComponents';
import { useDragDrop, downloadBlob } from '../shared/useFileHandling';

type MediaKind = 'image' | 'video' | 'audio';

interface QueuedMedia {
  id: string;
  file: File;
  kind: MediaKind;
}

const MIME_KIND_MAP: Record<string, MediaKind> = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'image/jpg': 'image',
  'video/mp4': 'video',
  'video/quicktime': 'video',
  'video/webm': 'video',
  'audio/mpeg': 'audio',
  'audio/mp3': 'audio',
  'audio/wav': 'audio',
  'audio/x-wav': 'audio',
  'audio/ogg': 'audio',
  'audio/x-m4a': 'audio',
};

const EXTENSION_KIND_MAP: Record<string, MediaKind> = {
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  webp: 'image',
  mp4: 'video',
  mov: 'video',
  mkv: 'video',
  webm: 'video',
  mp3: 'audio',
  wav: 'audio',
  m4a: 'audio',
  ogg: 'audio',
};

const generateId = (): string =>
  crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 10);

const classifyFile = (file: File): MediaKind | null => {
  const mime = file.type?.toLowerCase();
  if (mime && MIME_KIND_MAP[mime]) return MIME_KIND_MAP[mime];

  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext && EXTENSION_KIND_MAP[ext]) return EXTENSION_KIND_MAP[ext];

  return null;
};

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const StickerCard: React.FC = () => {
  const [queue, setQueue] = useState<QueuedMedia[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedItem = useMemo(() => {
    if (queue.length === 0) return null;
    return queue.find((item) => item.id === selectedId) ?? queue[0];
  }, [queue, selectedId]);

  const handleFilesSelected = useCallback((files: FileList) => {
    const additions: QueuedMedia[] = [];

    Array.from(files).forEach((file) => {
      const kind = classifyFile(file);
      if (!kind) {
        toast.error(`${file.name} is not a supported media type.`);
        return;
      }
      additions.push({ id: generateId(), file, kind });
    });

    if (additions.length) {
      setQueue((prev) => [...prev, ...additions]);
      setSelectedId((prev) => prev ?? additions[0].id);
      toast.success(`${additions.length} file${additions.length > 1 ? 's' : ''} added.`);
    }
  }, []);

  const validateFile = useCallback((file: File) => classifyFile(file) !== null, []);

  const { isDragActive, handleDragOver, handleDragLeave, handleDrop } = useDragDrop({
    onFilesDropped: handleFilesSelected,
    validateFile,
  });

  const removeItem = useCallback((id: string) => {
    setQueue((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      if (updated.length === 0) {
        setSelectedId(null);
      } else if (selectedId === id) {
        setSelectedId(updated[0].id);
      }
      return updated;
    });
  }, [selectedId]);

  const moveItem = useCallback((index: number, direction: number) => {
    setQueue((prev) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      
      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setSelectedId(null);
  }, []);

  const handleDownload = async () => {
    if (!selectedItem) {
      toast.error('Add a file to generate a sticker.');
      return;
    }

    const formData = new FormData();
    formData.append('media', selectedItem.file);

    setIsSubmitting(true);
    try {
      const response = await axios.post<Blob>(buildApiUrl('/stickers/whatsapp'), formData, {
        responseType: 'blob',
      });

      const contentType = response.headers['content-type'] || '';
      const isAudio = contentType.includes('audio');
      const extension = isAudio ? '.mp3' : '.webp';
      const baseName = selectedItem.file.name.replace(/\.[^/.]+$/, '');
      
      downloadBlob(response.data, `${baseName}${extension}`);
      toast.success('Download ready!');
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.detail as string) || 'Failed to generate sticker.'
        : 'Failed to generate sticker.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="text-left poppins-regular">
      <Toaster position="top-right" />
      <div className="card-cont">
        <CardHeader
          title="WhatsApp Sticker Forge"
          subtitle="Convert images (auto square crop), short videos, or audio snippets into WhatsApp-ready files."
          gradient="from-emerald-400 to-green-600"
        />

        <FileDropZone
          onFilesSelected={handleFilesSelected}
          accept="image/*,video/*,audio/*"
          multiple
          isDragActive={isDragActive}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          label="Drop files here or browse"
          hint="Images auto-crop to 512×512. Videos ≤6s. Audio trims to first 15s."
        />

        {queue.length > 0 && (
          <MediaQueue
            queue={queue}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onRemove={removeItem}
            onMove={moveItem}
            onClear={clearQueue}
          />
        )}

        <div className="mt-8 flex flex-col gap-3">
          <SubmitButton
            loading={isSubmitting}
            disabled={!selectedItem}
            loadingText="Processing…"
            className="bg-green-500 hover:bg-green-600"
          >
            Download Sticker
          </SubmitButton>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Files remain on your device—only the selected media is uploaded on demand for processing.
          </p>
        </div>
      </div>
    </div>
  );
};

interface MediaQueueProps {
  queue: QueuedMedia[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onMove: (index: number, direction: number) => void;
  onClear: () => void;
}

const MediaQueue: React.FC<MediaQueueProps> = ({
  queue,
  selectedId,
  onSelect,
  onRemove,
  onMove,
  onClear,
}) => (
  <div className="mt-6 space-y-4">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold">Queue</h3>
      <button
        type="button"
        className="text-sm text-red-400 hover:text-red-500"
        onClick={onClear}
      >
        Clear all
      </button>
    </div>
    <ul className="space-y-3 max-h-64 overflow-y-auto pr-1">
      {queue.map((item, index) => (
        <MediaQueueItem
          key={item.id}
          item={item}
          index={index}
          isSelected={selectedId === item.id}
          isFirst={index === 0}
          isLast={index === queue.length - 1}
          onSelect={onSelect}
          onRemove={onRemove}
          onMove={onMove}
        />
      ))}
    </ul>
  </div>
);

interface MediaQueueItemProps {
  item: QueuedMedia;
  index: number;
  isSelected: boolean;
  isFirst: boolean;
  isLast: boolean;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onMove: (index: number, direction: number) => void;
}

const MediaQueueItem: React.FC<MediaQueueItemProps> = ({
  item,
  index,
  isSelected,
  isFirst,
  isLast,
  onSelect,
  onRemove,
  onMove,
}) => (
  <li
    className={`flex items-center justify-between rounded-xl border p-3 text-sm transition-colors ${
      isSelected
        ? 'border-green-400 bg-green-50/50 dark:bg-green-500/10'
        : 'border-slate-200 dark:border-slate-700'
    }`}
  >
    <button
      type="button"
      className="flex-1 text-left"
      onClick={() => onSelect(item.id)}
    >
      <p className="font-medium truncate">{item.file.name}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {item.kind.toUpperCase()} · {formatSize(item.file.size)}
      </p>
    </button>
    <div className="flex items-center gap-2 ml-3">
      <button
        type="button"
        className="px-2 py-1 text-xs rounded-md border border-slate-300 dark:border-slate-600 disabled:opacity-40"
        onClick={() => onMove(index, -1)}
        disabled={isFirst}
      >
        ↑
      </button>
      <button
        type="button"
        className="px-2 py-1 text-xs rounded-md border border-slate-300 dark:border-slate-600 disabled:opacity-40"
        onClick={() => onMove(index, 1)}
        disabled={isLast}
      >
        ↓
      </button>
      <button
        type="button"
        className="px-2 py-1 text-xs rounded-md border border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
        onClick={() => onRemove(item.id)}
      >
        ✕
      </button>
    </div>
  </li>
);

export default StickerCard;
