import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ServiceCarouselProps {
  images: string[];
  className?: string;
}

export const ServiceCarousel = ({ images, className = '' }: ServiceCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [optimalHeight, setOptimalHeight] = useState(400);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  useEffect(() => {
    const calculateOptimalHeight = async () => {
      const aspectRatios: number[] = [];
      
      for (const imageUrl of images) {
        try {
          const aspectRatio = await new Promise<number>((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img.width / img.height);
            img.onerror = () => resolve(1.5); // fallback aspect ratio
            img.src = imageUrl;
          });
          aspectRatios.push(aspectRatio);
        } catch {
          aspectRatios.push(1.5); // fallback aspect ratio
        }
      }
      
      // Calculate median aspect ratio for better balance
      const sortedRatios = aspectRatios.sort((a, b) => a - b);
      const medianRatio = sortedRatios[Math.floor(sortedRatios.length / 2)];
      
      // Convert to height based on a standard width (assuming 50vw)
      // Using viewport units for responsive calculation
      const baseWidth = window.innerWidth * 0.5;
      const calculatedHeight = baseWidth / medianRatio;
      
      // Clamp between reasonable bounds
      const clampedHeight = Math.max(300, Math.min(700, calculatedHeight));
      setOptimalHeight(clampedHeight);
    };

    if (images.length > 0) {
      calculateOptimalHeight();
    }
  }, [images]);

  return (
    <div 
      className={`relative w-full overflow-hidden ${className}`}
      style={{ height: `${optimalHeight}px` }}
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