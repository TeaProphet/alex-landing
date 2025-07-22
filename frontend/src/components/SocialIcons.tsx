import { MessageCircle, Instagram, Send } from 'lucide-react';

interface SocialIconsProps {
  variant?: 'light' | 'dark';
  className?: string;
}

export const SocialIcons = ({ variant = 'light', className = '' }: SocialIconsProps) => {
  const iconClass = variant === 'light' 
    ? 'text-white hover:text-primary transition-smooth' 
    : 'text-foreground hover:text-primary transition-smooth';

  return (
    <div className={`flex gap-4 ${className}`}>
      <a 
        href="https://t.me/nr_star" 
        target="_blank" 
        rel="noopener noreferrer"
        className={`${iconClass} hover:scale-110 transition-all duration-300`}
      >
        <Send size={28} />
      </a>
      <a 
        href="https://instagram.com/nr_star" 
        target="_blank" 
        rel="noopener noreferrer"
        className={`${iconClass} hover:scale-110 transition-all duration-300`}
      >
        <Instagram size={28} />
      </a>
      <a 
        href="https://wa.me/79805402021" 
        target="_blank" 
        rel="noopener noreferrer"
        className={`${iconClass} hover:scale-110 transition-all duration-300`}
      >
        <MessageCircle size={28} />
      </a>
    </div>
  );
};