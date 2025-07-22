import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ServiceCarouselProps {
  images: string[];
  className?: string;
  textSectionHeight: number;
}

export const ServiceCarousel = ({ images, className = '', textSectionHeight }: ServiceCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [containerHeight, setContainerHeight] = useState(400);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  useEffect(() => {
    const calculateHeight = async () => {
      if (images.length === 0) return;

      const imageHeights: number[] = [];
      const viewportWidth = window.innerWidth * 0.5;
      
      // Calculate height for each image when width is 50vw
      for (const imageUrl of images) {
        try {
          const height = await new Promise<number>((resolve) => {
            const img = new Image();
            img.onload = () => {
              const aspectRatio = img.width / img.height;
              const calculatedHeight = viewportWidth / aspectRatio;
              resolve(calculatedHeight);
            };
            img.onerror = () => resolve(viewportWidth / 1.5); // fallback height
            img.src = imageUrl;
          });
          imageHeights.push(height);
        } catch {
          imageHeights.push(viewportWidth / 1.5); // fallback height
        }
      }
      
      // Calculate medium (average) height of all images
      const averageHeight = imageHeights.reduce((sum, height) => sum + height, 0) / imageHeights.length;
      
      // Use the larger of average height or text section height
      let finalHeight = Math.max(averageHeight, textSectionHeight || 0);
      
      // Apply reasonable bounds
      finalHeight = Math.max(400, Math.min(800, finalHeight));
      
      setContainerHeight(finalHeight);
    };

    calculateHeight();
  }, [images, textSectionHeight]);

  return (
    <div 
      className={`relative w-full overflow-hidden ${className}`}
      style={{ height: `${containerHeight}px` }}
    >
      <img 
        src={images[currentIndex]} 
        alt="Service" 
        className="w-full h-full object-cover transition-all duration-500"
      />
      
      {images.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-smooth z-10"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-smooth z-10"
          >
            <ChevronRight size={20} />
          </button>
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2.5 h-2.5 rounded-full transition-smooth ${
                  index === currentIndex ? 'bg-white shadow-lg' : 'bg-white/60 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};