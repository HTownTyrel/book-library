import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./lib/firebase.js";
import { subscribeToLibrary, saveLibrary } from "./lib/cloudData.js";
import { INITIAL_DATA } from "./data/initialData.js";
import { GLOBAL_CSS } from "./styles/globalCss.js";
import { inputStyle, btnStyle } from "./styles/sharedStyles.js";
import { genreProgress, uniqueId } from "./lib/helpers.js";
import { GenreSection } from "./components/GenreSection.jsx";
import { DiscoverSection } from "./components/DiscoverSection.jsx";
import { SignIn } from "./components/SignIn.jsx";

// A series matches a search query if the query appears in the series
// name, the author, or any book title within it.
function seriesMatchesQuery(series, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  if (series.name.toLowerCase().includes(q)) return true;
  if (series.author.toLowerCase().includes(q)) return true;
  return series.books.some((b) => b.title.toLowerCase().includes(q));
}

// Top-level component: figures out whether anyone's signed in, and
// renders either the sign-in screen or the actual tracker.
export default function ReadingTracker() {
  const [user, setUser] = useState(undefined); // undefined = checking, null = signed out

  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  // Inject CSS once, regardless of auth state
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = GLOBAL_CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  if (user === undefined) {
    return <div style={{ minHeight: "100vh", background: "#0b0b12" }} />;
  }
  if (user === null) {
    return <SignIn />;
  }
  return <LibraryView uid={user.uid} />;
}

// The actual tracker UI, once we know who's signed in. Data lives in
// Firestore under libraries/{uid} and stays in sync in real time across
// every device signed into the same account.
function LibraryView({ uid }) {
  const [data, setData] = useState(null); // null while loading
  const [editMode, setEditMode] = useState(false);
  const [addingGenre, setAddingGenre] = useState(false);
  const [newGenreName, setNewGenreName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const seededRef = useRef(false);

  // Subscribe to this user's library doc. Any write from this device or
  // any other device shows up here automatically.
  useEffect(() => {
    seededRef.current = false;
    const unsubscribe = subscribeToLibrary(uid, (remoteData) => {
      if (remoteData) {
        setData(remoteData);
      } else if (!seededRef.current) {
        // First time this account has used the app - seed it with the
        // starter library so there's something to look at.
        seededRef.current = true;
        saveLibrary(uid, INITIAL_DATA);
      }
    });
    return unsubscribe;
  }, [uid]);

  // Applies a local change immediately (so the UI feels instant) and
  // pushes the same change to Firestore so every other device picks it
  // up. The next snapshot will reconcile if anything differs.
  const updateData = useCallback((updater) => {
    setData((prev) => {
      const next = updater(prev);
      saveLibrary(uid, next).catch(() => {/* will retry via Firestore's own offline queue */});
      return next;
    });
  }, [uid]);

  const handleToggleBook = useCallback((genreId, seriesId, bookId) => {
    updateData((prev) => ({
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
  }, [updateData]);

  const handleDeleteBook = useCallback((genreId, seriesId, bookId) => {
    if (!window.confirm("Delete this book?")) return;
    updateData((prev) => ({
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
  }, [updateData]);

  const handleDeleteSeries = useCallback((genreId, seriesId) => {
    if (!window.confirm("Delete this entire series and all its books?")) return;
    updateData((prev) => ({
      ...prev,
      genres: prev.genres.map((g) =>
        g.id !== genreId ? g : { ...g, series: g.series.filter((s) => s.id !== seriesId) }
      ),
    }));
  }, [updateData]);

  const handleDeleteGenre = useCallback((genreId) => {
    if (!window.confirm("Delete this genre and EVERYTHING in it?")) return;
    updateData((prev) => ({
      ...prev,
      genres: prev.genres.filter((g) => g.id !== genreId),
    }));
  }, [updateData]);

  const handleAddBook = useCallback((genreId, seriesId, book) => {
    updateData((prev) => ({
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
  }, [updateData]);

  const handleAddSeries = useCallback((genreId, series) => {
    updateData((prev) => ({
      ...prev,
      genres: prev.genres.map((g) =>
        g.id !== genreId ? g : { ...g, series: [...g.series, series] }
      ),
    }));
  }, [updateData]);

  const handleEditBook = useCallback((genreId, seriesId, bookId, updates) => {
    updateData((prev) => ({
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
  }, [updateData]);

  // Moves a whole series (and its books) from one genre to another -
  // e.g. once you start reading a Discover suggestion and want it filed
  // under a real category instead of staying loose.
  const handleMoveSeries = useCallback((fromGenreId, seriesId, toGenreId) => {
    updateData((prev) => {
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
  }, [updateData]);

  const handleAddGenre = () => {
    if (!newGenreName.trim()) return;
    const genre = { id: `g-${uniqueId()}`, name: newGenreName.trim(), series: [] };
    updateData((prev) => ({ ...prev, genres: [...prev.genres, genre] }));
    setNewGenreName(""); setAddingGenre(false);
  };

  // Filter genres/series down to whatever matches the search box. When
  // there's no query, everything passes through unchanged.
  const trimmedQuery = searchQuery.trim();
  const visibleGenres = useMemo(() => {
    if (!data) return [];
    if (!trimmedQuery) return data.genres;
    return data.genres
      .map((g) => ({ ...g, series: g.series.filter((s) => seriesMatchesQuery(s, trimmedQuery)) }))
      .filter((g) => g.series.length > 0);
  }, [data, trimmedQuery]);

  const matchedSeriesIds = useMemo(() => {
    if (!trimmedQuery) return null;
    const ids = new Set();
    visibleGenres.forEach((g) => g.series.forEach((s) => ids.add(s.id)));
    return ids;
  }, [visibleGenres, trimmedQuery]);

  if (!data) {
    return <div style={{ minHeight: "100vh", background: "#0b0b12", color: "#54546a", padding: 24, fontFamily: "'JetBrains Mono', monospace" }}>Loading your library...</div>;
  }

  // Grand totals (always reflect the full library, not the filtered view)
  let totalRead = 0, totalBooks = 0;
  data.genres.forEach((g) => { const p = genreProgress(g); totalRead += p.read; totalBooks += p.total; });

  return (
    <div style={{ minHeight: "100vh", background: "#0b0b12", color: "#d0d0e8", paddingBottom: 80 }}>

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
          <button onClick={() => signOut(auth)} style={{
            background: "transparent", border: "1px solid #2a2a44", color: "#54546a",
            borderRadius: 4, padding: "6px 10px", fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5,
          }} title="Sign out">
            SIGN OUT
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
