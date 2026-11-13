import React, { useEffect, useState } from 'react';
import { ArrowRight, Calendar, CheckCircle2, MessageSquare, Moon, ShieldCheck, Sparkles, Sun, TrendingUp } from 'lucide-react';
import { RUBROS, type RubroConfig, type RubroKey } from '../config/rubros';
import { PWAInstallBanner } from './PWABanners';
import { MariaLogoMark, RubroSvgIcon } from './RubroIcons';

interface RubroSelectorProps {
  onSelectRubro: (rubro: RubroKey) => void;
}

const RUBRO_ORDER: RubroKey[] = ['consultorio', 'salon', 'veterinaria'];

export const RubroSelector: React.FC<RubroSelectorProps> = ({
  onSelectRubro,
}) => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('maria_theme');
      if (saved) return saved === 'dark';
    } catch {
      // Ignorar
    }
    return true; // Por defecto oscuro para MarIA
  });

  useEffect(() => {
    try {
      localStorage.setItem('maria_theme', isDark ? 'dark' : 'light');
    } catch {
      // Ignorar
    }
  }, [isDark]);

  return (
    <div
      className={`min-h-[100dvh] flex flex-col relative overflow-hidden transition-colors duration-300 ${
        isDark
          ? 'bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 text-white'
          : 'bg-gradient-to-b from-slate-50 via-indigo-50/40 to-slate-100 text-slate-900'
      }`}
    >
      {/* Círculos de luz decorativos de fondo */}
      <div
        aria-hidden="true"
        className={`absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none transition-colors duration-500 ${
          isDark ? 'bg-indigo-600/25' : 'bg-indigo-300/40'
        }`}
      />
      <div
        aria-hidden="true"
        className={`absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none transition-colors duration-500 ${
          isDark ? 'bg-emerald-600/20' : 'bg-emerald-300/40'
        }`}
      />

      {/* Cabecera de marca */}
      <header
        className={`relative z-10 w-full border-b backdrop-blur-md transition-colors duration-300 ${
          isDark
            ? 'border-white/10 bg-slate-950/60 text-white'
            : 'border-slate-200 bg-white/80 text-slate-900'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <MariaLogoMark className="h-9 w-9 shrink-0 shadow-lg shadow-indigo-500/30" />
            <div className="flex flex-col">
              <span
                className={`text-lg font-extrabold tracking-tight ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                MarIA
              </span>
              <span
                className={`text-[10px] font-medium uppercase tracking-wider ${
                  isDark ? 'text-indigo-300' : 'text-indigo-600'
                }`}
              >
                Reservas & WhatsApp
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`hidden sm:flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-medium backdrop-blur-sm ${
                isDark
                  ? 'bg-white/10 text-indigo-200'
                  : 'bg-slate-200/70 text-indigo-900'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sistema activo 24/7</span>
            </div>

            {/* Botón Modo Oscuro / Claro */}
            <button
              type="button"
              onClick={() => setIsDark((prev) => !prev)}
              aria-label="Cambiar modo oscuro o claro"
              className={`tap-feedback flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
                isDark
                  ? 'border-white/15 bg-white/10 text-amber-300 hover:bg-white/20'
                  : 'border-slate-300 bg-white text-indigo-600 shadow-2xs hover:bg-slate-100'
              }`}
            >
              {isDark ? (
                <Sun className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Moon className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Contenido principal con enfoque de ventas B2B */}
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-8 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <div
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold mb-4 shadow-sm ${
              isDark
                ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-200'
                : 'bg-indigo-100/80 border-indigo-200 text-indigo-800'
            }`}
          >
            <Sparkles
              className={`h-4 w-4 ${
                isDark ? 'text-amber-300' : 'text-amber-500'
              } animate-pulse`}
            />
            <span>Solución definitiva anti-inasistencias para negocios</span>
          </div>

          <h1
            className={`text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl [text-wrap:balance] ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            ¡Llena tu agenda y dile adiós a los clientes que{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400">
              no se presentan!
            </span>
          </h1>

          <p
            className={`mt-5 text-base leading-relaxed sm:text-lg ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            Tus clientes reservan solos las 24 horas, reciben recordatorios
            automáticos en su WhatsApp y tú recuperas hasta <strong>S/ 3,500 al mes</strong> en citas que antes se perdían.
          </p>

          {/* Barra de beneficios rápidos estilo vendedor */}
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div
              className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-xs font-semibold ${
                isDark
                  ? 'border-white/10 bg-white/5 text-slate-200'
                  : 'border-slate-200 bg-white/80 text-slate-800 shadow-2xs'
              }`}
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Reservas 24/7 sin llamadas</span>
            </div>
            <div
              className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-xs font-semibold ${
                isDark
                  ? 'border-white/10 bg-white/5 text-slate-200'
                  : 'border-slate-200 bg-white/80 text-slate-800 shadow-2xs'
              }`}
            >
              <TrendingUp className="h-4 w-4 text-indigo-400 shrink-0" />
              <span>Reduce inasistencias un 50%</span>
            </div>
            <div
              className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-xs font-semibold ${
                isDark
                  ? 'border-white/10 bg-white/5 text-slate-200'
                  : 'border-slate-200 bg-white/80 text-slate-800 shadow-2xs'
              }`}
            >
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Recordatorios WhatsApp</span>
            </div>
          </div>
        </div>

        {/* Sección de llamadas a la acción / Elección de rubro con fotos */}
        <div className="mt-12 text-center">
          <p className="text-sm font-bold uppercase tracking-wider text-indigo-400">
            👇 Selecciona tu rubro y prueba la demo en vivo ahora mismo:
          </p>
        </div>

        <section
          aria-label="Seleccionar rubro de negocio"
          className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8"
        >
          {RUBRO_ORDER.map((key) => {
            const item: RubroConfig = RUBROS[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelectRubro(key)}
                className="tap-feedback group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/20 bg-slate-950 p-6 text-left shadow-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 min-h-[380px]"
              >
                {/* Imagen de fondo con zoom suave en hover */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 z-0 overflow-hidden"
                >
                  <img
                    src={item.heroImage}
                    alt={item.heroAlt}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 filter brightness-90 group-hover:brightness-100"
                  />
                  {/* Gradiente multicapa profesional */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-950/30" />
                  <div
                    className="absolute inset-0 opacity-30 mix-blend-overlay"
                    style={{ backgroundColor: item.colores.primario }}
                  />
                </div>

                {/* Contenido superior de la tarjeta */}
                <div className="relative z-10 flex items-start justify-between">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg backdrop-blur-md"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.18)',
                      color: '#FFFFFF',
                    }}
                  >
                    <RubroSvgIcon rubro={key} className="h-7 w-7" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/90 px-3.5 py-1 text-xs font-bold text-white shadow-md backdrop-blur-md border border-emerald-400/30">
                    <MessageSquare className="h-3.5 w-3.5" /> WhatsApp Pro
                  </span>
                </div>

                {/* Contenido inferior de la tarjeta */}
                <div className="relative z-10 mt-auto pt-10">
                  <span
                    className="inline-block text-xs font-bold tracking-wider uppercase mb-1 text-amber-300"
                  >
                    {item.rubroLabel}
                  </span>
                  <h2
                    className={`text-2xl font-extrabold text-white sm:text-3xl ${
                      item.tipografia.esEditorialSerif
                        ? 'font-display-serif text-3xl'
                        : ''
                    }`}
                  >
                    {item.nombre}
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-slate-200">
                    {item.resumenSelector} · {item.servicios.length} servicios listos
                  </p>

                  <div className="mt-5 flex items-center justify-between border-t border-white/20 pt-4">
                    <span className="text-xs font-bold text-white underline underline-offset-4">
                      Ver demo interactiva
                    </span>
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-lg transition-transform duration-300 group-hover:translate-x-1"
                      style={{ backgroundColor: item.colores.primario }}
                    >
                      <ArrowRight className="h-5 w-5" />
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </section>

        {/* Banner de instalación PWA */}
        <div className="mx-auto mt-12 w-full max-w-xl">
          <PWAInstallBanner accentColor="#4F46E5" isDark={isDark} />
        </div>
      </main>

      {/* Pie animado inspirador */}
      <footer
        className={`relative z-10 border-t py-6 text-center text-xs backdrop-blur-md transition-colors duration-300 ${
          isDark
            ? 'border-white/10 bg-slate-950/80 text-slate-400'
            : 'border-slate-200 bg-white/80 text-slate-600'
        }`}
      >
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-indigo-500" />
            <span>
              Sistema de reservas inteligente impulsado por{' '}
              <strong className={isDark ? 'text-white' : 'text-slate-900'}>
                MarIA
              </strong>
            </span>
          </p>
          <p className={isDark ? 'text-slate-500' : 'text-slate-500'}>
            Desarrollado con pasión en Huancayo, Perú 🇵🇪
          </p>
        </div>
      </footer>
    </div>
  );
};
