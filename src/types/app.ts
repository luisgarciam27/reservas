import type { RubroKey } from '../config/rubros';

export type UserRole = 'guest' | 'client' | 'owner';

export interface UserSession {
  role: UserRole;
  telefono: string;
  nombre: string;
  ciudad: string;
  rubroId?: RubroKey;
  createdAt: string;
}

export type EstadoCitaAdmin =
  | 'pendiente'
  | 'confirmada'
  | 'reprogramar'
  | 'atendido'
  | 'no_asistio'
  | 'cancelada';

export type PagoEstado = 'sin_pago' | 'adelanto' | 'pagado';
export type MetodoPago = 'Efectivo' | 'Yape' | 'Plin' | 'Tarjeta';

export interface AppointmentRecord {
  id: string;
  negocioId: string;
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:00
  cliente: string;
  telefono: string; // 9 dígitos sin +51
  ciudad?: string;
  servicio: string;
  precio: number;
  estado: EstadoCitaAdmin;
  pagoEstado: PagoEstado;
  montoPagado: number;
  metodoPago?: MetodoPago;
  notas?: string;
  extra?: string; // mascota o motivo
  esEjemplo?: boolean;
  createdAt: string;
}

export interface BlockedSlot {
  id: string;
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:00
  motivo: string;
}

export type ClientTag = 'VIP' | 'Nuevo' | 'Moroso';

export interface CRMClientSummary {
  telefono: string;
  nombre: string;
  ciudad: string;
  totalCitas: number;
  totalGastado: number;
  inasistencias: number;
  ultimaFecha: string;
  ultimoServicio: string;
  diasInactivo: number;
  tags: ClientTag[];
  extras: string[];
  citas: AppointmentRecord[];
}
