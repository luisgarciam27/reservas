import React, { useMemo } from 'react';
import { Calendar, MessageSquare, Phone, User } from 'lucide-react';
import type { RubroConfig, CitaEjemplo } from '../config/rubros';
import { WhatsAppSvgIcon } from './RubroIcons';

interface ClientsTabProps {
  rubro: RubroConfig;
  citas: CitaEjemplo[];
}

export interface ClientRecord {
  nombre: string;
  telefono: string;
  totalCitas: number;
  ultimoServicio: string;
  ultimaHora: string;
  mascota?: string;
}

export const ClientsTab: React.FC<ClientsTabProps> = ({ rubro, citas }) => {
  const clientsList = useMemo(() => {
    const map = new Map<string, ClientRecord>();

    for (const c of citas) {
      const key = c.telefono.trim();
      if (!map.has(key)) {
        map.set(key, {
          nombre: c.cliente,
          telefono: c.telefono,
          totalCitas: 1,
          ultimoServicio: c.servicio,
          ultimaHora: c.hora,
          mascota: c.mascota,
        });
      } else {
        const existing = map.get(key)!;
        existing.totalCitas += 1;
        existing.ultimoServicio = c.servicio;
        existing.ultimaHora = c.hora;
        if (c.mascota) existing.mascota = c.mascota;
      }
    }

    return Array.from(map.values());
  }, [citas]);

  const handleWhatsAppChat = (telefono: string, nombre: string) => {
    const cleanPhone = telefono.replace(/\D/g, '');
    const msg = `Hola ${nombre}, te escribimos de ${rubro.nombre} para saludarte y coordinar tu próxima atención.`;
    window.open(`https://wa.me/51${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="px-1">
        <h2
          className={`text-xl font-bold text-slate-900 ${
            rubro.tipografia.esEditorialSerif ? 'font-display-serif text-2xl' : ''
          }`}
        >
          Directorio de Clientes ({clientsList.length})
        </h2>
        <p className="mt-0.5 text-xs text-slate-600">
          Historial de clientes frecuentes, pacientes y recordatorios directos por WhatsApp.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {clientsList.map((client) => (
          <div
            key={client.telefono}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col justify-between gap-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold"
                  style={{
                    backgroundColor: rubro.colores.superficieDestacada,
                    color: rubro.colores.primario,
                  }}
                >
                  <User className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {client.nombre}
                  </h3>
                  <p className="text-xs text-slate-500 tabular-nums inline-flex items-center gap-1">
                    <Phone className="h-3 w-3" /> +51 {client.telefono}
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 tabular-nums">
                {client.totalCitas} {client.totalCitas === 1 ? 'cita' : 'citas'}
              </span>
            </div>

            {client.mascota && (
              <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700">
                🐾 Mascota: <span className="font-bold">{client.mascota}</span>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-xs text-slate-500 truncate max-w-[180px]">
                Último: {client.ultimoServicio}
              </span>

              <button
                type="button"
                onClick={() => handleWhatsAppChat(client.telefono, client.nombre)}
                className="tap-feedback inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#25D366] px-3 text-xs font-semibold text-white shadow-xs hover:bg-[#20ba5a]"
              >
                <WhatsAppSvgIcon className="h-4 w-4" />
                Chat WhatsApp
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
