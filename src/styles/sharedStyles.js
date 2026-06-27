export const inputStyle = {
  background: "#14142a", border: "1px solid #2a2a44", borderRadius: 4,
  color: "#d0d0e8", fontSize: 13, padding: "5px 8px",
  fontFamily: "'Source Serif 4', Georgia, serif",
};

export function btnStyle(border, bg) {
  return {
    background: bg, border: `1px solid ${border}`,
    color: border, borderRadius: 4, padding: "4px 12px",
    fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: 0.5,
  };
}
