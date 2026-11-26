import React, { useState } from 'react';
import { ArrowRight, Bell, Check, Copy, Flame, Gift, MessageSquare, Sliders, Sparkles, Tag, Zap } from 'lucide-react';
import type { RubroConfig, ServicioItem, PromocionItem } from '../config/rubros';

interface PromosTabProps {
  rubro: RubroConfig;
  isOwner?: boolean;
  onSelectServiceAndBook: (service: ServicioItem) => void;
}

export const PromosTab: React.FC<PromosTabProps> = ({
  rubro,
  isOwner = false,
  onSelectServiceAndBook,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Estados para Ofertas Flash del Dueño
  const [flashActive, setFlashActive] = useState<boolean>(true);
  const [flashDiscount, setFlashDiscount] = useState<string>('20%');
  const [flashSlot, setFlashSlot] = useState<string>('3:00 p.m. a 5:00 p.m.');
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [notified, setNotified] = useState<boolean>(false);

  const handleCopyCode = (promoCode: string, id: string) => {
    navigator.clipboard.writeText(promoCode);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleApplyPromo = (promo: PromocionItem) => {
    const matchingService = rubro.servicios.find((s) => s.id === promo.servicioId) || rubro.servicios[0];
    if (matchingService) {
      onSelectServiceAndBook(matchingService);
    }
  };

  const handleToggleFlash = () => {
    setFlashActive((prev) => !prev);
    setNotified(true);
    setTimeout(() => setNotified(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Panel de Control Ofertas Flash (Solo visible para el Dueño) */}
      {isOwner && (
        <div className="rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                  <Flame className="h-3.5 w-3.5 text-rose-600" /> Panel del Dueño · Horarios Valle
                </span>
                <h3 className="text-base font-bold text-slate-900">Generador de Ofertas Flash</h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowConfig((v) => !v)}
                className="tap-feedback inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>Configurar</span>
              </button>
              <button
                type="button"
                onClick={handleToggleFlash}
                className={`tap-feedback inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-4 text-xs font-bold text-white shadow-md transition-all ${
                  flashActive ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                <Bell className="h-3.5 w-3.5" />
                <span>{flashActive ? 'Desactivar Flash' : 'Activar Flash'}</span>
              </button>
            </div>
          </div>

          {/* Configurador colapsable */}
          {showConfig && (
            <div className="mt-4 border-t border-amber-200/60 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Porcentaje de Descuento</label>
                <select
                  value={flashDiscount}
                  onChange={(e) => setFlashDiscount(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900"
                >
                  <option value="15%">15% OFF extra</option>
                  <option value="20%">20% OFF en horarios valle</option>
                  <option value="30%">30% OFF última hora</option>
                  <option value="50%">50% OFF súper flash</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Horario o Franja Objetivo</label>
                <select
                  value={flashSlot}
                  onChange={(e) => setFlashSlot(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900"
                >
                  <option value="3:00 p.m. a 5:00 p.m.">Hoy de 3:00 p.m. a 5:00 p.m.</option>
                  <option value="10:00 a.m. a 12:00 p.m.">Mañana por la mañana</option>
                  <option value="Próximas 2 horas">Próximas 2 horas (Urgente)</option>
                </select>
              </div>
            </div>
          )}

          {/* Notificación visual de éxito al activar */}
          {notified && (
            <div className="mt-3 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0" />
              <span>
                {flashActive
                  ? `Oferta Flash de ${flashDiscount} activada y visible para clientes.`
                  : 'Oferta Flash desactivada correctamente.'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Banner de Oferta Flash Activa (Visible para Clientes) */}
      {flashActive && (
        <div className="rounded-3xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 p-5 text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-[-20px] bottom-[-20px] opacity-20 pointer-events-none">
            <Zap className="w-40 h-40" />
          </div>
          <div className="relative z-10 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/25 px-3 py-1 text-xs font-extrabold text-white backdrop-blur-md">
                <Zap className="h-3.5 w-3.5 text-amber-200" /> OFERTA FLASH · {flashDiscount}
              </span>
              <h2 className="mt-2 text-xl font-black tracking-tight sm:text-2xl">
                Cupos hoy ({flashSlot})
              </h2>
            </div>
            <span className="text-xs font-bold text-white/90 sm:text-right">
              Descuento aplicado al elegir horario
            </span>
          </div>
        </div>
      )}

      {/* Lista de Promociones Visuales */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {(rubro.promos || []).map((promo) => {
          const promoCode = `MARIA-${promo.id.toUpperCase()}`;
          const isCopied = copiedId === promo.id;
          const matchingService =
            rubro.servicios.find((s) => s.id === promo.servicioId) ||
            rubro.servicios[0];

          const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(
            `¡Hola! Te comparto esta promo en ${rubro.nombre}: *${promo.titulo}* (${promo.descuentoBadge}). Precio especial S/ ${promo.precioPromo}.`
          )}`;

          return (
            <div
              key={promo.id}
              className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md relative"
            >
              {/* Imagen visual de la promo */}
              <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                <img
                  src={matchingService?.imagen || rubro.heroImage}
                  alt={promo.titulo}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-0 right-0 bg-rose-600 text-white font-black text-xs px-3.5 py-1.5 rounded-bl-2xl shadow-sm tracking-wider">
                  {flashActive ? `${flashDiscount} Flash` : promo.descuentoBadge}
                </div>
                <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-xl bg-white/95 px-2.5 py-1 text-[11px] font-bold text-slate-800 shadow-xs backdrop-blur-xs">
                  <Tag
                    className="h-3 w-3"
                    style={{ color: rubro.colores.primario }}
                  />
                  {promo.vigencia}
                </span>
              </div>

              <div className="flex flex-1 flex-col justify-between p-5">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">
                    {promo.titulo}
                  </h3>

                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900 tabular-nums">
                      S/ {flashActive ? Math.round(promo.precioPromo * 0.85) : promo.precioPromo}
                    </span>
                    <span className="text-sm font-medium text-slate-400 line-through tabular-nums">
                      S/ {promo.precioRegular}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg ml-auto">
                      Ahorras S/ {promo.precioRegular - (flashActive ? Math.round(promo.precioPromo * 0.85) : promo.precioPromo)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-3.5 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 px-3 py-2 rounded-xl">
                    <span className="text-xs font-mono font-bold text-slate-700">{promoCode}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(promoCode, promo.id)}
                      className="tap-feedback inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />{' '}
                          <span className="text-emerald-600">¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" /> Copiar
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleApplyPromo(promo)}
                      className="tap-feedback inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-bold text-white shadow-sm transition-transform hover:scale-[1.02]"
                      style={{ backgroundColor: rubro.colores.primario }}
                    >
                      <span>Elegir horario</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>

                    <a
                      href={whatsappShareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tap-feedback inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-[#25D366]" /> Compartir
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
