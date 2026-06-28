import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase.js";
import { inputStyle, btnStyle } from "../styles/sharedStyles.js";

// Sign in with the email/password you created in the Firebase console.
// There's no "create account" form here on purpose - this app is meant
// for one person's library, so the account is set up once, by hand.
export function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      setError("Sign-in failed - check your email and password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0b0b12", color: "#d0d0e8",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <form onSubmit={submit} style={{
        background: "#0e0e1e", border: "1px solid #2a2a44", borderRadius: 8,
        padding: 24, maxWidth: 360, width: "100%",
      }}>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, color: "#baf9ff", marginBottom: 16 }}>
          Reading Tracker
        </div>
        <input
          type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="Email" autoComplete="username"
          style={{ ...inputStyle, width: "100%", marginBottom: 8, padding: "8px 12px" }}
        />
        <input
          type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="Password" autoComplete="current-password"
          style={{ ...inputStyle, width: "100%", marginBottom: 12, padding: "8px 12px" }}
        />
        {error && <div style={{ fontSize: 12, color: "#e87a7a", marginBottom: 10, fontFamily: "'JetBrains Mono', monospace" }}>{error}</div>}
        <button type="submit" disabled={busy} style={{ ...btnStyle("#00f0ff", "#1a1208"), width: "100%", padding: "8px", opacity: busy ? 0.6 : 1 }}>
          {busy ? "SIGNING IN..." : "SIGN IN"}
        </button>
      </form>
    </div>
  );
}
