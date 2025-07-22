import { MessageCircle, Instagram, Send } from 'lucide-react';

interface SocialIconsProps {
  variant?: 'light' | 'dark';
  className?: string;
  telegramLogin?: string;
  instagramLogin?: string;
  whatsappPhone?: string;
}

export const SocialIcons = ({ 
  variant = 'light', 
  className = '',
  telegramLogin = 'nr_star',
  instagramLogin = 'nr_star', 
  whatsappPhone = '79805402021'
}: SocialIconsProps) => {
  const iconClass = variant === 'light' 
    ? 'text-white hover:text-primary transition-smooth' 
    : 'text-foreground hover:text-primary transition-smooth';

  return (
    <div className={`flex gap-4 ${className}`}>
      {telegramLogin && (
        <a 
          href={`https://t.me/${telegramLogin}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className={`${iconClass} hover:scale-110 transition-all duration-300`}
        >
          <Send size={28} />
        </a>
      )}
      {instagramLogin && (
        <a 
          href={`https://instagram.com/${instagramLogin}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className={`${iconClass} hover:scale-110 transition-all duration-300`}
        >
          <Instagram size={28} />
        </a>
      )}
      {whatsappPhone && (
        <a 
          href={`https://wa.me/${whatsappPhone}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className={`${iconClass} hover:scale-110 transition-all duration-300`}
        >
          <MessageCircle size={28} />
        </a>
      )}
    </div>
  );
};