import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../config/rubros';

/**
 * ============================================================================
 * CLIENTE SUPABASE Y OPERACIONES DE RESERVA
 * ============================================================================
 * SQL sugerido en Supabase para esta demo:
 *
 *   create table citas (
 *     id uuid default gen_random_uuid() primary key,
 *     negocio_id uuid not null,
 *     cliente text not null,
 *     telefono text not null,
 *     servicio text not null,
 *     inicio timestamptz not null,
 *     estado text default 'pendiente',
 *     created_at timestamptz default now()
 *   );
 *   create unique index citas_negocio_inicio_idx on citas (negocio_id, inicio);
 *
 *   create or replace function horas_ocupadas(p_negocio_id uuid, p_fecha date)
 *   returns table(hora text) language sql security definer as $$
 *     select to_char(inicio at time zone 'America/Lima', 'HH24:00') as hora
 *     from citas
 *     where negocio_id = p_negocio_id
 *       and (inicio at time zone 'America/Lima')::date = p_fecha
 *       and coalesce(estado, 'pendiente') <> 'cancelada';
 *   $$;
 */

export const isSupabaseConfigured =
  Boolean(SUPABASE_URL) &&
  Boolean(SUPABASE_ANON_KEY) &&
  !SUPABASE_URL.includes('tu-proyecto.supabase.co') &&
  !SUPABASE_ANON_KEY.includes('tu-anon-key-publica-aqui');

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return supabaseInstance;
}

// Almacén en memoria solo para vista previa local cuando aún no se configuran llaves reales de Supabase
const previewBookedSlots = new Map<string, Set<string>>();

function getPreviewSlotKey(negocioId: string, fecha: string): string {
  return `${negocioId}__${fecha}`;
}

export class OfflineBookingError extends Error {
  constructor() {
    super('Necesitas internet para reservar');
    this.name = 'OfflineBookingError';
  }
}

export class SlotTakenError extends Error {
  constructor() {
    super('Esa hora ya fue tomada. Por favor elige otro horario.');
    this.name = 'SlotTakenError';
  }
}

/**
 * Extrae formato HH:00 desde distintos posibles retornos de la RPC `horas_ocupadas`
 */
function normalizeHourFromRpc(entry: unknown): string | null {
  if (typeof entry === 'string') {
    const match = entry.match(/(\d{2}):\d{2}/);
    return match ? `${match[1]}:00` : null;
  }
  if (entry && typeof entry === 'object') {
    const obj = entry as Record<string, unknown>;
    const candidate = obj.hora ?? obj.inicio ?? obj.slot ?? obj.hour;
    if (typeof candidate === 'string') {
      // Si viene como ISO timestamptz completo, convertir a hora America/Lima
      if (candidate.includes('T')) {
        const dt = new Date(candidate);
        if (!Number.isNaN(dt.getTime())) {
          const limaHour = new Intl.DateTimeFormat('es-PE', {
            timeZone: 'America/Lima',
            hour: '2-digit',
            hour12: false,
          }).format(dt);
          return `${limaHour.padStart(2, '0')}:00`;
        }
      }
      const match = candidate.match(/(\d{2}):\d{2}/);
      return match ? `${match[1]}:00` : null;
    }
  }
  return null;
}

/**
 * Consulta la función RPC `horas_ocupadas` en Supabase para un negocio y fecha dados.
 */
export async function fetchHorasOcupadas(
  negocioId: string,
  fecha: string
): Promise<{ horas: string[]; isPreviewMode: boolean }> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new OfflineBookingError();
  }

  // Si aún no se colocan las constantes reales de Supabase, permite probar el flujo en vista previa
  if (!isSupabaseConfigured) {
    await new Promise((r) => setTimeout(r, 220));
    const key = getPreviewSlotKey(negocioId, fecha);
    const localSet = previewBookedSlots.get(key);
    // Simulamos un par de turnos base ocupados para mostrar el estado visualmente
    const baseBusy = ['10:00', '16:00'];
    const merged = new Set<string>([...baseBusy, ...(localSet ? Array.from(localSet) : [])]);
    return { horas: Array.from(merged), isPreviewMode: true };
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('horas_ocupadas', {
      p_negocio_id: negocioId,
      p_fecha: fecha,
    });

    if (error) {
      throw new Error(error.message || 'No se pudo consultar la disponibilidad.');
    }

    const list = Array.isArray(data) ? data : [];
    const normalized = list
      .map(normalizeHourFromRpc)
      .filter((h): h is string => Boolean(h));

    return { horas: Array.from(new Set(normalized)), isPreviewMode: false };
  } catch (err) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new OfflineBookingError();
    }
    if (err instanceof TypeError) {
      throw new OfflineBookingError();
    }
    throw err instanceof Error
      ? err
      : new Error('Error de conexión al consultar horarios.');
  }
}

export interface CrearCitaPayload {
  cliente: string;
  telefono: string;
  servicio: string;
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:00
  negocio_id: string;
}

/**
 * Inserta estrictamente los 5 campos permitidos en la tabla `citas`:
 * cliente, telefono, servicio, inicio (timestamptz America/Lima), negocio_id.
 * No envía estado ni campos adicionales.
 */
export async function crearCita(
  payload: CrearCitaPayload
): Promise<{ isPreviewMode: boolean; inicio: string }> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new OfflineBookingError();
  }

  // Perú (America/Lima) no utiliza horario de verano; su desfase fijo es -05:00
  const inicio = `${payload.fecha}T${payload.hora}:00-05:00`;

  if (!isSupabaseConfigured) {
    await new Promise((r) => setTimeout(r, 320));
    const key = getPreviewSlotKey(payload.negocio_id, payload.fecha);
    const localSet = previewBookedSlots.get(key) ?? new Set<string>();
    if (localSet.has(payload.hora) || payload.hora === '10:00' || payload.hora === '16:00') {
      throw new SlotTakenError();
    }
    localSet.add(payload.hora);
    previewBookedSlots.set(key, localSet);
    return { isPreviewMode: true, inicio };
  }

  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('citas').insert([
      {
        cliente: payload.cliente.trim(),
        telefono: payload.telefono.trim(),
        servicio: payload.servicio,
        inicio,
        negocio_id: payload.negocio_id,
      },
    ]);

    if (error) {
      const msg = (error.message || '').toLowerCase();
      if (
        error.code === '23505' ||
        msg.includes('duplicate') ||
        msg.includes('unique') ||
        msg.includes('ocupad')
      ) {
        throw new SlotTakenError();
      }
      throw new Error('No se pudo registrar tu cita. Inténtalo nuevamente.');
    }

    return { isPreviewMode: false, inicio };
  } catch (err) {
    if (err instanceof SlotTakenError || err instanceof OfflineBookingError) {
      throw err;
    }
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new OfflineBookingError();
    }
    if (err instanceof TypeError) {
      throw new OfflineBookingError();
    }
    throw err instanceof Error
      ? err
      : new Error('Ocurrió un problema de red al guardar la reserva.');
  }
}
