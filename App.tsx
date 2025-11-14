
import React, { useState, useCallback, useRef, useEffect, FC } from 'react';
import { OptimizationSettings, ImageFile } from './types';

// For TypeScript to recognize the library from the CDN
declare const imageCompression: any;

// --- UTILITY FUNCTIONS ---
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = (err) => reject(err);
    img.src = url;
  });
};


// --- SVG ICONS ---
const UploadIcon: FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || 'w-6 h-6'}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);

const DownloadIcon: FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || 'w-6 h-6'}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

const CompareIcon: FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || 'w-6 h-6'}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
    </svg>
  );

const CloseIcon: FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || 'w-6 h-6'}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const Spinner: FC = () => (
  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-200"></div>
);

const FacebookIcon: FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className || 'w-6 h-6'}>
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
    </svg>
);
  
const LinkedInIcon: FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className || 'w-6 h-6'}>
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
);
  
const InstagramIcon: FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className || 'w-6 h-6'}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.85s-.011 3.584-.069 4.85c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.584-.012-4.85-.07c-3.252-.148-4.771-1.691-4.919-4.919-.058-1.265-.069-1.645-.069-4.85s.011-3.584.069-4.85c.149-3.225 1.664-4.771 4.919-4.919 1.266-.057 1.644-.069 4.85-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.667-.014 4.947-.072c4.358-.2 6.78-2.618 6.98-6.98.059-1.281.073-1.689.073-4.948s-.014-3.667-.072-4.947c-.2-4.358-2.618-6.78-6.98-6.98-1.281-.059-1.689-.073-4.948-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.79 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.441 1.441 1.441 1.441-.645 1.441-1.441-.645-1.44-1.441-1.44z" />
    </svg>
);


// --- UI COMPONENTS ---

interface ImageUploaderProps {
  onFilesSelected: (files: FileList) => void;
}
const ImageUploader: FC<ImageUploaderProps> = ({ onFilesSelected }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
    }
  };

  return (
    <div 
      onDragEnter={handleDrag} 
      onDragLeave={handleDrag} 
      onDragOver={handleDrag} 
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`w-full p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ${isDragging ? 'border-sky-400 bg-sky-900/50' : 'border-slate-600 hover:border-sky-500 hover:bg-slate-800'}`}
    >
      <input 
        ref={inputRef}
        type="file" 
        multiple 
        accept="image/*" 
        className="hidden" 
        onChange={handleChange}
      />
      <div className="flex flex-col items-center justify-center space-y-4 text-slate-400">
        <UploadIcon className="w-12 h-12" />
        <p className="text-lg font-semibold">Drop images here or click to browse</p>
        <p className="text-sm">Supports bulk upload</p>
      </div>
    </div>
  );
};

interface SettingsPanelProps {
  settings: OptimizationSettings;
  onSettingsChange: (newSettings: OptimizationSettings) => void;
  onOptimizeAll: () => void;
  onClearAll: () => void;
  isProcessing: boolean;
  imageCount: number;
  allowLargeBulk: boolean;
  onAllowLargeBulkChange: (allowed: boolean) => void;
}
const SettingsPanel: FC<SettingsPanelProps> = ({ settings, onSettingsChange, onOptimizeAll, onClearAll, isProcessing, imageCount, allowLargeBulk, onAllowLargeBulkChange }) => {
  const resizeOptions = [100, 80, 50, 25];
  const BULK_LIMIT = 20;
  const showWarning = imageCount > BULK_LIMIT;

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-sky-400">Optimization Settings</h2>
      
      <div className="space-y-6">
        <div>
          <label htmlFor="quality" className="block text-sm font-medium text-slate-300 mb-2">Quality: {Math.round(settings.quality * 100)}%</label>
          <input
            type="range"
            id="quality"
            min="0.01"
            max="1"
            step="0.01"
            value={settings.quality}
            onChange={(e) => onSettingsChange({ ...settings, quality: parseFloat(e.target.value) })}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
          />
        </div>

        <div>
            <h3 className="text-sm font-medium text-slate-300 mb-2">Resize (maintains aspect ratio)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {resizeOptions.map(opt => (
                <button
                key={opt}
                onClick={() => onSettingsChange({ ...settings, resizePercentage: opt })}
                className={`px-3 py-2 text-sm font-semibold rounded-md transition-colors ${settings.resizePercentage === opt ? 'bg-sky-500 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}
                >
                {opt}%
                </button>
            ))}
            </div>
        </div>

        <div>
            <h3 className="text-sm font-medium text-slate-300 mb-2">Output Format</h3>
            <div className="bg-slate-700 text-sky-400 font-bold p-2 rounded-md text-center">
                WEBP
            </div>
             <p className="text-xs text-slate-500 mt-1">All images will be converted to the modern WebP format for best performance.</p>
        </div>
      </div>

      {showWarning && (
        <div className="mt-6 p-4 bg-yellow-900/50 border border-yellow-700 rounded-lg text-yellow-300 text-sm space-y-3">
            <p className="font-bold">⚠️ High Resource Usage Warning</p>
            <p>Optimizing more than {BULK_LIMIT} images at once can be memory-intensive and may cause your browser to slow down or crash.</p>
            <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                    type="checkbox"
                    checked={allowLargeBulk}
                    onChange={(e) => onAllowLargeBulkChange(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-700 border-slate-500 text-sky-500 focus:ring-sky-500"
                />
                <span>I understand the risk and want to proceed.</span>
            </label>
        </div>
      )}

      <button
        onClick={onOptimizeAll}
        disabled={isProcessing || imageCount === 0 || (showWarning && !allowLargeBulk)}
        className="mt-8 w-full bg-sky-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2"
      >
        {isProcessing ? <Spinner /> : <UploadIcon className="w-5 h-5" />}
        <span>{isProcessing ? 'Optimizing...' : `Optimize ${imageCount} Image${imageCount !== 1 ? 's' : ''}`}</span>
      </button>

      {imageCount > 0 && (
          <button
              onClick={onClearAll}
              className="w-full mt-4 text-sm font-medium border border-slate-600 text-slate-400 rounded-lg py-2 hover:bg-red-900/50 hover:text-red-400 hover:border-red-800 transition-colors"
          >
              Clear All ({imageCount} images)
          </button>
      )}
    </div>
  );
};


interface ImageCardProps {
    imageFile: ImageFile;
    onDownload: (image: ImageFile) => void;
    onCompare: (image: ImageFile) => void;
    onClear: (id: string) => void;
}
const ImageCard: FC<ImageCardProps> = ({ imageFile, onDownload, onCompare, onClear }) => {
    const reduction = imageFile.originalSize && imageFile.optimizedSize
        ? ((imageFile.originalSize - imageFile.optimizedSize) / imageFile.originalSize) * 100
        : 0;

    return (
        <div className="bg-slate-800 rounded-lg overflow-hidden shadow-lg transform hover:scale-[1.02] transition-transform duration-300 relative group">
            <button
                onClick={() => onClear(imageFile.id)}
                className="absolute top-2 right-2 z-20 p-1 bg-slate-900/50 rounded-full text-slate-400 hover:bg-red-500 hover:text-white transition-all scale-0 group-hover:scale-100 duration-200"
                title="Remove Image"
            >
                <CloseIcon className="w-4 h-4" />
            </button>
            {imageFile.isProcessing && (
                <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center z-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-200"></div>
                </div>
            )}
            <div className="grid grid-cols-2 gap-px bg-slate-700">
                <div className="bg-slate-800 p-2">
                    <img src={imageFile.originalUrl} alt="Original" className="w-full h-32 object-contain"/>
                    <div className="text-center mt-2">
                        <p className="text-xs text-slate-400">Original</p>
                        <p className="text-sm font-semibold">{formatBytes(imageFile.originalSize)}</p>
                    </div>
                </div>
                <div className="bg-slate-800 p-2">
                    {imageFile.optimizedUrl ? (
                         <img src={imageFile.optimizedUrl} alt="Optimized" className="w-full h-32 object-contain"/>
                    ) : (
                        <div className="w-full h-32 flex items-center justify-center bg-slate-700/50 rounded-md">
                            <p className="text-slate-500 text-sm">Awaiting optimization</p>
                        </div>
                    )}
                    <div className="text-center mt-2">
                        <p className="text-xs text-slate-400">Optimized</p>
                         {imageFile.status === 'skipped' ? (
                            <p className="text-sm font-semibold text-sky-400">Skipped</p>
                        ) : (
                            <p className={`text-sm font-semibold ${reduction > 0 ? 'text-green-400' : ''}`}>
                                {imageFile.optimizedSize ? formatBytes(imageFile.optimizedSize) : '-'}
                            </p>
                        )}
                    </div>
                </div>
            </div>
            <div className="p-3">
                 <p className="text-xs truncate text-slate-400" title={imageFile.originalFile.name}>{imageFile.originalFile.name}</p>
                 <div className="mt-2 text-center h-7 flex items-center justify-center">
                    {imageFile.status === 'skipped' ? (
                        <p className="text-base font-semibold text-slate-400">
                            Under 100KB
                        </p>
                    ) : imageFile.optimizedSize ? (
                        <p className="text-lg font-bold text-green-400">
                            {reduction.toFixed(1)}% Smaller
                        </p>
                    ) : null}
                </div>

                {imageFile.error && <p className="text-xs text-red-400 mt-2">{imageFile.error}</p>}
                <div className="flex justify-between items-center mt-4">
                    <button 
                        onClick={() => onCompare(imageFile)}
                        disabled={!imageFile.optimizedUrl}
                        className="p-2 rounded-full bg-slate-700 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Compare Before & After"
                    >
                        <CompareIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => onDownload(imageFile)}
                        disabled={!imageFile.optimizedFile}
                        className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold bg-sky-600 rounded-md hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                    >
                        <DownloadIcon className="w-4 h-4" />
                        <span>Download</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

interface ComparisonModalProps {
    image: ImageFile | null;
    onClose: () => void;
}
const ComparisonModal: FC<ComparisonModalProps> = ({ image, onClose }) => {
    const [sliderPos, setSliderPos] = useState(50);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    const handleMove = useCallback((clientX: number) => {
        if (!isDragging.current || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        let percentage = (x / rect.width) * 100;
        if (percentage < 0) percentage = 0;
        if (percentage > 100) percentage = 100;
        setSliderPos(percentage);
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        isDragging.current = true;
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        e.stopPropagation();
        isDragging.current = true;
    };
    
    const handleMouseUp = () => { isDragging.current = false; };
    const handleTouchEnd = () => { isDragging.current = false; };
    
    const handleMouseMove = useCallback((e: globalThis.MouseEvent) => handleMove(e.clientX),[handleMove]);
    const handleTouchMove = useCallback((e: globalThis.TouchEvent) => handleMove(e.touches[0].clientX),[handleMove]);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('touchmove', handleTouchMove);
        window.addEventListener('touchend', handleTouchEnd);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [handleMouseMove, handleTouchMove]);
    
    if (!image || !image.optimizedUrl) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm" onClick={onClose}>
            <div className="relative w-[90vw] h-[80vh] max-w-6xl" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute -top-10 right-0 text-white z-50 p-2 bg-slate-800 rounded-full hover:bg-sky-500">
                    <CloseIcon className="w-6 h-6"/>
                </button>
                <div 
                    ref={containerRef} 
                    className="relative w-full h-full select-none overflow-hidden rounded-lg shadow-2xl bg-slate-900"
                >
                    <img src={image.originalUrl} alt="Original" className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none" />
                    
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
                         <img src={image.optimizedUrl} alt="Optimized" className="absolute top-0 left-0 w-full h-full object-contain"/>
                    </div>
                    
                    <div 
                        className="absolute top-0 bottom-0 w-1 cursor-ew-resize group" 
                        style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
                        onMouseDown={handleMouseDown}
                        onTouchStart={handleTouchStart}
                    >
                        <div className="absolute top-0 bottom-0 -left-1 -right-1 group-hover:bg-white/10 transition-colors"></div>
                        <div className="absolute top-0 bottom-0 w-full bg-white/50 transition-colors group-hover:bg-white"></div>
                        <div className="absolute top-1/2 -translate-y-1/2 -left-4 bg-white rounded-full p-1 shadow-md transition-transform group-hover:scale-110">
                           <CompareIcon className="w-6 h-6 text-slate-900" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Footer = () => (
    <footer className="bg-slate-800/50 text-slate-400 py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
            <p className="text-sm">
                Image Optimizer Pro by <a href="https://rirakeeb.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-sky-400 hover:underline">Rakibul Islam</a>
            </p>
            <p className="text-sm mt-2">Made with ❤️ for the community. Totally free to use.</p>
            <div className="flex justify-center space-x-6 mt-4">
                <a href="https://www.facebook.com/rirakeeb" target="_blank" rel="noopener noreferrer" className="hover:text-sky-400 transition-colors" aria-label="Facebook"><FacebookIcon /></a>
                <a href="https://www.linkedin.com/in/rirakeeb" target="_blank" rel="noopener noreferrer" className="hover:text-sky-400 transition-colors" aria-label="LinkedIn"><LinkedInIcon /></a>
                <a href="https://www.instagram.com/rirakeeb" target="_blank" rel="noopener noreferrer" className="hover:text-sky-400 transition-colors" aria-label="Instagram"><InstagramIcon /></a>
            </div>
        </div>
    </footer>
);


// --- APP COMPONENT ---

export default function App() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [settings, setSettings] = useState<OptimizationSettings>({ quality: 0.80, resizePercentage: 25 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [comparingImage, setComparingImage] = useState<ImageFile | null>(null);
  const [allowLargeBulk, setAllowLargeBulk] = useState(false);

  const handleFileSelection = useCallback(async (files: FileList) => {
    const newImageFiles: ImageFile[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const url = URL.createObjectURL(file);
      const { width, height } = await getImageDimensions(url);
      newImageFiles.push({
        id: crypto.randomUUID(),
        originalFile: file,
        originalUrl: url,
        originalSize: file.size,
        originalWidth: width,
        originalHeight: height,
        optimizedFile: null,
        optimizedUrl: null,
        optimizedSize: null,
        isProcessing: false,
        error: null,
      });
    }
    setImages(prev => [...prev, ...newImageFiles]);
  }, []);

  const optimizeImage = useCallback(async (image: ImageFile, currentSettings: OptimizationSettings): Promise<Partial<ImageFile>> => {
      // Skip optimization for images already under 100KB
      if (image.originalFile.size < 100 * 1024) {
        return {
          optimizedFile: image.originalFile,
          optimizedUrl: image.originalUrl,
          optimizedSize: image.originalSize,
          status: 'skipped',
          error: null,
        };
      }
      
      try {
        const options = {
            maxSizeMB: 20, // High limit, quality is the main factor
            maxWidthOrHeight: (Math.max(image.originalWidth, image.originalHeight) * currentSettings.resizePercentage) / 100,
            useWebWorker: true,
            initialQuality: currentSettings.quality,
            fileType: 'image/webp',
        };

        const compressedFile = await imageCompression(image.originalFile, options);
        const optimizedUrl = URL.createObjectURL(compressedFile);

        return {
            optimizedFile: compressedFile,
            optimizedUrl: optimizedUrl,
            optimizedSize: compressedFile.size,
            status: 'optimized',
            error: null,
        };
      } catch (error) {
        console.error('Compression error:', error);
        return { error: 'Failed to optimize image.' };
      }
  }, []);

  const handleOptimizeAll = useCallback(async () => {
    setIsProcessing(true);
    const currentSettings = { ...settings }; // Capture settings at the start

    const imagesToProcess = images.filter(img => !img.optimizedFile);

    for (const image of imagesToProcess) {
        // Set individual processing state
        setImages(prev => prev.map(img => img.id === image.id ? { ...img, isProcessing: true, error: null } : img));

        const optimizedData = await optimizeImage(image, currentSettings);

        // Update individual image with result
        setImages(prev => prev.map(img => {
            if (img.id === image.id) {
                return { ...img, ...optimizedData, isProcessing: false };
            }
            return img;
        }));
    }

    setIsProcessing(false);
  }, [images, settings, optimizeImage]);

  const handleDownload = (image: ImageFile) => {
    if (!image.optimizedFile || !image.optimizedUrl) return;
    const link = document.createElement('a');
    link.href = image.optimizedUrl;
    const nameParts = image.originalFile.name.split('.');
    nameParts.pop(); // remove original extension
    link.download = `${nameParts.join('.')}.webp`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearImage = useCallback((id: string) => {
    setImages(prev => prev.filter(image => {
        if (image.id === id) {
            URL.revokeObjectURL(image.originalUrl);
            if (image.optimizedUrl) {
                URL.revokeObjectURL(image.optimizedUrl);
            }
            return false;
        }
        return true;
    }));
  }, []);

  const handleClearAll = useCallback(() => {
    images.forEach(image => {
        URL.revokeObjectURL(image.originalUrl);
        if (image.optimizedUrl) {
            URL.revokeObjectURL(image.optimizedUrl);
        }
    });
    setImages([]);
    setAllowLargeBulk(false);
  }, [images]);
  
  // Cleanup object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
        images.forEach(image => {
            URL.revokeObjectURL(image.originalUrl);
            if (image.optimizedUrl) {
                URL.revokeObjectURL(image.optimizedUrl);
            }
        });
    };
  }, []); // Run only on unmount

  return (
    <div className="min-h-screen bg-slate-900 font-sans flex flex-col">
      <header className="bg-slate-800/50 backdrop-blur-lg sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4 flex items-center space-x-3">
          <img src="https://picsum.photos/40/40?grayscale" alt="logo" className="rounded-full" />
          <h1 className="text-2xl font-bold text-white tracking-wide">Image Optimizer <span className="text-sky-400">Pro by Rakib</span></h1>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <SettingsPanel 
                settings={settings} 
                onSettingsChange={setSettings} 
                onOptimizeAll={handleOptimizeAll}
                onClearAll={handleClearAll}
                isProcessing={isProcessing}
                imageCount={images.filter(img => !img.optimizedFile).length}
                allowLargeBulk={allowLargeBulk}
                onAllowLargeBulkChange={setAllowLargeBulk}
            />
          </div>
          <div className="lg:col-span-2">
            {images.length === 0 ? (
                <ImageUploader onFilesSelected={handleFileSelection} />
            ) : (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {images.map(image => (
                            <ImageCard 
                                key={image.id} 
                                imageFile={image}
                                onDownload={handleDownload}
                                onCompare={setComparingImage}
                                onClear={handleClearImage}
                            />
                        ))}
                    </div>
                    <div className="pt-4">
                      <ImageUploader onFilesSelected={handleFileSelection} />
                    </div>
                </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
      <ComparisonModal image={comparingImage} onClose={() => setComparingImage(null)} />
    </div>
  );
}
