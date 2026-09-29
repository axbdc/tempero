/**
 * Ajustes às quantidades mostradas nos passos (índice do passo a começar em 0).
 * - all: mostra a lista de todos os ingredientes ainda não usados (passos "tritura tudo")
 * - group: mostra os ingredientes de um grupo (ex.: "ingredientes da cobertura")
 * - skip: palavras que não devem receber quantidade nesse passo
 */
export const stepOverrides: Record<string, Record<number, { all?: boolean; group?: string; skip?: string[] }>> = {
  'panquecas-banana-aveia': { 0: { all: true, skip: ['oleo'] } },
  'sopa-creme-legumes': { 0: { all: true, skip: ['agua', 'sal', 'azeite'] } },
  'hummus-caseiro': { 0: { skip: ['agua'] } },
  'bolo-de-cenoura': { 5: { group: 'Cobertura' } },
  'batatas-paprica-alho': { 5: { group: 'Molho de alho' } },
  'bolo-de-iogurte': { 0: { skip: ['farinha', 'manteiga'] } },
}
