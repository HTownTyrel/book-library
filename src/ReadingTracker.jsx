import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./lib/firebase.js";
import { subscribeToLibrary, saveLibrary } from "./lib/cloudData.js";
import { INITIAL_DATA } from "./data/initialData.js";
import { GLOBAL_CSS } from "./styles/globalCss.js";
import { inputStyle } from "./styles/sharedStyles.js";
import { seriesProgress, uniqueId, groupSeriesByAuthor, uniqueAuthorNames } from "./lib/helpers.js";
import { findNewReleases, CHECK_INTERVAL_MS } from "./lib/releaseCheck.js";
import { fetchBookCover } from "./lib/bookCovers.js";
import { AuthorSection } from "./components/AuthorSection.jsx";
import { CurrentlyReadingBanner } from "./components/CurrentlyReadingBanner.jsx";
import { AddSeriesForm } from "./components/AddSeriesForm.jsx";
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

// A Google Books "publishedDate" can be a full date, just a year, or
// missing. If we can't tell it's in the future, we assume it's already out.
function inferReleased(publishedDate) {
  if (!publishedDate) return true;
  const time = new Date(publishedDate).getTime();
  if (Number.isNaN(time)) return true;
  return time <= Date.now();
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
  const [addingSeries, setAddingSeries] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [checkingReleases, setCheckingReleases] = useState(false);
  const seededRef = useRef(false);
  const releaseCheckRanRef = useRef(false);
  const coversInFlightRef = useRef(new Set());

  // Subscribe to this user's library doc. Any write from this device or
  // any other device shows up here automatically.
  useEffect(() => {
    seededRef.current = false;
    releaseCheckRanRef.current = false;
    const unsubscribe = subscribeToLibrary(uid, (remoteData) => {
      if (remoteData) {
        if (remoteData.genres && !remoteData.series) {
          // One-time migration: this account still has the old
          // genre -> series -> books shape. Flatten it into a single
          // series list grouped by author instead - each series keeps
          // its old genre name as harmless leftover metadata, in case
          // it's ever useful again, but nothing groups by it anymore.
          const migrated = {
            releaseChecks: remoteData.releaseChecks || {},
            covers: remoteData.covers || {},
            series: remoteData.genres.flatMap((g) =>
              g.series.map((s) => ({ ...s, genre: g.name }))
            ),
          };
          setData(migrated);
          saveLibrary(uid, migrated).catch(() => {/* will retry via Firestore's own offline queue */});
        } else {
          setData({ releaseChecks: {}, covers: {}, ...remoteData });
        }
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

  const handleToggleBook = useCallback((seriesId, bookId) => {
    updateData((prev) => ({
      ...prev,
      series: prev.series.map((s) =>
        s.id !== seriesId ? s : {
          ...s,
          books: s.books.map((b) => {
            if (b.id !== bookId) return b;
            const read = !b.read;
            // Finishing a book means you're no longer "currently reading"
            // it. `!!b.reading` normalizes a never-set `reading` field to
            // a real `false` instead of `undefined` - Firestore rejects
            // explicit undefined field values.
            return { ...b, read, reading: read ? false : !!b.reading };
          }),
        }
      ),
    }));
  }, [updateData]);

  // Flags a book as "currently reading" (or un-flags it) - separate from
  // `read`, so it doesn't affect your read/unread progress counts.
  const handleToggleReading = useCallback((seriesId, bookId) => {
    updateData((prev) => ({
      ...prev,
      series: prev.series.map((s) =>
        s.id !== seriesId ? s : { ...s, books: s.books.map((b) => b.id !== bookId ? b : { ...b, reading: !b.reading }) }
      ),
    }));
  }, [updateData]);

  const handleDeleteBook = useCallback((seriesId, bookId) => {
    if (!window.confirm("Delete this book?")) return;
    updateData((prev) => ({
      ...prev,
      series: prev.series.map((s) =>
        s.id !== seriesId ? s : { ...s, books: s.books.filter((b) => b.id !== bookId) }
      ),
    }));
  }, [updateData]);

  const handleDeleteSeries = useCallback((seriesId) => {
    if (!window.confirm("Delete this entire series and all its books?")) return;
    updateData((prev) => ({ ...prev, series: prev.series.filter((s) => s.id !== seriesId) }));
  }, [updateData]);

  const handleAddBook = useCallback((seriesId, book) => {
    updateData((prev) => ({
      ...prev,
      series: prev.series.map((s) =>
        s.id !== seriesId ? s : { ...s, books: [...s.books, book].sort((a, b) => a.bookNum - b.bookNum) }
      ),
    }));
  }, [updateData]);

  const handleAddSeries = useCallback((series) => {
    updateData((prev) => ({ ...prev, series: [...prev.series, series] }));
  }, [updateData]);

  const handleEditBook = useCallback((seriesId, bookId, updates) => {
    updateData((prev) => ({
      ...prev,
      series: prev.series.map((s) =>
        s.id !== seriesId ? s : {
          ...s,
          books: s.books
            .map((b) => {
              if (b.id !== bookId) return b;
              const merged = { ...b, ...updates };
              if (merged.read) merged.reading = false;
              return merged;
            })
            .sort((a, b) => a.bookNum - b.bookNum),
        }
      ),
    }));
  }, [updateData]);

  // Renaming a series or correcting its author text is how you "move" a
  // series now - since grouping is automatic based on the author field,
  // fixing a typo here reshuffles it into the right group on its own.
  const handleEditSeries = useCallback((seriesId, updates) => {
    updateData((prev) => ({
      ...prev,
      series: prev.series.map((s) => s.id !== seriesId ? s : { ...s, ...updates }),
    }));
  }, [updateData]);

  const handleAddSeriesSubmit = (series) => {
    handleAddSeries(series);
    setAddingSeries(false);
  };

  // Saves your whole library as a JSON file the browser downloads - a
  // manual backup you control yourself, separate from Firestore. Handy
  // before a big edit, or just as peace of mind since deletes here have
  // no undo.
  const handleExportBackup = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reading-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Runs the "any new books out?" check for a list of author names.
  // Skips authors that were checked recently unless `force` is set (used
  // by the manual "Check releases" button). Results are saved back to
  // Firestore so every device shares the same findings and throttling.
  const runReleaseChecks = useCallback(async (authorNames, { force = false } = {}) => {
    if (!data) return;
    const now = Date.now();
    const dueAuthors = authorNames.filter((name) => {
      if (force) return true;
      const existing = data.releaseChecks?.[name];
      return !existing || now - new Date(existing.lastChecked).getTime() > CHECK_INTERVAL_MS;
    });
    if (dueAuthors.length === 0) return;

    setCheckingReleases(true);
    const results = {};
    await Promise.all(dueAuthors.map(async (authorName) => {
      const knownTitles = data.series
        .filter((s) => s.author.toLowerCase() === authorName.toLowerCase())
        .flatMap((s) => s.books.map((b) => b.title));
      const dismissed = data.releaseChecks?.[authorName]?.dismissed || [];
      try {
        const found = await findNewReleases(authorName, knownTitles, dismissed);
        results[authorName] = {
          lastChecked: new Date().toISOString(),
          dismissed,
          candidates: found,
        };
      } catch {
        // Google Books hiccup or rate limit - just skip, we'll retry next time.
      }
    }));
    setCheckingReleases(false);

    if (Object.keys(results).length > 0) {
      updateData((prev) => ({ ...prev, releaseChecks: { ...prev.releaseChecks, ...results } }));
    }
  }, [data, updateData]);

  // Kick off an automatic (throttled) check once per session, right
  // after the library first loads.
  useEffect(() => {
    if (!data || releaseCheckRanRef.current) return;
    releaseCheckRanRef.current = true;
    runReleaseChecks(uniqueAuthorNames(data.series));
  }, [data, runReleaseChecks]);

  // Fetches a cover thumbnail (via its first book) for any series that
  // doesn't have one cached yet - runs whenever the library changes, so
  // newly added series pick up a cover without needing a special case,
  // but each series is only ever looked up once (the result, including
  // "no cover found", is cached in `data.covers` so we don't re-ask).
  useEffect(() => {
    if (!data) return;
    const missing = data.series.filter((s) =>
      s.books.length > 0 &&
      data.covers?.[s.id] === undefined &&
      !coversInFlightRef.current.has(s.id)
    );
    if (missing.length === 0) return;

    missing.forEach((s) => coversInFlightRef.current.add(s.id));
    (async () => {
      const results = {};
      await Promise.all(missing.map(async (s) => {
        try {
          results[s.id] = await fetchBookCover(s.books[0].title, s.author);
        } catch {
          // Skip - no entry written, so it's still "missing" and we'll
          // try again next time the library changes.
        } finally {
          coversInFlightRef.current.delete(s.id);
        }
      }));
      if (Object.keys(results).length > 0) {
        updateData((prev) => ({ ...prev, covers: { ...prev.covers, ...results } }));
      }
    })();
  }, [data, updateData]);

  // Adding a series from Discover is like handleAddSeries, but when it
  // introduces an author you don't have anything else by yet, we also
  // immediately (not waiting for the daily throttle) look up the rest of
  // their catalog, so Discover can offer their other books right away.
  const handleAddSeriesFromDiscover = useCallback((series) => {
    const isNewAuthor = !data.series.some((s) => s.author.toLowerCase() === series.author.toLowerCase());
    handleAddSeries(series);
    if (isNewAuthor) {
      runReleaseChecks([series.author], { force: true });
    }
  }, [data, handleAddSeries, runReleaseChecks]);

  const handleAddReleaseCandidate = useCallback((authorName, candidate, seriesId) => {
    updateData((prev) => {
      const series = prev.series.find((s) => s.id === seriesId);
      if (!series) return prev;
      const nextNum = series.books.length > 0 ? Math.max(...series.books.map((b) => b.bookNum)) + 1 : 1;
      const released = inferReleased(candidate.publishedDate);
      const book = { id: `${seriesId}-${uniqueId()}`, bookNum: nextNum, title: candidate.title, read: false, released };
      if (!released) book.releaseDate = candidate.publishedDate;
      const existing = prev.releaseChecks[authorName];
      return {
        ...prev,
        series: prev.series.map((s) =>
          s.id !== seriesId ? s : { ...s, books: [...s.books, book].sort((a, b) => a.bookNum - b.bookNum) }
        ),
        releaseChecks: {
          ...prev.releaseChecks,
          [authorName]: { ...existing, candidates: existing.candidates.filter((c) => c.title !== candidate.title) },
        },
      };
    });
  }, [updateData]);

  // Files a candidate as book 1 of a brand-new series, for when it
  // clearly isn't part of any series you already have by this author.
  const handleAddCandidateAsNewSeries = useCallback((authorName, candidate, seriesName) => {
    updateData((prev) => {
      const released = inferReleased(candidate.publishedDate);
      const seriesId = `s-${uniqueId()}`;
      const book = { id: `${seriesId}-${uniqueId()}`, bookNum: 1, title: candidate.title, read: false, released };
      if (!released) book.releaseDate = candidate.publishedDate;
      const newSeries = { id: seriesId, name: seriesName, author: authorName, books: [book] };
      const existing = prev.releaseChecks[authorName];
      return {
        ...prev,
        series: [...prev.series, newSeries],
        releaseChecks: {
          ...prev.releaseChecks,
          [authorName]: { ...existing, candidates: existing.candidates.filter((c) => c.title !== candidate.title) },
        },
      };
    });
  }, [updateData]);

  const handleDismissCandidate = useCallback((authorName, title) => {
    updateData((prev) => {
      const existing = prev.releaseChecks?.[authorName];
      if (!existing) return prev;
      return {
        ...prev,
        releaseChecks: {
          ...prev.releaseChecks,
          [authorName]: {
            ...existing,
            candidates: existing.candidates.filter((c) => c.title !== title),
            dismissed: [...(existing.dismissed || []), title],
          },
        },
      };
    });
  }, [updateData]);

  // Filter series down to whatever matches the search box, then group
  // the result by author. With no query, everything passes through.
  const trimmedQuery = searchQuery.trim();
  const visibleSeries = useMemo(() => {
    if (!data) return [];
    const withCovers = data.series.map((s) => ({ ...s, cover: data.covers?.[s.id] }));
    if (!trimmedQuery) return withCovers;
    return withCovers.filter((s) => seriesMatchesQuery(s, trimmedQuery));
  }, [data, trimmedQuery]);

  const authorLetterGroups = useMemo(() => groupSeriesByAuthor(visibleSeries), [visibleSeries]);

  const matchedSeriesIds = useMemo(() => {
    if (!trimmedQuery) return null;
    return new Set(visibleSeries.map((s) => s.id));
  }, [visibleSeries, trimmedQuery]);

  if (!data) {
    return <div style={{ minHeight: "100vh", background: "#0b0b12", color: "#54546a", padding: 24, fontFamily: "'JetBrains Mono', monospace" }}>Loading your library...</div>;
  }

  // Grand totals (always reflect the full library, not the filtered view)
  let totalRead = 0, totalBooks = 0;
  data.series.forEach((s) => { const p = seriesProgress(s); totalRead += p.read; totalBooks += p.total; });
  const totalAuthors = uniqueAuthorNames(data.series).length;

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
        gap: 8, flexWrap: "wrap",
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
            {totalRead} of {totalBooks} books read - {totalAuthors} authors, {data.series.length} series
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button
            onClick={handleExportBackup}
            style={{
              background: "transparent", border: "1px solid #2a2a44", color: "#54546a",
              borderRadius: 4, padding: "6px 10px", fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5,
            }}
            title="Download your whole library as a JSON backup file"
          >
            BACKUP
          </button>
          <button
            disabled={checkingReleases}
            onClick={() => runReleaseChecks(uniqueAuthorNames(data.series), { force: true })}
            style={{
              background: "transparent", border: "1px solid #2a2a44",
              color: checkingReleases ? "#ff2bd6" : "#54546a",
              borderRadius: 4, padding: "6px 10px", fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5,
            }}
            title="Check Google Books for new releases from every author in your library"
          >
            {checkingReleases ? "CHECKING..." : "CHECK RELEASES"}
          </button>
          <button onClick={() => signOut(auth)} style={{
            background: "transparent", border: "1px solid #2a2a44", color: "#54546a",
            borderRadius: 4, padding: "6px 10px", fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5,
          }} title="Sign out">
            SIGN OUT
          </button>
          <button
            onClick={() => { setEditMode((e) => !e); setAddingSeries(false); }}
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
            {visibleSeries.length} series matched
          </div>
        )}
      </div>

      {/* MAIN */}
      <main style={{ maxWidth: 740, margin: "0 auto", padding: "12px 12px" }}>
        {!trimmedQuery && (
          <CurrentlyReadingBanner
            series={data.series}
            onFinish={handleToggleBook}
            onStop={handleToggleReading}
          />
        )}
        {authorLetterGroups.map((group) => (
          <div key={group.letter}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 2px 6px" }}>
              <span style={{
                fontSize: 13, fontFamily: "'JetBrains Mono', monospace",
                color: "#3a3a5a", letterSpacing: 2,
              }}>{group.letter}</span>
              <div style={{ flex: 1, height: 1, background: "#1a1a2e" }} />
            </div>
            {group.authors.map((author) => (
              <AuthorSection
                key={author.name}
                author={author}
                editMode={editMode}
                onToggleBook={handleToggleBook}
                onToggleReading={handleToggleReading}
                onDeleteBook={handleDeleteBook}
                onDeleteSeries={handleDeleteSeries}
                onAddBook={handleAddBook}
                onEditBook={handleEditBook}
                onEditSeries={handleEditSeries}
                forceOpen={!!trimmedQuery}
                seriesForceOpenIds={matchedSeriesIds}
                candidates={data.releaseChecks?.[author.name]?.candidates}
                onAddCandidate={handleAddReleaseCandidate}
                onDismissCandidate={handleDismissCandidate}
                onAddCandidateAsNewSeries={handleAddCandidateAsNewSeries}
              />
            ))}
          </div>
        ))}

        {trimmedQuery && authorLetterGroups.length === 0 && (
          <div style={{ padding: "24px 14px", textAlign: "center", color: "#44445a", fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
            No series match "{trimmedQuery}"
          </div>
        )}

        {/* Add series */}
        {editMode && !trimmedQuery && (
          <div style={{ marginTop: 8 }}>
            {!addingSeries ? (
              <button onClick={() => setAddingSeries(true)} style={{
                width: "100%", background: "none",
                border: "1px dashed #2a2a44", color: "#44445a",
                borderRadius: 4, padding: "10px", fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5,
              }}>+ add series</button>
            ) : (
              <AddSeriesForm onAdd={handleAddSeriesSubmit} onCancel={() => setAddingSeries(false)} />
            )}
          </div>
        )}

        {/* DISCOVER */}
        {!trimmedQuery && (
          <DiscoverSection
            existingSeries={data.series}
            onAddSeries={handleAddSeriesFromDiscover}
            releaseChecks={data.releaseChecks}
            onAddCandidate={handleAddReleaseCandidate}
            onDismissCandidate={handleDismissCandidate}
            onAddCandidateAsNewSeries={handleAddCandidateAsNewSeries}
            checkingReleases={checkingReleases}
          />
        )}
      </main>
    </div>
  );
}
