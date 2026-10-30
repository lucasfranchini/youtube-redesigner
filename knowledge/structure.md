# Structure

Exact entrypoints and layers are in `maps/project.json`; feature files and tests are in the other `maps/*.json` files routed by `project-map.json`.

| `src/` path | Ownership |
|---|---|
| `entrypoints` | Small WXT bootstraps and injected CSS |
| `pages` | Full-screen composition |
| `components` | React UI with colocated CSS Modules |
| `hooks` | React state/lifecycle |
| `youtube` | YouTube DOM integration, grouped by page, subscriptions and MAIN bridge |
| `storage` | WebExtension preference persistence and observation |
| `utils` | Pure calculations |
| `constants` | Static values and selectors |
| `types` | Types only |
| `styles` | Popup global CSS |

YouTube modules are grouped first by surface, then by one primary operation per file. Small private helpers may support that operation; unrelated lifecycle, filtering, pagination, network or bridge behavior belongs in separate files. Tests mirror these domains under `tests/youtube` and `tests/storage`. Never edit `.wxt`, `.output`, `coverage` or `node_modules`. `web-ext.config.ts` is optional local configuration and is Git-ignored.
