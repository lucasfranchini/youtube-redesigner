# External dependencies

npm libraries are intentionally excluded.

| External system | Usage | Risk |
|---|---|---|
| YouTube Web | DOM, URLs, SPA events and native feed continuation sentinel | DOM and visibility behavior may change |
| YouTube authenticated channels page | Same-origin GET `/feed/channels`, embedded `ytInitialData` and JSON `ytcfg` bootstrap | Undocumented renderer/configuration shapes may change |
| YouTube internal browse endpoint | Same-origin POST `/youtubei/v1/browse` for channel-list continuations only | Undocumented session/continuation protocol; fail closed on errors |
| YouTube avatar image hosts | HTTPS avatar URLs supplied by the channel list, rendered as images | Images may be unavailable; use channel initial |
| YouTube sidebar and guide | POST `/youtubei/v1/guide` supplies channel order; visible DOM overrides order and supplies native novelty dots | Undocumented protocol; unknown states are not inferred; local acknowledgement only |
| Chromium MV3 | Content script and popup | Platform compatibility |
| WebExtension `storage.local` | Preferences | Requires `storage` permission |
| Opera GX | Optional local development | Machine-specific executable path |

No backend, database, OAuth, analytics, remote code or runtime dependency on another repository. Channel queries use the existing YouTube session and require no extra extension permissions. No YouTube Data API key. Avatars are remote images, never executable assets.

Feed refresh: the first explicit channel selection after mounting performs one authenticated GET `/feed/subscriptions` with no-store, checks the JSON bootstrap account, then assigns native `ytd-rich-grid-renderer.data` in MAIN. Later channel switches reuse the per-grid in-memory index. This undocumented property must be validated against future YouTube renderer changes; unsupported shapes leave the current feed and show retry. Chromium MAIN-world scripts require a recent Chromium version.

Protocol reference for guide retrieval (no runtime dependency added): [YouTube.js getGuide](https://github.com/LuanRT/YouTube.js/blob/main/src/Innertube.ts). This reference does not replace authenticated integration validation.

Collaboration matching: the MAIN bridge reads native card/media `.data` and data attached to author-scoped metadata elements only on demand. Supported videoRenderer and lockup wrappers, owner/byline fields, contentMetadataViewModel and inline collaborator dialogs are undocumented; renderer data must match the current watch URL by videoId/contentId, while separately scoped author DOM models are accepted as author data. Current YouTube cards can omit all model data and render a `yt-avatar-stack-view-model`; those images are matched locally to unique avatar fingerprints from the already loaded complete channel catalog. No dialog automation, name inference, extra request or runtime dependency is used. Structure reference: [YouTube.js Author collaborator parsing](https://github.com/LuanRT/YouTube.js/blob/main/src/parser/classes/misc/Author.ts). Tests cover legacy models, late metadata and a sanitized reproduction of the DOM observed on the reported public video; authenticated subscription-feed rendering still requires an installed-extension smoke test.
