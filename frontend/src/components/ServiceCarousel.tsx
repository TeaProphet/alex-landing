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
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isAnimatingSwipe, setIsAnimatingSwipe] = useState(false);
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  // Helper to get container width
  const getContainerWidth = () => containerRef?.offsetWidth || 400;

  const nextMedia = () => {
    if (isTransitioning || media.length <= 1) return;
    
    setIsTransitioning(true);
    setIsAnimatingSwipe(true);
    
    // Get container width for smooth animation
    const containerWidth = getContainerWidth();
    
    // Animate out current image
    setDragOffset(-containerWidth);
    
    // After animation, change image and reset
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % media.length);
      setDragOffset(0);
      setIsAnimatingSwipe(false);
      
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 300);
  };

  const prevMedia = () => {
    if (isTransitioning || media.length <= 1) return;
    
    setIsTransitioning(true);
    setIsAnimatingSwipe(true);
    
    // Get container width for smooth animation
    const containerWidth = getContainerWidth();
    
    // Animate out current image
    setDragOffset(containerWidth);
    
    // After animation, change image and reset
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
      setDragOffset(0);
      setIsAnimatingSwipe(false);
      
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 300);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (isTransitioning || media.length <= 1) return;
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
    setIsDragging(true);
    setDragOffset(0);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !touchStart || isTransitioning || media.length <= 1) return;
    
    const currentX = e.targetTouches[0].clientX;
    const diff = currentX - touchStart;
    
    // Limit drag distance to container width
    const containerWidth = e.currentTarget.offsetWidth;
    const maxDrag = containerWidth * 0.8; // Allow dragging up to 80% of container width
    const clampedDiff = Math.max(-maxDrag, Math.min(maxDrag, diff));
    
    setDragOffset(clampedDiff);
    setTouchEnd(currentX);
  };

  const onTouchEnd = () => {
    if (!isDragging || !touchStart || isTransitioning || media.length <= 1) return;
    
    setIsDragging(false);
    
    if (!touchEnd) {
      setDragOffset(0);
      return;
    }
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe || isRightSwipe) {
      // Start swipe animation
      setIsAnimatingSwipe(true);
      setIsTransitioning(true);
      
      // Animate to the final position first
      const containerWidth = getContainerWidth();
      
      const finalOffset = isLeftSwipe ? -containerWidth : containerWidth;
      setDragOffset(finalOffset);
      
      // After animation completes, change the image and reset
      setTimeout(() => {
        if (isLeftSwipe) {
          setCurrentIndex((prev) => (prev + 1) % media.length);
        } else {
          setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
        }
        
        // Reset without animation
        setDragOffset(0);
        setIsAnimatingSwipe(false);
        
        // Small delay to ensure smooth transition
        setTimeout(() => {
          setIsTransitioning(false);
        }, 50);
      }, 300);
    } else {
      // Snap back to original position
      setIsAnimatingSwipe(true);
      setDragOffset(0);
      setTimeout(() => {
        setIsAnimatingSwipe(false);
      }, 300);
    }
  };

  // Helper functions to get adjacent media items
  const getPrevIndex = () => (currentIndex - 1 + media.length) % media.length;
  const getNextIndex = () => (currentIndex + 1) % media.length;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (media.length <= 1 || isTransitioning) return;
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        prevMedia();
        break;
      case 'ArrowRight':
        e.preventDefault();
        nextMedia();
        break;
      case 'Home':
        e.preventDefault();
        setCurrentIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setCurrentIndex(media.length - 1);
        break;
    }
  };

  // Memoize the media URLs to prevent recalculation when only textSectionHeight changes
  const mediaUrls = useMemo(() => media.map(m => m.url).join(','), [media]);
  
  // Cache for image dimensions to prevent reloading
  const [imageDimensionsCache, setImageDimensionsCache] = useState<Record<string, number>>({});

  // Effect to load image dimensions only when media changes
  useEffect(() => {
    const loadImageDimensions = async () => {
      if (media.length === 0) return;
      
      const viewportWidth = window.innerWidth * 0.5;
      const newCache: Record<string, number> = {};
      
      for (const mediaItem of media) {
        if (mediaItem.type === 'video') {
          // For videos, use a standard 16:9 aspect ratio
          newCache[mediaItem.url] = viewportWidth / (16/9);
        } else if (!imageDimensionsCache[mediaItem.url]) {
          // Only load images that aren't already cached
          try {
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
            newCache[mediaItem.url] = height;
          } catch {
            newCache[mediaItem.url] = viewportWidth / 1.5; // fallback height
          }
        } else {
          // Use cached dimension
          newCache[mediaItem.url] = imageDimensionsCache[mediaItem.url];
        }
      }
      
      setImageDimensionsCache(prev => ({ ...prev, ...newCache }));
    };

    loadImageDimensions();
  }, [mediaUrls, imageDimensionsCache, media]); // Dependencies for media loading

  // Effect to calculate height when dimensions are loaded or textSectionHeight changes
  useEffect(() => {
    if (media.length === 0) return;

    const mediaHeights = media.map(mediaItem => 
      imageDimensionsCache[mediaItem.url] || (window.innerWidth * 0.5) / 1.5
    );
    
    // Calculate average height of all media items
    const averageHeight = mediaHeights.reduce((sum, height) => sum + height, 0) / mediaHeights.length;
    
    // Use the larger of average height or text section height
    let finalHeight = Math.max(averageHeight, textSectionHeight || 0);
    
    // Apply reasonable bounds
    finalHeight = Math.max(400, Math.min(800, finalHeight));
    
    setContainerHeight(finalHeight);
  }, [media, imageDimensionsCache, textSectionHeight]);

  // Render media item component
  const renderMediaItem = (mediaItem: MediaItem, index: number, className: string = '') => {
    if (mediaItem.type === 'video') {
      return (
        <video 
          key={`video-${index}`}
          src={mediaItem.url}
          className={`w-full h-full object-cover ${className}`}
          controls
          preload="metadata"
          playsInline
          muted
          onError={(e) => {
            console.error('Video loading error:', e, 'URL:', mediaItem.url);
          }}
          aria-label={mediaItem.alternativeText || `Видео услуги ${index + 1} - персональные тренировки и консультации с фитнес тренером`}
        />
      );
    }
    
    return (
      <img 
        key={`image-${index}`}
        src={mediaItem.url} 
        alt={mediaItem.alternativeText || `Фото услуги ${index + 1} - персональные тренировки и консультации с фитнес тренером`}
        className={`w-full h-full object-cover ${className}`}
        loading="lazy"
        decoding="async"
      />
    );
  };

  return (
    <div 
      ref={setContainerRef}
      className={`relative w-full overflow-hidden ${className} touch-pan-y focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
      style={{ height: `${containerHeight}px` }}
      role="region"
      aria-label={`Галерея изображений и видео услуг, ${currentIndex + 1} из ${media.length}. Используйте стрелки для навигации или свайп на сенсорных устройствах`}
      aria-live="polite"
      tabIndex={media.length > 1 ? 0 : -1}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onKeyDown={onKeyDown}
    >
      {/* Carousel container with smooth transitions */}
      <div 
        className="relative w-full h-full flex"
        style={{
          transform: `translateX(${dragOffset}px)`,
          transition: (isDragging && !isAnimatingSwipe) ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Previous image (shown when dragging right) */}
        {media.length > 1 && (
          <div 
            className="absolute left-0 top-0 w-full h-full"
            style={{ transform: 'translateX(-100%)' }}
          >
            {renderMediaItem(media[getPrevIndex()], getPrevIndex())}
          </div>
        )}
        
        {/* Current image */}
        <div className="relative w-full h-full flex-shrink-0">
          {renderMediaItem(media[currentIndex], currentIndex)}
        </div>
        
        {/* Next image (shown when dragging left) */}
        {media.length > 1 && (
          <div 
            className="absolute right-0 top-0 w-full h-full"
            style={{ transform: 'translateX(100%)' }}
          >
            {renderMediaItem(media[getNextIndex()], getNextIndex())}
          </div>
        )}
      </div>
      
      {media.length > 1 && (
        <>
          <button
            onClick={prevMedia}
            disabled={isTransitioning}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-full transition-smooth z-20 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={`Предыдущее изображение (${currentIndex === 0 ? media.length : currentIndex} из ${media.length})`}
            title="Предыдущее изображение"
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <button
            onClick={nextMedia}
            disabled={isTransitioning}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-full transition-smooth z-20 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={`Следующее изображение (${currentIndex + 2 > media.length ? 1 : currentIndex + 2} из ${media.length})`}
            title="Следующее изображение"
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10" role="tablist" aria-label="Индикаторы слайдов">
            {media.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  if (!isTransitioning && index !== currentIndex) {
                    setIsTransitioning(true);
                    setIsAnimatingSwipe(true);
                    
                    // Determine swipe direction
                    const containerWidth = getContainerWidth();
                    const direction = index > currentIndex ? -1 : 1;
                    setDragOffset(direction * containerWidth);
                    
                    setTimeout(() => {
                      setCurrentIndex(index);
                      setDragOffset(0);
                      setIsAnimatingSwipe(false);
                      
                      setTimeout(() => {
                        setIsTransitioning(false);
                      }, 50);
                    }, 300);
                  }
                }}
                disabled={isTransitioning}
                className={`p-3 min-w-[44px] min-h-[44px] flex items-center justify-center transition-smooth`}
                role="tab"
                aria-selected={index === currentIndex}
                aria-controls={`slide-${index}`}
                aria-label={`Перейти к изображению ${index + 1} из ${media.length}`}
                title={`Показать изображение ${index + 1}`}
              >
                <div className={`w-2.5 h-2.5 rounded-full transition-smooth ${
                  index === currentIndex ? 'bg-white shadow-lg' : 'bg-white/60 hover:bg-white/80'
                }`} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};