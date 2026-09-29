# Tempero

Webapp de receitas passo a passo, com medidas sem balança (chávenas, colheres, copo de iogurte) e modo cozinhar guiado com temporizadores.

## Funcionalidades

- 22 receitas em 5 categorias: pequeno-almoço, lanche, almoço, jantar e petiscos
- Modo cozinhar em ecrã inteiro: um passo de cada vez, swipe/setas, ecrã sempre ligado (Wake Lock)
- Temporizadores por passo com alarme sonoro e vibração; vários em simultâneo
- Lista de ingredientes com checklist
- Pesquisa por nome, ingrediente ou etiqueta; filtros por categoria e tempo
- Favoritos guardados no dispositivo
- Sugestão do dia conforme a hora (pequeno-almoço, almoço, lanche, jantar)
- PWA-ready (manifest + ícones)

## Stack

React 19 · Vite · TypeScript · Tailwind CSS v4 · React Router · lucide-react

## Desenvolvimento

```bash
npm install
npm run dev
npm run build
```

## Adicionar receitas

As receitas estão em `src/data/`:

- `recipes-manha-lanche.ts` — pequeno-almoço e lanche
- `recipes-almoco-jantar.ts` — almoço e jantar
- `recipes-petiscos.ts` — petiscos

Cada passo pode ter `minutes` (cria um temporizador), `heat` (etiqueta de lume/forno) e `tip`. O campo `image` é o ID de uma foto do Unsplash (a parte depois de `photo-`).

Fotografias: [Unsplash](https://unsplash.com) (créditos em cada receita).
