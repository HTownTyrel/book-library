import { useState } from "react";
import { ProgressPill } from "./ProgressPill.jsx";
import { SeriesSection } from "./SeriesSection.jsx";
import { NewReleaseAlerts } from "./NewReleaseAlerts.jsx";
import { authorProgress } from "../lib/helpers.js";

// One collapsible block per author, containing every series of theirs -
// this replaced the old per-genre grouping. `candidates` are any
// possible-new-release results found for this author (see
// lib/releaseCheck.js); when present, a small dot shows in the header
// even while collapsed so you know something's waiting inside.
export function AuthorSection({
  author, editMode,
  onToggleBook, onDeleteBook, onDeleteSeries, onAddBook, onEditBook, onEditSeries,
  forceOpen, seriesForceOpenIds,
  candidates, onAddCandidate, onDismissCandidate, onAddCandidateAsNewSeries,
}) {
  const [manuallyOpen, setManuallyOpen] = useState(false);
  const open = forceOpen || manuallyOpen;
  const { read, total } = authorProgress(author);
  const candidateCount = candidates?.length || 0;

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
            }}>{author.name}</h2>
            <div style={{
              fontSize: 11, color: "#54546a",
              fontFamily: "'JetBrains Mono', monospace", marginTop: 2,
            }}>
              {author.series.length} series
              {candidateCount > 0 && (
                <span style={{ color: "#ff2bd6", marginLeft: 8 }}>
                  {"● "}{candidateCount} possible new release{candidateCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>
        <ProgressPill read={read} total={total} />
      </div>

      {/* Series list */}
      {open && (
        <div className="rt-fade" style={{
          marginLeft: 12, borderLeft: "1px solid #1a1a2e", marginBottom: 6,
        }}>
          {candidateCount > 0 && (
            <NewReleaseAlerts
              authorName={author.name}
              series={author.series}
              candidates={candidates}
              onAdd={onAddCandidate}
              onDismiss={onDismissCandidate}
              onAddAsNewSeries={onAddCandidateAsNewSeries}
            />
          )}
          {author.series.map(s => (
            <SeriesSection
              key={s.id} series={s}
              editMode={editMode}
              onToggleBook={onToggleBook}
              onDeleteBook={onDeleteBook}
              onDeleteSeries={onDeleteSeries}
              onAddBook={onAddBook}
              onEditBook={onEditBook}
              onEditSeries={onEditSeries}
              forceOpen={seriesForceOpenIds?.has(s.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
