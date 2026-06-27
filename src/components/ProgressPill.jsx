export function ProgressPill({ read, total, small }) {
  const allDone = read === total && total > 0;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: small ? 11 : 12,
      color: allDone ? "#39ff8a" : "#00f0ff",
      background: allDone ? "#39ff8a18" : "#00f0ff18",
      border: `1px solid ${allDone ? "#39ff8a44" : "#00f0ff44"}`,
      borderRadius: 4, padding: small ? "1px 6px" : "2px 8px",
      flexShrink: 0,
    }}>
      {read}/{total}
    </span>
  );
}
