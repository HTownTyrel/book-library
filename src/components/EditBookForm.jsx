import { useState } from "react";
import { inputStyle, btnStyle } from "../styles/sharedStyles.js";

// Lets you fix up an existing book's title, number, read state, or
// release info - e.g. flipping "unreleased" to released once a book
// actually comes out, or correcting a typo.
export function EditBookForm({ book, onSave, onCancel }) {
  const [title, setTitle] = useState(book.title);
  const [bookNum, setBookNum] = useState(String(book.bookNum));
  const [read, setRead] = useState(!!book.read);
  const [unreleased, setUnreleased] = useState(!book.released);
  const [releaseDate, setReleaseDate] = useState(book.releaseDate || "");

  const submit = () => {
    if (!title.trim()) return;
    onSave(book.id, {
      title: title.trim(),
      bookNum: parseFloat(bookNum) || 0,
      read: unreleased ? false : read,
      released: !unreleased,
      releaseDate: unreleased ? releaseDate : undefined,
    });
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
      {unreleased ? (
        <input value={releaseDate} onChange={e => setReleaseDate(e.target.value)}
          placeholder="Release (e.g. Jul 2026)" style={{ ...inputStyle, width: 130 }} />
      ) : (
        <label style={{ fontSize: 12, color: "#666", display: "flex", alignItems: "center", gap: 4 }}>
          <input type="checkbox" checked={read} onChange={e => setRead(e.target.checked)} />
          Read
        </label>
      )}
      <button onClick={submit} style={btnStyle("#00f0ff", "#1a1208")}>Save</button>
      <button onClick={onCancel} style={btnStyle("#444", "#111")}>Cancel</button>
    </div>
  );
}
