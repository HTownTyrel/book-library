import { useState } from "react";
import { uniqueId } from "../lib/helpers.js";
import { inputStyle, btnStyle } from "../styles/sharedStyles.js";

export function AddSeriesForm({ genreId, onAdd, onCancel }) {
  const [name, setName] = useState("");
  const [author, setAuthor] = useState("");
  const submit = () => {
    if (!name.trim()) return;
    onAdd(genreId, { id: `s-${uniqueId()}`, name: name.trim(), author: author.trim(), books: [] });
    setName(""); setAuthor("");
  };
  return (
    <div className="rt-fade" style={{
      padding: "10px 14px", background: "#0d0d1e",
      borderBottom: "1px solid #1a1a2e",
      display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center",
    }}>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Series name"
        style={{ ...inputStyle, flex: 1, minWidth: 140 }}
        onKeyDown={e => e.key === "Enter" && submit()} />
      <input value={author} onChange={e => setAuthor(e.target.value)} placeholder="Author"
        style={{ ...inputStyle, flex: 1, minWidth: 120 }} />
      <button onClick={submit} style={btnStyle("#00f0ff", "#1a1208")}>Add Series</button>
      <button onClick={onCancel} style={btnStyle("#444", "#111")}>Cancel</button>
    </div>
  );
}
