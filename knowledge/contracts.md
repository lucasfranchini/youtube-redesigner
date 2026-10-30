# Contracts

## Preferences

Separate `storage.local` keys; missing or invalid values use defaults.

| Key | Type | Default | Validation |
|---|---|---:|---|
| `hideShorts` | boolean | `true` | boolean |
| `hideRelevant` | boolean | `true` | boolean |
| `showSubscriptionChannels` | boolean | `true` | boolean |
| `homeColumns` | number | `4` | integer `3..6` |
| `subscriptionColumns` | number | `4` | integer `3..6` |

## Runtime

Chrome MV3; permission `storage`; match `https://www.youtube.com/*`; core content script at `document_start`, independent channel-carousel content script at `document_idle`; no background, remote code or telemetry. Carousel failures must not prevent Shorts/relevant markers, grid preferences or their SPA listeners from initializing. The core resolves the current document root on each application rather than retaining a possibly missing startup root.

## YouTube DOM

| State | Meaning |
|---|---|
| `data-yte-hide-shorts` | Shorts preference |
| `data-yte-hide-relevant` | relevant-section preference |
| `data-yte-page="home|subscriptions|other"` | route class |
| `data-yte-shorts="card|channel-tab|menu|shelf"` | Shorts target |
| `data-yte-relevant` | relevant-section target |
| `--yte-home-cols` | home column count |
| `--yte-cols` | subscription column count |
| `data-yte-channel-header` | owned subscriptions carousel |
| `data-yte-channel-filter` | native grid has a selected channel |
| `data-yte-channel-hidden` | card/group excluded by the selected channel |
| `data-yte-channel-loading` | temporarily reveal the native continuation sentinel |

Home route: `/`. Subscriptions route: `/feed/subscriptions`. Selectors and dataset keys are centralized in `src/constants/youtube.ts` and `src/constants/subscriptionChannels.ts`. Components never access browser/WXT APIs directly.

## Subscription channels

The carousel uses native DOM/CSS, no React. All subscriptions are fetched from the authenticated same-origin channels page, with browse continuations when present. JSON is parsed, never executed. Only a complete catalog is shown; missing session data, unknown structure or failed continuation produces a retry state and leaves the native feed available.

Channel IDs are stable identities; canonical channel URLs and normalized handles provide the matching aliases. Author metadata from native video renderers and author-scoped content metadata models supplies stable channel IDs when available. Modern collaboration cards may expose no model data and instead render a `yt-avatar-stack-view-model`; its avatar image fingerprints are matched against the current complete subscription catalog, and only unique catalog matches become channel IDs. Names are never used as identities. A synchronous MAIN-world bridge reads only author/byline fields after matching the current watch URL video ID, plus native data attached to author-scoped DOM models; menu and description IDs are not owners. Its temporary data-yte-video-owners response attribute is removed immediately. The isolated filter keeps only an ephemeral WeakMap keyed by card/video/link/author-text/avatar signature and a per-grid channel-to-card index; late collaboration metadata, recycled cards and grid replacement invalidate the relevant entries. There are no per-video requests or persistent caches. Unknown owners (including unmatched collaboration avatars and Shorts without a channel link) are excluded while a channel is selected. All native content is restored by Todos or by disabling the preference; existing Shorts/relevant preferences still apply.

Selection survives SPA navigation in the same tab, but not reload, disabling or a changed account identity. The catalog is fetched again on re-entry to validate the account. Catalog data remains in memory, with no persistent channel cache. The first explicit channel selection after mounting requests fresh subscriptions HTML with no-store and updates only the native grid data via a local MAIN-world bridge. Later channel switches reuse the indexed grid; pagination adds new cards to the same index. Account identity is checked before refresh application. Selection stays in memory; no sessionStorage handoff and no document reload. No background requests or new permissions. Avatar changes also invalidate the active catalog and index.

Filtered pagination is owned by YouTube: reveal its sentinel for one page, wait for new cards, index only the added roots, then hide it again. Each round is limited to five pages and stops when the viewport is filled; the user can request another round. Disabling/navigation cancels extension work and future triggers; an already dispatched YouTube-owned request may finish normally. Pagination remains native; the once-per-mount refresh replaces grid data including its continuation state and rebuilds the card index.

The channel bar follows native theme variables with html[dark] fallbacks, occupies block flow with a 24px trailing gap, and uses stacking level 1 below native overlays.

Sidebar subscription links determine carousel priority by stable channel aliases. Unlisted channels retain the native catalog order. Video status/spinner/retry live after the grid; catalog loading and errors are shown inside the header so an empty carousel never hides its diagnostic below the feed. Available native newness dots are mirrored in blue avatar borders. Clicking either surface acknowledges locally in memory, hides the dot with an owned marker, and clears the border. Reset on account/toggle, native dot off/on, or 30-minute expiry checked on the next menu update. Unknown channels receive no inferred novelty. This does not acknowledge read state on the server.

Order is read from the same-origin guide endpoint, with actual rendered subscription entries overriding the corresponding order. Guide HTTP, network, JSON or shape errors do not invalidate a complete channel catalog. Rendered sidebar order remains authoritative; channels without available guide order retain native catalog order. Catalog pagination failures still reject incomplete results. The grid bridge accepts only JSON with an array of contents on the subscriptions route, never scripts, and does not fetch or expose extension APIs.

Explicit channel/Todos selection returns to the top immediately so the first row starts below the sticky bar. Native grid scroll anchoring is disabled only while the bar is mounted. SPA restoration, background scanning, pagination and refresh completion preserve user scroll; no repeated scroll reset on incoming responses.
