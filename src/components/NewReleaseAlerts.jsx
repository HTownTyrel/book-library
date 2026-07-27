import { useState } from "react";
import { inputStyle, btnStyle } from "../styles/sharedStyles.js";

// Shows the "possible new release" candidates found for one author, with
// a way to either file one into an existing series (as a new book) or
// dismiss it if it's not actually relevant (a box set, a reprint, etc).
export function NewReleaseAlerts({ authorName, series, candidates, onAdd, onDismiss }) {
  const [selectedSeriesId, setSelectedSeriesId] = useState({});

  return (
    <div style={{ background: "#1a0f1e", borderBottom: "1px solid #2a1a2e" }}>
      {candidates.map((c) => (
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
            value={selectedSeriesId[c.title] || ""}
            onChange={(e) => setSelectedSeriesId((prev) => ({ ...prev, [c.title]: e.target.value }))}
            style={{ ...inputStyle, fontSize: 11, padding: "3px 6px", maxWidth: 160 }}
          >
            <option value="">Add to series...</option>
            {series.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button
            disabled={!selectedSeriesId[c.title]}
            onClick={() => onAdd(authorName, c, selectedSeriesId[c.title])}
            style={{ ...btnStyle("#39ff8a", "#0a1c10"), opacity: selectedSeriesId[c.title] ? 1 : 0.4 }}
          >Add</button>
          <button onClick={() => onDismiss(authorName, c.title)} style={btnStyle("#444", "#111")}>Dismiss</button>
        </div>
      ))}
    </div>
  );
}
