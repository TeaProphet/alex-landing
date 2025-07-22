import { SocialIcons } from '@/components/SocialIcons';
import { ServiceSection } from '@/components/ServiceSection';
import { Check } from 'lucide-react';
import trainerHero from '@/assets/trainer-hero.jpg';
import gymEquipment from '@/assets/gym-equipment.jpg';
import nutrition from '@/assets/nutrition.jpg';
import trainingSession from '@/assets/training-session.jpg';
import consultation from '@/assets/consultation.jpg';

const Index = () => {
  const scrollToContacts = () => {
    const contactsElement = document.getElementById('contacts');
    contactsElement?.scrollIntoView({ behavior: 'smooth' });
  };

  const services = [
    {
      title: "Онлайн консультации",
      description: `Провожу онлайн консультации по следующим вопросам:
• построение тренировочных программ
• построение тренировочных циклов
• тренировки при ограничениях по здоровью
• все вопросы диеты подбора продуктов и блюд
• все о спортивных добавках и БАДах
• медицинские анализы их показатели, способы корректировки отклонений
• все о спортивной фармакологии

Формат онлайн, время 45 - 60 мин
Стоимость 2000₽`,
      images: [consultation, nutrition]
    },
    {
      title: "Персональные тренировки",
      description: `Индивидуальные тренировки с учетом ваших целей:
• Коррекция фигуры и снижение веса
• Набор мышечной массы
• Функциональная подготовка
• Реабилитация после травм
• Подготовка к соревнованиям
• Работа с подростками

Каждая тренировка адаптируется под ваш уровень подготовки
Продолжительность 60-90 минут`,
      images: [trainingSession, gymEquipment]
    },
    {
      title: "Программы питания",
      description: `Составление индивидуальных программ питания:
• Анализ текущего рациона
• Расчет калорийности и БЖУ
• Составление меню на неделю/месяц
• Рекомендации по спортивным добавкам
• Контроль и корректировка программы
• Обучение принципам здорового питания

Все программы составляются с учетом ваших предпочтений и образа жизни`,
      images: [nutrition, consultation]
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={trainerHero} 
            alt="Alexander Paskhalis" 
            className="w-full h-full object-cover"
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
            <p>nr-star@mail.ru</p>
            <p>+79805402021</p>
          </div>
        </div>
        
        <div className="absolute top-8 right-8 z-10">
          <SocialIcons variant="light" />
        </div>
        
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <div className="animate-bounce">
            <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
              <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse" />
            </div>
          </div>
        </div>
      </section>

      {/* About Introduction */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center">
            <p className="text-lg lg:text-xl leading-relaxed text-muted-foreground">
              Привет! Меня зовут Александр, я персональный фитнес тренер. Создатель божественных фигур. 
              Гуру в сфере тренинга и нутрициологии. Приведу Вас к любой цели, от "просто похудеть" - 
              до выхода на соревнования! Со мной ваша забота о себе под профессиональным контролем круглосуточно!
            </p>
          </div>
        </div>
      </section>

      {/* About Me List */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12">Обо мне</h2>
          
          <div className="space-y-6">
            {[
              "Я не занимаюсь спортом, я им живу. От души люблю то, чем занимаюсь и эту энергию передаю другим!",
              "Работаю тренером уже более 15 лет",
              "Обладаю экспертными знаниями в области силовых и функциональных тренировок.",
              "Хорошо разбираюсь в вопросах нутрициологии, спортивного питания и БАДов.",
              "Мотивирую людей к занятию спортом личным примером, я всегда в хорошей спортивной форме, и на днях мне исполниться 52 года!"
            ].map((text, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center mt-1">
                  <Check size={18} className="text-white" />
                </div>
                <p className="text-lg leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <div className="bg-background">
        {services.map((service, index) => (
          <ServiceSection
            key={index}
            title={service.title}
            description={service.description}
            images={service.images}
            imageLeft={index % 2 !== 0}
            onContactClick={scrollToContacts}
          />
        ))}
      </div>

      {/* Contacts */}
      <section id="contacts" className="py-20 bg-gradient-dark">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4">
            ЕСЛИ ВЫ НЕДОВОЛЬНЫ СВОЕЙ ФИГУРОЙ,
          </h2>
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-8">
            НАПИШИТЕ МНЕ!
          </h2>
          <p className="text-2xl lg:text-3xl text-white/90 mb-12 font-light">
            Я ЗНАЮ ЧТО ДЕЛАТЬ!
          </p>
          
          <div className="flex justify-center mb-8">
            <SocialIcons variant="light" className="scale-125" />
          </div>
          
          <div className="text-white/80 space-y-2">
            <p>nr-star@mail.ru</p>
            <p>+79805402021</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
