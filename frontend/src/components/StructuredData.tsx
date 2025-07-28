import { useEffect } from 'react';
import { ContactsData } from '@/lib/strapiApi';

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
      "url": "http://fitness-trainer.online",
      "image": contactsData?.mainPhoto?.url || "/trainer-hero.jpg",
      "email": contactsData?.emailAddress || "nr-star@mail.ru",
      "telephone": contactsData?.phoneNumber || "+79805402021",
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
          "telephone": contactsData?.phoneNumber || "+79805402021",
          "contactType": "customer service",
          "availableLanguage": "Russian"
        },
        {
          "@type": "ContactPoint", 
          "email": contactsData?.emailAddress || "nr-star@mail.ru",
          "contactType": "customer service",
          "availableLanguage": "Russian"
        }
      ],
      "sameAs": [
        contactsData?.telegramLogin ? `https://t.me/${contactsData.telegramLogin}` : "https://t.me/nr_star",
        contactsData?.instagramLogin ? `https://instagram.com/${contactsData.instagramLogin}` : "https://instagram.com/nr_star",
        contactsData?.whatsappPhone ? `https://wa.me/${contactsData.whatsappPhone}` : "https://wa.me/79805402021"
      ],
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