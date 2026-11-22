import type { RubroConfig } from '../../config/rubros';
import type { AppointmentRecord, EstadoCitaAdmin } from '../../types/app';

export const ADMIN_STATUS_META: Record<
  EstadoCitaAdmin,
  { label: string; bg: string; text: string; border: string }
> = {
  pendiente: {
    label: 'Pendiente',
    bg: '#FEF3C7',
    text: '#92400E',
    border: '#FDE68A',
  },
  confirmada: {
    label: 'Confirmada',
    bg: '#DCFCE7',
    text: '#166534',
    border: '#BBF7D0',
  },
  reprogramar: {
    label: 'Por reprogramar',
    bg: '#FFE4E6',
    text: '#9F1239',
    border: '#FECDD3',
  },
  atendido: {
    label: 'Atendido',
    bg: '#E0F2FE',
    text: '#075985',
    border: '#BAE6FD',
  },
  no_asistio: {
    label: 'No asistió',
    bg: '#F1F5F9',
    text: '#475569',
    border: '#CBD5E1',
  },
  cancelada: {
    label: 'Cancelada',
    bg: '#FEE2E2',
    text: '#991B1B',
    border: '#FECACA',
  },
};

export function getLimaDateOffsetStr(offsetDays = 0): string {
  const now = new Date();
  const limaNow = new Date(
    now.toLocaleString('en-US', { timeZone: 'America/Lima' })
  );
  limaNow.setDate(limaNow.getDate() + offsetDays);
  const y = limaNow.getFullYear();
  const m = String(limaNow.getMonth() + 1).padStart(2, '0');
  const d = String(limaNow.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function buildInitialCitasForRubro(
  rubro: RubroConfig
): AppointmentRecord[] {
  const today = getLimaDateOffsetStr(0);
  return rubro.citasEjemplo.map((c) => {
    const mappedEstado: EstadoCitaAdmin =
      c.estado === 'en_atencion' ? 'confirmada' : c.estado;
    return {
      id: c.id,
      negocioId: rubro.negocio_id,
      fecha: today,
      hora: c.hora,
      cliente: c.cliente,
      telefono: c.telefono,
      ciudad: 'Lima',
      servicio: c.servicio,
      precio: c.precio,
      estado: mappedEstado,
      pagoEstado: c.pagado ? 'pagado' : 'sin_pago',
      montoPagado: c.pagado ? c.precio : 0,
      metodoPago: c.metodoPago,
      extra:
        c.mascota && c.especieMascota
          ? `${c.mascota} (${c.especieMascota})`
          : c.motivo,
      notas: c.notaMascota,
      esEjemplo: false,
      createdAt: new Date().toISOString(),
    };
  });
}

const SAMPLE_CLIENTS = [
  { nombre: 'Lucía Fernández', telefono: '964201112', ciudad: 'Lima' },
  { nombre: 'Mateo Quispe', telefono: '954302223', ciudad: 'Arequipa' },
  { nombre: 'Sofía Huamán', telefono: '971403334', ciudad: 'Trujillo' },
  { nombre: 'Rodrigo Paredes', telefono: '964504445', ciudad: 'Cusco' },
  { nombre: 'Camila Rojas', telefono: '954605556', ciudad: 'Lima' },
  { nombre: 'Diego Torres', telefono: '971706667', ciudad: 'Piura' },
  { nombre: 'Valeria Soto', telefono: '964807778', ciudad: 'Chiclayo' },
  { nombre: 'Alejandro Chávez', telefono: '954908889', ciudad: 'Lima' },
  { nombre: 'Jimena Morales', telefono: '971019990', ciudad: 'Arequipa' },
  { nombre: 'Sebastián Salazar', telefono: '964120001', ciudad: 'Bogotá' },
  { nombre: 'Natalia Vega', telefono: '954231112', ciudad: 'Trujillo' },
  { nombre: 'Gabriel Mendoza', telefono: '971342223', ciudad: 'Santiago' },
];

export function generateDemoSampleCitas(
  rubro: RubroConfig
): AppointmentRecord[] {
  const hours = [
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00',
  ];
  const petNames = ['Toby', 'Luna', 'Rocky', 'Simba', 'Kira', 'Coco'];
  const motivos = [
    'Control general',
    'Sensibilidad dental',
    'Limpieza semestral',
    'Evaluación preventiva',
  ];
  const metodos: ('Efectivo' | 'Yape' | 'Plin' | 'Tarjeta')[] = [
    'Yape',
    'Plin',
    'Efectivo',
    'Tarjeta',
  ];

  const generated: AppointmentRecord[] = [];

  for (let i = 0; i < 20; i += 1) {
    const client = SAMPLE_CLIENTS[i % SAMPLE_CLIENTS.length];
    const svc = rubro.servicios[i % rubro.servicios.length];
    const dayOffset =
      i < 4
        ? 0 // hoy
        : i < 7
          ? 1 // mañana
          : i < 10
            ? -8 // este mes
            : i < 13
              ? -35 // hace 1 mes
              : i < 16
                ? -66 // hace 2 meses
                : i < 18
                  ? -97 // hace 3 meses
                  : -128; // hace 4 meses

    const fecha = getLimaDateOffsetStr(dayOffset);
    const hora = hours[i % hours.length];

    let estado: EstadoCitaAdmin = 'confirmada';
    if (dayOffset === 0) {
      estado =
        i === 0
          ? 'confirmada'
          : i === 1
            ? 'pendiente'
            : i === 2
              ? 'reprogramar'
              : 'atendido';
    } else if (dayOffset > 0) {
      estado = i % 2 === 0 ? 'confirmada' : 'pendiente';
    } else {
      estado =
        i === 9 || i === 12 || i === 15 || i === 18
          ? 'no_asistio'
          : i === 14
            ? 'cancelada'
            : 'atendido';
    }

    const pagado = estado === 'atendido';
    const adelanto = !pagado && i % 5 === 0;

    generated.push({
      id: `demo-seed-${rubro.id}-${i + 1}`,
      negocioId: rubro.negocio_id,
      fecha,
      hora,
      cliente: client.nombre,
      telefono: client.telefono,
      ciudad: client.ciudad,
      servicio: svc.nombre,
      precio: svc.precio,
      estado,
      pagoEstado: pagado ? 'pagado' : adelanto ? 'adelanto' : 'sin_pago',
      montoPagado: pagado ? svc.precio : adelanto ? Math.round(svc.precio / 2) : 0,
      metodoPago: pagado || adelanto ? metodos[i % metodos.length] : undefined,
      extra:
        rubro.id === 'veterinaria'
          ? `${petNames[i % petNames.length]} (Mascota)`
          : rubro.id === 'consultorio'
            ? motivos[i % motivos.length]
            : undefined,
      notas:
        estado === 'reprogramar'
          ? 'Cliente respondió 2 por WhatsApp solicitando nuevo horario.'
          : undefined,
      esEjemplo: true,
      createdAt: new Date().toISOString(),
    });
  }

  return generated;
}
