export type RubroSaasKey = 'veterinaria' | 'consultorio' | 'salon' | 'otro';

export type PlanId = 'basico' | 'pro' | 'full';

export type ModuloId =
  | 'agenda'
  | 'servicios'
  | 'recordatorios'
  | 'clientes'
  | 'promos'
  | 'catalogo'
  | 'reportes';

export interface SaaSUser {
  id: string;
  email: string;
  telefono?: string;
  nombre?: string;
  isPreviewMode: boolean;
}

export interface Negocio {
  id: string;
  owner_id: string;
  nombre: string;
  slug: string;
  rubro: RubroSaasKey;
  logo: string;
  color: string;
  direccion: string;
  horario: string;
  whatsapp: string;
  plan: PlanId;
  yape_numero?: string;
  yape_nombre?: string;
  banco_info?: string;
  qr_pago_url?: string;
  hora_inicio?: string;
  hora_fin?: string;
  dias_atencion?: string[];
  created_at?: string;
}

export interface NegocioModulo {
  negocio_id: string;
  modulo: ModuloId;
  activo: boolean;
}

export interface ServicioSaaS {
  id: string;
  negocio_id: string;
  nombre: string;
  duracion: string;
  duracion_min: number;
  precio: number;
  descripcion: string;
  activo: boolean;
  orden: number;
}

export interface ProfesionalSaaS {
  id: string;
  negocio_id: string;
  nombre: string;
  especialidad: string;
  activo: boolean;
}

export interface ProductoCatalogo {
  id: string;
  negocio_id: string;
  nombre: string;
  precio: number;
  descripcion: string;
  stock: number;
  activo: boolean;
}

export interface MascotaSaaS {
  id: string;
  negocio_id: string;
  cliente_telefono: string;
  cliente_nombre: string;
  nombre: string;
  especie: string;
  raza?: string;
  notas?: string;
}

export interface OnboardingDraft {
  rubro: RubroSaasKey;
  nombre: string;
  slug: string;
  logo: string;
  color: string;
  direccion: string;
  horario: string;
  whatsapp: string;
  plan: PlanId;
  modulos: Record<ModuloId, boolean>;
  servicios: {
    id: string;
    nombre: string;
    duracion: string;
    precio: number;
    descripcion: string;
  }[];
  profesionales: {
    id: string;
    nombre: string;
    especialidad: string;
  }[];
}
