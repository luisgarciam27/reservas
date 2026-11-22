import { useCallback, useEffect, useState } from 'react';
import type { RubroKey } from '../config/rubros';
import type { UserSession } from '../types/app';

const SESSION_KEY = 'maria_auth_session_v2';
const REGISTERED_CLIENTS_KEY = 'maria_registered_clients_v2';

export interface RegisteredClientEntry {
  telefono: string;
  nombre: string;
  ciudad: string;
  createdAt: string;
}

const DEFAULT_GUEST_SESSION: UserSession = {
  role: 'guest',
  telefono: '',
  nombre: 'Visitante',
  ciudad: 'Lima',
  createdAt: new Date().toISOString(),
};

function loadSavedRegistry(): Record<string, RegisteredClientEntry> {
  try {
    const raw = localStorage.getItem(REGISTERED_CLIENTS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, RegisteredClientEntry>;
  } catch {
    return {};
  }
}

function saveRegistry(reg: Record<string, RegisteredClientEntry>) {
  try {
    localStorage.setItem(REGISTERED_CLIENTS_KEY, JSON.stringify(reg));
  } catch {
    // Ignorar error de almacenamiento
  }
}

export function normalizePeruPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('51') && digits.length === 11) {
    return digits.slice(2);
  }
  return digits.slice(0, 9);
}

export function isValidPeruPhone(phone: string): boolean {
  return /^9\d{8}$/.test(normalizePeruPhone(phone));
}

export const OWNER_DEMO_PHONES = ['964112233', '999000111'];

export function useAuthSession() {
  const [session, setSession] = useState<UserSession>(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as UserSession;
        if (parsed && parsed.role) return parsed;
      }
    } catch {
      // Ignorar
    }
    return DEFAULT_GUEST_SESSION;
  });

  useEffect(() => {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      if (session.role === 'client' && session.telefono) {
        localStorage.setItem('maria_client_phone', session.telefono);
        localStorage.setItem('maria_client_name', session.nombre);
        localStorage.setItem('maria_client_city', session.ciudad);
      }
    } catch {
      // Ignorar
    }
  }, [session]);

  const findRegisteredClient = useCallback(
    (telefono: string): RegisteredClientEntry | null => {
      const clean = normalizePeruPhone(telefono);
      const reg = loadSavedRegistry();
      return reg[clean] ?? null;
    },
    []
  );

  const registerClient = useCallback(
    (params: { telefono: string; nombre: string; ciudad: string }): UserSession => {
      const clean = normalizePeruPhone(params.telefono);
      const entry: RegisteredClientEntry = {
        telefono: clean,
        nombre: params.nombre.trim(),
        ciudad: params.ciudad.trim() || 'Lima',
        createdAt: new Date().toISOString(),
      };
      const reg = loadSavedRegistry();
      reg[clean] = entry;
      saveRegistry(reg);

      const newSession: UserSession = {
        role: 'client',
        telefono: clean,
        nombre: entry.nombre,
        ciudad: entry.ciudad,
        createdAt: entry.createdAt,
      };
      setSession(newSession);
      return newSession;
    },
    []
  );

  const loginClientByPhone = useCallback(
    (telefono: string): { found: boolean; session?: UserSession } => {
      const clean = normalizePeruPhone(telefono);
      const existing = findRegisteredClient(clean);
      if (!existing) {
        return { found: false };
      }
      const newSession: UserSession = {
        role: 'client',
        telefono: existing.telefono,
        nombre: existing.nombre,
        ciudad: existing.ciudad,
        createdAt: existing.createdAt,
      };
      setSession(newSession);
      return { found: true, session: newSession };
    },
    [findRegisteredClient]
  );

  const loginAsOwner = useCallback(
    (params: { telefono: string; nombre?: string; rubroId?: RubroKey }): UserSession => {
      const clean = normalizePeruPhone(params.telefono) || '964112233';
      const newSession: UserSession = {
        role: 'owner',
        telefono: clean,
        nombre: params.nombre?.trim() || 'Administrador',
        ciudad: 'Lima',
        rubroId: params.rubroId,
        createdAt: new Date().toISOString(),
      };
      setSession(newSession);
      return newSession;
    },
    []
  );

  const continueAsGuest = useCallback(() => {
    setSession({
      ...DEFAULT_GUEST_SESSION,
      createdAt: new Date().toISOString(),
    });
  }, []);

  const logout = useCallback(() => {
    setSession({
      ...DEFAULT_GUEST_SESSION,
      createdAt: new Date().toISOString(),
    });
  }, []);

  return {
    session,
    registerClient,
    loginClientByPhone,
    findRegisteredClient,
    loginAsOwner,
    continueAsGuest,
    logout,
  };
}
