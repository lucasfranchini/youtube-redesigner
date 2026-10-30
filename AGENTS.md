# Regras do projeto

## Escopo

- Extensão Chromium MV3 com WXT, TypeScript estrito, npm e Node.js `>=22`.
- React existe somente no popup; o content script permanece independente.
- Não adicione dependências, permissões, domínios, background, telemetria, chamadas ou código remoto sem necessidade explícita.

## Arquitetura

- Siga as fronteiras de `knowledge/maps/project.json`; mantenha entrypoints pequenos e CSS do YouTube junto do content script.
- Fluxo permitido: entrypoints → páginas/YouTube/storage; páginas → componentes/hooks; hooks → storage/utils/constantes/tipos; YouTube/storage → utils/constantes/tipos; utils → constantes/tipos.
- Integrações com o DOM e modelos nativos ficam em `src/youtube`, agrupadas por superfície e capacidade. Persistência fica em `src/storage`; não recrie uma pasta genérica `services`.
- Cada módulo de comportamento expõe uma operação pública principal. Funções privadas devem apenas apoiar essa operação; rede, filtro, paginação, UI, observação e bridge ficam em arquivos distintos.
- Componentes não acessam storage, utils são puras e `src/types` contém somente tipos.
- Use `@/` entre camadas, imports relativos para arquivos próximos e `import type` para tipos. Não crie agregadores sem necessidade concreta.

## Base de conhecimento

- Comece em `knowledge/project-map.json` e abra somente os mapas necessários para a tarefa.
- Antes de alterar uma funcionalidade, leia seu mapa e preserve `knowledge/contracts.md`.
- Toda mudança deve revisar e atualizar os mapas afetados; `knowledgeVersion` existe somente em `project-map.json`.
- `knowledge/dependencies.md` documenta apenas APIs, plataformas, sites e projetos externos, não pacotes npm.

## Entrega

- Atualize testes quando o comportamento mudar.
- Em novo build, incremente SemVer em `package.json`, `package-lock.json` e `knowledgeVersion`.
- Execute `npm run validate` antes de concluir e `npm run postinstall` após alterar configuração ou entrypoints WXT.
- Não edite `.wxt`, `.output`, `coverage` ou `node_modules`.
