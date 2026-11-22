import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Bell,
  CalendarCheck2,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  MapPin,
  Moon,
  Pause,
  Play,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Star,
  Sun,
  Tag,
} from 'lucide-react';
import heroConsultorioImg from '../assets/images/hero_consultorio_dental_1794591301986.jpg';
import heroSalonImg from '../assets/images/hero_salon_spa_1794591301304.jpg';
import heroVeterinariaImg from '../assets/images/hero_veterinaria_1794591302304.jpg';
import clientPhoneImg from '../assets/images/landing_client_booking_phone_1795378137211.jpg';
import heroOwnerImg from '../assets/images/landing_hero_owner_app_1795378136704.jpg';
import { MariaLogoMark, WhatsAppSvgIcon } from '../components/RubroIcons';
import { PLANS, PLAN_ORDER } from '../config/plans';
import type { PlanId } from '../types/saas';

interface LandingPageProps {
  onCreateAccount: (preselectedPlan?: PlanId) => void;
  onLogin: () => void;
  onViewDemo: () => void;
  hasActiveSession: boolean;
  onGoToPanel: () => void;
}

type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'maria_theme_preference';

type HeroRubroKey = 'spa' | 'vet' | 'clinica';

const HERO_RUBRO_PRESETS: Record<
  HeroRubroKey,
  {
    tab: string;
    negocio: string;
    ciudad: string;
    services: { id: string; name: string; duration: string; price: number }[];
    revenue: string;
    appointments: { hora: string; cliente: string; estado: string }[];
  }
> = {
  spa: {
    tab: 'Spa',
    negocio: 'Spa Zamay',
    ciudad: 'App oficial · Reservas 24/7',
    services: [
      { id: 's1', name: 'Masaje relajante', duration: '60 min', price: 80 },
      { id: 's2', name: 'Facial hidratante', duration: '45 min', price: 65 },
    ],
    revenue: 'S/ 840',
    appointments: [
      { hora: '10:00', cliente: 'Andrea · Masaje', estado: 'Confirmada' },
      { hora: '11:00', cliente: 'Diego · Facial', estado: 'Recordada' },
      { hora: '15:00', cliente: 'Rosa · Spa', estado: 'Confirmada' },
    ],
  },
  vet: {
    tab: 'Veterinaria',
    negocio: 'Veterinaria Patitas',
    ciudad: 'App oficial · Reservas 24/7',
    services: [
      { id: 's1', name: 'Baño medicado', duration: '60 min', price: 55 },
      { id: 's2', name: 'Consulta veterinaria', duration: '30 min', price: 45 },
    ],
    revenue: 'S/ 690',
    appointments: [
      { hora: '10:00', cliente: 'Camila · Toby', estado: 'Confirmada' },
      { hora: '11:00', cliente: 'Luis · Michi', estado: 'Recordada' },
      { hora: '15:00', cliente: 'Sofía · Rocky', estado: 'Confirmada' },
    ],
  },
  clinica: {
    tab: 'Consultorio',
    negocio: 'Consultorio Sonríe',
    ciudad: 'App oficial · Reservas 24/7',
    services: [
      { id: 's1', name: 'Limpieza dental', duration: '45 min', price: 70 },
      { id: 's2', name: 'Evaluación integral', duration: '30 min', price: 50 },
    ],
    revenue: 'S/ 920',
    appointments: [
      { hora: '10:00', cliente: 'María · Control', estado: 'Confirmada' },
      { hora: '11:00', cliente: 'Carlos · Limpieza', estado: 'Recordada' },
      { hora: '15:00', cliente: 'Elena · Consulta', estado: 'Confirmada' },
    ],
  },
};

const HERO_MOCK_SLOTS = ['09:00', '10:00', '11:00', '15:00'];

const HERO_SLIDES = [
  {
    img: heroOwnerImg,
    alt: 'Dueña de negocio atendiendo reservas con su App MarIA',
    title: 'Tu agenda lista en minutos',
    badge: 'Salones y Spa',
    objectPosition: 'object-[50%_18%]',
  },
  {
    img: heroConsultorioImg,
    alt: 'Consultorio médico y dental atendiendo sin esperas',
    title: 'Citas puntuales sin colas',
    badge: 'Consultorios y Clínicas',
    objectPosition: 'object-center',
  },
  {
    img: heroVeterinariaImg,
    alt: 'Veterinaria atendiendo con cariño a una mascota feliz',
    title: 'Fichas y vacunas al día',
    badge: 'Veterinarias',
    objectPosition: 'object-[50%_22%]',
  },
  {
    img: clientPhoneImg,
    alt: 'Cliente feliz reservando su cita desde el celular',
    title: 'Clientes felices en 3 toques',
    badge: 'Reservas 24/7',
    objectPosition: 'object-center',
  },
  {
    img: heroSalonImg,
    alt: 'Salón de estética atendiendo a clientes con agenda ordenada',
    title: 'Catálogo y promos flash',
    badge: 'Estética y Barbería',
    objectPosition: 'object-center',
  },
];

const MARQUEE_REVIEWS = [
  {
    nombre: 'Camila Mendoza',
    negocio: 'Spa Zamay · Lima',
    texto:
      'Antes pasaba dos horas respondiendo mensajes. Ahora mis clientas reservan solas y llegan puntuales.',
  },
  {
    nombre: 'Dr. Renzo Paredes',
    negocio: 'Veterinaria Patitas · Lima',
    texto:
      'Las fichas por mascota y el aviso automático nos ordenaron toda la semana desde el primer día.',
  },
  {
    nombre: 'Valeria Quispe',
    negocio: 'Consultorio Sonríe · Arequipa',
    texto:
      'Mis pacientes eligen su horario libre en tres toques y ya no se cruzan citas en recepción.',
  },
  {
    nombre: 'Mateo Herrera',
    negocio: 'Barbería El Roble · Trujillo',
    texto:
      'Activé una promo flash los martes por la tarde y llené todos los turnos que siempre quedaban vacíos.',
  },
  {
    nombre: 'Lucía Salazar',
    negocio: 'Estética Sumaq · Cusco',
    texto:
      'Que el link lleve mi nombre y mis colores hace que el negocio se vea mucho más serio y profesional.',
  },
  {
    nombre: 'Dra. Paola Castro',
    negocio: 'Clínica Dental Norte · Piura',
    texto:
      'Los recordatorios automáticos redujeron casi a cero las ausencias sin tener que llamar uno por uno.',
  },
];

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // Ignorar si localStorage no está disponible
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onCreateAccount,
  onLogin,
  onViewDemo,
  hasActiveSession,
  onGoToPanel,
}) => {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [heroRubro, setHeroRubro] = useState<HeroRubroKey>('spa');
  const [phoneScreenMode, setPhoneScreenMode] = useState<'cliente' | 'dueno'>(
    'cliente'
  );
  const [selectedMockDay, setSelectedMockDay] = useState<string>('Hoy');
  const [selectedMockService, setSelectedMockService] = useState<string>('s1');
  const [selectedMockSlot, setSelectedMockSlot] = useState<string>('11:00');
  const [mockBooked, setMockBooked] = useState<boolean>(false);
  const [autoPlayPreview, setAutoPlayPreview] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [slidePaused, setSlidePaused] = useState<boolean>(false);
  const [marqueePaused, setMarqueePaused] = useState<boolean>(false);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (event: MediaQueryListEvent) => {
      try {
        const saved = localStorage.getItem(THEME_STORAGE_KEY);
        if (saved === 'light' || saved === 'dark') return;
      } catch {
        // Ignorar si localStorage no está disponible
      }
      setTheme(event.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, []);

  // Vista previa animada tipo video dentro del mockup (pausable al interactuar)
  useEffect(() => {
    if (!autoPlayPreview) return;
    let step = 0;
    const timer = window.setInterval(() => {
      step = (step + 1) % 4;
      if (step === 0) {
        setPhoneScreenMode('cliente');
        setSelectedMockDay('Hoy');
        setSelectedMockService('s1');
        setSelectedMockSlot('11:00');
        setMockBooked(false);
      } else if (step === 1) {
        setPhoneScreenMode('cliente');
        setSelectedMockService('s2');
        setSelectedMockSlot('15:00');
        setMockBooked(false);
      } else if (step === 2) {
        setPhoneScreenMode('cliente');
        setMockBooked(true);
      } else {
        setPhoneScreenMode('dueno');
      }
    }, 2600);
    return () => window.clearInterval(timer);
  }, [autoPlayPreview]);

  // Diapositiva automática de rubros y clientes felices
  useEffect(() => {
    if (slidePaused) return;
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    const timer = window.setInterval(() => {
      setActiveSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 3400);
    return () => window.clearInterval(timer);
  }, [slidePaused]);

  const currentSlide = HERO_SLIDES[activeSlideIndex];
  const handlePrevSlide = () => {
    setSlidePaused(true);
    setActiveSlideIndex(
      (prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length
    );
  };
  const handleNextSlide = () => {
    setSlidePaused(true);
    setActiveSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const toggleTheme = () => {
    const next: ThemeMode = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Ignorar si localStorage no está disponible
    }
  };

  const activePreset = HERO_RUBRO_PRESETS[heroRubro];
  const activeMockSvc =
    activePreset.services.find((s) => s.id === selectedMockService) ||
    activePreset.services[0];

  return (
    <div
      className="font-inter min-h-[100dvh] flex flex-col text-[16px] leading-[1.6]"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--ink)' }}
    >
      {/* HEADER */}
      <header
        className="sticky top-0 z-30 pt-safe"
        style={{
          backgroundColor: 'var(--card)',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6">
          <a
            href="#top"
            className="flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <MariaLogoMark className="h-8 w-8 shrink-0" />
            <span
              className="font-outfit text-[17px] sm:text-[20px] leading-none"
              style={{ color: 'var(--ink)' }}
            >
              Mar<span style={{ color: 'var(--p)' }}>IA</span>{' '}
              <span className="hidden min-[380px]:inline">Citas</span>
            </span>
          </a>

          <nav
            aria-label="Navegación principal"
            className="hidden items-center gap-6 text-[15px] font-medium md:flex"
            style={{ color: 'var(--sub)' }}
          >
            <a
              href="#rubros"
              className="hover:underline underline-offset-4 whitespace-nowrap shrink-0"
              style={{ color: 'var(--sub)' }}
            >
              Beneficios
            </a>
            <a
              href="#solucion"
              className="hover:underline underline-offset-4 whitespace-nowrap shrink-0"
              style={{ color: 'var(--sub)' }}
            >
              Cómo funciona
            </a>
            <a
              href="#resenas"
              className="hover:underline underline-offset-4 whitespace-nowrap shrink-0"
              style={{ color: 'var(--sub)' }}
            >
              Reseñas
            </a>
            <a
              href="#planes"
              className="hover:underline underline-offset-4 whitespace-nowrap shrink-0"
              style={{ color: 'var(--sub)' }}
            >
              Planes
            </a>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                theme === 'dark'
                  ? 'Cambiar a modo claro'
                  : 'Cambiar a modo oscuro'
              }
              title={
                theme === 'dark'
                  ? 'Cambiar a modo claro'
                  : 'Cambiar a modo oscuro'
              }
              className="tap-feedback inline-flex h-10 w-10 items-center justify-center rounded-[12px]"
              style={{
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--line)',
                color: 'var(--ink)',
              }}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4" aria-hidden="true" />
              )}
            </button>

            {hasActiveSession ? (
              <>
                <button
                  type="button"
                  onClick={onViewDemo}
                  className="tap-feedback inline-flex min-h-[40px] items-center justify-center rounded-[12px] px-3 sm:px-4 text-[13px] sm:text-[14px] font-medium whitespace-nowrap"
                  style={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--line)',
                    color: 'var(--ink)',
                  }}
                >
                  Ver demo
                </button>
                <button
                  type="button"
                  onClick={onGoToPanel}
                  className="tap-feedback inline-flex min-h-[40px] items-center gap-1.5 rounded-[12px] px-3.5 sm:px-4 text-[13px] sm:text-[14px] font-medium whitespace-nowrap"
                  style={{
                    backgroundColor: 'var(--p)',
                    color: 'var(--onp)',
                  }}
                >
                  Abrir mi Panel
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onLogin}
                  className="hidden text-[14px] font-medium hover:underline underline-offset-4 lg:inline-block whitespace-nowrap px-2"
                  style={{ color: 'var(--sub)' }}
                >
                  Ingresar
                </button>
                <button
                  type="button"
                  onClick={onViewDemo}
                  className="tap-feedback inline-flex min-h-[40px] items-center justify-center rounded-[12px] px-2.5 sm:px-4 text-[13px] sm:text-[14px] font-medium whitespace-nowrap"
                  style={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--line)',
                    color: 'var(--ink)',
                  }}
                >
                  Ver demo
                </button>
                <button
                  type="button"
                  onClick={() => onCreateAccount('pro')}
                  className="tap-feedback inline-flex min-h-[40px] items-center justify-center rounded-[12px] px-3 sm:px-4 text-[13px] sm:text-[14px] font-medium whitespace-nowrap"
                  style={{
                    backgroundColor: 'var(--p)',
                    color: 'var(--onp)',
                  }}
                >
                  Crear mi cuenta
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main id="top" className="flex-1">
        {/* HERO A PANTALLA COMPLETA */}
        <section
          className="lg:min-h-[calc(100dvh-64px)] flex items-center"
          style={{ backgroundColor: 'var(--bg)' }}
        >
          <div className="mx-auto w-full max-w-6xl px-4 pt-6 pb-10 sm:px-6 sm:py-10">
            <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:items-center lg:gap-10">
              {/* Columna Izquierda */}
              <div className="lg:col-span-5">
                {/* Diapositiva compacta en móvil con rubros y clientes felices */}
                <div
                  className="mb-5 overflow-hidden rounded-[16px] lg:hidden"
                  style={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--line)',
                  }}
                >
                  <div className="relative h-48 w-full overflow-hidden">
                    <img
                      src={currentSlide.img}
                      alt={currentSlide.alt}
                      referrerPolicy="no-referrer"
                      className={`h-full w-full object-cover transition-opacity duration-300 ${currentSlide.objectPosition}`}
                    />
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handlePrevSlide}
                        aria-label="Diapositiva anterior"
                        className="flex h-8 w-8 items-center justify-center rounded-[10px]"
                        style={{
                          backgroundColor: 'var(--card)',
                          border: '1px solid var(--line)',
                          color: 'var(--ink)',
                        }}
                      >
                        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextSlide}
                        aria-label="Siguiente diapositiva"
                        className="flex h-8 w-8 items-center justify-center rounded-[10px]"
                        style={{
                          backgroundColor: 'var(--card)',
                          border: '1px solid var(--line)',
                          color: 'var(--ink)',
                        }}
                      >
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <div
                    className="px-4 py-3"
                    style={{ borderTop: '1px solid var(--line)' }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className="truncate text-[14px] font-medium"
                        style={{ color: 'var(--ink)' }}
                      >
                        {currentSlide.title}
                      </p>
                      <span
                        className="inline-flex shrink-0 items-center rounded-[10px] px-2.5 py-1 text-[12px] font-medium"
                        style={{
                          backgroundColor: 'var(--cys)',
                          color: 'var(--cyt)',
                        }}
                      >
                        {currentSlide.badge}
                      </span>
                    </div>
                    <div
                      className="mt-2.5 flex items-center gap-1.5"
                      role="tablist"
                      aria-label="Diapositivas de rubros y clientes"
                    >
                      {HERO_SLIDES.map((s, idx) => {
                        const isActive = idx === activeSlideIndex;
                        return (
                          <button
                            key={s.badge}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            aria-label={`Ver ${s.badge}`}
                            onClick={() => {
                              setSlidePaused(true);
                              setActiveSlideIndex(idx);
                            }}
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: isActive ? '20px' : '8px',
                              backgroundColor: isActive
                                ? 'var(--p)'
                                : 'var(--line)',
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 1. Etiqueta superior cian: Sin comisiones */}
                <div
                  className="inline-flex items-center gap-1.5 rounded-[12px] px-3 py-1.5 text-[14px] font-medium"
                  style={{
                    backgroundColor: 'var(--cys)',
                    color: 'var(--cyt)',
                  }}
                >
                  <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Sin comisiones</span>
                </div>

                {/* 2. Título: 36px móvil / 56px escritorio, Outfit 700, solo "con IA" en violeta */}
                <h1
                  className="font-outfit mt-4 text-[36px] leading-[1.06] lg:text-[56px] lg:leading-[1.03] [text-wrap:balance]"
                  style={{ color: 'var(--ink)' }}
                >
                  Reservas online para tu negocio,{' '}
                  <span style={{ color: 'var(--p)' }}>con IA</span>
                </h1>

                {/* 3. Subtítulo: 20px */}
                <p
                  className="mt-4 text-[20px] leading-[1.45] font-normal"
                  style={{ color: 'var(--sub)' }}
                >
                  Agenda, catálogo y avisos por WhatsApp en un solo lugar.
                </p>

                {/* 4. Botones: Crear mi cuenta (violeta) y Ver demo (borde) */}
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={() =>
                      hasActiveSession ? onGoToPanel() : onCreateAccount('pro')
                    }
                    className="tap-feedback inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[12px] px-6 text-[16px] font-medium whitespace-nowrap"
                    style={{
                      backgroundColor: 'var(--p)',
                      color: 'var(--onp)',
                    }}
                  >
                    {hasActiveSession ? 'Ir a mi Panel' : 'Crear mi cuenta'}
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={onViewDemo}
                    className="tap-feedback inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[12px] px-6 text-[16px] font-medium whitespace-nowrap"
                    style={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--line)',
                      color: 'var(--ink)',
                    }}
                  >
                    <Play className="h-4 w-4 shrink-0" aria-hidden="true" />
                    Ver demo
                  </button>
                </div>

                {/* 5. Chip WhatsApp + Prueba social compacta */}
                <div
                  className="mt-5 space-y-3 pt-4"
                  style={{ borderTop: '1px solid var(--line)' }}
                >
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div
                      className="inline-flex items-center gap-2 rounded-[12px] px-3.5 py-2 text-[14px] font-medium"
                      style={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--line)',
                        color: 'var(--ink)',
                      }}
                    >
                      <WhatsAppSvgIcon className="h-4 w-4 shrink-0 text-[#25D366]" />
                      <span>Avisos por WhatsApp</span>
                    </div>

                    <span
                      className="text-[13px] font-medium"
                      style={{ color: 'var(--sub)' }}
                    >
                      +120 negocios en todo el Perú y LatAm
                    </span>
                  </div>

                  <p
                    className="text-[13px] font-medium"
                    style={{ color: 'var(--sub)' }}
                  >
                    Agenda 24/7 · Promos Flash · Ficha VIP · Listo en 2 minutos
                  </p>
                </div>
              </div>

              {/* Columna Derecha: Bento Hero con Selector de Rubro + Celular + Foto Real + Tarjetas */}
              <div className="flex flex-col items-center lg:items-stretch lg:col-span-7">
                {/* Barra de controles arriba del Bento */}
                <div className="mb-3.5 flex flex-wrap items-center justify-center lg:justify-between gap-2 w-full">
                  {/* Selector rápido de rubro en el ejemplo */}
                  <div
                    role="group"
                    aria-label="Elegir rubro de ejemplo"
                    className="inline-flex items-center gap-1 rounded-[12px] p-1"
                    style={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--line)',
                    }}
                  >
                    {(['spa', 'vet', 'clinica'] as HeroRubroKey[]).map((key) => {
                      const active = heroRubro === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setAutoPlayPreview(false);
                            setHeroRubro(key);
                            setPhoneScreenMode('cliente');
                            setMockBooked(false);
                          }}
                          className="min-h-[36px] rounded-[10px] px-3 text-[12px] font-medium transition-colors whitespace-nowrap"
                          style={
                            active
                              ? {
                                  backgroundColor: 'var(--cys)',
                                  color: 'var(--cyt)',
                                }
                              : {
                                  backgroundColor: 'transparent',
                                  color: 'var(--sub)',
                                }
                          }
                        >
                          {HERO_RUBRO_PRESETS[key].tab}
                        </button>
                      );
                    })}
                  </div>

                  {/* Selector Vista Cliente / Panel Dueño + Pausa */}
                  <div className="flex items-center gap-1.5">
                    <div
                      role="tablist"
                      aria-label="Cambiar vista del teléfono"
                      className="inline-flex items-center gap-1 rounded-[12px] p-1"
                      style={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--line)',
                      }}
                    >
                      <button
                        type="button"
                        role="tab"
                        aria-selected={phoneScreenMode === 'cliente'}
                        onClick={() => {
                          setAutoPlayPreview(false);
                          setPhoneScreenMode('cliente');
                        }}
                        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-[10px] px-3 text-[12px] font-medium transition-colors whitespace-nowrap"
                        style={
                          phoneScreenMode === 'cliente'
                            ? {
                                backgroundColor: 'var(--p)',
                                color: 'var(--onp)',
                              }
                            : {
                                backgroundColor: 'transparent',
                                color: 'var(--sub)',
                              }
                        }
                      >
                        <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
                        Cliente
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={phoneScreenMode === 'dueno'}
                        onClick={() => {
                          setAutoPlayPreview(false);
                          setPhoneScreenMode('dueno');
                        }}
                        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-[10px] px-3 text-[12px] font-medium transition-colors whitespace-nowrap"
                        style={
                          phoneScreenMode === 'dueno'
                            ? {
                                backgroundColor: 'var(--p)',
                                color: 'var(--onp)',
                              }
                            : {
                                backgroundColor: 'transparent',
                                color: 'var(--sub)',
                              }
                        }
                      >
                        <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
                        Dueño
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setAutoPlayPreview((prev) => !prev)}
                      aria-label={
                        autoPlayPreview
                          ? 'Pausar demostración animada'
                          : 'Reproducir demostración animada'
                      }
                      title={
                        autoPlayPreview ? 'Pausar demo' : 'Reproducir demo'
                      }
                      className="tap-feedback inline-flex h-[44px] w-[44px] items-center justify-center rounded-[12px]"
                      style={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--line)',
                        color: autoPlayPreview ? 'var(--cyt)' : 'var(--sub)',
                      }}
                    >
                      {autoPlayPreview ? (
                        <Pause className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Play className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Composición Bento: Celular + Panel visual lateral (sin tapar horarios) */}
                <div className="flex w-full flex-col items-center gap-3.5 sm:flex-row sm:items-stretch justify-center">
                  {/* Mockup del celular claro/oscuro */}
                  <div
                    className="w-full max-w-[330px] sm:w-[318px] shrink-0 rounded-[16px] p-2"
                    style={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--line)',
                    }}
                  >
                    <div
                      className="h-full overflow-hidden rounded-[12px]"
                      style={{
                        backgroundColor: 'var(--bg)',
                        border: '1px solid var(--line)',
                      }}
                    >
                      {/* Barra de estado limpia */}
                      <div
                        className="flex items-center justify-between px-4 py-2.5"
                        style={{
                          backgroundColor: 'var(--card)',
                          borderBottom: '1px solid var(--line)',
                          color: 'var(--ink)',
                        }}
                      >
                        <span className="text-[12px] font-medium tabular-nums">
                          9:41
                        </span>
                        <div
                          className="h-3.5 w-16 rounded-[10px]"
                          style={{
                            backgroundColor: 'var(--bg)',
                            border: '1px solid var(--line)',
                          }}
                        />
                        <span
                          className="text-[11px] font-medium tabular-nums"
                          style={{ color: 'var(--sub)' }}
                        >
                          5G · 100%
                        </span>
                      </div>

                      {phoneScreenMode === 'cliente' ? (
                        <div className="space-y-3 p-3.5">
                          {/* Negocio de ejemplo */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]"
                              style={{
                                backgroundColor: 'var(--ps)',
                                color: 'var(--p)',
                              }}
                            >
                              <Sparkles className="h-5 w-5" aria-hidden="true" />
                            </div>
                            <div className="min-w-0">
                              <p
                                className="font-outfit truncate text-[16px] leading-tight"
                                style={{ color: 'var(--ink)' }}
                              >
                                {activePreset.negocio}
                              </p>
                              <p
                                className="mt-0.5 flex items-center gap-1 text-[12px]"
                                style={{ color: 'var(--sub)' }}
                              >
                                <MapPin
                                  className="h-3 w-3 shrink-0"
                                  aria-hidden="true"
                                />
                                <span>{activePreset.ciudad}</span>
                              </p>
                            </div>
                          </div>

                          {/* Franja cian para sugerencias de IA / horarios en vivo */}
                          <div
                            className="flex items-center gap-1.5 rounded-[10px] px-3 py-2 text-[12px] font-medium"
                            style={{
                              backgroundColor: 'var(--cys)',
                              color: 'var(--cyt)',
                            }}
                          >
                            <Sparkles
                              className="h-3.5 w-3.5 shrink-0"
                              aria-hidden="true"
                            />
                            <span>Horarios en vivo · Sugerencia IA</span>
                          </div>

                          {/* Días */}
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              { label: 'Hoy', sub: '22 Nov' },
                              { label: 'Mañana', sub: '23 Nov' },
                              { label: 'Lun', sub: '24 Nov' },
                            ].map((d) => {
                              const active = selectedMockDay === d.label;
                              return (
                                <button
                                  key={d.label}
                                  type="button"
                                  onClick={() => {
                                    setAutoPlayPreview(false);
                                    setSelectedMockDay(d.label);
                                    setMockBooked(false);
                                  }}
                                  className="rounded-[10px] px-2 py-1.5 text-center transition-colors"
                                  style={
                                    active
                                      ? {
                                          backgroundColor: 'var(--ink)',
                                          color: 'var(--card)',
                                        }
                                      : {
                                          backgroundColor: 'var(--card)',
                                          border: '1px solid var(--line)',
                                          color: 'var(--sub)',
                                        }
                                  }
                                >
                                  <p className="text-[11px] font-medium leading-tight">
                                    {d.label}
                                  </p>
                                  <p className="text-[10px] tabular-nums">
                                    {d.sub}
                                  </p>
                                </button>
                              );
                            })}
                          </div>

                          {/* Servicios */}
                          <div className="space-y-2">
                            {activePreset.services.map((svc) => {
                              const active = selectedMockService === svc.id;
                              return (
                                <button
                                  key={svc.id}
                                  type="button"
                                  onClick={() => {
                                    setAutoPlayPreview(false);
                                    setSelectedMockService(svc.id);
                                    setMockBooked(false);
                                  }}
                                  className="flex w-full items-center justify-between gap-2 rounded-[12px] p-3 text-left transition-colors"
                                  style={{
                                    backgroundColor: active
                                      ? 'var(--ps)'
                                      : 'var(--card)',
                                    border: active
                                      ? '1px solid var(--p)'
                                      : '1px solid var(--line)',
                                  }}
                                >
                                  <div className="min-w-0">
                                    <p
                                      className="truncate text-[14px] font-medium"
                                      style={{ color: 'var(--ink)' }}
                                    >
                                      {svc.name}
                                    </p>
                                    <p
                                      className="text-[12px]"
                                      style={{ color: 'var(--sub)' }}
                                    >
                                      {svc.duration}
                                    </p>
                                  </div>
                                  <span
                                    className="shrink-0 text-[14px] font-medium tabular-nums"
                                    style={{ color: 'var(--p)' }}
                                  >
                                    S/ {svc.price}
                                  </span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Horarios (11:00 seleccionado en cian --cy / --oncy) */}
                          <div>
                            <p
                              className="mb-1.5 text-[12px] font-medium"
                              style={{ color: 'var(--sub)' }}
                            >
                              Horarios disponibles
                            </p>
                            <div className="grid grid-cols-4 gap-1.5">
                              {HERO_MOCK_SLOTS.map((slot) => {
                                const taken = slot === '10:00';
                                const active = selectedMockSlot === slot;
                                return (
                                  <button
                                    key={slot}
                                    type="button"
                                    disabled={taken}
                                    onClick={() => {
                                      setAutoPlayPreview(false);
                                      setSelectedMockSlot(slot);
                                      setMockBooked(false);
                                    }}
                                    className={`min-h-[36px] rounded-[10px] text-[12px] font-medium tabular-nums transition-colors ${
                                      taken ? 'line-through' : ''
                                    }`}
                                    style={
                                      taken
                                        ? {
                                            backgroundColor: 'var(--bg)',
                                            border: '1px dashed var(--line)',
                                            color: 'var(--sub)',
                                          }
                                        : active
                                          ? {
                                              backgroundColor: 'var(--cy)',
                                              color: 'var(--oncy)',
                                              border: '1px solid var(--cy)',
                                            }
                                          : {
                                              backgroundColor: 'var(--card)',
                                              border: '1px solid var(--line)',
                                              color: 'var(--ink)',
                                            }
                                    }
                                  >
                                    {slot}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Confirmar cita (violeta --p / --onp) */}
                          {mockBooked ? (
                            <div
                              className="flex items-center justify-between gap-2 rounded-[12px] px-3.5 py-2.5"
                              style={{
                                backgroundColor: 'var(--cys)',
                                border: '1px solid var(--cy)',
                                color: 'var(--cyt)',
                              }}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Check
                                  className="h-4 w-4 shrink-0"
                                  aria-hidden="true"
                                />
                                <div className="min-w-0">
                                  <p className="truncate text-[13px] font-medium">
                                    Cita confirmada · {selectedMockSlot}
                                  </p>
                                  <p className="truncate text-[11px]">
                                    {activeMockSvc.name}
                                  </p>
                                </div>
                              </div>
                              <span className="shrink-0 text-[13px] font-medium tabular-nums">
                                S/ {activeMockSvc.price}
                              </span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setAutoPlayPreview(false);
                                setMockBooked(true);
                              }}
                              className="tap-feedback flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-[12px] text-[14px] font-medium"
                              style={{
                                backgroundColor: 'var(--p)',
                                color: 'var(--onp)',
                              }}
                            >
                              Confirmar cita · {selectedMockSlot}
                            </button>
                          )}
                        </div>
                      ) : (
                        /* Panel Dueño dentro del mockup */
                        <div className="space-y-3 p-3.5">
                          <div
                            className="rounded-[12px] p-3.5"
                            style={{
                              backgroundColor: 'var(--card)',
                              border: '1px solid var(--line)',
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <p
                                className="text-[12px] font-medium"
                                style={{ color: 'var(--sub)' }}
                              >
                                Ingresos de hoy · En vivo
                              </p>
                              <span
                                className="rounded-[10px] px-2 py-0.5 text-[11px] font-medium tabular-nums"
                                style={{
                                  backgroundColor: 'var(--cys)',
                                  color: 'var(--cyt)',
                                }}
                              >
                                12 citas
                              </span>
                            </div>
                            <p
                              className="font-outfit mt-1 text-[26px] leading-tight tabular-nums"
                              style={{ color: 'var(--ink)' }}
                            >
                              {activePreset.revenue}
                            </p>

                            {/* Barras semanales planas */}
                            <div className="mt-3 flex items-end gap-1.5 h-12">
                              {[
                                { d: 'L', h: 46 },
                                { d: 'M', h: 64 },
                                { d: 'X', h: 52 },
                                { d: 'J', h: 86 },
                                { d: 'V', h: 72 },
                                { d: 'S', h: 96, peak: true },
                                { d: 'D', h: 80 },
                              ].map((bar) => (
                                <div
                                  key={bar.d}
                                  className="flex flex-1 flex-col items-center gap-1 h-full justify-end"
                                >
                                  <div
                                    className="w-full rounded-t-[4px]"
                                    style={{
                                      height: `${bar.h}%`,
                                      backgroundColor: bar.peak
                                        ? 'var(--cy)'
                                        : 'var(--p)',
                                    }}
                                  />
                                  <span
                                    className="text-[10px] font-medium"
                                    style={{ color: 'var(--sub)' }}
                                  >
                                    {bar.d}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p
                              className="text-[12px] font-medium"
                              style={{ color: 'var(--sub)' }}
                            >
                              Próximas citas
                            </p>
                            {activePreset.appointments.map((row) => (
                              <div
                                key={row.hora}
                                className="flex items-center justify-between gap-2 rounded-[10px] p-2.5"
                                style={{
                                  backgroundColor: 'var(--card)',
                                  border: '1px solid var(--line)',
                                }}
                              >
                                <div className="min-w-0">
                                  <p
                                    className="truncate text-[13px] font-medium"
                                    style={{ color: 'var(--ink)' }}
                                  >
                                    {row.cliente}
                                  </p>
                                  <p
                                    className="text-[11px] tabular-nums"
                                    style={{ color: 'var(--sub)' }}
                                  >
                                    {row.hora}
                                  </p>
                                </div>
                                <span
                                  className="shrink-0 rounded-[10px] px-2 py-0.5 text-[11px] font-medium"
                                  style={{
                                    backgroundColor: 'var(--cys)',
                                    color: 'var(--cyt)',
                                  }}
                                >
                                  {row.estado}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Panel lateral Bento: Foto real en escritorio + Promos Flash + Estado sin tapar el celular */}
                  <div className="flex w-full max-w-[330px] sm:max-w-none flex-1 min-w-0 flex-col gap-3">
                    {/* Diapositiva real en escritorio dentro de marco plano 1px */}
                    <div
                      onMouseEnter={() => setSlidePaused(true)}
                      onMouseLeave={() => setSlidePaused(false)}
                      className="hidden lg:flex flex-1 flex-col overflow-hidden rounded-[16px]"
                      style={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--line)',
                      }}
                    >
                      <div className="relative flex-1 min-h-[188px] overflow-hidden">
                        <img
                          src={currentSlide.img}
                          alt={currentSlide.alt}
                          referrerPolicy="no-referrer"
                          className={`h-full w-full object-cover transition-opacity duration-300 ${currentSlide.objectPosition}`}
                        />
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={handlePrevSlide}
                            aria-label="Diapositiva anterior"
                            className="flex h-7 w-7 items-center justify-center rounded-[10px]"
                            style={{
                              backgroundColor: 'var(--card)',
                              border: '1px solid var(--line)',
                              color: 'var(--ink)',
                            }}
                          >
                            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={handleNextSlide}
                            aria-label="Siguiente diapositiva"
                            className="flex h-7 w-7 items-center justify-center rounded-[10px]"
                            style={{
                              backgroundColor: 'var(--card)',
                              border: '1px solid var(--line)',
                              color: 'var(--ink)',
                            }}
                          >
                            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                      <div
                        className="px-3.5 py-2.5"
                        style={{ borderTop: '1px solid var(--line)' }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className="truncate text-[13px] font-medium"
                            style={{ color: 'var(--ink)' }}
                          >
                            {currentSlide.title}
                          </p>
                          <span
                            className="shrink-0 rounded-[10px] px-2 py-0.5 text-[11px] font-medium"
                            style={{
                              backgroundColor: 'var(--cys)',
                              color: 'var(--cyt)',
                            }}
                          >
                            {currentSlide.badge}
                          </span>
                        </div>
                        <div
                          className="mt-2 flex items-center gap-1.5"
                          role="tablist"
                          aria-label="Cambiar diapositiva"
                        >
                          {HERO_SLIDES.map((s, idx) => {
                            const isActive = idx === activeSlideIndex;
                            return (
                              <button
                                key={s.badge}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                aria-label={`Ver ${s.badge}`}
                                onClick={() => {
                                  setSlidePaused(true);
                                  setActiveSlideIndex(idx);
                                }}
                                className="h-1.5 rounded-full transition-all"
                                style={{
                                  width: isActive ? '18px' : '7px',
                                  backgroundColor: isActive
                                    ? 'var(--p)'
                                    : 'var(--line)',
                                }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Promo Flash activa (Ámbar #F59E0B exclusivo para promos) */}
                    <div
                      className="flex items-center justify-between gap-2.5 rounded-[12px] p-3"
                      style={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--line)',
                      }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]"
                          style={{
                            backgroundColor: 'rgba(245, 158, 11, 0.14)',
                            color: '#F59E0B',
                          }}
                        >
                          <Tag className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <p
                            className="truncate text-[13px] font-medium"
                            style={{ color: 'var(--ink)' }}
                          >
                            Promos Flash activas
                          </p>
                          <p
                            className="truncate text-[11px]"
                            style={{ color: 'var(--sub)' }}
                          >
                            Llena tus horas libres
                          </p>
                        </div>
                      </div>
                      <span
                        className="shrink-0 rounded-[10px] px-2 py-0.5 text-[11px] font-medium tabular-nums"
                        style={{
                          backgroundColor: 'rgba(245, 158, 11, 0.14)',
                          color: '#F59E0B',
                        }}
                      >
                        20% OFF
                      </span>
                    </div>

                    {/* Tarjeta Cita confirmada */}
                    <div
                      className="flex items-center gap-2.5 rounded-[12px] p-3"
                      style={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--line)',
                      }}
                    >
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]"
                        style={{
                          backgroundColor: 'var(--cys)',
                          color: 'var(--cyt)',
                        }}
                      >
                        <Check className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p
                          className="truncate text-[13px] font-medium"
                          style={{ color: 'var(--ink)' }}
                        >
                          Cita confirmada · {selectedMockSlot}
                        </p>
                        <p
                          className="truncate text-[11px]"
                          style={{ color: 'var(--sub)' }}
                        >
                          Sin llamadas ni esperas
                        </p>
                      </div>
                    </div>

                    {/* Tarjeta Recordatorios automáticos */}
                    <div
                      className="flex items-center gap-2.5 rounded-[12px] p-3"
                      style={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--line)',
                      }}
                    >
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]"
                        style={{
                          backgroundColor: 'var(--cys)',
                          color: 'var(--cyt)',
                        }}
                      >
                        <Bell className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p
                          className="truncate text-[13px] font-medium"
                          style={{ color: 'var(--ink)' }}
                        >
                          Recordatorios automáticos
                        </p>
                        <p
                          className="truncate text-[11px]"
                          style={{ color: 'var(--sub)' }}
                        >
                          Avisos puntuales
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BENEFICIOS */}
        <section
          id="rubros"
          className="py-10 sm:py-16"
          style={{
            backgroundColor: 'var(--card)',
            borderTop: '1px solid var(--line)',
            borderBottom: '1px solid var(--line)',
          }}
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2
                  className="font-outfit text-[26px] leading-[1.15] sm:text-[32px] [text-wrap:balance]"
                  style={{ color: 'var(--ink)' }}
                >
                  Más clientes felices, más ingresos para ti
                </h2>
                <p
                  className="mt-1.5 text-[16px]"
                  style={{ color: 'var(--sub)' }}
                >
                  Promos, trato directo y reservas rápidas en una sola App con tu marca.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  hasActiveSession ? onGoToPanel() : onCreateAccount('pro')
                }
                className="inline-flex items-center gap-1.5 text-[15px] font-medium hover:underline underline-offset-4 self-start sm:self-auto whitespace-nowrap"
                style={{ color: 'var(--p)' }}
              >
                {hasActiveSession ? 'Ir a mi Panel' : 'Crear mi cuenta'}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* BENTO GRID DE BENEFICIOS */}
            <div className="mt-6 grid grid-cols-1 gap-3.5 md:grid-cols-6">
              {/* Bento 1 (Grande): Agenda inteligente 24/7 */}
              <div
                className="flex flex-col justify-between gap-4 rounded-[16px] p-5 md:col-span-3"
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--line)',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span
                      className="inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-1 text-[12px] font-medium"
                      style={{
                        backgroundColor: 'var(--cys)',
                        color: 'var(--cyt)',
                      }}
                    >
                      <CalendarCheck2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Agenda 24/7
                    </span>
                    <h3
                      className="font-outfit mt-3 text-[20px]"
                      style={{ color: 'var(--ink)' }}
                    >
                      Reservas en 3 toques, sin llamadas
                    </h3>
                    <p
                      className="mt-1 text-[14px]"
                      style={{ color: 'var(--sub)' }}
                    >
                      Tus clientes eligen servicio y hora libre al instante, aunque estés atendiendo.
                    </p>
                  </div>
                </div>

                <div
                  className="grid grid-cols-4 gap-2 rounded-[12px] p-2.5"
                  style={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--line)',
                  }}
                >
                  {['09:00', '11:00', '15:00', '17:00'].map((slot) => {
                    const selected = slot === '11:00';
                    return (
                      <div
                        key={slot}
                        className="rounded-[10px] py-1.5 text-center text-[12px] font-medium tabular-nums"
                        style={
                          selected
                            ? {
                                backgroundColor: 'var(--cy)',
                                color: 'var(--oncy)',
                              }
                            : {
                                backgroundColor: 'var(--bg)',
                                border: '1px solid var(--line)',
                                color: 'var(--ink)',
                              }
                        }
                      >
                        {slot}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bento 2 (Grande): Trato directo y avisos por WhatsApp */}
              <div
                className="flex flex-col justify-between gap-4 rounded-[16px] p-5 md:col-span-3"
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--line)',
                }}
              >
                <div>
                  <div
                    className="inline-flex items-center gap-2 rounded-[10px] px-2.5 py-1 text-[12px] font-medium"
                    style={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--line)',
                      color: 'var(--ink)',
                    }}
                  >
                    <WhatsAppSvgIcon className="h-3.5 w-3.5 text-[#25D366]" />
                    <span>Trato directo · S/ 0 comisiones</span>
                  </div>
                  <h3
                    className="font-outfit mt-3 text-[20px]"
                    style={{ color: 'var(--ink)' }}
                  >
                    Avisos automáticos por WhatsApp
                  </h3>
                  <p
                    className="mt-1 text-[14px]"
                    style={{ color: 'var(--sub)' }}
                  >
                    Confirma cada turno sin intermediarios ni apps llenas de competencia.
                  </p>
                </div>

                <div
                  className="flex items-center gap-2.5 rounded-[12px] px-3.5 py-2.5 text-[13px]"
                  style={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--line)',
                    color: 'var(--ink)',
                  }}
                >
                  <WhatsAppSvgIcon className="h-4 w-4 shrink-0 text-[#25D366]" />
                  <span className="truncate">
                    “Hola Andrea, te esperamos hoy 11:00 en Spa Zamay”
                  </span>
                </div>
              </div>

              {/* Bento 3 (Mediano): Promos Flash (Ámbar #F59E0B exclusivo para promos) */}
              <div
                className="flex flex-col justify-between rounded-[16px] p-5 md:col-span-2"
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--line)',
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-[12px]"
                    style={{
                      backgroundColor: 'rgba(245, 158, 11, 0.14)',
                      color: '#F59E0B',
                    }}
                  >
                    <Tag className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <span
                    className="rounded-[10px] px-2.5 py-1 text-[12px] font-medium tabular-nums"
                    style={{
                      backgroundColor: 'rgba(245, 158, 11, 0.14)',
                      color: '#F59E0B',
                    }}
                  >
                    20% OFF valle
                  </span>
                </div>
                <div className="mt-4">
                  <h3
                    className="font-outfit text-[18px]"
                    style={{ color: 'var(--ink)' }}
                  >
                    Promos Flash
                  </h3>
                  <p
                    className="mt-1 text-[14px]"
                    style={{ color: 'var(--sub)' }}
                  >
                    Llena horarios tranquilos con descuentos por tiempo limitado.
                  </p>
                </div>
              </div>

              {/* Bento 4 (Mediano): Ficha VIP */}
              <div
                className="flex flex-col justify-between rounded-[16px] p-5 md:col-span-2"
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--line)',
                }}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-[12px]"
                  style={{
                    backgroundColor: 'var(--cys)',
                    color: 'var(--cyt)',
                  }}
                >
                  <ClipboardList className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="mt-4">
                  <h3
                    className="font-outfit text-[18px]"
                    style={{ color: 'var(--ink)' }}
                  >
                    Ficha VIP por cliente
                  </h3>
                  <p
                    className="mt-1 text-[14px]"
                    style={{ color: 'var(--sub)' }}
                  >
                    Guarda historial, preferencias o datos de mascota y fideliza mejor.
                  </p>
                </div>
              </div>

              {/* Bento 5 (Mediano): Catálogo integrado */}
              <div
                className="flex flex-col justify-between rounded-[16px] p-5 md:col-span-2"
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--line)',
                }}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-[12px]"
                  style={{
                    backgroundColor: 'var(--ps)',
                    color: 'var(--p)',
                  }}
                >
                  <ShoppingBag className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="mt-4">
                  <h3
                    className="font-outfit text-[18px]"
                    style={{ color: 'var(--ink)' }}
                  >
                    Catálogo para vender más
                  </h3>
                  <p
                    className="mt-1 text-[14px]"
                    style={{ color: 'var(--sub)' }}
                  >
                    Muestra tus productos junto a cada cita y aumenta el ticket promedio.
                  </p>
                </div>
              </div>
            </div>

            {/* 3 Rubros visuales con tarjetas planas limpias (sin gradientes ni sombras fuertes) */}
            <div className="mt-7 flex gap-3.5 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:pb-0">
              {[
                {
                  img: heroVeterinariaImg,
                  titulo: 'Veterinarias',
                  beneficio: 'Promos en baño, vacunas y control por mascota.',
                },
                {
                  img: heroConsultorioImg,
                  titulo: 'Consultorios y Clínicas',
                  beneficio: 'Citas sin colas y recordatorios puntuales.',
                },
                {
                  img: heroSalonImg,
                  titulo: 'Salones y Spa',
                  beneficio: 'Ofertas flash y catálogo que hace volver.',
                },
              ].map((card) => (
                <button
                  key={card.titulo}
                  type="button"
                  onClick={onViewDemo}
                  className="tap-feedback group w-[76vw] max-w-[300px] shrink-0 snap-center md:w-auto md:max-w-none overflow-hidden rounded-[16px] text-left flex flex-col"
                  style={{
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--line)',
                  }}
                >
                  <div className="h-44 w-full overflow-hidden">
                    <img
                      src={card.img}
                      alt={card.titulo}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div
                    className="flex-1 p-4"
                    style={{ borderTop: '1px solid var(--line)' }}
                  >
                    <h3
                      className="font-outfit text-[18px]"
                      style={{ color: 'var(--ink)' }}
                    >
                      {card.titulo}
                    </h3>
                    <p
                      className="mt-1 text-[14px]"
                      style={{ color: 'var(--sub)' }}
                    >
                      {card.beneficio}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* CÓMO FUNCIONA */}
        <section
          id="solucion"
          className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16"
        >
          <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-6">
              <div
                className="overflow-hidden rounded-[16px]"
                style={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--line)',
                }}
              >
                <img
                  src={clientPhoneImg}
                  alt="Cliente reservando una cita desde su celular"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover aspect-[16/10] sm:aspect-[4/3]"
                />
              </div>
            </div>

            <div className="space-y-4 sm:space-y-5 lg:col-span-6">
              <div>
                <h2
                  className="font-outfit text-[26px] leading-[1.15] sm:text-[32px] [text-wrap:balance]"
                  style={{ color: 'var(--ink)' }}
                >
                  Tus clientes te guardan en su celular y vuelven solos
                </h2>
                <p
                  className="mt-1.5 text-[16px]"
                  style={{ color: 'var(--sub)' }}
                >
                  Sin descargas pesadas ni filas: una experiencia rápida con tu logo.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    icon: Smartphone,
                    titulo: '01. Tu App con tu nombre y QR',
                    detalle:
                      'Se instala en segundos directo en la pantalla de tu cliente.',
                  },
                  {
                    icon: CalendarCheck2,
                    titulo: '02. Horarios libres en vivo',
                    detalle:
                      'Cero citas cruzadas: cada turno tomado se bloquea solo.',
                  },
                  {
                    icon: ShieldCheck,
                    titulo: '03. Promos, fichas y caja al día',
                    detalle: 'Todo tu negocio ordenado desde el celular.',
                  },
                ].map((step) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={step.titulo}
                      className="flex items-center gap-3.5 rounded-[12px] p-4"
                      style={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--line)',
                      }}
                    >
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]"
                        style={{
                          backgroundColor: 'var(--cys)',
                          color: 'var(--cyt)',
                        }}
                      >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <h3
                          className="font-outfit text-[16px]"
                          style={{ color: 'var(--ink)' }}
                        >
                          {step.titulo}
                        </h3>
                        <p
                          className="text-[14px]"
                          style={{ color: 'var(--sub)' }}
                        >
                          {step.detalle}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* MARQUEE DE RESEÑAS (lento y pausable) */}
        <section
          id="resenas"
          className="overflow-hidden py-10 sm:py-14"
          style={{
            backgroundColor: 'var(--bg)',
            borderTop: '1px solid var(--line)',
          }}
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2
                  className="font-outfit text-[26px] leading-[1.15] sm:text-[32px] [text-wrap:balance]"
                  style={{ color: 'var(--ink)' }}
                >
                  Negocios en todo el Perú ya llenan su agenda
                </h2>
                <p
                  className="mt-1 text-[16px]"
                  style={{ color: 'var(--sub)' }}
                >
                  Experiencias reales de veterinarias, consultorios y salones.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMarqueePaused((prev) => !prev)}
                aria-pressed={marqueePaused}
                className="tap-feedback inline-flex min-h-[40px] items-center gap-1.5 rounded-[12px] px-3.5 text-[13px] font-medium self-start sm:self-auto whitespace-nowrap"
                style={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--line)',
                  color: 'var(--ink)',
                }}
              >
                {marqueePaused ? (
                  <>
                    <Play className="h-3.5 w-3.5" aria-hidden="true" />
                    Reanudar reseñas
                  </>
                ) : (
                  <>
                    <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                    Pausar reseñas
                  </>
                )}
              </button>
            </div>
          </div>

          <div
            className="maria-marquee-wrapper mt-6 overflow-hidden"
            onClick={() => setMarqueePaused((prev) => !prev)}
          >
            <div
              className="maria-marquee-track gap-4 px-4"
              data-paused={marqueePaused ? 'true' : 'false'}
            >
              {[0, 1].map((dupIndex) => (
                <div
                  key={dupIndex}
                  aria-hidden={dupIndex === 1}
                  className="flex shrink-0 gap-4"
                >
                  {MARQUEE_REVIEWS.map((rev) => (
                    <article
                      key={`${dupIndex}-${rev.nombre}`}
                      className="flex w-[290px] sm:w-[330px] shrink-0 flex-col justify-between rounded-[16px] p-5"
                      style={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--line)',
                      }}
                    >
                      <div>
                        <div className="flex items-center gap-1">
                          {[0, 1, 2, 3, 4].map((starIdx) => (
                            <Star
                              key={starIdx}
                              className="h-3.5 w-3.5 fill-current"
                              style={{ color: 'var(--cy)' }}
                              aria-hidden="true"
                            />
                          ))}
                        </div>
                        <p
                          className="mt-3 text-[14px] leading-[1.55]"
                          style={{ color: 'var(--ink)' }}
                        >
                          “{rev.texto}”
                        </p>
                      </div>

                      <div
                        className="mt-4 flex items-center justify-between gap-2 pt-3"
                        style={{ borderTop: '1px solid var(--line)' }}
                      >
                        <div className="min-w-0">
                          <p
                            className="font-outfit truncate text-[14px]"
                            style={{ color: 'var(--ink)' }}
                          >
                            {rev.nombre}
                          </p>
                          <p
                            className="truncate text-[12px]"
                            style={{ color: 'var(--sub)' }}
                          >
                            {rev.negocio}
                          </p>
                        </div>
                        <span
                          className="shrink-0 rounded-[10px] px-2 py-0.5 text-[11px] font-medium"
                          style={{
                            backgroundColor: 'var(--cys)',
                            color: 'var(--cyt)',
                          }}
                        >
                          Verificada
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PLANES */}
        <section
          id="planes"
          className="py-12 sm:py-16"
          style={{
            backgroundColor: 'var(--card)',
            borderTop: '1px solid var(--line)',
          }}
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <h2
                className="font-outfit text-[26px] leading-[1.15] sm:text-[32px]"
                style={{ color: 'var(--ink)' }}
              >
                Elige tu plan y activa solo lo que necesitas
              </h2>
              <p
                className="mx-auto mt-2 max-w-lg text-[16px]"
                style={{ color: 'var(--sub)' }}
              >
                Empieza hoy con tu cuenta y cambia de plan cuando tu negocio crezca.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
              {PLAN_ORDER.map((planId) => {
                const plan = PLANS[planId];
                return (
                  <div
                    key={plan.id}
                    className="flex flex-col justify-between rounded-[16px] p-6"
                    style={{
                      backgroundColor: plan.destacado
                        ? 'var(--card)'
                        : 'var(--bg)',
                      border: plan.destacado
                        ? '1px solid var(--p)'
                        : '1px solid var(--line)',
                    }}
                  >
                    <div>
                      <div className="flex items-baseline justify-between gap-2">
                        <h3
                          className="font-outfit text-[20px]"
                          style={{ color: 'var(--ink)' }}
                        >
                          {plan.nombre}
                        </h3>
                        {plan.destacado && (
                          <span
                            className="rounded-[10px] px-2.5 py-0.5 text-[12px] font-medium"
                            style={{
                              backgroundColor: 'var(--cys)',
                              color: 'var(--cyt)',
                            }}
                          >
                            Más elegido
                          </span>
                        )}
                      </div>
                      <p
                        className="mt-1 text-[14px]"
                        style={{ color: 'var(--sub)' }}
                      >
                        {plan.subtitulo}
                      </p>

                      <div
                        className="mt-5 flex items-baseline gap-1 pb-5"
                        style={{ borderBottom: '1px solid var(--line)' }}
                      >
                        <span
                          className="font-outfit text-[32px] tabular-nums"
                          style={{ color: 'var(--ink)' }}
                        >
                          S/ {plan.precioMensual}
                        </span>
                        <span
                          className="text-[14px]"
                          style={{ color: 'var(--sub)' }}
                        >
                          / mes
                        </span>
                      </div>

                      <ul
                        className="mt-5 space-y-2.5 text-[14px]"
                        style={{ color: 'var(--ink)' }}
                      >
                        {plan.beneficios.map((ben) => (
                          <li key={ben} className="flex items-start gap-2">
                            <Check
                              className="mt-0.5 h-4 w-4 shrink-0"
                              style={{ color: 'var(--cyt)' }}
                              aria-hidden="true"
                            />
                            <span>{ben}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => onCreateAccount(plan.id)}
                      className="tap-feedback mt-6 flex min-h-[48px] w-full items-center justify-center rounded-[12px] px-4 text-[15px] font-medium transition-colors"
                      style={
                        plan.destacado
                          ? {
                              backgroundColor: 'var(--p)',
                              color: 'var(--onp)',
                            }
                          : {
                              backgroundColor: 'var(--card)',
                              border: '1px solid var(--line)',
                              color: 'var(--ink)',
                            }
                      }
                    >
                      Crear mi cuenta
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <footer
        className="py-6 text-center text-[14px]"
        style={{
          backgroundColor: 'var(--bg)',
          borderTop: '1px solid var(--line)',
          color: 'var(--sub)',
        }}
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 sm:flex-row sm:px-6">
          <p>
            <strong style={{ color: 'var(--ink)' }}>MarIA Citas</strong> · Tu App
            de reservas y clientes
          </p>
          <p>Desarrollado con pasión, Perú 🇵🇪.</p>
        </div>
      </footer>
    </div>
  );
};
