import React, { useEffect, useState } from 'react';
import { CheckCheck, RotateCcw, SlidersHorizontal } from 'lucide-react';
import type { RubroConfig } from '../config/rubros';
import type { BookedSummary } from './BookingTab';

interface ReminderTabProps {
  rubro: RubroConfig;
  lastBooking: BookedSummary | null;
}

type SimChoice = null | '1' | '2';

export const ReminderTab: React.FC<ReminderTabProps> = ({
  rubro,
  lastBooking,
}) => {
  const [nombreDemo, setNombreDemo] = useState<string>(
    lastBooking?.cliente || rubro.recordatorio.ejemploCliente
  );
  const [servicioDemo, setServicioDemo] = useState<string>(
    lastBooking?.servicio || rubro.recordatorio.ejemploServicio
  );
  const [fechaHoraDemo, setFechaHoraDemo] = useState<string>(
    lastBooking
      ? `${lastBooking.fecha} a las ${lastBooking.hora}`
      : rubro.recordatorio.ejemploFechaHora
  );
  const [mascotaDemo, setMascotaDemo] = useState<string>(
    lastBooking?.nombreMascota || rubro.recordatorio.ejemploMascota || 'Toby'
  );

  const [choice, setChoice] = useState<SimChoice>(null);
  const [typing, setTyping] = useState<boolean>(false);
  const [showBotReply, setShowBotReply] = useState<boolean>(false);
  const [showEditor, setShowEditor] = useState<boolean>(false);

  // Sincronizar si cambia de rubro o llega una nueva reserva
  useEffect(() => {
    setNombreDemo(lastBooking?.cliente || rubro.recordatorio.ejemploCliente);
    setServicioDemo(
      lastBooking?.servicio || rubro.recordatorio.ejemploServicio
    );
    setFechaHoraDemo(
      lastBooking
        ? `${lastBooking.fecha} a las ${lastBooking.hora}`
        : rubro.recordatorio.ejemploFechaHora
    );
    setMascotaDemo(
      lastBooking?.nombreMascota || rubro.recordatorio.ejemploMascota || 'Toby'
    );
    setChoice(null);
    setTyping(false);
    setShowBotReply(false);
  }, [rubro, lastBooking]);

  const reminderMessage =
    rubro.id === 'veterinaria'
      ? `Hola ${nombreDemo} 👋 Te recordamos la cita de ${mascotaDemo} para ${servicioDemo} el ${fechaHoraDemo}. Responde 1 para confirmar o 2 para reprogramar.`
      : `Hola ${nombreDemo} 👋 Te recordamos tu cita de ${servicioDemo} el ${fechaHoraDemo}. Responde 1 para confirmar o 2 para reprogramar.`;

  const botReplyText =
    choice === '1'
      ? rubro.id === 'veterinaria'
        ? `¡Listo! La cita de ${mascotaDemo} quedó confirmada ✅ ¡Aquí lo esperamos con mucho cariño!`
        : rubro.recordatorio.tonoConfirmacion
      : rubro.id === 'veterinaria'
        ? `Sin problema 😊 ¿Qué día y hora te vendría mejor para traer a ${mascotaDemo}?`
        : rubro.recordatorio.tonoReprogramar;

  const handleSelectChoice = (val: '1' | '2') => {
    setChoice(val);
    setShowBotReply(false);
    setTyping(true);
  };

  useEffect(() => {
    if (!typing) return;
    const timer = setTimeout(() => {
      setTyping(false);
      setShowBotReply(true);
    }, 320);
    return () => clearTimeout(timer);
  }, [typing]);

  const handleReset = () => {
    setChoice(null);
    setTyping(false);
    setShowBotReply(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 px-1">
        <div>
          <h2
            className={`text-xl font-bold text-slate-900 ${
              rubro.tipografia.esEditorialSerif
                ? 'font-display-serif text-2xl'
                : ''
            }`}
          >
            Recordatorio automático por WhatsApp
          </h2>
          <p className="mt-0.5 text-xs text-slate-600">
            Simulación visual de lo que recibe tu cliente 24 h antes de su cita.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowEditor((v) => !v)}
          className="tap-feedback inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
          Personalizar
        </button>
      </div>

      {/* Personalizador rápido opcional para presentaciones en vivo */}
      {showEditor && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
          <p className="text-xs font-bold text-slate-700">
            Personaliza el mensaje con los datos de tu cliente:
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="sim-nombre"
                className="block text-xs font-medium text-slate-600"
              >
                Nombre del cliente
              </label>
              <input
                id="sim-nombre"
                type="text"
                value={nombreDemo}
                onChange={(e) => setNombreDemo(e.target.value)}
                className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 px-3 text-base text-slate-900"
              />
            </div>
            {rubro.id === 'veterinaria' && (
              <div>
                <label
                  htmlFor="sim-mascota"
                  className="block text-xs font-medium text-slate-600"
                >
                  Nombre de la mascota
                </label>
                <input
                  id="sim-mascota"
                  type="text"
                  value={mascotaDemo}
                  onChange={(e) => setMascotaDemo(e.target.value)}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 px-3 text-base text-slate-900"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Marco simulado de WhatsApp */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-[#EFEAE2] shadow-sm">
        {/* Cabecera estilo WhatsApp Business */}
        <div className="flex items-center justify-between bg-[#075E54] px-4 py-3 text-white">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-lg">
              {rubro.logoEmoji}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{rubro.nombre}</p>
              <p className="text-[11px] text-emerald-100">
                Cuenta de empresa · en línea
              </p>
            </div>
          </div>

          {choice && (
            <button
              type="button"
              onClick={handleReset}
              aria-label="Reiniciar simulación"
              className="tap-feedback inline-flex min-h-[40px] items-center gap-1 rounded-xl bg-white/15 px-2.5 text-xs font-semibold text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Reiniciar
            </button>
          )}
        </div>

        {/* Conversación */}
        <div className="space-y-3 p-4 min-h-[280px]">
          <div className="mx-auto w-fit rounded-lg bg-white/80 px-3 py-1 text-[11px] font-medium text-slate-600 shadow-2xs">
            Hoy · Recordatorio automático
          </div>

          {/* Mensaje enviado por el sistema */}
          <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-white p-3.5 text-sm leading-relaxed text-slate-900 shadow-2xs">
            <p>{reminderMessage}</p>
            <p className="mt-1.5 text-right text-[10px] text-slate-400 tabular-nums">
              09:00 a. m.
            </p>
          </div>

          {/* Respuesta del cliente al tocar 1 o 2 */}
          {choice && (
            <div className="ml-auto max-w-[75%] rounded-2xl rounded-tr-sm bg-[#D9FDD3] px-3.5 py-2.5 text-sm text-slate-900 shadow-2xs">
              <p className="font-semibold">{choice}</p>
              <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-slate-500 tabular-nums">
                <span>09:02 a. m.</span>
                <CheckCheck
                  className="h-3.5 w-3.5 text-[#53BDEB]"
                  aria-hidden="true"
                />
              </div>
            </div>
          )}

          {/* Indicador escribiendo */}
          {typing && (
            <div className="w-fit rounded-2xl rounded-tl-sm bg-white px-4 py-2.5 text-xs font-medium text-slate-500 shadow-2xs">
              Escribiendo respuesta automática...
            </div>
          )}

          {/* Respuesta automática del bot */}
          {showBotReply && (
            <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-white p-3.5 text-sm leading-relaxed text-slate-900 shadow-2xs">
              <p>{botReplyText}</p>
              <p className="mt-1.5 text-right text-[10px] text-slate-400 tabular-nums">
                09:02 a. m.
              </p>
            </div>
          )}
        </div>

        {/* Barra de acción interactiva para probar respuesta 1 o 2 */}
        <div className="border-t border-black/10 bg-[#F0F2F5] p-3.5">
          <p className="mb-2 text-center text-xs font-semibold text-slate-600">
            Toca una opción para simular la respuesta del cliente:
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleSelectChoice('1')}
              className={`tap-feedback flex min-h-[48px] items-center justify-center rounded-xl border px-3 text-sm font-bold ${
                choice === '1'
                  ? 'border-emerald-700 bg-emerald-700 text-white'
                  : 'border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              1 · Confirmar
            </button>
            <button
              type="button"
              onClick={() => handleSelectChoice('2')}
              className={`tap-feedback flex min-h-[48px] items-center justify-center rounded-xl border px-3 text-sm font-bold ${
                choice === '2'
                  ? 'border-amber-600 bg-amber-600 text-white'
                  : 'border-amber-200 bg-white text-amber-900 hover:bg-amber-50'
              }`}
            >
              2 · Reprogramar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
