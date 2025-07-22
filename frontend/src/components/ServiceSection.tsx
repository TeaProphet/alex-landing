import { ServiceCarousel } from './ServiceCarousel';
import { Button } from './ui/button';
import { useState, useRef, useEffect } from 'react';

interface ServiceSectionProps {
  title: string;
  description: string;
  images: string[];
  imageLeft?: boolean;
  onContactClick: () => void;
}

export const ServiceSection = ({ 
  title, 
  description, 
  images, 
  imageLeft = false,
  onContactClick 
}: ServiceSectionProps) => {
  const [textSectionHeight, setTextSectionHeight] = useState(0);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textRef.current) {
      const height = textRef.current.offsetHeight;
      setTextSectionHeight(height);
    }
  }, []);

  return (
    <section className="w-full">
      <div className={`flex ${imageLeft ? 'flex-row-reverse' : ''}`}>
        {/* Image Section - 50% */}
        <div className="w-1/2">
          <ServiceCarousel images={images} textSectionHeight={textSectionHeight} />
        </div>
        
        {/* Text Section - 50% */}
        <div 
          ref={textRef}
          className="w-1/2 flex items-center justify-center p-8 lg:p-12 min-h-[400px]"
        >
          <div className="space-y-6 max-w-lg">
            <h3 className="text-2xl lg:text-4xl font-bold text-foreground">
              {title}
            </h3>
            <div className="text-muted-foreground leading-relaxed whitespace-pre-line text-base lg:text-lg">
              {description}
            </div>
            <Button 
              onClick={onContactClick}
              className="bg-gradient-primary hover:opacity-90 text-white font-bold px-8 py-6 text-lg rounded-lg shadow-elegant transition-all duration-300 hover:scale-105"
            >
              ХОЧУ
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};