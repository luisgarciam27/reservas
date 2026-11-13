/**
 * ============================================================================
 * CONFIGURACIÓN CENTRAL DE GAORSYSTEM PERÚ
 * ============================================================================
 * Edita este archivo para personalizar credenciales de Supabase, rubros,
 * colores, servicios, precios en Soles (S/), horarios y números de WhatsApp.
 */

import heroConsultorioImg from '../assets/images/hero_consultorio_dental_1794591301986.jpg';
import heroSalonImg from '../assets/images/hero_salon_spa_1794591301304.jpg';
import heroVeterinariaImg from '../assets/images/hero_veterinaria_1794591302304.jpg';

// ----------------------------------------------------------------------------
// CREDENCIALES PÚBLICAS DE SUPABASE (NUNCA uses la service_role key aquí)
// Reemplaza estos valores con los de tu proyecto en Supabase o usa variables
// VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Vercel.
// ----------------------------------------------------------------------------
export const SUPABASE_URL: string =
  import.meta.env.VITE_SUPABASE_URL || 'https://tu-proyecto.supabase.co';

export const SUPABASE_ANON_KEY: string =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'tu-anon-key-publica-aqui';

export type RubroKey = 'consultorio' | 'salon' | 'veterinaria';

export type EstadoCita =
  | 'pendiente'
  | 'confirmada'
  | 'reprogramar'
  | 'en_atencion'
  | 'atendido';

export interface ServicioItem {
  id: string;
  nombre: string;
  duracion: string;
  precio: number;
  descripcion: string;
  incluye: string[];
  recomendacion: string;
}

export interface CampoExtra {
  name: string;
  label: string;
  placeholder?: string;
  required: boolean;
  type: 'text' | 'select';
  options?: string[];
}

export interface CitaEjemplo {
  id: string;
  hora: string;
  cliente: string;
  telefono: string;
  servicio: string;
  precio: number;
  estado: EstadoCita;
  // Campos específicos por rubro para la Vista del Dueño
  motivo?: string;
  pagado?: boolean;
  metodoPago?: 'Yape' | 'Efectivo' | 'Tarjeta';
  mascota?: string;
  especieMascota?: string;
  notaMascota?: string;
}

export interface RubroConfig {
  id: RubroKey;
  rubroLabel: string;
  resumenSelector: string;
  nombre: string;
  ciudad: string;
  direccion: string;
  eslogan: string;
  logoEmoji: string;
  heroImage: string;
  heroAlt: string;
  negocio_id: string;
  whatsapp: string;
  horario: {
    diasLabel: string;
    horaInicio: number;
    horaFin: number;
  };
  landing: {
    titularHero: string;
    subtituloHero: string;
    beneficios: { titulo: string; detalle: string }[];
    ctaPrincipal: string;
  };
  colores: {
    primario: string;
    primarioHover: string;
    primarioTexto: string;
    acento: string;
    fondoSuave: string;
    bordeSuave: string;
    superficieDestacada: string;
    chipActivoBg: string;
    chipActivoText: string;
    themeColorMeta: string;
  };
  tipografia: {
    esEditorialSerif: boolean;
  };
  servicios: ServicioItem[];
  camposExtra: CampoExtra[];
  recordatorio: {
    ejemploCliente: string;
    ejemploServicio: string;
    ejemploFechaHora: string;
    ejemploMascota?: string;
    tonoConfirmacion: string;
    tonoReprogramar: string;
  };
  roiDefaults: {
    citasSemana: number;
    porcentajeNoShow: number;
    precioPromedio: number;
  };
  citasEjemplo: CitaEjemplo[];
}

/**
 * ============================================================================
 * OBJETO RUBROS: Toda la configuración de los negocios de demostración
 * ============================================================================
 */
export const RUBROS: Record<RubroKey, RubroConfig> = {
  consultorio: {
    id: 'consultorio',
    rubroLabel: 'Consultorio / Dentista',
    resumenSelector: 'Odontología, medicina y clínicas',
    nombre: 'Clínica Dental Sonrisa Andina',
    ciudad: 'Huancayo',
    direccion: 'Av. Giráldez 428, Huancayo',
    eslogan: 'Atención odontológica puntual y sin esperas',
    logoEmoji: '🦷',
    heroImage: heroConsultorioImg,
    heroAlt: 'Consultorio odontológico moderno y luminoso en Huancayo',
    negocio_id: '11111111-1111-4111-8111-111111111101',
    whatsapp: '51964112233',
    horario: {
      diasLabel: 'Lunes a Sábado · 9:00 a 19:00',
      horaInicio: 9,
      horaFin: 19,
    },
    landing: {
      titularHero: 'Cuida tu salud dental con atención puntual y sin filas',
      subtituloHero:
        'Revisa nuestros tratamientos, conoce las tarifas transparentes en Soles y agenda tu turno en menos de un minuto con confirmación por WhatsApp.',
      beneficios: [
        {
          titulo: 'Especialistas colegiados',
          detalle: 'Odontólogos con experiencia en atención familiar y estética.',
        },
        {
          titulo: 'Bioseguridad garantizada',
          detalle: 'Instrumental esterilizado y equipamiento clínico moderno.',
        },
        {
          titulo: 'Cero tiempo perdido',
          detalle: 'Tu turno reservado se respeta y te avisamos por WhatsApp.',
        },
      ],
      ctaPrincipal: 'Reservar cita',
    },
    colores: {
      primario: '#0369A1', // Azul clínico serio
      primarioHover: '#075985',
      primarioTexto: '#FFFFFF',
      acento: '#0EA5E9',
      fondoSuave: '#F0F9FF',
      bordeSuave: '#BAE6FD',
      superficieDestacada: '#E0F2FE',
      chipActivoBg: '#0369A1',
      chipActivoText: '#FFFFFF',
      themeColorMeta: '#0369A1',
    },
    tipografia: {
      esEditorialSerif: false,
    },
    servicios: [
      {
        id: 'consulta-diagnostico',
        nombre: 'Evaluación y Diagnóstico',
        duracion: '30 min',
        precio: 50,
        descripcion:
          'Revisión clínica completa para detectar caries, sensibilidad o desgaste a tiempo.',
        incluye: [
          'Odontograma completo pieza por pieza',
          'Revisión de encías y mordida',
          'Plan de tratamiento con presupuesto claro',
        ],
        recomendacion: 'Ideal como primera visita o chequeo preventivo anual.',
      },
      {
        id: 'profilaxis-dental',
        nombre: 'Limpieza Dental (Profilaxis)',
        duracion: '45 min',
        precio: 90,
        descripcion:
          'Limpieza profunda indolora que elimina sarro y manchas superficiales.',
        incluye: [
          'Destartraje con equipo de ultrasonido',
          'Pulido dental con pasta profiláctica',
          'Aplicación tópica de flúor protector',
        ],
        recomendacion: 'Recomendada cada 6 meses para prevenir gingivitis.',
      },
      {
        id: 'curacion-resina',
        nombre: 'Curación Estética con Resina',
        duracion: '45 min',
        precio: 110,
        descripcion:
          'Restauración del diente afectado con resina fotocurable del mismo tono natural.',
        incluye: [
          'Anestesia local confortable si es necesario',
          'Remoción cuidadosa de caries',
          'Sellado estético y ajuste de mordida',
        ],
        recomendacion: 'Indicado ante dolor leve, caries o fractura menor.',
      },
      {
        id: 'blanqueamiento',
        nombre: 'Blanqueamiento LED',
        duracion: '60 min',
        precio: 240,
        descripcion:
          'Aclaramiento dental clínico en una sola sesión bajo supervisión odontológica.',
        incluye: [
          'Protección gingival de encías',
          '3 ciclos de gel blanqueador con luz LED',
          'Gel desensibilizante post-sesión',
        ],
        recomendacion: 'Sugerimos realizar una limpieza previa si hay sarro.',
      },
    ],
    camposExtra: [
      {
        name: 'motivo',
        label: 'Motivo de consulta (opcional)',
        placeholder: 'Ej. Dolor en molar, revisión general, limpieza',
        required: false,
        type: 'text',
      },
    ],
    recordatorio: {
      ejemploCliente: 'Carlos Mendoza',
      ejemploServicio: 'Limpieza Dental (Profilaxis)',
      ejemploFechaHora: 'mañana a las 10:00 a. m.',
      tonoConfirmacion:
        '¡Listo! Tu cita quedó confirmada ✅ Te esperamos 10 minutos antes en consultorio.',
      tonoReprogramar:
        'Sin problema 😊 ¿Qué día y hora te vendría mejor para tu atención?',
    },
    roiDefaults: {
      citasSemana: 30,
      porcentajeNoShow: 20,
      precioPromedio: 95,
    },
    citasEjemplo: [
      {
        id: 'c-1',
        hora: '09:00',
        cliente: 'María Elena Quispe',
        telefono: '964218390',
        servicio: 'Limpieza Dental (Profilaxis)',
        precio: 90,
        estado: 'atendido',
        motivo: 'Control semestral',
        pagado: true,
        metodoPago: 'Yape',
      },
      {
        id: 'c-2',
        hora: '10:00',
        cliente: 'Carlos Mendoza',
        telefono: '954882104',
        servicio: 'Curación Estética con Resina',
        precio: 110,
        estado: 'en_atencion',
        motivo: 'Sensibilidad al frío',
        pagado: false,
      },
      {
        id: 'c-3',
        hora: '11:00',
        cliente: 'Lucía Huamán',
        telefono: '971304922',
        servicio: 'Evaluación y Diagnóstico',
        precio: 50,
        estado: 'confirmada',
        motivo: 'Consulta por ortodoncia',
        pagado: false,
      },
      {
        id: 'c-4',
        hora: '15:00',
        cliente: 'Jorge Paredes',
        telefono: '964991023',
        servicio: 'Blanqueamiento LED',
        precio: 240,
        estado: 'pendiente',
        motivo: 'Estética dental',
        pagado: false,
      },
      {
        id: 'c-5',
        hora: '17:00',
        cliente: 'Ana Sofía Rojas',
        telefono: '982450112',
        servicio: 'Limpieza Dental (Profilaxis)',
        precio: 90,
        estado: 'reprogramar',
        motivo: 'Revisión anual',
        pagado: false,
      },
    ],
  },

  salon: {
    id: 'salon',
    rubroLabel: 'Salón y Spa',
    resumenSelector: 'Estilismo, manicure, faciales y spa',
    nombre: 'Atelier Rosa & Oro Spa',
    ciudad: 'Huancayo',
    direccion: 'Calle Real 615, Int. 204, Huancayo',
    eslogan: 'Rituales de belleza, cabello y bienestar',
    logoEmoji: '✨',
    heroImage: heroSalonImg,
    heroAlt: 'Interior elegante de Atelier Rosa & Oro Spa en Huancayo',
    negocio_id: '22222222-2222-4222-8222-222222222202',
    whatsapp: '51964112233',
    horario: {
      diasLabel: 'Lunes a Sábado · 9:00 a 19:00',
      horaInicio: 9,
      horaFin: 19,
    },
    landing: {
      titularHero: 'Un espacio sereno para renovar tu estilo y bienestar',
      subtituloHero:
        'Explora nuestros tratamientos capilares, manicure spa y cuidado facial con productos profesionales. Elige tu servicio y genera tu cita al instante.',
      beneficios: [
        {
          titulo: 'Asesoría personalizada',
          detalle: 'Evaluamos tu tipo de cabello y piel antes de cada sesión.',
        },
        {
          titulo: 'Insumos de alta gama',
          detalle: 'Fórmulas libres de formol y esmaltes de larga duración.',
        },
        {
          titulo: 'Recordatorio por WhatsApp',
          detalle: 'Confirma o reprograma con un toque desde tu celular.',
        },
      ],
      ctaPrincipal: 'Reservar cita',
    },
    colores: {
      primario: '#9D4E65', // Rosa empolvado elegante
      primarioHover: '#833D52',
      primarioTexto: '#FFFFFF',
      acento: '#B88A36', // Dorado refinado
      fondoSuave: '#FDF7F8',
      bordeSuave: '#F2D8DF',
      superficieDestacada: '#F9ECEF',
      chipActivoBg: '#9D4E65',
      chipActivoText: '#FFFFFF',
      themeColorMeta: '#9D4E65',
    },
    tipografia: {
      esEditorialSerif: true,
    },
    servicios: [
      {
        id: 'corte-brushing',
        nombre: 'Corte & Brushing Estilizado',
        duracion: '45 min',
        precio: 65,
        descripcion:
          'Diseño de corte según tus facciones acompañado de lavado hidratante y brushing duradero.',
        incluye: [
          'Diagnóstico de rostro y textura capilar',
          'Lavado nutritivo con masaje craneal',
          'Secado y sellado de puntas',
        ],
        recomendacion: 'Ideal para renovar tu look o prepararte para un evento.',
      },
      {
        id: 'manicure-gel',
        nombre: 'Manicure Spa + Gel',
        duracion: '60 min',
        precio: 75,
        descripcion:
          'Cuidado integral de manos y uñas con esmaltado en gel de brillo intacto hasta 21 días.',
        incluye: [
          'Limado, retiro suave y cuidado de cutícula',
          'Exfoliación e hidratación de manos',
          'Esmaltado gel UV en tono a elección',
        ],
        recomendacion: 'No daña la uña natural gracias al retiro cuidadoso.',
      },
      {
        id: 'hidratacion-keratina',
        nombre: 'Botox Capilar & Keratina',
        duracion: '90 min',
        precio: 160,
        descripcion:
          'Tratamiento intensivo que controla el frizz, repara la fibra y devuelve brillo espejo.',
        incluye: [
          'Lavado purificante preparatorio',
          'Aplicación de keratina orgánica sin formol',
          'Termosellado profesional',
        ],
        recomendacion: 'Duración aproximada de 2 a 3 meses con cuidado en casa.',
      },
      {
        id: 'facial-relajante',
        nombre: 'Limpieza Facial Hidratante',
        duracion: '60 min',
        precio: 110,
        descripcion:
          'Protocolo calmante para limpiar poros, equilibrar la piel y devolver luminosidad.',
        incluye: [
          'Higiene facial y vaporización suave',
          'Extracción delicada de impurezas',
          'Mascarilla botánica y masaje relajante',
        ],
        recomendacion: 'Apta para todo tipo de piel, incluso sensible.',
      },
    ],
    camposExtra: [], // Salón no requiere campos extra
    recordatorio: {
      ejemploCliente: 'Valeria Chávez',
      ejemploServicio: 'Manicure Spa + Gel',
      ejemploFechaHora: 'mañana a las 04:00 p. m.',
      tonoConfirmacion:
        '¡Listo! Tu cita quedó confirmada ✅ Qué alegría consentirte mañana.',
      tonoReprogramar:
        'Sin problema 😊 ¿Qué día y hora te vendría mejor para tu sesión?',
    },
    roiDefaults: {
      citasSemana: 35,
      porcentajeNoShow: 22,
      precioPromedio: 85,
    },
    citasEjemplo: [
      {
        id: 's-1',
        hora: '10:00',
        cliente: 'Valeria Chávez',
        telefono: '964772310',
        servicio: 'Manicure Spa + Gel',
        precio: 75,
        estado: 'confirmada',
      },
      {
        id: 's-2',
        hora: '12:00',
        cliente: 'Camila Torres',
        telefono: '954119084',
        servicio: 'Corte & Brushing Estilizado',
        precio: 65,
        estado: 'confirmada',
      },
      {
        id: 's-3',
        hora: '14:00',
        cliente: 'Fiorella Gamarra',
        telefono: '972330911',
        servicio: 'Botox Capilar & Keratina',
        precio: 160,
        estado: 'pendiente',
      },
      {
        id: 's-4',
        hora: '16:00',
        cliente: 'Brenda Salazar',
        telefono: '964551290',
        servicio: 'Limpieza Facial Hidratante',
        precio: 110,
        estado: 'reprogramar',
      },
    ],
  },

  veterinaria: {
    id: 'veterinaria',
    rubroLabel: 'Veterinaria',
    resumenSelector: 'Consultas, vacunas, baño y grooming',
    nombre: 'Veterinaria Patitas del Valle',
    ciudad: 'Huancayo',
    direccion: 'Jr. Puno 312, Huancayo',
    eslogan: 'Cuidado cálido y profesional para tu mejor amigo',
    logoEmoji: '🐾',
    heroImage: heroVeterinariaImg,
    heroAlt: 'Médica veterinaria atendiendo con cariño a un perro en consulta',
    negocio_id: '33333333-3333-4333-8333-333333333303',
    whatsapp: '51964112233',
    horario: {
      diasLabel: 'Lunes a Sábado · 9:00 a 19:00',
      horaInicio: 9,
      horaFin: 19,
    },
    landing: {
      titularHero: 'Atención veterinaria cercana, sin estrés para tu mascota',
      subtituloHero:
        'Conoce nuestros servicios médicos, vacunas y baño medicado con precios claros. Reserva su turno para evitar largas esperas en sala.',
      beneficios: [
        {
          titulo: 'Manejo respetuoso',
          detalle: 'Atención paciente adaptada a perros, gatos y mascotas exóticas.',
        },
        {
          titulo: 'Control de historial',
          detalle: 'Llevamos ficha clínica y seguimiento de vacunas al día.',
        },
        {
          titulo: 'Recordatorio personalizado',
          detalle: 'Te escribimos por WhatsApp con el nombre de tu engreído.',
        },
      ],
      ctaPrincipal: 'Reservar cita',
    },
    colores: {
      primario: '#15803D', // Verde bosque cálido
      primarioHover: '#166534',
      primarioTexto: '#FFFFFF',
      acento: '#D97706', // Ámbar cálido
      fondoSuave: '#F3FAF5',
      bordeSuave: '#BBF7D0',
      superficieDestacada: '#DCFCE7',
      chipActivoBg: '#15803D',
      chipActivoText: '#FFFFFF',
      themeColorMeta: '#15803D',
    },
    tipografia: {
      esEditorialSerif: false,
    },
    servicios: [
      {
        id: 'consulta-vet',
        nombre: 'Consulta Veterinaria General',
        duracion: '30 min',
        precio: 45,
        descripcion:
          'Evaluación física integral para diagnosticar malestares o realizar control preventivo.',
        incluye: [
          'Control de peso, temperatura y auscultación',
          'Revisión de piel, oídos y mucosas',
          'Receta e indicaciones claras para casa',
        ],
        recomendacion: 'Ideal ante decaimiento, falta de apetito o chequeo anual.',
      },
      {
        id: 'vacuna-desparasitacion',
        nombre: 'Vacunación y Desparasitación',
        duracion: '30 min',
        precio: 60,
        descripcion:
          'Protección inmunológica para cachorros, perros adultos y gatos con registro oficial.',
        incluye: [
          'Chequeo físico previo a la aplicación',
          'Dosis de vacuna o antiparasitario según peso',
          'Actualización de carnet sanitario',
        ],
        recomendacion: 'Trae su cartilla física si ya cuenta con dosis previas.',
      },
      {
        id: 'bano-grooming',
        nombre: 'Baño Medicado & Grooming',
        duracion: '60 min',
        precio: 55,
        descripcion:
          'Higiene relajante con agua temperada y productos dermatológicos seguros.',
        incluye: [
          'Baño con shampoo medicado o hipoalergénico',
          'Secado silencioso, corte de uñas y limpieza de oídos',
          'Deslanado y corte higiénico',
        ],
        recomendacion: 'Reservado por turnos individuales para evitar estrés.',
      },
      {
        id: 'ecografia-control',
        nombre: 'Ecografía y Chequeo Preventivo',
        duracion: '45 min',
        precio: 120,
        descripcion:
          'Estudio de diagnóstico por imágenes rápido, no invasivo y sin sedación.',
        incluye: [
          'Evaluación abdominal completa',
          'Informe veterinario detallado',
          'Orientación terapéutica inmediata',
        ],
        recomendacion: 'Se sugiere ayuno ligero de 6 horas si es evaluación abdominal.',
      },
    ],
    camposExtra: [
      {
        name: 'nombreMascota',
        label: 'Nombre de tu mascota',
        placeholder: 'Ej. Toby, Luna, Rocky',
        required: true,
        type: 'text',
      },
      {
        name: 'tipoMascota',
        label: 'Tipo de mascota',
        required: true,
        type: 'select',
        options: ['Perro', 'Gato', 'Otro'],
      },
    ],
    recordatorio: {
      ejemploCliente: 'Andrea Lozano',
      ejemploServicio: 'Baño Medicado & Grooming',
      ejemploFechaHora: 'mañana a las 11:00 a. m.',
      ejemploMascota: 'Toby',
      tonoConfirmacion:
        '¡Listo! La cita de Toby quedó confirmada ✅ ¡Aquí lo esperamos con mucho cariño!',
      tonoReprogramar:
        'Sin problema 😊 ¿Qué día y hora te vendría mejor para traer a Toby?',
    },
    roiDefaults: {
      citasSemana: 28,
      porcentajeNoShow: 18,
      precioPromedio: 60,
    },
    citasEjemplo: [
      {
        id: 'v-1',
        hora: '09:00',
        cliente: 'Andrea Lozano',
        telefono: '964320118',
        servicio: 'Baño Medicado & Grooming',
        precio: 55,
        estado: 'confirmada',
        mascota: 'Toby',
        especieMascota: 'Perro · Mestizo (12 kg)',
        notaMascota: 'Muy dócil, prefiere secado suave.',
      },
      {
        id: 'v-2',
        hora: '11:00',
        cliente: 'Diego Santillán',
        telefono: '954881209',
        servicio: 'Vacunación y Desparasitación',
        precio: 60,
        estado: 'confirmada',
        mascota: 'Michi Luna',
        especieMascota: 'Gato · Siamés (3.8 kg)',
        notaMascota: 'Refuerzo triple felina anual.',
      },
      {
        id: 'v-3',
        hora: '14:00',
        cliente: 'Rosaura Vilchez',
        telefono: '971908234',
        servicio: 'Consulta Veterinaria General',
        precio: 45,
        estado: 'pendiente',
        mascota: 'Rocky',
        especieMascota: 'Perro · Schnauzer (8.5 kg)',
        notaMascota: 'Revisión de piel y alergia estacional.',
      },
      {
        id: 'v-4',
        hora: '16:00',
        cliente: 'Luis Ángel Soto',
        telefono: '964102938',
        servicio: 'Ecografía y Chequeo Preventivo',
        precio: 120,
        estado: 'reprogramar',
        mascota: 'Copito',
        especieMascota: 'Otro · Conejo Rex (1.9 kg)',
        notaMascota: 'Control digestivo programado.',
      },
    ],
  },
};
