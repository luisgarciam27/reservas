import { buildModulesForPlanAndSelection, MODULO_ORDER } from '../config/plans';
import { RUBROS_SAAS } from '../config/rubros';
import type {
  AppointmentRecord,
  BlockedSlot,
  EstadoCitaAdmin,
} from '../types/app';
import type {
  MascotaSaaS,
  ModuloId,
  Negocio,
  OnboardingDraft,
  PlanId,
  ProductoCatalogo,
  ProfesionalSaaS,
  SaaSUser,
  ServicioSaaS,
} from '../types/saas';
import {
  getSupabaseClient,
  isSupabaseConfigured,
  OfflineBookingError,
  SlotTakenError,
} from './supabase';

// ============================================================================
// UTILIDADES DE SLUG Y SANITIZACIÓN
// ============================================================================
export function slugifyBusinessName(raw: string): string {
  const normalized = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return normalized || 'mi-negocio';
}

export function isSafeLogoUrl(val: string): boolean {
  const trimmed = val.trim();
  if (!trimmed) return false;
  if (/^https?:\/\//i.test(trimmed)) return true;
  if (/^data:image\/(png|jpeg|jpg|webp|svg\+xml);base64,/i.test(trimmed))
    return true;
  return false;
}

function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ============================================================================
// ALMACÉN LOCAL DE VISTA PREVIA (cuando VITE_SUPABASE_URL no está configurado)
// ============================================================================
const LS_USERS_KEY = 'maria_saas_users_v1';
const LS_SESSION_KEY = 'maria_saas_session_v1';
const LS_NEGOCIOS_KEY = 'maria_saas_negocios_v1';
const LS_MODULOS_KEY = 'maria_saas_modulos_v1';
const LS_SERVICIOS_KEY = 'maria_saas_servicios_v1';
const LS_PROFS_KEY = 'maria_saas_profs_v1';
const LS_PRODUCTOS_KEY = 'maria_saas_productos_v1';
const LS_CITAS_KEY = 'maria_saas_citas_v1';
const LS_BLOQUEOS_KEY = 'maria_saas_bloqueos_v1';
const LS_MASCOTAS_KEY = 'maria_saas_mascotas_v1';

interface LocalAuthUserRecord {
  id: string;
  email: string;
  password: string;
  telefono?: string;
  nombre?: string;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignorar cuota llena
  }
}

// ============================================================================
// AUTENTICACIÓN (Supabase Auth + Fallback Local Preview)
// ============================================================================
export async function getCurrentSaaSUser(): Promise<SaaSUser | null> {
  if (!isSupabaseConfigured) {
    return readJson<SaaSUser | null>(LS_SESSION_KEY, null);
  }
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return {
    id: data.user.id,
    email: data.user.email || '',
    telefono: (data.user.user_metadata?.telefono as string) || undefined,
    nombre: (data.user.user_metadata?.nombre as string) || undefined,
    isPreviewMode: false,
  };
}

export async function signUpOwner(params: {
  email: string;
  password: string;
  telefono?: string;
  nombre?: string;
}): Promise<{ user: SaaSUser; needsEmailConfirmation: boolean }> {
  const cleanEmail = params.email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Ingresa un correo electrónico válido.');
  }
  if (params.password.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres.');
  }

  if (!isSupabaseConfigured) {
    const users = readJson<LocalAuthUserRecord[]>(LS_USERS_KEY, []);
    const exists = users.find((u) => u.email === cleanEmail);
    if (exists) {
      throw new Error('Ya existe una cuenta registrada con ese correo.');
    }
    const created: LocalAuthUserRecord = {
      id: generateId('owner'),
      email: cleanEmail,
      password: params.password,
      telefono: params.telefono?.replace(/\D/g, '') || '',
      nombre: params.nombre?.trim() || '',
    };
    writeJson(LS_USERS_KEY, [...users, created]);
    const sessionUser: SaaSUser = {
      id: created.id,
      email: created.email,
      telefono: created.telefono,
      nombre: created.nombre,
      isPreviewMode: true,
    };
    writeJson(LS_SESSION_KEY, sessionUser);
    return { user: sessionUser, needsEmailConfirmation: false };
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password: params.password,
    options: {
      data: {
        telefono: params.telefono?.replace(/\D/g, '') || '',
        nombre: params.nombre?.trim() || '',
      },
    },
  });

  if (error) {
    throw new Error(error.message || 'No pudimos crear tu cuenta.');
  }
  if (!data.user) {
    throw new Error('No se recibió confirmación del registro.');
  }

  const user: SaaSUser = {
    id: data.user.id,
    email: data.user.email || cleanEmail,
    telefono: params.telefono,
    nombre: params.nombre,
    isPreviewMode: false,
  };

  return {
    user,
    needsEmailConfirmation: !data.session,
  };
}

export async function signInOwner(params: {
  email: string;
  password: string;
}): Promise<SaaSUser> {
  const cleanEmail = params.email.trim().toLowerCase();
  if (!cleanEmail || !params.password) {
    throw new Error('Ingresa tu correo y contraseña.');
  }

  if (!isSupabaseConfigured) {
    const users = readJson<LocalAuthUserRecord[]>(LS_USERS_KEY, []);
    const match = users.find(
      (u) => u.email === cleanEmail && u.password === params.password
    );
    if (!match) {
      throw new Error('Correo o contraseña incorrectos.');
    }
    const sessionUser: SaaSUser = {
      id: match.id,
      email: match.email,
      telefono: match.telefono,
      nombre: match.nombre,
      isPreviewMode: true,
    };
    writeJson(LS_SESSION_KEY, sessionUser);
    return sessionUser;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password: params.password,
  });

  if (error || !data.user) {
    throw new Error(
      error?.message === 'Invalid login credentials'
        ? 'Correo o contraseña incorrectos.'
        : error?.message || 'No pudimos iniciar sesión.'
    );
  }

  return {
    id: data.user.id,
    email: data.user.email || cleanEmail,
    telefono: (data.user.user_metadata?.telefono as string) || undefined,
    nombre: (data.user.user_metadata?.nombre as string) || undefined,
    isPreviewMode: false,
  };
}

export async function signOutOwner(): Promise<void> {
  if (!isSupabaseConfigured) {
    localStorage.removeItem(LS_SESSION_KEY);
    return;
  }
  const supabase = getSupabaseClient();
  await supabase.auth.signOut();
}

// ============================================================================
// NEGOCIOS, MÓDULOS, SERVICIOS, PROFESIONALES Y CATÁLOGO
// ============================================================================
export interface FullBusinessBundle {
  negocio: Negocio;
  modulos: Record<ModuloId, boolean>;
  servicios: ServicioSaaS[];
  profesionales: ProfesionalSaaS[];
  productos: ProductoCatalogo[];
}

function createEmptyModulosMap(): Record<ModuloId, boolean> {
  return {
    agenda: true,
    servicios: true,
    recordatorios: false,
    clientes: false,
    promos: false,
    catalogo: false,
    reportes: false,
  };
}

export async function fetchOwnerNegocioBundle(
  ownerId: string
): Promise<FullBusinessBundle | null> {
  if (!isSupabaseConfigured) {
    const negocios = readJson<Negocio[]>(LS_NEGOCIOS_KEY, []);
    const negocio = negocios.find((n) => n.owner_id === ownerId);
    if (!negocio) return null;

    const allMods = readJson<Record<string, Record<ModuloId, boolean>>>(
      LS_MODULOS_KEY,
      {}
    );
    const modulos = allMods[negocio.id] || createEmptyModulosMap();
    const servicios = readJson<ServicioSaaS[]>(LS_SERVICIOS_KEY, []).filter(
      (s) => s.negocio_id === negocio.id
    );
    const profesionales = readJson<ProfesionalSaaS[]>(
      LS_PROFS_KEY,
      []
    ).filter((p) => p.negocio_id === negocio.id);
    const productos = readJson<ProductoCatalogo[]>(
      LS_PRODUCTOS_KEY,
      []
    ).filter((p) => p.negocio_id === negocio.id);

    return { negocio, modulos, servicios, profesionales, productos };
  }

  const supabase = getSupabaseClient();
  const { data: negocio, error } = await supabase
    .from('negocios')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !negocio) return null;

  return hydrateBundleFromSupabase(negocio as Negocio);
}

export async function fetchNegocioBundleBySlug(
  slug: string
): Promise<FullBusinessBundle | null> {
  const cleanSlug = slugifyBusinessName(slug);
  if (!isSupabaseConfigured) {
    const negocios = readJson<Negocio[]>(LS_NEGOCIOS_KEY, []);
    const negocio = negocios.find((n) => n.slug.toLowerCase() === cleanSlug);
    if (!negocio) return null;

    const allMods = readJson<Record<string, Record<ModuloId, boolean>>>(
      LS_MODULOS_KEY,
      {}
    );
    const modulos = allMods[negocio.id] || createEmptyModulosMap();
    const servicios = readJson<ServicioSaaS[]>(LS_SERVICIOS_KEY, []).filter(
      (s) => s.negocio_id === negocio.id && s.activo
    );
    const profesionales = readJson<ProfesionalSaaS[]>(
      LS_PROFS_KEY,
      []
    ).filter((p) => p.negocio_id === negocio.id && p.activo);
    const productos = readJson<ProductoCatalogo[]>(
      LS_PRODUCTOS_KEY,
      []
    ).filter((p) => p.negocio_id === negocio.id && p.activo);

    return { negocio, modulos, servicios, profesionales, productos };
  }

  const supabase = getSupabaseClient();
  const { data: negocio, error } = await supabase
    .from('negocios')
    .select('*')
    .ilike('slug', cleanSlug)
    .limit(1)
    .maybeSingle();

  if (error || !negocio) return null;
  return hydrateBundleFromSupabase(negocio as Negocio);
}

async function hydrateBundleFromSupabase(
  negocio: Negocio
): Promise<FullBusinessBundle> {
  const supabase = getSupabaseClient();
  const [modsRes, svcsRes, profsRes, prodsRes] = await Promise.all([
    supabase
      .from('negocios_modulos')
      .select('modulo, activo')
      .eq('negocio_id', negocio.id),
    supabase
      .from('servicios')
      .select('*')
      .eq('negocio_id', negocio.id)
      .order('orden', { ascending: true }),
    supabase.from('profesionales').select('*').eq('negocio_id', negocio.id),
    supabase.from('productos').select('*').eq('negocio_id', negocio.id),
  ]);

  const modulos = createEmptyModulosMap();
  if (Array.isArray(modsRes.data)) {
    for (const row of modsRes.data as { modulo: ModuloId; activo: boolean }[]) {
      modulos[row.modulo] = row.activo;
    }
  }
  modulos.agenda = true;

  return {
    negocio,
    modulos,
    servicios: (svcsRes.data as ServicioSaaS[]) || [],
    profesionales: (profsRes.data as ProfesionalSaaS[]) || [],
    productos: (prodsRes.data as ProductoCatalogo[]) || [],
  };
}

export async function createBusinessFromOnboarding(
  ownerId: string,
  draft: OnboardingDraft
): Promise<FullBusinessBundle> {
  const baseSlug = slugifyBusinessName(draft.slug || draft.nombre);
  const preset = RUBROS_SAAS[draft.rubro] || RUBROS_SAAS.otro;
  const enforcedModules = buildModulesForPlanAndSelection(
    draft.plan,
    draft.modulos
  );
  const cleanWa = draft.whatsapp.replace(/\D/g, '') || '51964112233';
  const normalizedWa = cleanWa.startsWith('51') ? cleanWa : `51${cleanWa}`;

  if (!isSupabaseConfigured) {
    const negocios = readJson<Negocio[]>(LS_NEGOCIOS_KEY, []);
    let finalSlug = baseSlug;
    let suffix = 2;
    while (negocios.some((n) => n.slug === finalSlug)) {
      finalSlug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    const negocio: Negocio = {
      id: generateId('neg'),
      owner_id: ownerId,
      nombre: draft.nombre.trim(),
      slug: finalSlug,
      rubro: draft.rubro,
      logo: draft.logo.trim() || preset.logoDefault,
      color: draft.color || preset.colorDefault,
      direccion: draft.direccion.trim() || 'Dirección por definir',
      horario: draft.horario.trim() || 'Lunes a Sábado · 9:00 a 19:00',
      whatsapp: normalizedWa,
      plan: draft.plan,
      created_at: new Date().toISOString(),
    };

    const servicios: ServicioSaaS[] = draft.servicios.map((s, idx) => ({
      id: generateId('svc'),
      negocio_id: negocio.id,
      nombre: s.nombre.trim(),
      duracion: s.duracion.trim() || '30 min',
      duracion_min: Number.parseInt(s.duracion, 10) || 30,
      precio: Number(s.precio) || 0,
      descripcion: s.descripcion.trim(),
      activo: true,
      orden: idx,
    }));

    const profesionales: ProfesionalSaaS[] = (
      draft.profesionales.length > 0
        ? draft.profesionales
        : preset.profesionalesEjemplo.slice(0, draft.plan === 'full' ? 2 : 1)
    ).map((p) => ({
      id: generateId('prof'),
      negocio_id: negocio.id,
      nombre: p.nombre.trim(),
      especialidad: p.especialidad.trim(),
      activo: true,
    }));

    const productos: ProductoCatalogo[] = preset.productosEjemplo.map((pr) => ({
      id: generateId('prod'),
      negocio_id: negocio.id,
      nombre: pr.nombre,
      precio: pr.precio,
      descripcion: pr.descripcion,
      stock: pr.stock,
      activo: true,
    }));

    writeJson(LS_NEGOCIOS_KEY, [negocio, ...negocios]);
    const allMods = readJson<Record<string, Record<ModuloId, boolean>>>(
      LS_MODULOS_KEY,
      {}
    );
    allMods[negocio.id] = enforcedModules;
    writeJson(LS_MODULOS_KEY, allMods);

    writeJson(LS_SERVICIOS_KEY, [
      ...readJson<ServicioSaaS[]>(LS_SERVICIOS_KEY, []),
      ...servicios,
    ]);
    writeJson(LS_PROFS_KEY, [
      ...readJson<ProfesionalSaaS[]>(LS_PROFS_KEY, []),
      ...profesionales,
    ]);
    writeJson(LS_PRODUCTOS_KEY, [
      ...readJson<ProductoCatalogo[]>(LS_PRODUCTOS_KEY, []),
      ...productos,
    ]);

    return { negocio, modulos: enforcedModules, servicios, profesionales, productos };
  }

  const supabase = getSupabaseClient();
  // Asegurar slug único
  let finalSlug = baseSlug;
  const { data: existingSlug } = await supabase
    .from('negocios')
    .select('id')
    .ilike('slug', finalSlug)
    .limit(1);

  if (existingSlug && existingSlug.length > 0) {
    finalSlug = `${baseSlug}-${Math.floor(100 + Math.random() * 899)}`;
  }

  const { data: createdNegocio, error: negErr } = await supabase
    .from('negocios')
    .insert({
      owner_id: ownerId,
      nombre: draft.nombre.trim(),
      slug: finalSlug,
      rubro: draft.rubro,
      logo: draft.logo.trim() || preset.logoDefault,
      color: draft.color || preset.colorDefault,
      direccion: draft.direccion.trim(),
      horario: draft.horario.trim(),
      whatsapp: normalizedWa,
      plan: draft.plan,
    })
    .select('*')
    .single();

  if (negErr || !createdNegocio) {
    throw new Error(negErr?.message || 'No se pudo crear tu negocio en Supabase.');
  }

  const neg = createdNegocio as Negocio;

  const moduloRows = MODULO_ORDER.map((m) => ({
    negocio_id: neg.id,
    modulo: m,
    activo: enforcedModules[m],
  }));

  const serviceRows = draft.servicios.map((s, idx) => ({
    negocio_id: neg.id,
    nombre: s.nombre.trim(),
    duracion: s.duracion.trim() || '30 min',
    duracion_min: Number.parseInt(s.duracion, 10) || 30,
    precio: Number(s.precio) || 0,
    descripcion: s.descripcion.trim(),
    activo: true,
    orden: idx,
  }));

  const profSource =
    draft.profesionales.length > 0
      ? draft.profesionales
      : preset.profesionalesEjemplo.slice(0, draft.plan === 'full' ? 2 : 1);

  const profRows = profSource.map((p) => ({
    negocio_id: neg.id,
    nombre: p.nombre.trim(),
    especialidad: p.especialidad.trim(),
    activo: true,
  }));

  const prodRows = preset.productosEjemplo.map((pr) => ({
    negocio_id: neg.id,
    nombre: pr.nombre,
    precio: pr.precio,
    descripcion: pr.descripcion,
    stock: pr.stock,
    activo: true,
  }));

  await Promise.all([
    supabase.from('negocios_modulos').upsert(moduloRows, {
      onConflict: 'negocio_id,modulo',
    }),
    serviceRows.length > 0
      ? supabase.from('servicios').insert(serviceRows)
      : Promise.resolve(),
    profRows.length > 0
      ? supabase.from('profesionales').insert(profRows)
      : Promise.resolve(),
    prodRows.length > 0
      ? supabase.from('productos').insert(prodRows)
      : Promise.resolve(),
  ]);

  return hydrateBundleFromSupabase(neg);
}

export async function updateNegocioModulosAndPlan(params: {
  negocioId: string;
  plan: PlanId;
  modulos: Record<ModuloId, boolean>;
}): Promise<{ plan: PlanId; modulos: Record<ModuloId, boolean> }> {
  const enforced = buildModulesForPlanAndSelection(params.plan, params.modulos);

  if (!isSupabaseConfigured) {
    const negocios = readJson<Negocio[]>(LS_NEGOCIOS_KEY, []);
    writeJson(
      LS_NEGOCIOS_KEY,
      negocios.map((n) =>
        n.id === params.negocioId ? { ...n, plan: params.plan } : n
      )
    );
    const allMods = readJson<Record<string, Record<ModuloId, boolean>>>(
      LS_MODULOS_KEY,
      {}
    );
    allMods[params.negocioId] = enforced;
    writeJson(LS_MODULOS_KEY, allMods);
    return { plan: params.plan, modulos: enforced };
  }

  const supabase = getSupabaseClient();
  const { error: planErr } = await supabase
    .from('negocios')
    .update({ plan: params.plan, updated_at: new Date().toISOString() })
    .eq('id', params.negocioId);

  if (planErr) {
    throw new Error('No se pudo actualizar el plan del negocio.');
  }

  const rows = MODULO_ORDER.map((m) => ({
    negocio_id: params.negocioId,
    modulo: m,
    activo: enforced[m],
    updated_at: new Date().toISOString(),
  }));

  const { error: modErr } = await supabase
    .from('negocios_modulos')
    .upsert(rows, { onConflict: 'negocio_id,modulo' });

  if (modErr) {
    throw new Error('No se pudieron actualizar los módulos activos.');
  }

  return { plan: params.plan, modulos: enforced };
}

export async function updateNegocioProfile(params: {
  negocioId: string;
  nombre: string;
  logo: string;
  color: string;
  direccion: string;
  horario: string;
  whatsapp: string;
  yape_numero?: string;
  yape_nombre?: string;
  banco_info?: string;
  qr_pago_url?: string;
  hora_inicio?: string;
  hora_fin?: string;
  dias_atencion?: string[];
}): Promise<Negocio | null> {
  const cleanWa = params.whatsapp.replace(/\D/g, '') || '51964112233';
  const normalizedWa = cleanWa.startsWith('51') ? cleanWa : `51${cleanWa}`;

  if (!isSupabaseConfigured) {
    const negocios = readJson<Negocio[]>(LS_NEGOCIOS_KEY, []);
    let updated: Negocio | null = null;
    const next = negocios.map((n) => {
      if (n.id === params.negocioId) {
        updated = {
          ...n,
          nombre: params.nombre.trim() || n.nombre,
          logo: params.logo.trim() || n.logo,
          color: params.color || n.color,
          direccion: params.direccion.trim(),
          horario: params.horario.trim(),
          whatsapp: normalizedWa,
          yape_numero: params.yape_numero?.trim() || n.yape_numero,
          yape_nombre: params.yape_nombre?.trim() || n.yape_nombre,
          banco_info: params.banco_info?.trim() || n.banco_info,
          qr_pago_url: params.qr_pago_url?.trim() || n.qr_pago_url,
          hora_inicio: params.hora_inicio || n.hora_inicio || '09:00',
          hora_fin: params.hora_fin || n.hora_fin || '19:00',
          dias_atencion: params.dias_atencion || n.dias_atencion || ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
        };
        return updated;
      }
      return n;
    });
    writeJson(LS_NEGOCIOS_KEY, next);
    return updated;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('negocios')
    .update({
      nombre: params.nombre.trim(),
      logo: params.logo.trim(),
      color: params.color,
      direccion: params.direccion.trim(),
      horario: params.horario.trim(),
      whatsapp: normalizedWa,
      yape_numero: params.yape_numero?.trim(),
      yape_nombre: params.yape_nombre?.trim(),
      banco_info: params.banco_info?.trim(),
      qr_pago_url: params.qr_pago_url?.trim(),
      hora_inicio: params.hora_inicio,
      hora_fin: params.hora_fin,
      dias_atencion: params.dias_atencion,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.negocioId)
    .select('*')
    .single();

  if (error) throw new Error('No se pudo guardar el perfil del negocio.');
  return data as Negocio;
}

export async function saveNegocioServicios(
  negocioId: string,
  servicios: Omit<ServicioSaaS, 'negocio_id' | 'orden' | 'duracion_min'>[]
): Promise<ServicioSaaS[]> {
  const normalized: ServicioSaaS[] = servicios.map((s, idx) => ({
    id: s.id || generateId('svc'),
    negocio_id: negocioId,
    nombre: s.nombre.trim(),
    duracion: s.duracion.trim() || '30 min',
    duracion_min: Number.parseInt(s.duracion, 10) || 30,
    precio: Number(s.precio) || 0,
    descripcion: s.descripcion.trim(),
    activo: s.activo !== false,
    orden: idx,
  }));

  if (!isSupabaseConfigured) {
    const others = readJson<ServicioSaaS[]>(LS_SERVICIOS_KEY, []).filter(
      (s) => s.negocio_id !== negocioId
    );
    writeJson(LS_SERVICIOS_KEY, [...others, ...normalized]);
    return normalized;
  }

  const supabase = getSupabaseClient();
  await supabase.from('servicios').delete().eq('negocio_id', negocioId);
  if (normalized.length === 0) return [];
  const { data, error } = await supabase
    .from('servicios')
    .insert(
      normalized.map((s) => ({
        negocio_id: s.negocio_id,
        nombre: s.nombre,
        duracion: s.duracion,
        duracion_min: s.duracion_min,
        precio: s.precio,
        descripcion: s.descripcion,
        activo: s.activo,
        orden: s.orden,
      }))
    )
    .select('*');

  if (error) throw new Error('No se pudieron guardar los servicios.');
  return (data as ServicioSaaS[]) || normalized;
}

export async function saveNegocioProfesionales(
  negocioId: string,
  profesionales: Omit<ProfesionalSaaS, 'negocio_id'>[]
): Promise<ProfesionalSaaS[]> {
  const normalized: ProfesionalSaaS[] = profesionales.map((p) => ({
    id: p.id || generateId('prof'),
    negocio_id: negocioId,
    nombre: p.nombre.trim(),
    especialidad: p.especialidad.trim(),
    activo: p.activo !== false,
  }));

  if (!isSupabaseConfigured) {
    const others = readJson<ProfesionalSaaS[]>(LS_PROFS_KEY, []).filter(
      (p) => p.negocio_id !== negocioId
    );
    writeJson(LS_PROFS_KEY, [...others, ...normalized]);
    return normalized;
  }

  const supabase = getSupabaseClient();
  await supabase.from('profesionales').delete().eq('negocio_id', negocioId);
  if (normalized.length === 0) return [];
  const { data, error } = await supabase
    .from('profesionales')
    .insert(
      normalized.map((p) => ({
        negocio_id: p.negocio_id,
        nombre: p.nombre,
        especialidad: p.especialidad,
        activo: p.activo,
      }))
    )
    .select('*');

  if (error) throw new Error('No se pudo guardar el equipo profesional.');
  return (data as ProfesionalSaaS[]) || normalized;
}

export async function saveNegocioProductos(
  negocioId: string,
  productos: Omit<ProductoCatalogo, 'negocio_id'>[]
): Promise<ProductoCatalogo[]> {
  const normalized: ProductoCatalogo[] = productos.map((p) => ({
    id: p.id || generateId('prod'),
    negocio_id: negocioId,
    nombre: p.nombre.trim(),
    precio: Number(p.precio) || 0,
    descripcion: p.descripcion.trim(),
    stock: Number(p.stock) || 0,
    activo: p.activo !== false,
  }));

  if (!isSupabaseConfigured) {
    const others = readJson<ProductoCatalogo[]>(LS_PRODUCTOS_KEY, []).filter(
      (p) => p.negocio_id !== negocioId
    );
    writeJson(LS_PRODUCTOS_KEY, [...others, ...normalized]);
    return normalized;
  }

  const supabase = getSupabaseClient();
  await supabase.from('productos').delete().eq('negocio_id', negocioId);
  if (normalized.length === 0) return [];
  const { data, error } = await supabase
    .from('productos')
    .insert(
      normalized.map((p) => ({
        negocio_id: p.negocio_id,
        nombre: p.nombre,
        precio: p.precio,
        descripcion: p.descripcion,
        stock: p.stock,
        activo: p.activo,
      }))
    )
    .select('*');

  if (error) throw new Error('No se pudo guardar el catálogo de productos.');
  return (data as ProductoCatalogo[]) || normalized;
}

// ============================================================================
// CITAS, BLOQUEOS, MASCOTAS Y VALIDACIÓN DE DOBLE RESERVA
// ============================================================================
function extractLimaDateAndHour(iso: string): { fecha: string; hora: string } {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) {
    return { fecha: iso.slice(0, 10), hora: '09:00' };
  }
  const fecha = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(dt);
  const hour = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Lima',
    hour: '2-digit',
    hour12: false,
  }).format(dt);
  return { fecha, hora: `${hour.padStart(2, '0')}:00` };
}

export async function fetchNegocioOperationalData(negocioId: string): Promise<{
  citas: AppointmentRecord[];
  bloqueos: BlockedSlot[];
  mascotas: MascotaSaaS[];
}> {
  if (!isSupabaseConfigured) {
    const citas = readJson<AppointmentRecord[]>(LS_CITAS_KEY, []).filter(
      (c) => c.negocioId === negocioId
    );
    const bloqueos = readJson<
      (BlockedSlot & { negocioId: string })[]
    >(LS_BLOQUEOS_KEY, [])
      .filter((b) => b.negocioId === negocioId)
      .map(({ id, fecha, hora, motivo }) => ({ id, fecha, hora, motivo }));
    const mascotas = readJson<MascotaSaaS[]>(LS_MASCOTAS_KEY, []).filter(
      (m) => m.negocio_id === negocioId
    );
    return { citas, bloqueos, mascotas };
  }

  const supabase = getSupabaseClient();
  const [citasRes, blksRes, petsRes] = await Promise.all([
    supabase
      .from('citas')
      .select('*')
      .eq('negocio_id', negocioId)
      .order('inicio', { ascending: false }),
    supabase.from('bloqueos').select('*').eq('negocio_id', negocioId),
    supabase.from('mascotas').select('*').eq('negocio_id', negocioId),
  ]);

  const citas: AppointmentRecord[] = Array.isArray(citasRes.data)
    ? citasRes.data.map((row: Record<string, unknown>) => {
        const { fecha, hora } = extractLimaDateAndHour(String(row.inicio || ''));
        const extraObj = (row.extra as Record<string, string> | null) || {};
        const extraStr = extraObj.nombreMascota
          ? `${extraObj.nombreMascota} (${extraObj.tipoMascota || 'Mascota'})`
          : extraObj.motivo || extraObj.preferencia || undefined;
        return {
          id: String(row.id),
          negocioId: String(row.negocio_id),
          fecha,
          hora,
          cliente: String(row.cliente || ''),
          telefono: String(row.telefono || ''),
          ciudad: String(row.ciudad || ''),
          servicio: String(row.servicio || ''),
          precio: Number(row.precio || 0),
          estado: (row.estado as EstadoCitaAdmin) || 'pendiente',
          pagoEstado: row.estado === 'atendido' ? 'pagado' : 'sin_pago',
          montoPagado: row.estado === 'atendido' ? Number(row.precio || 0) : 0,
          notas: String(row.notas || '') || undefined,
          extra: extraStr,
          createdAt: String(row.created_at || new Date().toISOString()),
        };
      })
    : [];

  const bloqueos: BlockedSlot[] = Array.isArray(blksRes.data)
    ? blksRes.data.map((b: Record<string, unknown>) => {
        const { fecha, hora } = extractLimaDateAndHour(String(b.inicio || ''));
        return {
          id: String(b.id),
          fecha,
          hora,
          motivo: String(b.motivo || 'Bloqueado'),
        };
      })
    : [];

  const mascotas: MascotaSaaS[] = Array.isArray(petsRes.data)
    ? (petsRes.data as MascotaSaaS[])
    : [];

  return { citas, bloqueos, mascotas };
}

export async function fetchSaaSHorasOcupadas(
  negocioId: string,
  fecha: string
): Promise<{ horas: string[]; isPreviewMode: boolean }> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new OfflineBookingError();
  }

  if (!isSupabaseConfigured) {
    const citas = readJson<AppointmentRecord[]>(LS_CITAS_KEY, []).filter(
      (c) =>
        c.negocioId === negocioId &&
        c.fecha === fecha &&
        c.estado !== 'cancelada'
    );
    const bloqueos = readJson<
      (BlockedSlot & { negocioId: string })[]
    >(LS_BLOQUEOS_KEY, []).filter(
      (b) => b.negocioId === negocioId && b.fecha === fecha
    );
    const set = new Set<string>([
      ...citas.map((c) => c.hora),
      ...bloqueos.map((b) => b.hora),
    ]);
    return { horas: Array.from(set), isPreviewMode: true };
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('horas_ocupadas', {
    p_negocio_id: negocioId,
    p_fecha: fecha,
  });

  if (error) {
    throw new Error('No se pudo consultar la disponibilidad del negocio.');
  }

  const horas = (Array.isArray(data) ? data : [])
    .map((entry: { hora?: string } | string) =>
      typeof entry === 'string' ? entry : entry.hora || ''
    )
    .filter(Boolean);

  return { horas: Array.from(new Set(horas)), isPreviewMode: false };
}

export async function reservarCitaSaaS(payload: {
  negocioId: string;
  rubro: string;
  cliente: string;
  telefono: string;
  ciudad: string;
  servicio: string;
  precio: number;
  fecha: string;
  hora: string;
  profesional?: string;
  extra?: Record<string, string>;
}): Promise<{ id: string; isPreviewMode: boolean }> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new OfflineBookingError();
  }

  const inicio = `${payload.fecha}T${payload.hora}:00-05:00`;

  if (!isSupabaseConfigured) {
    const allCitas = readJson<AppointmentRecord[]>(LS_CITAS_KEY, []);
    const allBloqueos = readJson<
      (BlockedSlot & { negocioId: string })[]
    >(LS_BLOQUEOS_KEY, []);

    const isTaken = allCitas.some(
      (c) =>
        c.negocioId === payload.negocioId &&
        c.fecha === payload.fecha &&
        c.hora === payload.hora &&
        c.estado !== 'cancelada'
    );
    const isBlocked = allBloqueos.some(
      (b) =>
        b.negocioId === payload.negocioId &&
        b.fecha === payload.fecha &&
        b.hora === payload.hora
    );

    if (isTaken || isBlocked) {
      throw new SlotTakenError();
    }

    const extraObj = payload.extra || {};
    const extraDisplay = extraObj.nombreMascota
      ? `${extraObj.nombreMascota} (${extraObj.tipoMascota || 'Perro'})`
      : extraObj.motivo || extraObj.preferencia || undefined;

    const created: AppointmentRecord = {
      id: generateId('cita'),
      negocioId: payload.negocioId,
      fecha: payload.fecha,
      hora: payload.hora,
      cliente: payload.cliente.trim(),
      telefono: payload.telefono.trim(),
      ciudad: payload.ciudad.trim() || 'Perú',
      servicio: payload.servicio,
      precio: payload.precio,
      estado: 'pendiente',
      pagoEstado: 'sin_pago',
      montoPagado: 0,
      notas: payload.profesional ? `Profesional: ${payload.profesional}` : undefined,
      extra: extraDisplay,
      createdAt: new Date().toISOString(),
    };

    writeJson(LS_CITAS_KEY, [created, ...allCitas]);

    if (payload.rubro === 'veterinaria' && extraObj.nombreMascota) {
      const pets = readJson<MascotaSaaS[]>(LS_MASCOTAS_KEY, []);
      writeJson(LS_MASCOTAS_KEY, [
        {
          id: generateId('pet'),
          negocio_id: payload.negocioId,
          cliente_telefono: payload.telefono.trim(),
          cliente_nombre: payload.cliente.trim(),
          nombre: extraObj.nombreMascota.trim(),
          especie: extraObj.tipoMascota || 'Perro',
        },
        ...pets,
      ]);
    }

    return { id: created.id, isPreviewMode: true };
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('reservar_cita', {
    p_negocio_id: payload.negocioId,
    p_cliente: payload.cliente.trim(),
    p_telefono: payload.telefono.trim(),
    p_ciudad: payload.ciudad.trim(),
    p_servicio: payload.servicio,
    p_precio: payload.precio,
    p_inicio: inicio,
    p_profesional: payload.profesional || '',
    p_extra: payload.extra || {},
  });

  if (error) {
    const msg = (error.message || '').toLowerCase();
    if (
      error.code === '23505' ||
      msg.includes('ocupada') ||
      msg.includes('bloqueada') ||
      msg.includes('duplicate')
    ) {
      throw new SlotTakenError();
    }
    throw new Error('No se pudo registrar la reserva. Intenta nuevamente.');
  }

  return { id: String(data || generateId('cita')), isPreviewMode: false };
}

export async function updateSaaSCitaEstado(
  citaId: string,
  estado: EstadoCitaAdmin
): Promise<void> {
  if (!isSupabaseConfigured) {
    const citas = readJson<AppointmentRecord[]>(LS_CITAS_KEY, []);
    writeJson(
      LS_CITAS_KEY,
      citas.map((c) => (c.id === citaId ? { ...c, estado } : c))
    );
    return;
  }
  const supabase = getSupabaseClient();
  await supabase.from('citas').update({ estado }).eq('id', citaId);
}

export async function saveSaaSManualCita(
  cita: AppointmentRecord
): Promise<AppointmentRecord> {
  if (!isSupabaseConfigured) {
    const citas = readJson<AppointmentRecord[]>(LS_CITAS_KEY, []);
    const exists = citas.some((c) => c.id === cita.id);
    const next = exists
      ? citas.map((c) => (c.id === cita.id ? cita : c))
      : [cita, ...citas];
    writeJson(LS_CITAS_KEY, next);
    return cita;
  }

  const supabase = getSupabaseClient();
  const inicio = `${cita.fecha}T${cita.hora}:00-05:00`;
  const { data, error } = await supabase
    .from('citas')
    .insert({
      negocio_id: cita.negocioId,
      cliente: cita.cliente,
      telefono: cita.telefono,
      ciudad: cita.ciudad || '',
      servicio: cita.servicio,
      precio: cita.precio,
      inicio,
      estado: cita.estado,
      notas: cita.notas || '',
    })
    .select('*')
    .single();

  if (error || !data) return cita;
  return { ...cita, id: String(data.id) };
}

export async function toggleSaaSBloqueo(params: {
  negocioId: string;
  fecha: string;
  hora: string;
  motivo?: string;
}): Promise<BlockedSlot[]> {
  if (!isSupabaseConfigured) {
    const all = readJson<(BlockedSlot & { negocioId: string })[]>(
      LS_BLOQUEOS_KEY,
      []
    );
    const exists = all.some(
      (b) =>
        b.negocioId === params.negocioId &&
        b.fecha === params.fecha &&
        b.hora === params.hora
    );
    const next = exists
      ? all.filter(
          (b) =>
            !(
              b.negocioId === params.negocioId &&
              b.fecha === params.fecha &&
              b.hora === params.hora
            )
        )
      : [
          ...all,
          {
            id: generateId('blk'),
            negocioId: params.negocioId,
            fecha: params.fecha,
            hora: params.hora,
            motivo: params.motivo || 'Bloqueado',
          },
        ];
    writeJson(LS_BLOQUEOS_KEY, next);
    return next
      .filter((b) => b.negocioId === params.negocioId)
      .map(({ id, fecha, hora, motivo }) => ({ id, fecha, hora, motivo }));
  }

  const supabase = getSupabaseClient();
  const inicio = `${params.fecha}T${params.hora}:00-05:00`;
  const { data: existing } = await supabase
    .from('bloqueos')
    .select('id')
    .eq('negocio_id', params.negocioId)
    .eq('inicio', inicio)
    .limit(1);

  if (existing && existing.length > 0) {
    await supabase.from('bloqueos').delete().eq('id', existing[0].id);
  } else {
    await supabase.from('bloqueos').insert({
      negocio_id: params.negocioId,
      inicio,
      motivo: params.motivo || 'Bloqueado',
    });
  }

  const res = await fetchNegocioOperationalData(params.negocioId);
  return res.bloqueos;
}
