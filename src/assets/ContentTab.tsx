import React, { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, rectSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type {
  Company,
  Product,
  ContentType,
  ContentAction,
  DeleteOption,
  VideoItem,
  ImageItem,
  ExistingContent,
} from './types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.thewordofmouth.in/api';
const IMAGE_API_BASE_URL = `${API_BASE_URL}/image`;
const VIDEO_API_BASE_URL = `${API_BASE_URL}/video`;
const VIDEO_CHUNK_SIZE = 512 * 1024;
const VIDEO_MAX_BYTES = 100 * 1024 * 1024;
const IMAGE_MAX_BYTES = 50 * 1024 * 1024;

const DISPLAY_LOCATION_OPTIONS = [
  { value: 'homepage', label: 'Homepage' },
  { value: 'product_page', label: 'Product page' },
  { value: 'review_section', label: 'Review section' },
] as const;

interface SortableCompanyVideoCardProps {
  video: VideoItem;
  onDelete: (id: string, filename: string) => void;
  disabled: boolean;
}
function SortableCompanyVideoCard({ video, onDelete, disabled }: SortableCompanyVideoCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: video.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-950 shadow-sm transition-all hover:shadow-md ${isDragging ? 'opacity-60 shadow-lg z-50 scale-[1.02]' : ''}`}
    >
      <div className="relative w-full cursor-grab active:cursor-grabbing group" style={{ paddingBottom: '56.25%' }} {...attributes} {...listeners}>
        <video src={video.url} className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none" controls controlsList="nodownload" playsInline preload="metadata" />
        <div className="absolute top-3 left-3 p-1.5 rounded-xl bg-slate-900/60 text-white backdrop-blur-md hover:bg-slate-900/80 transition-colors pointer-events-auto">
          <span className="material-symbols-outlined !text-[20px]">drag_indicator</span>
        </div>
      </div>
      <div className="p-4 bg-white dark:bg-slate-900">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate" title={video.filename}>{video.filename}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
          <span className="material-symbols-outlined !text-[14px]">calendar_today</span>
          {video.uploaded_at ? new Date(video.uploaded_at).toLocaleDateString() : 'N/A'}
        </p>
        {video.display_locations && video.display_locations.length > 0 && (
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {video.display_locations.map((loc, i) => (
              <span key={i} className="text-[10px] uppercase tracking-wider font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/30 px-2 py-0.5 rounded-md">{loc.replace(/_/g, ' ')}</span>
            ))}
          </div>
        )}
        <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60">
          <button onClick={() => onDelete(video.id, video.filename)} disabled={disabled} className="w-full bg-red-50 dark:bg-red-950/20 hover:bg-red-600 hover:text-white dark:hover:bg-red-900 text-red-650 dark:text-red-400 font-bold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 border border-red-100 dark:border-red-900/40 text-sm cursor-pointer" title="Delete video">
            <span className="material-symbols-outlined !text-[18px]">delete</span> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

interface SortableProductVideoCardProps {
  video: VideoItem;
  productId: string;
  onDelete: (id: string, filename: string, productId: string) => void;
  disabled: boolean;
  editingDisplayVideo: { videoId: string; productId: string | null } | null;
  editingDisplayLocations: string[];
  onEditDisplayLocations: (video: VideoItem, productId: string) => void;
  onCancelEditDisplayLocations: () => void;
  onSaveDisplayLocations: () => void;
  displayLocationsSaving: boolean;
  setEditingDisplayLocations: React.Dispatch<React.SetStateAction<string[]>>;
}
function SortableProductVideoCard({
  video,
  productId,
  onDelete,
  disabled,
  editingDisplayVideo,
  editingDisplayLocations,
  onEditDisplayLocations,
  onCancelEditDisplayLocations,
  onSaveDisplayLocations,
  displayLocationsSaving,
  setEditingDisplayLocations,
}: SortableProductVideoCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: video.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-950 shadow-sm transition-all hover:shadow-md ${isDragging ? 'opacity-60 shadow-lg z-50 scale-[1.02]' : ''}`}
    >
      <div className="relative w-full cursor-grab active:cursor-grabbing group" style={{ paddingBottom: '56.25%' }} {...attributes} {...listeners}>
        <video src={video.url} className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none" controls controlsList="nodownload" playsInline preload="metadata" />
        <div className="absolute top-3 left-3 p-1.5 rounded-xl bg-slate-900/60 text-white backdrop-blur-md hover:bg-slate-900/80 transition-colors pointer-events-auto">
          <span className="material-symbols-outlined !text-[20px]">drag_indicator</span>
        </div>
      </div>
      <div className="p-4 bg-white dark:bg-slate-900">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate" title={video.filename}>{video.filename}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
          <span className="material-symbols-outlined !text-[14px]">inventory_2</span>
          Product: {productId}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1">
          <span className="material-symbols-outlined !text-[14px]">calendar_today</span>
          {video.uploaded_at ? new Date(video.uploaded_at).toLocaleDateString() : 'N/A'}
        </p>
        {editingDisplayVideo?.videoId === video.id && editingDisplayVideo?.productId === productId ? (
          <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-150 dark:border-slate-800 space-y-3">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Where to show this video</p>
            <div className="space-y-2">
              {DISPLAY_LOCATION_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                  <input type="checkbox" checked={editingDisplayLocations.includes(opt.value)} onChange={(e) => { if (e.target.checked) setEditingDisplayLocations((prev) => [...prev, opt.value]); else setEditingDisplayLocations((prev) => prev.filter((l) => l !== opt.value)); }} className="rounded border-slate-350 dark:border-slate-700 text-[#FF6B35] focus:ring-[#FF6B35]/20" />
                  {opt.label}
                </label>
              ))}
            </div>
            <div className="flex gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button onClick={onSaveDisplayLocations} disabled={displayLocationsSaving || editingDisplayLocations.length === 0} className="flex-1 bg-[#FF6B35] hover:bg-[#E5521C] disabled:opacity-50 text-white font-bold py-2 px-3 rounded-lg text-xs transition-colors cursor-pointer">{displayLocationsSaving ? 'Saving...' : 'Save'}</button>
              <button onClick={onCancelEditDisplayLocations} disabled={displayLocationsSaving} className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-300 font-bold py-2 px-3 rounded-lg text-xs transition-colors cursor-pointer">Cancel</button>
            </div>
          </div>
        ) : (
          <>
            {video.display_locations && video.display_locations.length > 0 && (
              <div className="flex gap-1.5 mt-3 flex-wrap">
                {video.display_locations.map((loc, i) => (
                  <span key={i} className="text-[10px] uppercase tracking-wider font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/30 px-2 py-0.5 rounded-md">{loc.replace(/_/g, ' ')}</span>
                ))}
              </div>
            )}
            <button onClick={() => onEditDisplayLocations(video, productId)} disabled={disabled} className="mt-3 w-full bg-slate-50 dark:bg-slate-850 hover:bg-[#FF6B35]/10 hover:text-[#FF6B35] dark:hover:bg-[#FF6B35]/20 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800 font-bold py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer" title="Edit where this video is shown">
              <span className="material-symbols-outlined !text-[16px]">edit</span> Edit display
            </button>
          </>
        )}
        <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60">
          <button onClick={() => onDelete(video.id, video.filename, productId)} disabled={disabled} className="w-full bg-red-50 dark:bg-red-950/20 hover:bg-red-600 hover:text-white dark:hover:bg-red-900 text-red-650 dark:text-red-400 font-bold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 border border-red-100 dark:border-red-900/40 text-sm cursor-pointer" title="Delete video">
            <span className="material-symbols-outlined !text-[18px]">delete</span> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export interface VideoCategory {
  slug: string;
  label: string;
}

export interface ContentTabProps {
  userData: { role?: string; company_ids?: string[] } | null;
  companies: Company[];
  products: Product[];
  selectedCompany: string;
  selectedProduct: string;
  loading: boolean;
  error: string;
  success: string;
  setError: (s: string) => void;
  setSuccess: (s: string) => void;
  setLoading: (b: boolean) => void;
  setSelectedCompany: (id: string) => void;
  setSelectedProduct: (id: string) => void;
  isCompanyAutoSelected: boolean;
  renderSearchableCompanyDropdown: (
    disabled: boolean,
    onCompanyChange: (id: string) => void,
    placeholder: string,
    focusRingColor: string,
    useCompanyName?: boolean
  ) => React.ReactNode;
  renderSearchableProductDropdown?: (
    disabled: boolean,
    onProductChange: (id: string) => void,
    placeholder: string,
    focusRingColor: string
  ) => React.ReactNode;
}

const ContentTab: React.FC<ContentTabProps> = ({
  companies,
  products,
  selectedCompany,
  selectedProduct,
  loading,
  error,
  success,
  setError,
  setSuccess,
  setLoading,
  setSelectedCompany,
  setSelectedProduct,
  isCompanyAutoSelected,
  renderSearchableCompanyDropdown,
  renderSearchableProductDropdown = () => null,
}) => {
  const [contentType, setContentType] = useState<ContentType>('review');
  const [whatsappImageScope, setWhatsappImageScope] = useState<'company' | 'product'>('product');
  const [contentAction, setContentAction] = useState<ContentAction>('upload');
  const [deleteOption, setDeleteOption] = useState<DeleteOption>('company');
  const [, setDeleteResult] = useState<{ success: boolean; message: string; deleted_count?: number; videos_deleted?: number } | null>(null);
  const [existingContent, setExistingContent] = useState<ExistingContent | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadInProgress, setUploadInProgress] = useState(false);
  type VideoMeta = { filename: string; s3_url: string; s3_key: string; file_size: number; content_type: string };
  type VideoProgress = { name: string; percent: number; done: boolean; error: string | null; meta: VideoMeta | null };
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [videoUploadProgress, setVideoUploadProgress] = useState<VideoProgress[]>([]);
  const [videoUploadContext, setVideoUploadContext] = useState<{ company_id: string; product_id: string | null; category: string | null } | null>(null);
  const [pendingVideoFinalize, setPendingVideoFinalize] = useState<{ videos: VideoMeta[]; company_id: string; product_id: string | null; category: string | null } | null>(null);
  const [finalizeInProgress, setFinalizeInProgress] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteDialogMessage, setDeleteDialogMessage] = useState('');
  const [imageDeleteDialogOpen, setImageDeleteDialogOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<{ reviewIndex: number; imageId: string } | null>(null);
  const [whatsappImageDeleteDialogOpen, setWhatsappImageDeleteDialogOpen] = useState(false);
  const [whatsappImageToDelete, setWhatsappImageToDelete] = useState<string | null>(null);
  const [companyVideoDeleteDialogOpen, setCompanyVideoDeleteDialogOpen] = useState(false);
  const [companyVideoToDelete, setCompanyVideoToDelete] = useState<{ videoId: string; filename: string } | null>(null);
  const [productVideoDeleteDialogOpen, setProductVideoDeleteDialogOpen] = useState(false);
  const [productVideoToDelete, setProductVideoToDelete] = useState<{ videoId: string; filename: string; productId: string } | null>(null);
  const [editingDisplayVideo, setEditingDisplayVideo] = useState<{ videoId: string; productId: string | null } | null>(null);
  const [editingDisplayLocations, setEditingDisplayLocations] = useState<string[]>([]);
  const [displayLocationsSaving, setDisplayLocationsSaving] = useState(false);
  const [companyVideoCategory, setCompanyVideoCategory] = useState<string>('company_videos');
  const [videoCategories, setVideoCategories] = useState<VideoCategory[]>([]);
  const [videoCategoriesLoading, setVideoCategoriesLoading] = useState(false);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editCategoryOpen, setEditCategoryOpen] = useState(false);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [reorderLoading, setReorderLoading] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    setSuccess('');
    setError('');
  }, [contentType, contentAction, setSuccess, setError]);

  useEffect(() => {
    if (!success && !error) return;
    const timer = setTimeout(() => {
      setSuccess('');
      setError('');
    }, 3000);
    return () => clearTimeout(timer);
  }, [success, error, setSuccess, setError]);

  const fetchVideoCategories = useCallback(async () => {
    if (!selectedCompany) {
      setVideoCategories([]);
      return;
    }
    setVideoCategoriesLoading(true);
    try {
      const res = await fetch(`${VIDEO_API_BASE_URL}/categories?company_id=${encodeURIComponent(selectedCompany)}`);
      const data = await res.json();
      if (data?.success && Array.isArray(data.categories)) {
        setVideoCategories(data.categories);
        const firstSlug = data.categories[0]?.slug || 'company_videos';
        setCompanyVideoCategory((prev) => (data.categories.some((c: VideoCategory) => c.slug === prev) ? prev : firstSlug));
      } else {
        setVideoCategories([{ slug: 'company_videos', label: 'Company Video' }]);
      }
    } catch (err) {
      console.error('Failed to fetch video categories:', err);
      setVideoCategories([{ slug: 'company_videos', label: 'Company Video' }]);
    } finally {
      setVideoCategoriesLoading(false);
    }
  }, [selectedCompany]);

  useEffect(() => {
    if (contentType === 'company-video' && selectedCompany) {
      fetchVideoCategories();
    } else if (contentType === 'company-video' && !selectedCompany) {
      setVideoCategories([]);
    }
  }, [contentType, selectedCompany, fetchVideoCategories]);

  const handleAddCategory = async () => {
    const name = (newCategoryName || '').trim();
    const slug = name.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_').replace(/[^a-z0-9_]/g, '');
    const label = name || slug.replace(/_/g, ' ');
    if (!name || !slug) {
      setError('Please enter a category name');
      return;
    }
    if (!selectedCompany) {
      setError('Please select a company first');
      return;
    }
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${VIDEO_API_BASE_URL}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: selectedCompany, slug, label }),
      });
      const data = await res.json();
      if (data?.success) {
        setSuccess(`Category "${label}" added successfully`);
        setAddCategoryOpen(false);
        setNewCategoryName('');
        await fetchVideoCategories();
        setCompanyVideoCategory(slug);
      } else {
        setError(data?.message || data?.error || 'Failed to add category');
      }
    } catch (err) {
      setError('Failed to add category. Please try again.');
    }
  };

  const handleRenameCategory = async () => {
    const name = (editCategoryName || '').trim();
    if (!name) {
      setError('Please enter a category name');
      return;
    }
    if (!selectedCompany) {
      setError('Please select a company first');
      return;
    }
    if (!companyVideoCategory) {
      setError('Please select a category to rename');
      return;
    }
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${VIDEO_API_BASE_URL}/categories/label`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: selectedCompany, slug: companyVideoCategory, label: name }),
      });
      const data = await res.json();
      if (data?.success) {
        setSuccess(`Category renamed to "${name}"`);
        setEditCategoryOpen(false);
        setEditCategoryName('');
        await fetchVideoCategories();
      } else {
        setError(data?.message || data?.error || 'Failed to rename category');
      }
    } catch (err) {
      setError('Failed to rename category. Please try again.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setSelectedFiles(Array.from(e.target.files));
  };

  const handleFileUpload = () => {
    if (!selectedCompany) {
      setError('Please select a company');
      return;
    }
    if ((contentType === 'review' || (contentType === 'whatsapp' && whatsappImageScope === 'product') || contentType === 'product-video') && !selectedProduct) {
      setError('Please select a product');
      return;
    }
    if (selectedFiles.length === 0) {
      setError('Please select files to upload');
      return;
    }
    const isVideo = contentType === 'company-video' || contentType === 'product-video';
    const maxBytes = isVideo ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES;
    const maxLabel = isVideo ? '100 MB' : '50 MB';
    const oversized = selectedFiles.filter((f) => f.size > maxBytes);
    if (oversized.length > 0) {
      setError(`File(s) ${oversized.map((f) => `"${f.name}"`).join(', ')} exceed ${maxLabel}. Each file must be ${maxLabel} or smaller.`);
      return;
    }
    const files = Array.from(selectedFiles);
    const company = selectedCompany;
    const product = selectedProduct;
    const ct = contentType;
    const fileCount = files.length;
    setError('');
    setSuccess('Uploading in background…');
    setSelectedFiles([]);
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    setUploadInProgress(true);

    (async () => {
      try {
        let response: Response | undefined;
        if (ct === 'review') {
          const formData = new FormData();
          formData.append('company_id', company);
          formData.append('product_id', product);
          files.forEach((f: File) => formData.append('images', f));
          response = await fetch(`${IMAGE_API_BASE_URL}/upload-images`, { method: 'POST', body: formData });
        } else if (ct === 'whatsapp') {
          const formData = new FormData();
          files.forEach((f: File) => formData.append('files', f));
          const uploadUrl = whatsappImageScope === 'company'
            ? `${API_BASE_URL}/whatsapp-images/company/${company}`
            : `${API_BASE_URL}/whatsapp-images/${company}/${product}`;
          response = await fetch(uploadUrl, { method: 'POST', body: formData });
        } else if (ct === 'company-video' || ct === 'product-video') {
          const ctx = {
            company_id: company,
            product_id: ct === 'product-video' ? product : null,
            category: ct === 'company-video' ? companyVideoCategory : null,
          };
          setVideoFiles(prev => [...prev, ...files]);
          setVideoUploadContext(ctx);
          const batchOffset = videoUploadProgress.length;
          setVideoUploadProgress(prev => [...prev, ...files.map((f: File) => ({ name: f.name, percent: 0, done: false, error: null, meta: null }))]);

          const uploadOneVideo = async (file: File, fileIndex: number, updateProgress: (updater: (prev: VideoProgress[]) => VideoProgress[]) => void): Promise<VideoMeta> => {
            const totalChunks = Math.ceil(file.size / VIDEO_CHUNK_SIZE);
            const uploadId = crypto.randomUUID?.() ?? `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            let lastChunkData: VideoMeta | null = null;
            for (let i = 0; i < totalChunks; i++) {
              const start = i * VIDEO_CHUNK_SIZE;
              const end = Math.min(start + VIDEO_CHUNK_SIZE, file.size);
              const chunkForm = new FormData();
              chunkForm.append('upload_id', uploadId);
              chunkForm.append('chunk_index', String(i));
              chunkForm.append('total_chunks', String(totalChunks));
              chunkForm.append('filename', file.name);
              chunkForm.append('company_id', company);
              if (ct === 'product-video') chunkForm.append('product_id', product);
              if (ct === 'company-video') chunkForm.append('category', companyVideoCategory);
              chunkForm.append('chunk', file.slice(start, end), `chunk-${i}`);
              const chunkRes = await fetch(`${VIDEO_API_BASE_URL}/upload-chunk`, { method: 'POST', body: chunkForm });
              if (!chunkRes.ok) {
                const errData = await chunkRes.json().catch(() => ({}));
                throw new Error(errData?.error || `Chunk ${i + 1}/${totalChunks} failed`);
              }
              const chunkData = await chunkRes.json();
              const percent = Math.round(((i + 1) / totalChunks) * 100);
              const isDone = !!chunkData.done;
              updateProgress(prev => prev.map((p, idx) => idx === fileIndex ? { ...p, percent, done: isDone, meta: isDone ? { filename: chunkData.filename, s3_url: chunkData.s3_url, s3_key: chunkData.s3_key, file_size: chunkData.file_size, content_type: chunkData.content_type } : p.meta } : p));
              if (isDone) lastChunkData = { filename: chunkData.filename, s3_url: chunkData.s3_url, s3_key: chunkData.s3_key, file_size: chunkData.file_size, content_type: chunkData.content_type };
            }
            if (!lastChunkData) throw new Error(`No S3 URL returned`);
            return lastChunkData;
          };

          await Promise.allSettled(files.map((f: File, i: number) =>
            uploadOneVideo(f, batchOffset + i, setVideoUploadProgress).catch((err: any) => {
              setVideoUploadProgress(prev => prev.map((p, idx) => idx === batchOffset + i ? { ...p, error: err?.message || 'Upload failed', percent: 0 } : p));
            })
          ));

          setVideoUploadProgress(prev => {
            const succeeded = prev.filter(p => p.done && p.meta).map(p => p.meta!);
            if (succeeded.length > 0) {
              setPendingVideoFinalize(existing => existing
                ? { ...existing, videos: succeeded }
                : { videos: succeeded, ...ctx }
              );
            }
            return prev;
          });

          setSuccess('');
          setUploadInProgress(false);
          return;
        }
        const data = await response?.json();
        if (data?.success) {
          switch (ct) {
            case 'review':
              setSuccess(`Successfully uploaded ${data.total_uploaded || fileCount} review images`);
              break;
            case 'whatsapp':
              setSuccess(`Successfully uploaded ${data.new_images_added || fileCount} WhatsApp images`);
              break;
          }
        } else {
          setError(data?.message || data?.detail || 'Failed to upload');
        }
      } catch (err: any) {
        setError(err?.message || 'Error uploading. Please try again.');
        console.error(err);
        setVideoUploadProgress([]);
      } finally {
        setUploadInProgress(false);
      }
    })();
  };

  const handleFinalizeUpload = async () => {
    if (!pendingVideoFinalize) return;
    setFinalizeInProgress(true);
    try {
      const res = await fetch(`${VIDEO_API_BASE_URL}/finalize-upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pendingVideoFinalize),
      });
      const data = await res.json();
      if (data?.success) {
        setSuccess(`Successfully saved ${data.videos_added || pendingVideoFinalize.videos.length} video(s)`);
        setPendingVideoFinalize(null);
        setVideoUploadProgress([]);
        setVideoFiles([]);
        setVideoUploadContext(null);
      } else {
        setErrorModal(data?.message || data?.error || 'Failed to save videos to database. Please try again.');
      }
    } catch (err) {
      setErrorModal('Network error while saving videos. Please check your connection and try again.');
      console.error(err);
    } finally {
      setFinalizeInProgress(false);
    }
  };

  const handleRetryVideo = async (fileIndex: number) => {
    if (!videoUploadContext) return;
    const file = videoFiles[fileIndex];
    if (!file) return;
    const { company_id, product_id, category } = videoUploadContext;

    setVideoUploadProgress(prev => prev.map((p, idx) => idx === fileIndex ? { ...p, percent: 0, done: false, error: null, meta: null } : p));

    try {
      const totalChunks = Math.ceil(file.size / VIDEO_CHUNK_SIZE);
      const uploadId = crypto.randomUUID?.() ?? `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      let lastChunkData: VideoMeta | null = null;
      for (let i = 0; i < totalChunks; i++) {
        const start = i * VIDEO_CHUNK_SIZE;
        const end = Math.min(start + VIDEO_CHUNK_SIZE, file.size);
        const chunkForm = new FormData();
        chunkForm.append('upload_id', uploadId);
        chunkForm.append('chunk_index', String(i));
        chunkForm.append('total_chunks', String(totalChunks));
        chunkForm.append('filename', file.name);
        chunkForm.append('company_id', company_id);
        if (product_id) chunkForm.append('product_id', product_id);
        if (category) chunkForm.append('category', category);
        chunkForm.append('chunk', file.slice(start, end), `chunk-${i}`);
        const chunkRes = await fetch(`${VIDEO_API_BASE_URL}/upload-chunk`, { method: 'POST', body: chunkForm });
        if (!chunkRes.ok) {
          const errData = await chunkRes.json().catch(() => ({}));
          throw new Error(errData?.error || `Chunk ${i + 1}/${totalChunks} failed`);
        }
        const chunkData = await chunkRes.json();
        const percent = Math.round(((i + 1) / totalChunks) * 100);
        const isDone = !!chunkData.done;
        const meta: VideoMeta | null = isDone ? { filename: chunkData.filename, s3_url: chunkData.s3_url, s3_key: chunkData.s3_key, file_size: chunkData.file_size, content_type: chunkData.content_type } : null;
        setVideoUploadProgress(prev => prev.map((p, idx) => idx === fileIndex ? { ...p, percent, done: isDone, meta: meta ?? p.meta } : p));
        if (isDone) lastChunkData = meta;
      }
      if (!lastChunkData) throw new Error('No S3 URL returned');

      setPendingVideoFinalize(prev => {
        const base = prev ?? { videos: [], company_id, product_id, category };
        const already = base.videos.some(v => v.filename === lastChunkData!.filename && v.s3_key === lastChunkData!.s3_key);
        return already ? base : { ...base, videos: [...base.videos, lastChunkData!] };
      });
    } catch (err: any) {
      setVideoUploadProgress(prev => prev.map((p, idx) => idx === fileIndex ? { ...p, error: err?.message || 'Retry failed', percent: 0 } : p));
    }
  };

  const handleDeleteContent = async () => {
    if (!selectedCompany) {
      setError('Please select a company');
      return;
    }
    if (contentType !== 'company-video' && deleteOption === 'product' && !selectedProduct) {
      setError('Please select a product');
      return;
    }
    if (contentType === 'product-video' && deleteOption === 'product' && !selectedProduct) {
      setError('Please select a product');
      return;
    }
    const contentTypeLabel = contentType === 'review' ? 'Review Images' :
      contentType === 'whatsapp' ? 'WhatsApp Images' :
        contentType === 'company-video'
          ? (videoCategories.find((c) => c.slug === companyVideoCategory)?.label || companyVideoCategory)
          : 'Product Videos';
    const scopeLabel = contentType === 'company-video'
      ? `the selected category for this company`
      : deleteOption === 'company' ? 'all products in this company' : 'the selected product';
    setDeleteDialogMessage(`Are you sure you want to delete all ${contentTypeLabel} for ${scopeLabel}? This action cannot be undone.`);
    setDeleteDialogOpen(true);
  };

  const performDelete = async () => {
    setDeleteDialogOpen(false);
    setError('');
    setSuccess('');
    setDeleteResult(null);
    setLoading(true);
    try {
      let url = '';
      if (contentType === 'review') {
        url = deleteOption === 'company'
          ? `${IMAGE_API_BASE_URL}/delete-by-company/${selectedCompany}`
          : `${IMAGE_API_BASE_URL}/delete-by-product/${selectedCompany}/${selectedProduct}`;
      } else if (contentType === 'whatsapp') {
        url = whatsappImageScope === 'company'
          ? `${API_BASE_URL}/whatsapp-images/company/${selectedCompany}/company-images`
          : `${API_BASE_URL}/whatsapp-images/${selectedCompany}/${selectedProduct}`;
      } else if (contentType === 'company-video') {
        const catParam = companyVideoCategory && companyVideoCategory !== 'company_videos'
          ? `?video_category=${encodeURIComponent(companyVideoCategory)}`
          : '';
        url = `${VIDEO_API_BASE_URL}/delete-videos-by-company/${selectedCompany}${catParam}`;
      } else if (contentType === 'product-video') {
        url = deleteOption === 'company'
          ? `${VIDEO_API_BASE_URL}/delete-all-product-videos-by-company/${selectedCompany}`
          : `${VIDEO_API_BASE_URL}/delete-videos-by-company/${selectedCompany}?product_id=${selectedProduct}`;
      }
      const response = await fetch(url, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        setDeleteResult(data);
        let successMsg = '';
        if (contentType === 'review') successMsg = data.message || `Successfully deleted ${data.deleted_images_count ?? data.deleted_count ?? 0} review images`;
        else if (contentType === 'whatsapp') successMsg = `Successfully deleted ${data.total_images_deleted || data.deleted_count || 0} WhatsApp images`;
        else if (contentType === 'company-video' || contentType === 'product-video') successMsg = `Successfully deleted ${data.videos_deleted || data.deleted_count || 0} videos`;
        setSuccess(successMsg || data.message);
      } else {
        setError(data.message || data.detail || 'Delete failed');
      }
    } catch (err) {
      setError('Error deleting content. Please try again.');
      console.error('Delete error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingContent = async (silent = false) => {
    if (!selectedCompany) {
      setError('Please select a company');
      return;
    }
    if ((contentType === 'review' || (contentType === 'whatsapp' && whatsappImageScope === 'product') || contentType === 'product-video') && !selectedProduct) {
      setError('Please select a product');
      return;
    }
    if (!silent) {
      setError('');
      setSuccess('');
    }
    setExistingContent(null);
    setViewLoading(true);
    try {
      let url = '';
      let response: Response | undefined;
      if (contentType === 'review') {
        url = `${IMAGE_API_BASE_URL}/image-stats/product/${selectedCompany}/${selectedProduct}`;
        response = await fetch(url);
      } else if (contentType === 'whatsapp') {
        url = whatsappImageScope === 'company'
          ? `${API_BASE_URL}/whatsapp-images/${selectedCompany}`
          : `${API_BASE_URL}/whatsapp-images/${selectedCompany}/${selectedProduct}`;
        response = await fetch(url);
      } else if (contentType === 'company-video') {
        const q = companyVideoCategory !== 'company_videos' ? `?category=${encodeURIComponent(companyVideoCategory)}` : '';
        url = `${VIDEO_API_BASE_URL}/videos/${selectedCompany}${q}`;
        response = await fetch(url);
      } else if (contentType === 'product-video') {
        url = `${VIDEO_API_BASE_URL}/videos/${selectedCompany}?product_id=${selectedProduct}`;
        response = await fetch(url);
      }
      if (!response || !response.ok) {
        const errorData = await response?.json().catch(() => ({}));
        setError(errorData?.message || errorData?.detail || `Failed to fetch content: ${response?.status || 'Unknown error'}`);
        return;
      }
      const data = await response.json();
      if (data?.success) {
        if (contentType === 'company-video') {
          const field = companyVideoCategory;
          const videos = data[field] || [];
          const totalKey = `total_${field}`;
          const total = data[totalKey] ?? videos.length;
          setExistingContent({
            company_videos: videos,
            product_videos: {},
            total_count: total,
          });
          if (!silent) setSuccess(`Found ${total} ${field.replace(/_/g, ' ')}`);
        } else if (contentType === 'product-video') {
          setExistingContent({
            company_videos: [],
            product_videos: { [selectedProduct]: data.videos || [] },
            total_count: data.total_videos || 0,
          });
          if (!silent) setSuccess(`Found ${data.total_videos || 0} product videos`);
        } else if (contentType === 'review') {
          const imageItems: ImageItem[] = (data.images || []).map((img: { review_index: number; image_id: string; s3_url: string; filename?: string }) => ({
            review_index: img.review_index,
            image_id: img.image_id,
            s3_url: img.s3_url,
            filename: img.filename,
          })).filter((img: ImageItem) => img.s3_url);
          setExistingContent({ images: imageItems, total_count: data.total_images || imageItems.length || 0 });
          if (!silent) setSuccess(`Found ${data.total_images || imageItems.length || 0} review images`);
        } else if (contentType === 'whatsapp') {
          const whatsappImages = Array.isArray(data.s3_urls) ? data.s3_urls : (Array.isArray(data.images) ? data.images : (Array.isArray(data.image_urls) ? data.image_urls : []));
          setExistingContent({ images: whatsappImages, total_count: whatsappImages.length });
          if (!silent) setSuccess(`Found ${whatsappImages.length} WhatsApp images`);
        }
      } else {
        if (contentType === 'whatsapp' && (data?.s3_urls || data?.images || data?.image_urls)) {
          const whatsappImages = Array.isArray(data.s3_urls) ? data.s3_urls : (Array.isArray(data.images) ? data.images : (Array.isArray(data.image_urls) ? data.image_urls : []));
          setExistingContent({ images: whatsappImages, total_count: whatsappImages.length });
          if (!silent) setSuccess(`Found ${whatsappImages.length} WhatsApp images`);
        } else {
          setError(data?.message || data?.detail || 'Failed to fetch content');
        }
      }
    } catch (err) {
      setError('Error fetching content. Please try again.');
      console.error('Fetch error:', err);
    } finally {
      setViewLoading(false);
    }
  };

  const handleDeleteImage = (reviewIndex: number, imageId: string) => {
    if (!selectedCompany || !selectedProduct) {
      setError('Company and product must be selected');
      return;
    }
    setImageToDelete({ reviewIndex, imageId });
    setImageDeleteDialogOpen(true);
  };

  const performImageDelete = async () => {
    if (!imageToDelete || !selectedCompany || !selectedProduct) return;
    setImageDeleteDialogOpen(false);
    setViewLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch(
        `${IMAGE_API_BASE_URL}/reviews/${selectedCompany}/${selectedProduct}/${imageToDelete.reviewIndex}`,
        { method: 'DELETE' }
      );
      const data = await response.json();
      if (data.success) {
        setSuccess('Image deleted successfully');
        if (existingContent?.images && Array.isArray(existingContent.images)) {
          const reviewImages = existingContent.images as ImageItem[];
          const updatedImages = reviewImages.filter(
            (img) => !(img.review_index === imageToDelete.reviewIndex && img.image_id === imageToDelete.imageId)
          );
          setExistingContent({ ...existingContent, images: updatedImages, total_count: updatedImages.length });
        }
      } else {
        setError(data.message || data.detail || 'Failed to delete image');
      }
    } catch (err) {
      setError('Error deleting image. Please try again.');
      console.error('Delete error:', err);
    } finally {
      setViewLoading(false);
      setImageToDelete(null);
    }
  };

  const handleDeleteWhatsappImage = (imageUrl: string) => {
    if (!selectedCompany || !selectedProduct) {
      setError('Company and product must be selected');
      return;
    }
    setWhatsappImageToDelete(imageUrl);
    setWhatsappImageDeleteDialogOpen(true);
  };

  const performWhatsappImageDelete = async () => {
    if (!whatsappImageToDelete || !selectedCompany || !selectedProduct) return;
    setWhatsappImageDeleteDialogOpen(false);
    setViewLoading(true);
    setError('');
    setSuccess('');
    try {
      const deleteUrl = whatsappImageScope === 'company'
        ? `${API_BASE_URL}/whatsapp-images/company/${selectedCompany}/image?s3_url=${encodeURIComponent(whatsappImageToDelete)}`
        : `${API_BASE_URL}/whatsapp-images/${selectedCompany}/${selectedProduct}/image?s3_url=${encodeURIComponent(whatsappImageToDelete)}`;
      const response = await fetch(deleteUrl, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        setSuccess('WhatsApp image deleted successfully');
        if (existingContent?.images && Array.isArray(existingContent.images)) {
          const updatedImages = (existingContent.images as string[]).filter((url) => url !== whatsappImageToDelete);
          setExistingContent({ ...existingContent, images: updatedImages, total_count: updatedImages.length });
        }
        await fetchExistingContent();
      } else {
        setError(data.message || data.detail || 'Failed to delete image');
      }
    } catch (err) {
      setError('Error deleting image. Please try again.');
      console.error('Delete error:', err);
    } finally {
      setViewLoading(false);
      setWhatsappImageToDelete(null);
    }
  };

  const handleDeleteCompanyVideo = (videoId: string, filename: string) => {
    if (!selectedCompany) {
      setError('Company must be selected');
      return;
    }
    setCompanyVideoToDelete({ videoId, filename });
    setCompanyVideoDeleteDialogOpen(true);
  };

  const performCompanyVideoDelete = async () => {
    if (!companyVideoToDelete || !selectedCompany) return;
    setCompanyVideoDeleteDialogOpen(false);
    setViewLoading(true);
    setError('');
    setSuccess('');
    try {
      const deleteUrl = companyVideoCategory !== 'company_videos'
        ? `${VIDEO_API_BASE_URL}/delete-video/${selectedCompany}/${companyVideoToDelete.videoId}?video_category=${encodeURIComponent(companyVideoCategory)}`
        : `${VIDEO_API_BASE_URL}/delete-video/${selectedCompany}/${companyVideoToDelete.videoId}`;
      const response = await fetch(deleteUrl, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        setSuccess('Company video deleted successfully');
        if (existingContent?.company_videos) {
          const updatedVideos = existingContent.company_videos.filter((video) => video.id !== companyVideoToDelete.videoId);
          setExistingContent({ ...existingContent, company_videos: updatedVideos, total_count: updatedVideos.length });
        }
        await fetchExistingContent();
      } else {
        setError(data.message || data.detail || 'Failed to delete video');
      }
    } catch (err) {
      setError('Error deleting video. Please try again.');
      console.error('Delete error:', err);
    } finally {
      setViewLoading(false);
      setCompanyVideoToDelete(null);
    }
  };

  const handleDeleteProductVideo = (videoId: string, filename: string, productId: string) => {
    if (!selectedCompany) {
      setError('Company must be selected');
      return;
    }
    setProductVideoToDelete({ videoId, filename, productId });
    setProductVideoDeleteDialogOpen(true);
  };

  const performProductVideoDelete = async () => {
    if (!productVideoToDelete || !selectedCompany) return;
    setProductVideoDeleteDialogOpen(false);
    setViewLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch(
        `${VIDEO_API_BASE_URL}/delete-video/${selectedCompany}/${productVideoToDelete.videoId}?product_id=${productVideoToDelete.productId}`,
        { method: 'DELETE' }
      );
      const data = await response.json();
      if (data.success) {
        setSuccess('Product video deleted successfully');
        if (existingContent?.product_videos && existingContent.product_videos[productVideoToDelete.productId]) {
          const updatedVideos = existingContent.product_videos[productVideoToDelete.productId].filter(
            (video) => video.id !== productVideoToDelete.videoId
          );
          setExistingContent({
            ...existingContent,
            product_videos: { ...existingContent.product_videos, [productVideoToDelete.productId]: updatedVideos },
            total_count: (existingContent.total_count || 0) - 1,
          });
        }
        await fetchExistingContent();
      } else {
        setError(data.message || data.detail || 'Failed to delete video');
      }
    } catch (err) {
      setError('Error deleting video. Please try again.');
      console.error('Delete error:', err);
    } finally {
      setViewLoading(false);
      setProductVideoToDelete(null);
    }
  };

  const handleCompanyVideosDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !existingContent?.company_videos || !selectedCompany) return;
    const videos = existingContent.company_videos;
    const oldIndex = videos.findIndex((v) => v.id === active.id);
    const newIndex = videos.findIndex((v) => v.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(videos, oldIndex, newIndex);
    const videoOrder = reordered.map((v) => v.id);
    setReorderLoading(true);
    setError('');
    (async () => {
      try {
        const body = {
          video_order: videoOrder,
          video_category: companyVideoCategory !== 'company_videos' ? companyVideoCategory : undefined,
        };
        const response = await fetch(`${VIDEO_API_BASE_URL}/reorder-videos/${selectedCompany}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await response.json();
        if (data.success) {
          setSuccess('Video position updated');
          setExistingContent((prev) => (prev ? { ...prev, company_videos: reordered, total_count: reordered.length } : prev));
        } else {
          setError(data.message || data.detail || 'Failed to reorder videos');
        }
      } catch (err) {
        setError('Error reordering. Please try again.');
        console.error('Reorder error:', err);
      } finally {
        setReorderLoading(false);
      }
    })();
  }, [existingContent?.company_videos, selectedCompany, companyVideoCategory, setError, setSuccess]);

  const handleProductVideosDragEnd = useCallback((event: DragEndEvent, productId: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !existingContent?.product_videos?.[productId] || !selectedCompany) return;
    const videos = existingContent.product_videos[productId];
    const oldIndex = videos.findIndex((v) => v.id === active.id);
    const newIndex = videos.findIndex((v) => v.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(videos, oldIndex, newIndex);
    const videoOrder = reordered.map((v) => v.id);
    setReorderLoading(true);
    setError('');
    (async () => {
      try {
        const body = { video_order: videoOrder, product_id: productId };
        const response = await fetch(`${VIDEO_API_BASE_URL}/reorder-videos/${selectedCompany}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await response.json();
        if (data.success) {
          setSuccess('Video position updated');
          setExistingContent((prev) =>
            prev
              ? {
                  ...prev,
                  product_videos: { ...prev.product_videos, [productId]: reordered },
                  total_count: prev.total_count || 0,
                }
              : prev
          );
        } else {
          setError(data.message || data.detail || 'Failed to reorder videos');
        }
      } catch (err) {
        setError('Error reordering. Please try again.');
        console.error('Reorder error:', err);
      } finally {
        setReorderLoading(false);
      }
    })();
  }, [existingContent?.product_videos, selectedCompany, setError, setSuccess]);

  const handleEditDisplayLocations = (video: VideoItem, productId: string | null) => {
    setEditingDisplayVideo({ videoId: video.id, productId });
    setEditingDisplayLocations([...(video.display_locations || [])]);
  };

  const handleCancelEditDisplayLocations = () => {
    setEditingDisplayVideo(null);
    setEditingDisplayLocations([]);
  };

  const handleSaveDisplayLocations = async () => {
    if (!editingDisplayVideo || !selectedCompany) return;
    setDisplayLocationsSaving(true);
    setError('');
    try {
      const url = editingDisplayVideo.productId
        ? `${VIDEO_API_BASE_URL}/update-display-locations/${selectedCompany}/${editingDisplayVideo.videoId}`
        : `${VIDEO_API_BASE_URL}/update-display-locations/${selectedCompany}/${editingDisplayVideo.videoId}`;
      const body = editingDisplayVideo.productId
        ? { display_locations: editingDisplayLocations, product_id: editingDisplayVideo.productId }
        : { display_locations: editingDisplayLocations };
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data?.success) {
        setSuccess('Video display location updated successfully');
        setEditingDisplayVideo(null);
        setEditingDisplayLocations([]);
        await fetchExistingContent(true);
      } else {
        setError(data?.message || data?.error || 'Failed to update display locations');
      }
    } catch (err) {
      setError('Error updating display locations. Please try again.');
      console.error(err);
    } finally {
      setDisplayLocationsSaving(false);
    }
  };

  const getThemeConfig = () => {
    switch (contentType) {
      case 'review':
        return {
          icon: 'photo_library',
          colorClass: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/30',
          borderClass: 'border-sky-200 dark:border-sky-850/60',
          ringColor: 'focus:ring-sky-200/50 focus:border-sky-400',
        };
      case 'whatsapp':
        return {
          icon: 'chat',
          colorClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30',
          borderClass: 'border-emerald-200 dark:border-emerald-850/60',
          ringColor: 'focus:ring-emerald-200/50 focus:border-emerald-400',
        };
      case 'company-video':
        return {
          icon: 'movie',
          colorClass: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30',
          borderClass: 'border-purple-200 dark:border-purple-850/60',
          ringColor: 'focus:ring-purple-200/50 focus:border-purple-400',
        };
      case 'product-video':
        return {
          icon: 'movie',
          colorClass: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30',
          borderClass: 'border-indigo-200 dark:border-indigo-850/60',
          ringColor: 'focus:ring-indigo-200/50 focus:border-indigo-400',
        };
      default:
        return {
          icon: 'folder',
          colorClass: 'text-primary bg-primary/10',
          borderClass: 'border-slate-200 dark:border-slate-800',
          ringColor: 'focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]',
        };
    }
  };

  const theme = getThemeConfig();

  const renderContentLayoutWrapper = (headerIcon: string, headerColor: string, headerTitle: string, headerDesc: string, rightPanelContent: React.ReactNode) => {
    const typeConfig = {
      review: { label: 'Review Content', desc: 'Customer photo reviews', icon: 'rate_review', activeStyle: 'border-sky-400 bg-sky-50/80 text-sky-700', iconColor: 'text-sky-500' },
      whatsapp: { label: 'WhatsApp Images', desc: 'Conversation screenshots', icon: 'chat_bubble', activeStyle: 'border-emerald-400 bg-emerald-50/80 text-emerald-700', iconColor: 'text-emerald-500' },
      'company-video': { label: 'Company Video', desc: 'Brand testimonials', icon: 'videocam', activeStyle: 'border-purple-400 bg-purple-50/80 text-purple-700', iconColor: 'text-purple-500' },
      'product-video': { label: 'Product Video', desc: 'Demo & reviews', icon: 'video_library', activeStyle: 'border-indigo-400 bg-indigo-50/80 text-indigo-700', iconColor: 'text-indigo-500' },
    } as const;

    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-sm overflow-hidden mt-2 transition-all duration-300">
        <div className="flex flex-col md:flex-row min-h-[380px]">
          {/* ── Left sidebar: content type tabs ── */}
          <div className="w-full md:w-48 shrink-0 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex flex-col">
            <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Content Type</p>
            </div>
            <div className="flex flex-col gap-1 p-2 flex-1">
              {(['review', 'whatsapp', 'company-video', 'product-video'] as const).map((type) => {
                const cfg = typeConfig[type];
                const isSelected = contentType === type;
                return (
                  <button
                    key={type}
                    onClick={() => {
                      setContentType(type);
                      if (type !== 'whatsapp') setWhatsappImageScope('product');
                      setError(''); setSuccess('');
                      if (contentAction !== 'upload') {
                        setExistingContent(null);
                        if (contentAction === 'delete') setDeleteResult(null);
                      }
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? cfg.activeStyle + ' shadow-sm'
                        : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`material-symbols-outlined !text-[18px] mt-0.5 shrink-0 ${
                        isSelected ? '' : 'text-slate-400 dark:text-slate-500'
                      }`}>{cfg.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold leading-tight truncate">{cfg.label}</p>
                        <p className={`text-[9px] mt-0.5 leading-normal ${
                          isSelected ? 'opacity-60' : 'text-slate-400'
                        }`}>{cfg.desc}</p>
                      </div>
                      {isSelected && (
                        <span className="material-symbols-outlined !text-[13px] mt-0.5 shrink-0">check_circle</span>
                      )}
                    </div>
                  </button>
                );
              })}

              {/* WhatsApp scope toggle */}
              {contentType === 'whatsapp' && (
                <div className="mt-1 mx-0.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl flex gap-1 border border-slate-200/40">
                  {(['company', 'product'] as const).map((scope) => (
                    <button
                      key={scope}
                      onClick={() => { setWhatsappImageScope(scope); setExistingContent(null); }}
                      className={`flex-1 text-center py-1 px-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                        whatsappImageScope === scope
                          ? 'bg-white dark:bg-slate-700 text-[#FF6B35] shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                      }`}
                    >
                      {scope === 'company' ? 'Company' : 'Product'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Right panel: form fields ── */}
          <div className="flex-1 min-w-0 p-4 md:p-5">
            {/* Mini header */}
            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800/60 pb-3 mb-4">
              <div className={`p-2 rounded-lg ${headerColor}`}>
                <span className="material-symbols-outlined !text-[17px]">{headerIcon}</span>
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">{headerTitle}</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{headerDesc}</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-4">
              {rightPanelContent}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderUploadLayout = () => {
    let title = 'Upload Images/Videos';
    if (contentType === 'review') title = 'Upload Review Images';
    if (contentType === 'whatsapp') title = 'Upload WhatsApp Images';
    if (contentType === 'company-video') title = 'Upload Company Videos';
    if (contentType === 'product-video') title = 'Upload Product Videos';

    const rightPanelContent = (
      <>
        {/* Company / Product / Category row */}
        <div className={`grid gap-3.5 ${isCompanyAutoSelected ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
          {!isCompanyAutoSelected && (
            <label className="flex flex-col w-full">
              <span className="text-slate-700 dark:text-slate-300 text-xs font-bold leading-normal pb-1.5">Company *</span>
              {renderSearchableCompanyDropdown(
                loading,
                (companyId) => { setSelectedCompany(companyId); setError(''); setSuccess(''); },
                'Search by company ID...',
                'focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]',
                false
              )}
            </label>
          )}
          {contentType !== 'company-video' && !(contentType === 'whatsapp' && whatsappImageScope === 'company') && (
            <label className="flex flex-col w-full">
              <span className="text-slate-700 dark:text-slate-300 text-xs font-bold leading-normal pb-1.5">Product *</span>
              {renderSearchableProductDropdown(
                !selectedCompany || loading,
                (productId) => { setSelectedProduct(productId); setError(''); setSuccess(''); },
                'Select product...',
                'focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]'
              )}
            </label>
          )}
          {contentType === 'company-video' && (
            <label className="flex flex-col w-full">
              <div className="flex items-center justify-between pb-1.5">
                <span className="text-slate-700 dark:text-slate-300 text-xs font-bold leading-normal">Category</span>
                <div className="flex items-center gap-2.5">
                  <button type="button" onClick={() => selectedCompany && setAddCategoryOpen(true)} disabled={!selectedCompany} className="text-[10px] text-[#FF6B35] hover:underline font-bold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">+ Add Category</button>
                  <button type="button" onClick={() => { if (!selectedCompany || !companyVideoCategory) return; const current = videoCategories.find((c) => c.slug === companyVideoCategory); setEditCategoryName(current?.label || ''); setEditCategoryOpen(true); }} disabled={!selectedCompany || !companyVideoCategory} className="text-[10px] text-slate-400 hover:text-[#FF6B35] hover:underline font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">Rename</button>
                </div>
              </div>
              <select value={!selectedCompany ? '' : companyVideoCategory} onChange={(e) => setCompanyVideoCategory(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-950 focus:ring-4 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] outline-none transition-all" disabled={videoCategoriesLoading || !selectedCompany}>
                {!selectedCompany ? <option value="">Select company first</option> : videoCategories.map((opt) => <option key={opt.slug} value={opt.slug}>{opt.label}</option>)}
              </select>
            </label>
          )}
        </div>

        {/* Drop zone */}
        {!uploadInProgress && (
          <div className="relative border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 hover:border-[#FF6B35]/40 hover:bg-[#FF6B35]/5 dark:hover:bg-[#FF6B35]/5 transition-all duration-300 cursor-pointer group flex flex-col items-center justify-center p-4 text-center min-h-[130px]">
            <input id="file-upload" type="file" multiple accept={contentType === 'company-video' || contentType === 'product-video' ? 'video/*' : 'image/*'} onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={loading} />
            <div className="mb-2 p-2.5 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-150 dark:border-slate-800 group-hover:scale-105 transition-all duration-300 pointer-events-none">
              <span className="material-symbols-outlined text-2xl text-[#FF6B35]">{contentType === 'company-video' || contentType === 'product-video' ? 'movie' : 'image'}</span>
            </div>
            <h3 className="text-slate-800 dark:text-slate-100 font-bold text-xs mb-0.5 pointer-events-none">
              {videoUploadProgress.length > 0 ? `Add more ${contentType === 'company-video' || contentType === 'product-video' ? 'videos' : 'images'}` : `Drag & drop ${contentType === 'company-video' || contentType === 'product-video' ? 'videos' : 'images'} here`}
            </h3>
            <p className="text-slate-400 dark:text-slate-500 text-[10px] mb-2 pointer-events-none">{contentType === 'company-video' || contentType === 'product-video' ? 'Support for MP4, MOV, AVI up to 100MB' : 'Support for PNG, JPG, JPEG up to 50MB per file'}</p>
            <div className="px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm pointer-events-none group-hover:bg-[#FF6B35] group-hover:text-white group-hover:border-[#FF6B35] transition-all">Browse Files</div>
            {selectedFiles.length > 0 && <p className="text-[10px] text-[#FF6B35] mt-2 font-bold pointer-events-none">{selectedFiles.length} file(s) selected</p>}
          </div>
        )}

        {/* Video upload progress tiles */}
        {videoUploadProgress.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-2">
            {videoUploadProgress.map((vp, idx) => {
              const r = 28;
              const circ = 2 * Math.PI * r;
              const offset = circ * (1 - vp.percent / 100);
              const file = videoFiles[idx] ?? null;
              const thumbUrl = file ? URL.createObjectURL(file) : null;
              return (
                <div key={idx} className="flex flex-col items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center shrink-0 shadow-md">
                    {thumbUrl ? <video src={thumbUrl} className="absolute inset-0 w-full h-full object-cover opacity-50" muted playsInline preload="metadata" /> : <span className="material-symbols-outlined text-slate-500 text-3xl">movie</span>}
                    <div className="absolute inset-0 bg-black/40" />
                    {vp.error ? (
                      <div className="absolute inset-0 flex items-center justify-center"><div className="bg-red-500 rounded-full p-1.5 shadow-md"><span className="material-symbols-outlined !text-[20px] text-white">close</span></div></div>
                    ) : vp.done ? (
                      <div className="absolute inset-0 flex items-center justify-center"><div className="bg-emerald-500 rounded-full p-1.5 shadow-md"><span className="material-symbols-outlined !text-[20px] text-white">check</span></div></div>
                    ) : (
                      <svg className="absolute" width="80" height="80" viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
                        <circle cx="40" cy="40" r={r} fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} transform="rotate(-90 40 40)" style={{ transition: 'stroke-dashoffset 0.3s ease' }} />
                        <text x="40" y="44" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">{vp.percent}%</text>
                      </svg>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-350 truncate w-full text-center max-w-[96px]">{vp.name}</p>
                  {vp.error && (
                    <button onClick={() => handleRetryVideo(idx)} className="text-xs text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors cursor-pointer">
                      <span className="material-symbols-outlined !text-[14px]">refresh</span>Retry
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Finalize button */}
        {pendingVideoFinalize && (
          <button onClick={handleFinalizeUpload} disabled={finalizeInProgress} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/10 cursor-pointer">
            <span className="material-symbols-outlined !text-[18px]">save</span>
            {finalizeInProgress ? 'Saving…' : `Finalize Upload (${pendingVideoFinalize.videos.length} video${pendingVideoFinalize.videos.length !== 1 ? 's' : ''})`}
          </button>
        )}

        {/* Upload button */}
        {(selectedFiles.length > 0 || uploadInProgress) && (
          <button onClick={handleFileUpload} disabled={uploadInProgress} className="w-full bg-[#FF6B35] hover:bg-[#E5521C] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/10 cursor-pointer">
            <span className="material-symbols-outlined !text-[18px]">cloud_upload</span>
            {uploadInProgress ? 'Uploading…' : `Upload ${selectedFiles.length} File(s)`}
          </button>
        )}
      </>
    );

    return renderContentLayoutWrapper(
      theme.icon,
      theme.colorClass,
      title,
      'Add high-quality media content to your customer-facing pages.',
      rightPanelContent
    );
  };




  const renderViewLayout = () => {
    let title = 'View Existing Images/Videos';
    if (contentType === 'review') title = 'View Existing Review Images';
    if (contentType === 'whatsapp') title = 'View Existing WhatsApp Images';
    if (contentType === 'company-video') title = 'View Existing Company Videos';
    if (contentType === 'product-video') title = 'View Existing Product Videos';

    const rightPanelContent = (
      <>
        <div className={`grid gap-3.5 ${isCompanyAutoSelected ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
          {!isCompanyAutoSelected && (
            <label className="flex flex-col w-full">
              <span className="text-slate-700 dark:text-slate-300 text-xs font-bold leading-normal pb-1.5">Company *</span>
              {renderSearchableCompanyDropdown(
                viewLoading,
                (companyId) => { setSelectedCompany(companyId); setError(''); setSuccess(''); setExistingContent(null); },
                'Search by company ID...',
                'focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]',
                false
              )}
            </label>
          )}
          {contentType !== 'company-video' && !(contentType === 'whatsapp' && whatsappImageScope === 'company') && (
            <label className="flex flex-col w-full">
              <span className="text-slate-700 dark:text-slate-300 text-xs font-bold leading-normal pb-1.5">Product *</span>
              {renderSearchableProductDropdown(
                !selectedCompany || viewLoading,
                (productId) => { setSelectedProduct(productId); setError(''); setSuccess(''); setExistingContent(null); },
                'Select product...',
                'focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]'
              )}
            </label>
          )}
          {contentType === 'company-video' && (
            <label className="flex flex-col w-full">
              <div className="flex items-center justify-between pb-1.5">
                <span className="text-slate-700 dark:text-slate-300 text-xs font-bold leading-normal">Category</span>
                <div className="flex items-center gap-2.5">
                  <button type="button" onClick={() => selectedCompany && setAddCategoryOpen(true)} disabled={!selectedCompany} className="text-[10px] text-[#FF6B35] hover:underline font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline cursor-pointer">+ Add Category</button>
                  <button type="button" onClick={() => { if (!selectedCompany || !companyVideoCategory) return; const current = videoCategories.find((c) => c.slug === companyVideoCategory); setEditCategoryName(current?.label || ''); setEditCategoryOpen(true); }} disabled={!selectedCompany || !companyVideoCategory} className="text-[10px] text-slate-400 hover:text-[#FF6B35] hover:underline font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">Rename</button>
                </div>
              </div>
              <select value={!selectedCompany ? "" : companyVideoCategory} onChange={(e) => { setCompanyVideoCategory(e.target.value); setExistingContent(null); }} className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-950 focus:ring-4 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] outline-none transition-all" disabled={videoCategoriesLoading || !selectedCompany}>
                {!selectedCompany ? <option value="">Select company first</option> : videoCategories.map((opt) => <option key={opt.slug} value={opt.slug}>{opt.label}</option>)}
              </select>
            </label>
          )}
        </div>
        
        <button onClick={() => fetchExistingContent()} disabled={viewLoading || !selectedCompany || (contentType !== 'company-video' && !(contentType === 'whatsapp' && whatsappImageScope === 'company') && !selectedProduct)} className="w-full bg-[#FF6B35] hover:bg-[#E5521C] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs text-xs mt-1">
          <span className="material-symbols-outlined !text-[15px]">search</span>
          {viewLoading ? 'Fetching content...' : 'Fetch Content'}
        </button>

        {existingContent && (
          <div className="border-t border-slate-100 dark:border-slate-800/60 pt-6 mt-2">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#FF6B35]">list_alt</span>
              Results ({existingContent.total_count || 0} items)
            </h3>
            
            {(contentType === 'company-video' || contentType === 'product-video') && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {contentType === 'company-video' && existingContent.company_videos && (
                  <DndContext sensors={sensors} onDragEnd={handleCompanyVideosDragEnd}>
                    <SortableContext items={existingContent.company_videos.map((v) => v.id)} strategy={rectSortingStrategy}>
                      <div className="contents">
                        {existingContent.company_videos.map((video) => (
                          <SortableCompanyVideoCard key={video.id} video={video} onDelete={handleDeleteCompanyVideo} disabled={reorderLoading || viewLoading} />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
                {contentType === 'product-video' && existingContent.product_videos && Object.entries(existingContent.product_videos).map(([productId, videos]) => (
                  <DndContext key={productId} sensors={sensors} onDragEnd={(e) => handleProductVideosDragEnd(e, productId)}>
                    <SortableContext items={videos.map((v) => v.id)} strategy={rectSortingStrategy}>
                      <div className="contents">
                        {videos.map((video) => (
                          <SortableProductVideoCard key={video.id} video={video} productId={productId} onDelete={handleDeleteProductVideo} disabled={reorderLoading || viewLoading} editingDisplayVideo={editingDisplayVideo} editingDisplayLocations={editingDisplayLocations} onEditDisplayLocations={handleEditDisplayLocations} onCancelEditDisplayLocations={handleCancelEditDisplayLocations} onSaveDisplayLocations={handleSaveDisplayLocations} displayLocationsSaving={displayLocationsSaving} setEditingDisplayLocations={setEditingDisplayLocations} />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                ))}
                {contentType === 'company-video' && !existingContent.company_videos?.length && (
                  <div className="col-span-full text-center py-12 text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/35 border border-slate-100 dark:border-slate-800/80 rounded-2xl">
                    <span className="material-symbols-outlined text-5xl mb-2 text-slate-300 dark:text-slate-700">movie</span>
                    <p className="font-semibold text-sm">No company videos found</p>
                  </div>
                )}
                {contentType === 'product-video' && !Object.keys(existingContent.product_videos || {}).length && (
                  <div className="col-span-full text-center py-12 text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/35 border border-slate-100 dark:border-slate-800/80 rounded-2xl">
                    <span className="material-symbols-outlined text-5xl mb-2 text-slate-300 dark:text-slate-700">movie</span>
                    <p className="font-semibold text-sm">No product videos found</p>
                  </div>
                )}
              </div>
            )}
            {contentType === 'review' && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {(existingContent.images as ImageItem[])?.map((image, index) => (
                  <div key={image.image_id || index} className="relative group border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md">
                    <img src={image.s3_url} alt={image.filename || `Review content ${index + 1}`} className="w-full h-36 object-cover bg-slate-100 dark:bg-slate-950" onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Error'; }} />
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-[1px]">
                      <button onClick={() => handleDeleteImage(image.review_index, image.image_id)} disabled={viewLoading} className="p-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-50 shadow-md cursor-pointer" title="Delete image">
                        <span className="material-symbols-outlined !text-[20px]">delete</span>
                      </button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-xs font-bold text-white truncate">{image.filename || `Review #${image.review_index}`}</p>
                    </div>
                  </div>
                ))}
                {!existingContent.images?.length && (
                  <div className="col-span-full text-center py-12 text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/35 border border-slate-100 dark:border-slate-800/80 rounded-2xl">
                    <span className="material-symbols-outlined text-5xl mb-2 text-slate-300 dark:text-slate-700">image</span>
                    <p className="font-semibold text-sm">No images found</p>
                  </div>
                )}
              </div>
            )}
            {contentType === 'whatsapp' && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {existingContent?.images && Array.isArray(existingContent.images) && existingContent.images.length > 0 ? (
                  (existingContent.images as unknown as string[]).map((imageUrl, index) => (
                    <div key={index} className="relative group border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md">
                      <img src={imageUrl} alt={`WhatsApp content ${index + 1}`} className="w-full h-36 object-cover bg-slate-100 dark:bg-slate-950" onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Error'; }} />
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-[1px]">
                        <button onClick={() => handleDeleteWhatsappImage(imageUrl)} disabled={viewLoading} className="p-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-50 shadow-md cursor-pointer" title="Delete image">
                          <span className="material-symbols-outlined !text-[20px]">delete</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/35 border border-slate-100 dark:border-slate-800/80 rounded-2xl">
                    <span className="material-symbols-outlined text-5xl mb-2 text-slate-300 dark:text-slate-700">image</span>
                    <p className="font-semibold text-sm">No images found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </>
    );

    return renderContentLayoutWrapper(
      'visibility',
      'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
      title,
      'Retrieve and manage uploaded images or videos for your brand or products.',
      rightPanelContent
    );
  };

  const renderDeleteLayout = () => {
    let title = 'Delete Images/Videos';
    if (contentType === 'review') title = 'Delete Review Images';
    if (contentType === 'whatsapp') title = 'Delete WhatsApp Images';
    if (contentType === 'company-video') title = 'Delete Company Videos';
    if (contentType === 'product-video') title = 'Delete Product Videos';

    const rightPanelContent = (
      <>
        {contentType !== 'company-video' && contentType !== 'whatsapp' && (
          <div className="mb-2.5">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-1.5 block">Select Delete Scope</span>
            <div className="flex items-center gap-5">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="deleteOption" value="company" checked={deleteOption === 'company'} onChange={(e) => setDeleteOption(e.target.value as DeleteOption)} className="w-3.5 h-3.5 text-red-600 focus:ring-red-500" />
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">Delete from All Products</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="deleteOption" value="product" checked={deleteOption === 'product'} onChange={(e) => setDeleteOption(e.target.value as DeleteOption)} className="w-3.5 h-3.5 text-red-600 focus:ring-red-500" />
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">Delete by Product</span>
              </label>
            </div>
          </div>
        )}
        
        {/* Warnings */}
        {contentType === 'whatsapp' && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 px-2.5 py-1.5 rounded flex items-center gap-1.5 mb-2.5">
            <span className="material-symbols-outlined !text-[14px] text-amber-500 shrink-0">warning</span>
            <span className="text-[10px] font-semibold">
              {whatsappImageScope === 'company'
                ? 'Deletes all company-level WhatsApp images for the selected company.'
                : 'Deletes all WhatsApp images for the selected product.'}
            </span>
          </div>
        )}
        {contentType === 'company-video' && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 px-2.5 py-1.5 rounded flex items-center gap-1.5 mb-2.5">
            <span className="material-symbols-outlined !text-[14px] text-amber-500 shrink-0">warning</span>
            <span className="text-[10px] font-semibold">
              {companyVideoCategory === 'company_videos'
                ? 'Deletes all company videos for the selected company.'
                : `Deletes all "${videoCategories.find((c) => c.slug === companyVideoCategory)?.label || companyVideoCategory}" videos.`}
            </span>
          </div>
        )}
        {contentType === 'product-video' && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 px-2.5 py-1.5 rounded flex items-center gap-1.5 mb-2.5">
            <span className="material-symbols-outlined !text-[14px] text-amber-500 shrink-0">warning</span>
            <span className="text-[10px] font-semibold">
              {deleteOption === 'company' ? 'Deletes ALL product videos for all products in the selected company.' : 'Deletes ALL videos for the selected product.'}
            </span>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Select Company */}
            {!isCompanyAutoSelected && (
              <label className="flex flex-col w-full z-20">
                <span className="text-slate-700 dark:text-slate-300 text-[10px] font-bold leading-normal pb-1">Select Company *</span>
                {renderSearchableCompanyDropdown(
                  loading,
                  (companyId) => { setSelectedCompany(companyId); setError(''); setSuccess(''); setDeleteResult(null); },
                  '-- Select Company --',
                  'focus:ring-red-200/50 focus:border-red-400',
                  false
                )}
              </label>
            )}

            {/* Category to Delete (Company Video) */}
            {contentType === 'company-video' && selectedCompany && (
              <label className="flex flex-col w-full z-10">
                <span className="text-slate-700 dark:text-slate-300 text-[10px] font-bold leading-normal pb-1">Category to Delete *</span>
                <select value={companyVideoCategory} onChange={(e) => setCompanyVideoCategory(e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-2.5 py-2 text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-red-200/50 focus:border-red-400 outline-none transition-all h-[38px]" disabled={videoCategoriesLoading}>
                  {videoCategories.map((opt) => <option key={opt.slug} value={opt.slug}>{opt.label}</option>)}
                </select>
              </label>
            )}

            {/* Select Product */}
            {((deleteOption === 'product' && contentType !== 'company-video' && contentType !== 'whatsapp') || (contentType === 'product-video' && deleteOption === 'product') || (contentType === 'whatsapp' && whatsappImageScope === 'product')) && (
              <label className="flex flex-col w-full z-10">
                <span className="text-slate-700 dark:text-slate-300 text-[10px] font-bold leading-normal pb-1">Select Product *</span>
                {renderSearchableProductDropdown(
                  !selectedCompany || loading,
                  (productId) => { setSelectedProduct(productId); setError(''); setSuccess(''); setDeleteResult(null); },
                  '-- Select Product --',
                  'focus:ring-red-200/50 focus:border-red-400'
                )}
              </label>
            )}
          </div>

          <button onClick={handleDeleteContent} disabled={loading || !selectedCompany || (((contentType !== 'company-video' && contentType !== 'whatsapp' && deleteOption === 'product') || (contentType === 'product-video' && deleteOption === 'product') || (contentType === 'whatsapp' && whatsappImageScope === 'product')) && !selectedProduct)} className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm text-xs mt-2">
            <span className="material-symbols-outlined !text-[16px]">delete</span>
            {loading ? 'Deleting...' : `Delete ${contentType === 'whatsapp' ? 'WhatsApp Images' : contentType === 'company-video' ? 'Company Videos' : contentType === 'product-video' ? 'Product Videos' : 'Review Images'}`}
          </button>
        </div>
      </>
    );

    return renderContentLayoutWrapper(
      'delete',
      'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400',
      title,
      'Permanently remove resources. Once deleted, they cannot be recovered.',
      rightPanelContent
    );
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Card 1: Header & Action Navigation */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-sm p-4 transition-all duration-300">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800/60 pb-3 mb-3.5">
          <div className="p-2 bg-[#FF6B35]/10 text-[#FF6B35] rounded-lg shadow-sm">
            <span className="material-symbols-outlined !text-[18px]">cloud_upload</span>
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Content</h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Upload and organize customer photo reviews, WhatsApp images, company video testimonials, and product demo clips.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {(['upload', 'view', 'delete'] as const).map((action) => {
            const isActive = contentAction === action;
            let actionColor = '';
            if (isActive) {
              if (action === 'upload') actionColor = 'bg-[#FF6B35] text-white shadow-sm';
              else if (action === 'view') actionColor = 'bg-blue-600 text-white shadow-sm';
              else if (action === 'delete') actionColor = 'bg-red-600 text-white shadow-sm';
            } else {
              actionColor = 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200';
            }

            return (
              <button
                key={action}
                onClick={() => {
                  setContentAction(action);
                  setError('');
                  setSuccess('');
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${actionColor}`}
              >
                <span className="material-symbols-outlined !text-[14px]">
                  {action === 'upload' ? 'cloud_upload' : action === 'view' ? 'visibility' : 'delete'}
                </span>
                {action === 'upload' ? 'Upload' : action === 'view' ? 'View Existing' : 'Delete'}
              </button>
            );
          })}
        </div>
      </div>

       {/* Notice: Selection pills for Content Type have been moved to the side panel */}

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/60 text-red-750 dark:text-red-400 px-4 py-3.5 rounded-xl text-sm font-semibold shadow-sm flex items-center gap-2 animate-fade-in">
          <span className="material-symbols-outlined !text-[18px]">error</span>
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 text-emerald-750 dark:text-emerald-400 px-4 py-3.5 rounded-xl text-sm font-semibold shadow-sm flex items-center gap-2 animate-fade-in">
          <span className="material-symbols-outlined !text-[18px]">check_circle</span>
          {success}
        </div>
      )}

      {contentAction === 'upload' && renderUploadLayout()}
      {contentAction === 'view' && renderViewLayout()}
      {contentAction === 'delete' && renderDeleteLayout()}

      {/* Error Modal */}
      {errorModal && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-955/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 dark:border-slate-800 animate-scale-up">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl">
                  <span className="material-symbols-outlined text-red-650">error</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Upload Error</h3>
              </div>
              <p className="text-slate-650 dark:text-slate-400 text-sm leading-relaxed">{errorModal}</p>
            </div>
            <div className="flex px-6 py-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setErrorModal(null)}
                className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialo      {deleteDialogOpen && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-955/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 dark:border-slate-800 animate-scale-up">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl"><span className="material-symbols-outlined">warning</span></div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Confirm Delete</h3>
              </div>
              <p className="text-slate-655 dark:text-slate-400 text-sm leading-relaxed">{deleteDialogMessage}</p>
            </div>
            <div className="flex gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setDeleteDialogOpen(false)} className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-350 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer">Cancel</button>utton>
              <button onClick={performDelete} className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors cursor-pointer">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Image Dialo      {imageDeleteDialogOpen && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-955/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 dark:border-slate-800 animate-scale-up">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl"><span className="material-symbols-outlined">delete</span></div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Delete Image</h3>
              </div>
              <p className="text-slate-655 dark:text-slate-400 text-sm leading-relaxed">Are you sure you want to delete this image? This action cannot be undone.</p>
            </div>
            <div className="flex gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => { setImageDeleteDialogOpen(false); setImageToDelete(null); }} className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-350 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer">Cancel</button>utton>
              <button onClick={performImageDelete} className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors cursor-pointer">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete WhatsApp Image Dialog */}
      {whatsappImageDeleteDialogOpen && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-955/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 dark:border-slate-800 animate-scale-up">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl"><span className="material-symbols-outlined">delete</span></div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Delete WhatsApp Image</h3>
              </div>
              <p className="text-slate-655 dark:text-slate-400 text-sm leading-relaxed">Are you sure you want to delete this WhatsApp image? This action cannot be undone.</p>
            </div>
            <div className="flex gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => { setWhatsappImageDeleteDialogOpen(false); setWhatsappImageToDelete(null); }} className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-350 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer">Cancel</button>
              <button onClick={performWhatsappImageDelete} className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-650 hover:bg-red-750 rounded-xl transition-colors cursor-pointer">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Company Video Dialog */}
      {companyVideoDeleteDialogOpen && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-955/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 dark:border-slate-800 animate-scale-up">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl"><span className="material-symbols-outlined">delete</span></div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Delete Company Video</h3>
              </div>
              <p className="text-slate-655 dark:text-slate-400 text-sm leading-relaxed">Are you sure you want to delete the video <strong>{companyVideoToDelete?.filename}</strong>? This action cannot be undone.</p>
            </div>
            <div className="flex gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => { setCompanyVideoDeleteDialogOpen(false); setCompanyVideoToDelete(null); }} className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-350 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer">Cancel</button>
              <button onClick={performCompanyVideoDelete} className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-650 hover:bg-red-750 rounded-xl transition-colors cursor-pointer">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Product Video Dialog */}
      {productVideoDeleteDialogOpen && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-955/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 dark:border-slate-800 animate-scale-up">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl"><span className="material-symbols-outlined">delete</span></div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Delete Product Video</h3>
              </div>
              <p className="text-slate-655 dark:text-slate-400 text-sm leading-relaxed">Are you sure you want to delete the video <strong>{productVideoToDelete?.filename}</strong>? This action cannot be undone.</p>
            </div>
            <div className="flex gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => { setProductVideoDeleteDialogOpen(false); setProductVideoToDelete(null); }} className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-350 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer">Cancel</button>
              <button onClick={performProductVideoDelete} className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors cursor-pointer">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Video Category Dialog */}
      {addCategoryOpen && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-955/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 dark:border-slate-800 animate-scale-up">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Add Video Category</h3>
              <label className="block">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-350">Category Name *</span>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Wedding Videos"
                  className="mt-2 block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-950 focus:ring-4 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] outline-none transition-all"
                />
              </label>
            </div>
            <div className="flex gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => { setAddCategoryOpen(false); setNewCategoryName(''); }} className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-350 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer">Cancel</button>
              <button onClick={handleAddCategory} className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-[#FF6B35] hover:bg-[#E5521C] rounded-xl transition-colors cursor-pointer">Add Category</button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Video Category Dialog */}
      {editCategoryOpen && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-955/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 dark:border-slate-800 animate-scale-up">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Rename Category</h3>
              <button
                onClick={() => { setEditCategoryOpen(false); setEditCategoryName(''); }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined !text-[20px]">close</span>
              </button>
            </div>
            <div className="px-6 py-4 space-y-3">
              <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">
                This only changes the visible name. Videos stay in the same category bucket.
              </p>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-350">New category name</span>
                <input
                  type="text"
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  placeholder="e.g. Homepage Hero Video"
                  className="mt-2 block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-950 focus:ring-4 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] outline-none transition-all"
                />
              </label>
            </div>
            <div className="flex gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => { setEditCategoryOpen(false); setEditCategoryName(''); }}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-750 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-350 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameCategory}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-[#FF6B35] hover:bg-[#E5521C] rounded-xl transition-colors cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentTab;
