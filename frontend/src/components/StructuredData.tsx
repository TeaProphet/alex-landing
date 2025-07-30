import { useEffect } from 'react';
import { ContactsData, getImageUrl } from '@/lib/directusApi';

interface StructuredDataProps {
  contactsData?: ContactsData;
}

export const StructuredData = ({ contactsData }: StructuredDataProps) => {
  useEffect(() => {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": "Александр Пасхалис",
      "jobTitle": "Персональный фитнес тренер",
      "description": "Персональный фитнес тренер с опытом более 15 лет. Эксперт в области силовых тренировок, функциональной подготовки и нутрициологии.",
      "url": "https://fitness-trainer.online",
      "image": contactsData?.main_photo ? getImageUrl(contactsData.main_photo) : undefined,
      "email": contactsData?.email_address,
      "telephone": contactsData?.phone_number,
      "knowsAbout": [
        "Персональные тренировки",
        "Силовые тренировки",
        "Функциональная подготовка",
        "Программы питания",
        "Спортивное питание",
        "Нутрициология",
        "Реабилитация после травм",
        "Подготовка к соревнованиям"
      ],
      "hasCredential": "Опыт работы более 15 лет",
      "serviceArea": [
        {
          "@type": "Country",
          "name": "Россия"
        },
        {
          "@type": "AdministrativeArea",
          "name": "Москва"
        }
      ],
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "RU",
        "addressRegion": "Россия"
      },
      "priceRange": "2000₽",
      "availableService": [
        {
          "@type": "Service",
          "name": "Онлайн консультации",
          "description": "Консультации по построению тренировочных программ, диете, спортивному питанию",
          "provider": {
            "@type": "Person",
            "name": "Александр Пасхалис"
          },
          "areaServed": "Россия",
          "availableChannel": {
            "@type": "ServiceChannel",
            "serviceType": "онлайн консультация",
            "availableLanguage": "ru"
          }
        },
        {
          "@type": "Service", 
          "name": "Персональные тренировки",
          "description": "Индивидуальные тренировки с учетом целей и уровня подготовки",
          "provider": {
            "@type": "Person",
            "name": "Александр Пасхалис"
          }
        },
        {
          "@type": "Service",
          "name": "Программы питания", 
          "description": "Составление индивидуальных программ питания и рекомендации по БАДам",
          "provider": {
            "@type": "Person",
            "name": "Александр Пасхалис"
          }
        }
      ],
      "contactPoint": [
        {
          "@type": "ContactPoint",
          "telephone": contactsData?.phone_number,
          "contactType": "customer service",
          "availableLanguage": "Russian"
        },
        {
          "@type": "ContactPoint", 
          "email": contactsData?.email_address,
          "contactType": "customer service",
          "availableLanguage": "Russian"
        }
      ],
      "sameAs": [
        contactsData?.telegram_login ? `https://t.me/${contactsData.telegram_login}` : undefined,
        contactsData?.instagram_login ? `https://instagram.com/${contactsData.instagram_login}` : undefined,
        contactsData?.whatsapp_phone ? `https://wa.me/${contactsData.whatsapp_phone}` : undefined
      ].filter(Boolean),
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "5.0",
        "bestRating": "5",
        "ratingCount": "50"
      }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    
    // Remove existing structured data script if any
    const existing = document.querySelector('script[type="application/ld+json"]');
    if (existing) {
      existing.remove();
    }
    
    document.head.appendChild(script);

    return () => {
      const scriptElement = document.querySelector('script[type="application/ld+json"]');
      if (scriptElement) {
        scriptElement.remove();
      }
    };
  }, [contactsData]);

  return null;
};