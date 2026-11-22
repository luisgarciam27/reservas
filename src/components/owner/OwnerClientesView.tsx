import React, { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  Download,
  MapPin,
  Phone,
  Search,
  Tag,
  UserCheck,
  UserX,
  Users,
  X,
} from 'lucide-react';
import type { RubroConfig } from '../../config/rubros';
import { normalizePeruPhone } from '../../hooks/useAuthSession';
import type {
  AppointmentRecord,
  CRMClientSummary,
  ClientTag,
} from '../../types/app';
import { WhatsAppSvgIcon } from '../RubroIcons';
import { ADMIN_STATUS_META, getLimaDateOffsetStr } from './ownerSeedData';

interface OwnerClientesViewProps {
  rubro: RubroConfig;
  citas: AppointmentRecord[];
  clientTags: Record<string, ClientTag[]>;
  onToggleClientTag: (telefono: string, tag: ClientTag) => void;
  onLoadSampleData?: () => void;
}

type ClientFilter = 'todos' | 'frecuentes' | 'inactivos' | 'inasistencias';
type ClientSort = 'citas' | 'gastado' | 'inasistencias' | 'reciente';

function diffDaysFromToday(ymd: string, todayYmd: string): number {
  const a = new Date(`${ymd}T12:00:00Z`).getTime();
  const b = new Date(`${todayYmd}T12:00:00Z`).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.max(0, Math.round((b - a) / (1000 * 60 * 60 * 24)));
}

export const OwnerClientesView: React.FC<OwnerClientesViewProps> = ({
  rubro,
  citas,
  clientTags,
  onToggleClientTag,
  onLoadSampleData,
}) => {
  const todayYmd = useMemo(() => getLimaDateOffsetStr(0), []);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ClientFilter>('todos');
  const [sortBy, setSortBy] = useState<ClientSort>('citas');
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);

  const clients = useMemo<CRMClientSummary[]>(() => {
    const map = new Map<string, AppointmentRecord[]>();
    for (const c of citas) {
      const tel =
        normalizePeruPhone(c.telefono) ||
        c.telefono.replace(/\D/g, '') ||
        '000000000';
      const arr = map.get(tel) || [];
      arr.push(c);
      map.set(tel, arr);
    }

    const list: CRMClientSummary[] = [];
    for (const [telefono, group] of map.entries()) {
      const sorted = [...group].sort((a, b) =>
        `${b.fecha} ${b.hora}`.localeCompare(`${a.fecha} ${a.hora}`)
      );
      const latest = sorted[0];
      const totalCitas = sorted.length;
      const totalGastado = sorted.reduce(
        (acc, item) =>
          acc +
          (item.pagoEstado === 'pagado' || item.estado === 'atendido'
            ? item.precio
            : item.montoPagado || 0),
        0
      );
      const inasistencias = sorted.filter(
        (item) => item.estado === 'no_asistio'
      ).length;
      const diasInactivo = diffDaysFromToday(latest.fecha, todayYmd);
      const extras = Array.from(
        new Set(sorted.map((item) => item.extra).filter(Boolean) as string[])
      );

      const savedTags = clientTags[telefono];
      const derivedTags: ClientTag[] = savedTags
        ? savedTags
        : [
            ...(totalCitas >= 3 ? (['VIP'] as ClientTag[]) : []),
            ...(totalCitas === 1 ? (['Nuevo'] as ClientTag[]) : []),
            ...(inasistencias >= 1 ? (['Moroso'] as ClientTag[]) : []),
          ];

      list.push({
        telefono,
        nombre: latest.cliente,
        ciudad: latest.ciudad || 'Perú',
        totalCitas,
        totalGastado,
        inasistencias,
        ultimaFecha: latest.fecha,
        ultimoServicio: latest.servicio,
        diasInactivo,
        tags: derivedTags,
        extras,
        citas: sorted,
      });
    }

    return list;
  }, [citas, clientTags, todayYmd]);

  const globalTotals = useMemo(() => {
    let citasTotal = 0;
    let gastoTotal = 0;
    let inasistenciasTotal = 0;
    for (const cl of clients) {
      citasTotal += cl.totalCitas;
      gastoTotal += cl.totalGastado;
      inasistenciasTotal += cl.inasistencias;
    }
    return {
      clientesUnicos: clients.length,
      citasTotal,
      gastoTotal,
      inasistenciasTotal,
    };
  }, [clients]);

  const filteredClients = useMemo(() => {
    const filtered = clients.filter((cl) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        cl.nombre.toLowerCase().includes(q) ||
        cl.telefono.includes(q) ||
        cl.ciudad.toLowerCase().includes(q);
      if (!matchesSearch) return false;

      if (filter === 'frecuentes') return cl.totalCitas >= 2;
      if (filter === 'inactivos') return cl.diasInactivo > 30;
      if (filter === 'inasistencias') return cl.inasistencias > 0;
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'gastado') return b.totalGastado - a.totalGastado;
      if (sortBy === 'inasistencias')
        return b.inasistencias - a.inasistencias || b.totalCitas - a.totalCitas;
      if (sortBy === 'reciente')
        return b.ultimaFecha.localeCompare(a.ultimaFecha);
      return b.totalCitas - a.totalCitas || b.totalGastado - a.totalGastado;
    });
  }, [clients, search, filter, sortBy]);

  const selectedClient = useMemo(
    () => clients.find((c) => c.telefono === selectedPhone) ?? null,
    [clients, selectedPhone]
  );

  const availableTags: ClientTag[] = ['VIP', 'Nuevo', 'Moroso'];

  const handleExportCsv = () => {
    if (filteredClients.length === 0) return;
    const header = [
      'Nombre',
      'Telefono',
      'Ciudad',
      'Total Citas',
      'Total Gastado (S/)',
      'Inasistencias',
      'Ultima Visita',
      'Ultimo Servicio',
      'Etiquetas',
    ];
    const escapeCell = (val: string | number) =>
      `"${String(val).replace(/"/g, '""')}"`;

    const rows = filteredClients.map((cl) =>
      [
        cl.nombre,
        `+51 ${cl.telefono}`,
        cl.ciudad,
        cl.totalCitas,
        cl.totalGastado,
        cl.inasistencias,
        cl.ultimaFecha,
        cl.ultimoServicio,
        cl.tags.join(' | '),
      ]
        .map(escapeCell)
        .join(',')
    );

    const csvContent = [header.map(escapeCell).join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clientes-${rubro.id}-${todayYmd}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderClientDetail = (cl: CRMClientSummary) => {
    const cleanPhone = cl.telefono.replace(/\D/g, '');
    const waText = encodeURIComponent(
      `Hola ${cl.nombre}, te saludamos de ${rubro.nombre}. Tenemos horarios disponibles esta semana para tu próximo control o servicio.`
    );
    const pctAsistencia =
      cl.totalCitas > 0
        ? Math.max(
            0,
            Math.round(
              ((cl.totalCitas - cl.inasistencias) / cl.totalCitas) * 100
            )
          )
        : 100;

    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-900 truncate">
              {cl.nombre}
            </h3>
            <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-600 tabular-nums">
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" /> +51 {cl.telefono}
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {cl.ciudad}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedPhone(null)}
            aria-label="Cerrar ficha de cliente"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Métricas calculadas del cliente */}
        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-3">
          <div>
            <p className="text-[11px] font-medium text-slate-500">
              Total citas
            </p>
            <p className="mt-0.5 text-lg font-bold text-slate-900 tabular-nums">
              {cl.totalCitas}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500">
              Total gastado
            </p>
            <p className="mt-0.5 text-lg font-bold text-slate-900 tabular-nums">
              S/ {cl.totalGastado}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500">
              Inasistencias
            </p>
            <p
              className={`mt-0.5 text-lg font-bold tabular-nums ${
                cl.inasistencias > 0 ? 'text-rose-700' : 'text-emerald-700'
              }`}
            >
              {cl.inasistencias}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-500 tabular-nums">
          Puntualidad estimada: <strong className="text-slate-800">{pctAsistencia}%</strong>{' '}
          <span aria-hidden="true">·</span> Días desde última cita:{' '}
          <strong className="text-slate-800">{cl.diasInactivo}</strong>
        </p>

        {/* Etiquetas editables */}
        <div className="border-t border-slate-100 pt-3">
          <p className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Tag className="h-3.5 w-3.5" /> Etiquetas del cliente
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {availableTags.map((tag) => {
              const active = cl.tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onToggleClientTag(cl.telefono, tag)}
                  style={
                    active
                      ? {
                          backgroundColor: rubro.colores.primario,
                          borderColor: rubro.colores.primario,
                          color: '#FFFFFF',
                        }
                      : undefined
                  }
                  className={`tap-feedback min-h-[40px] rounded-xl border px-3.5 text-xs font-bold whitespace-nowrap ${
                    active
                      ? ''
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Observaciones / Mascotas / Motivos */}
        {cl.extras.length > 0 && (
          <div className="border-t border-slate-100 pt-3">
            <p className="text-xs font-bold text-slate-700">
              {rubro.id === 'veterinaria'
                ? 'Mascotas y observaciones'
                : 'Observaciones registradas'}
            </p>
            <ul className="mt-1.5 space-y-1 text-xs text-slate-600">
              {cl.extras.map((ex) => (
                <li key={ex}>· {ex}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Acción WhatsApp */}
        <a
          href={`https://wa.me/51${cleanPhone}?text=${waText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="tap-feedback flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-bold text-white"
        >
          <WhatsAppSvgIcon className="h-4 w-4" />
          Escribir por WhatsApp
        </a>

        {/* Historial completo */}
        <div className="border-t border-slate-100 pt-3">
          <p className="text-xs font-bold text-slate-800">
            Historial de citas ({cl.citas.length})
          </p>
          <div className="mt-2 max-h-60 divide-y divide-slate-100 overflow-y-auto pr-1">
            {cl.citas.map((item) => {
              const st = ADMIN_STATUS_META[item.estado];
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 py-2.5 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">
                      {item.servicio}
                    </p>
                    <p className="text-slate-500 tabular-nums">
                      {item.fecha} · {item.hora} · S/ {item.precio}
                    </p>
                  </div>
                  <span
                    style={{ color: st.text }}
                    className="shrink-0 text-[11px] font-bold whitespace-nowrap"
                  >
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Gestión de Clientes
          </h2>
          <p className="text-xs text-slate-500">
            Agrupación automática por número de teléfono con métricas de citas, gasto e inasistencias.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          disabled={filteredClients.length === 0}
          className="tap-feedback inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-40 whitespace-nowrap shrink-0"
        >
          <Download className="h-4 w-4" />
          Exportar CSV
        </button>
      </div>

      {/* 4 Métricas globales de Gestión de Clientes */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
          <p className="text-xs font-medium text-slate-500">Clientes únicos</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
            {globalTotals.clientesUnicos}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
          <p className="text-xs font-medium text-slate-500">Citas totales</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
            {globalTotals.citasTotal}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
          <p className="text-xs font-medium text-slate-500">Total gastado</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700 tabular-nums">
            S/ {globalTotals.gastoTotal}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
          <p className="text-xs font-medium text-slate-500">Inasistencias</p>
          <p className="mt-1 text-2xl font-bold text-rose-700 tabular-nums">
            {globalTotals.inasistenciasTotal}
          </p>
        </div>
      </div>

      {/* Buscador, Filtros y Ordenamiento */}
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Buscar por nombre, celular o ciudad..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-h-[46px] w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="relative shrink-0">
            <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as ClientSort)}
              aria-label="Ordenar clientes por"
              className="min-h-[46px] w-full rounded-xl border border-slate-300 bg-white pl-9 pr-8 text-xs font-bold text-slate-800 sm:w-auto"
            >
              <option value="citas">Ordenar: Más citas</option>
              <option value="gastado">Ordenar: Mayor gasto (S/)</option>
              <option value="inasistencias">Ordenar: Más inasistencias</option>
              <option value="reciente">Ordenar: Última visita</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: 'todos', label: `Todos (${clients.length})` },
              { id: 'frecuentes', label: 'Frecuentes (2+)' },
              { id: 'inactivos', label: 'Inactivos > 30d' },
              { id: 'inasistencias', label: 'Con inasistencias' },
            ] as { id: ClientFilter; label: string }[]
          ).map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                style={
                  active
                    ? {
                        backgroundColor: rubro.colores.primario,
                        color: '#FFFFFF',
                        borderColor: rubro.colores.primario,
                      }
                    : undefined
                }
                className={`tap-feedback min-h-[40px] rounded-xl border px-3 text-xs font-bold whitespace-nowrap ${
                  active
                    ? ''
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista + Panel lateral en Desktop */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="space-y-2.5 lg:col-span-7">
          {filteredClients.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
              <Users className="mx-auto mb-2 h-9 w-9 text-slate-300" />
              <p className="text-sm font-bold text-slate-800">
                No se encontraron clientes con ese criterio
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Ajusta los filtros de búsqueda o carga datos de ejemplo para probar la vista.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {(filter !== 'todos' || search.trim() !== '') && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilter('todos');
                      setSearch('');
                    }}
                    className="tap-feedback min-h-[44px] rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-800"
                  >
                    Ver todos los clientes
                  </button>
                )}
                {onLoadSampleData && (
                  <button
                    type="button"
                    onClick={onLoadSampleData}
                    style={{ backgroundColor: rubro.colores.primario }}
                    className="tap-feedback min-h-[44px] rounded-xl px-4 text-xs font-bold text-white"
                  >
                    Cargar clientes de ejemplo
                  </button>
                )}
              </div>
            </div>
          ) : (
            filteredClients.map((cl) => {
              const isSelected = selectedPhone === cl.telefono;
              return (
                <button
                  key={cl.telefono}
                  type="button"
                  onClick={() => setSelectedPhone(cl.telefono)}
                  style={
                    isSelected
                      ? {
                          borderColor: rubro.colores.primario,
                          backgroundColor: rubro.colores.fondoSuave,
                        }
                      : undefined
                  }
                  className="tap-feedback flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-slate-300"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {cl.nombre}
                      </p>
                      {cl.tags.length > 0 && (
                        <span className="text-[11px] font-semibold text-slate-500">
                          {cl.tags.join(' · ')}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-600 tabular-nums">
                      +51 {cl.telefono} · {cl.ciudad}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500 truncate">
                      Última visita: {cl.ultimaFecha} · {cl.ultimoServicio}
                    </p>
                  </div>

                  <div className="shrink-0 text-right tabular-nums">
                    <p className="text-sm font-extrabold text-slate-900">
                      S/ {cl.totalGastado}
                    </p>
                    <p className="text-[11px] font-medium text-slate-500">
                      {cl.totalCitas} {cl.totalCitas === 1 ? 'cita' : 'citas'}
                    </p>
                    {cl.inasistencias > 0 ? (
                      <p className="mt-0.5 inline-flex items-center justify-end gap-1 text-[10px] font-bold text-rose-700">
                        <UserX className="h-3 w-3" /> {cl.inasistencias} falta(s)
                      </p>
                    ) : (
                      <p className="mt-0.5 inline-flex items-center justify-end gap-1 text-[10px] font-semibold text-emerald-700">
                        <UserCheck className="h-3 w-3" /> Sin faltas
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Panel derecho fijo en Desktop */}
        <aside className="hidden lg:block lg:col-span-5">
          <div className="sticky top-20 rounded-3xl border border-slate-200 bg-white p-5">
            {selectedClient ? (
              renderClientDetail(selectedClient)
            ) : (
              <div className="py-12 text-center text-slate-500">
                <Users className="mx-auto mb-2 h-9 w-9 text-slate-300" />
                <p className="text-sm font-semibold text-slate-800">
                  Selecciona un cliente
                </p>
                <p className="mt-1 text-xs">
                  Verás sus métricas calculadas por teléfono, etiquetas y su historial de citas.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Bottom Sheet detalle en móvil (< lg) */}
      {selectedClient && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-xs lg:hidden"
          onClick={() => setSelectedPhone(null)}
        >
          <div
            className="max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 pb-safe shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300" />
            {renderClientDetail(selectedClient)}
          </div>
        </div>
      )}
    </div>
  );
};
