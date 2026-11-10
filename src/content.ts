/**
 * Contenido editable de la app: activos, setups, emociones, plan por defecto
 * y el próximo directo. Cuando conectemos el servidor, esto vendrá del panel del mentor.
 */

/** Activos y valor en $ de 1 punto por contrato */
export const ASSETS: { symbol: string; pointValue: number }[] = [
  { symbol: 'NQ', pointValue: 20 },
  { symbol: 'MNQ', pointValue: 2 },
  { symbol: 'ES', pointValue: 50 },
  { symbol: 'MES', pointValue: 5 },
  { symbol: 'CL', pointValue: 1000 },
  { symbol: 'GC', pointValue: 100 }
];

export const SETUPS = ['Absorción en máximo', 'Divergencia de delta', 'Rechazo de VWAP', 'Ruptura de rango', 'Imbalance apilado', 'Fuera de plan'];

export const MOODS = ['Calmado', 'Confiado', 'Ansioso', 'Frustrado', 'FOMO'];

export const TOPICS = ['Order Flow', 'Gestión del riesgo', 'Psicotrading'];

export const DEFAULT_RULES = ['Máximo 3 operaciones al día', 'Stop diario en −2R', 'Solo setups de mi plan', 'No operar 5 min antes de noticias'];

/** Próximo directo. Pon `null` para ocultar la tarjeta. */
export const NEXT_LIVE: { date: string; time: string; title: string } | null = {
  date: '2026-11-11',
  time: '15:00',
  title: '[Tema del próximo directo]'
};
