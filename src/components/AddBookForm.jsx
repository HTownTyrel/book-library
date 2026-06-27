import { useState } from "react";
import { uniqueId } from "../lib/helpers.js";
import { inputStyle, btnStyle } from "../styles/sharedStyles.js";

export function AddBookForm({ seriesId, genreId, onAdd, onCancel }) {
  const [title, setTitle] = useState("");
  const [bookNum, setBookNum] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [unreleased, setUnreleased] = useState(false);

  const submit = () => {
    if (!title.trim()) return;
    onAdd(genreId, seriesId, {
      id: `${seriesId}-${uniqueId()}`,
      bookNum: parseFloat(bookNum) || 0,
      title: title.trim(),
      read: false,
      released: !unreleased,
      releaseDate: unreleased ? releaseDate : undefined,
    });
    setTitle(""); setBookNum(""); setReleaseDate(""); setUnreleased(false);
  };

  return (
    <div className="rt-fade" style={{
      padding: "10px 14px 10px 36px",
      background: "#0d0d1e",
      borderBottom: "1px solid #1a1a2e",
      display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center",
    }}>
      <input value={bookNum} onChange={e => setBookNum(e.target.value)} placeholder="#"
        style={{ ...inputStyle, width: 44 }} />
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title"
        style={{ ...inputStyle, flex: 1, minWidth: 140 }}
        onKeyDown={e => e.key === "Enter" && submit()} />
      <label style={{ fontSize: 12, color: "#666", display: "flex", alignItems: "center", gap: 4 }}>
        <input type="checkbox" checked={unreleased} onChange={e => setUnreleased(e.target.checked)} />
        Unreleased
      </label>
      {unreleased && (
        <input value={releaseDate} onChange={e => setReleaseDate(e.target.value)}
          placeholder="Release (e.g. Jul 2026)" style={{ ...inputStyle, width: 130 }} />
      )}
      <button onClick={submit} style={btnStyle("#00f0ff", "#1a1208")}>Add</button>
      <button onClick={onCancel} style={btnStyle("#444", "#111")}>Cancel</button>
    </div>
  );
}
