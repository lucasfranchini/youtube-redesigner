# YouTube Redesigner

Extensão Chrome Manifest V3 para personalizar e simplificar o layout do YouTube.
Ela oculta Shorts, remove opcionalmente a seção “Mais relevantes” e permite
escolher entre 3 e 6 vídeos por linha nas páginas inicial e de inscrições.
Na página de inscrições, uma barra opcional permite filtrar os cards por canal
sem recriar os componentes nativos do YouTube.

O projeto usa WXT para a estrutura da extensão, React no popup e TypeScript na
interface e no content script. A extensão não usa código remoto, telemetria ou
um processo em segundo plano.

## Requisitos

- Node.js LTS (22 ou superior)
- npm
- Google Chrome ou outro navegador Chromium compatível

## Desenvolvimento

```bash
npm install
npm run dev
```

O WXT abre o navegador configurado em `web-ext.config.ts` com a extensão
instalada e recarrega o projeto durante o desenvolvimento. Neste projeto, o
ambiente de desenvolvimento local está configurado para o Opera GX; o build
continua sendo gerado para Chrome Manifest V3.

## Validação e build

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run zip
```

`npm run validate` executa typecheck, lint, testes e build em sequência.

O build descompactado fica em `.output/chrome-mv3`. O pacote para publicação é
gerado dentro de `.output` pelo comando `npm run zip`.

## Instalação manual

1. Execute `npm install` e `npm run build`.
2. Abra `chrome://extensions`.
3. Ative **Modo do desenvolvedor**.
4. Clique em **Carregar sem compactação**.
5. Selecione a pasta `.output/chrome-mv3`.

## Estrutura

```text
src/
  entrypoints/         Inicialização do popup e dos content scripts
  pages/               Composição da tela completa do popup
  components/          Componentes React e seus CSS Modules
  hooks/               Estado e ciclo de vida do React
  storage/             Leitura, escrita e observação das preferências
  youtube/             Integração com páginas, inscrições e contexto MAIN
  utils/               Funções puras de normalização e identificação
  constants/           Valores padrão, seletores e caminhos fixos
  types/               Tipos compartilhados entre módulos
  styles/              Estilos globais do popup
tests/                 Testes organizados por domínio e comportamento
knowledge/             Mapas compactos para agentes e manutenção
AGENTS.md              Regras de arquitetura e manutenção do projeto
wxt.config.ts          Configuração e permissões do Manifest V3
```

O índice da base de conhecimento está em `knowledge/project-map.json`. Os mapas
JSON relacionam cada funcionalidade aos seus arquivos, testes e contratos; os
guias Markdown registram arquitetura, estrutura, dependências e operação.

O popup acessa as preferências somente pelo módulo de armazenamento. O content
script permanece independente de React. Observadores agrupam mudanças do DOM, e
o filtro de inscrições mantém um índice efêmero de canais e cards para evitar
reprocessar toda a grade a cada troca de canal.

## Permissões e dados

A única permissão de API é `storage`. O acesso de site é limitado a
`https://www.youtube.com/*`.

As preferências são armazenadas separadamente nas chaves `hideShorts`,
`hideRelevant`, `showSubscriptionChannels`, `homeColumns` e
`subscriptionColumns`. Valores ausentes ou inválidos recebem os padrões
documentados em `knowledge/contracts.md`.

## Verificação manual antes de publicar

- Conferir Shorts na página inicial, busca, inscrições, canais e menu lateral.
- Navegar entre páginas sem recarregar a aba para validar a navegação SPA.
- Conferir “Mais relevantes” na página de inscrições.
- Testar separadamente as grades da Home e de Inscrições entre 3 e 6 colunas e
  os breakpoints de 1000 px e 700 px.
- Conferir o popup nos temas claro e escuro.
- Alternar repetidamente entre canais e verificar se os cards já indexados
  aparecem sem travamento ou nova atualização integral da grade.
- Confirmar paginação, retorno a Todos e limpeza ao desativar a barra.
- Recarregar uma instalação que já possua preferências salvas.
