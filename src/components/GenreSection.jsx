import { useState } from "react";
import { ProgressPill } from "./ProgressPill.jsx";
import { SeriesSection } from "./SeriesSection.jsx";
import { AddSeriesForm } from "./AddSeriesForm.jsx";
import { genreProgress } from "../lib/helpers.js";

export function GenreSection({ genre, editMode, onToggleBook, onDeleteBook, onDeleteSeries, onDeleteGenre, onAddBook, onAddSeries, onEditBook, onMoveSeries, allGenres, forceOpen, seriesForceOpenIds }) {
  const [manuallyOpen, setManuallyOpen] = useState(false);
  const [addingSeries, setAddingSeries] = useState(false);
  const open = forceOpen || manuallyOpen;
  const { read, total } = genreProgress(genre);
  const otherGenres = allGenres?.filter((g) => g.id !== genre.id);

  return (
    <div style={{ marginBottom: 4 }}>
      {/* Header */}
      <div className="rt-genre-toggle" onClick={() => setManuallyOpen(o => !o)} style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 14px",
        background: "#111120",
        border: "1px solid #1a1a30",
        borderLeft: "3px solid #00f0ff",
        borderRadius: "0 4px 4px 0",
        cursor: "pointer",
        transition: "opacity 0.12s",
        marginBottom: 2,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
          <span style={{
            fontSize: 13, color: "#00f0ff66",
            transform: open ? "rotate(90deg)" : "none",
            transition: "transform 0.15s", flexShrink: 0,
          }}>{"▶"}</span>
          <div>
            <h2 style={{
              margin: 0, fontSize: 17, fontWeight: 700,
              fontFamily: "'Playfair Display', Georgia, serif",
              color: "#baf9ff", letterSpacing: 0.5,
            }}>{genre.name}</h2>
            <div style={{
              fontSize: 11, color: "#54546a",
              fontFamily: "'JetBrains Mono', monospace", marginTop: 2,
            }}>
              {genre.series.length} series
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <ProgressPill read={read} total={total} />
          {editMode && (
            <button onClick={e => { e.stopPropagation(); onDeleteGenre(genre.id); }}
              style={{
                background: "none", border: "1px solid #5a2a2a", color: "#884444",
                borderRadius: 3, padding: "2px 8px", fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
              }}>DEL</button>
          )}
        </div>
      </div>

      {/* Series list */}
      {open && (
        <div className="rt-fade" style={{
          marginLeft: 12, borderLeft: "1px solid #1a1a2e", marginBottom: 6,
        }}>
          {genre.series.map(s => (
            <SeriesSection
              key={s.id} series={s} genreId={genre.id}
              editMode={editMode}
              onToggleBook={onToggleBook}
              onDeleteBook={onDeleteBook}
              onDeleteSeries={onDeleteSeries}
              onAddBook={onAddBook}
              onEditBook={onEditBook}
              onMoveSeries={onMoveSeries}
              otherGenres={otherGenres}
              forceOpen={seriesForceOpenIds?.has(s.id)}
            />
          ))}
          {editMode && !addingSeries && (
            <div style={{ padding: "8px 14px", background: "#0c0c18" }}>
              <button onClick={() => setAddingSeries(true)} style={{
                background: "none", border: "1px dashed #2a2a44", color: "#44445a",
                borderRadius: 4, padding: "6px 14px", fontSize: 12,
                fontFamily: "'JetBrains Mono', monospace", width: "100%",
              }}>+ add series</button>
            </div>
          )}
          {editMode && addingSeries && (
            <AddSeriesForm
              genreId={genre.id}
              onAdd={(gId, s) => { onAddSeries(gId, s); setAddingSeries(false); }}
              onCancel={() => setAddingSeries(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}
