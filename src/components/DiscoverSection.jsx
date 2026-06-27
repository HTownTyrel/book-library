import { useState } from "react";
import { DISCOVER } from "../data/discoverData.js";

export function DiscoverSection() {
  const [open, setOpen] = useState(false);
  const genreMap = { litRPG: "LitRPG / Fantasy", milThrill: "Military Thriller", polThrill: "Political / Religious Thriller" };

  return (
    <div style={{ marginTop: 32 }}>
      <div onClick={() => setOpen(o => !o)} style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 14px",
        background: "#0e0e20",
        border: "1px solid #1a1a30",
        borderLeft: "3px solid #ff2bd6",
        borderRadius: "0 4px 4px 0",
        cursor: "pointer",
        opacity: 0.9,
      }}
        className="rt-genre-toggle"
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: "#ff2bd666", transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s", fontSize: 13 }}>{"▶"}</span>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontFamily: "'Playfair Display', Georgia, serif", color: "#ff9ce8", fontWeight: 700 }}>
              Discover
            </h2>
            <div style={{ fontSize: 11, color: "#44445a", fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
              curated suggestions based on your list
            </div>
          </div>
        </div>
        <span style={{ fontSize: 11, color: "#ff2bd6", fontFamily: "'JetBrains Mono', monospace", border: "1px solid #ff2bd644", padding: "2px 8px", borderRadius: 4 }}>
          {Object.keys(DISCOVER).reduce((a, k) => a + DISCOVER[k].length, 0)} picks
        </span>
      </div>

      {open && (
        <div className="rt-fade" style={{ marginLeft: 12, borderLeft: "1px solid #1a1a2e" }}>
          {Object.entries(DISCOVER).map(([key, suggestions]) => (
            <div key={key}>
              <div style={{
                padding: "8px 14px", fontSize: 12,
                fontFamily: "'JetBrains Mono', monospace",
                color: "#ff2bd6", background: "#0c0c18",
                borderBottom: "1px solid #14142a", letterSpacing: 1,
                textTransform: "uppercase",
              }}>
                {genreMap[key]}
              </div>
              {suggestions.map((s, i) => (
                <div key={i} style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid #0f0f1a",
                  background: i % 2 === 0 ? "#0b0b16" : "#0d0d1a",
                }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ fontSize: 15, fontFamily: "'Source Serif 4', Georgia, serif", color: "#b0b0d0", fontWeight: 600 }}>
                      {s.series}
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
                      <span style={{
                        fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                        color: "#ff2bd6", border: "1px solid #ff2bd644",
                        padding: "1px 6px", borderRadius: 3,
                      }}>{s.books} books</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "#44445a", fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
                    {s.author}
                  </div>
                  <div style={{ fontSize: 13, color: "#6a6a88", marginTop: 6, fontFamily: "'Source Serif 4', Georgia, serif", fontStyle: "italic", lineHeight: 1.4 }}>
                    {s.desc}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
