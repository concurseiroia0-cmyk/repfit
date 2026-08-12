# RepFit ⚡

Aplicativo web **100% local** para registrar e acompanhar treinos de musculação. Sem backend, sem login, sem contas: todos os dados e fotos ficam salvos apenas no seu dispositivo (IndexedDB), e o app funciona **totalmente offline** (PWA instalável).

## Funcionalidades

- **Boas-vindas** — tela de primeiro uso com a logo, instalação/QR code e a opção de explorar com dados de exemplo (quem já tem dados nunca é interrompido).
- **Início** — resumo pessoal: último treino, treinos do mês, sequência atual 🔥, volume da semana, esforço médio recente, exercícios com maior evolução e recordes.
- **Medidas corporais** — registre peso e medidas (braço, cintura, peito, coxa, panturrilha e outras personalizadas) com histórico completo: gráficos por medida, resumo "78 → 76 → 75 kg" com variação ▲/▼, editar e excluir. Peso segue a unidade do app (kg/lb); as demais são em cm.
- **Novo treino** — data, nome, tipo com sugestões rápidas, duração e observações. Exercícios com autocomplete, séries individuais (carga × reps por série), botões **+/−** para ajuste rápido, escala de esforço **invertida** (1 = mais difícil · 6 = mais fácil), volume calculado automaticamente e **rascunho salvo automaticamente**.
- **Cronômetro de descanso** — entre as séries: tempos rápidos (30s a 5min), pausar/continuar/zerar, bipe + toast + notificação opcional do navegador ao terminar, e botão "descansar" em cada exercício. O descanso acumulado fica salvo no treino e aparece no detalhe e no gráfico de Evolução (histórico de tempo).
- **Fotos** — adicionar foto ao treino, comprimida/redimensionada (máx ~1600px) e salva como **Blob no IndexedDB** (nunca base64 em localStorage, nunca upload). Visualização em tela cheia e remoção.
- **Histórico** — treinos agrupados por mês, busca por nome/exercício, filtros por período e tipo. Detalhe completo com ações **Editar**, **Excluir** (com confirmação) e **Repetir treino**.
- **Repetir treino** — duplica um treino antigo com a data de hoje, mantendo exercícios/cargas/reps para só ajustar o que mudou, mostrando os valores anteriores e indicando ▲/▼ quando a carga subiu/caiu.
- **Calendário** — visão mensal com dias treinados destacados por cor do tipo de treino, estatísticas do mês e criação de treino em qualquer dia.
- **Evolução** — progressão por exercício com gráficos leves (SVG): carga, repetições, volume, frequência semanal e esforço médio. Filtros de período (30 dias, 3 meses, 6 meses, tudo).
- **Recordes** — calculados automaticamente: maior carga, maior nº de repetições, maior volume (exercício/treino) e maior sequência. Toast discreto "🎉 Novo recorde!" ao bater um recorde.
- **Configurações** — nome, unidade kg/lb, tema claro/escuro/automático, catálogo de exercícios (favoritos, recentes, autocomplete), **exportar/importar backup JSON** (com fotos em base64 e medidas corporais), espaço usado no dispositivo e exclusão total com confirmação digitando `EXCLUIR`.
- **Offline/PWA** — manifest, ícones e service worker gerados pelo `vite-plugin-pwa`. Indicador "Offline — seus dados continuam salvos neste dispositivo" e botão **"Baixar / instalar o app"** (diálogo nativo; no iPhone/iPad, instruções de Adicionar à Tela de Início).
- **Instalar no celular** — QR code do app para escanear com a câmera + botão **Compartilhar link** (Web Share API, com fallback de copiar link). Disponível na Home (banner) e em Configurações → "QR code / compartilhar".
- **Proteção de dados** — pede armazenamento persistente ao navegador (menos risco de limpeza automática), **backup automático baixado antes de importar ou excluir tudo**, e lembretes de backup antigo (na Home e nas Configurações).
- **Design** — identidade "diário escuro com dourado" (preto profundo + acento âmbar + relâmpago), inspirada no template Boltzshift, com dark mode completo.

## Stack

React 19 · TypeScript · Vite · Tailwind CSS · Dexie (IndexedDB) · dexie-react-hooks (`liveQuery`) · date-fns · React Router · lucide-react · vite-plugin-pwa.

## Como rodar

```bash
npm install
npm run dev       # desenvolvimento (http://localhost:5173)
npm run build     # build de produção (gera o PWA em dist/)
npm run preview   # serve o build
```

> Os ícones PNG do PWA são gerados pela logo do RepFit (barbell) por um script sem dependências:
> ```bash
> node scripts/prepare-logo.mjs   # a partir de .logo-src/logo-original.png
> node scripts/gen-icons.mjs      # fallback com o desenho do relâmpago
> ```

## Arquitetura

```
src/
├── components/   # UI reutilizável, layout, formulário de treino, gráficos
├── pages/        # Boas-vindas, Início, Novo treino, Histórico, Detalhe, Calendário, Medidas, Evolução, Configurações
├── hooks/        # useTheme, useOnline, usePhotoUrl, usePwaInstall
├── services/     # treinos, fotos, medidas, configurações, rascunho, backup, recordes, dados de exemplo
├── db/           # Dexie (IndexedDB) versionado + catálogo inicial
├── types/        # modelos de dados
└── utils/        # datas (sem bug de fuso), cálculos, formatação, storage
```

### Modelo de dados (IndexedDB — `db/db.ts`)

- `workouts` — treino: `date` (YYYY-MM-DD local), `weekday`, `name`, `type`, `exercises[]` (nome, `sets[{weight, reps}]`, `effort` 1–6, `notes`, `order`), `notes`, `photoId`, `durationMin`, `totalVolume`, `avgEffort`, `createdAt`, `updatedAt`.
- `exerciseCatalog` — catálogo: nome, grupo muscular, favorito, última carga/reps, nº de usos.
- `photos` — blobs das fotos (`workoutId`, `blob`, `width`, `height`).
- `settings` — chave/valor (nome, unidade, tema, boas-vindas, tipos de medida).
- `measurements` — medições corporais: `date` (YYYY-MM-DD), `values` (chave → valor), `createdAt`.

A estrutura é versionada (Dexie `version(n).stores(...)`), pronta para migrações futuras.

## Observações

- **Datas**: sempre armazenadas como `YYYY-MM-DD` local e convertidas manualmente (`parseLocalDate`), evitando o bug de fuso horário de `new Date('YYYY-MM-DD')`.
- **Pesos**: sempre salvos em **kg**; a unidade de exibição (kg/lb) é convertida na interface.
- **Dados de exemplo**: criados apenas se você clicar em "Criar dados de exemplo" (nunca misturados como se fossem reais).
- **Privacidade**: nada sai do seu dispositivo. Faça backup em Configurações para não perder os dados.
