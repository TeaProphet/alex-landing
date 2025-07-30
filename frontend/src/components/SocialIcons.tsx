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
    <div className={`flex gap-4 ${className}`} role="navigation" aria-label="Социальные сети и контакты">
      {telegramLogin && (
        <a 
          href={`https://t.me/${telegramLogin}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className={`${iconClass} hover:scale-110 transition-all duration-300 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center`}
          aria-label={`Написать в Telegram пользователю ${telegramLogin}`}
          title="Связаться через Telegram"
        >
          <Send size={28} aria-hidden="true" />
          <span className="sr-only">Telegram</span>
        </a>
      )}
      {instagramLogin && (
        <a 
          href={`https://instagram.com/${instagramLogin}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className={`${iconClass} hover:scale-110 transition-all duration-300 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center`}
          aria-label={`Перейти в Instagram профиль ${instagramLogin}`}
          title="Посмотреть Instagram профиль"
        >
          <Instagram size={28} aria-hidden="true" />
          <span className="sr-only">Instagram</span>
        </a>
      )}
      {whatsappPhone && (
        <a 
          href={`https://wa.me/${whatsappPhone}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className={`${iconClass} hover:scale-110 transition-all duration-300 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center`}
          aria-label={`Написать в WhatsApp на номер ${whatsappPhone}`}
          title="Связаться через WhatsApp"
        >
          <MessageCircle size={28} aria-hidden="true" />
          <span className="sr-only">WhatsApp</span>
        </a>
      )}
    </div>
  );
};