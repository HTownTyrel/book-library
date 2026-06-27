// Global page styles, injected once by ReadingTracker. Plain CSS text
// (rather than a .css file) so the same string could be reused in a
// React Native WebView if needed later - not required for the web app,
// but keeps the door open.
export const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,300;1,400&family=JetBrains+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { background: #0b0b12; min-height: 100vh; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #252535; border-radius: 3px; }
  input[type="checkbox"] { accent-color: #00f0ff; cursor: pointer; flex-shrink: 0; }
  input[type="checkbox"]:disabled { accent-color: #333; cursor: not-allowed; }
  button { cursor: pointer; }
  input[type="text"], input[type="date"], select { outline: none; }
  .rt-fade { animation: rtFade 0.18s ease; }
  @keyframes rtFade { from { opacity:0; transform: translateY(-6px); } to { opacity:1; transform: translateY(0); } }
  .rt-genre-toggle:hover { opacity: 0.82; }
  .rt-series-toggle:hover { background: #16162a !important; }
  .rt-book-row:hover { background: #10101c !important; }
`;
