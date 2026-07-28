// Parse a LinkedIn post URL, embed URL, or <iframe> snippet into an embed src.
// Returns null if the input cannot be recognized as a LinkedIn embed.
function withCollapsed(src: string): string {
  if (/[?&]collapsed=/i.test(src)) return src;
  return src + (src.includes("?") ? "&" : "?") + "collapsed=1";
}

export function parseLinkedInEmbed(input: string): string | null {
  if (!input) return null;
  const raw = input.trim();

  // Case 1: full <iframe ... src="..."> snippet
  const iframeMatch = raw.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i);
  if (iframeMatch) {
    const src = iframeMatch[1];
    if (/^https:\/\/www\.linkedin\.com\/embed\//i.test(src)) return withCollapsed(src);
    return null;
  }

  // Case 2: already an embed URL
  if (/^https:\/\/www\.linkedin\.com\/embed\/feed\/update\/urn:li:/i.test(raw)) {
    return withCollapsed(raw);
  }

  // Case 3: LinkedIn post URL, e.g.
  // https://www.linkedin.com/posts/username_slug-activity-1234567890123456789-abcd
  const activityMatch = raw.match(/activity[:-](\d{10,})/i);
  if (activityMatch && /linkedin\.com/i.test(raw)) {
    return withCollapsed(`https://www.linkedin.com/embed/feed/update/urn:li:activity:${activityMatch[1]}`);
  }

  // Case 4: share/ugcPost URN pasted directly
  const urnMatch = raw.match(/urn:li:(share|ugcPost|activity):(\d+)/i);
  if (urnMatch) {
    return withCollapsed(`https://www.linkedin.com/embed/feed/update/urn:li:${urnMatch[1]}:${urnMatch[2]}`);
  }

  return null;
}

// Extract the embed src stored in a content HTML (div.linkedin-embed[data-src]).
export function extractEmbedSrcFromHtml(html: string | null | undefined): string | null {
  if (!html) return null;
  const m = html.match(/<div[^>]*class=["'][^"']*linkedin-embed[^"']*["'][^>]*data-src=["']([^"']+)["']/i)
    || html.match(/data-src=["']([^"']+)["'][^>]*class=["'][^"']*linkedin-embed/i)
    || html.match(/<iframe[^>]*\ssrc=["'](https:\/\/www\.linkedin\.com\/embed\/[^"']+)["']/i);
  return m ? m[1] : null;
}

// Convert a LinkedIn embed URL to the canonical post URL (so clicks open the post).
export function embedSrcToPostUrl(src: string): string {
  const m = src.match(/urn:li:(activity|share|ugcPost):(\d+)/i);
  if (!m) return src;
  return `https://www.linkedin.com/feed/update/urn:li:${m[1]}:${m[2]}/`;
}

// Build the standard embed HTML block stored in `content`.
export function buildEmbedHtml(src: string): string {
  return `<div class="linkedin-embed" data-src="${src}" data-height="542" data-width="504"><iframe src="${src}" height="542" width="504" frameborder="0" allowfullscreen="" title="Publicação incorporada" loading="lazy"></iframe></div>`;
}
