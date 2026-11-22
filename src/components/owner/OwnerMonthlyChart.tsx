import React, { useMemo, useState } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { RubroConfig } from '../../config/rubros';
import type { AppointmentRecord } from '../../types/app';
import { getLimaDateOffsetStr } from './ownerSeedData';

interface OwnerMonthlyChartProps {
  rubro: RubroConfig;
  citas: AppointmentRecord[];
  onLoadSampleData?: () => void;
}

interface MonthlyChartDatum {
  monthKey: string;
  mesLabel: string;
  confirmadas: number;
  inasistencias: number;
  pendientes: number;
  totalCitas: number;
  ingresos: number;
  ingresosCobrados: number;
  ticketPromedio: number;
}

function buildRecentMonthKeys(monthsCount = 6): { key: string; label: string }[] {
  const todayYmd = getLimaDateOffsetStr(0);
  const [yearStr, monthStr] = todayYmd.split('-');
  const baseYear = Number(yearStr);
  const baseMonthIndex = Number(monthStr) - 1;

  const formatter = new Intl.DateTimeFormat('es-PE', {
    month: 'short',
    year: '2-digit',
    timeZone: 'UTC',
  });

  const result: { key: string; label: string }[] = [];
  for (let i = monthsCount - 1; i >= 0; i -= 1) {
    const dt = new Date(Date.UTC(baseYear, baseMonthIndex - i, 15));
    const y = dt.getUTCFullYear();
    const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const rawLabel = formatter.format(dt).replace('.', '');
    const cleanLabel = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);
    result.push({
      key: `${y}-${m}`,
      label: cleanLabel,
    });
  }
  return result;
}

const formatSoles = (amount: number): string => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const OwnerMonthlyChart: React.FC<OwnerMonthlyChartProps> = ({
  rubro,
  citas,
  onLoadSampleData,
}) => {
  const [chartMode, setChartMode] = useState<'ambos' | 'ingresos' | 'citas'>(
    'ambos'
  );

  const { chartData, kpis, currentMonthData, activeMonthsCount } =
    useMemo(() => {
      const recentMonths = buildRecentMonthKeys(6);
      const bucketMap = new Map<string, MonthlyChartDatum>();

      for (const m of recentMonths) {
        bucketMap.set(m.key, {
          monthKey: m.key,
          mesLabel: m.label,
          confirmadas: 0,
          inasistencias: 0,
          pendientes: 0,
          totalCitas: 0,
          ingresos: 0,
          ingresosCobrados: 0,
          ticketPromedio: 0,
        });
      }

      let grandTotalIngresos = 0;
      let grandTotalCobrado = 0;
      let grandTotalConfirmadas = 0;
      let grandTotalInasistencias = 0;
      let grandTotalCitas = 0;

      for (const c of citas) {
        if (!c.fecha || c.fecha.length < 7) continue;
        const monthKey = c.fecha.slice(0, 7);

        if (!bucketMap.has(monthKey)) {
          const [yStr, mStr] = monthKey.split('-');
          const dt = new Date(Date.UTC(Number(yStr), Number(mStr) - 1, 15));
          const label = Number.isNaN(dt.getTime())
            ? monthKey
            : new Intl.DateTimeFormat('es-PE', {
                month: 'short',
                year: '2-digit',
                timeZone: 'UTC',
              })
                .format(dt)
                .replace('.', '');
          bucketMap.set(monthKey, {
            monthKey,
            mesLabel: label.charAt(0).toUpperCase() + label.slice(1),
            confirmadas: 0,
            inasistencias: 0,
            pendientes: 0,
            totalCitas: 0,
            ingresos: 0,
            ingresosCobrados: 0,
            ticketPromedio: 0,
          });
        }

        const entry = bucketMap.get(monthKey)!;
        entry.totalCitas += 1;
        grandTotalCitas += 1;

        const isConfirmedOrAttended =
          c.estado === 'confirmada' || c.estado === 'atendido';
        const isNoShow = c.estado === 'no_asistio';
        const isPending = c.estado === 'pendiente';

        if (isConfirmedOrAttended) {
          entry.confirmadas += 1;
          grandTotalConfirmadas += 1;
          const precio = Number(c.precio) || 0;
          entry.ingresos += precio;
          grandTotalIngresos += precio;

          const cobrado =
            c.pagoEstado === 'pagado'
              ? precio
              : c.pagoEstado === 'adelanto'
                ? Number(c.montoPagado) || 0
                : 0;
          entry.ingresosCobrados += cobrado;
          grandTotalCobrado += cobrado;
        } else if (isNoShow) {
          entry.inasistencias += 1;
          grandTotalInasistencias += 1;
        } else if (isPending) {
          entry.pendientes += 1;
        }
      }

      // Compute averages
      for (const val of bucketMap.values()) {
        val.ticketPromedio =
          val.confirmadas > 0
            ? Math.round(val.ingresos / val.confirmadas)
            : 0;
      }

      const sorted = Array.from(bucketMap.values()).sort((a, b) =>
        a.monthKey.localeCompare(b.monthKey)
      );
      const recentSix = sorted.slice(-6);

      const todayYmd = getLimaDateOffsetStr(0);
      const currentMonthKey = todayYmd.slice(0, 7);
      const currentMonthDatum =
        recentSix.find((d) => d.monthKey === currentMonthKey) ||
        recentSix[recentSix.length - 1] || {
          monthKey: currentMonthKey,
          mesLabel: 'Este mes',
          confirmadas: 0,
          inasistencias: 0,
          pendientes: 0,
          totalCitas: 0,
          ingresos: 0,
          ingresosCobrados: 0,
          ticketPromedio: 0,
        };

      const monthsWithActivity = recentSix.filter(
        (d) => d.totalCitas > 0 || d.ingresos > 0
      ).length;

      const totalBase = grandTotalConfirmadas + grandTotalInasistencias;
      const tasaAsistencia =
        totalBase > 0
          ? Math.round((grandTotalConfirmadas / totalBase) * 100)
          : 100;
      const ticketPromedioGlobal =
        grandTotalConfirmadas > 0
          ? Math.round(grandTotalIngresos / grandTotalConfirmadas)
          : 0;

      return {
        chartData: recentSix,
        currentMonthData: currentMonthDatum,
        kpis: {
          totalIngresos: grandTotalIngresos,
          totalCobrado: grandTotalCobrado,
          totalConfirmadas: grandTotalConfirmadas,
          totalInasistencias: grandTotalInasistencias,
          totalCitas: grandTotalCitas,
          ticketPromedio: ticketPromedioGlobal,
          tasaAsistencia,
        },
        activeMonthsCount: monthsWithActivity,
      };
    }, [citas]);

  const hasSampleLoaded = useMemo(
    () => citas.some((c) => c.esEjemplo || c.id.startsWith('demo-seed-')),
    [citas]
  );

  return (
    <section
      aria-label="Resumen de citas programadas e ingresos totales por mes"
      className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs sm:p-6"
    >
      {/* Header con título y switch de vista */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-2xs"
              style={{ backgroundColor: rubro.colores.primario }}
            >
              <BarChart3 className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Citas e Ingresos Mensuales
              </h2>
              <p className="text-xs text-slate-500">
                Evolución de citas programadas y facturación total generada en Soles (S/).
              </p>
            </div>
          </div>
        </div>

        {/* Switch de modo de visualización */}
        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs font-bold text-slate-700">
          <button
            type="button"
            onClick={() => setChartMode('ambos')}
            className={`tap-feedback rounded-lg px-3 py-1.5 transition-colors ${
              chartMode === 'ambos'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📊 Citas + Ingresos
          </button>
          <button
            type="button"
            onClick={() => setChartMode('ingresos')}
            className={`tap-feedback rounded-lg px-3 py-1.5 transition-colors ${
              chartMode === 'ingresos'
                ? 'bg-white text-emerald-800 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            💰 Solo Ingresos (S/)
          </button>
          <button
            type="button"
            onClick={() => setChartMode('citas')}
            className={`tap-feedback rounded-lg px-3 py-1.5 transition-colors ${
              chartMode === 'citas'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📅 Solo Citas
          </button>
        </div>
      </div>

      {/* KPI Cards Ejecutivas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* KPI 1: Ingresos Este Mes */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Ingresos este mes
            </span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-1 text-xl sm:text-2xl font-black text-emerald-950 tabular-nums">
            {formatSoles(currentMonthData.ingresos)}
          </p>
          <p className="mt-0.5 text-[11px] text-emerald-700">
            {currentMonthData.confirmadas} citas en {currentMonthData.mesLabel}
          </p>
        </div>

        {/* KPI 2: Total Ingresos 6 Meses */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Ingresos (6 meses)
            </span>
            <TrendingUp className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-1 text-xl sm:text-2xl font-black text-slate-900 tabular-nums">
            {formatSoles(kpis.totalIngresos)}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Cobrado efectivo: {formatSoles(kpis.totalCobrado)}
          </p>
        </div>

        {/* KPI 3: Ticket Promedio */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Ticket promedio
            </span>
            <ArrowUpRight className="h-4 w-4 text-slate-600" />
          </div>
          <p className="mt-1 text-xl sm:text-2xl font-black text-slate-900 tabular-nums">
            {formatSoles(kpis.ticketPromedio)}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            por cita atendida
          </p>
        </div>

        {/* KPI 4: Asistencia */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Asistencia / Éxito
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-1 text-xl sm:text-2xl font-black text-slate-900 tabular-nums">
            {kpis.tasaAsistencia}%
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {kpis.totalConfirmadas} de {kpis.totalConfirmadas + kpis.totalInasistencias} citas
          </p>
        </div>
      </div>

      {/* Gráfico Recharts Interactivo con Tooltip en Soles */}
      <div className="h-[280px] w-full min-w-0 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 12, right: 12, left: -10, bottom: 0 }}
            barGap={4}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#E2E8F0"
            />
            <XAxis
              dataKey="mesLabel"
              tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
              axisLine={{ stroke: '#CBD5E1' }}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              allowDecimals={false}
              tick={{ fontSize: 11, fill: '#64748B' }}
              axisLine={false}
              tickLine={false}
              label={
                chartMode === 'ingresos'
                  ? undefined
                  : {
                      value: 'Citas',
                      angle: -90,
                      position: 'insideLeft',
                      offset: 15,
                      style: { fontSize: 10, fill: '#94A3B8' },
                    }
              }
            />
            {(chartMode === 'ambos' || chartMode === 'ingresos') && (
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11, fill: '#10B981' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `S/${val}`}
              />
            )}

            <Tooltip
              cursor={{ fill: 'rgba(15, 23, 42, 0.04)' }}
              content={({ active, payload, label }) => {
                if (!active || !payload || payload.length === 0) return null;
                const d = payload[0]?.payload as MonthlyChartDatum;
                if (!d) return null;

                return (
                  <div className="rounded-2xl border border-slate-200 bg-white p-3.5 text-xs shadow-xl min-w-[210px]">
                    <p className="font-extrabold text-slate-900 border-b border-slate-100 pb-1.5">
                      {label} ({d.monthKey})
                    </p>
                    <div className="mt-2 space-y-1.5 tabular-nums">
                      <p className="flex items-center justify-between text-emerald-800 font-bold">
                        <span className="flex items-center gap-1">
                          💰 Ingresos generados:
                        </span>
                        <span>{formatSoles(d.ingresos)}</span>
                      </p>
                      <p className="flex items-center justify-between text-indigo-700 font-semibold">
                        <span>📅 Citas confirmadas:</span>
                        <span>{d.confirmadas}</span>
                      </p>
                      {d.inasistencias > 0 && (
                        <p className="flex items-center justify-between text-rose-700">
                          <span>❌ Inasistencias:</span>
                          <span>{d.inasistencias}</span>
                        </p>
                      )}
                      {d.pendientes > 0 && (
                        <p className="flex items-center justify-between text-amber-700">
                          <span>⏳ Por confirmar:</span>
                          <span>{d.pendientes}</span>
                        </p>
                      )}
                      <p className="flex items-center justify-between text-slate-500 text-[11px] pt-1 border-t border-slate-100">
                        <span>Ticket promedio:</span>
                        <span className="font-semibold text-slate-800">
                          {formatSoles(d.ticketPromedio)}
                        </span>
                      </p>
                    </div>
                  </div>
                );
              }}
            />

            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
              formatter={(value) => (
                <span className="font-semibold text-slate-700">{value}</span>
              )}
            />

            {/* MODO: AMBOS (Citas en barra + Ingresos en línea/área verde) */}
            {chartMode === 'ambos' && (
              <>
                <Bar
                  yAxisId="left"
                  dataKey="confirmadas"
                  name="Citas Confirmadas"
                  fill={rubro.colores.primario}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  yAxisId="left"
                  dataKey="inasistencias"
                  name="Inasistencias"
                  fill="#F43F5E"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={16}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="ingresos"
                  name="Ingresos (S/)"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              </>
            )}

            {/* MODO: SOLO INGRESOS */}
            {chartMode === 'ingresos' && (
              <Bar
                yAxisId="right"
                dataKey="ingresos"
                name="Ingresos Totales (S/)"
                fill="#10B981"
                radius={[6, 6, 0, 0]}
                maxBarSize={44}
              />
            )}

            {/* MODO: SOLO CITAS */}
            {chartMode === 'citas' && (
              <>
                <Bar
                  yAxisId="left"
                  dataKey="confirmadas"
                  name="Confirmadas"
                  fill={rubro.colores.primario}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  yAxisId="left"
                  dataKey="pendientes"
                  name="Pendientes"
                  fill="#F59E0B"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={24}
                />
                <Bar
                  yAxisId="left"
                  dataKey="inasistencias"
                  name="Inasistencias"
                  fill="#EF4444"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={20}
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Cargar datos de ejemplo si solo hay 1 mes de registro */}
      {!hasSampleLoaded && activeMonthsCount <= 1 && onLoadSampleData && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <p className="text-[11px] text-slate-500">
            Actualmente solo hay registros de este mes. Carga datos de prueba para visualizar la tendencia semestral de citas e ingresos.
          </p>
          <button
            type="button"
            onClick={onLoadSampleData}
            className="tap-feedback min-h-[38px] rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-bold text-slate-800 hover:bg-slate-100 whitespace-nowrap"
          >
            Cargar historial de ejemplo
          </button>
        </div>
      )}
    </section>
  );
};
