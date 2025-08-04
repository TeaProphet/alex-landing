import { useState, useEffect, useMemo, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export interface MediaItem {
  url: string;
  type: 'image' | 'video';
  alternativeText?: string;
}

interface ServiceCarouselProps {
  media: MediaItem[];
  className?: string;
  textSectionHeight: number;
  backgroundColor?: 'default' | 'muted';
}

export const ServiceCarousel = ({ media, className = '', textSectionHeight, backgroundColor = 'default' }: ServiceCarouselProps) => {
  const [containerHeight, setContainerHeight] = useState(400);
  const swiperRef = useRef<SwiperType>(null);

  // Cache for image dimensions and aspect ratios
  const [imageDimensionsCache, setImageDimensionsCache] = useState<Record<string, number>>({});
  const [imageAspectRatios, setImageAspectRatios] = useState<Record<string, number>>({});

  // Memoize the media URLs to prevent recalculation when only textSectionHeight changes
  const mediaUrls = useMemo(() => media.map(m => m.url).join(','), [media]);

  // Effect to load image dimensions only when media changes
  useEffect(() => {
    const loadImageDimensions = async () => {
      if (media.length === 0) return;
      
      const viewportWidth = window.innerWidth * 0.5;
      const newCache: Record<string, number> = {};
      const newAspectRatios: Record<string, number> = {};
      
      for (const mediaItem of media) {
        if (mediaItem.type === 'video') {
          // For videos, use a standard 16:9 aspect ratio
          newCache[mediaItem.url] = viewportWidth / (16/9);
          newAspectRatios[mediaItem.url] = 16/9;
        } else if (!imageDimensionsCache[mediaItem.url]) {
          // Only load images that aren't already cached
          try {
            const height = await new Promise<number>((resolve) => {
              const img = new Image();
              img.onload = () => {
                const aspectRatio = img.width / img.height;
                const calculatedHeight = viewportWidth / aspectRatio;
                newAspectRatios[mediaItem.url] = aspectRatio;
                resolve(calculatedHeight);
              };
              img.onerror = () => {
                newAspectRatios[mediaItem.url] = 1.5;
                resolve(viewportWidth / 1.5);
              };
              img.src = mediaItem.url;
            });
            newCache[mediaItem.url] = height;
          } catch {
            newCache[mediaItem.url] = viewportWidth / 1.5; // fallback height
            newAspectRatios[mediaItem.url] = 1.5;
          }
        } else {
          // Use cached dimension
          newCache[mediaItem.url] = imageDimensionsCache[mediaItem.url];
          newAspectRatios[mediaItem.url] = imageAspectRatios[mediaItem.url] || 1.5;
        }
      }
      
      setImageDimensionsCache(prev => ({ ...prev, ...newCache }));
      setImageAspectRatios(prev => ({ ...prev, ...newAspectRatios }));
    };

    loadImageDimensions();
  }, [mediaUrls]);

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
      <Swiper
        modules={[Navigation, Pagination]}
        navigation={{
          prevEl: '.swiper-button-prev-custom',
          nextEl: '.swiper-button-next-custom',
        }}
        pagination={{
          clickable: true,
          bulletClass: 'swiper-pagination-bullet-custom',
          bulletActiveClass: 'swiper-pagination-bullet-active-custom',
        }}
        spaceBetween={0}
        slidesPerView={1}
        loop={true}
        className="h-full w-full"
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
      >
        {media.map((mediaItem, index) => (
          <SwiperSlide key={index} className="h-full">
            <div 
              className={`w-full h-full relative ${
                backgroundColor === 'muted' ? 'bg-muted/30' : 'bg-background'
              }`}
              style={{ height: `${containerHeight}px` }}
            >
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
                  className="w-full h-full object-contain"
                  loading="lazy"
                  onError={(e) => {
                    console.error('Image loading error:', e, 'URL:', mediaItem.url);
                  }}
                />
              )}
            </div>
          </SwiperSlide>
        ))}
        
        {/* Custom Navigation Arrows */}
        <div className="swiper-button-prev-custom absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-black/20 hover:bg-black/40 rounded-full flex items-center justify-center cursor-pointer transition-colors">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </div>
        <div className="swiper-button-next-custom absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-black/20 hover:bg-black/40 rounded-full flex items-center justify-center cursor-pointer transition-colors">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Swiper>
      
      {/* Custom Pagination Styles */}
      <style jsx>{`
        :global(.swiper-pagination-bullet-custom) {
          width: 12px;
          height: 12px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 50%;
          margin: 0 4px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        :global(.swiper-pagination-bullet-active-custom) {
          background: rgba(0, 0, 0, 0.8);
          transform: scale(1.2);
        }
      `}</style>
    </div>
  );
};