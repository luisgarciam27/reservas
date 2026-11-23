import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowLeftRight,
  Briefcase,
  CalendarPlus,
  Download,
  Gift,
  Home,
  MapPin,
  Sparkles,
  User,
} from 'lucide-react';
import { AuthSheet } from '../components/AuthSheet';
import { BookingTab, type BookedSummary } from '../components/BookingTab';
import { BusinessLanding } from '../components/BusinessLanding';
import { BusinessWelcomeSheet } from '../components/BusinessWelcomeSheet';
import { ClientProfileTab } from '../components/ClientProfileTab';
import { OwnerDashboard } from '../components/owner/OwnerDashboard';
import { PromosTab } from '../components/PromosTab';
import {
  OfflineNoticeInline,
  PWAInstallBanner,
} from '../components/PWABanners';
import { PWAInstallModal } from '../components/PWAInstallModal';
import { WhatsAppSvgIcon } from '../components/RubroIcons';
import { RubroSelector } from '../components/RubroSelector';
import {
  RUBROS,
  type RubroConfig,
  type RubroKey,
  type ServicioItem,
} from '../config/rubros';
import { useAuthSession } from '../hooks/useAuthSession';
import type { AppointmentRecord } from '../types/app';

type ClientTabKey = 'inicio' | 'reservar' | 'promos' | 'perfil';
const LOCAL_BOOKINGS_KEY = 'maria_local_bookings_v1';

interface DemoPageProps {
  onBackToSaaSLanding: () => void;
  onCreateAccount: () => void;
}

export const DemoPage: React.FC<DemoPageProps> = ({
  onBackToSaaSLanding,
  onCreateAccount,
}) => {
  const {
    session,
    registerClient,
    loginClientByPhone,
    loginAsOwner,
    continueAsGuest,
    logout,
  } = useAuthSession();

  const [selectedRubroKey, setSelectedRubroKey] = useState<RubroKey | null>(
    null
  );
  const [clientTab, setClientTab] = useState<ClientTabKey>('inicio');
  const [preselectedService, setPreselectedService] =
    useState<ServicioItem | null>(null);
  const [lastBooking, setLastBooking] = useState<BookedSummary | null>(null);
  const [ownerPreviewClient, setOwnerPreviewClient] = useState<boolean>(false);

  const [installModalOpen, setInstallModalOpen] = useState<boolean>(false);
  const [welcomeSheetOpen, setWelcomeSheetOpen] = useState<boolean>(false);
  const [authSheetOpen, setAuthSheetOpen] = useState<boolean>(false);
  const [authInitialMode, setAuthInitialMode] = useState<
    'register' | 'login' | 'owner'
  >('register');

  const [localBookings, setLocalBookings] = useState<AppointmentRecord[]>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_BOOKINGS_KEY);
      if (raw) return JSON.parse(raw) as AppointmentRecord[];
    } catch {
      // Ignorar
    }
    return [];
  });

  const [rubroOverrides, setRubroOverrides] = useState<
    Partial<Record<RubroKey, { servicios: ServicioItem[]; diasLabel: string }>>
  >({});

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_BOOKINGS_KEY, JSON.stringify(localBookings));
    } catch {
      // Ignorar
    }
  }, [localBookings]);

  const rubro: RubroConfig | null = useMemo(() => {
    if (!selectedRubroKey) return null;
    const base = RUBROS[selectedRubroKey];
    const override = rubroOverrides[selectedRubroKey];
    if (!override) return base;
    return {
      ...base,
      servicios: override.servicios,
      horario: {
        ...base.horario,
        diasLabel: override.diasLabel,
      },
    };
  }, [selectedRubroKey, rubroOverrides]);

  useEffect(() => {
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute(
        'content',
        rubro ? rubro.colores.themeColorMeta : '#4F46E5'
      );
    }
  }, [rubro]);

  const handleOpenAuthSheet = (
    mode: 'register' | 'login' | 'owner' = 'register'
  ) => {
    setAuthInitialMode(mode);
    setAuthSheetOpen(true);
  };

  const handleSelectRubro = (key: RubroKey) => {
    setSelectedRubroKey(key);
    setClientTab('inicio');
    setOwnerPreviewClient(false);
    setPreselectedService(null);
    if (session.role === 'guest') {
      setWelcomeSheetOpen(true);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChangeRubro = () => {
    setSelectedRubroKey(null);
    setClientTab('inicio');
    setOwnerPreviewClient(false);
    setPreselectedService(null);
    setWelcomeSheetOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartBooking = (service?: ServicioItem) => {
    setPreselectedService(service ?? null);
    setClientTab('reservar');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClientTabChange = (tab: ClientTabKey) => {
    if (tab !== 'reservar') {
      setPreselectedService(null);
    }
    setClientTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBookingCreated = (summary: BookedSummary) => {
    setLastBooking(summary);
    if (!rubro) return;

    const record: AppointmentRecord = {
      id: `local-${Date.now()}`,
      negocioId: rubro.negocio_id,
      fecha: summary.fecha,
      hora: summary.hora,
      cliente: summary.cliente,
      telefono: summary.telefono,
      ciudad: summary.ciudad || 'Perú',
      servicio: summary.servicio,
      precio: summary.precio,
      estado: 'pendiente',
      pagoEstado: 'sin_pago',
      montoPagado: 0,
      extra: summary.nombreMascota
        ? `${summary.nombreMascota} (${summary.tipoMascota || 'Mascota'})`
        : summary.motivo,
      createdAt: new Date().toISOString(),
    };
    setLocalBookings((prev) => [record, ...prev]);
  };

  const isOwnerActive = session.role === 'owner' && !ownerPreviewClient;

  const whatsappUrl = rubro
    ? `https://wa.me/${rubro.whatsapp}?text=${encodeURIComponent(
        `Hola MarIA, consulto desde ${rubro.nombre}.`
      )}`
    : `https://wa.me/51964112233?text=${encodeURIComponent(
        'Hola MarIA, probé el demo y quiero activar la App de citas para mi negocio.'
      )}`;

  const CLIENT_TABS: {
    id: ClientTabKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'inicio', label: 'Inicio', icon: Home },
    { id: 'reservar', label: 'Sacar cita', icon: CalendarPlus },
    { id: 'promos', label: 'Promos', icon: Gift },
    {
      id: 'perfil',
      label: session.role === 'client' ? 'Mi Perfil' : 'Ingresar',
      icon: User,
    },
  ];

  return (
    <>
      {/* Cinta superior discreta de regreso a MarIA Citas */}
      <div
        className="relative z-40 px-4 py-2 md:sticky md:top-0"
        style={{
          backgroundColor: 'var(--card)',
          borderBottom: '1px solid var(--line)',
          color: 'var(--ink)',
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 text-xs">
          <button
            type="button"
            onClick={onBackToSaaSLanding}
            className="inline-flex min-h-[38px] items-center gap-1.5 font-semibold hover:underline underline-offset-4 whitespace-nowrap"
            style={{ color: 'var(--ink)' }}
          >
            <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
            <span className="sm:hidden">Volver</span>
            <span className="hidden sm:inline">Volver a MarIA Citas</span>
          </button>
          <span
            className="hidden sm:inline font-medium"
            style={{ color: 'var(--sub)' }}
          >
            Demo en vivo · Tu App de citas sin registro
          </span>
          <button
            type="button"
            onClick={onCreateAccount}
            className="tap-feedback inline-flex min-h-[38px] items-center gap-1.5 rounded-[10px] px-3 font-medium whitespace-nowrap"
            style={{
              backgroundColor: 'var(--p)',
              color: 'var(--onp)',
            }}
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            Crear mi cuenta
          </button>
        </div>
      </div>

      {!rubro ? (
        <>
          <RubroSelector
            session={session}
            onSelectRubro={handleSelectRubro}
            onOpenAuthSheet={handleOpenAuthSheet}
          />
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
          className="min-h-[100dvh] flex flex-col transition-colors duration-300"
          style={{ backgroundColor: rubro.colores.fondoSuave }}
        >
          <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md md:top-[54px]">
            <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-4">
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg"
                  style={{ backgroundColor: rubro.colores.superficieDestacada }}
                >
                  {rubro.logoEmoji}
                </span>
                <div className="min-w-0">
                  <span
                    className={`block truncate text-sm font-bold text-slate-900 sm:text-base ${
                      rubro.tipografia.esEditorialSerif
                        ? 'font-display-serif text-lg sm:text-xl'
                        : ''
                    }`}
                  >
                    {rubro.nombre}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                {session.role === 'owner' && ownerPreviewClient && (
                  <button
                    type="button"
                    onClick={() => setOwnerPreviewClient(false)}
                    style={{ backgroundColor: rubro.colores.primario }}
                    className="tap-feedback inline-flex min-h-[38px] items-center gap-1.5 rounded-xl px-3 text-xs font-bold text-white whitespace-nowrap"
                  >
                    <Briefcase className="h-3.5 w-3.5" />
                    <span>Volver a Panel Dueño</span>
                  </button>
                )}

                {!isOwnerActive && (
                  <button
                    type="button"
                    onClick={() => setInstallModalOpen(true)}
                    aria-label="Descargar App al móvil"
                    className="tap-feedback inline-flex min-h-[38px] items-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50 px-2.5 text-xs font-bold text-indigo-800 hover:bg-indigo-100 whitespace-nowrap"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Descargar App</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    handleOpenAuthSheet(
                      session.role === 'owner'
                        ? 'owner'
                        : session.role === 'client'
                          ? 'login'
                          : 'register'
                    )
                  }
                  className="tap-feedback inline-flex min-h-[38px] items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 whitespace-nowrap"
                >
                  <User className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">
                    {session.role === 'owner'
                      ? 'Dueño'
                      : session.role === 'client'
                        ? session.nombre.split(' ')[0]
                        : 'Rol'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleChangeRubro}
                  className="tap-feedback inline-flex min-h-[38px] shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 whitespace-nowrap"
                >
                  <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Rubros</span>
                </button>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-4 pb-28 md:px-6 md:pt-6 md:pb-12">
            <OfflineNoticeInline />

            {isOwnerActive ? (
              <OwnerDashboard
                rubro={rubro}
                session={session}
                externalBookings={localBookings}
                onUpdateRubroSettings={(params) => {
                  if (!selectedRubroKey) return;
                  setRubroOverrides((prev) => ({
                    ...prev,
                    [selectedRubroKey]: params,
                  }));
                }}
                onViewAsClient={() => setOwnerPreviewClient(true)}
                onLogout={() => {
                  logout();
                  setOwnerPreviewClient(false);
                }}
              />
            ) : (
              <>
                <nav
                  aria-label="Navegación del cliente"
                  className="mb-4 hidden grid-cols-4 gap-2 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-2xs md:grid"
                >
                  {CLIENT_TABS.map((tab) => {
                    const active = clientTab === tab.id;
                    const IconComp = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => handleClientTabChange(tab.id)}
                        style={
                          active
                            ? {
                                backgroundColor:
                                  rubro.colores.superficieDestacada,
                                color: rubro.colores.primario,
                              }
                            : undefined
                        }
                        className={`tap-feedback flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-2 text-xs font-bold transition-colors whitespace-nowrap ${
                          active
                            ? 'shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <IconComp className="h-4 w-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>

                {clientTab !== 'inicio' && (
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
                        <MapPin
                          className="h-3.5 w-3.5 shrink-0"
                          aria-hidden="true"
                        />
                        <span>{rubro.horario.diasLabel}</span>
                      </div>
                    </div>
                  </section>
                )}

                <div>
                  {clientTab === 'inicio' && (
                    <BusinessLanding
                      rubro={rubro}
                      userRole={session.role}
                      userName={session.nombre}
                      onStartBooking={handleStartBooking}
                      onOpenInstallModal={() => setInstallModalOpen(true)}
                      onOpenAuthSheet={handleOpenAuthSheet}
                    />
                  )}

                  {clientTab === 'reservar' && (
                    <BookingTab
                      rubro={rubro}
                      session={session}
                      initialService={preselectedService}
                      onBackToLanding={() => handleClientTabChange('inicio')}
                      onBookingCreated={handleBookingCreated}
                      onRegisterClient={registerClient}
                      onOpenInstallModal={() => setInstallModalOpen(true)}
                      onOpenAuthSheet={handleOpenAuthSheet}
                      onGoToProfile={() => handleClientTabChange('perfil')}
                    />
                  )}

                  {clientTab === 'promos' && (
                    <PromosTab
                      rubro={rubro}
                      isOwner={session.role === 'owner'}
                      onSelectServiceAndBook={handleStartBooking}
                    />
                  )}

                  {clientTab === 'perfil' && (
                    <ClientProfileTab
                      rubro={rubro}
                      session={session}
                      lastBooking={lastBooking}
                      localBookings={localBookings}
                      onOpenAuthSheet={handleOpenAuthSheet}
                      onOpenInstallModal={() => setInstallModalOpen(true)}
                      onStartBooking={() => handleStartBooking()}
                      onLogout={logout}
                    />
                  )}
                </div>

                <div className="mt-6">
                  <PWAInstallBanner accentColor={rubro.colores.primario} />
                </div>

                <nav
                  aria-label="Navegación principal móvil"
                  className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md pb-safe md:hidden"
                >
                  <div className="grid h-[62px] grid-cols-4 items-center">
                    {CLIENT_TABS.map((tab) => {
                      const active = clientTab === tab.id;
                      const IconComp = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => handleClientTabChange(tab.id)}
                          aria-current={active ? 'page' : undefined}
                          style={{
                            color: active ? rubro.colores.primario : '#64748B',
                          }}
                          className="tap-feedback flex h-full min-h-[48px] flex-col items-center justify-center gap-0.5 px-1"
                        >
                          <IconComp className="h-5 w-5" />
                          <span className="text-[10px] font-bold whitespace-nowrap">
                            {tab.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </nav>
              </>
            )}

            <footer className="mt-6 border-t border-black/10 pt-4 text-center text-xs text-slate-500">
              Demo creada por{' '}
              <span className="font-semibold text-slate-800">MarIA</span> ·
              Desarrollado con pasión, Perú 🇵🇪.
            </footer>
          </main>

          {!isOwnerActive && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Hablar por WhatsApp"
              className="tap-feedback fixed bottom-20 right-4 z-30 flex h-13 w-13 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-emerald-950/25 md:bottom-6 md:right-6"
            >
              <WhatsAppSvgIcon className="h-7 w-7" />
            </a>
          )}
        </div>
      )}

      {rubro && (
        <BusinessWelcomeSheet
          key={rubro.id}
          open={welcomeSheetOpen && session.role === 'guest'}
          rubro={rubro}
          onClose={() => setWelcomeSheetOpen(false)}
          onRegisterAndContinue={(params) => {
            registerClient(params);
            setWelcomeSheetOpen(false);
            setClientTab('reservar');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onBookAsGuest={() => {
            continueAsGuest();
            setWelcomeSheetOpen(false);
            setClientTab('reservar');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenLogin={() => {
            setWelcomeSheetOpen(false);
            handleOpenAuthSheet('login');
          }}
          onOpenOwnerLogin={() => {
            setWelcomeSheetOpen(false);
            handleOpenAuthSheet('owner');
          }}
          onOpenInstallModal={() => {
            setWelcomeSheetOpen(false);
            setInstallModalOpen(true);
          }}
        />
      )}

      <PWAInstallModal
        open={installModalOpen}
        onClose={() => setInstallModalOpen(false)}
        accentColor={rubro?.colores.primario || '#4F46E5'}
      />

      <AuthSheet
        key={`${authSheetOpen}-${authInitialMode}`}
        open={authSheetOpen}
        onClose={() => setAuthSheetOpen(false)}
        rubro={rubro}
        session={session}
        initialMode={authInitialMode}
        onRegisterClient={registerClient}
        onLoginClient={loginClientByPhone}
        onLoginOwner={(params) => {
          loginAsOwner(params);
          setOwnerPreviewClient(false);
          if (!selectedRubroKey) {
            setSelectedRubroKey('consultorio');
          }
        }}
        onContinueAsGuest={continueAsGuest}
        onOpenInstallModal={() => setInstallModalOpen(true)}
      />
    </>
  );
};
