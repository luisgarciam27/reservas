import React, { useMemo, useState } from 'react';
import { Banknote, CheckCircle2, Clock } from 'lucide-react';
import type { RubroConfig } from '../../config/rubros';
import type {
  AppointmentRecord,
  MetodoPago,
  PagoEstado,
} from '../../types/app';
import { getLimaDateOffsetStr } from './ownerSeedData';

interface OwnerCobrosViewProps {
  rubro: RubroConfig;
  citas: AppointmentRecord[];
  onUpdatePago: (
    id: string,
    pagoEstado: PagoEstado,
    montoPagado: number,
    metodoPago?: MetodoPago
  ) => void;
}

const METODOS: MetodoPago[] = ['Yape', 'Plin', 'Efectivo', 'Tarjeta'];

export const OwnerCobrosView: React.FC<OwnerCobrosViewProps> = ({
  rubro,
  citas,
  onUpdatePago,
}) => {
  const todayYmd = useMemo(() => getLimaDateOffsetStr(0), []);
  const weekCutoffYmd = useMemo(() => getLimaDateOffsetStr(-7), []);
  const monthCutoffYmd = useMemo(() => getLimaDateOffsetStr(-30), []);
  const [selectedMethodById, setSelectedMethodById] = useState<
    Record<string, MetodoPago>
  >({});

  const activeCitas = useMemo(
    () => citas.filter((c) => c.estado !== 'cancelada'),
    [citas]
  );

  const totals = useMemo(() => {
    let hoy = 0;
    let semana = 0;
    let mes = 0;
    let porCobrar = 0;

    for (const c of activeCitas) {
      const paid =
        c.pagoEstado === 'pagado'
          ? c.precio
          : c.pagoEstado === 'adelanto'
            ? c.montoPagado
            : 0;
      const pending = Math.max(0, c.precio - paid);

      if (c.fecha === todayYmd) hoy += paid;
      if (c.fecha >= weekCutoffYmd) semana += paid;
      if (c.fecha >= monthCutoffYmd) mes += paid;
      if (c.estado !== 'no_asistio') porCobrar += pending;
    }

    return { hoy, semana, mes, porCobrar };
  }, [activeCitas, todayYmd, weekCutoffYmd, monthCutoffYmd]);

  const sortedForCobros = useMemo(() => {
    return [...activeCitas].sort((a, b) => {
      // Primero los pendientes de cobro
      const aPending = a.pagoEstado !== 'pagado' ? 0 : 1;
      const bPending = b.pagoEstado !== 'pagado' ? 0 : 1;
      if (aPending !== bPending) return aPending - bPending;
      return `${b.fecha} ${b.hora}`.localeCompare(`${a.fecha} ${a.hora}`);
    });
  }, [activeCitas]);

  return (
    <div className="space-y-4">
      <div className="px-1">
        <h2 className="text-xl font-bold text-slate-900">Cobros e Ingresos</h2>
        <p className="text-xs text-slate-500">
          Registra pagos por Yape, Plin, Efectivo o Tarjeta y controla saldos pendientes.
        </p>
      </div>

      {/* Resumen en Soles */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <p className="text-xs font-medium text-slate-500">Cobrado hoy</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
            S/ {totals.hoy}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <p className="text-xs font-medium text-slate-500">Últimos 7 días</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700 tabular-nums">
            S/ {totals.semana}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <p className="text-xs font-medium text-slate-500">Últimos 30 días</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
            S/ {totals.mes}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 shadow-2xs">
          <p className="text-xs font-bold text-amber-900">Por cobrar</p>
          <p className="mt-1 text-2xl font-bold text-amber-900 tabular-nums">
            S/ {totals.porCobrar}
          </p>
        </div>
      </div>

      {/* Lista de pagos por cita */}
      <div className="space-y-3">
        {sortedForCobros.map((c) => {
          const method = selectedMethodById[c.id] || c.metodoPago || 'Yape';
          const paid =
            c.pagoEstado === 'pagado'
              ? c.precio
              : c.pagoEstado === 'adelanto'
                ? c.montoPagado
                : 0;
          const pending = Math.max(0, c.precio - paid);

          const statusMeta =
            c.pagoEstado === 'pagado'
              ? {
                  label: `Pagado · ${c.metodoPago || method}`,
                  cls: 'border-emerald-200 bg-emerald-50 text-emerald-800',
                }
              : c.pagoEstado === 'adelanto'
                ? {
                    label: `Adelanto S/ ${paid} (Falta S/ ${pending})`,
                    cls: 'border-sky-200 bg-sky-50 text-sky-900',
                  }
                : {
                    label: 'Sin pago',
                    cls: 'border-amber-200 bg-amber-50 text-amber-900',
                  };

          return (
            <article
              key={c.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500 tabular-nums">
                    {c.fecha} · {c.hora}
                  </p>
                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    {c.cliente}
                  </h3>
                  <p className="text-xs text-slate-600">
                    {c.servicio} · Tarifa:{' '}
                    <strong className="tabular-nums">S/ {c.precio}</strong>
                  </p>
                </div>
                <span
                  className={`rounded-lg border px-2.5 py-1 text-xs font-bold tabular-nums ${statusMeta.cls}`}
                >
                  {statusMeta.label}
                </span>
              </div>

              {/* Selector de método + botones rápidos de cobro */}
              <div className="mt-3.5 space-y-2.5 border-t border-slate-100 pt-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="mr-1 text-xs font-semibold text-slate-500">
                    Método:
                  </span>
                  {METODOS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() =>
                        setSelectedMethodById((prev) => ({
                          ...prev,
                          [c.id]: m,
                        }))
                      }
                      className={`min-h-[38px] rounded-xl border px-3 text-xs font-bold ${
                        method === m
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-700'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdatePago(c.id, 'sin_pago', 0, undefined)}
                    className={`tap-feedback inline-flex min-h-[44px] items-center justify-center gap-1 rounded-xl border px-2 text-xs font-bold ${
                      c.pagoEstado === 'sin_pago'
                        ? 'border-amber-400 bg-amber-50 text-amber-900'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    Sin pago
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onUpdatePago(
                        c.id,
                        'adelanto',
                        Math.round(c.precio / 2),
                        method
                      )
                    }
                    className={`tap-feedback inline-flex min-h-[44px] items-center justify-center gap-1 rounded-xl border px-2 text-xs font-bold ${
                      c.pagoEstado === 'adelanto'
                        ? 'border-sky-500 bg-sky-50 text-sky-900'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <Banknote className="h-3.5 w-3.5" />
                    Adelanto 50%
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onUpdatePago(c.id, 'pagado', c.precio, method)
                    }
                    style={
                      c.pagoEstado === 'pagado'
                        ? { backgroundColor: rubro.colores.primario }
                        : undefined
                    }
                    className={`tap-feedback inline-flex min-h-[44px] items-center justify-center gap-1 rounded-xl border px-2 text-xs font-bold ${
                      c.pagoEstado === 'pagado'
                        ? 'border-transparent text-white'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-900'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Pagado
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
