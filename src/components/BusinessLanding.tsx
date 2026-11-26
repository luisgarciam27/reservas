import React, { useState } from 'react';
import {
  ArrowRight,
  CalendarPlus,
  Clock,
  Download,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import type { RubroConfig, ServicioItem } from '../config/rubros';
import { RubroSvgIcon } from './RubroIcons';

interface BusinessLandingProps {
  rubro: RubroConfig;
  userRole: 'guest' | 'client' | 'owner';
  userName?: string;
  isDemoMode?: boolean;
  onStartBooking: (preselectedService?: ServicioItem) => void;
  onOpenInstallModal: () => void;
  onOpenAuthSheet?: (mode?: 'register' | 'login' | 'owner') => void;
}

export const BusinessLanding: React.FC<BusinessLandingProps> = ({
  rubro,
  userRole,
  userName,
  isDemoMode = false,
  onStartBooking,
  onOpenInstallModal,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="space-y-5">
      {/* Hero Visual del negocio */}
      <section
        aria-label={`Presentación de ${rubro.nombre}`}
        className="overflow-hidden rounded-3xl border bg-white shadow-xs"
        style={{ borderColor: rubro.colores.bordeSuave }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 lg:items-stretch">
          {/* Imagen principal 16:9 */}
          <div className="relative aspect-video w-full overflow-hidden bg-slate-100 lg:col-span-6 lg:aspect-auto lg:min-h-[300px]">
            {!imgFailed ? (
              <img
                src={rubro.heroImage}
                alt={rubro.heroAlt}
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center"
                style={{
                  backgroundColor: rubro.colores.superficieDestacada,
                  color: rubro.colores.primario,
                }}
              >
                <RubroSvgIcon rubro={rubro.id} className="h-12 w-12" />
                <p className="text-sm font-bold">{rubro.nombre}</p>
              </div>
            )}
          </div>

          {/* Propuesta visual concisa + CTA principal */}
          <div className="flex flex-col justify-between p-5 sm:p-6 lg:col-span-6">
            <div>
              <span
                className="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold tracking-wide"
                style={{
                  backgroundColor: rubro.colores.superficieDestacada,
                  color: rubro.colores.primario,
                }}
              >
                {rubro.rubroLabel} · {rubro.ciudad}
                {!isDemoMode && userRole === 'client' && userName
                  ? ` · Hola, ${userName}`
                  : ''}
              </span>

              <h1
                className={`mt-2.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl [text-wrap:balance] ${
                  rubro.tipografia.esEditorialSerif
                    ? 'font-display-serif text-3xl sm:text-4xl'
                    : ''
                }`}
              >
                {rubro.landing.titularHero}
              </h1>

              <p className="mt-2 text-sm text-slate-600">
                {rubro.landing.subtituloHero}
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-700">
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 font-medium">
                  <MapPin
                    className="h-3.5 w-3.5 shrink-0"
                    style={{ color: rubro.colores.primario }}
                    aria-hidden="true"
                  />
                  {rubro.direccion}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 font-medium">
                  <Clock
                    className="h-3.5 w-3.5 shrink-0"
                    style={{ color: rubro.colores.primario }}
                    aria-hidden="true"
                  />
                  {rubro.horario.diasLabel}
                </span>
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
              <button
                type="button"
                onClick={() => onStartBooking()}
                style={{
                  backgroundColor: rubro.colores.primario,
                  boxShadow: `0 10px 24px -6px ${rubro.colores.primario}66`,
                }}
                className="tap-feedback group flex min-h-[54px] w-full items-center justify-between gap-3 rounded-2xl px-5 text-base font-bold text-white transition-transform duration-150 hover:-translate-y-0.5"
              >
                <span className="inline-flex items-center gap-2.5">
                  <Clock className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>Elegir horario y reservar cita</span>
                </span>
                <ArrowRight
                  className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </button>

              {!isDemoMode && (
                <button
                  type="button"
                  onClick={onOpenInstallModal}
                  className="tap-feedback flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 hover:bg-slate-100 whitespace-nowrap"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  Descargar App al móvil
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Sellos visuales rápidos */}
      <section
        aria-label="Beneficios"
        className="grid grid-cols-1 gap-2.5 sm:grid-cols-3"
      >
        {rubro.landing.beneficios.map((item) => (
          <div
            key={item.titulo}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-2xs"
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{
                backgroundColor: rubro.colores.superficieDestacada,
                color: rubro.colores.primario,
              }}
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 leading-tight">
                {item.titulo}
              </h2>
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {item.detalle}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* Servicios en tarjetas visuales con foto + precio + Elegir horario */}
      <section aria-labelledby="landing-services-heading" className="space-y-3.5">
        <div className="flex items-baseline justify-between gap-2 px-1">
          <h2
            id="landing-services-heading"
            className={`text-xl font-bold text-slate-900 sm:text-2xl ${
              rubro.tipografia.esEditorialSerif
                ? 'font-display-serif text-2xl sm:text-3xl'
                : ''
            }`}
          >
            Servicios y horarios
          </h2>
          <span className="text-xs font-medium text-slate-500">
            Toca uno para agendar
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {rubro.servicios.map((svc) => (
            <article
              key={svc.id}
              className="group flex flex-col overflow-hidden rounded-3xl border bg-white shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md"
              style={{ borderColor: rubro.colores.bordeSuave }}
            >
              {/* Foto del servicio */}
              <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                <img
                  src={svc.imagen || rubro.heroImage}
                  alt={svc.nombre}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span
                  className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-xl bg-white/95 px-2.5 py-1 text-xs font-bold text-slate-800 shadow-xs backdrop-blur-xs"
                >
                  <Clock
                    className="h-3.5 w-3.5"
                    style={{ color: rubro.colores.primario }}
                    aria-hidden="true"
                  />
                  {svc.duracion}
                </span>
                <span
                  className="absolute top-3 right-3 rounded-xl px-3 py-1 text-sm font-extrabold text-white shadow-sm tabular-nums"
                  style={{ backgroundColor: rubro.colores.primario }}
                >
                  S/ {svc.precio}
                </span>
              </div>

              <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">
                    {svc.nombre}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    {svc.descripcion}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onStartBooking(svc)}
                  style={{
                    backgroundColor: rubro.colores.primario,
                    color: '#FFFFFF',
                  }}
                  className="tap-feedback mt-4 flex min-h-[48px] w-full items-center justify-between gap-2 rounded-xl px-4 text-sm font-bold shadow-xs transition-opacity hover:opacity-95"
                >
                  <span className="inline-flex items-center gap-2">
                    <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Elegir horario</span>
                  </span>
                  <ArrowRight
                    className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Cierre rápido visual */}
      <section
        className="rounded-3xl border p-5 text-center sm:p-6"
        style={{
          backgroundColor: rubro.colores.superficieDestacada,
          borderColor: rubro.colores.bordeSuave,
        }}
      >
        <h2
          className={`text-lg font-bold text-slate-900 sm:text-xl ${
            rubro.tipografia.esEditorialSerif
              ? 'font-display-serif text-2xl'
              : ''
          }`}
        >
          ¿Listo para tu cita?
        </h2>
        <button
          type="button"
          onClick={() => onStartBooking()}
          style={{
            backgroundColor: rubro.colores.primario,
            boxShadow: `0 10px 24px -6px ${rubro.colores.primario}55`,
          }}
          className="tap-feedback group mx-auto mt-3.5 flex min-h-[52px] w-full max-w-sm items-center justify-between gap-2 rounded-2xl px-5 text-sm font-bold text-white"
        >
          <span className="inline-flex items-center gap-2">
            <CalendarPlus className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Ver horarios libres ahora</span>
          </span>
          <ArrowRight
            className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
            aria-hidden="true"
          />
        </button>
      </section>
    </div>
  );
};
