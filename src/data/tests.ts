import type { LiveTest } from './types';

/**
 * Tests de los directos (contenido de ejemplo).
 * Para que el extracto reproduzca el vídeo real, añade `youtubeId` al directo
 * (lo que va después de "v=" en el enlace de YouTube).
 */
export const TESTS: LiveTest[] = [
  {
    id: '2026-11-10',
    date: '2026-11-10',
    title: 'Apertura NY en NQ: absorción en el máximo',
    duration: '1 h 52 min',
    students: 142,
    avg: 68,
    questions: [
      {
        id: '2026-11-10-q1',
        topic: 'Order Flow',
        start: '00:42:15',
        len: 47,
        short: 'Qué indicaba la absorción en el máximo',
        text: 'Cuando el precio llegó al máximo de la sesión, ¿qué vimos en el footprint que indicaba absorción?',
        options: [
          'Compras agresivas muy grandes sin que el precio avanzara ni un tick',
          'Delta negativo creciente mientras el precio seguía subiendo',
          'Un vacío de volumen justo por encima del máximo',
          'Muy poco volumen negociado en el máximo'
        ],
        correct: 0,
        whyNot: [
          '',
          'Eso sería una divergencia de delta: la agresión estaría en el lado contrario.',
          'Un vacío de volumen indica falta de interés, no a alguien conteniendo el precio.',
          'Para que haya absorción tiene que entrar mucho volumen agresivo, no poco.'
        ],
        dist: [64, 17, 12, 7],
        segments: [
          { t: 0, text: 'Fijaos aquí, en el máximo de la sesión.' },
          { t: 5, text: 'Entran más de seiscientos contratos a mercado comprando en dos velas…' },
          { t: 13, text: '…y el precio no avanza ni un tick.', key: true },
          { t: 19, text: 'Eso es alguien pasivo vendiendo, absorbiendo todas esas compras.' },
          { t: 29, text: 'Todavía no entro: espero a que pierda el nivel y ahí busco el corto.' }
        ],
        why: 'La absorción se ve cuando hay mucha agresión en un lado y el precio no responde: el volumen está, pero alguien pasivo lo contiene.'
      },
      {
        id: '2026-11-10-q2',
        topic: 'Gestión del riesgo',
        start: '00:44:30',
        len: 35,
        short: 'Dónde va el stop tras la absorción',
        text: '¿Dónde se colocó el stop del corto después de ver la absorción?',
        options: [
          'Justo en el VWAP de la sesión',
          'En el número redondo más cercano',
          'Un par de ticks por encima del máximo donde se vio la absorción',
          'Sin stop: se gestiona a mano según el delta'
        ],
        correct: 2,
        whyNot: [
          'El VWAP queda lejos y no invalida la idea de la absorción.',
          'Un número redondo no tiene relación con la estructura de la operación.',
          '',
          'Operar sin stop deja el riesgo sin límite.'
        ],
        dist: [9, 14, 71, 6],
        segments: [
          { t: 0, text: 'El stop va donde la idea deja de ser válida.' },
          { t: 5, text: 'Si el precio vuelve a superar el máximo donde vimos la absorción, la idea ya no vale.', key: true },
          { t: 15, text: 'Por eso lo pongo un par de ticks por encima…' },
          { t: 21, text: '…no en un número bonito ni donde me apetezca.' }
        ],
        why: 'El stop lo define la estructura: el punto en el que el escenario que operas queda invalidado.'
      },
      {
        id: '2026-11-10-q3',
        topic: 'Order Flow',
        start: '01:05:40',
        len: 42,
        short: 'Delta acumulado en el rechazo del VWAP',
        text: 'En el rechazo del VWAP, ¿qué mostraba el delta acumulado?',
        options: [
          'Acompañaba al precio marcando nuevos máximos',
          'Divergencia: el precio hacía un máximo más alto y el delta acumulado no',
          'Se quedaba plano, sin información útil',
          'Caía en vertical antes de que el precio llegara al VWAP'
        ],
        correct: 1,
        whyNot: [
          'Si acompañara al precio no habría señal de agotamiento.',
          '',
          'No estaba plano: marcaba un máximo más bajo que el anterior.',
          'La caída del delta vino después, no antes de llegar al VWAP.'
        ],
        dist: [15, 62, 10, 13],
        segments: [
          { t: 0, text: 'Mirad la diferencia.' },
          { t: 3, text: 'El precio hace un máximo más alto pegado al VWAP…' },
          { t: 10, text: '…pero el delta acumulado se queda por debajo del máximo anterior.', key: true },
          { t: 19, text: 'Los compradores ya no empujan igual.' },
          { t: 26, text: 'Con esa divergencia en un nivel como el VWAP, el rechazo tiene mucho más sentido.' }
        ],
        why: 'Una divergencia entre precio y delta acumulado en un nivel relevante indica que la agresión que sostenía el movimiento se agota.'
      },
      {
        id: '2026-11-10-q4',
        topic: 'Psicotrading',
        start: '01:31:10',
        len: 38,
        short: 'Qué hacer después de dos stops seguidos',
        text: 'Después de dos stops seguidos, ¿qué regla se recordó en el directo?',
        options: [
          'Doblar contratos en la siguiente para recuperar',
          'Cambiar a otro activo con más volatilidad',
          'Esperar a la siguiente noticia para tener movimiento',
          'Parar, apuntar en el diario qué pasó y no entrar hasta tener un setup del plan'
        ],
        correct: 3,
        whyNot: [
          'Doblar el tamaño tras pérdidas multiplica el riesgo justo cuando peor estás.',
          'Cambiar de activo es otra forma de revancha: buscar movimiento, no setup.',
          'Operar noticias para recuperar es apostar, no seguir el plan.',
          ''
        ],
        dist: [5, 8, 6, 81],
        segments: [
          { t: 0, text: 'Dos stops seguidos y lo primero que pide el cuerpo es recuperar.' },
          { t: 7, text: 'Ahí es donde se rompen las cuentas.' },
          { t: 12, text: 'Yo cierro y apunto en el diario qué ha pasado en cada operación.', key: true },
          { t: 21, text: 'No vuelvo a entrar hasta tener claro que la siguiente es un setup del plan, no una venganza.' }
        ],
        why: 'El diario corta el impulso de revancha: te obliga a revisar antes de volver a arriesgar.'
      }
    ]
  },
  {
    id: '2026-11-09',
    date: '2026-11-09',
    title: 'Delta acumulado y rechazos en VWAP',
    duration: '1 h 40 min',
    students: 128,
    avg: 71,
    questions: [
      {
        id: '2026-11-09-q1',
        topic: 'Order Flow',
        start: '00:18:40',
        len: 41,
        short: 'Qué mide el delta de una vela',
        text: '¿Qué es el delta de una vela en el footprint?',
        options: [
          'La diferencia entre el volumen comprado a mercado y el vendido a mercado',
          'La diferencia entre el máximo y el mínimo de la vela',
          'El volumen total negociado en la vela',
          'La distancia del cierre al VWAP'
        ],
        correct: 0,
        whyNot: [
          '',
          'Eso es el rango de la vela: no dice nada de quién agrede.',
          'El volumen total no distingue entre compradores y vendedores agresivos.',
          'La distancia al VWAP es otra referencia; el delta solo mide agresión.'
        ],
        dist: [72, 9, 15, 4],
        segments: [
          { t: 0, text: 'Vamos a lo básico, que me lo preguntáis mucho.' },
          { t: 4, text: 'El delta es lo que se ha comprado a mercado menos lo que se ha vendido a mercado.', key: true },
          { t: 13, text: 'No es el volumen total: es quién ha tenido prisa por entrar.' },
          { t: 22, text: 'Si veis delta muy positivo y el precio no sube, ahí hay algo que mirar.' }
        ],
        why: 'El delta mide la agresión neta: quién cruza el spread con órdenes a mercado.'
      },
      {
        id: '2026-11-09-q2',
        topic: 'Order Flow',
        start: '00:52:10',
        len: 38,
        short: 'Por qué no comprar el primer toque al VWAP',
        text: 'En el directo, ¿por qué no se tomó el largo en el primer toque al VWAP?',
        options: [
          'Porque el VWAP no funciona en NQ',
          'Porque el precio llegó con delta acumulado vendedor muy fuerte y sin absorción',
          'Porque ya se había alcanzado el objetivo diario',
          'Porque el spread era muy amplio'
        ],
        correct: 1,
        whyNot: [
          'El VWAP es una referencia válida en NQ; el problema era cómo llegaba el precio.',
          '',
          'No se había alcanzado: era la primera operación del día.',
          'El spread en NQ era normal; no fue el motivo.'
        ],
        dist: [6, 58, 22, 14],
        segments: [
          { t: 0, text: 'Primer toque al VWAP, y mucha gente aquí compra a ciegas.' },
          { t: 5, text: 'Mirad cómo llega: el delta acumulado cayendo en vertical, vendedores agresivos sin freno.', key: true },
          { t: 15, text: 'No veo a nadie absorbiendo esas ventas.' },
          { t: 22, text: 'Sin esa señal, para mí el nivel no está defendido. Paso.' }
        ],
        why: 'Un nivel solo es operable si el order flow confirma que alguien lo defiende.'
      },
      {
        id: '2026-11-09-q3',
        topic: 'Gestión del riesgo',
        start: '01:22:05',
        len: 35,
        short: 'Cómo se gestionó la salida',
        text: 'Tras el rechazo del VWAP, ¿cómo se gestionó la salida?',
        options: [
          'Se cerró todo en el primer tick a favor',
          'Se dejó correr sin objetivo',
          'Parcial en el primer objetivo y el resto con el stop en break even',
          'Se añadieron contratos en contra'
        ],
        correct: 2,
        whyNot: [
          'Cerrar en el primer tick deja el beneficio muy por debajo del riesgo asumido.',
          'Sin objetivo no hay plan: se marcó uno antes de entrar.',
          '',
          'Promediar en contra va contra el plan de riesgo.'
        ],
        dist: [12, 8, 71, 9],
        segments: [
          { t: 0, text: 'Primer objetivo en el POC de ayer.' },
          { t: 4, text: 'Ahí cierro la mitad y el resto lo dejo con el stop en break even.', key: true },
          { t: 12, text: 'Así la operación ya no me puede hacer daño.' },
          { t: 18, text: 'Y si sigue, la dejo trabajar hasta el siguiente nivel.' }
        ],
        why: 'Asegurar una parte y proteger el resto permite dejar correr sin arriesgar lo ganado.'
      }
    ]
  },
  {
    id: '2026-11-06',
    date: '2026-11-06',
    title: 'Qué hacer después de dos stops',
    duration: '1 h 35 min',
    students: 151,
    avg: 74,
    questions: [
      {
        id: '2026-11-06-q1',
        topic: 'Psicotrading',
        start: '00:35:20',
        len: 36,
        short: 'Cómo detectar la operativa por revancha',
        text: '¿Cuál es la primera señal de que estás operando por revancha?',
        options: [
          'Entrar sin que el setup esté completo, justo después de una pérdida',
          'Operar solo en la apertura',
          'Usar el mismo stop en todas las operaciones',
          'Revisar el diario al final del día'
        ],
        correct: 0,
        whyNot: [
          '',
          'Operar la apertura puede ser parte del plan; no indica revancha.',
          'Un stop fijo es una regla de riesgo, no una señal emocional.',
          'Revisar el diario es justo lo que se recomienda.'
        ],
        dist: [81, 5, 6, 8],
        segments: [
          { t: 0, text: 'Os cuento cómo lo detecto yo.' },
          { t: 3, text: 'Cuando entro sin que el setup esté completo, justo después de un stop, eso ya es revancha.', key: true },
          { t: 13, text: 'No es análisis, es querer recuperar.' },
          { t: 19, text: 'En ese momento lo mejor que puedes hacer es levantarte de la silla.' }
        ],
        why: 'La revancha se ve en la calidad de la entrada: saltarse pasos del setup tras una pérdida.'
      },
      {
        id: '2026-11-06-q2',
        topic: 'Gestión del riesgo',
        start: '00:58:45',
        len: 30,
        short: 'El límite de pérdida diario',
        text: '¿Qué límite diario se recomendó en el directo?',
        options: ['No tener límite si el mercado está bueno', 'Parar al perder 2R en el día', 'Parar al ganar 1R', 'Operar hasta recuperar las pérdidas'],
        correct: 1,
        whyNot: [
          'Sin límite diario, un mal día puede borrar semanas de trabajo.',
          '',
          'El límite que se explicó era de pérdida, no de ganancia.',
          'Operar hasta recuperar es lo que provoca los peores días.'
        ],
        dist: [4, 77, 7, 12],
        segments: [
          { t: 0, text: 'Mi regla es sencilla.' },
          { t: 2, text: 'Si en el día pierdo 2R, se acabó: cierro la plataforma.', key: true },
          { t: 9, text: 'Da igual lo bonito que se ponga el mercado después.' },
          { t: 15, text: 'Mañana habrá más oportunidades; la cuenta tiene que seguir viva.' }
        ],
        why: 'Un límite de pérdida diario fijo protege la cuenta en los días en que no estás bien.'
      },
      {
        id: '2026-11-06-q3',
        topic: 'Psicotrading',
        start: '01:12:30',
        len: 33,
        short: 'Qué apuntar en el diario tras un stop',
        text: '¿Qué se apunta en el diario después de un stop?',
        options: [
          'Solo el resultado en dinero',
          'Nada, para no darle vueltas',
          'El precio de entrada y nada más',
          'Qué viste, por qué entraste, si respetaste el plan y cómo te sentías'
        ],
        correct: 3,
        whyNot: [
          'El dinero por sí solo no te dice qué corregir.',
          'No apuntarlo hace que repitas el mismo error.',
          'El precio sin contexto no sirve para revisar la decisión.',
          ''
        ],
        dist: [9, 3, 6, 82],
        segments: [
          { t: 0, text: 'Después de un stop no apuntéis solo el resultado.' },
          { t: 4, text: 'Apuntad qué visteis, por qué entrasteis, si respetasteis el plan y cómo os sentíais.', key: true },
          { t: 15, text: 'Eso es lo que os va a hacer mejorar.' },
          { t: 20, text: 'El dinero es la consecuencia, no la información.' }
        ],
        why: 'El diario sirve para revisar decisiones, no solo resultados.'
      }
    ]
  },
  {
    id: '2026-11-05',
    date: '2026-11-05',
    title: 'Imbalances apilados: cuándo sí y cuándo no',
    duration: '1 h 48 min',
    students: 137,
    avg: 66,
    questions: [
      {
        id: '2026-11-05-q1',
        topic: 'Order Flow',
        start: '00:27:15',
        len: 39,
        short: 'Qué es un imbalance apilado',
        text: '¿Qué es un imbalance apilado en el footprint?',
        options: [
          'Varios niveles de precio seguidos donde un lado agrede mucho más que el otro',
          'Una vela con mucho volumen',
          'Un hueco de precio entre dos velas',
          'Que el delta acumulado cambie de signo'
        ],
        correct: 0,
        whyNot: [
          '',
          'El volumen alto por sí solo no indica desequilibrio entre compradores y vendedores.',
          'Un hueco es un gap de precio, no un desequilibrio de órdenes.',
          'El cambio de signo del delta acumulado es otra señal distinta.'
        ],
        dist: [69, 13, 10, 8],
        segments: [
          { t: 0, text: 'Fijaos en estos tres niveles seguidos.' },
          { t: 4, text: 'En cada uno, los compradores agreden tres veces más que los vendedores: eso es un imbalance apilado.', key: true },
          { t: 15, text: 'Nos dice que hay iniciativa en esa zona.' },
          { t: 21, text: 'Y muchas veces esa zona funciona luego como soporte.' }
        ],
        why: 'Los imbalances apilados marcan zonas donde un lado tomó la iniciativa con fuerza.'
      },
      {
        id: '2026-11-05-q2',
        topic: 'Order Flow',
        start: '01:14:50',
        len: 34,
        short: 'Cuándo no operar un imbalance',
        text: '¿Cuándo se dijo que NO hay que operar un imbalance apilado?',
        options: [
          'Cuando aparece a favor de la tendencia',
          'Cuando aparece en la apertura',
          'Cuando aparece en mitad del rango, lejos de cualquier nivel',
          'Cuando el volumen es alto'
        ],
        correct: 2,
        whyNot: [
          'A favor de la tendencia es precisamente el mejor contexto.',
          'En la apertura puede ser válido si hay nivel y contexto.',
          '',
          'El volumen alto acompaña a muchos imbalances válidos.'
        ],
        dist: [11, 19, 55, 15],
        segments: [
          { t: 0, text: 'Y aquí es donde muchos se queman.' },
          { t: 3, text: 'Un imbalance apilado en mitad del rango, lejos de cualquier nivel, para mí no es señal.', key: true },
          { t: 13, text: 'Es ruido.' },
          { t: 16, text: 'Lo quiero ver en un nivel que ya tenía marcado antes de la sesión.' }
        ],
        why: 'Sin contexto ni nivel, un imbalance es solo ruido.'
      }
    ]
  }
];

/** Tests ordenados del más reciente al más antiguo */
export const TESTS_BY_DATE = [...TESTS].sort((a, b) => (a.date < b.date ? 1 : -1));

export const findTest = (id: string) => TESTS.find((t) => t.id === id);
