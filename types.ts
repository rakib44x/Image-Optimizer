
export interface OptimizationSettings {
  quality: number; // 0.01 to 1
  resizePercentage: number; // 25, 50, 80, 100
}

export interface ImageFile {
  id: string;
  originalFile: File;
  originalUrl: string;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  optimizedFile: File | null;
  optimizedUrl: string | null;
  optimizedSize: number | null;
  isProcessing: boolean;
  error: string | null;
  status?: 'optimized' | 'skipped';
}
