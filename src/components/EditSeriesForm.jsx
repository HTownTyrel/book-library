import { useState } from "react";
import { inputStyle, btnStyle } from "../styles/sharedStyles.js";

// Lets you fix a series' name or author - handy now that grouping is
// based on the author text: correcting a typo here (e.g. "Jack Carr" vs
// "Jack Carr ") automatically moves the series into the right group.
export function EditSeriesForm({ series, onSave, onCancel }) {
  const [name, setName] = useState(series.name);
  const [author, setAuthor] = useState(series.author);

  const submit = () => {
    if (!name.trim() || !author.trim()) return;
    onSave(series.id, { name: name.trim(), author: author.trim() });
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
        style={{ ...inputStyle, flex: 1, minWidth: 120 }}
        onKeyDown={e => e.key === "Enter" && submit()} />
      <button onClick={submit} style={btnStyle("#00f0ff", "#1a1208")}>Save</button>
      <button onClick={onCancel} style={btnStyle("#444", "#111")}>Cancel</button>
    </div>
  );
}
