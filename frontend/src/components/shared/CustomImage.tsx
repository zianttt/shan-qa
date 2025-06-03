import React, { useState, useEffect } from 'react';
import { useChatContext } from '../../context/ChatContext';
import { X } from 'lucide-react';

interface CustomImageProps {
  s3Key: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  onError?: () => void;
}

const CustomImage: React.FC<CustomImageProps> = ({ 
  s3Key, 
  alt, 
  className, 
  fallbackSrc = "/images/placeholder.png",
  onError 
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const chatContext = useChatContext();

  useEffect(() => {
    const loadSignedUrl = async () => {
      if (!s3Key || !chatContext) {
        setHasError(true);
        setIsLoading(false);
        return;
      }

      try {
        const signedUrl = await chatContext.getSignedUrl(s3Key);
        if (signedUrl) {
          setImageUrl(signedUrl);
          setHasError(false);
        } else {
          setHasError(true);
          onError?.();
        }
      } catch (error) {
        console.error('Error loading signed URL:', error);
        setHasError(true);
        onError?.();
      } finally {
        setIsLoading(false);
      }
    };

    loadSignedUrl();
  }, [s3Key, chatContext, onError]);

  const handleImageError = () => {
    setHasError(true);
    setIsLoading(false);
    onError?.();
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageClick = () => {
    if (imageUrl && !hasError) {
      setIsModalOpen(true);
    }
  };

  // Show loading state with modern skeleton
  if (isLoading) {
    return (
      <div className={`relative overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl border border-slate-200/50 ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
        <div className="flex items-center justify-center h-full min-h-[120px]">
          <div className="text-center p-6">
            <div className="relative">
              <div className="w-8 h-8 border-3 border-slate-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-3"></div>
              <div className="absolute inset-0 w-8 h-8 border-3 border-transparent border-t-blue-300 rounded-full animate-ping mx-auto opacity-20"></div>
            </div>
            <p className="text-xs font-medium text-slate-500">Loading image...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state with modern design
  if (hasError || !imageUrl) {
    return (
      <div className={`bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center ${className}`}>
        <div className="text-center p-6">
          <div className="w-12 h-12 bg-gradient-to-r from-slate-400 to-slate-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-600 mb-1">Image unavailable</p>
          <p className="text-xs text-slate-400">Failed to load content</p>
        </div>
      </div>
    );
  }

  // Show the actual image with modern styling
  return (
    <>
      <div className={`relative group overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ${className}`}>
        <img
          src={imageUrl}
          alt={alt}
          className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
          onError={handleImageError}
          onLoad={handleImageLoad}
          onClick={handleImageClick}
        />
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg">
            <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
        </div>

        {/* Loading indicator overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Modal for full-size image */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white text-slate-700 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
            >
              <X size={20} />
            </button>
            <img
              src={imageUrl}
              alt={alt}
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default CustomImage;