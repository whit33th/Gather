export type ProposalProvider = "airbnb" | "booking" | null;

export type ProposalLinkPreview = {
  normalizedUrl: string;
  provider: ProposalProvider;
  title?: string;
  imageUrl?: string;
};

const HTML_ENTITY_MAP: Record<string, string> = {
  amp: "&",
  apos: "'",
  "#39": "'",
  "#x27": "'",
  quot: '"',
  lt: "<",
  gt: ">",
  nbsp: " ",
};

function decodeHtmlEntities(value: string) {
  return value.replace(/&([^;]+);/g, (entity, key: string) => HTML_ENTITY_MAP[key] ?? entity);
}

function stripQuotes(value: string) {
  return value.replace(/^["']|["']$/g, "").trim();
}

function extractMetaContent(html: string, property: string) {
  const patterns = [
    new RegExp(
      `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["'][^>]*>`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["'][^>]*>`,
      "i"
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return decodeHtmlEntities(stripQuotes(match[1]));
    }
  }

  return undefined;
}

function extractTitle(html: string) {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1] ? decodeHtmlEntities(stripQuotes(match[1])) : undefined;
}

export function normalizeProposalLink(value: string) {
  if (!value.trim()) return "";

  try {
    const url = new URL(value.trim());
    if (!["http:", "https:"].includes(url.protocol)) return "";
    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}

export function getProposalProvider(value?: string | null): ProposalProvider {
  if (!value) return null;

  try {
    const hostname = new URL(value).hostname.toLowerCase().replace(/^www\./, "");
    if (hostname === "booking.com" || hostname.endsWith(".booking.com")) return "booking";
    if (hostname === "airbnb.com" || hostname.endsWith(".airbnb.com")) return "airbnb";
    return null;
  } catch {
    return null;
  }
}

export function extractProposalLinkPreview(html: string, url: string): ProposalLinkPreview {
  const provider = getProposalProvider(url);
  const normalizedUrl = normalizeProposalLink(url);
  const imageCandidate =
    extractMetaContent(html, "og:image") ||
    extractMetaContent(html, "twitter:image") ||
    extractMetaContent(html, "og:image:url");

  let imageUrl: string | undefined;
  if (imageCandidate) {
    try {
      imageUrl = new URL(imageCandidate, normalizedUrl || url).toString();
    } catch {
      imageUrl = undefined;
    }
  }

  return {
    normalizedUrl,
    provider,
    title:
      extractMetaContent(html, "og:title") ||
      extractMetaContent(html, "twitter:title") ||
      extractTitle(html),
    imageUrl,
  };
}
