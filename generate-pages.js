// Run:  node generate-pages.js
// Makes one page per main area (dadar.html, andheri.html ...) from the list in app.js.
// Re-run it after you edit MUMBAI_AREAS or AREA_ALIASES.
const fs = require("fs");
const src = fs.readFileSync(__dirname + "/app.js", "utf8");
const { MAIN_RECORDS, slugify } = new Function(
  src.slice(0, src.indexOf("function addOption")) + "; return { MAIN_RECORDS, slugify };"
)();

const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const enquiry = area => `enquiry.html?area=${encodeURIComponent(area)}`;

function page(rec) {
  const single = rec.areas.length === 1;
  const others = MAIN_RECORDS.filter(r => r.zone === rec.zone && r.main !== rec.main);
  const title = `Home Tuition & Online Classes in ${rec.main}, Mumbai | BookMyTeachers`;
  const desc = `Looking for a tutor in ${rec.main}, Mumbai? Choose your locality and share your class, board and subjects.`;
  const cards = rec.areas.map(a => `
      <a class="area-card" href="${enquiry(a)}" aria-label="Open teacher enquiry for ${esc(a)}">
        <strong>${esc(a)}</strong><small>Open enquiry</small>
      </a>`).join("");
  const more = others.length ? `
    <h2>Other areas in ${esc(rec.zone)}</h2>
    <div class="pills">${others.map(r =>
      `<a class="pill" href="${slugify(r.main)}.html">${esc(r.main)}</a>`).join("")}</div>` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#141e38">
  <link rel="icon" href="logo.png" type="image/png">
  <meta name="description" content="${esc(desc)}">
  <title>${esc(title)}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="container nav">
      <a class="logo" href="index.html"><img src="logo.png" width="208" height="105" alt="BookMyTeachers - home"></a>
      <div class="nav-actions"><a class="call-link" href="tel:+918108144644" aria-label="Call 81081 44644"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z"/></svg><span>81081 44644</span></a><a class="back-link" href="index.html">All areas</a></div>
    </div>
  </header>

  <main id="main" class="container section area-page">
    <p class="eyebrow">${esc(rec.zone.toUpperCase())}</p>
    <h1 class="page-title">Find a teacher in ${esc(rec.main)}</h1>
    <p class="muted area-page-lead">${single
      ? `Home tuition or online classes for Classes 1-12 in ${esc(rec.main)}. Open the enquiry form to share your class, board and subjects.`
      : `Home tuition or online classes for Classes 1-12 in ${esc(rec.main)}. Choose your locality to open the enquiry form.`}</p>

    <div class="area-grid">${cards}
    </div>
${more}
  </main>

  <footer class="site-footer">
    <div class="container footer-row"><img class="footer-logo" src="logo.png" width="80" height="40" alt="BookMyTeachers"><span>Mumbai tuition enquiries</span><div class="footer-contact"><a href="tel:+918108144644">Call 81081 44644</a><a href="https://wa.me/918108144644" target="_blank" rel="noopener">WhatsApp us</a></div></div>
  </footer>
</body>
</html>
`;
}

// Common alternate spellings: these small pages forward to the real page.
const SPELLINGS = { "prabadevi": "prabhadevi" };
Object.entries(SPELLINGS).forEach(([from, to]) => {
  if (!fs.existsSync(`${__dirname}/${to}.html`) && !MAIN_RECORDS.some(r => slugify(r.main) === to)) return;
  fs.writeFileSync(`${__dirname}/${from}.html`, `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<meta http-equiv="refresh" content="0; url=${to}.html">
<link rel="canonical" href="${to}.html"><title>Redirecting...</title></head>
<body><p>Going to <a href="${to}.html">${to}.html</a>...</p></body></html>
`);
});

MAIN_RECORDS.forEach(rec => fs.writeFileSync(`${__dirname}/${slugify(rec.main)}.html`, page(rec)));
console.log(`Wrote ${MAIN_RECORDS.length} pages`);
