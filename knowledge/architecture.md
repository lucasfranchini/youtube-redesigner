# Architecture

Four independent WXT entrypoints:

```text
popup entry -> React page -> components + usePreferences -> storage
core content entry -> youtube/page + youtube/shorts + youtube/relevant -> utils/constants/types
channels content entry -> youtube/subscriptions -> utils/constants/types
MAIN bridge entry -> youtube/bridge -> native renderer data only
```

React stays in the popup. `src/storage` is the only WebExtension persistence boundary. `src/youtube` owns all integration with the YouTube document, authenticated same-origin pages and native renderer models; these modules are grouped by surface rather than hidden behind a generic service layer. Each behavior file exposes one primary operation.

The core content script starts at `document_start`, applies stored preferences to the current `<html>`, reconciles Shorts/relevant markers and lets injected CSS hide or resize targets. Its DOM observer coalesces added nodes, relevant attribute changes and title text changes. Recycled cards are re-evaluated so obsolete markers are removed. SPA navigation schedules a full reconciliation.

The subscriptions controller coordinates lifecycle and delegates catalog loading, carousel rendering, filtering, pagination, refresh and sidebar novelty to separate modules. The filter builds an in-memory bidirectional index between channel IDs and native cards. Author metadata is read once per card signature; modern collaboration stacks are matched to the already loaded catalog by unique avatar fingerprint. Changing channels updates only the visibility difference between indexed sets. Pagination indexes only added roots. Replacing the native grid invalidates the index.

The first explicit channel selection after the subscriptions surface is mounted refreshes the authenticated feed without navigation. Further channel changes reuse the current indexed feed. The isolated controller validates account and renderer structure before handing grid JSON to the MAIN bridge. The bridge exposes no storage or network APIs. Navigation, disabling and WXT invalidation cancel owned work and remove UI/filter state.

The core and carousel remain independent: a catalog, bridge or carousel failure cannot prevent Shorts, relevant-section or grid preferences from initializing.
