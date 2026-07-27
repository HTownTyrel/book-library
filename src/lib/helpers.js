// Small pure functions shared across components. Kept framework-free
// (no React/JSX here) so this logic could be reused as-is in a future
// React Native version of the app.

export function seriesProgress(series) {
  const total = series.books.length;
  const read = series.books.filter((b) => b.read).length;
  return { read, total };
}

// Adds up progress across every series written by one author.
export function authorProgress(author) {
  let read = 0, total = 0;
  author.series.forEach((s) => s.books.forEach((b) => { total++; if (b.read) read++; }));
  return { read, total };
}

export function uniqueId() {
  return Math.random().toString(36).slice(2, 9);
}

// Distinct authors in a series list, matched case-insensitively so
// "Brad Thor" and "brad thor" (an easy typo across two separate "add
// series" entries) count as the same person instead of splitting into
// two groups. Whichever casing appears first in the list wins as the
// display name.
export function uniqueAuthorNames(seriesList) {
  const seen = new Map(); // lowercased -> first-seen display casing
  seriesList.forEach((s) => {
    const raw = (s.author || "Unknown Author").trim() || "Unknown Author";
    const key = raw.toLowerCase();
    if (!seen.has(key)) seen.set(key, raw);
  });
  return Array.from(seen.values());
}

// Groups a flat series list by author, then buckets those authors into
// alphabetical letter sections (A, B, C...) - like a contacts app. Authors
// whose name doesn't start with a letter land under "#".
//
// We sort by the *whole* author string rather than trying to guess a
// "last name" - a lot of real author fields are collaborations like
// "Andrews & Wilson" or "David Bruns & JR Olson" where there's no single
// last name to extract, so guessing would just produce wrong groupings.
export function groupSeriesByAuthor(seriesList) {
  const byAuthor = new Map(); // lowercased -> { name, series }
  seriesList.forEach((s) => {
    const raw = (s.author || "Unknown Author").trim() || "Unknown Author";
    const key = raw.toLowerCase();
    if (!byAuthor.has(key)) byAuthor.set(key, { name: raw, series: [] });
    byAuthor.get(key).series.push(s);
  });

  const authors = Array.from(byAuthor.values())
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

  const byLetter = new Map();
  authors.forEach((author) => {
    const firstChar = author.name[0];
    const letter = /[a-z]/i.test(firstChar) ? firstChar.toUpperCase() : "#";
    if (!byLetter.has(letter)) byLetter.set(letter, []);
    byLetter.get(letter).push(author);
  });

  return Array.from(byLetter.entries())
    .map(([letter, authors]) => ({ letter, authors }))
    .sort((a, b) => a.letter.localeCompare(b.letter));
}
