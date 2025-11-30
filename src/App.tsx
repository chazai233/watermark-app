import React, { useState, useRef, useEffect } from 'react';
import {
  Upload, X, Clock, Download, Plus, ZoomIn, ZoomOut,
  Trash2, Image as ImageIcon, Palette, Type, ChevronDown, Save,
  AlignLeft, AlignCenter, AlignRight, Crop as CropIcon, RotateCw, RotateCcw,
  FlipHorizontal, FlipVertical//, PenTool, Square, Circle as CircleIcon, Move, Undo
} from 'lucide-react';
// import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
// import 'react-image-crop/dist/ReactCrop.css';
import type { ImageFile, WatermarkConfig/*, Drawing, DrawingTool*/ } from './types';
import { processImageFile } from './utils/imageProcessor';
import { generateWatermarkedImage } from './utils/watermarkGenerator';
import { downloadBlob, delay } from './utils/exportHelper';
import { sanitizeFilename } from './utils/renameHelper';

const fontOptions = [
  { label: '思源黑体', value: '"Noto Sans SC", sans-serif' },
  { label: '宋体', value: 'SimSun, serif' },
  { label: '仿宋', value: 'FangSong, serif' },
  { label: '楷体', value: 'KaiTi, serif' },
  { label: '微软雅黑', value: '"Microsoft YaHei", sans-serif' },
];

const timeFormats = [
  { label: '2025.11.29 14:30:00', value: 'YYYY.MM.DD HH:mm:ss' },
  { label: '2025-11-29 14:30:00', value: 'YYYY-MM-DD HH:mm:ss' },
  { label: '2025-11-29 14:30', value: 'YYYY-MM-DD HH:mm' },
  { label: '2025年11月29日 14:30', value: 'YYYY年MM月DD日 HH:mm' },
];

// 默认预设
const DEFAULT_AREA_PRESETS = [
  '右岸R10道路',
  '右岸沿线道路',
  '右岸120拌合站',
  '右岸240拌合站',
  '右岸砂石系统',
  '右岸炸药库',
  '右岸1#渣场',
  '右岸2#渣场',
];

const DEFAULT_CONTENT_PRESETS = [
  '毛路开挖',
  '道路扩挖',
  '土方开挖',
  '土方回填',
  '坡度调整',
  '钢筋绑扎',
  '基础开挖',
];

// PresetSelector组件
function PresetSelector({
  value,
  onChange,
  presets,
  onSavePreset,
  onDeletePreset,
  placeholder,
  isTextarea = false,
}: {
  value: string;
  onChange: (value: string) => void;
  presets: string[];
  onSavePreset: (value: string) => void;
  onDeletePreset: (value: string) => void;
  placeholder: string;
  isTextarea?: boolean;
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSave = () => {
    if (value.trim()) {
      onSavePreset(value.trim());
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          {isTextarea ? (
            <textarea
              rows={2}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="input-modern resize-none w-full"
              placeholder={placeholder}
            />
          ) : (
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="input-modern w-full"
              placeholder={placeholder}
            />
          )}
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="btn btn-secondary px-3 shrink-0"
            title="选择预设"
          >
            <ChevronDown size={16} />
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn btn-secondary px-3 shrink-0"
            title="保存当前内容为预设"
          >
            <Save size={16} />
          </button>
        </div>
      </div>

      {showDropdown && presets.length > 0 && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto custom-scrollbar">
          {presets.map((preset, index) => (
            <div
              key={index}
              className="px-4 py-2.5 hover:bg-blue-50 transition-colors text-sm text-slate-700 border-b border-slate-100 last:border-b-0 flex items-center justify-between group"
            >
              <span
                onClick={() => {
                  onChange(preset);
                  setShowDropdown(false);
                }}
                className="flex-1 cursor-pointer"
              >
                {preset}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePreset(preset);
                }}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity p-1"
                title="删除预设"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Convert custom time format to datetime-local input format (YYYY-MM-DDTHH:mm:ss)
const formatTimeForInput = (timeStr: string): string => {
  // Parse the time string and convert to datetime-local format
  const cleaned = timeStr.replace(/[年月日]/g, '-').replace(/\./g, '-').replace(/ /g, 'T');
  const parts = cleaned.split('T');
  if (parts.length === 2) {
    const date = parts[0].split('-').filter(Boolean).join('-');
    const time = parts[1];
    return `${date}T${time}`;
  }
  return new Date().toISOString().slice(0, 19);
};

// Convert datetime-local input format back to custom format
const formatTimeFromInput = (inputValue: string, format: string): string => {
  if (!inputValue) return '';

  const [datePart, timePart] = inputValue.split('T');
  const [year, month, day] = datePart.split('-');
  const timeStr = timePart || '00:00:00';

  if (format === 'YYYY.MM.DD HH:mm:ss') {
    return `${year}.${month}.${day} ${timeStr}`;
  } else if (format === 'YYYY-MM-DD HH:mm:ss') {
    return `${year}-${month}-${day} ${timeStr}`;
  } else if (format === 'YYYY-MM-DD HH:mm') {
    return `${year}-${month}-${day} ${timeStr.slice(0, 5)}`;
  } else if (format === 'YYYY年MM月DD日 HH:mm') {
    return `${year}年${month}月${day}日 ${timeStr.slice(0, 5)}`;
  }
  return `${year}.${month}.${day} ${timeStr}`;
};

export default function WatermarkApp() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({ isOpen: true, title, message, onConfirm });
  };

  const [zoomLevel, setZoomLevel] = useState(100);
  const [isExporting, setIsExporting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Image editing state
  const [editingImageId, setEditingImageId] = useState<number | null>(null);
  const [editState, setEditState] = useState<{
    rotation: number;
    flipH: boolean;
    flipV: boolean;
  }>({
    rotation: 0,
    flipH: false,
    flipV: false,
  });

  const [config, setConfig] = useState<WatermarkConfig>({
    area: '二期工程-基坑A区',
    content: '土方开挖与支护作业',
    useExifTime: true,
    customTime: '2025.11.29 12:00:00',
    timeFormat: 'YYYY.MM.DD HH:mm:ss',
    logo: null,
    customItems: [],
    fontFamily: '"Noto Sans SC", sans-serif',
    fontSize: 24,
    fontColor: '#FFFFFF',
    textShadow: true,
    position: 'bottom-left',
    textAlign: 'left',
    scale: 1.0,
    marginX: 30,
    marginY: 30,
    exportFormat: 'jpeg',
    exportQuality: 0.92,
  });

  // 预设管理
  const [areaPresets, setAreaPresets] = useState<string[]>(DEFAULT_AREA_PRESETS);
  const [contentPresets, setContentPresets] = useState<string[]>(DEFAULT_CONTENT_PRESETS);

  // 从 localStorage 加载预设
  useEffect(() => {
    try {
      const saved = localStorage.getItem('watermark-presets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.areas) setAreaPresets([...DEFAULT_AREA_PRESETS, ...parsed.areas]);
        if (parsed.contents) setContentPresets([...DEFAULT_CONTENT_PRESETS, ...parsed.contents]);
      }
    } catch (error) {
      console.error('Failed to load presets:', error);
    }
  }, []);

  // 保存预设到 localStorage
  const savePresetsToStorage = (areas: string[], contents: string[]) => {
    try {
      const customAreas = areas.filter(a => !DEFAULT_AREA_PRESETS.includes(a));
      const customContents = contents.filter(c => !DEFAULT_CONTENT_PRESETS.includes(c));
      localStorage.setItem('watermark-presets', JSON.stringify({
        areas: customAreas,
        contents: customContents,
      }));
    } catch (error) {
      console.error('Failed to save presets:', error);
    }
  };

  // 添加区域预设
  const addAreaPreset = (value: string) => {
    if (!areaPresets.includes(value)) {
      const newPresets = [...areaPresets, value];
      setAreaPresets(newPresets);
      savePresetsToStorage(newPresets, contentPresets);
      showToast('已保存到预设！');
    }
  };

  // 添加内容预设
  const addContentPreset = (value: string) => {
    if (!contentPresets.includes(value)) {
      const newPresets = [...contentPresets, value];
      setContentPresets(newPresets);
      savePresetsToStorage(areaPresets, newPresets);
      showToast('已保存到预设！');
    }
  };

  // 删除区域预设
  const deleteAreaPreset = (value: string) => {
    // 不允许删除默认预设
    if (DEFAULT_AREA_PRESETS.includes(value)) {
      showToast('默认预设不可删除', 'error');
      return;
    }
    const newPresets = areaPresets.filter(p => p !== value);
    setAreaPresets(newPresets);
    savePresetsToStorage(newPresets, contentPresets);
    showToast('预设已删除');
  };

  // 删除内容预设
  const deleteContentPreset = (value: string) => {
    // 不允许删除默认预设
    if (DEFAULT_CONTENT_PRESETS.includes(value)) {
      showToast('默认预设不可删除', 'error');
      return;
    }
    const newPresets = contentPresets.filter(p => p !== value);
    setContentPresets(newPresets);
    savePresetsToStorage(areaPresets, newPresets);
    showToast('预设已删除');
  };


  const selectedImage = images.find(img => img.id === selectedId) || null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress({ current: 0, total: files.length });

    const newImages: ImageFile[] = [];
    for (let i = 0; i < files.length; i++) {
      setUploadProgress({ current: i + 1, total: files.length });
      try {
        const imageFile = await processImageFile(files[i]);
        newImages.push(imageFile);
      } catch (error) {
        console.error('Failed to process', files[i].name, error);
      }
    }

    setImages(prev => [...prev, ...newImages]);
    if (newImages.length > 0 && selectedId === null) {
      setSelectedId(newImages[0].id);
      setCheckedIds(new Set([newImages[0].id]));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';

    setIsUploading(false);
    setUploadProgress({ current: 0, total: 0 });
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress({ current: 0, total: files.length });

    const newImages: ImageFile[] = [];
    for (let i = 0; i < files.length; i++) {
      setUploadProgress({ current: i + 1, total: files.length });
      try {
        const imageFile = await processImageFile(files[i]);
        newImages.push(imageFile);
      } catch (error) {
        console.error('Failed to process', files[i].name, error);
      }
    }

    setImages(prev => [...prev, ...newImages]);
    if (newImages.length > 0 && selectedId === null) setSelectedId(newImages[0].id);

    setIsUploading(false);
    setUploadProgress({ current: 0, total: 0 });
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const getDisplayTime = (image: ImageFile | null = selectedImage): string => {
    let raw = config.useExifTime ? (image?.exif.dateTime || '无EXIF数据') : config.customTime;
    if (config.timeFormat === 'YYYY-MM-DD HH:mm') {
      const parts = raw.split(' ');
      if (parts.length === 2) {
        const datePart = parts[0].replace(/:/g, '-');
        const timePart = parts[1].split(':').slice(0, 2).join(':');
        return `${datePart} ${timePart}`;
      }
      return raw.substring(0, 16).replace(/:/g, '-');
    }
    if (config.timeFormat.includes('年')) {
      const parts = raw.split(' ');
      if (parts.length === 2) {
        const date = parts[0].replace(/:/g, '-');
        const [y, m, d] = date.split('-');
        const time = parts[1].substring(0, 5);
        return `${y}年${m}月${d}日 ${time}`;
      }
      return raw;
    }
    if (config.timeFormat.includes('-')) return raw.replace(/:/g, '-');
    if (config.timeFormat.includes('HH')) return raw.split(' ')[1] || raw;
    return raw.replace(/:/g, '.');
  };

  const toggleCheck = (id: number) => {
    const newSet = new Set(checkedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setCheckedIds(newSet);
  };

  const toggleAll = () => {
    if (checkedIds.size === images.length && images.length > 0) setCheckedIds(new Set());
    else setCheckedIds(new Set(images.map(img => img.id)));
  };

  const handleDeleteChecked = () => {
    if (checkedIds.size === 0) return;
    showConfirm(
      '删除图片',
      `确定要删除选中的 ${checkedIds.size} 张图片吗？`,
      () => {
        setImages(prev => prev.filter(img => !checkedIds.has(img.id)));
        if (selectedId && checkedIds.has(selectedId)) {
          setSelectedId(null);
        }
        setCheckedIds(new Set());
        showToast('已删除图片');
      }
    );
  };

  // Image editing functions
  const startEditing = (id: number) => {
    const img = images.find(i => i.id === id);
    if (!img) return;
    setEditingImageId(id);
    setEditState({
      rotation: img.edits?.rotation || 0,
      flipH: img.edits?.flipH || false,
      flipV: img.edits?.flipV || false,
    });
  };

  const cancelEditing = () => {
    setEditingImageId(null);
    setEditState({ rotation: 0, flipH: false, flipV: false });
  };

  const saveEdits = () => {
    if (editingImageId === null) return;
    setImages(prev => prev.map(img => {
      if (img.id === editingImageId) {
        return {
          ...img,
          edits: {
            rotation: editState.rotation,
            flipH: editState.flipH,
            flipV: editState.flipV,
            drawings: img.edits?.drawings || [],
          }
        };
      }
      return img;
    }));
    setEditingImageId(null);
    showToast('编辑已保存');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setConfig({ ...config, logo: e.target?.result as string });
    reader.readAsDataURL(file);
  };



  const handleBatchExport = async () => {
    if (checkedIds.size === 0) { showToast('请至少选择一张图片', 'error'); return; }
    setIsExporting(true);
    try {
      const imagesToExport = images.filter(img => checkedIds.has(img.id));
      for (let i = 0; i < imagesToExport.length; i++) {
        const image = imagesToExport[i];
        const displayTime = getDisplayTime(image);
        const blob = await generateWatermarkedImage(image, config, displayTime);
        let nameWithoutExt = image.name.replace(/\.[^/.]+$/, '');
        if (!nameWithoutExt || nameWithoutExt.trim() === '') {
          nameWithoutExt = `image_${i + 1}`;
        }

        const ext = config.exportFormat === 'png' ? '.png'
          : config.exportFormat === 'webp' ? '.webp'
            : '.jpg';

        // Sanitize the name part only, then append extension
        const safeName = sanitizeFilename(`${nameWithoutExt}_watermarked`);
        const filename = `${safeName}${ext}`;

        downloadBlob(blob, filename);
        await delay(300);
      }
      showToast(`成功导出 ${imagesToExport.length} 张图片！`, 'success');
    } catch (error) { console.error('Export error:', error); showToast('导出失败，请重试', 'error'); }
    finally { setIsExporting(false); }
  };



  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 flex-col">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-xl text-white font-medium flex items-center gap-2 z-50 animate-fade-in-down ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}>
          {toast.type === 'success' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          )}
          {toast.message}
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-2">{confirmDialog.title}</h3>
            <p className="text-slate-600 mb-6">{confirmDialog.message}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog({ ...confirmDialog, isOpen: false });
                }}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium transition-colors"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Editor Modal */}
      {editingImageId !== null && (() => {
        const editingImage = images.find(img => img.id === editingImageId);
        if (!editingImage) return null;

        return (
          <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
            {/* Editor Header */}
            <div className="h-16 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-6 shrink-0">
              <h2 className="text-lg font-bold text-white">编辑图片</h2>
              <div className="flex gap-3">
                <button
                  onClick={cancelEditing}
                  className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={saveEdits}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors flex items-center gap-2"
                >
                  <Save size={16} />
                  保存
                </button>
              </div>
            </div>

            {/* Editor Toolbar */}
            <div className="h-16 bg-slate-800 border-b border-slate-700 flex items-center px-6 gap-6 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400 font-medium">旋转:</span>
                <button
                  onClick={() => setEditState(prev => ({ ...prev, rotation: (prev.rotation - 90 + 360) % 360 }))}
                  className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                  title="向左旋转90°"
                >
                  <RotateCcw size={18} />
                </button>
                <button
                  onClick={() => setEditState(prev => ({ ...prev, rotation: (prev.rotation + 90) % 360 }))}
                  className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                  title="向右旋转90°"
                >
                  <RotateCw size={18} />
                </button>
                <span className="text-sm text-slate-300 ml-2">{editState.rotation}°</span>
              </div>

              <div className="w-px h-8 bg-slate-700"></div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400 font-medium">翻转:</span>
                <button
                  onClick={() => setEditState(prev => ({ ...prev, flipH: !prev.flipH }))}
                  className={`p-2 rounded-lg transition-colors ${editState.flipH ? 'bg-blue-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
                  title="水平翻转"
                >
                  <FlipHorizontal size={18} />
                </button>
                <button
                  onClick={() => setEditState(prev => ({ ...prev, flipV: !prev.flipV }))}
                  className={`p-2 rounded-lg transition-colors ${editState.flipV ? 'bg-blue-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
                  title="垂直翻转"
                >
                  <FlipVertical size={18} />
                </button>
              </div>
            </div>

            {/* Editor Canvas */}
            <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
              <div
                className="relative"
                style={{
                  transform: `rotate(${editState.rotation}deg) scaleX(${editState.flipH ? -1 : 1}) scaleY(${editState.flipV ? -1 : 1})`,
                  transition: 'transform 0.3s ease',
                  maxWidth: '90%',
                  maxHeight: '90%',
                }}
              >
                <img
                  ref={imgRef}
                  src={editingImage.preview}
                  alt={editingImage.name}
                  className="max-w-full max-h-full object-contain shadow-2xl"
                />
              </div>
            </div>
          </div>
        );
      })()}

      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />

      {/* 顶部署名 - 融入式设计 */}
      <div className="absolute top-4 right-24 z-50">
        <span className="text-xs text-slate-400 font-medium">by 彭摆鱼</span>
      </div>

      <div className="flex flex-1 min-h-0">

        {/* 左侧图片列表 */}
        <div className="w-[300px] bg-white border-r border-slate-200 flex flex-col">
          {/* 头部 */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <ImageIcon size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">图片列表</h1>
                <p className="text-xs text-slate-500">{images.length} 张图片</p>
              </div>
            </div>
          </div>

          {/* 上传进度提示 */}
          {isUploading && (
            <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 shrink-0 fade-in">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-blue-900">正在处理图片...</span>
                    <span className="text-xs text-blue-600">{uploadProgress.current} / {uploadProgress.total}</span>
                  </div>
                  <div className="w-full h-1.5 bg-blue-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 列表区域 */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2" onDrop={handleDrop} onDragOver={handleDragOver}>
            {images.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <ImageIcon size={28} className="text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-600 mb-1">暂无图片</p>
                <p className="text-xs text-slate-400 text-center">点击下方按钮或拖拽上传</p>
              </div>
            ) : (
              images.map(img => (
                <div
                  key={img.id}
                  onClick={() => setSelectedId(img.id)}
                  className={`card card-interactive flex items-center gap-3 p-3 ${selectedId === img.id ? 'active' : ''}`}
                >
                  <div onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={checkedIds.has(img.id)}
                      onChange={() => toggleCheck(img.id)}
                      className="cursor-pointer"
                    />
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                    <img src={img.preview} className="w-full h-full object-cover" alt={img.name} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${selectedId === img.id ? 'text-blue-700' : 'text-slate-900'}`}>
                      {img.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <Clock size={11} /> {img.exif.dateTime?.split(' ')[1] || '--:--'}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(img.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-2 hover:bg-blue-50 rounded-lg transition-all"
                    title="编辑图片"
                  >
                    <CropIcon size={16} className="text-blue-600" />
                  </button>
                </div>
              ))
            )}

            {/* 添加照片按钮 */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full upload-area py-4 flex flex-col items-center justify-center gap-2"
            >
              <Plus size={20} className="text-slate-400" />
              <span className="text-sm font-medium text-slate-600">添加图片</span>
            </button>
          </div>

          {/* 底部操作 */}
          <div className="p-4 border-t border-slate-100 space-y-2 shrink-0 bg-slate-50">
            <div className="flex gap-2">
              <button onClick={toggleAll} disabled={images.length === 0} className="btn btn-secondary flex-1 text-sm">
                <input type="checkbox" checked={images.length > 0 && checkedIds.size === images.length} readOnly className="pointer-events-none" />
                全选
              </button>
              <button onClick={handleDeleteChecked} disabled={checkedIds.size === 0} className="btn btn-ghost">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* 中间画布区域 */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* 顶部工具栏 */}
          <div className="h-16 px-6 flex items-center justify-between bg-white border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600">缩放</span>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => setZoomLevel(Math.max(25, zoomLevel - 25))} className="btn-icon">
                <ZoomOut size={18} />
              </button>
              <div className="px-4 py-1.5 bg-slate-100 rounded-lg">
                <span className="text-sm font-mono font-semibold text-slate-700">{zoomLevel}%</span>
              </div>
              <button onClick={() => setZoomLevel(Math.min(200, zoomLevel + 25))} className="btn-icon">
                <ZoomIn size={18} />
              </button>
              <div className="w-px h-6 bg-slate-200"></div>
              <button onClick={() => setZoomLevel(100)} className="btn btn-secondary text-sm">
                1:1
              </button>
            </div>

            <div className="w-20"></div>
          </div>

          {/* 画布内容 */}
          <div className="flex-1 flex items-center justify-center p-12 overflow-auto custom-scrollbar">
            {selectedImage ? (
              <div
                className="card relative shadow-xl"
                style={{
                  width: selectedImage.width > selectedImage.height ? '700px' : '500px',
                  aspectRatio: `${selectedImage.width}/${selectedImage.height}`,
                  transform: `scale(${zoomLevel / 100})`,
                  transition: 'transform 0.2s ease-out',
                }}
              >
                <img src={selectedImage.preview} className="w-full h-full object-cover rounded-xl select-none" alt="预览" />
                <WatermarkLayer
                  config={config}
                  displayTime={getDisplayTime(selectedImage)}
                  imageWidth={selectedImage.width}
                  imageHeight={selectedImage.height}
                  previewWidth={selectedImage.width > selectedImage.height ? 700 : 500}
                />
                <div className="absolute border-2 border-dashed border-blue-400/40 pointer-events-none rounded-lg"
                  style={{ top: config.marginY, bottom: config.marginY, left: config.marginX, right: config.marginX }}
                />
              </div>
            ) : (
              <div className="text-center">
                <div className="w-24 h-24 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-6">
                  <ImageIcon size={40} className="text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">选择图片开始编辑</h3>
                <p className="text-sm text-slate-500">从左侧列表选择或上传新图片</p>
              </div>
            )}
          </div>
        </div>

        {/* 右侧设置面板 */}
        <div className="w-[360px] bg-white border-l border-slate-200 flex flex-col">
          {/* 头部 */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100 shrink-0">
            <h2 className="text-lg font-bold text-slate-900">水印设置</h2>
            <button
              onClick={() => setConfig({ ...config, scale: 1.0, marginX: 30, marginY: 30 })}
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              重置
            </button>
          </div>

          {/* 设置内容 */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            {/* 外观样式卡片 */}
            <div className="card p-5 space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <Palette size={16} className="text-blue-600" />
                <h3 className="section-header m-0">外观样式</h3>
              </div>

              {/* 整体缩放 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">整体缩放</label>
                  <span className="badge badge-blue">{config.scale}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={config.scale}
                  onChange={e => setConfig({ ...config, scale: parseFloat(e.target.value) })}
                />
              </div>

              {/* 边缘距离 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">边缘距离</label>
                  <span className="badge badge-blue">{config.marginX}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="300"
                  value={config.marginX}
                  onChange={e => setConfig({ ...config, marginX: parseInt(e.target.value), marginY: parseInt(e.target.value) })}
                />
              </div>

              {/* 位置选择 */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-3 block">水印位置</label>
                <div className="grid grid-cols-3 gap-2">
                  {['top-left', 'top-center', 'top-right', 'center-left', 'center', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right'].map(pos => (
                    <button
                      key={pos}
                      onClick={() => setConfig({ ...config, position: pos })}
                      className={`h-10 rounded-lg border-2 transition-all flex items-center justify-center ${config.position === pos
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${config.position === pos ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 字体、颜色和对齐 */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">字体</label>
                    <select value={config.fontFamily} onChange={e => setConfig({ ...config, fontFamily: e.target.value })} className="select-modern text-sm">
                      {fontOptions.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">对齐</label>
                    <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
                      {[
                        { value: 'left', icon: <AlignLeft size={16} /> },
                        { value: 'center', icon: <AlignCenter size={16} /> },
                        { value: 'right', icon: <AlignRight size={16} /> },
                      ].map(align => (
                        <button
                          key={align.value}
                          onClick={() => setConfig({ ...config, textAlign: align.value as any })}
                          className={`flex-1 h-8 rounded flex items-center justify-center transition-all ${config.textAlign === align.value ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                          {align.icon}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">颜色</label>
                  <div className="flex items-center gap-2 mb-2">
                    {['#FFFFFF', '#000000', '#FF0000', '#FFFF00', '#0000FF'].map(color => (
                      <button
                        key={color}
                        onClick={() => setConfig({ ...config, fontColor: color })}
                        className={`w-6 h-6 rounded-full border border-slate-200 shadow-sm ${config.fontColor === color ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="relative">
                    <input
                      type="color"
                      value={config.fontColor}
                      onChange={e => setConfig({ ...config, fontColor: e.target.value })}
                      className="absolute opacity-0 w-full h-full cursor-pointer"
                    />
                    <div className="input-modern flex items-center gap-2 cursor-pointer">
                      <div className="w-5 h-5 rounded border border-slate-200" style={{ backgroundColor: config.fontColor }}></div>
                      <span className="text-xs font-mono text-slate-600">{config.fontColor}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 水印内容卡片 */}
            <div className="card p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Type size={16} className="text-blue-600" />
                <h3 className="section-header m-0">水印内容</h3>
              </div>

              {/* Logo 上传 */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">品牌 Logo</label>
                <div className="upload-area p-4 flex items-center gap-3 relative">
                  <div onClick={() => logoInputRef.current?.click()} className="flex items-center gap-3 flex-1 cursor-pointer">
                    <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                      {config.logo ? (
                        <img src={config.logo} className="w-full h-full object-contain p-1" alt="Logo" />
                      ) : (
                        <Upload size={20} className="text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-700">点击上传</p>
                      <p className="text-xs text-slate-500">支持 PNG 透明背景</p>
                    </div>
                  </div>
                  {config.logo && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfig({ ...config, logo: null });
                      }}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    >
                      <X size={18} />
                    </button>
                  )}
                  <input ref={logoInputRef} type="file" accept="image/png,image/svg+xml" onChange={handleLogoUpload} className="hidden" />
                </div>
              </div>

              {/* 施工区域 */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">施工区域</label>
                <PresetSelector
                  value={config.area}
                  onChange={value => setConfig({ ...config, area: value })}
                  presets={areaPresets}
                  onSavePreset={addAreaPreset}
                  onDeletePreset={deleteAreaPreset}
                  placeholder="例如：二期工程-基坑A区"
                />
              </div>

              {/* 施工内容 */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">施工内容</label>
                <PresetSelector
                  value={config.content}
                  onChange={value => setConfig({ ...config, content: value })}
                  presets={contentPresets}
                  onSavePreset={addContentPreset}
                  onDeletePreset={deleteContentPreset}
                  placeholder="例如：土方开挖与支护作业"
                  isTextarea={true}
                />
              </div>

              {/* 拍摄时间 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">拍摄时间</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.useExifTime}
                      onChange={e => setConfig({ ...config, useExifTime: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs text-slate-500">使用原图时间</span>
                  </label>
                </div>
                <select
                  value={config.timeFormat}
                  onChange={e => setConfig({ ...config, timeFormat: e.target.value })}
                  className="select-modern text-sm mb-2"
                >
                  {timeFormats.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <input
                  type={config.timeFormat.includes('HH:mm:ss') ? 'datetime-local' : 'datetime-local'}
                  value={formatTimeForInput(config.customTime)}
                  onChange={e => setConfig({
                    ...config,
                    customTime: formatTimeFromInput(e.target.value, config.timeFormat),
                    useExifTime: false // 修改时间时自动关闭EXIF时间
                  })}
                  className={`input-modern text-sm ${config.useExifTime ? 'opacity-50' : ''}`}
                  step={config.timeFormat.includes('ss') ? '1' : '60'}
                />
              </div>
            </div>

            {/* 导出设置卡片 */}
            <div className="card p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Download size={16} className="text-blue-600" />
                <h3 className="section-header m-0">导出设置</h3>
              </div>

              {/* 图片格式 */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">图片格式</label>
                <select
                  value={config.exportFormat}
                  onChange={e => setConfig({ ...config, exportFormat: e.target.value as any })}
                  className="select-modern text-sm"
                >
                  <option value="jpeg">JPEG (更小文件)</option>
                  <option value="png">PNG (无损)</option>
                  <option value="webp">WebP (推荐)</option>
                </select>
              </div>

              {/* 图片质量 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">图片质量</label>
                  <span className="badge badge-blue">{Math.round(config.exportQuality * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.0"
                  step="0.05"
                  value={config.exportQuality}
                  onChange={e => setConfig({ ...config, exportQuality: parseFloat(e.target.value) })}
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>较小文件</span>
                  <span>最佳质量</span>
                </div>
              </div>
            </div>
          </div>

          {/* 底部导出按钮 */}
          <div className="p-6 border-t border-slate-100 shrink-0 bg-slate-50">
            <button
              onClick={handleBatchExport}
              disabled={checkedIds.size === 0 || isExporting}
              className="btn btn-primary w-full py-3 text-base font-semibold"
            >
              {isExporting ? (
                '导出中...'
              ) : (
                <>
                  <Download size={20} />
                  批量导出 ({checkedIds.size})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 水印层组件
function WatermarkLayer({ config, displayTime, imageWidth, imageHeight, previewWidth }: {
  config: WatermarkConfig;
  displayTime: string;
  imageWidth: number;
  imageHeight: number;
  previewWidth: number;
}) {
  const getAbsolutePosition = (pos: string, marginX: number, marginY: number) => {
    const style: React.CSSProperties = { position: 'absolute' };
    if (pos.includes('top')) style.top = `${marginY}px`;
    else if (pos.includes('bottom')) style.bottom = `${marginY}px`;
    else style.top = '50%';

    if (pos.includes('left')) style.left = `${marginX}px`;
    else if (pos.includes('right')) style.right = `${marginX}px`;
    else style.left = '50%';

    let transformX = 0, transformY = 0;
    if (pos === 'center' || (!pos.includes('left') && !pos.includes('right'))) transformX = -50;
    if (pos === 'center' || (!pos.includes('top') && !pos.includes('bottom'))) transformY = -50;

    style.transform = `translate(${transformX}%, ${transformY}%)`;
    style.transformOrigin = pos.includes('left') ? 'left center' : pos.includes('right') ? 'right center' : 'center center';
    if (pos.includes('top')) style.transformOrigin = (style.transformOrigin as string).replace('center', 'top');
    if (pos.includes('bottom')) style.transformOrigin = (style.transformOrigin as string).replace('center', 'bottom');

    return style;
  };

  // Calculate preview scale ratio
  const previewScale = previewWidth / imageWidth;

  // Calculate adaptive ratio (same as in watermarkGenerator)
  const refSize = 1000;
  const currentSize = Math.min(imageWidth, imageHeight);
  const ratio = Math.max(0.5, currentSize / refSize);

  // Apply config.scale ONLY to font size and logo, NOT to margin
  // Margin should be absolute relative to image size
  const actualFontSize = config.fontSize * config.scale * ratio * previewScale;
  const actualMarginX = config.marginX * previewScale; // Removed config.scale
  const actualMarginY = config.marginY * previewScale; // Removed config.scale
  const actualLogoHeight = 40 * config.scale * ratio * previewScale;

  return (
    <div
      className="flex flex-col gap-1 pointer-events-none select-none z-10"
      style={{
        ...getAbsolutePosition(config.position, actualMarginX, actualMarginY),
        textAlign: config.textAlign,
        alignItems: config.textAlign === 'left' ? 'flex-start' : config.textAlign === 'right' ? 'flex-end' : 'center',
        color: config.fontColor,
        fontFamily: config.fontFamily,
        textShadow: config.textShadow ? '0px 2px 8px rgba(0,0,0,0.6), 0px 1px 2px rgba(0,0,0,0.8)' : 'none',
        whiteSpace: 'nowrap',
        fontSize: `${actualFontSize}px`,
        lineHeight: '1.5',
      }}
    >
      {config.logo && <img src={config.logo} style={{ height: `${actualLogoHeight}px` }} className="w-auto mb-2 object-contain" alt="Logo" />}
      {config.area && <div className="font-semibold">施工区域：{config.area}</div>}
      {config.content && <div className="font-semibold">施工内容：{config.content}</div>}
      <div className="font-semibold">拍摄时间：{displayTime}</div>
      {config.customItems.map(item => item.value && (
        <div key={item.id} className="font-semibold">{item.label}：{item.value}</div>
      ))}
    </div>
  );
}
