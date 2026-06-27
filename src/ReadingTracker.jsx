import { useState, useEffect, useCallback, useMemo } from "react";
import { INITIAL_DATA } from "./data/initialData.js";
import { GLOBAL_CSS } from "./styles/globalCss.js";
import { inputStyle, btnStyle } from "./styles/sharedStyles.js";
import { loadFromStorage, saveToStorage, encodeState, decodeState } from "./lib/storage.js";
import { genreProgress, uniqueId } from "./lib/helpers.js";
import { GenreSection } from "./components/GenreSection.jsx";
import { DiscoverSection } from "./components/DiscoverSection.jsx";

// A series matches a search query if the query appears in the series
// name, the author, or any book title within it.
function seriesMatchesQuery(series, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  if (series.name.toLowerCase().includes(q)) return true;
  if (series.author.toLowerCase().includes(q)) return true;
  return series.books.some((b) => b.title.toLowerCase().includes(q));
}

export default function ReadingTracker() {
  // Load saved progress from localStorage on first render, falling back
  // to the starter data if nothing has been saved yet.
  const [data, setData] = useState(() => loadFromStorage() ?? INITIAL_DATA);
  const [editMode, setEditMode] = useState(false);
  const [addingGenre, setAddingGenre] = useState(false);
  const [newGenreName, setNewGenreName] = useState("");
  const [modal, setModal] = useState(null); // null | "backup" | "restore"
  const [loadText, setLoadText] = useState("");
  const [loadError, setLoadError] = useState("");
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Inject CSS once
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = GLOBAL_CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Every time `data` changes (a book gets checked off, a series gets
  // added, etc.) this effect runs and writes the latest state to
  // localStorage, so your progress survives a page refresh automatically.
  useEffect(() => {
    saveToStorage(data);
  }, [data]);

  const handleCopy = useCallback(() => {
    const encoded = encodeState(data);
    navigator.clipboard.writeText(encoded)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })
      .catch(() => {/* clipboard blocked; user can select manually */});
  }, [data]);

  const handleLoad = useCallback(() => {
    const decoded = decodeState(loadText);
    if (!decoded || !decoded.genres) {
      setLoadError("Invalid data - make sure you pasted the complete backup string.");
      return;
    }
    setData(decoded);
    setLoadText("");
    setLoadError("");
    setModal(null);
  }, [loadText]);

  const handleToggleBook = useCallback((genreId, seriesId, bookId) => {
    setData((prev) => ({
      ...prev,
      genres: prev.genres.map((g) =>
        g.id !== genreId ? g : {
          ...g,
          series: g.series.map((s) =>
            s.id !== seriesId ? s : {
              ...s,
              books: s.books.map((b) => b.id !== bookId ? b : { ...b, read: !b.read }),
            }
          ),
        }
      ),
    }));
  }, []);

  const handleDeleteBook = useCallback((genreId, seriesId, bookId) => {
    if (!window.confirm("Delete this book?")) return;
    setData((prev) => ({
      ...prev,
      genres: prev.genres.map((g) =>
        g.id !== genreId ? g : {
          ...g,
          series: g.series.map((s) =>
            s.id !== seriesId ? s : { ...s, books: s.books.filter((b) => b.id !== bookId) }
          ),
        }
      ),
    }));
  }, []);

  const handleDeleteSeries = useCallback((genreId, seriesId) => {
    if (!window.confirm("Delete this entire series and all its books?")) return;
    setData((prev) => ({
      ...prev,
      genres: prev.genres.map((g) =>
        g.id !== genreId ? g : { ...g, series: g.series.filter((s) => s.id !== seriesId) }
      ),
    }));
  }, []);

  const handleDeleteGenre = useCallback((genreId) => {
    if (!window.confirm("Delete this genre and EVERYTHING in it?")) return;
    setData((prev) => ({
      ...prev,
      genres: prev.genres.filter((g) => g.id !== genreId),
    }));
  }, []);

  const handleAddBook = useCallback((genreId, seriesId, book) => {
    setData((prev) => ({
      ...prev,
      genres: prev.genres.map((g) =>
        g.id !== genreId ? g : {
          ...g,
          series: g.series.map((s) =>
            s.id !== seriesId ? s : {
              ...s,
              books: [...s.books, book].sort((a, b) => a.bookNum - b.bookNum),
            }
          ),
        }
      ),
    }));
  }, []);

  const handleAddSeries = useCallback((genreId, series) => {
    setData((prev) => ({
      ...prev,
      genres: prev.genres.map((g) =>
        g.id !== genreId ? g : { ...g, series: [...g.series, series] }
      ),
    }));
  }, []);

  const handleEditBook = useCallback((genreId, seriesId, bookId, updates) => {
    setData((prev) => ({
      ...prev,
      genres: prev.genres.map((g) =>
        g.id !== genreId ? g : {
          ...g,
          series: g.series.map((s) =>
            s.id !== seriesId ? s : {
              ...s,
              books: s.books
                .map((b) => b.id !== bookId ? b : { ...b, ...updates })
                .sort((a, b) => a.bookNum - b.bookNum),
            }
          ),
        }
      ),
    }));
  }, []);

  // Moves a whole series (and its books) from one genre to another -
  // e.g. once you start reading a Discover suggestion and want it filed
  // under a real category instead of staying loose.
  const handleMoveSeries = useCallback((fromGenreId, seriesId, toGenreId) => {
    setData((prev) => {
      const fromGenre = prev.genres.find((g) => g.id === fromGenreId);
      const series = fromGenre?.series.find((s) => s.id === seriesId);
      if (!series) return prev;
      return {
        ...prev,
        genres: prev.genres.map((g) => {
          if (g.id === fromGenreId) return { ...g, series: g.series.filter((s) => s.id !== seriesId) };
          if (g.id === toGenreId) return { ...g, series: [...g.series, series] };
          return g;
        }),
      };
    });
  }, []);

  const handleAddGenre = () => {
    if (!newGenreName.trim()) return;
    const genre = { id: `g-${uniqueId()}`, name: newGenreName.trim(), series: [] };
    setData((prev) => ({ ...prev, genres: [...prev.genres, genre] }));
    setNewGenreName(""); setAddingGenre(false);
  };

  // Filter genres/series down to whatever matches the search box. When
  // there's no query, everything passes through unchanged.
  const trimmedQuery = searchQuery.trim();
  const visibleGenres = useMemo(() => {
    if (!trimmedQuery) return data.genres;
    return data.genres
      .map((g) => ({ ...g, series: g.series.filter((s) => seriesMatchesQuery(s, trimmedQuery)) }))
      .filter((g) => g.series.length > 0);
  }, [data.genres, trimmedQuery]);

  const matchedSeriesIds = useMemo(() => {
    if (!trimmedQuery) return null;
    const ids = new Set();
    visibleGenres.forEach((g) => g.series.forEach((s) => ids.add(s.id)));
    return ids;
  }, [visibleGenres, trimmedQuery]);

  // Grand totals (always reflect the full library, not the filtered view)
  let totalRead = 0, totalBooks = 0;
  data.genres.forEach((g) => { const p = genreProgress(g); totalRead += p.read; totalBooks += p.total; });

  const encoded = encodeState(data);

  return (
    <div style={{ minHeight: "100vh", background: "#0b0b12", color: "#d0d0e8", paddingBottom: 80 }}>

      {/* BACKUP MODAL */}
      {modal === "backup" && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 500,
          background: "#000000cc", display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        }} onClick={() => setModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#0e0e1e", border: "1px solid #2a2a44", borderRadius: 8,
            padding: 20, maxWidth: 480, width: "100%",
          }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#baf9ff", marginBottom: 6 }}>Backup Your Progress</div>
            <div style={{ fontSize: 12, color: "#54546a", fontFamily: "'JetBrains Mono', monospace", marginBottom: 12, lineHeight: 1.5 }}>
              Your progress already saves automatically in this browser. Use this only if you want a manual backup - e.g. to move your data to a different browser or computer. Copy this string and save it somewhere safe.
            </div>
            <textarea readOnly value={encoded} onClick={e => e.target.select()} style={{
              width: "100%", height: 100, background: "#060610", border: "1px solid #2a2a44",
              color: "#8888aa", fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
              borderRadius: 4, padding: 8, resize: "none",
            }} />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button onClick={handleCopy} style={{
                ...btnStyle("#39ff8a", "#0a1410"), flex: 1, padding: "8px",
                fontSize: 12, letterSpacing: 0.5,
              }}>
                {copied ? "COPIED" : "COPY TO CLIPBOARD"}
              </button>
              <button onClick={() => setModal(null)} style={{ ...btnStyle("#444", "#111"), padding: "8px 16px" }}>
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESTORE MODAL */}
      {modal === "restore" && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 500,
          background: "#000000cc", display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        }} onClick={() => { setModal(null); setLoadText(""); setLoadError(""); }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#0e0e1e", border: "1px solid #2a2a44", borderRadius: 8,
            padding: 20, maxWidth: 480, width: "100%",
          }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#baf9ff", marginBottom: 6 }}>Restore From Backup</div>
            <div style={{ fontSize: 12, color: "#54546a", fontFamily: "'JetBrains Mono', monospace", marginBottom: 12, lineHeight: 1.5 }}>
              Paste a backup string below. This will replace your current saved progress in this browser.
            </div>
            <textarea
              value={loadText}
              onChange={e => { setLoadText(e.target.value); setLoadError(""); }}
              placeholder="Paste backup string here..."
              style={{
                width: "100%", height: 100, background: "#060610", border: `1px solid ${loadError ? "#8a3a3a" : "#2a2a44"}`,
                color: "#c0c0d8", fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                borderRadius: 4, padding: 8, resize: "none",
              }}
            />
            {loadError && <div style={{ fontSize: 11, color: "#8a3a3a", fontFamily: "'JetBrains Mono', monospace", marginTop: 6 }}>{loadError}</div>}
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button onClick={handleLoad} disabled={!loadText.trim()} style={{
                ...btnStyle("#00f0ff", "#1a1208"), flex: 1, padding: "8px",
                fontSize: 12, letterSpacing: 0.5,
                opacity: loadText.trim() ? 1 : 0.4,
              }}>
                RESTORE PROGRESS
              </button>
              <button onClick={() => { setModal(null); setLoadText(""); setLoadError(""); }} style={{ ...btnStyle("#444", "#111"), padding: "8px 16px" }}>
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header style={{
        position: "sticky", top: 0, zIndex: 200,
        background: "#0b0b12ee",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid #14142a",
        padding: "14px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 8,
      }}>
        <div>
          <h1 style={{
            margin: 0, fontSize: 20, fontWeight: 700,
            fontFamily: "'Playfair Display', Georgia, serif",
            color: "#baf9ff", letterSpacing: 1,
          }}>
            Reading Tracker
          </h1>
          <div style={{ fontSize: 11, color: "#44445a", fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
            {totalRead} of {totalBooks} books read - {data.genres.length} genres
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <button onClick={() => setModal("backup")} style={{
            background: "transparent", border: "1px solid #2a2a44", color: "#54546a",
            borderRadius: 4, padding: "6px 10px", fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5,
          }} title="Back up progress to clipboard">
            SAVE
          </button>
          <button onClick={() => setModal("restore")} style={{
            background: "transparent", border: "1px solid #2a2a44", color: "#54546a",
            borderRadius: 4, padding: "6px 10px", fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5,
          }} title="Restore from a backup string">
            LOAD
          </button>
          <button
            onClick={() => { setEditMode((e) => !e); setAddingGenre(false); }}
            style={{
              background: editMode ? "#00f0ff18" : "transparent",
              border: `1px solid ${editMode ? "#00f0ff" : "#2a2a44"}`,
              color: editMode ? "#00f0ff" : "#54546a",
              borderRadius: 4, padding: "6px 12px",
              fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: 1, transition: "all 0.15s",
            }}
          >
            {editMode ? "DONE" : "EDIT"}
          </button>
        </div>
      </header>

      {/* SEARCH */}
      <div style={{ maxWidth: 740, margin: "0 auto", padding: "12px 12px 0" }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by series, author, or book title..."
          style={{ ...inputStyle, width: "100%", padding: "8px 12px", fontSize: 13 }}
        />
        {trimmedQuery && (
          <div style={{ fontSize: 11, color: "#44445a", fontFamily: "'JetBrains Mono', monospace", margin: "6px 2px 0" }}>
            {visibleGenres.reduce((a, g) => a + g.series.length, 0)} series matched
          </div>
        )}
      </div>

      {/* MAIN */}
      <main style={{ maxWidth: 740, margin: "0 auto", padding: "12px 12px" }}>
        {visibleGenres.map((genre) => (
          <GenreSection
            key={genre.id}
            genre={genre}
            editMode={editMode}
            onToggleBook={handleToggleBook}
            onDeleteBook={handleDeleteBook}
            onDeleteSeries={handleDeleteSeries}
            onDeleteGenre={handleDeleteGenre}
            onAddBook={handleAddBook}
            onAddSeries={handleAddSeries}
            onEditBook={handleEditBook}
            onMoveSeries={handleMoveSeries}
            allGenres={data.genres}
            forceOpen={!!trimmedQuery}
            seriesForceOpenIds={matchedSeriesIds}
          />
        ))}

        {trimmedQuery && visibleGenres.length === 0 && (
          <div style={{ padding: "24px 14px", textAlign: "center", color: "#44445a", fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
            No series match "{trimmedQuery}"
          </div>
        )}

        {/* Add genre */}
        {editMode && !trimmedQuery && (
          <div style={{ marginTop: 8 }}>
            {!addingGenre ? (
              <button onClick={() => setAddingGenre(true)} style={{
                width: "100%", background: "none",
                border: "1px dashed #2a2a44", color: "#44445a",
                borderRadius: 4, padding: "10px", fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5,
              }}>+ add genre</button>
            ) : (
              <div className="rt-fade" style={{
                padding: "10px 14px", background: "#0d0d1e",
                border: "1px solid #1a1a2e", borderRadius: 4,
                display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap",
              }}>
                <input
                  value={newGenreName}
                  onChange={(e) => setNewGenreName(e.target.value)}
                  placeholder="Genre name"
                  style={{ ...inputStyle, flex: 1, minWidth: 160 }}
                  onKeyDown={(e) => e.key === "Enter" && handleAddGenre()}
                  autoFocus
                />
                <button onClick={handleAddGenre} style={btnStyle("#00f0ff", "#1a1208")}>Add Genre</button>
                <button onClick={() => { setAddingGenre(false); setNewGenreName(""); }} style={btnStyle("#444", "#111")}>Cancel</button>
              </div>
            )}
          </div>
        )}

        {/* DISCOVER */}
        {!trimmedQuery && <DiscoverSection />}
      </main>
    </div>
  );
}
