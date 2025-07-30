import { useState, useEffect, useMemo } from 'react';
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


export const ServiceCarousel = ({ media, className = '', textSectionHeight }: ServiceCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [containerHeight, setContainerHeight] = useState(400);

  const nextMedia = () => {
    setCurrentIndex((prev) => (prev + 1) % media.length);
  };

  const prevMedia = () => {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
  };

  // Memoize the media URLs to prevent recalculation when only textSectionHeight changes
  const mediaUrls = useMemo(() => media.map(m => m.url).join(','), [media]);

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
            // For images, use default aspect ratio instead of loading them
            // This prevents unnecessary image requests during scroll
            const calculatedHeight = viewportWidth / 1.5; // Default 3:2 aspect ratio
            mediaHeights.push(calculatedHeight);
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
  }, [mediaUrls, textSectionHeight]);

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
          onError={(e) => {
            console.error('Video loading error:', e, 'URL:', media[currentIndex].url);
          }}
          onLoadStart={() => {
            console.log('Video loading started:', media[currentIndex].url);
          }}
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