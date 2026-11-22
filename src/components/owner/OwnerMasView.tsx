import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Check,
  Database,
  Eye,
  LogOut,
  MessageSquare,
  Save,
  Sliders,
  Trash2,
} from 'lucide-react';
import type { RubroConfig, ServicioItem } from '../../config/rubros';
import type { AppointmentRecord } from '../../types/app';
import { OwnerMonthlyChart } from './OwnerMonthlyChart';
import { getLimaDateOffsetStr } from './ownerSeedData';

interface OwnerMasViewProps {
  rubro: RubroConfig;
  citas: AppointmentRecord[];
  reminderTemplate: string;
  onUpdateReminderTemplate: (tpl: string) => void;
  onUpdateRubroSettings: (params: {
    servicios: ServicioItem[];
    diasLabel: string;
  }) => void;
  onLoadSampleData: () => void;
  onClearSampleData: () => void;
  onViewAsClient: () => void;
  onLogout: () => void;
}

export const OwnerMasView: React.FC<OwnerMasViewProps> = ({
  rubro,
  citas,
  reminderTemplate,
  onUpdateReminderTemplate,
  onUpdateRubroSettings,
  onLoadSampleData,
  onClearSampleData,
  onViewAsClient,
  onLogout,
}) => {
  const [serviciosDraft, setServiciosDraft] = useState<ServicioItem[]>(
    rubro.servicios
  );
  const [diasLabelDraft, setDiasLabelDraft] = useState(rubro.horario.diasLabel);
  const [templateDraft, setTemplateDraft] = useState(reminderTemplate);
  const [savedNotice, setSavedNotice] = useState(false);

  const todayYmd = useMemo(() => getLimaDateOffsetStr(0), []);
  const weekAgoYmd = useMemo(() => getLimaDateOffsetStr(-7), []);
  const monthAgoYmd = useMemo(() => getLimaDateOffsetStr(-30), []);

  const stats = useMemo(() => {
    const citasSemana = citas.filter((c) => c.fecha >= weekAgoYmd).length;
    const totalRegistradas = citas.length || 1;
    const noShows = citas.filter((c) => c.estado === 'no_asistio').length;
    const pctInasistencia = Math.round((noShows / totalRegistradas) * 100);

    const ingresosMes = citas
      .filter((c) => c.fecha >= monthAgoYmd && c.estado !== 'cancelada')
      .reduce(
        (acc, c) =>
          acc +
          (c.pagoEstado === 'pagado' || c.estado === 'atendido'
            ? c.precio
            : c.montoPagado || 0),
        0
      );

    // Horas pico
    const hourCounts = new Map<string, number>();
    for (const c of citas) {
      hourCounts.set(c.hora, (hourCounts.get(c.hora) || 0) + 1);
    }
    const horasPico = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    // Servicios más pedidos
    const svcCounts = new Map<string, number>();
    for (const c of citas) {
      svcCounts.set(c.servicio, (svcCounts.get(c.servicio) || 0) + 1);
    }
    const topServicios = Array.from(svcCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    const maxSvcCount = topServicios[0]?.[1] || 1;
    const maxHourCount = horasPico[0]?.[1] || 1;

    return {
      citasSemana,
      pctInasistencia,
      ingresosMes,
      horasPico,
      topServicios,
      maxSvcCount,
      maxHourCount,
    };
  }, [citas, weekAgoYmd, monthAgoYmd]);

  const sampleCount = useMemo(
    () => citas.filter((c) => c.esEjemplo).length,
    [citas]
  );

  const previewRenderedMessage = useMemo(() => {
    return templateDraft
      .replace(/\[cliente\]/gi, 'Carlos Mendoza')
      .replace(/\[servicio\]/gi, serviciosDraft[0]?.nombre || 'Consulta')
      .replace(/\[fecha\]/gi, `${todayYmd} a las 10:00`);
  }, [templateDraft, serviciosDraft, todayYmd]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateRubroSettings({
      servicios: serviciosDraft,
      diasLabel: diasLabelDraft,
    });
    onUpdateReminderTemplate(templateDraft);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2600);
  };

  return (
    <div className="space-y-5">
      <div className="px-1">
        <h2 className="text-xl font-bold text-slate-900">
          Estadísticas y Configuración
        </h2>
        <p className="text-xs text-slate-500">
          Métricas reales calculadas sobre tu agenda, horarios, tarifas y recordatorios.
        </p>
      </div>

      {/* 1. ESTADÍSTICAS REALES */}
      <section className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <BarChart3
            className="h-4 w-4"
            style={{ color: rubro.colores.primario }}
          />
          Indicadores del negocio (datos en vivo)
        </h3>

        <div className="grid grid-cols-3 gap-2.5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] font-medium text-slate-500">
              Citas / semana
            </p>
            <p className="mt-1 text-xl font-bold text-slate-900 tabular-nums">
              {stats.citasSemana}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] font-medium text-slate-500">
              % inasistencia
            </p>
            <p className="mt-1 text-xl font-bold text-rose-700 tabular-nums">
              {stats.pctInasistencia}%
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] font-medium text-slate-500">
              Ingresos mes
            </p>
            <p className="mt-1 text-xl font-bold text-emerald-700 tabular-nums">
              S/ {stats.ingresosMes}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold text-slate-700">
              Servicios más pedidos
            </p>
            <div className="mt-2 space-y-2">
              {stats.topServicios.map(([name, count]) => (
                <div key={name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="truncate font-medium text-slate-800">
                      {name}
                    </span>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {count}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.round((count / stats.maxSvcCount) * 100)}%`,
                        backgroundColor: rubro.colores.primario,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-700">Horas pico</p>
            <div className="mt-2 space-y-2">
              {stats.horasPico.map(([hour, count]) => (
                <div key={hour} className="space-y-1">
                  <div className="flex justify-between text-xs tabular-nums">
                    <span className="font-medium text-slate-800">{hour}</span>
                    <span className="font-bold text-slate-900">
                      {count} citas
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-600"
                      style={{
                        width: `${Math.round((count / stats.maxHourCount) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <OwnerMonthlyChart
        rubro={rubro}
        citas={citas}
        onLoadSampleData={onLoadSampleData}
      />

      {/* 2. CONFIGURACIÓN DE SERVICIOS Y RECORDATORIOS */}
      <form
        onSubmit={handleSaveSettings}
        className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs"
      >
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <Sliders
            className="h-4 w-4"
            style={{ color: rubro.colores.primario }}
          />
          Configuración del negocio
        </h3>

        <div>
          <label className="block text-xs font-bold text-slate-700">
            Horario visible de atención
          </label>
          <input
            type="text"
            value={diasLabelDraft}
            onChange={(e) => setDiasLabelDraft(e.target.value)}
            className="mt-1 min-h-[46px] w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900"
          />
        </div>

        <div className="space-y-2.5">
          <p className="text-xs font-bold text-slate-700">
            Servicios, duración y tarifa (S/)
          </p>
          {serviciosDraft.map((svc, idx) => (
            <div
              key={svc.id}
              className="grid grid-cols-1 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-12"
            >
              <input
                type="text"
                value={svc.nombre}
                onChange={(e) => {
                  const val = e.target.value;
                  setServiciosDraft((prev) =>
                    prev.map((item, i) =>
                      i === idx ? { ...item, nombre: val } : item
                    )
                  );
                }}
                aria-label="Nombre del servicio"
                className="min-h-[42px] rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-900 sm:col-span-6"
              />
              <input
                type="text"
                value={svc.duracion}
                onChange={(e) => {
                  const val = e.target.value;
                  setServiciosDraft((prev) =>
                    prev.map((item, i) =>
                      i === idx ? { ...item, duracion: val } : item
                    )
                  );
                }}
                aria-label="Duración"
                className="min-h-[42px] rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-700 sm:col-span-3"
              />
              <div className="relative sm:col-span-3">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                  S/
                </span>
                <input
                  type="number"
                  min={0}
                  value={svc.precio}
                  onChange={(e) => {
                    const num = Number(e.target.value) || 0;
                    setServiciosDraft((prev) =>
                      prev.map((item, i) =>
                        i === idx ? { ...item, precio: num } : item
                      )
                    );
                  }}
                  aria-label="Precio en soles"
                  className="min-h-[42px] w-full rounded-xl border border-slate-300 bg-white pl-7 pr-2 text-xs font-bold text-slate-900 tabular-nums"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Recordatorios automáticos */}
        <div className="space-y-2 border-t border-slate-100 pt-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <MessageSquare className="h-4 w-4 text-[#25D366]" />
              Mensaje de recordatorio WhatsApp
            </label>
            <span className="text-[11px] font-bold text-emerald-700">
              Recordatorios automáticos: activos
            </span>
          </div>
          <textarea
            rows={3}
            value={templateDraft}
            onChange={(e) => setTemplateDraft(e.target.value)}
            className="w-full rounded-xl border border-slate-300 p-3 text-xs leading-relaxed text-slate-900"
          />
          <p className="text-[11px] text-slate-500">
            Variables disponibles: [cliente], [servicio], [fecha].
          </p>
          <div className="rounded-2xl border border-emerald-200 bg-[#EFEAE2] p-3 text-xs text-slate-900">
            <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-800">
              Vista previa WhatsApp
            </p>
            <p className="mt-1 rounded-xl bg-white p-2.5 shadow-2xs">
              {previewRenderedMessage}
            </p>
          </div>
        </div>

        {savedNotice && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
            <Check className="h-4 w-4" /> Cambios guardados en tu panel.
          </div>
        )}

        <button
          type="submit"
          style={{ backgroundColor: rubro.colores.primario }}
          className="tap-feedback flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white shadow-xs"
        >
          <Save className="h-4 w-4" />
          Guardar configuración
        </button>
      </form>

      {/* 3. DATOS DE EJEMPLO Y SESIÓN */}
      <section className="space-y-2.5 rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-900">
          Datos de demostración y cuenta
        </h3>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={onLoadSampleData}
            className="tap-feedback flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 text-xs font-bold text-indigo-800 hover:bg-indigo-100"
          >
            <Database className="h-4 w-4" />
            Cargar datos de ejemplo (12 clientes, 20 citas)
          </button>

          <button
            type="button"
            disabled={sampleCount === 0}
            onClick={onClearSampleData}
            className="tap-feedback flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Borrar datos de ejemplo ({sampleCount})
          </button>

          <button
            type="button"
            onClick={onViewAsClient}
            className="tap-feedback flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-bold text-slate-800 hover:bg-slate-100"
          >
            <Eye className="h-4 w-4" />
            Ver Landing como cliente
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="tap-feedback flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-xs font-bold text-rose-800 hover:bg-rose-100"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión de dueño
          </button>
        </div>
      </section>
    </div>
  );
};
