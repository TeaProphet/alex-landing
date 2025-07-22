import { ServiceCarousel } from './ServiceCarousel';
import { Button } from './ui/button';

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
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className={`grid lg:grid-cols-2 gap-12 items-center ${
          imageLeft ? 'lg:grid-flow-col' : ''
        }`}>
          <div className={`${imageLeft ? 'lg:order-2' : ''}`}>
            <ServiceCarousel images={images} />
          </div>
          
          <div className={`space-y-6 ${imageLeft ? 'lg:order-1' : ''}`}>
            <h3 className="text-2xl lg:text-3xl font-bold text-foreground mb-6">
              {title}
            </h3>
            <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
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