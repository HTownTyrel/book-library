// Looks up a cover thumbnail for one specific book on Google Books, used
// to show a small cover image next to each series (its first book stands
// in as the series' cover). Separate from releaseCheck.js since this
// searches for one exact title instead of scanning everything by an
// author - a different job, even though it hits the same free API.
import { GOOGLE_BOOKS_API_KEY } from "./googleBooksApiKey.js";

const GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes";

export async function fetchBookCover(title, author) {
  const q = `intitle:"${title}" inauthor:"${author}"`;
  const url = `${GOOGLE_BOOKS_API}?q=${encodeURIComponent(q)}&maxResults=1&key=${GOOGLE_BOOKS_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google Books lookup failed (${res.status})`);
  const json = await res.json();
  const thumbnail = json.items?.[0]?.volumeInfo?.imageLinks?.thumbnail;
  if (!thumbnail) return null;
  // Google sometimes serves these over plain http, which a page loaded
  // over https silently blocks as mixed content - upgrade it.
  return thumbnail.replace(/^http:/, "https:");
}
