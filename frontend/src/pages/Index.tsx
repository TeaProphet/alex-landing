import { SocialIcons } from '@/components/SocialIcons';
import { ServiceSection } from '@/components/ServiceSection';
import { StructuredData } from '@/components/StructuredData';
import { Check } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchContacts, fetchServicesBlocks, getImageUrl, convertFilesToMedia, resolveMediaIds, type ContactsData, type ServiceBlockData, type FileMetadata } from '@/lib/directusApi';
import { useState, useEffect } from 'react';

const Index = () => {
  const [scrollY, setScrollY] = useState(0);
  const { data: contactsData, isLoading: contactsLoading } = useQuery<ContactsData>({
    queryKey: ['contacts'],
    queryFn: fetchContacts,
    retry: 1,
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });

  const { data: servicesData, isLoading: servicesLoading } = useQuery<ServiceBlockData[]>({
    queryKey: ['services-blocks'],
    queryFn: fetchServicesBlocks,
    retry: 1,
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });

  // Use React Query for media resolution to enable caching
  const { data: resolvedServices, isLoading: mediaLoading } = useQuery({
    queryKey: ['services-media', servicesData],
    queryFn: async () => {
      if (!servicesData || servicesData.length === 0) return [];
      
      const resolved = await Promise.all(
        servicesData.map(async (service) => {
          if (service.media && service.media.length > 0) {
            const fileMetadata = await resolveMediaIds(service.media);
            return { ...service, resolvedMedia: fileMetadata };
          }
          return { ...service, resolvedMedia: [] };
        })
      );
      return resolved;
    },
    enabled: !!servicesData && servicesData.length > 0,
    retry: 1,
    staleTime: 15 * 60 * 1000, // 15 minutes - longer cache for media
    cacheTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  const handleContactClick = () => {
    if (contactsData?.telegram_login) {
      window.open(`https://t.me/${contactsData.telegram_login}`, '_blank');
    } else {
      const contactsElement = document.getElementById('contacts');
      contactsElement?.scrollIntoView({ behavior: 'smooth' });
    }
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

  // Show initial loading only if no data is available yet
  const showInitialLoading = contactsLoading && servicesLoading && !contactsData && !servicesData;
  
  if (showInitialLoading) {
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
          {contactsLoading ? (
            // Show gradient background while loading
            <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-700" />
          ) : (
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
          )}
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
            {contactsData?.email_address && (
              <p>
                <a 
                  href={`mailto:${contactsData.email_address}`}
                  className="hover:text-primary transition-colors underline decoration-1 underline-offset-2"
                  aria-label={`Написать email на адрес ${contactsData.email_address}`}
                  title="Отправить email"
                >
                  {contactsData.email_address}
                </a>
              </p>
            )}
            {contactsData?.phone_number && (
              <p>
                <a 
                  href={`tel:${contactsData.phone_number}`}
                  className="hover:text-primary transition-colors underline decoration-1 underline-offset-2"
                  aria-label={`Позвонить по номеру ${contactsData.phone_number}`}
                  title="Позвонить"
                >
                  {contactsData.phone_number}
                </a>
              </p>
            )}
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
              <div 
                id="intro-heading" 
                className="text-lg lg:text-xl leading-relaxed text-left text-black"
                dangerouslySetInnerHTML={{
                  __html: contactsData?.greeting || 
                    "Привет! Меня зовут Александр, я персональный фитнес тренер. Создатель божественных фигур. Гуру в сфере тренинга и нутрициологии. Приведу Вас к любой цели, от \"просто похудеть\" - до выхода на соревнования! Со мной ваша забота о себе под профессиональным контролем круглосуточно!"
                }}
              />
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
                  <p className="text-lg leading-relaxed text-left text-black">{text}</p>
                </div>
              ));
            })()}
          </div>
        </div>
      </section>

        {/* Services */}
        <section className="bg-background" aria-labelledby="services-heading">
          <h2 id="services-heading" className="sr-only">Услуги персонального тренера</h2>
          {resolvedServices && resolvedServices.length > 0 ? (
            resolvedServices.map((service, index) => (
              <article key={service.id} className={index % 2 !== 0 ? 'bg-muted/30' : 'bg-background'}>
                <ServiceSection
                  title={service.title}
                  description={service.text}
                  media={convertFilesToMedia(service.resolvedMedia)}
                  imageLeft={index % 2 !== 0}
                  onContactClick={handleContactClick}
                  backgroundColor={index % 2 !== 0 ? 'muted' : 'default'}
                />
              </article>
            ))
          ) : servicesData && servicesData.length > 0 ? (
            // Show services with skeleton media while media is loading
            servicesData.map((service, index) => (
              <article key={service.id}>
                <div className="container mx-auto px-4 py-16">
                  <div className={`grid lg:grid-cols-2 gap-12 items-center ${index % 2 !== 0 ? 'lg:grid-cols-2' : ''}`}>
                    <div className={`space-y-6 ${index % 2 !== 0 ? 'lg:order-2' : ''}`}>
                      <h3 className="text-3xl lg:text-4xl font-bold">{service.title}</h3>
                      <div className="text-lg leading-relaxed" dangerouslySetInnerHTML={{ __html: service.text }} />
                    </div>
                    <div className={`${index % 2 !== 0 ? 'lg:order-1' : ''}`}>
                      <div className="bg-muted rounded-lg animate-pulse" style={{ height: '400px' }}>
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          Загрузка изображений...
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))
          ) : (
            // Loading skeleton when no services data yet
            <div className="container mx-auto px-4 py-16">
              <div className="animate-pulse space-y-16">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="grid lg:grid-cols-2 gap-12">
                    <div className="space-y-4">
                      <div className="h-8 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-full"></div>
                      <div className="h-4 bg-muted rounded w-5/6"></div>
                    </div>
                    <div className="h-64 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
            {contactsData?.email_address && (
              <p>
                <a 
                  href={`mailto:${contactsData.email_address}`}
                  className="hover:text-white transition-colors underline decoration-1 underline-offset-2"
                  aria-label={`Написать email на адрес ${contactsData.email_address}`}
                  title="Отправить email"
                >
                  {contactsData.email_address}
                </a>
              </p>
            )}
            {contactsData?.phone_number && (
              <p>
                <a 
                  href={`tel:${contactsData.phone_number}`}
                  className="hover:text-white transition-colors underline decoration-1 underline-offset-2"
                  aria-label={`Позвонить по номеру ${contactsData.phone_number}`}
                  title="Позвонить"
                >
                  {contactsData.phone_number}
                </a>
              </p>
            )}
          </div>
        </div>
        </footer>
      </main>
    </>
  );
};

export default Index;
