import { ServiceCarousel } from './ServiceCarousel';
import type { MediaItem as CarouselMediaItem } from './ServiceCarousel';
import { Button } from './ui/button';
import { useState, useRef, useEffect } from 'react';

interface ServiceSectionProps {
  title: string;
  description: string;
  media: CarouselMediaItem[];
  imageLeft?: boolean;
  onContactClick: () => void;
}

export const ServiceSection = ({ 
  title, 
  description, 
  media, 
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
      {/* Mobile Layout: Text above, Image below */}
      <div className="flex flex-col md:hidden">
        {/* Text Section - Mobile */}
        <div 
          ref={textRef}
          className="w-full flex items-center justify-center p-6 min-h-[300px]"
        >
          <div className="space-y-4 max-w-lg text-center">
            <h3 className="text-xl font-bold text-foreground">
              {title}
            </h3>
            <div 
              className="text-muted-foreground leading-relaxed text-sm prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_li]:mb-1 [&_p]:mb-2 [&_strong]:font-bold [&_em]:italic"
              dangerouslySetInnerHTML={{ __html: description }}
            />
            <Button 
              onClick={onContactClick}
              className="bg-gradient-primary hover:opacity-90 text-white font-bold px-6 py-4 text-base rounded-lg shadow-elegant transition-all duration-300 hover:scale-105 min-h-[44px]"
              aria-label="Связаться с тренером для получения этой услуги"
              title="Перейти к контактам для связи"
            >
              ХОЧУ
            </Button>
          </div>
        </div>
        
        {/* Image Section - Mobile */}
        <div className="w-full">
          <ServiceCarousel media={media} textSectionHeight={0} />
        </div>
      </div>

      {/* Desktop Layout: Side by side */}
      <div className={`hidden md:flex ${imageLeft ? 'flex-row-reverse' : ''}`}>
        {/* Image Section - Desktop 50% */}
        <div className="w-1/2">
          <ServiceCarousel media={media} textSectionHeight={textSectionHeight} />
        </div>
        
        {/* Text Section - Desktop 50% */}
        <div 
          className="w-1/2 flex items-center justify-center p-8 lg:p-12 min-h-[400px]"
        >
          <div className="space-y-6 max-w-lg">
            <h3 className="text-2xl lg:text-4xl font-bold text-foreground">
              {title}
            </h3>
            <div 
              className="text-muted-foreground leading-relaxed text-base lg:text-lg prose prose-base max-w-none [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_li]:mb-1 [&_p]:mb-2 [&_strong]:font-bold [&_em]:italic"
              dangerouslySetInnerHTML={{ __html: description }}
            />
            <Button 
              onClick={onContactClick}
              className="bg-gradient-primary hover:opacity-90 text-white font-bold px-8 py-6 text-lg rounded-lg shadow-elegant transition-all duration-300 hover:scale-105 min-h-[44px]"
              aria-label="Связаться с тренером для получения этой услуги"
              title="Перейти к контактам для связи"
            >
              ХОЧУ
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};