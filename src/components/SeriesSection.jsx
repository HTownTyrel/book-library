import { useState } from "react";
import { ProgressPill } from "./ProgressPill.jsx";
import { BookRow } from "./BookRow.jsx";
import { AddBookForm } from "./AddBookForm.jsx";
import { EditBookForm } from "./EditBookForm.jsx";
import { seriesProgress } from "../lib/helpers.js";

// When `forceOpen` is true (e.g. while a search is active and this series
// has a match), the section stays expanded regardless of the user's own
// click-to-toggle state.
export function SeriesSection({ series, genreId, editMode, onToggleBook, onDeleteBook, onDeleteSeries, onAddBook, onEditBook, onMoveSeries, otherGenres, forceOpen }) {
  const [manuallyOpen, setManuallyOpen] = useState(false);
  const [addingBook, setAddingBook] = useState(false);
  const [editingBookId, setEditingBookId] = useState(null);
  const open = forceOpen || manuallyOpen;
  const { read, total } = seriesProgress(series);
  const editingBook = editingBookId ? series.books.find((b) => b.id === editingBookId) : null;

  return (
    <div style={{ marginBottom: 2 }}>
      {/* Header */}
      <div className="rt-series-toggle" onClick={() => setManuallyOpen(o => !o)} style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 14px", background: "#0e0e1c",
        borderBottom: "1px solid #14142a", transition: "background 0.12s",
        cursor: "pointer",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
          <span style={{
            fontSize: 12, color: "#3a3a5a",
            transform: open ? "rotate(90deg)" : "none",
            transition: "transform 0.15s", flexShrink: 0,
          }}>{"▶"}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 14, fontWeight: 600,
              fontFamily: "'Source Serif 4', Georgia, serif",
              color: "#a8a8cc", lineHeight: 1.2, letterSpacing: 0.2,
            }}>
              {series.name}
            </div>
            <div style={{ fontSize: 11, color: "#44445a", fontFamily: "'JetBrains Mono', monospace", marginTop: 1 }}>
              {series.author}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <ProgressPill read={read} total={total} small />
          {editMode && otherGenres && otherGenres.length > 0 && (
            <select
              value=""
              onClick={e => e.stopPropagation()}
              onChange={e => { if (e.target.value) onMoveSeries(genreId, series.id, e.target.value); }}
              style={{
                background: "#14142a", border: "1px solid #2a2a44", color: "#a8a8cc",
                borderRadius: 3, fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                padding: "1px 2px", maxWidth: 90,
              }}
              title="Move series to another genre"
            >
              <option value="">Move to...</option>
              {otherGenres.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          )}
          {editMode && (
            <button onClick={e => { e.stopPropagation(); onDeleteSeries(genreId, series.id); }}
              style={{
                background: "none", border: "1px solid #5a2a2a", color: "#884444",
                borderRadius: 3, padding: "1px 6px", fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
              }}>DEL</button>
          )}
        </div>
      </div>

      {/* Books */}
      {open && (
        <div className="rt-fade">
          {series.books.map(book => (
            editingBookId === book.id ? (
              <EditBookForm
                key={book.id}
                book={book}
                onSave={(bookId, updates) => { onEditBook(genreId, series.id, bookId, updates); setEditingBookId(null); }}
                onCancel={() => setEditingBookId(null)}
              />
            ) : (
              <BookRow
                key={book.id} book={book} seriesId={series.id} genreId={genreId}
                onToggle={onToggleBook} editMode={editMode} onDelete={onDeleteBook}
                onEdit={setEditingBookId}
              />
            )
          ))}
          {editMode && !addingBook && (
            <div style={{ padding: "6px 14px 6px 36px", background: "#0c0c18" }}>
              <button onClick={() => setAddingBook(true)} style={{
                background: "none", border: "1px dashed #2a2a44", color: "#44445a",
                borderRadius: 4, padding: "4px 12px", fontSize: 12,
                fontFamily: "'JetBrains Mono', monospace", width: "100%",
              }}>+ add book</button>
            </div>
          )}
          {editMode && addingBook && (
            <AddBookForm
              seriesId={series.id} genreId={genreId}
              onAdd={(gId, sId, book) => { onAddBook(gId, sId, book); setAddingBook(false); }}
              onCancel={() => setAddingBook(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}
