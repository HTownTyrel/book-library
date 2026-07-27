import { useState } from "react";
import { inputStyle, btnStyle } from "../styles/sharedStyles.js";

// A special option in the series dropdown, distinct from any real series
// id, that means "this isn't part of a series I already have - make a
// new one."
const NEW_SERIES = "__new_series__";

// Shows the "possible new release" candidates found for one author, with
// a way to file one into an existing series (as a new book), start a
// brand-new series with it, or dismiss it if it's not actually relevant
// (a box set, a reprint, etc).
export function NewReleaseAlerts({ authorName, series, candidates, onAdd, onDismiss, onAddAsNewSeries }) {
  const [choice, setChoice] = useState({}); // candidate title -> series id or NEW_SERIES
  const [newSeriesName, setNewSeriesName] = useState({}); // candidate title -> typed name

  const handleAdd = (c) => {
    const picked = choice[c.title];
    if (!picked) return;
    if (picked === NEW_SERIES) {
      const name = (newSeriesName[c.title] || "").trim();
      if (!name) return;
      onAddAsNewSeries(authorName, c, name);
    } else {
      onAdd(authorName, c, picked);
    }
  };

  return (
    <div style={{ background: "#1a0f1e", borderBottom: "1px solid #2a1a2e" }}>
      {candidates.map((c) => {
        const picked = choice[c.title] || "";
        const readyToAdd = picked === NEW_SERIES ? !!(newSeriesName[c.title] || "").trim() : !!picked;
        return (
          <div key={c.title} style={{
            padding: "10px 14px",
            borderBottom: "1px solid #24142a",
            display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center",
          }}>
            <span style={{
              fontSize: 10, color: "#ff2bd6", border: "1px solid #ff2bd644",
              borderRadius: 3, padding: "1px 6px", fontFamily: "'JetBrains Mono', monospace",
            }}>NEW?</span>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontSize: 14, fontFamily: "'Source Serif 4', Georgia, serif", color: "#e0c8dc" }}>
                {c.title}
              </div>
              {c.publishedDate && (
                <div style={{ fontSize: 11, color: "#7a5a70", fontFamily: "'JetBrains Mono', monospace", marginTop: 1 }}>
                  Google Books lists: {c.publishedDate}
                </div>
              )}
            </div>
            <select
              value={picked}
              onChange={(e) => setChoice((prev) => ({ ...prev, [c.title]: e.target.value }))}
              style={{ ...inputStyle, fontSize: 11, padding: "3px 6px", maxWidth: 160 }}
            >
              <option value="">Add to series...</option>
              {series.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              <option value={NEW_SERIES}>+ New series...</option>
            </select>
            {picked === NEW_SERIES && (
              <input
                value={newSeriesName[c.title] || ""}
                onChange={(e) => setNewSeriesName((prev) => ({ ...prev, [c.title]: e.target.value }))}
                placeholder="New series name"
                style={{ ...inputStyle, fontSize: 11, padding: "3px 6px", width: 140 }}
                autoFocus
              />
            )}
            <button
              disabled={!readyToAdd}
              onClick={() => handleAdd(c)}
              style={{ ...btnStyle("#39ff8a", "#0a1c10"), opacity: readyToAdd ? 1 : 0.4 }}
            >Add</button>
            <button onClick={() => onDismiss(authorName, c.title)} style={btnStyle("#444", "#111")}>Dismiss</button>
          </div>
        );
      })}
    </div>
  );
}
