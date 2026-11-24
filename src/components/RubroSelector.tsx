import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Bell,
  Briefcase,
  CalendarCheck2,
  Moon,
  Smartphone,
  Sparkles,
  Sun,
  Tag,
  User,
} from 'lucide-react';
import { RUBROS, type RubroConfig, type RubroKey } from '../config/rubros';
import type { UserSession } from '../types/app';
import { MariaLogoMark, RubroSvgIcon } from './RubroIcons';

interface RubroSelectorProps {
  session: UserSession;
  onSelectRubro: (rubro: RubroKey) => void;
  onOpenAuthSheet: (mode?: 'register' | 'login' | 'owner') => void;
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
  onOpenAuthSheet,
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
            <button
              type="button"
              onClick={() =>
                onOpenAuthSheet(session.role === 'owner' ? 'owner' : 'login')
              }
              className="tap-feedback inline-flex min-h-[40px] items-center gap-1.5 rounded-[12px] px-3 text-[13px] font-medium whitespace-nowrap"
              style={{
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--line)',
                color: 'var(--ink)',
              }}
            >
              {session.role === 'owner' ? (
                <>
                  <Briefcase
                    className="h-3.5 w-3.5"
                    style={{ color: 'var(--cyt)' }}
                  />
                  <span>Panel Dueño</span>
                </>
              ) : session.role === 'client' ? (
                <>
                  <User
                    className="h-3.5 w-3.5"
                    style={{ color: 'var(--p)' }}
                  />
                  <span>{session.nombre.split(' ')[0]}</span>
                </>
              ) : (
                <>
                  <User className="h-3.5 w-3.5" />
                  <span>Probar acceso</span>
                </>
              )}
            </button>

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
            className="mt-3 text-[16px] sm:text-[18px] leading-[1.55]"
            style={{ color: 'var(--sub)' }}
          >
            Tus clientes ven horarios reales, eligen servicio y reservan solos directo desde tu App, sin esperar que respondas mensajes.{' '}
            <strong style={{ color: 'var(--ink)' }}>
              Elige un rubro y pruébala en vivo:
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
            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelectRubro(key)}
                className="tap-feedback group flex flex-col overflow-hidden rounded-[16px] text-left transition-transform duration-200 hover:-translate-y-1"
                style={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--line)',
                }}
              >
                {/* Imagen superior limpia sin degradados ni texto encima ilegible */}
                <div className="relative h-44 w-full overflow-hidden">
                  <img
                    src={item.heroImage}
                    alt={item.heroAlt}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div
                    className="absolute top-3 left-3 flex h-10 w-10 items-center justify-center rounded-[12px]"
                    style={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--line)',
                      color: 'var(--p)',
                    }}
                  >
                    <RubroSvgIcon rubro={key} className="h-5 w-5" />
                  </div>
                  <span
                    className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-[10px] px-2.5 py-1 text-[12px] font-medium"
                    style={{
                      backgroundColor: 'var(--cys)',
                      color: 'var(--cyt)',
                      border: '1px solid var(--line)',
                    }}
                  >
                    <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
                    App en vivo
                  </span>
                </div>

                {/* Cuerpo comercial claro */}
                <div className="flex flex-1 flex-col p-5">
                  <span
                    className="text-[12px] font-medium uppercase tracking-wider"
                    style={{ color: 'var(--cyt)' }}
                  >
                    {item.rubroLabel}
                  </span>
                  <h2
                    className="font-outfit mt-1 text-[22px] leading-tight"
                    style={{ color: 'var(--ink)' }}
                  >
                    {item.nombre}
                  </h2>
                  <p
                    className="mt-1.5 mb-4 text-[14px] leading-[1.5]"
                    style={{ color: 'var(--sub)' }}
                  >
                    {RUBRO_SOLUTIONS[key]}
                  </p>

                  <div
                    className="mt-auto flex items-center justify-between pt-4"
                    style={{ borderTop: '1px solid var(--line)' }}
                  >
                    <span
                      className="text-[14px] font-semibold"
                      style={{ color: 'var(--p)' }}
                    >
                      {session.role === 'owner'
                        ? 'Abrir Panel Dueño'
                        : 'Abrir App de Citas'}
                    </span>
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-[10px] transition-transform duration-200 group-hover:translate-x-0.5"
                      style={{
                        backgroundColor: 'var(--p)',
                        color: 'var(--onp)',
                      }}
                    >
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </span>
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
