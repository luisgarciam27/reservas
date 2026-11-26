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
import dentalCleaningSmileImg from '../assets/images/dental_cleaning_smile_1795557999618.jpg';
import dentalWhiteningCareImg from '../assets/images/dental_whitening_care_1795558000258.jpg';
import salonHairStylingImg from '../assets/images/salon_hair_styling_1795558001809.jpg';
import salonManicureFacialImg from '../assets/images/salon_manicure_facial_1795558001924.jpg';
import vetPetGroomingImg from '../assets/images/vet_pet_grooming_1795558001798.jpg';
import vetCheckupCareImg from '../assets/images/vet_checkup_care_1795558002442.jpg';

// ----------------------------------------------------------------------------
// CREDENCIALES PÚBLICAS DE SUPABASE (NUNCA uses la service_role key aquí)
// Reemplaza estos valores con los de tu proyecto en Supabase o usa variables
// VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Vercel.
// ----------------------------------------------------------------------------
export const SUPABASE_URL: string =
  import.meta.env.VITE_SUPABASE_URL || 'https://tu-proyecto.supabase.co';

export const SUPABASE_ANON_KEY: string =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'tu-anon-key-publica-aqui';

import type { ModuloId, Negocio, RubroSaasKey, ServicioSaaS } from '../types/saas';

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
  imagen?: string;
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

export interface PromocionItem {
  id: string;
  titulo: string;
  descripcion: string;
  descuentoBadge: string;
  precioPromo: number;
  precioRegular: number;
  servicioId: string;
  vigencia: string;
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
  promos: PromocionItem[];
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
    nombre: 'Clínica Dental Sonrisa',
    ciudad: 'Lima',
    direccion: 'Av. Principal 428',
    eslogan: 'Atención odontológica puntual y sin esperas',
    logoEmoji: '🦷',
    heroImage: heroConsultorioImg,
    heroAlt: 'Consultorio odontológico moderno y luminoso',
    negocio_id: '11111111-1111-4111-8111-111111111101',
    whatsapp: '51964112233',
    horario: {
      diasLabel: 'Lunes a Sábado · 9:00 a 19:00',
      horaInicio: 9,
      horaFin: 19,
    },
    landing: {
      titularHero: 'Tu sonrisa al día, puntual y sin esperas',
      subtituloHero: 'Elige tu tratamiento, mira horarios en vivo y agenda en segundos.',
      beneficios: [
        {
          titulo: 'Especialistas colegiados',
          detalle: 'Atención familiar y estética.',
        },
        {
          titulo: 'Bioseguridad total',
          detalle: 'Equipos modernos y esterilizados.',
        },
        {
          titulo: 'Aviso por WhatsApp',
          detalle: 'Recordatorio automático de tu cita.',
        },
      ],
      ctaPrincipal: 'Reservar cita',
    },
    colores: {
      primario: '#0284C7', // Azul cielo clínico vibrante
      primarioHover: '#0369A1',
      primarioTexto: '#FFFFFF',
      acento: '#06B6D4',
      fondoSuave: '#F0F9FF',
      bordeSuave: '#7DD3FC',
      superficieDestacada: '#E0F2FE',
      chipActivoBg: '#0284C7',
      chipActivoText: '#FFFFFF',
      themeColorMeta: '#0284C7',
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
        imagen: dentalCleaningSmileImg,
        descripcion: 'Revisión dental completa y plan claro al instante.',
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
        imagen: heroConsultorioImg,
        descripcion: 'Ultrasonido indoloro que elimina sarro y manchas.',
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
        imagen: dentalCleaningSmileImg,
        descripcion: 'Restauración natural del mismo tono de tu diente.',
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
        imagen: dentalWhiteningCareImg,
        descripcion: 'Sonrisa más blanca en 1 sesión con luz LED clínica.',
        incluye: [
          'Protección gingival de encías',
          '3 ciclos de gel blanqueador con luz LED',
          'Gel desensibilizante post-sesión',
        ],
        recomendacion: 'Sugerimos realizar una limpieza previa si hay sarro.',
      },
    ],
    promos: [
      {
        id: 'promo-sonrisa',
        titulo: 'Pack Blanqueamiento + Limpieza',
        descripcion: 'Elimina manchas y luce una sonrisa 3 tonos más blanca con blanqueamiento LED y profilaxis completa.',
        descuentoBadge: '30% OFF',
        precioPromo: 220,
        precioRegular: 320,
        servicioId: 'blanqueamiento',
        vigencia: 'Fin de semana',
      },
      {
        id: 'promo-prev',
        titulo: 'Chequeo Preventivo Familiar',
        descripcion: 'Evaluación y diagnóstico odontológico con odontograma digital para toda la familia.',
        descuentoBadge: 'S/ 30 OFF',
        precioPromo: 20,
        precioRegular: 50,
        servicioId: 'consulta-diagnostico',
        vigencia: 'Este mes',
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
    ciudad: 'Lima',
    direccion: 'Av. Los Rosales 615, Int. 204',
    eslogan: 'Rituales de belleza, cabello y bienestar',
    logoEmoji: '✨',
    heroImage: heroSalonImg,
    heroAlt: 'Interior elegante de Atelier Rosa & Oro Spa',
    negocio_id: '22222222-2222-4222-8222-222222222202',
    whatsapp: '51964112233',
    horario: {
      diasLabel: 'Lunes a Sábado · 9:00 a 19:00',
      horaInicio: 9,
      horaFin: 19,
    },
    landing: {
      titularHero: 'Renueva tu look, uñas y piel en tu horario ideal',
      subtituloHero: 'Cabello, manicure gel y faciales spa listos para reservar.',
      beneficios: [
        {
          titulo: 'Estilistas expertos',
          detalle: 'Diseño acorde a tu rostro.',
        },
        {
          titulo: 'Productos premium',
          detalle: 'Fórmulas sin formol y gel UV.',
        },
        {
          titulo: 'Confirmación rápida',
          detalle: 'Recordatorio directo a tu WhatsApp.',
        },
      ],
      ctaPrincipal: 'Reservar cita',
    },
    colores: {
      primario: '#DB2777', // Rosa vibrante elegante
      primarioHover: '#BE185D',
      primarioTexto: '#FFFFFF',
      acento: '#F59E0B', // Dorado luminoso
      fondoSuave: '#FFF1F6',
      bordeSuave: '#FBCFE8',
      superficieDestacada: '#FCE7F3',
      chipActivoBg: '#DB2777',
      chipActivoText: '#FFFFFF',
      themeColorMeta: '#DB2777',
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
        imagen: salonHairStylingImg,
        descripcion: 'Corte personalizado, lavado nutritivo y ondas duraderas.',
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
        imagen: salonManicureFacialImg,
        descripcion: 'Exfoliación de manos y esmaltado gel brillo espejo.',
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
        imagen: heroSalonImg,
        descripcion: 'Cero frizz, reparación profunda y brillo sedoso.',
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
        imagen: salonManicureFacialImg,
        descripcion: 'Piel limpia, luminosa e hidratada con masaje spa.',
        incluye: [
          'Higiene facial y vaporización suave',
          'Extracción delicada de impurezas',
          'Mascarilla botánica y masaje relajante',
        ],
        recomendacion: 'Apta para todo tipo de piel, incluso sensible.',
      },
    ],
    promos: [
      {
        id: 'promo-brillo',
        titulo: 'Pack Brillo & Hidratación Capilar',
        descripcion: 'Corte estilizado + Hidratación profunda con ampolla botox capilar y brushing profesional.',
        descuentoBadge: '25% OFF',
        precioPromo: 95,
        precioRegular: 130,
        servicioId: 'hidratacion-keratina',
        vigencia: 'Viernes y Sábados',
      },
      {
        id: 'promo-manos',
        titulo: 'Combo Manicure Gel + Pedicure Spa',
        descripcion: 'Esmaltado en gel duradero con exfoliación e hidratación profunda.',
        descuentoBadge: 'S/ 25 OFF',
        precioPromo: 75,
        precioRegular: 100,
        servicioId: 'manicure-gel',
        vigencia: 'Martes a Jueves',
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
    nombre: 'Veterinaria Patitas',
    ciudad: 'Lima',
    direccion: 'Jr. Central 312',
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
      titularHero: 'Cuidado veterinario y spa sin estrés para tu engreído',
      subtituloHero: 'Consultas, vacunas y baño medicado por turnos sin espera.',
      beneficios: [
        {
          titulo: 'Trato sin estrés',
          detalle: 'Turnos exclusivos para perros y gatos.',
        },
        {
          titulo: 'Historial al día',
          detalle: 'Control de vacunas y peso.',
        },
        {
          titulo: 'Aviso por WhatsApp',
          detalle: 'Te recordamos con su nombre.',
        },
      ],
      ctaPrincipal: 'Reservar cita',
    },
    colores: {
      primario: '#059669', // Esmeralda fresco y vivo
      primarioHover: '#047857',
      primarioTexto: '#FFFFFF',
      acento: '#F59E0B', // Ámbar cálido
      fondoSuave: '#ECFDF5',
      bordeSuave: '#6EE7B7',
      superficieDestacada: '#D1FAE5',
      chipActivoBg: '#059669',
      chipActivoText: '#FFFFFF',
      themeColorMeta: '#059669',
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
        imagen: vetCheckupCareImg,
        descripcion: 'Chequeo médico completo para perros y gatos.',
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
        imagen: heroVeterinariaImg,
        descripcion: 'Protección inmunológica y registro sanitario al día.',
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
        imagen: vetPetGroomingImg,
        descripcion: 'Agua temperada, corte de uñas y secado silencioso.',
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
        imagen: vetCheckupCareImg,
        descripcion: 'Diagnóstico por imágenes rápido, indoloro y sin sedación.',
        incluye: [
          'Evaluación abdominal completa',
          'Informe veterinario detallado',
          'Orientación terapéutica inmediata',
        ],
        recomendacion: 'Se sugiere ayuno ligero de 6 horas si es evaluación abdominal.',
      },
    ],
    promos: [
      {
        id: 'promo-pet-salud',
        titulo: 'Pack Bienestar: Baño + Vacuna',
        descripcion: 'Mantén a tu engreído protegido contra parásitos externos y al día con su cartilla de vacunación.',
        descuentoBadge: '20% OFF',
        precioPromo: 90,
        precioRegular: 115,
        servicioId: 'bano-grooming',
        vigencia: 'Todo este mes',
      },
      {
        id: 'promo-eco',
        titulo: 'Chequeo Geriátrico con Ecografía',
        descripcion: 'Evaluación preventiva recomendada para perritos y gatitos mayores de 7 años.',
        descuentoBadge: 'S/ 30 OFF',
        precioPromo: 135,
        precioRegular: 165,
        servicioId: 'ecografia-control',
        vigencia: 'Miércoles especiales',
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

// ============================================================================
// CONFIGURACIÓN UNIFICADA POR RUBRO PARA EL MINI SAAS ("MarIA Citas")
// ============================================================================
export interface RubroSaasPreset {
  id: RubroSaasKey;
  rubroLabel: string;
  descripcionCorta: string;
  logoDefault: string;
  colorDefault: string;
  sujetoLabel: 'mascota' | 'paciente' | 'cliente';
  sujetoPlural: 'mascotas' | 'pacientes' | 'clientes';
  sujetoSingularCap: string;
  sujetoPluralCap: string;
  extraCrmLabel: string;
  modulosRecomendados: ModuloId[];
  camposExtra: CampoExtra[];
  serviciosEjemplo: Omit<ServicioItem, 'incluye' | 'recomendacion'>[];
  profesionalesEjemplo: { nombre: string; especialidad: string }[];
  productosEjemplo: { nombre: string; precio: number; descripcion: string; stock: number }[];
}

export const RUBRO_SAAS_ORDER: RubroSaasKey[] = [
  'veterinaria',
  'consultorio',
  'salon',
  'otro',
];

export const RUBROS_SAAS: Record<RubroSaasKey, RubroSaasPreset> = {
  veterinaria: {
    id: 'veterinaria',
    rubroLabel: 'Veterinaria',
    descripcionCorta: 'Consultas, vacunas, baño medicado y fichas de mascotas',
    logoDefault: '🐾',
    colorDefault: '#15803D',
    sujetoLabel: 'mascota',
    sujetoPlural: 'mascotas',
    sujetoSingularCap: 'Mascota',
    sujetoPluralCap: 'Mascotas',
    extraCrmLabel: 'Mascotas y observaciones',
    modulosRecomendados: [
      'agenda',
      'servicios',
      'recordatorios',
      'clientes',
      'promos',
      'catalogo',
      'reportes',
    ],
    camposExtra: RUBROS.veterinaria.camposExtra,
    serviciosEjemplo: RUBROS.veterinaria.servicios.map((s) => ({
      id: s.id,
      nombre: s.nombre,
      duracion: s.duracion,
      precio: s.precio,
      descripcion: s.descripcion,
    })),
    profesionalesEjemplo: [
      { nombre: 'Dra. Camila Rojas', especialidad: 'Medicina Veterinaria' },
      { nombre: 'Tec. Piero Salazar', especialidad: 'Grooming y Baño' },
    ],
    productosEjemplo: [
      {
        nombre: 'Antipulgas Simparica (10-20 kg)',
        precio: 68,
        descripcion: 'Protección mensual contra pulgas y garrapatas.',
        stock: 15,
      },
      {
        nombre: 'Shampoo Hipoalergénico Avena 350ml',
        precio: 42,
        descripcion: 'Ideal para piel sensible y pelaje brillante.',
        stock: 20,
      },
      {
        nombre: 'Snacks Dentales Perro Adulto',
        precio: 24,
        descripcion: 'Bolsa x 7 unidades para higiene bucal diaria.',
        stock: 30,
      },
    ],
  },

  consultorio: {
    id: 'consultorio',
    rubroLabel: 'Consultorio / Clínica',
    descripcionCorta: 'Odontología, medicina general, psicología y especialidades',
    logoDefault: '🦷',
    colorDefault: '#0369A1',
    sujetoLabel: 'paciente',
    sujetoPlural: 'pacientes',
    sujetoSingularCap: 'Paciente',
    sujetoPluralCap: 'Pacientes',
    extraCrmLabel: 'Motivos de consulta',
    modulosRecomendados: [
      'agenda',
      'servicios',
      'recordatorios',
      'clientes',
      'reportes',
    ],
    camposExtra: RUBROS.consultorio.camposExtra,
    serviciosEjemplo: RUBROS.consultorio.servicios.map((s) => ({
      id: s.id,
      nombre: s.nombre,
      duracion: s.duracion,
      precio: s.precio,
      descripcion: s.descripcion,
    })),
    profesionalesEjemplo: [
      { nombre: 'Dr. Ricardo Mendoza', especialidad: 'Odontología General' },
      { nombre: 'Dra. Lucía Paredes', especialidad: 'Ortodoncia y Estética' },
    ],
    productosEjemplo: [
      {
        nombre: 'Cepillo Interdental + Hilo Encerado',
        precio: 22,
        descripcion: 'Kit de higiene recomendado post-profilaxis.',
        stock: 25,
      },
      {
        nombre: 'Enjuague Bucal Terapéutico 500ml',
        precio: 38,
        descripcion: 'Fórmula sin alcohol para encías sensibles.',
        stock: 18,
      },
    ],
  },

  salon: {
    id: 'salon',
    rubroLabel: 'Spa / Salón de Belleza',
    descripcionCorta: 'Estilismo, manicure gel, keratina, faciales y masajes',
    logoDefault: '✨',
    colorDefault: '#9D4E65',
    sujetoLabel: 'cliente',
    sujetoPlural: 'clientes',
    sujetoSingularCap: 'Cliente',
    sujetoPluralCap: 'Clientes',
    extraCrmLabel: 'Preferencias del cliente',
    modulosRecomendados: [
      'agenda',
      'servicios',
      'recordatorios',
      'clientes',
      'promos',
      'catalogo',
    ],
    camposExtra: [
      {
        name: 'preferencia',
        label: 'Preferencia o nota (opcional)',
        placeholder: 'Ej. Tono de esmalte, largo de corte o alergia',
        required: false,
        type: 'text',
      },
    ],
    serviciosEjemplo: RUBROS.salon.servicios.map((s) => ({
      id: s.id,
      nombre: s.nombre,
      duracion: s.duracion,
      precio: s.precio,
      descripcion: s.descripcion,
    })),
    profesionalesEjemplo: [
      { nombre: 'Est. Valeria Chávez', especialidad: 'Colorimetría y Corte' },
      { nombre: 'Esp. Fiorella Gamarra', especialidad: 'Manicure Spa & Gel' },
    ],
    productosEjemplo: [
      {
        nombre: 'Sérum Reparador Argán 100ml',
        precio: 55,
        descripcion: 'Sellador de puntas y protector térmico.',
        stock: 14,
      },
      {
        nombre: 'Mascarilla Capilar Sin Sal 500g',
        precio: 65,
        descripcion: 'Prolonga el efecto de tu keratina o botox capilar.',
        stock: 12,
      },
    ],
  },

  otro: {
    id: 'otro',
    rubroLabel: 'Otro Negocio de Citas',
    descripcionCorta: 'Barbería, fisioterapia, asesorías, fotografía o taller',
    logoDefault: '📅',
    colorDefault: '#4F46E5',
    sujetoLabel: 'cliente',
    sujetoPlural: 'clientes',
    sujetoSingularCap: 'Cliente',
    sujetoPluralCap: 'Clientes',
    extraCrmLabel: 'Notas de atención',
    modulosRecomendados: [
      'agenda',
      'servicios',
      'recordatorios',
      'clientes',
      'promos',
    ],
    camposExtra: [
      {
        name: 'motivo',
        label: 'Detalle o requerimiento (opcional)',
        placeholder: 'Ej. Primera sesión, consulta específica',
        required: false,
        type: 'text',
      },
    ],
    serviciosEjemplo: [
      {
        id: 'sesion-inicial',
        nombre: 'Sesión / Atención Estándar',
        duracion: '45 min',
        precio: 60,
        descripcion: 'Atención personalizada con diagnóstico o evaluación inicial.',
      },
      {
        id: 'paquete-completo',
        nombre: 'Servicio Completo Premium',
        duracion: '60 min',
        precio: 110,
        descripcion: 'Sesión extendida con seguimiento por WhatsApp.',
      },
      {
        id: 'control-seguimiento',
        nombre: 'Control o Seguimiento',
        duracion: '30 min',
        precio: 40,
        descripcion: 'Cita rápida de revisión o mantenimiento.',
      },
    ],
    profesionalesEjemplo: [
      { nombre: 'Especialista Principal', especialidad: 'Atención General' },
    ],
    productosEjemplo: [
      {
        nombre: 'Kit de Cuidado Recomendado',
        precio: 45,
        descripcion: 'Complemento sugerido para mantener resultados en casa.',
        stock: 10,
      },
    ],
  },
};

function sanitizeColorHex(hex: string | undefined, fallback: string): string {
  if (!hex) return fallback;
  return /^#[0-9a-fA-F]{6}$/.test(hex.trim()) ? hex.trim() : fallback;
}

/**
 * Adapta cualquier Negocio SaaS + sus servicios reales a la interfaz RubroConfig
 * para reutilizar todos los componentes existentes del dueño y reservas sin duplicar pantallas.
 */
export function buildRubroConfigFromNegocio(
  negocio: Negocio,
  servicios: ServicioSaaS[]
): RubroConfig {
  const preset = RUBROS_SAAS[negocio.rubro] || RUBROS_SAAS.otro;
  const demoBase: RubroConfig =
    negocio.rubro === 'otro' ? RUBROS.consultorio : RUBROS[negocio.rubro];
  const colorPrimario = sanitizeColorHex(negocio.color, preset.colorDefault);
  const cleanWa = negocio.whatsapp.replace(/\D/g, '') || '51964112233';

  return {
    ...demoBase,
    id: negocio.rubro === 'otro' ? 'consultorio' : negocio.rubro,
    rubroLabel: preset.rubroLabel,
    resumenSelector: preset.descripcionCorta,
    nombre: negocio.nombre,
    ciudad: 'Perú',
    direccion: negocio.direccion || 'Dirección por confirmar',
    eslogan: `Reserva tu cita en ${negocio.nombre}`,
    logoEmoji: negocio.logo || preset.logoDefault,
    negocio_id: negocio.id,
    whatsapp: cleanWa.startsWith('51') ? cleanWa : `51${cleanWa}`,
    horario: {
      diasLabel: negocio.horario || 'Lunes a Sábado · 9:00 a 19:00',
      horaInicio: 9,
      horaFin: 19,
    },
    colores: {
      ...demoBase.colores,
      primario: colorPrimario,
      primarioHover: colorPrimario,
      acento: colorPrimario,
      chipActivoBg: colorPrimario,
      themeColorMeta: colorPrimario,
      fondoSuave: '#F8FAFC',
      bordeSuave: '#E2E8F0',
      superficieDestacada: `${colorPrimario}1A`,
    },
    servicios: servicios.map((s) => ({
      id: s.id,
      nombre: s.nombre,
      duracion: s.duracion,
      precio: Number(s.precio) || 0,
      descripcion: s.descripcion || 'Atención programada con confirmación por WhatsApp.',
      incluye: [],
      recomendacion: '',
    })),
    camposExtra: preset.camposExtra,
    citasEjemplo: [],
  };
}

