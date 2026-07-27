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

// Groups a flat series list by author, then buckets those authors into
// alphabetical letter sections (A, B, C...) - like a contacts app. Authors
// whose name doesn't start with a letter land under "#".
//
// We sort by the *whole* author string rather than trying to guess a
// "last name" - a lot of real author fields are collaborations like
// "Andrews & Wilson" or "David Bruns & JR Olson" where there's no single
// last name to extract, so guessing would just produce wrong groupings.
export function groupSeriesByAuthor(seriesList) {
  const byAuthor = new Map();
  seriesList.forEach((s) => {
    const key = (s.author || "Unknown Author").trim() || "Unknown Author";
    if (!byAuthor.has(key)) byAuthor.set(key, []);
    byAuthor.get(key).push(s);
  });

  const authors = Array.from(byAuthor.entries())
    .map(([name, series]) => ({ name, series }))
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
