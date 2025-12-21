import React, { useRef, useState } from 'react';
import { Upload, CheckCircle, Loader2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { taskService, UploadResult } from '../services/taskService';

interface FileUploaderProps {
  onUploadComplete: (result: UploadResult) => void;
  onError?: (error: string) => void;
  className?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ 
  onUploadComplete, 
  onError,
  className = '' 
}) => {
  const { theme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // Mock progress for now as fetch doesn't support it easily
  const [lastUploadedFile, setLastUploadedFile] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    // Basic validation
    if (file.size > 10 * 1024 * 1024) { // 10MB
      const errorMsg = 'File size exceeds 10MB limit.';
      onError?.(errorMsg);
      alert(errorMsg);
      return;
    }

    setIsUploading(true);
    setUploadProgress(10); // Start progress

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await taskService.uploadFile(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        setLastUploadedFile(response.data.file.name);
        onUploadComplete(response.data);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      const errorMsg = error instanceof Error ? error.message : 'Upload failed';
      onError?.(errorMsg);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000); // Reset progress after delay
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200 ${
          isDragging 
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
            : theme === 'dark' ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
        } ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden" 
          onChange={handleFileSelect}
          // Accept commonly used types
          accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,image/*,.mp3,.mp4"
        />

        {isUploading ? (
          <div className="flex flex-col items-center justify-center py-2">
            <Loader2 className={`animate-spin mb-2 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`} size={32} />
            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Uploading... {uploadProgress}%
            </p>
            <div className="w-full h-2 bg-gray-200 rounded-full mt-2 overflow-hidden dark:bg-gray-600">
              <div 
                className="h-full bg-indigo-500 transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        ) : lastUploadedFile ? (
            <div className="flex flex-col items-center justify-center py-2">
                <CheckCircle className="text-green-500 mb-2" size={32} />
                 <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                   {lastUploadedFile} uploaded!
                 </p>
                 <button
                    type="button"
                    onClick={() => {
                        setLastUploadedFile(null);
                        fileInputRef.current?.click();
                    }}
                    className={`mt-2 text-xs hover:underline ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}
                 >
                    Upload another?
                 </button>
            </div>
        ) : (
          <div 
             className="cursor-pointer"
             onClick={() => fileInputRef.current?.click()}
          >
            <Upload 
              className={`mx-auto mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} 
              size={32} 
            />
            <p className={`text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
              Click to upload or drag and drop
            </p>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Documents, Images, Audio, Video (max 10MB)
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
