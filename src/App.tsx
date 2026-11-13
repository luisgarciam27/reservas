import React, { useEffect, useState } from 'react';
import { ArrowLeftRight, MapPin, Users } from 'lucide-react';
import { BookingTab, type BookedSummary } from './components/BookingTab';
import { BusinessLanding } from './components/BusinessLanding';
import { ClientsTab } from './components/ClientsTab';
import { OwnerTab } from './components/OwnerTab';
import {
  OfflineNoticeInline,
  PWAInstallBanner,
  SWUpdateBanner,
} from './components/PWABanners';
import { ReminderTab } from './components/ReminderTab';
import {
  NavCalendarIcon,
  NavOwnerIcon,
  NavReminderIcon,
  WhatsAppSvgIcon,
} from './components/RubroIcons';
import { RubroSelector } from './components/RubroSelector';
import { SplashIntro } from './components/SplashIntro';
import { RUBROS, type CitaEjemplo, type RubroKey, type ServicioItem } from './config/rubros';

type TabKey = 'reservar' | 'recordatorio' | 'dueno' | 'clientes';

export default function App() {
  const [selectedRubroKey, setSelectedRubroKey] = useState<RubroKey | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<TabKey>('reservar');
  const [isAgendaOpen, setIsAgendaOpen] = useState<boolean>(false);
  const [preselectedService, setPreselectedService] =
    useState<ServicioItem | null>(null);
  const [lastBooking, setLastBooking] = useState<BookedSummary | null>(null);
  const [currentCitas, setCurrentCitas] = useState<CitaEjemplo[]>([]);

  const rubro = selectedRubroKey ? RUBROS[selectedRubroKey] : null;

  useEffect(() => {
    if (rubro) {
      setCurrentCitas(rubro.citasEjemplo);
    }
  }, [rubro]);

  // Sincroniza el color de barra del sistema (theme-color) con el rubro activo
  useEffect(() => {
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute(
        'content',
        rubro ? rubro.colores.themeColorMeta : '#4F46E5'
      );
    }
  }, [rubro]);

  const handleSelectRubro = (key: RubroKey) => {
    setSelectedRubroKey(key);
    setActiveTab('reservar');
    setIsAgendaOpen(false);
    setPreselectedService(null);
    setLastBooking(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChangeRubro = () => {
    setSelectedRubroKey(null);
    setIsAgendaOpen(false);
    setPreselectedService(null);
    setLastBooking(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartBooking = (service?: ServicioItem) => {
    setPreselectedService(service ?? null);
    setIsAgendaOpen(true);
    setActiveTab('reservar');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTabChange = (tab: TabKey) => {
    if (tab === 'reservar' && activeTab === 'reservar' && isAgendaOpen) {
      setIsAgendaOpen(false);
      setPreselectedService(null);
    } else {
      setActiveTab(tab);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const whatsappUrl = rubro
    ? `https://wa.me/${rubro.whatsapp}?text=${encodeURIComponent(
        `Hola MarIA, acabo de probar la demo para ${rubro.rubroLabel} y quiero información para mi negocio.`
      )}`
    : `https://wa.me/51964112233?text=${encodeURIComponent(
        'Hola MarIA, vi tu demo de reservas por WhatsApp y quiero implementarla en mi negocio.'
      )}`;

  const TABS_CONFIG = [
    {
      id: 'reservar' as TabKey,
      label: isAgendaOpen ? 'Agenda y reserva' : 'Inicio y servicios',
      icon: NavCalendarIcon,
    },
    {
      id: 'recordatorio' as TabKey,
      label: 'Recordatorio',
      icon: NavReminderIcon,
    },
    {
      id: 'dueno' as TabKey,
      label: 'Agenda Dueño',
      icon: NavOwnerIcon,
    },
    {
      id: 'clientes' as TabKey,
      label: 'Clientes',
      icon: Users,
    },
  ];

  return (
    <>
      <SplashIntro />
      <SWUpdateBanner />

      {!rubro ? (
        <>
          <RubroSelector onSelectRubro={handleSelectRubro} />
          {/* Botón flotante de WhatsApp en pantalla inicial */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Contactar a MarIA por WhatsApp"
            className="tap-feedback fixed bottom-5 right-4 z-30 flex h-13 w-13 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-emerald-950/20 sm:bottom-6 sm:right-6"
          >
            <WhatsAppSvgIcon className="h-7 w-7" />
          </a>
        </>
      ) : (
        <div
          className="min-h-[100dvh] flex flex-col transition-colors duration-200"
          style={{ backgroundColor: rubro.colores.fondoSuave }}
        >
          {/* Barra superior fija compacta (54px) */}
          <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md pt-safe">
            <div className="mx-auto flex h-[54px] max-w-5xl items-center justify-between gap-3 px-4">
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg"
                  style={{ backgroundColor: rubro.colores.superficieDestacada }}
                >
                  {rubro.logoEmoji}
                </span>
                <span
                  className={`truncate text-sm font-bold text-slate-900 sm:text-base ${
                    rubro.tipografia.esEditorialSerif
                      ? 'font-display-serif text-lg sm:text-xl'
                      : ''
                  }`}
                >
                  {rubro.nombre}
                </span>
              </div>

              <button
                type="button"
                onClick={handleChangeRubro}
                className="tap-feedback inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 hover:bg-slate-100 whitespace-nowrap"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden="true" />
                Cambiar rubro
              </button>
            </div>
          </header>

          {/* Contenido principal con espacio inferior seguro para bottom nav en móvil */}
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-4 pb-28 md:px-6 md:pt-6 md:pb-12">
            {/* Navegación por pestañas en escritorio/tablet (4 pestañas) */}
            <nav
              aria-label="Vistas de la demostración"
              className="mb-4 hidden grid-cols-4 gap-2 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-2xs md:grid"
            >
              {TABS_CONFIG.map((tab) => {
                const active = activeTab === tab.id;
                const IconComp = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabChange(tab.id)}
                    style={
                      active
                        ? {
                            backgroundColor: rubro.colores.superficieDestacada,
                            color: rubro.colores.primario,
                          }
                        : undefined
                    }
                    className={`tap-feedback flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                      active
                        ? 'shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <IconComp active={active} className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Cabecera compacta de contexto cuando ya está abierta la agenda o las otras pestañas */}
            {(isAgendaOpen || activeTab !== 'reservar') && (
              <section
                className="mb-4 rounded-2xl border bg-white px-4 py-3 shadow-2xs"
                style={{ borderColor: rubro.colores.bordeSuave }}
              >
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p
                      className="text-xs font-bold"
                      style={{ color: rubro.colores.primario }}
                    >
                      {rubro.rubroLabel} · {rubro.ciudad}
                    </p>
                    <p
                      className={`text-base font-bold text-slate-900 ${
                        rubro.tipografia.esEditorialSerif
                          ? 'font-display-serif text-xl'
                          : ''
                      }`}
                    >
                      {rubro.nombre}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>{rubro.horario.diasLabel}</span>
                  </div>
                </div>
              </section>
            )}

            <OfflineNoticeInline />

            {/* Vista activa */}
            <div className="transition-opacity duration-200">
              {activeTab === 'reservar' &&
                (!isAgendaOpen ? (
                  <BusinessLanding
                    rubro={rubro}
                    onStartBooking={handleStartBooking}
                  />
                ) : (
                  <BookingTab
                    rubro={rubro}
                    initialService={preselectedService}
                    onBackToLanding={() => {
                      setIsAgendaOpen(false);
                      setPreselectedService(null);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    onBookingCreated={(summary) => {
                      setLastBooking(summary);
                    }}
                    onGoToReminder={() => handleTabChange('recordatorio')}
                  />
                ))}

              {activeTab === 'recordatorio' && (
                <ReminderTab rubro={rubro} lastBooking={lastBooking} />
              )}

              {activeTab === 'dueno' && (
                <OwnerTab
                  rubro={rubro}
                  lastBooking={lastBooking}
                  onUpdateCitas={(updated) => setCurrentCitas(updated)}
                />
              )}

              {activeTab === 'clientes' && (
                <ClientsTab rubro={rubro} citas={currentCitas} />
              )}
            </div>

            {/* Banner discreto de instalación PWA dentro del flujo */}
            <div className="mt-6">
              <PWAInstallBanner accentColor={rubro.colores.primario} />
            </div>

            {/* Pie de página */}
            <footer className="mt-6 border-t border-black/10 pt-4 text-center text-xs text-slate-500">
              Demo creada por{' '}
              <span className="font-semibold text-slate-800">
                MarIA
              </span>{' '}
              · Reservas y WhatsApp en Huancayo
            </footer>
          </main>

          {/* Botón flotante de WhatsApp (elevado en móvil para nunca tapar la barra inferior) */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Hablar por WhatsApp con MarIA"
            className="tap-feedback fixed bottom-20 right-4 z-30 flex h-13 w-13 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-emerald-950/25 md:bottom-6 md:right-6"
          >
            <WhatsAppSvgIcon className="h-7 w-7" />
          </a>

          {/* Navegación inferior fija estilo app nativa (solo móvil < md, con 4 pestañas) */}
          <nav
            aria-label="Navegación principal"
            className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md pb-safe md:hidden"
          >
            <div className="grid h-[60px] grid-cols-4 items-center">
              {TABS_CONFIG.map((tab) => {
                const active = activeTab === tab.id;
                const IconComp = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabChange(tab.id)}
                    aria-current={active ? 'page' : undefined}
                    style={{
                      color: active ? rubro.colores.primario : '#64748B',
                    }}
                    className="tap-feedback flex h-full min-h-[48px] flex-col items-center justify-center gap-0.5 px-1"
                  >
                    <IconComp active={active} className="w-5 h-5" />
                    <span className="text-[10px] font-semibold tracking-tight whitespace-nowrap truncate max-w-[70px]">
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
