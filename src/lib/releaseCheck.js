// "Has this author released something new?" checking, powered by the
// free Google Books API (https://www.googleapis.com/books/v1/volumes).
// No API key needed for simple read-only searches like this.
//
// This is a *best-effort* heuristic, not a guarantee: Google Books returns
// all sorts of editions (box sets, audiobooks, foreign-language reprints)
// under one author, and we can only compare titles as text. That's why
// results show up as "possible new releases" that you approve or dismiss,
// rather than being added to your library automatically.

const GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes";

// Re-check each author at most this often, so opening the app doesn't
// spam the API (or your connection) every single time.
export const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Lowercases and strips punctuation so "The Talon Gambit" and
// "the talon gambit!" compare as equal.
function normalizeTitle(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

// Filters out results that are technically "by this author" but aren't a
// new standalone book we'd want to flag - box sets, study guides, etc.
const NOISE_PATTERNS = /\b(box set|boxed set|bundle|collection|omnibus|sampler|summary of|study guide|companion)\b/i;

async function fetchAuthorBooks(author) {
  const url = `${GOOGLE_BOOKS_API}?q=${encodeURIComponent(`inauthor:"${author}"`)}&maxResults=40&orderBy=newest`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google Books lookup failed (${res.status})`);
  const json = await res.json();
  return (json.items || [])
    .map((item) => ({
      title: item.volumeInfo?.title || "",
      publishedDate: item.volumeInfo?.publishedDate || null,
    }))
    .filter((b) => b.title);
}

// Looks up an author on Google Books and returns any titles that don't
// match a book already in your library and haven't been dismissed before.
export async function findNewReleases(authorName, knownTitles, dismissedTitles) {
  const known = new Set(knownTitles.map(normalizeTitle));
  const dismissed = new Set(dismissedTitles.map(normalizeTitle));
  const items = await fetchAuthorBooks(authorName);

  const seen = new Set();
  const candidates = [];
  for (const item of items) {
    const norm = normalizeTitle(item.title);
    if (!norm || seen.has(norm)) continue;
    seen.add(norm);
    if (known.has(norm) || dismissed.has(norm)) continue;
    if (NOISE_PATTERNS.test(item.title)) continue;
    candidates.push(item);
  }
  return candidates;
}
