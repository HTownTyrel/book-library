import { useState } from "react";
import { DISCOVER } from "../data/discoverData.js";
import { uniqueId } from "../lib/helpers.js";
import { btnStyle } from "../styles/sharedStyles.js";
import { NewReleaseAlerts } from "./NewReleaseAlerts.jsx";

// A suggestion counts as already in your library if a series with the
// same name and author already exists there - this is how the "Add to
// library" button knows to show "In library" instead, without needing
// any extra bookkeeping.
function isAlreadyAdded(suggestion, existingSeries) {
  return existingSeries.some((s) =>
    s.name.toLowerCase() === suggestion.series.toLowerCase() &&
    s.author.toLowerCase() === suggestion.author.toLowerCase()
  );
}

export function DiscoverSection({
  existingSeries, onAddSeries,
  releaseChecks, onAddCandidate, onDismissCandidate, onAddCandidateAsNewSeries, checkingReleases,
}) {
  const [open, setOpen] = useState(false);
  const genreMap = { litRPG: "LitRPG / Fantasy", milThrill: "Military Thriller", polThrill: "Political / Religious Thriller" };

  // Turns a curated suggestion into a real series in your library. We
  // only know the series name/author/description from Discover - not
  // individual book titles - so it starts with an empty book list, ready
  // for you to fill in (or let "Check Releases" find its books for you,
  // since it treats a series with zero known books as all-new).
  const handleAdd = (s) => {
    onAddSeries({ id: `s-${uniqueId()}`, name: s.series, author: s.author, books: [] });
  };

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
              {suggestions.map((s, i) => {
                const added = isAlreadyAdded(s, existingSeries);
                const authorSeries = existingSeries.filter(
                  (es) => es.author.toLowerCase() === s.author.toLowerCase()
                );
                const otherBooks = releaseChecks?.[s.author]?.candidates || [];
                return (
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
                    <button
                      onClick={() => handleAdd(s)}
                      disabled={added}
                      style={{
                        ...btnStyle(added ? "#39ff8a" : "#ff2bd6", added ? "#0a1c10" : "#1a0f18"),
                        marginTop: 8, opacity: added ? 0.7 : 1,
                      }}
                    >
                      {added ? "✓ In library" : "+ Add to library"}
                    </button>

                    {/* Once this author is in your library, we look up the
                        rest of their catalog on Google Books so you can add
                        more of their work without leaving Discover. */}
                    {added && checkingReleases && otherBooks.length === 0 && (
                      <div style={{ fontSize: 11, color: "#ff2bd6", fontFamily: "'JetBrains Mono', monospace", marginTop: 8 }}>
                        checking for more books by {s.author}...
                      </div>
                    )}
                    {added && otherBooks.length > 0 && (
                      <div style={{ marginTop: 10, border: "1px solid #2a1a2e", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{
                          fontSize: 11, color: "#ff9ce8", fontFamily: "'JetBrains Mono', monospace",
                          padding: "6px 10px", background: "#150a18", letterSpacing: 0.5,
                        }}>
                          MORE BY {s.author.toUpperCase()}
                        </div>
                        <NewReleaseAlerts
                          authorName={s.author}
                          series={authorSeries}
                          candidates={otherBooks}
                          onAdd={onAddCandidate}
                          onDismiss={onDismissCandidate}
                          onAddAsNewSeries={onAddCandidateAsNewSeries}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
