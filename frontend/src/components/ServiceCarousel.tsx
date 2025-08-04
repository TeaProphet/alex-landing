import { useState, useEffect, useMemo } from 'react';
import { Carousel } from 'antd';
import type { CarouselRef } from 'antd/es/carousel';
import { useRef } from 'react';

export interface MediaItem {
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
  const [containerHeight, setContainerHeight] = useState(400);
  const carouselRef = useRef<CarouselRef>(null);

  // Cache for image dimensions to prevent reloading
  const [imageDimensionsCache, setImageDimensionsCache] = useState<Record<string, number>>({});

  // Memoize the media URLs to prevent recalculation when only textSectionHeight changes
  const mediaUrls = useMemo(() => media.map(m => m.url).join(','), [media]);

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
  }, [mediaUrls, imageDimensionsCache, media]);

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

  if (media.length === 0) {
    return null;
  }

  return (
    <div 
      className={`relative w-full ${className}`}
      style={{ height: `${containerHeight}px` }}
      role="region"
      aria-label={`Галерея изображений и видео услуг, ${media.length} элементов. Используйте стрелки для навигации или свайп на сенсорных устройствах`}
    >
      <Carousel
        ref={carouselRef}
        arrows
        dots
        infinite
        swipeToSlide
        touchMove
        className="h-full [&_.slick-prev]:!w-12 [&_.slick-prev]:!h-12 [&_.slick-next]:!w-12 [&_.slick-next]:!h-12 [&_.slick-prev::after]:!w-6 [&_.slick-prev::after]:!h-6 [&_.slick-next::after]:!w-6 [&_.slick-next::after]:!h-6"
        dotPosition="bottom"
        effect="scrollx"
      >
        {media.map((mediaItem, index) => (
          <div key={index} className="h-full">
            <div className="h-full" style={{ height: `${containerHeight}px` }}>
              {mediaItem.type === 'video' ? (
                <video 
                  src={mediaItem.url}
                  className="w-full h-full object-cover"
                  controls
                  preload="metadata"
                  playsInline
                  muted
                  onError={(e) => {
                    console.error('Video loading error:', e, 'URL:', mediaItem.url);
                  }}
                  onLoadStart={() => {
                    console.log('Video loading started:', mediaItem.url);
                  }}
                  aria-label={mediaItem.alternativeText || `Видео услуги ${index + 1} - персональные тренировки и консультации с фитнес тренером`}
                />
              ) : (
                <img 
                  src={mediaItem.url} 
                  alt={mediaItem.alternativeText || `Фото услуги ${index + 1} - персональные тренировки и консультации с фитнес тренером`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              )}
            </div>
          </div>
        ))}
      </Carousel>
    </div>
  );
};