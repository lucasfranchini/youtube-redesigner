# Operations

Node.js `>=22`; npm scripts in `package.json` are canonical.

| Need | Command |
|---|---|
| Develop | `npm run dev` |
| Regenerate WXT types | `npm run postinstall` |
| Validate (types, lint, tests, build) | `npm run validate` |
| Package | `npm run zip` |

Release: bump SemVer in `package.json` and lockfile; update affected KB maps and `project-map.json:knowledgeVersion`; validate; inspect generated manifest; smoke-test popup, YouTube surfaces and SPA navigation. Load `.output/chrome-mv3` from `chrome://extensions` or `opera://extensions`.

Test ownership is mapped per feature in `maps/*.json`.
