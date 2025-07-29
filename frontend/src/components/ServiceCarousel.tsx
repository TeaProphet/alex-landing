import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MediaItem {
  url: string;
  type: 'image' | 'video';
  alternativeText?: string;
}

interface ServiceCarouselProps {
  media: MediaItem[];
  className?: string;
  textSectionHeight: number;
}

// Utility function to detect if URL is a video
const isVideoUrl = (url: string): boolean => {
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
  const videoMimeTypes = ['video/', 'application/mp4'];
  
  // Check file extension
  const hasVideoExtension = videoExtensions.some(ext => 
    url.toLowerCase().includes(ext)
  );
  
  // Check if it's a video URL pattern (YouTube, Vimeo, etc.)
  const isVideoService = /(?:youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com)/i.test(url);
  
  return hasVideoExtension || isVideoService;
};

// Convert legacy images array to media items
const convertImagesToMedia = (images: string[]): MediaItem[] => {
  return images.map(url => ({
    url,
    type: isVideoUrl(url) ? 'video' : 'image' as const
  }));
};

export const ServiceCarousel = ({ media: propMedia, className = '', textSectionHeight }: ServiceCarouselProps) => {
  // Support backward compatibility with images prop
  const media = Array.isArray(propMedia) && typeof propMedia[0] === 'string' 
    ? convertImagesToMedia(propMedia as unknown as string[])
    : propMedia;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [containerHeight, setContainerHeight] = useState(400);

  const nextMedia = () => {
    setCurrentIndex((prev) => (prev + 1) % media.length);
  };

  const prevMedia = () => {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
  };

  useEffect(() => {
    const calculateHeight = async () => {
      if (media.length === 0) return;

      const mediaHeights: number[] = [];
      const viewportWidth = window.innerWidth * 0.5;
      
      // Calculate height for each media item when width is 50vw
      for (const mediaItem of media) {
        try {
          if (mediaItem.type === 'video') {
            // For videos, use a standard 16:9 aspect ratio as default
            const calculatedHeight = viewportWidth / (16/9);
            mediaHeights.push(calculatedHeight);
          } else {
            // For images, calculate based on actual dimensions
            const height = await new Promise<number>((resolve) => {
              const img = new Image();
              img.onload = () => {
                const aspectRatio = img.width / img.height;
                const calculatedHeight = viewportWidth / aspectRatio;
                resolve(calculatedHeight);
              };
              img.onerror = () => resolve(viewportWidth / 1.5); // fallback height
              img.src = mediaItem.url;
            });
            mediaHeights.push(height);
          }
        } catch {
          mediaHeights.push(viewportWidth / 1.5); // fallback height
        }
      }
      
      // Calculate medium (average) height of all media items
      const averageHeight = mediaHeights.reduce((sum, height) => sum + height, 0) / mediaHeights.length;
      
      // Use the larger of average height or text section height
      let finalHeight = Math.max(averageHeight, textSectionHeight || 0);
      
      // Apply reasonable bounds
      finalHeight = Math.max(400, Math.min(800, finalHeight));
      
      setContainerHeight(finalHeight);
    };

    calculateHeight();
  }, [media, textSectionHeight]);

  return (
    <div 
      className={`relative w-full overflow-hidden ${className}`}
      style={{ height: `${containerHeight}px` }}
    >
      {media[currentIndex]?.type === 'video' ? (
        <video 
          src={media[currentIndex].url}
          className="w-full h-full object-cover transition-all duration-500"
          controls
          preload="metadata"
          playsInline
          muted
          aria-label={media[currentIndex].alternativeText || `Видео услуги ${currentIndex + 1} - персональные тренировки и консультации с фитнес тренером`}
        />
      ) : (
        <img 
          src={media[currentIndex]?.url} 
          alt={media[currentIndex]?.alternativeText || `Фото услуги ${currentIndex + 1} - персональные тренировки и консультации с фитнес тренером`}
          className="w-full h-full object-cover transition-all duration-500"
          loading="lazy"
          decoding="async"
        />
      )}
      
      {media.length > 1 && (
        <>
          <button
            onClick={prevMedia}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-smooth z-10"
            aria-label="Предыдущее медиа"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={nextMedia}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-smooth z-10"
            aria-label="Следующее медиа"
          >
            <ChevronRight size={20} />
          </button>
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {media.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2.5 h-2.5 rounded-full transition-smooth ${
                  index === currentIndex ? 'bg-white shadow-lg' : 'bg-white/60 hover:bg-white/80'
                }`}
                aria-label={`Перейти к медиа ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};