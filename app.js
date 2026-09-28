const STORAGE_KEY = "pulse-member-desk-demo-v1";
const STAGES = ["New", "Contacted", "Visit booked", "Joined", "Not proceeding"];
const STAFF = ["", "Membership Desk", "Neema", "Juma"];
const SOURCES = ["WhatsApp", "Instagram", "Facebook", "Email", "Website", "QR code", "Walk-in", "Public link"];
let demoSource = sessionStorage.getItem("pulse-demo-source") || "WhatsApp";
const list = document.querySelector("#lead-list");
const template = document.querySelector("#lead-template");
let activeFilter = "all";

function dateValue(offset = 0) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

function detectedSource() {
  const requested = new URLSearchParams(window.location.search).get("source");
  return SOURCES.includes(requested) ? requested : demoSource;
}

function selectDemoSource(source) {
  if (!SOURCES.includes(source)) return;
  demoSource = source; sessionStorage.setItem("pulse-demo-source", source);
  document.querySelectorAll("[data-demo-source]").forEach(button => button.classList.toggle("active", button.dataset.demoSource === source));
  const status = document.querySelector("#demo-status"); status.textContent = `${source} selected`; window.setTimeout(() => { status.textContent = ""; }, 1800);
}

function seedLeads() {
  return [
    { id: crypto.randomUUID(), code: "PM-4821", name: "Amina K.", phone: "+255 7XX XXX 214", interest: "Membership enquiry", goal: "Strength & muscle", plan: "3 months", visitDate: dateValue(1), visitTime: "18:00", notes: "Would like to understand trainer support", source: "Instagram", stage: "Contacted", owner: "Neema", followup: dateValue(0), createdAt: Date.now() - 7800000 },
    { id: crypto.randomUUID(), code: "PM-6159", name: "David M.", phone: "+255 7XX XXX 821", interest: "Ninja Warrior", goal: "Sport performance", plan: "Not sure yet", visitDate: dateValue(3), visitTime: "16:30", notes: "Asking for a teenager", source: "WhatsApp", stage: "New", owner: "", followup: dateValue(0), createdAt: Date.now() - 4800000 },
    { id: crypto.randomUUID(), code: "PM-3075", name: "Sarah P.", phone: "+255 7XX XXX 099", interest: "Stretch & recovery", goal: "Mobility & recovery", plan: "1 month", visitDate: dateValue(2), visitTime: "10:00", notes: "Prefers a morning visit", source: "Website", stage: "Visit booked", owner: "Juma", followup: dateValue(2), createdAt: Date.now() - 3600000 },
    { id: crypto.randomUUID(), code: "PM-7294", name: "Michael R.", phone: "+255 7XX XXX 442", interest: "Personal training consultation", goal: "Weight management", plan: "6 months", visitDate: dateValue(-2), visitTime: "08:00", notes: "Visited earlier this week", source: "Walk-in", stage: "Joined", owner: "Neema", followup: "", createdAt: Date.now() - 172800000 }
  ];
}

function loadLeads() {
  try { const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY)); return Array.isArray(saved) ? saved : seedLeads(); }
  catch { return seedLeads(); }
}

let leads = loadLeads();
saveLeads();

function saveLeads() { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(leads)); }
function code() { return `PM-${Math.floor(1000 + Math.random() * 9000)}`; }
function displayDate(value) { return value ? new Intl.DateTimeFormat("en-TZ", { dateStyle: "medium" }).format(new Date(`${value}T12:00:00`)) : "No date"; }
function followUpDue(lead) { return Boolean(lead.followup && lead.followup <= dateValue(0) && !["Joined", "Not proceeding"].includes(lead.stage)); }
function whatsappMessage(lead) { return `Hello ${lead.name}, this is Pulse Gymnasium following up on your ${lead.interest.toLowerCase()} (${lead.code}).`; }

function showWhatsAppPreview(lead) {
  document.querySelector("#whatsapp-person").textContent = `${lead.name} · ${lead.phone}`;
  document.querySelector("#whatsapp-message").textContent = whatsappMessage(lead);
  document.querySelector("#whatsapp-preview").showModal();
}

function resetDemo() {
  leads = seedLeads(); activeFilter = "all"; saveLeads(); setFilter("all"); switchView("member");
  document.querySelector("#lead-form").reset(); document.querySelector("#confirmation").classList.add("hidden"); setMinimumDate();
  const status = document.querySelector("#demo-status"); status.textContent = "Demo reset"; window.setTimeout(() => { status.textContent = ""; }, 1800);
}

function createLead(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.checkValidity()) { form.reportValidity(); return; }
  const data = new FormData(form);
  const lead = {
    id: crypto.randomUUID(), code: code(), name: String(data.get("name")).trim(), phone: String(data.get("phone")).trim(),
    interest: String(data.get("interest")), goal: String(data.get("goal")), plan: String(data.get("plan")),
    visitDate: String(data.get("visitDate")), visitTime: String(data.get("visitTime")), notes: String(data.get("notes") || "").trim(),
    source: detectedSource(), stage: "New", owner: "", followup: dateValue(1), createdAt: Date.now()
  };
  leads.unshift(lead); saveLeads(); renderLeads();
  document.querySelector("#confirmation-code").textContent = lead.code;
  document.querySelector("#confirmation").classList.remove("hidden");
  form.reset(); setMinimumDate();
}

function updateLead(id, field, value) {
  const lead = leads.find((entry) => entry.id === id);
  if (!lead || !["stage", "owner", "followup"].includes(field)) return;
  if (field === "stage" && !STAGES.includes(value)) return;
  lead[field] = String(value).trim().slice(0, 60);
  saveLeads(); renderMetrics();
}

function filteredLeads() {
  if (activeFilter === "due") return leads.filter(followUpDue);
  if (activeFilter === "unassigned") return leads.filter((lead) => !lead.owner && !["Joined", "Not proceeding"].includes(lead.stage));
  if (activeFilter === "joined") return leads.filter((lead) => lead.stage === "Joined");
  return leads;
}

function renderMetrics() {
  document.querySelector("#metric-new").textContent = leads.filter((lead) => lead.stage === "New").length;
  document.querySelector("#metric-due").textContent = leads.filter(followUpDue).length;
  document.querySelector("#metric-visits").textContent = leads.filter((lead) => lead.stage === "Visit booked").length;
  document.querySelector("#metric-joined").textContent = leads.filter((lead) => lead.stage === "Joined").length;
  document.querySelector("#new-badge").textContent = leads.filter((lead) => lead.stage === "New").length;
}

function renderLeads() {
  const cards = filteredLeads().map((lead) => {
    const fragment = template.content.cloneNode(true);
    fragment.querySelector(".lead-code").textContent = lead.code;
    fragment.querySelector(".source-tag").textContent = lead.source;
    fragment.querySelector(".lead-name").textContent = lead.name;
    fragment.querySelector(".lead-interest").textContent = lead.interest;
    fragment.querySelector(".lead-context").textContent = `${lead.goal} · ${lead.plan}${lead.notes ? ` · ${lead.notes}` : ""}`;
    fragment.querySelector(".visit-date").textContent = displayDate(lead.visitDate);
    fragment.querySelector(".visit-time").textContent = lead.visitTime;
    const stage = fragment.querySelector('[data-action="stage"]');
    STAGES.forEach((value) => { const option = document.createElement("option"); option.value = value; option.textContent = value; stage.append(option); });
    stage.value = lead.stage; stage.addEventListener("change", () => { updateLead(lead.id, "stage", stage.value); renderLeads(); });
    const owner = fragment.querySelector('[data-action="owner"]'); STAFF.forEach((value) => { const option = document.createElement("option"); option.value = value; option.textContent = value || "Unassigned"; owner.append(option); }); owner.value = lead.owner; owner.addEventListener("change", () => updateLead(lead.id, "owner", owner.value));
    const followup = fragment.querySelector('[data-action="followup"]'); followup.value = lead.followup; followup.addEventListener("change", () => updateLead(lead.id, "followup", followup.value));
    const whatsapp = fragment.querySelector('[data-action="whatsapp"]'); whatsapp.addEventListener("click", () => showWhatsAppPreview(lead));
    return fragment;
  });
  list.replaceChildren(...cards);
  if (!cards.length) { const empty = document.createElement("p"); empty.className = "empty"; empty.textContent = "No leads match this filter."; list.append(empty); }
  renderMetrics();
}

function switchView(view) {
  document.querySelectorAll(".view").forEach((element) => element.classList.toggle("active", element.id === `${view}-view`));
  document.querySelectorAll("[data-view]").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
}

function setFilter(filter) {
  activeFilter = filter;
  document.querySelectorAll("[data-filter]").forEach((button) => button.classList.toggle("active", button.dataset.filter === filter));
  renderLeads();
}

function setMinimumDate() {
  const input = document.querySelector('[name="visitDate"]');
  input.min = dateValue(0); if (!input.value) input.value = dateValue(1);
}

document.querySelector("#lead-form").addEventListener("submit", createLead);
document.querySelector("[data-view-growth]").addEventListener("click", () => switchView("growth"));
document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => switchView(button.dataset.view)));
document.querySelectorAll("[data-filter]").forEach((button) => button.addEventListener("click", () => setFilter(button.dataset.filter)));
document.querySelector("#reset-demo").addEventListener("click", resetDemo);
document.querySelectorAll("[data-demo-source]").forEach(button => button.addEventListener("click", () => selectDemoSource(button.dataset.demoSource)));
selectDemoSource(demoSource); setMinimumDate(); renderLeads();
