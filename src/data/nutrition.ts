/** Valores aproximados por dose da receita original (kcal, proteína, hidratos e gordura em gramas). */
export interface Nutrition {
  kcal: number
  p: number
  h: number
  g: number
}

const n = (kcal: number, p: number, h: number, g: number): Nutrition => ({ kcal, p, h, g })

export const nutrition: Record<string, Nutrition> = {
  'panquecas-fofas': n(420, 12, 58, 15),
  'ovos-mexidos-cremosos': n(380, 22, 25, 22),
  'papas-de-aveia-banana': n(390, 13, 62, 9),
  'tosta-abacate-ovo': n(420, 14, 35, 25),
  'rabanadas-pequeno-almoco': n(390, 13, 48, 16),
  'omelete-queijo-fiambre': n(430, 32, 3, 32),
  'overnight-oats': n(380, 15, 55, 11),
  'crepes-simples': n(480, 16, 60, 19),
  'iogurte-granola-fruta': n(360, 18, 40, 14),
  'panquecas-banana-aveia': n(330, 12, 52, 9),
  'bolo-de-iogurte': n(330, 5, 45, 15),
  'bolo-de-caneca-chocolate': n(520, 11, 62, 26),
  'tosta-mista': n(430, 24, 30, 24),
  'batido-morango-banana': n(190, 7, 34, 3),
  'muffins-banana': n(210, 3, 30, 9),
  'cookies-chocolate': n(170, 2, 22, 8),
  'bolo-de-cenoura': n(380, 4, 55, 17),
  'mousse-chocolate': n(380, 9, 30, 26),
  'wrap-frango': n(480, 38, 42, 16),
  'hummus-caseiro': n(250, 9, 20, 15),
  'quiche-bacon-chourico': n(620, 26, 30, 44),
  'frango-arroz-tomate': n(620, 48, 70, 15),
  'esparguete-bolonhesa': n(640, 34, 80, 20),
  'salada-grao-atum': n(560, 40, 38, 27),
  'frango-assado-batatas': n(720, 48, 45, 38),
  'hamburguer-caseiro': n(690, 40, 40, 40),
  bitoque: n(850, 52, 60, 44),
  'arroz-de-frango': n(560, 34, 55, 21),
  'massa-atum-tomate': n(620, 38, 82, 14),
  'lasanha-bolonhesa': n(680, 36, 52, 36),
  'esparguete-natas-cogumelos': n(720, 22, 80, 34),
  'bacalhau-gomes-de-sa': n(650, 38, 45, 35),
  'salmao-forno-limao': n(590, 36, 40, 31),
  'caril-frango': n(620, 45, 55, 24),
  'sopa-creme-legumes': n(150, 3, 22, 6),
  'tortilha-batata': n(420, 14, 30, 28),
  'risotto-cogumelos': n(640, 19, 82, 24),
  'wok-frango-legumes': n(480, 48, 30, 17),
  'tacos-carne': n(560, 32, 42, 28),
  'pizza-caseira': n(690, 28, 78, 28),
  'camarao-ao-alhinho': n(320, 34, 6, 18),
  'pica-pau': n(420, 38, 8, 24),
  'pao-de-alho': n(310, 7, 38, 14),
  'cogumelos-salteados': n(190, 5, 6, 16),
  'batatas-paprica-alho': n(330, 8, 42, 15),
  'bruschetta-tomate': n(260, 7, 36, 10),
  'asas-frango-forno': n(480, 36, 14, 31),
  'chourico-mel': n(330, 16, 7, 27),
  'queijo-cabra-mel': n(390, 16, 40, 19),
  'guacamole-nachos': n(360, 5, 30, 25),
}
