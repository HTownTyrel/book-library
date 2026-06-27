export function BookRow({ book, seriesId, genreId, onToggle, editMode, onDelete, onEdit }) {
  const isUnreleased = !book.released;
  return (
    <div className="rt-book-row" style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "7px 14px 7px 36px",
      borderBottom: "1px solid #0f0f1a",
      background: "transparent",
      transition: "background 0.12s",
    }}>
      <input
        type="checkbox"
        checked={!!book.read}
        disabled={isUnreleased}
        onChange={() => onToggle(genreId, seriesId, book.id)}
        style={{ width: 15, height: 15 }}
      />
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        color: "#3a3a55",
        minWidth: 22,
        flexShrink: 0,
      }}>
        {book.bookNum % 1 === 0 ? `${book.bookNum}` : book.bookNum}
      </span>
      <span style={{
        fontSize: 15,
        fontFamily: "'Source Serif 4', Georgia, serif",
        color: book.read ? "#3f6e50" : isUnreleased ? "#3a3a52" : "#c8c8dc",
        textDecoration: book.read ? "line-through" : "none",
        fontStyle: isUnreleased ? "italic" : "normal",
        flex: 1,
        lineHeight: 1.35,
      }}>
        {book.title}
        {isUnreleased && (
          <span style={{ fontSize: 12, color: "#454560", marginLeft: 8 }}>
            ({book.releaseDate})
          </span>
        )}
      </span>
      {editMode && (
        <>
          <button onClick={() => onEdit(book.id)} style={{
            background: "none", border: "none",
            color: "#00f0ff", fontSize: 12, padding: "0 4px",
            opacity: 0.7, transition: "opacity 0.1s",
          }} title="Edit book"
            onMouseOver={e => e.target.style.opacity = 1}
            onMouseOut={e => e.target.style.opacity = 0.7}
          >EDIT</button>
          <button onClick={() => onDelete(genreId, seriesId, book.id)} style={{
            background: "none", border: "none",
            color: "#5a2a2a", fontSize: 14, padding: "0 4px",
            opacity: 0.6, transition: "opacity 0.1s",
          }} title="Delete book"
            onMouseOver={e => e.target.style.opacity = 1}
            onMouseOut={e => e.target.style.opacity = 0.6}
          >{"✕"}</button>
        </>
      )}
    </div>
  );
}
