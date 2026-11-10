export type Side = 'Long' | 'Short';

export interface Trade {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM */
  time: string;
  asset: string;
  side: Side;
  setup: string;
  qty: number;
  entry?: number;
  exit?: number;
  stop?: number;
  pts: number;
  r: number | null;
  pnl: number;
  mood: string;
  plan: boolean;
  note: string;
  /** Operación de ejemplo, se puede borrar desde Perfil */
  demo?: boolean;
}

/** Una frase del extracto. `t` son segundos desde el inicio del fragmento. */
export interface Segment {
  t: number;
  text: string;
  /** Frase clave que se resalta */
  key?: boolean;
}

export interface Question {
  id: string;
  topic: string;
  /** Minuto del directo donde empieza el fragmento (hh:mm:ss) */
  start: string;
  /** Duración del fragmento en segundos */
  len: number;
  short: string;
  text: string;
  options: string[];
  correct: number;
  /** Por qué cada opción incorrecta no lo es ('' en la correcta) */
  whyNot: string[];
  /** % de alumnos que eligió cada opción */
  dist: number[];
  segments: Segment[];
  why: string;
}

export interface LiveTest {
  id: string;
  /** Fecha del directo YYYY-MM-DD */
  date: string;
  title: string;
  duration: string;
  students: number;
  /** Media de aciertos de los alumnos (%) */
  avg: number;
  /** ID del vídeo de YouTube del directo. Sin él se muestra un reproductor de demostración. */
  youtubeId?: string;
  questions: Question[];
}

export interface Progress {
  /** Pregunta en la que está el alumno */
  idx: number;
  /** índice de pregunta → opción elegida */
  answers: Record<number, number>;
  finished: boolean;
  demo?: boolean;
}

export interface Profile {
  name: string;
  email: string;
  code: string;
}

export interface Prefs {
  newTest: boolean;
  journalReminder: boolean;
  liveReminder: boolean;
  remindNextLive: boolean;
}
