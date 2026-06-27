// Small pure functions shared across components. Kept framework-free
// (no React/JSX here) so this logic could be reused as-is in a future
// React Native version of the app.
export function genreProgress(genre) {
  let read = 0, total = 0;
  genre.series.forEach((s) => s.books.forEach((b) => { total++; if (b.read) read++; }));
  return { read, total };
}

export function seriesProgress(series) {
  const total = series.books.length;
  const read = series.books.filter((b) => b.read).length;
  return { read, total };
}

export function uniqueId() {
  return Math.random().toString(36).slice(2, 9);
}
