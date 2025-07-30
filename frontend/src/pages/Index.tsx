import { SocialIcons } from '@/components/SocialIcons';
import { ServiceSection } from '@/components/ServiceSection';
import { StructuredData } from '@/components/StructuredData';
import { Check } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchContacts, fetchServicesBlocks, getImageUrl, convertFilesToMedia, resolveMediaIds, type ContactsData, type ServiceBlockData, type FileMetadata } from '@/lib/directusApi';
import { useState, useEffect } from 'react';

const Index = () => {
  const [scrollY, setScrollY] = useState(0);
  const [resolvedServices, setResolvedServices] = useState<(ServiceBlockData & { resolvedMedia: FileMetadata[] })[]>([]);

  const { data: contactsData, isLoading: contactsLoading } = useQuery<ContactsData>({
    queryKey: ['contacts'],
    queryFn: fetchContacts,
  });

  const { data: servicesData, isLoading: servicesLoading } = useQuery<ServiceBlockData[]>({
    queryKey: ['services-blocks'],
    queryFn: fetchServicesBlocks,
  });

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Resolve media IDs when services data is loaded
  useEffect(() => {
    if (servicesData && servicesData.length > 0) {
      const resolveAllMedia = async () => {
        const resolved = await Promise.all(
          servicesData.map(async (service) => {
            if (service.media && service.media.length > 0) {
              const fileMetadata = await resolveMediaIds(service.media);
              return { ...service, resolvedMedia: fileMetadata };
            }
            return { ...service, resolvedMedia: [] };
          })
        );
        setResolvedServices(resolved);
      };
      
      resolveAllMedia();
    }
  }, [servicesData]);

  const scrollToContacts = () => {
    const contactsElement = document.getElementById('contacts');
    contactsElement?.scrollIntoView({ behavior: 'smooth' });
  };

  // Function to parse HTML content into list items
  const parseAboutText = (htmlText: string) => {
    if (!htmlText) return [];
    
    // If it's HTML content, extract text from <p> or <li> tags
    if (htmlText.includes('<')) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');
      
      // Try to find list items first
      const listItems = doc.querySelectorAll('li');
      if (listItems.length > 0) {
        return Array.from(listItems).map(li => li.textContent?.trim() || '').filter(text => text.length > 0);
      }
      
      // If no list items, try paragraphs
      const paragraphs = doc.querySelectorAll('p');
      if (paragraphs.length > 0) {
        return Array.from(paragraphs).map(p => p.textContent?.trim() || '').filter(text => text.length > 0);
      }
      
      // Fallback: return plain text content
      return [doc.body.textContent?.trim() || ''].filter(text => text.length > 0);
    }
    
    // Legacy: Handle dash-separated text
    return htmlText
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^-\s*/, '').trim())
      .filter(line => line.length > 0);
  };

  const defaultAboutItems = [
    "Я не занимаюсь спортом, я им живу. От души люблю то, чем занимаюсь и эту энергию передаю другим!",
    "Работаю тренером уже более 15 лет",
    "Обладаю экспертными знаниями в области силовых и функциональных тренировок.",
    "Хорошо разбираюсь в вопросах нутрициологии, спортивного питания и БАДов.",
    "Мотивирую людей к занятию спортом личным примером, я всегда в хорошей спортивной форме, и на днях мне исполниться 52 года!"
  ];

  if (contactsLoading || servicesLoading || (servicesData && resolvedServices.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <StructuredData contactsData={contactsData} />
      <main className="min-h-screen">
        {/* Hero Section */}
        <header className="relative h-screen flex items-center justify-center overflow-hidden" role="banner">
        <div className="absolute inset-0">
          <img 
            src={contactsData?.main_photo ? getImageUrl(contactsData.main_photo) : '/trainer-hero.jpg'} 
            alt="Александр Пасхалис - персональный фитнес тренер Россия, онлайн консультации по тренировкам и питанию, 15+ лет опыта" 
            className="w-full h-[120%] object-cover"
            loading="eager"
            fetchpriority="high"
            style={{
              transform: `translateY(${scrollY * 0.5}px)`,
            }}
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
        
        <div className="relative z-10 text-center text-white max-w-4xl px-4">
          <h1 className="text-5xl lg:text-7xl font-bold mb-4 tracking-tight">
            АЛЕКСАНДР ПАСХАЛИС
          </h1>
          <h2 className="text-2xl lg:text-4xl mb-8 font-light">
            Ваш персональный фитнес тренер
          </h2>
          <div className="text-lg lg:text-xl space-y-2">
            {contactsData?.email_address && <p>{contactsData.email_address}</p>}
            {contactsData?.phone_number && <p>{contactsData.phone_number}</p>}
          </div>
        </div>
        
        <div className="absolute top-8 right-8 z-10">
          <SocialIcons 
            variant="light" 
            telegramLogin={contactsData?.telegram_login}
            instagramLogin={contactsData?.instagram_login}
            whatsappPhone={contactsData?.whatsapp_phone}
          />
        </div>
        
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <div className="animate-bounce">
            <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
              <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse" />
            </div>
          </div>
        </div>
        </header>

        {/* About Introduction */}
        <section className="py-16 bg-background" aria-labelledby="intro-heading">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center">
              <p id="intro-heading" className="text-lg lg:text-xl leading-relaxed text-muted-foreground">
                {contactsData?.greeting || 
                  "Привет! Меня зовут Александр, я персональный фитнес тренер. Создатель божественных фигур. Гуру в сфере тренинга и нутрициологии. Приведу Вас к любой цели, от \"просто похудеть\" - до выхода на соревнования! Со мной ваша забота о себе под профессиональным контролем круглосуточно!"
                }
              </p>
            </div>
          </div>
        </section>

        {/* About Me List */}
        <section className="py-16 bg-muted/30" aria-labelledby="about-heading">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 id="about-heading" className="text-3xl lg:text-4xl font-bold text-center mb-12">Обо мне</h2>
          
          <div className="space-y-6">
            {(() => {
              const aboutItems = contactsData?.about_info 
                ? parseAboutText(contactsData.about_info)
                : defaultAboutItems;
              
              return aboutItems.map((text, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center mt-1">
                    <Check size={18} className="text-white" />
                  </div>
                  <p className="text-lg leading-relaxed">{text}</p>
                </div>
              ));
            })()}
          </div>
        </div>
      </section>

        {/* Services */}
        <section className="bg-background" aria-labelledby="services-heading">
          <h2 id="services-heading" className="sr-only">Услуги персонального тренера</h2>
          {resolvedServices?.map((service, index) => (
            <article key={service.id}>
              <ServiceSection
                title={service.title}
                description={service.text}
                media={convertFilesToMedia(service.resolvedMedia)}
                imageLeft={index % 2 !== 0}
                onContactClick={scrollToContacts}
              />
            </article>
          ))}
        </section>

        {/* Contacts */}
        <footer id="contacts" className="py-20 bg-gradient-dark" role="contentinfo">
          <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4">
            ЕСЛИ ВЫ НЕДОВОЛЬНЫ СВОЕЙ ФИГУРОЙ,
          </h2>
          <h3 className="text-3xl lg:text-5xl font-bold text-white mb-8">
            НАПИШИТЕ МНЕ!
          </h3>
          <p className="text-2xl lg:text-3xl text-white/90 mb-12 font-light">
            Я ЗНАЮ ЧТО ДЕЛАТЬ!
          </p>
          
          <div className="flex justify-center mb-8">
            <SocialIcons 
              variant="light" 
              className="scale-125"
              telegramLogin={contactsData?.telegram_login}
              instagramLogin={contactsData?.instagram_login}
              whatsappPhone={contactsData?.whatsapp_phone}
            />
          </div>
          
          <div className="text-white/80 space-y-2">
            {contactsData?.email_address && <p>{contactsData.email_address}</p>}
            {contactsData?.phone_number && <p>{contactsData.phone_number}</p>}
          </div>
        </div>
        </footer>
      </main>
    </>
  );
};

export default Index;
