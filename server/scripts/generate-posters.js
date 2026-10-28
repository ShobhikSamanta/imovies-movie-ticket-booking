// Generates an original SVG poster for every movie in data/movies.js
// Run from the server folder:  node scripts/generate-posters.js
// Output: client/public/posters/<slug>.svg  (served by the React app at /posters/<slug>.svg)

const fs = require("fs");
const path = require("path");
const movies = require("../data/movies");

const OUT = path.join(__dirname, "..", "..", "client", "public", "posters");
fs.mkdirSync(OUT, { recursive: true });

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Small seeded random generator so each poster is the same every time
function rng(seed) {
  let s = 0;
  for (const ch of seed) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Each motif returns SVG shapes drawn in the top ~300px of the 300x450 poster
const motifs = {
  train: ({ c3 }) => {
    let o = `<circle cx="150" cy="150" r="70" fill="${c3}" opacity=".18"/><circle cx="150" cy="150" r="22" fill="#fff" opacity=".9"/>`;
    o += `<line x1="150" y1="150" x2="40" y2="330" stroke="#fff" stroke-width="4" opacity=".8"/><line x1="150" y1="150" x2="260" y2="330" stroke="#fff" stroke-width="4" opacity=".8"/>`;
    for (let i = 1; i <= 7; i++) {
      const y = 150 + i * i * 3.6, half = (y - 150) * 0.62 + 6;
      o += `<line x1="${150 - half - 12}" y1="${y}" x2="${150 + half + 12}" y2="${y}" stroke="#fff" stroke-width="${1 + i * 0.6}" opacity=".4"/>`;
    }
    return o;
  },
  confetti: ({ c3 }, r) => {
    const cols = ["#fde68a", "#f472b6", "#38bdf8", "#a3e635", "#fb923c", "#fff"];
    let o = `<path d="M70 190 Q150 280 230 190" fill="none" stroke="${c3}" stroke-width="12" stroke-linecap="round"/><circle cx="105" cy="140" r="12" fill="${c3}"/><circle cx="195" cy="140" r="12" fill="${c3}"/>`;
    for (let i = 0; i < 38; i++) {
      const x = r() * 300, y = r() * 290, c = cols[Math.floor(r() * cols.length)];
      o += r() > 0.5
        ? `<circle cx="${x}" cy="${y}" r="${3 + r() * 5}" fill="${c}" opacity=".85"/>`
        : `<rect x="${x}" y="${y}" width="${6 + r() * 8}" height="${4 + r() * 5}" fill="${c}" opacity=".85" transform="rotate(${r() * 90} ${x} ${y})"/>`;
    }
    return o;
  },
  space: ({ c3 }, r) => {
    let o = "";
    for (let i = 0; i < 60; i++) o += `<circle cx="${r() * 300}" cy="${r() * 300}" r="${r() * 1.8 + 0.4}" fill="#fff" opacity="${0.4 + r() * 0.6}"/>`;
    o += `<circle cx="170" cy="150" r="78" fill="${c3}" opacity=".9"/><circle cx="145" cy="125" r="78" fill="#4c1d95" opacity=".55"/>`;
    o += `<ellipse cx="170" cy="150" rx="125" ry="26" fill="none" stroke="#fff" stroke-width="5" opacity=".75" transform="rotate(-18 170 150)"/>`;
    o += `<path d="M60 230 L84 218 L70 244 Z" fill="#fff"/>`;
    return o;
  },
  stumps: ({ c3 }) => {
    let o = `<circle cx="150" cy="130" r="95" fill="${c3}" opacity=".22"/>`;
    for (const x of [118, 150, 182]) o += `<rect x="${x - 5}" y="120" width="10" height="150" rx="4" fill="#fef3c7"/>`;
    o += `<rect x="112" y="112" width="42" height="8" rx="3" fill="#fbbf24"/><rect x="146" y="112" width="42" height="8" rx="3" fill="#fbbf24"/>`;
    o += `<circle cx="235" cy="95" r="26" fill="#dc2626"/><path d="M215 80 Q235 95 215 112 M255 80 Q235 95 255 112" stroke="#fff" stroke-width="2.5" fill="none"/>`;
    o += `<path d="M0 280 Q150 230 300 280 L300 300 L0 300 Z" fill="#022c22" opacity=".6"/>`;
    return o;
  },
  hearts: ({ c3 }, r) => {
    const heart = (x, y, s, op) => `<path d="M${x} ${y + s * 0.3} C${x} ${y - s * 0.2} ${x - s} ${y - s * 0.2} ${x - s} ${y + s * 0.4} C${x - s} ${y + s * 0.9} ${x} ${y + s * 1.2} ${x} ${y + s * 1.5} C${x} ${y + s * 1.2} ${x + s} ${y + s * 0.9} ${x + s} ${y + s * 0.4} C${x + s} ${y - s * 0.2} ${x} ${y - s * 0.2} ${x} ${y + s * 0.3} Z" fill="${c3}" opacity="${op}"/>`;
    let o = `<circle cx="120" cy="150" r="80" fill="#fff" opacity=".12"/><circle cx="180" cy="150" r="80" fill="#fff" opacity=".12"/>`;
    o += heart(150, 110, 52, 0.95);
    for (let i = 0; i < 9; i++) o += heart(20 + r() * 260, 20 + r() * 260, 8 + r() * 12, 0.25 + r() * 0.3);
    return o;
  },
  slashes: ({ c3 }) => {
    let o = "";
    for (let i = 0; i < 6; i++) o += `<polygon points="${-20 + i * 55},300 ${30 + i * 55},300 ${130 + i * 55},0 ${80 + i * 55},0" fill="#fff" opacity="${0.04 + i * 0.015}"/>`;
    o += `<path d="M150 40 L240 80 L240 160 Q240 230 150 270 Q60 230 60 160 L60 80 Z" fill="#0b1220" stroke="${c3}" stroke-width="5"/>`;
    o += `<path d="M110 120 L190 200 M190 120 L110 200" stroke="${c3}" stroke-width="10" stroke-linecap="round"/>`;
    return o;
  },
  rain: ({ c3 }, r) => {
    let o = `<path d="M60 190 Q150 60 240 190 Z" fill="${c3}" opacity=".9"/><line x1="150" y1="190" x2="150" y2="250" stroke="#fff" stroke-width="5"/><path d="M150 250 q0 14 -14 14" stroke="#fff" stroke-width="5" fill="none"/>`;
    for (let i = 0; i < 70; i++) { const x = r() * 320, y = r() * 300; o += `<line x1="${x}" y1="${y}" x2="${x - 8}" y2="${y + 22}" stroke="#e0f2fe" stroke-width="1.5" opacity="${0.25 + r() * 0.4}"/>`; }
    return o;
  },
  moon: ({ c3 }) => {
    let o = `<circle cx="190" cy="105" r="62" fill="${c3}" opacity=".95"/><circle cx="170" cy="92" r="14" fill="#c4b5fd" opacity=".5"/><circle cx="212" cy="125" r="9" fill="#c4b5fd" opacity=".5"/>`;
    o += `<g stroke="#020617" stroke-width="6" stroke-linecap="round" fill="none"><path d="M70 300 L70 170 M70 220 L30 180 M70 200 L108 160 M70 250 L110 215 M108 160 L120 130 M30 180 L20 150"/></g>`;
    o += `<ellipse cx="150" cy="285" rx="190" ry="26" fill="#fff" opacity=".12"/>`;
    return o;
  },
  cup: ({ c3 }) => {
    let o = `<path d="M85 150 L215 150 L200 240 Q150 270 100 240 Z" fill="${c3}"/><path d="M215 165 Q265 165 255 205 Q245 232 205 228" fill="none" stroke="${c3}" stroke-width="12"/>`;
    o += `<ellipse cx="150" cy="150" rx="65" ry="12" fill="#7c2d12"/><ellipse cx="150" cy="268" rx="95" ry="10" fill="#000" opacity=".25"/>`;
    o += `<g stroke="#fff" stroke-width="6" stroke-linecap="round" fill="none" opacity=".75"><path d="M125 128 Q108 100 125 74 Q142 48 125 22"/><path d="M160 128 Q143 100 160 74 Q177 48 160 22"/><path d="M195 128 Q178 100 195 74 Q212 48 195 22"/></g>`;
    return o;
  },
  synth: ({ c3 }) => {
    let o = `<circle cx="150" cy="140" r="95" fill="#fde047"/>`;
    for (let i = 0; i < 6; i++) o += `<rect x="40" y="${135 + i * 17}" width="220" height="${3 + i * 2}" fill="#2e1065"/>`;
    o += `<rect x="0" y="215" width="300" height="90" fill="#2e1065"/>`;
    for (let i = 0; i < 9; i++) o += `<line x1="${i * 38 - 10}" y1="300" x2="150" y2="215" stroke="${c3}" stroke-width="1.5" opacity=".8"/>`;
    for (let i = 0; i < 5; i++) o += `<line x1="0" y1="${222 + i * i * 4}" x2="300" y2="${222 + i * i * 4}" stroke="${c3}" stroke-width="1.5" opacity=".8"/>`;
    return o;
  },
  river: ({ c3 }) => {
    let o = `<circle cx="215" cy="85" r="46" fill="${c3}" opacity=".95"/><path d="M0 170 L40 120 L90 165 L150 105 L210 170 L300 115 L300 220 L0 220 Z" fill="#042f2e" opacity=".75"/>`;
    for (let i = 0; i < 6; i++) o += `<path d="M0 ${205 + i * 17} Q75 ${190 + i * 17} 150 ${205 + i * 17} T300 ${205 + i * 17}" fill="none" stroke="#99f6e4" stroke-width="3" opacity="${0.8 - i * 0.1}"/>`;
    return o;
  },
  rays: ({ c3 }) => {
    let o = "";
    for (let i = 0; i < 18; i++) o += `<polygon points="150,150 ${150 + 260 * Math.cos((i * 20 * Math.PI) / 180)},${150 + 260 * Math.sin((i * 20 * Math.PI) / 180)} ${150 + 260 * Math.cos(((i * 20 + 8) * Math.PI) / 180)},${150 + 260 * Math.sin(((i * 20 + 8) * Math.PI) / 180)}" fill="${c3}" opacity=".22"/>`;
    o += `<circle cx="150" cy="150" r="52" fill="${c3}"/><circle cx="150" cy="150" r="32" fill="#7f1d1d"/><path d="M0 300 L70 210 L120 260 L180 190 L300 300 Z" fill="#1c0505" opacity=".85"/>`;
    return o;
  },
  planes: ({ c3 }, r) => {
    let o = `<circle cx="70" cy="70" r="30" fill="#fff" opacity=".55"/><circle cx="95" cy="75" r="24" fill="#fff" opacity=".55"/><circle cx="240" cy="230" r="34" fill="#fff" opacity=".4"/>`;
    const plane = (x, y, s, rot) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><polygon points="0,0 60,22 0,34 12,17" fill="#fff"/><polygon points="12,17 60,22 24,40" fill="#bae6fd"/></g>`;
    o += `<path d="M20 270 Q110 230 160 170 T250 80" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="6 8" opacity=".8"/>`;
    o += plane(215, 50, 1.4, -25) + plane(70, 150, 0.8, -12) + plane(150, 230, 0.6, -5);
    return o;
  },
  sunset: ({ c3 }) => {
    let o = `<circle cx="150" cy="160" r="82" fill="${c3}"/><rect x="0" y="205" width="300" height="100" fill="#0e7490" opacity=".85"/>`;
    for (let i = 0; i < 5; i++) o += `<rect x="${60 + i * 6}" y="${215 + i * 14}" width="${180 - i * 12}" height="4" fill="${c3}" opacity="${0.8 - i * 0.12}"/>`;
    o += `<g stroke="#052e16" stroke-width="6" stroke-linecap="round" fill="none"><path d="M235 205 Q240 140 232 105"/></g><path d="M232 105 Q205 82 180 100 M232 105 Q232 70 205 58 M232 105 Q262 76 290 92 M232 105 Q265 108 280 135" stroke="#052e16" stroke-width="7" fill="none" stroke-linecap="round"/>`;
    return o;
  },
  magnifier: ({ c3 }) => {
    let o = "";
    for (let i = 0; i < 7; i++) o += `<ellipse cx="150" cy="150" rx="${30 + i * 18}" ry="${40 + i * 18}" fill="none" stroke="#fff" stroke-width="1.5" opacity="${0.35 - i * 0.04}"/>`;
    o += `<circle cx="135" cy="130" r="62" fill="#0c0a09" opacity=".5" stroke="${c3}" stroke-width="12"/><line x1="180" y1="176" x2="245" y2="245" stroke="${c3}" stroke-width="18" stroke-linecap="round"/>`;
    o += `<path d="M110 110 Q135 85 165 110" fill="none" stroke="#fff" stroke-width="5" opacity=".6" stroke-linecap="round"/>`;
    return o;
  },
  arch: ({ c3 }) => {
    let o = `<circle cx="150" cy="110" r="78" fill="${c3}" opacity=".3"/>`;
    o += `<path d="M70 300 L70 150 Q70 60 150 60 Q230 60 230 150 L230 300 Z" fill="#1f0a1f" opacity=".75" stroke="${c3}" stroke-width="5"/>`;
    o += `<path d="M95 300 L95 160 Q95 92 150 92 Q205 92 205 160 L205 300 Z" fill="none" stroke="${c3}" stroke-width="3" opacity=".8"/>`;
    o += `<path d="M150 180 C150 165 128 165 128 183 C128 202 150 212 150 224 C150 212 172 202 172 183 C172 165 150 165 150 180 Z" fill="${c3}"/>`;
    return o;
  },
  dunes: ({ c3 }, r) => {
    let o = `<circle cx="215" cy="95" r="52" fill="${c3}"/><circle cx="198" cy="82" r="10" fill="#d6c58a" opacity=".6"/>`;
    for (let i = 0; i < 40; i++) o += `<circle cx="${r() * 300}" cy="${r() * 150}" r="${r() * 1.5 + 0.3}" fill="#fff" opacity=".7"/>`;
    o += `<path d="M0 220 Q90 150 190 215 T300 190 L300 300 L0 300 Z" fill="#92400e"/><path d="M0 260 Q110 200 220 262 T300 240 L300 300 L0 300 Z" fill="#78350f"/>`;
    return o;
  },
  ball: ({ c3 }) => {
    let o = `<circle cx="150" cy="140" r="110" fill="#fff" opacity=".16"/><circle cx="150" cy="140" r="72" fill="#dc2626"/><path d="M96 105 Q150 140 96 175 M204 105 Q150 140 204 175" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="7 6"/>`;
    o += `<rect x="215" y="110" width="26" height="170" rx="12" fill="#fde68a" transform="rotate(22 228 195)"/><rect x="224" y="236" width="10" height="56" rx="5" fill="#92400e" transform="rotate(22 228 195)"/>`;
    return o;
  },
};

function wrapTitle(title, max = 11) {
  const words = title.toUpperCase().split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > max && cur) { lines.push(cur); cur = w; }
    else cur = (cur + " " + w).trim();
  }
  if (cur) lines.push(cur);
  return lines;
}

for (const m of movies) {
  const { c1, c2, c3, motif, tagline } = m.art;
  const r = rng(m.slug);
  const lines = wrapTitle(m.title);
  const longest = Math.max(...lines.map((l) => l.length));
  const size = Math.max(22, Math.min(44, Math.floor(250 / (longest * 0.7))));
  const lastY = 396;
  const titleSvg = lines
    .map((l, i) => `<text x="150" y="${lastY - (lines.length - 1 - i) * size * 1.08}" text-anchor="middle" font-family="'Arial Black', Impact, Arial, sans-serif" font-weight="900" font-size="${size}" fill="#fff" letter-spacing="1">${esc(l)}</text>`)
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450" width="300" height="450">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
<linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset=".42" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".82"/></linearGradient>
</defs>
<rect width="300" height="450" fill="url(#bg)"/>
<g>${motifs[motif]({ c1, c2, c3 }, r)}</g>
<rect width="300" height="450" fill="url(#fade)"/>
<text x="150" y="30" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" font-weight="700" letter-spacing="3" fill="#fff" opacity=".85">${esc(m.genre.toUpperCase())} • ${esc(m.language.toUpperCase())}</text>
${titleSvg}
<text x="150" y="424" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="13" fill="${c3}">${esc(tagline)}</text>
<rect x="1.5" y="1.5" width="297" height="447" fill="none" stroke="#fff" stroke-opacity=".15" stroke-width="3"/>
</svg>
`;
  fs.writeFileSync(path.join(OUT, `${m.slug}.svg`), svg);
}
console.log(`Created ${movies.length} posters in ${OUT}`);
