import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Clock,
  Moon,
  Smartphone,
  Sparkles,
  Sun,
} from 'lucide-react';
import { RUBROS, type RubroConfig, type RubroKey } from '../config/rubros';
import type { UserSession } from '../types/app';
import { MariaLogoMark, RubroSvgIcon } from './RubroIcons';

interface RubroSelectorProps {
  session: UserSession;
  onSelectRubro: (rubro: RubroKey) => void;
  onOpenAuthSheet?: (mode?: 'register' | 'login' | 'owner') => void;
}

type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'maria_theme_preference';
const RUBRO_ORDER: RubroKey[] = ['consultorio', 'salon', 'veterinaria'];

const RUBRO_SOLUTIONS: Record<RubroKey, string> = {
  consultorio: 'Evita cruces en recepción y ordena fichas de pacientes.',
  salon: 'Muestra tu catálogo visual, promos flash y fideliza clientas.',
  veterinaria: 'Historial por mascota, vacunas y turnos de baño sin esperas.',
};

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // Ignorar
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export const RubroSelector: React.FC<RubroSelectorProps> = ({
  session,
  onSelectRubro,
}) => {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => {
    const next: ThemeMode = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Ignorar
    }
  };

  const handleDownloadLogo = () => {
    const svgString = `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="512" height="512">
      <rect width="40" height="40" rx="11" fill="#EDE9FE"/>
      <rect x="8.5" y="11" width="23" height="20.5" rx="4" stroke="#5B21B6" stroke-width="2.4" fill="#FFFFFF"/>
      <path d="M8.5 16.5H31.5" stroke="#5B21B6" stroke-width="2.2"/>
      <path d="M14.5 8V12.5" stroke="#5B21B6" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M25.5 8V12.5" stroke="#5B21B6" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M20 19.2L21.15 22.35L24.3 23.5L21.15 24.65L20 27.8L18.85 24.65L15.7 23.5L18.85 22.35L20 19.2Z" fill="#0891B2"/>
    </svg>`;

    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, 512, 512);
        const pngUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = 'maria-citas-logo.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    };
    img.src = url;
  };

  return (
    <div
      className="font-inter min-h-[calc(100dvh-50px)] flex flex-col"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--ink)' }}
    >
      {/* Cabecera limpia en una sola fila */}
      <header
        className="w-full"
        style={{
          backgroundColor: 'var(--card)',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <MariaLogoMark className="h-8 w-8 shrink-0" />
            <span
              className="font-outfit text-[18px] sm:text-[20px] leading-none whitespace-nowrap"
              style={{ color: 'var(--ink)' }}
            >
              Mar<span style={{ color: 'var(--p)' }}>IA</span> Citas
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-[12px] px-3 text-[12px] font-semibold whitespace-nowrap"
              style={{
                backgroundColor: 'var(--cys)',
                color: 'var(--cyt)',
              }}
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Prueba libre sin registro
            </span>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                theme === 'dark'
                  ? 'Cambiar a modo claro'
                  : 'Cambiar a modo oscuro'
              }
              className="tap-feedback flex h-10 w-10 items-center justify-center rounded-[12px]"
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
          </div>
        </div>
      </header>

      {/* Contenido directo: cómo soluciona el negocio + elección de App demo */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-3xl text-center">
          <div
            className="inline-flex items-center gap-1.5 rounded-[12px] px-3 py-1.5 text-[13px] font-medium"
            style={{
              backgroundColor: 'var(--cys)',
              color: 'var(--cyt)',
            }}
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Demo interactivo · App de Citas 24/7</span>
          </div>

          <h1
            className="font-outfit mt-3.5 text-[32px] leading-[1.08] sm:text-[46px] [text-wrap:balance]"
            style={{ color: 'var(--ink)' }}
          >
            Tu negocio con su propia{' '}
            <span style={{ color: 'var(--p)' }}>App de citas</span>
          </h1>

          <p
            className="mt-2.5 text-[15px] sm:text-[17px] leading-[1.45]"
            style={{ color: 'var(--sub)' }}
          >
            Elige un negocio, mira sus fotos y{' '}
            <strong style={{ color: 'var(--ink)' }}>
              reserva una cita en vivo en 3 clics:
            </strong>
          </p>
        </div>

        {/* 3 pasos ultra vendedores y visuales en 3 clics */}
        <div className="mx-auto mt-6 grid w-full max-w-4xl grid-cols-1 gap-3 sm:grid-cols-3">
          <div
            className="flex items-center gap-3.5 rounded-[16px] p-4 shadow-2xs"
            style={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--line)',
            }}
          >
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] font-outfit text-lg font-extrabold"
              style={{
                backgroundColor: 'var(--ps)',
                color: 'var(--p)',
              }}
            >
              1
            </span>
            <div className="min-w-0">
              <p
                className="text-[14px] font-bold"
                style={{ color: 'var(--ink)' }}
              >
                Eligen en 3 clics
              </p>
              <p
                className="text-[12px] leading-snug"
                style={{ color: 'var(--sub)' }}
              >
                Servicio, hora y profesional al instante.
              </p>
            </div>
          </div>

          <div
            className="flex items-center gap-3.5 rounded-[16px] p-4 shadow-2xs"
            style={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--line)',
            }}
          >
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] font-outfit text-lg font-extrabold"
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.14)',
                color: '#F59E0B',
              }}
            >
              2
            </span>
            <div className="min-w-0">
              <p
                className="text-[14px] font-bold"
                style={{ color: 'var(--ink)' }}
              >
                Cero cruces de agenda
              </p>
              <p
                className="text-[12px] leading-snug"
                style={{ color: 'var(--sub)' }}
              >
                Horario ocupado se bloquea solo.
              </p>
            </div>
          </div>

          <div
            className="flex items-center gap-3.5 rounded-[16px] p-4 shadow-2xs"
            style={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--line)',
            }}
          >
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] font-outfit text-lg font-extrabold"
              style={{
                backgroundColor: 'var(--cys)',
                color: 'var(--cyt)',
              }}
            >
              3
            </span>
            <div className="min-w-0">
              <p
                className="text-[14px] font-bold"
                style={{ color: 'var(--ink)' }}
              >
                ¡Cita confirmada!
              </p>
              <p
                className="text-[12px] leading-snug"
                style={{ color: 'var(--sub)' }}
              >
                Aviso automático y recordatorio.
              </p>
            </div>
          </div>
        </div>

        {session.role === 'owner' && (
          <div
            className="mx-auto mt-5 w-full max-w-2xl rounded-[12px] p-3 text-center"
            style={{
              backgroundColor: 'var(--cys)',
              border: '1px solid var(--cy)',
              color: 'var(--cyt)',
            }}
          >
            <p className="text-[13px] font-medium">
              Sesión de Dueño activa (+51 {session.telefono}). Elige un negocio para abrir su Panel de Gestión.
            </p>
          </div>
        )}

        <section
          aria-label="Seleccionar rubro para probar la App de citas"
          className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {RUBRO_ORDER.map((key) => {
            const item: RubroConfig = RUBROS[key];
            const minPrice = Math.min(...item.servicios.map((s) => s.precio));
            const previewServices = item.servicios.slice(0, 2);

            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelectRubro(key)}
                className="tap-feedback group flex flex-col overflow-hidden rounded-[20px] text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                style={{
                  backgroundColor: 'var(--card)',
                  border: `1.5px solid ${item.colores.bordeSuave}`,
                }}
              >
                {/* Franja superior viva con el color propio del rubro */}
                <div
                  className="h-1.5 w-full"
                  style={{ backgroundColor: item.colores.primario }}
                />

                {/* Imagen superior luminosa */}
                <div className="relative h-48 w-full overflow-hidden">
                  <img
                    src={item.heroImage}
                    alt={item.heroAlt}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div
                    className="absolute top-3 left-3 flex h-11 w-11 items-center justify-center rounded-[14px] shadow-md"
                    style={{
                      backgroundColor: item.colores.primario,
                      color: '#FFFFFF',
                    }}
                  >
                    <RubroSvgIcon rubro={key} className="h-5 w-5" />
                  </div>
                  <span
                    className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-[12px] px-2.5 py-1 text-[12px] font-bold shadow-xs backdrop-blur-xs"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.94)',
                      color: item.colores.primario,
                    }}
                  >
                    <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
                    App en vivo
                  </span>
                  <span
                    className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-[10px] px-2.5 py-1 text-[11px] font-bold shadow-xs backdrop-blur-xs"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.94)',
                      color: '#0F172A',
                    }}
                  >
                    <Clock
                      className="h-3 w-3"
                      style={{ color: item.colores.primario }}
                      aria-hidden="true"
                    />
                    {item.servicios.length} servicios · Desde S/ {minPrice}
                  </span>
                </div>

                {/* Cuerpo comercial vivo */}
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="inline-flex items-center rounded-lg px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: item.colores.superficieDestacada,
                        color: item.colores.primario,
                      }}
                    >
                      {item.rubroLabel}
                    </span>
                    <span
                      className="text-[11px] font-semibold"
                      style={{ color: 'var(--sub)' }}
                    >
                      {item.ciudad}
                    </span>
                  </div>

                  <h2
                    className={`mt-2 text-[22px] leading-tight font-bold ${
                      item.tipografia.esEditorialSerif
                        ? 'font-display-serif text-[25px]'
                        : 'font-outfit'
                    }`}
                    style={{ color: 'var(--ink)' }}
                  >
                    {item.nombre}
                  </h2>

                  {/* Mini galería visual de servicios */}
                  <div className="mt-3 space-y-2">
                    {previewServices.map((svc) => (
                      <div
                        key={svc.id}
                        className="flex items-center justify-between gap-2.5 rounded-[12px] p-1.5 pr-3 text-[12px]"
                        style={{
                          backgroundColor: 'var(--bg)',
                          border: '1px solid var(--line)',
                        }}
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <img
                            src={svc.imagen || item.heroImage}
                            alt={svc.nombre}
                            referrerPolicy="no-referrer"
                            className="h-10 w-12 shrink-0 rounded-[8px] object-cover"
                          />
                          <span
                            className="truncate font-semibold"
                            style={{ color: 'var(--ink)' }}
                          >
                            {svc.nombre}
                          </span>
                        </div>
                        <span
                          className="shrink-0 font-extrabold tabular-nums"
                          style={{ color: item.colores.primario }}
                        >
                          S/ {svc.precio}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Botón principal vivo en el color del rubro */}
                  <div className="mt-auto pt-4">
                    <div
                      className="flex min-h-[46px] w-full items-center justify-between rounded-[12px] px-4 text-[14px] font-bold text-white shadow-xs transition-transform duration-200 group-hover:translate-y-[-1px]"
                      style={{
                        backgroundColor: item.colores.primario,
                      }}
                    >
                      <span>
                        {session.role === 'owner'
                          ? 'Abrir Panel Dueño'
                          : 'Probar y sacar cita'}
                      </span>
                      <ArrowRight
                        className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </section>
      </main>

      <footer
        className="py-5 text-center text-[13px]"
        style={{
          backgroundColor: 'var(--card)',
          borderTop: '1px solid var(--line)',
          color: 'var(--sub)',
        }}
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <MariaLogoMark className="h-6 w-6 shrink-0" />
            <span>
              Impulsado por{' '}
              <strong style={{ color: 'var(--ink)' }}>MarIA Citas</strong>
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={handleDownloadLogo}
              className="font-medium underline underline-offset-4"
              style={{ color: 'var(--p)' }}
            >
              Descargar Logo PNG
            </button>
            <p>Desarrollado con pasión, Perú 🇵🇪.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
