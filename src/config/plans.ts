import type { ModuloId, PlanId } from '../types/saas';

export interface PlanConfig {
  id: PlanId;
  nombre: string;
  precioMensual: number;
  subtitulo: string;
  destacado?: boolean;
  maxProfesionales: number;
  modulosPermitidos: ModuloId[];
  beneficios: string[];
}

export interface ModuloMeta {
  id: ModuloId;
  nombre: string;
  descripcion: string;
  siempreActivo?: boolean;
  planMinimo: PlanId;
}

export const MODULOS_META: Record<ModuloId, ModuloMeta> = {
  agenda: {
    id: 'agenda',
    nombre: 'Agenda y citas',
    descripcion: 'Calendario diario y semanal, bloqueos de hora y registro de reservas.',
    siempreActivo: true,
    planMinimo: 'basico',
  },
  servicios: {
    id: 'servicios',
    nombre: 'Servicios y precios',
    descripcion: 'Catálogo de atenciones con duración y tarifas en Soles (S/).',
    planMinimo: 'basico',
  },
  recordatorios: {
    id: 'recordatorios',
    nombre: 'Recordatorios inteligentes',
    descripcion: 'Avisos de cita, calendario y envío opcional por WhatsApp para evitar faltas.',
    planMinimo: 'pro',
  },
  clientes: {
    id: 'clientes',
    nombre: 'Clientes y fichas',
    descripcion: 'Historial agrupado por celular, consumo e inasistencias.',
    planMinimo: 'pro',
  },
  promos: {
    id: 'promos',
    nombre: 'Promos y cupones',
    descripcion: 'Ofertas flash en horarios valle exclusivas dentro de tu App.',
    planMinimo: 'pro',
  },
  catalogo: {
    id: 'catalogo',
    nombre: 'Catálogo de productos',
    descripcion: 'Muestra productos complementarios y recibe pedidos directo desde tu App.',
    planMinimo: 'full',
  },
  reportes: {
    id: 'reportes',
    nombre: 'Reportes y cobros',
    descripcion: 'Gráficos mensuales de asistencia, ingresos y horas con más demanda.',
    planMinimo: 'full',
  },
};

export const MODULO_ORDER: ModuloId[] = [
  'agenda',
  'servicios',
  'recordatorios',
  'clientes',
  'promos',
  'catalogo',
  'reportes',
];

export const PLANS: Record<PlanId, PlanConfig> = {
  basico: {
    id: 'basico',
    nombre: 'Plan Básico',
    precioMensual: 29,
    subtitulo: 'Para profesionales independientes que quieren ordenar sus citas.',
    maxProfesionales: 1,
    modulosPermitidos: ['agenda', 'servicios'],
    beneficios: [
      'Tu propia App instalable con logo y color',
      'Agenda inteligente sin turnos cruzados',
      'Servicios y tarifas en Soles',
      'Confirmación inmediata en pantalla',
    ],
  },
  pro: {
    id: 'pro',
    nombre: 'Plan Pro',
    precioMensual: 59,
    subtitulo: 'El favorito para fidelizar clientes y bajar inasistencias.',
    destacado: true,
    maxProfesionales: 1,
    modulosPermitidos: [
      'agenda',
      'servicios',
      'recordatorios',
      'clientes',
      'promos',
    ],
    beneficios: [
      'Todo lo del Plan Básico',
      'Recordatorios en calendario y WhatsApp opcional',
      'CRM de Clientes / Pacientes / Mascotas',
      'Promos flash dentro de tu App',
    ],
  },
  full: {
    id: 'full',
    nombre: 'Plan Full',
    precioMensual: 99,
    subtitulo: 'Para clínicas, salones y veterinarias con equipo y tienda.',
    maxProfesionales: 20,
    modulosPermitidos: [
      'agenda',
      'servicios',
      'recordatorios',
      'clientes',
      'promos',
      'catalogo',
      'reportes',
    ],
    beneficios: [
      'Todo lo del Plan Pro',
      'Varios profesionales en tu App',
      'Catálogo de productos integrado',
      'Reportes mensuales e ingresos',
    ],
  },
};

export const PLAN_ORDER: PlanId[] = ['basico', 'pro', 'full'];

export function isModuleAllowedByPlan(plan: PlanId, modulo: ModuloId): boolean {
  return PLANS[plan].modulosPermitidos.includes(modulo);
}

export function buildModulesForPlanAndSelection(
  plan: PlanId,
  requested: Partial<Record<ModuloId, boolean>>
): Record<ModuloId, boolean> {
  const result: Record<ModuloId, boolean> = {
    agenda: true,
    servicios: false,
    recordatorios: false,
    clientes: false,
    promos: false,
    catalogo: false,
    reportes: false,
  };
  for (const mod of MODULO_ORDER) {
    if (mod === 'agenda') {
      result.agenda = true;
      continue;
    }
    if (isModuleAllowedByPlan(plan, mod)) {
      result[mod] = Boolean(requested[mod]);
    }
  }
  return result;
}
