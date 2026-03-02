import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { SiWhatsapp } from 'react-icons/si';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const WHATSAPP_NUMBER = '971000000000';

export default function WhatsAppButton() {
  const { t, dir } = useLanguage();

  const handleClick = () => {
    const message = encodeURIComponent(t.whatsapp.message);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleClick}
            className={`fixed bottom-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-luxury transition-all hover:scale-110 hover:shadow-gold ${dir === 'rtl' ? 'left-6' : 'right-6'}`}
            style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
            aria-label={t.whatsapp.tooltip}
          >
            <SiWhatsapp className="w-7 h-7 text-white" />
          </button>
        </TooltipTrigger>
        <TooltipContent side={dir === 'rtl' ? 'right' : 'left'}>
          <p>{t.whatsapp.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
