// Sanitized shape observed on /feed/channels on 2026-09-11.
// IDs, names, images and continuation tokens below are invented test values.
export const channelRenderer = (id = "UCfixtureA", handle = "Alpha", name = "Canal A") => ({
  channelRenderer: {
    channelId: id,
    title: { simpleText: name },
    navigationEndpoint: {
      commandMetadata: { webCommandMetadata: { url: `/@${handle}` } },
      browseEndpoint: { browseId: id, canonicalBaseUrl: `/@${handle}` },
    },
    thumbnail: { thumbnails: [{ url: "//yt3.googleusercontent.com/fixture", width: 88 }] },
  },
});

export const continuation = (token = "fixture-next") => ({
  continuationItemRenderer: {
    trigger: "CONTINUATION_TRIGGER_ON_ITEM_SHOWN",
    continuationEndpoint: { continuationCommand: { token, request: "CONTINUATION_REQUEST_TYPE_BROWSE" } },
  },
});

export const channelHtml = (items: unknown[] = [channelRenderer()]) => {
  const data = { contents: { twoColumnBrowseResultsRenderer: { tabs: [{ tabRenderer: {
    content: { sectionListRenderer: { contents: [{ itemSectionRenderer: { contents: [{
      shelfRenderer: { content: { expandedShelfContentsRenderer: { items } } },
    }] } }] } },
  } }] } } };
  return `<script>ytcfg.set('EMERGENCY_BASE_URL', '/error');</script>
    <script>ytcfg.set(${JSON.stringify({ LOGGED_IN: true, DATASYNC_ID: "fixture-account", SESSION_INDEX: "0", INNERTUBE_CONTEXT: { client: { clientName: "WEB" } } })});</script>
    <script>var ytInitialData = ${JSON.stringify(data)};</script>`;
};
