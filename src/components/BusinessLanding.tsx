import React, { useState } from 'react';
import { CalendarPlus, Check, Clock, MapPin, ShieldCheck } from 'lucide-react';
import type { RubroConfig, ServicioItem } from '../config/rubros';
import { RubroSvgIcon } from './RubroIcons';

interface BusinessLandingProps {
  rubro: RubroConfig;
  userRole: 'guest' | 'client' | 'owner';
  userName?: string;
  onStartBooking: (preselectedService?: ServicioItem) => void;
  onOpenInstallModal: () => void;
  onOpenAuthSheet: (mode?: 'register' | 'login' | 'owner') => void;
}

export const BusinessLanding: React.FC<BusinessLandingProps> = ({
  rubro,
  userRole,
  userName,
  onStartBooking,
  onOpenInstallModal,
  onOpenAuthSheet,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="space-y-6">
      {/* Hero Landing del negocio */}
      <section
        aria-label={`Presentación de ${rubro.nombre}`}
        className="overflow-hidden rounded-3xl border bg-white shadow-xs"
        style={{ borderColor: rubro.colores.bordeSuave }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 lg:items-stretch">
          {/* Imagen principal 16:9 con fallback resistente */}
          <div className="relative aspect-video w-full overflow-hidden bg-slate-100 lg:col-span-6 lg:aspect-auto lg:min-h-[320px]">
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

          {/* Propuesta de valor + Botón Sacar Cita + Descargar App */}
          <div className="flex flex-col justify-between p-5 sm:p-7 lg:col-span-6">
            <div>
              <p
                className="text-xs font-bold tracking-wide"
                style={{ color: rubro.colores.primario }}
              >
                {rubro.rubroLabel} · {rubro.ciudad}
                {userRole === 'client' && userName ? ` · Hola, ${userName}` : ''}
              </p>

              <h1
                className={`mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl [text-wrap:balance] ${
                  rubro.tipografia.esEditorialSerif
                    ? 'font-display-serif text-3xl sm:text-4xl'
                    : ''
                }`}
              >
                {rubro.landing.titularHero}
              </h1>

              <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
                {rubro.landing.subtituloHero}
              </p>

              <div className="mt-4 flex flex-col gap-1.5 border-t border-slate-100 pt-3.5 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin
                    className="h-3.5 w-3.5 shrink-0"
                    style={{ color: rubro.colores.primario }}
                    aria-hidden="true"
                  />
                  {rubro.direccion}
                </span>
                <span className="inline-flex items-center gap-1.5">
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
                style={{ backgroundColor: rubro.colores.primario }}
                className="tap-feedback flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl px-5 text-base font-bold text-white shadow-sm"
              >
                <CalendarPlus className="h-5 w-5" aria-hidden="true" />
                {rubro.landing.ctaPrincipal}
              </button>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={onOpenInstallModal}
                  className="tap-feedback flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 hover:bg-slate-100 whitespace-nowrap"
                >
                  Descargar App al móvil
                </button>
                {userRole === 'guest' ? (
                  <button
                    type="button"
                    onClick={() => onOpenAuthSheet('register')}
                    className="tap-feedback flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 hover:bg-slate-50 whitespace-nowrap"
                  >
                    Registrarme con teléfono
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onOpenAuthSheet('login')}
                    className="tap-feedback flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 hover:bg-slate-50 whitespace-nowrap"
                  >
                    Cambiar cuenta / rol
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Beneficios de atención */}
      <section
        aria-label="Por qué atendernos"
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        {rubro.landing.beneficios.map((item) => (
          <div
            key={item.titulo}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck
                className="h-4 w-4 shrink-0"
                style={{ color: rubro.colores.primario }}
                aria-hidden="true"
              />
              <h2 className="text-sm font-bold text-slate-900">
                {item.titulo}
              </h2>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
              {item.detalle}
            </p>
          </div>
        ))}
      </section>

      {/* Información detallada de todos los servicios antes de generar la agenda */}
      <section aria-labelledby="landing-services-heading" className="space-y-3.5">
        <div className="px-1">
          <h2
            id="landing-services-heading"
            className={`text-xl font-bold text-slate-900 sm:text-2xl ${
              rubro.tipografia.esEditorialSerif
                ? 'font-display-serif text-2xl sm:text-3xl'
                : ''
            }`}
          >
            Nuestros servicios y tarifas
          </h2>
          <p className="mt-0.5 text-xs text-slate-600 sm:text-sm">
            Conoce qué incluye cada atención antes de generar tu reserva.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          {rubro.servicios.map((svc, index) => (
            <article
              key={svc.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p
                      className="text-xs font-bold tabular-nums"
                      style={{ color: rubro.colores.primario }}
                    >
                      0{index + 1}. Servicio · {svc.duracion}
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-slate-900">
                      {svc.nombre}
                    </h3>
                  </div>

                  <span
                    className="shrink-0 text-lg font-bold tabular-nums"
                    style={{ color: rubro.colores.primario }}
                  >
                    S/ {svc.precio}
                  </span>
                </div>

                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {svc.descripcion}
                </p>

                <div className="mt-3.5 border-t border-slate-100 pt-3">
                  <p className="text-xs font-semibold text-slate-800">
                    ¿Qué incluye?
                  </p>
                  <ul className="mt-1.5 space-y-1.5">
                    {svc.incluye.map((punto) => (
                      <li
                        key={punto}
                        className="flex items-start gap-2 text-xs text-slate-600"
                      >
                        <Check
                          className="mt-0.5 h-3.5 w-3.5 shrink-0"
                          style={{ color: rubro.colores.primario }}
                          aria-hidden="true"
                        />
                        <span>{punto}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="mt-3 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">Nota:</span>{' '}
                  {svc.recomendacion}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onStartBooking(svc)}
                style={{
                  backgroundColor: rubro.colores.superficieDestacada,
                  color: rubro.colores.primario,
                  borderColor: rubro.colores.bordeSuave,
                }}
                className="tap-feedback mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold"
              >
                <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                Reservar este servicio
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* Cierre de conversión de la Landing */}
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
          ¿Ya sabes qué servicio necesitas?
        </h2>
        <p className="mt-1 text-xs text-slate-700 sm:text-sm">
          Consulta los horarios disponibles en tiempo real y asegura tu cita con
          recordatorio por WhatsApp.
        </p>
        <button
          type="button"
          onClick={() => onStartBooking()}
          style={{ backgroundColor: rubro.colores.primario }}
          className="tap-feedback mx-auto mt-4 flex min-h-[50px] w-full max-w-sm items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-white shadow-sm"
        >
          <CalendarPlus className="h-4 w-4" aria-hidden="true" />
          Ver horarios y reservar cita
        </button>
      </section>
    </div>
  );
};
