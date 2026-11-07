"use strict";

// Enquiries are sent with AJAX (fetch) to FormSubmit, which emails each one.
const ENQUIRY_ENDPOINT = "https://formsubmit.co/ajax/newhelpline.it@gmail.com";
const ENQUIRY_EXTRA_FIELDS = { _template: "table", _captcha: "false" };
const REQUEST_TIMEOUT_MS = 15000;

// Editable browsing groups, not official administrative zones.
const MUMBAI_AREAS = {
  "Western Suburbs": [
    "Andheri East", "Andheri West", "Bandra East", "Bandra West",
    "Borivali East", "Borivali West", "Dahisar East", "Dahisar West",
    "Goregaon East", "Goregaon West", "Jogeshwari East", "Jogeshwari West",
    "Juhu", "Kandivali East", "Kandivali West", "Khar",
    "Malad East", "Malad West", "Santacruz East", "Santacruz West",
    "Vile Parle East", "Vile Parle West"
  ],
  "Central Suburbs": [
    "Bhandup", "Ghatkopar East", "Ghatkopar West", "Kanjurmarg",
    "Mulund East", "Mulund West", "Powai", "Vikhroli"
  ],
  "Central Mumbai": [
    "Dadar East", "Dadar West", "Lower Parel", "Mahim", "Matunga",
    "Parel", "Prabhadevi", "Sion", "Wadala", "Worli"
  ],
  "Eastern / Harbour Areas": [
    "Chembur", "Chunabhatti", "Govandi", "Kurla", "Mankhurd", "Trombay"
  ],
  "South Mumbai": [
    "Byculla", "Colaba", "Cuffe Parade", "Fort", "Girgaon",
    "Malabar Hill", "Marine Lines", "Mazgaon", "Tardeo"
  ],
  "Thane & Navi Mumbai": [
    "Airoli", "Belapur CBD", "Kharghar", "Mira Road", "Nerul",
    "Thane East", "Thane West", "Vashi"
  ]
};

// Landmarks people actually search for. Edit freely.
const AREA_ALIASES = {
  "Andheri East": ["sakinaka", "marol", "chakala", "mide"],
  "Andheri West": ["versova", "lokhandwala", "oshiwara"],
  "Bandra East": ["bkc", "kalanagar"],
  "Powai": ["hiranandani", "iit"],
  "Goregaon East": ["film city", "nesco"],
  "Lower Parel": ["kamala mills"],
  "Malad West": ["mindspace"],
  "Vile Parle West": ["juhu scheme"],
  "Thane West": ["ghodbunder", "majiwada"],
  "Kharghar": ["central park"]
};
function matchesTerm(area, term) {
  return area.toLowerCase().includes(term) ||
    (AREA_ALIASES[area] || []).some(a => a.includes(term));
}

const AREA_RECORDS = Object.entries(MUMBAI_AREAS)
  .flatMap(([zone, areas]) => areas.map(area => ({ zone, area })))
  .sort((a, b) => a.area.localeCompare(b.area));

// Main areas (Andheri, Dadar...) group their East/West localities.
const MAIN_RECORDS = (() => {
  const map = new Map();
  AREA_RECORDS.forEach(({ zone, area }) => {
    const main = area.replace(/ (East|West)$/, "");
    if (!map.has(main)) map.set(main, { main, zone, areas: [] });
    map.get(main).areas.push(area);
  });
  return [...map.values()].sort((a, b) => a.main.localeCompare(b.main));
})();

// dadar.html, lower-parel.html ... (pages are made by generate-pages.js)
function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const byId = id => document.getElementById(id);

function addOption(select, label, value = label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  select.append(option);
}

function populateZones(select) {
  Object.keys(MUMBAI_AREAS).forEach(zone => addOption(select, zone));
}

function populateAreas(select, zone = "", selected = "") {
  select.replaceChildren();
  addOption(select, "Choose an area", "");
  const records = AREA_RECORDS.filter(item => !zone || item.zone === zone);
  records.forEach(item => addOption(select, item.area));
  select.value = records.some(item => item.area === selected) ? selected : "";
}

function mainMatches(rec, term) {
  return rec.main.toLowerCase().includes(term) ||
    rec.areas.some(a => matchesTerm(a, term));
}

function populateMains(select, zone = "", selected = "") {
  select.replaceChildren();
  addOption(select, "Choose a main area", "");
  const records = MAIN_RECORDS.filter(r => !zone || r.zone === zone);
  records.forEach(r => addOption(select, r.main));
  select.value = records.some(r => r.main === selected) ? selected : "";
}

// Every main area has its own page, e.g. dadar.html.
function mainLink(rec) {
  return `${slugify(rec.main)}.html`;
}

function enquiryLink(area) {
  const params = new URLSearchParams({ area });
  return `enquiry.html?${params.toString()}`;
}

function initHomepage() {
  const zoneSelect = byId("zone");
  const areaSelect = byId("area");
  const searchInput = byId("area-search");
  const grid = byId("area-grid");

  populateZones(zoneSelect);
  populateMains(areaSelect);
  initHomeExtras(zoneSelect, areaSelect, searchInput);

  byId("area-form").addEventListener("submit", event => {
    event.preventDefault();
    const rec = MAIN_RECORDS.find(r => r.main === areaSelect.value);
    if (rec) window.location.href = mainLink(rec);
  });

  function renderCards() {
    const term = searchInput.value.trim().toLowerCase();
    const matches = MAIN_RECORDS.filter(rec =>
      (!zoneSelect.value || rec.zone === zoneSelect.value) &&
      mainMatches(rec, term)
    );

    grid.replaceChildren();
    matches.forEach(rec => {
      const single = rec.areas.length === 1;
      const link = document.createElement("a");
      link.className = "area-card";
      link.classList.toggle("is-selected", areaSelect.value === rec.main);
      link.href = mainLink(rec);
      link.setAttribute("aria-label", single
        ? `Open teacher enquiry for ${rec.main}`
        : `Choose a locality in ${rec.main}`);

      const title = document.createElement("strong");
      title.textContent = rec.main;
      const subtitle = document.createElement("small");
      subtitle.textContent = single
        ? `${rec.zone} - Open enquiry`
        : `${rec.zone} - ${rec.areas.length} localities`;
      link.append(title, subtitle);
      grid.append(link);
    });

    byId("area-count").textContent =
      `${matches.length} main ${matches.length === 1 ? "area" : "areas"} shown`;
    byId("empty-areas").hidden = matches.length > 0;
    document.querySelectorAll("#zone-pills button").forEach(b =>
      b.setAttribute("aria-pressed", String((b.dataset.zone || "") === zoneSelect.value)));
  }

  zoneSelect.addEventListener("change", () => {
    populateMains(areaSelect, zoneSelect.value, areaSelect.value);
    renderCards();
  });
  areaSelect.addEventListener("change", renderCards);
  searchInput.addEventListener("input", renderCards);
  renderCards();
}

function subjectsForClass(value) {
  const grade = Number(value);
  if (!Number.isInteger(grade) || grade < 1 || grade > 12) return [];
  if (grade <= 5) {
    return ["English", "Mathematics", "EVS", "Hindi", "Marathi", "Other"];
  }
  if (grade <= 10) {
    return [
      "English", "Mathematics", "Science", "Social Studies",
      "Hindi", "Marathi", "Computer Studies", "Other"
    ];
  }
  return [
    "English", "Mathematics", "Physics", "Chemistry", "Biology",
    "Accountancy", "Economics", "Business Studies", "History",
    "Geography", "Political Science", "Computer Science", "Other"
  ];
}

function initEnquiry() {
  const form = byId("enquiry-form");
  const zoneSelect = byId("enquiry-zone");
  const areaSelect = byId("enquiry-area");
  const classSelect = byId("student-class");
  const subjectOptions = byId("subject-options");
  const subjectError = byId("subjects-error");
  const nameInput = byId("contact-name");
  const feedback = byId("form-feedback");

  populateZones(zoneSelect);
  for (let grade = 1; grade <= 12; grade++) {
    addOption(classSelect, `Class ${grade}`, String(grade));
  }

  // Only accept an area present in our configured list.
  // Never insert query-string content as HTML.
  const requestedArea = new URLSearchParams(window.location.search).get("area");
  const match = AREA_RECORDS.find(item => item.area === requestedArea);
  zoneSelect.value = match ? match.zone : "";

  function refreshAreas(selected = "") {
    if (!zoneSelect.value) {
      areaSelect.replaceChildren();
      addOption(areaSelect, "Choose a zone first", "");
      areaSelect.disabled = true;
    } else {
      areaSelect.disabled = false;
      populateAreas(areaSelect, zoneSelect.value, selected);
    }
    updateAreaHeading();
  }

  // Back link goes to the main area page (Andheri East -> andheri.html).
  function updateBackLink() {
    const link = byId("back-link");
    const rec = MAIN_RECORDS.find(r => r.areas.includes(areaSelect.value));
    link.href = rec ? mainLink(rec) : "index.html";
    link.textContent = rec ? `Change locality in ${rec.main}` : "Change area / Home";
  }

  function updateAreaHeading() {
    updateBackLink();
    byId("selected-area-text").textContent = areaSelect.value
      ? `Teacher enquiry for ${areaSelect.value}, Mumbai. You can change the area below.`
      : "Select your area and complete the form below.";
  }

  function renderSubjects() {
    const prev = new Set([...subjectOptions.querySelectorAll("input:checked")].map(i => i.value));
    subjectOptions.replaceChildren();
    subjectError.textContent = "";
    const subjects = subjectsForClass(classSelect.value);
    byId("subjects-hint").textContent = subjects.length
      ? "Select one or more subjects. For Other, describe your needs in the notes."
      : "Choose a class first, then select one or more subjects.";

    subjects.forEach((subject, index) => {
      const label = document.createElement("label");
      label.className = "subject-chip";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.name = "subjects";
      input.value = subject;
      input.id = `subject-${index}`;
      input.checked = prev.has(subject);
      const text = document.createElement("span");
      text.textContent = subject;
      label.append(input, text);
      subjectOptions.append(label);
    });
  }

  function validateSubjects() {
    const boxes = [...subjectOptions.querySelectorAll("input")];
    const valid = boxes.some(box => box.checked);
    const message = valid ? "" : "Please select at least one subject.";
    subjectError.textContent = message;
    if (boxes[0]) boxes[0].setCustomValidity(message);
    return valid;
  }

  refreshAreas(match ? match.area : "");
  renderSubjects();
  initEnquiryExtras(form);

  zoneSelect.addEventListener("change", () => refreshAreas());
  areaSelect.addEventListener("change", updateAreaHeading);
  classSelect.addEventListener("change", renderSubjects);
  subjectOptions.addEventListener("change", validateSubjects);
  nameInput.addEventListener("input", () => nameInput.setCustomValidity(""));

  
  form.addEventListener("input", () => { feedback.hidden = true; });
  form.addEventListener("change", () => { feedback.hidden = true; });

  const submitBtn = byId("submit-enquiry");
  let sending = false;

  function showFeedback(ok, message) {
    feedback.className = ok ? "notice success" : "notice failure";
    feedback.setAttribute("role", ok ? "status" : "alert");
    feedback.textContent = message;
    feedback.hidden = false;
    feedback.focus();
  }

  function resetEnquiryForm() {
    form.reset();
    zoneSelect.value = "";
    refreshAreas();
    renderSubjects();
    try { sessionStorage.removeItem("bmt:draft"); } catch { /* ignore */ }
    form.dispatchEvent(new Event("change")); // refresh progress and summary
  }

  async function sendEnquiry(payload) {
    if (!ENQUIRY_ENDPOINT) throw new Error("not-configured");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(ENQUIRY_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`http-${response.status}`);
      // FormSubmit answers 200 with success:"false" (e.g. email not yet activated).
      const result = await response.json().catch(() => ({}));
      if (result.success === false || result.success === "false") {
        throw new Error(result.message || "rejected");
      }
    } finally {
      clearTimeout(timer);
    }
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (sending) return;
    feedback.hidden = true;
    nameInput.setCustomValidity(
      nameInput.value.trim().length >= 2
        ? ""
        : "Please enter a contact name with at least two characters."
    );
    const subjectsValid = validateSubjects();
    const fieldsValid = form.reportValidity();
    if (!subjectsValid || !fieldsValid) return;

    const payload = Object.fromEntries(new FormData(form).entries());
    payload.contactName = payload.contactName.trim();
    payload.subjects = [...subjectOptions.querySelectorAll("input:checked")]
      .map(input => input.value);
    payload.consent = byId("consent").checked;
    payload.submittedAt = new Date().toISOString();
    // Readable fields so email services show a clear subject and subject list.
    payload.subjectsText = payload.subjects.join(", ");
    payload._subject = `New tuition enquiry: ${payload.area}, Class ${payload.studentClass}`;
    Object.assign(payload, ENQUIRY_EXTRA_FIELDS);

    const thanks = `Thank you, ${payload.contactName}. We have received your ` +
      `enquiry for ${payload.area} and will use your mobile number to get in touch.`;

    // Hidden field only bots fill in: pretend success, send nothing.
    if (payload.website) {
      resetEnquiryForm();
      showFeedback(true, thanks);
      return;
    }
    delete payload.website;

    sending = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";
    try {
      await sendEnquiry(payload);
      resetEnquiryForm();
      showFeedback(true, thanks);
    } catch (error) {
      console.error("Enquiry failed:", error);
      const message = error.message === "not-configured"
        ? "Enquiries can't be sent right now. Please try again later."
        : error.name === "AbortError"
          ? "The request took too long. Check your connection and try again."
          : "We couldn't send your enquiry. Check your connection and try again. Your details are still filled in.";
      showFeedback(false, message);
    } finally {
      sending = false;
      submitBtn.disabled = false;
      submitBtn.textContent = "Send my enquiry";
    }
  });

  // Remains disabled if JavaScript does not initialize.
  byId("submit-enquiry").disabled = false;
}

if (byId("area-form")) initHomepage();
if (byId("enquiry-form")) initEnquiry();

// ---------- Extras ----------
function initHomeExtras(zoneSelect, areaSelect, searchInput) {
  const popular = ["Andheri", "Bandra", "Dadar", "Borivali", "Powai", "Malad", "Chembur", "Colaba"];
  byId("popular").replaceChildren(...popular.map(name => {
    const rec = MAIN_RECORDS.find(r => r.main === name);
    const a = document.createElement("a");
    a.href = rec ? mainLink(rec) : "#";
    a.textContent = name;
    return a;
  }));

  try {
    const last = localStorage.getItem("bmt:lastArea");
    if (AREA_RECORDS.some(r => r.area === last)) {
      const a = document.createElement("a");
      a.className = "recent";
      a.href = enquiryLink(last);
      a.textContent = `Continue with ${last}`;
      byId("popular").prepend(a);
    }
  } catch { /* storage unavailable */ }

  const pills = byId("zone-pills");
  const make = (label, zone) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "pill";
    b.dataset.zone = zone;
    b.textContent = label;
    b.addEventListener("click", () => {
      zoneSelect.value = zone;
      zoneSelect.dispatchEvent(new Event("change"));
    });
    return b;
  };
  const count = z => MAIN_RECORDS.filter(r => r.zone === z).length;
  pills.append(make(`All (${MAIN_RECORDS.length})`, ""),
    ...Object.keys(MUMBAI_AREAS).map(z => make(`${z} (${count(z)})`, z)));

  byId("reset-filters").addEventListener("click", () => {
    searchInput.value = "";
    zoneSelect.value = "";
    zoneSelect.dispatchEvent(new Event("change"));
    searchInput.focus();
  });

  // Press "/" to jump to search, like most modern sites.
  document.addEventListener("keydown", e => {
    const t = e.target.tagName;
    if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(t)) {
      e.preventDefault();
      searchInput.focus();
    }
  });
}

function initEnquiryExtras(form) {
  const phone = byId("phone");
  const notes = byId("notes");
  const bar = byId("progress-bar");
  const text = byId("progress-text");
  const summary = byId("summary");

  // Remember requirements (never contact details) so a refresh doesn't lose them.
  const KEY = "bmt:draft";
  const readDraft = () => {
    try { return JSON.parse(sessionStorage.getItem(KEY)) || {}; } catch { return {}; }
  };
  const d = readDraft();
  if (d.studentClass) {
    byId("student-class").value = d.studentClass;
    byId("student-class").dispatchEvent(new Event("change", { bubbles: true }));
  }
  ["board", "mode", "frequency"].forEach(id => { if (d[id]) byId(id).value = d[id]; });
  (d.subjects || []).forEach(s => {
    const box = [...form.querySelectorAll("[name=subjects]")].find(i => i.value === s);
    if (box) box.checked = true;
  });
  function saveDraft() {
    try {
      sessionStorage.setItem(KEY, JSON.stringify({
        studentClass: byId("student-class").value,
        board: byId("board").value,
        mode: byId("mode").value,
        frequency: byId("frequency").value,
        subjects: [...form.querySelectorAll("[name=subjects]:checked")].map(i => i.value)
      }));
      if (byId("enquiry-area").value) {
        localStorage.setItem("bmt:lastArea", byId("enquiry-area").value);
      }
    } catch { /* storage unavailable */ }
  }

  const steps = () => [
    byId("enquiry-zone").value, byId("enquiry-area").value,
    byId("student-class").value, byId("board").value,
    form.querySelector("[name=subjects]:checked"), byId("mode").value,
    byId("contact-name").value.trim().length >= 2,
    /^[0-9]{10}$/.test(phone.value), byId("consent").checked
  ];

  function refresh() {
    const done = steps().filter(Boolean).length;
    bar.style.width = `${(done / 9) * 100}%`;
    text.textContent = done === 9
      ? "All required details are filled in. You can send your enquiry."
      : `${done} of 9 required steps done`;

    const subjects = [...form.querySelectorAll("[name=subjects]:checked")]
      .map(i => i.value).join(", ");
    const rows = [
      ["Area", byId("enquiry-area").value],
      ["Class", byId("student-class").value && `Class ${byId("student-class").value}`],
      ["Board", byId("board").value],
      ["Subjects", subjects],
      ["Mode", byId("mode").value],
      ["Frequency", byId("frequency").value]
    ].filter(([, v]) => v);
    summary.replaceChildren();
    if (!rows.length) {
      const dd = document.createElement("dd");
      dd.className = "muted small";
      dd.textContent = "Your choices will appear here.";
      summary.append(dd);
    }
    rows.forEach(([k, v]) => {
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = k;
      dd.textContent = v;
      summary.append(dt, dd);
    });
    byId("notes-count").textContent = `${notes.value.length} / 1000`;
  }

  // Keep only digits and drop a pasted +91 or leading 0.
  phone.addEventListener("input", () => {
    let d = phone.value.replace(/\D/g, "");
    if (d.length > 10 && d.startsWith("91")) d = d.slice(2);
    phone.value = d.replace(/^0+(?=\d{10})/, "").slice(0, 10);
  });
  phone.addEventListener("invalid", () =>
    phone.setCustomValidity("Enter a 10-digit mobile number, like 9876543210."));
  phone.addEventListener("input", () => phone.setCustomValidity(""));

  form.addEventListener("input", refresh);
  form.addEventListener("change", () => { refresh(); saveDraft(); });
  refresh();
}


