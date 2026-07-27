import { btnStyle } from "../styles/sharedStyles.js";

// A quick-glance summary of every book currently flagged "reading",
// across your whole library, so you don't have to hunt through authors
// and series to remember what you're in the middle of.
export function CurrentlyReadingBanner({ series, onFinish, onStop }) {
  const items = [];
  series.forEach((s) => {
    s.books.forEach((b) => {
      if (b.reading) items.push({ book: b, seriesId: s.id, seriesName: s.name, author: s.author });
    });
  });
  if (items.length === 0) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        background: "#150f0a", border: "1px solid #3a2a10", borderLeft: "3px solid #ffb347",
        borderRadius: "0 4px 4px 0", padding: "10px 14px",
      }}>
        <div style={{ fontSize: 11, color: "#ffb347", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1, marginBottom: 4 }}>
          NOW READING
        </div>
        {items.map(({ book, seriesId, seriesName, author }, i) => (
          <div key={book.id} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 8, padding: "8px 0", flexWrap: "wrap",
            borderTop: i === 0 ? "none" : "1px solid #2a1c10",
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontFamily: "'Source Serif 4', Georgia, serif", color: "#e0cba8" }}>
                {book.title}
              </div>
              <div style={{ fontSize: 11, color: "#7a6a50", fontFamily: "'JetBrains Mono', monospace", marginTop: 1 }}>
                {seriesName} - {author}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button onClick={() => onFinish(seriesId, book.id)} style={btnStyle("#39ff8a", "#0a1c10")}>Finished</button>
              <button onClick={() => onStop(seriesId, book.id)} style={btnStyle("#444", "#111")}>Stop</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
