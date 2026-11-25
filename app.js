"use strict";
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
let lang = localStorage.getItem("up_lang") || "ar", meta = null, page = "dashboard", scen = "water";
const COL = { critical: "#ef4444", high: "#f97316", medium: "#eab308", low: "#22c55e" };
const CATS = ["road", "garbage", "water", "light", "traffic", "other"], LEVELS = ["critical", "high", "medium", "low"], STATUSES = ["new", "review", "progress", "resolved"];

const T = {
  nav_dashboard: ["لوحة التحكم", "Dashboard"], nav_report: ["بلاغ جديد", "New report"], nav_incidents: ["البلاغات", "Incidents"], nav_map: ["الخريطة", "Map"],
  nav_resources: ["الموارد", "Resources"], nav_sim: ["محاكاة الطوارئ", "Emergency simulation"], demo: ["وضع العرض", "Demo mode"],
  c_status: ["توزيع البلاغات", "Reports distribution"], c_cat: ["المشاكل حسب الفئة", "Problems by category"], c_prio: ["توزيع الأولويات (المفتوحة)", "Priority distribution (open)"],
  c_city: ["حالة المدينة", "City status"], c_recent: ["أحدث البلاغات", "Recent incidents"],
  k_total: ["إجمالي البلاغات", "Total reports"], k_pending: ["قيد الانتظار", "Pending"], k_progress: ["قيد المعالجة", "In progress"], k_resolved: ["تم الحل", "Resolved"],
  k_crit: ["حرجة", "Critical"], k_resp: ["متوسط زمن الاستجابة", "Avg response time"], hours: ["ساعة", "h"], none: ["لا توجد بيانات", "No data"],
  health: ["مؤشر صحة المدينة", "City health index"], open_n: ["مفتوح", "open"], eta: ["الوقت المتوقع للوصول للبلاغات المنتظرة", "Estimated arrival for queued reports"],
  f_title_h: ["تقديم بلاغ", "Submit a report"], f_title: ["عنوان البلاغ", "Report title"], f_desc: ["وصف المشكلة", "Problem description"], f_cat: ["الفئة", "Category"],
  f_sev: ["الشدة", "Severity"], f_district: ["الحي", "District"], f_street: ["الشارع / الموقع", "Street / location"], f_people: ["عدد المتأثرين (تقدير)", "People affected (estimate)"],
  f_date: ["التاريخ والوقت", "Date and time"], f_preview: ["تحليل مبدئي", "Preview analysis"], f_submit: ["إرسال البلاغ", "Submit report"], auto: ["كشف تلقائي", "Auto-detect"],
  sev1: ["1 - طفيفة", "1 - Minor"], sev2: ["2 - منخفضة", "2 - Low"], sev3: ["3 - متوسطة", "3 - Moderate"], sev4: ["4 - خطيرة", "4 - Serious"], sev5: ["5 - حرجة", "5 - Critical"],
  road: ["أضرار الطرق", "Road damage"], garbage: ["النفايات", "Garbage"], water: ["تسرب المياه", "Water leakage"], light: ["الإنارة", "Streetlights"], traffic: ["المرور", "Traffic"], other: ["أخرى", "Other"],
  critical: ["حرج", "Critical"], high: ["عالٍ", "High"], medium: ["متوسط", "Medium"], low: ["منخفض", "Low"],
  new: ["جديد", "New"], review: ["قيد المراجعة", "Under review"], progress: ["قيد التنفيذ", "In progress"], resolved: ["تم الحل", "Resolved"],
  maintenance: ["فرق الصيانة", "Maintenance"], garbageT: ["مركبات النفايات", "Garbage vehicles"], waterT: ["فرق المياه", "Water teams"], electric: ["فرق الكهرباء", "Electrical"], emergency: ["وحدات الطوارئ", "Emergency"],
  search: ["بحث بالعنوان أو الوصف أو الرقم...", "Search title, description or ID..."], clear: ["مسح", "Clear"], all: ["الكل", "All"],
  th: ["#", "#"], th_title: ["العنوان", "Title"], th_cat: ["الفئة", "Category"], th_dist: ["الحي", "District"], th_prio: ["الأولوية", "Priority"], th_status: ["الحالة", "Status"], th_team: ["الفريق", "Team"], th_act: ["إجراءات", "Actions"],
  details: ["تفاصيل", "Details"], resolve: ["تم الحل", "Resolve"], del: ["حذف", "Delete"], unassigned: ["غير معيّن", "Unassigned"],
  empty_list: ["لا توجد بلاغات مطابقة. جرّب تغيير الفلاتر أو أضف بلاغاً جديداً.", "No matching reports. Change the filters or submit a new report."],
  empty_an: ["املأ النموذج ثم اضغط «تحليل مبدئي» أو «إرسال البلاغ» لرؤية تحليل المحرك المحلي.", "Fill in the form and press “Preview analysis” or “Submit report” to see the local engine analysis."],
  engine: ["محرك تحليل محلي (محاكاة) — لا يستخدم نموذج ذكاء اصطناعي حياً", "Local rule-based engine (simulated) — not a live AI model"],
  a_cat: ["الفئة المكتشفة", "Detected category"], a_level: ["مستوى الخطورة", "Severity level"], a_score: ["درجة الأولوية", "Priority score"], a_team: ["الفريق الموصى به", "Recommended team"],
  a_action: ["الإجراء المقترح", "Suggested action"], a_urg: ["الاستعجال المقدر", "Estimated urgency"], within: ["خلال", "within"],
  a_dup: ["تكرار محتمل", "Possible duplicate"], a_dup_t: ["يشبه البلاغ رقم", "Similar to report #"], a_why: ["لماذا؟ (التفسير)", "Why? (explainability)"],
  w_cat: ["الكلمات الدالة على الفئة", "Category keywords matched"], w_nokw: ["لا كلمات مطابقة — تم اختيار «أخرى» أو فئة المستخدم", "No keywords matched — fell back to “other” / user choice"],
  w_user: ["اخترت الفئة يدوياً (الكشف التلقائي:", "Category set manually (auto-detected:"], w_bonus: ["علاوة تكرار", "Duplicate bonus"],
  fa_safety: ["خطر على السلامة", "Public safety risk"], fa_people: ["عدد المتأثرين", "People affected"], fa_damage: ["ضرر البنية التحتية", "Infrastructure damage"], fa_urgency: ["الاستعجال", "Urgency"], fa_impact: ["الأثر المجتمعي", "Community impact"],
  w_sig: ["إشارات مرصودة", "Signals found"], base: ["الدرجة الأساسية", "Base score"],
  alloc: ["تشغيل التوزيع التلقائي", "Run auto-allocation"], recs: ["توصيات التوزيع (حسب الأولوية)", "Allocation recommendations (by priority)"], total: ["الإجمالي", "Total"], busy: ["مشغولة", "Busy"], avail: ["متاحة", "Available"], util: ["نسبة الاستخدام", "Utilization"],
  now: ["الآن", "now"], queued: ["في الانتظار", "queued"], fallback: ["تحويل لوحدات الطوارئ", "emergency fallback"], merged: ["مدمج مع البلاغ", "merged into #"], no_pending: ["لا توجد بلاغات بانتظار التخصيص.", "No incidents waiting for allocation."],
  assigned_ok: ["تم تخصيص الموارد", "Resources allocated"], eta_h: ["الوصول المتوقع", "ETA"],
  sim_note: ["المحاكاة تعمل على نسخة من البيانات ولا تغيّر بياناتك إلا إذا فعّلت الخيار أدناه.", "The simulation runs on a copy of the data and only changes your data if you tick the option below."],
  sim_apply: ["تطبيق البلاغات المولّدة على بيانات المدينة", "Apply generated incidents to city data"], sim_run: ["تشغيل المحاكاة", "Run simulation"],
  s_water: ["موجة تسرب مياه", "Water leakage surge"], s_water_d: ["12 بلاغ تسرب مياه مفاجئ", "12 sudden water leaks"],
  s_accidents: ["حوادث طرق متعددة", "Multiple road accidents"], s_accidents_d: ["8 حوادث تصادم", "8 collisions"],
  s_blackout: ["انقطاع كهرباء شامل", "Citywide power failure"], s_blackout_d: ["14 بلاغ انقطاع وإنارة", "14 outage reports"],
  s_garbage: ["تراكم نفايات", "Garbage accumulation"], s_garbage_d: ["10 بلاغات في عدة أحياء", "10 reports across districts"],
  s_limited: ["نقص الموارد", "Limited resources"], s_limited_d: ["بلاغات متنوعة + 40٪ فقط من الفرق", "Mixed incidents + only 40% of crews"],
  m_pending: ["بلاغات بانتظار التخصيص", "Pending incidents"], m_crit: ["بلاغات حرجة", "Critical incidents"], m_prio: ["متوسط الأولوية", "Average priority"],
  m_eta: ["متوسط زمن الوصول (ساعة)", "Avg arrival time (h)"], m_ceta: ["زمن وصول الحرجة (ساعة)", "Critical arrival (h)"], m_max: ["أطول انتظار (ساعة)", "Longest wait (h)"], m_wait: ["بلاغات في الانتظار", "Queued incidents"],
  before: ["قبل", "Before"], after: ["بعد", "After"], metric: ["المؤشر", "Metric"], s_decisions: ["قرارات النظام وتفسيرها", "System decisions and why"], s_util: ["استخدام الفرق", "Crew utilization"],
  d_assign: ["خُصّص فوراً إلى", "assigned immediately to"], d_queue: ["أُدرج في الطابور لدى", "queued for"], d_fb: ["حُوّل إلى وحدات الطوارئ لأنها أسرع (حرج)", "rerouted to emergency units because they are faster (critical)"],
  d_over: ["ضغط زائد على:", "Overload on:"], d_scaled: ["تم تقليص الموارد إلى", "Resources reduced to"], d_prio: ["الأولوية", "priority"], applied: ["تم تطبيق البلاغات المولّدة على البيانات", "Generated incidents were applied to city data"],
  reset: ["إعادة ضبط البيانات التجريبية", "Reset sample data"], reset_q: ["سيتم حذف كل البلاغات واستعادة البيانات التجريبية. متابعة؟", "All reports will be deleted and sample data restored. Continue?"], reset_ok: ["تمت إعادة الضبط", "Data reset"],
  saved: ["تم الحفظ", "Saved"], created: ["تم إرسال البلاغ وتحليله", "Report submitted and analyzed"], deleted: ["تم حذف البلاغ", "Report deleted"], del_q: ["حذف هذا البلاغ نهائياً؟", "Delete this report permanently?"],
  save: ["حفظ التعديلات", "Save changes"], assign_t: ["تعيين الفريق", "Assign team"],
  foot: ["UrbanPulse — محرك التحليل محلي ومحاكى؛ البيانات محفوظة في SQLite", "UrbanPulse — the analysis engine is local and simulated; data is stored in SQLite"],
  demo_h: ["وضع العرض: سير العمل الكامل", "Demo mode: full workflow"], demo_run: ["تشغيل العرض", "Run demo"], demo_done: ["اكتمل العرض. الإحصاءات محدّثة في لوحة التحكم.", "Demo complete. Dashboard statistics are updated."],
  ds1: ["إرسال بلاغ مواطن جديد", "Submit a new citizen report"], ds2: ["تحليل البلاغ بالمحرك المحلي", "Analyze with the local engine"], ds3: ["درجة الأولوية", "Priority score"], ds4: ["كشف التكرار", "Duplicate detection"],
  ds5: ["الفريق الموصى به", "Recommended team"], ds6: ["تخصيص الموارد المتاحة", "Allocate available resources"], ds7: ["تشغيل محاكاة طوارئ (تسرب مياه)", "Run an emergency simulation (water surge)"], ds8: ["إحصاءات المدينة المحدّثة", "Updated city statistics"],
  no_dup: ["لا يوجد تكرار", "No duplicate found"], close: ["إغلاق", "Close"],
  demo_title: ["تسرب مياه عند بوابة الجامعة", "Water leak at the university gate"], demo_desc: ["انفجار انبوب مياه قرب المدرسة والبوابة وفيضان في الرصيف، يرجى التدخل فورا", "Burst water pipe near the school gate flooding the sidewalk, please respond immediately"],
};
const t = k => (T[k] || [k, k])[lang === "ar" ? 0 : 1];
const catL = c => t(c), teamL = x => t(x === "garbage" ? "garbageT" : x === "water" ? "waterT" : x);
const dist = k => meta.districts[k][lang];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const badge = l => `<span class="badge b-${l}">${t(l)}</span>`;
const fmtD = s => new Date(s).toLocaleString(lang === "ar" ? "ar" : "en-GB", { dateStyle: "short", timeStyle: "short" });
const opts = (vals, lab, sel) => vals.map(v => `<option value="${v}" ${v === sel ? "selected" : ""}>${lab(v)}</option>`).join("");

function toast(msg, kind = "") { const d = document.createElement("div"); d.className = "toast " + kind; d.textContent = msg; $("#toasts").append(d); setTimeout(() => d.remove(), 3800); }
async function api(path, method = "GET", body) {
  try { return await window.localApi(path, method, body); }
  catch (e) { toast(e.message || "Local database error", "err"); throw e; }
}

/* ---------- small charts ---------- */
function donut(segs) {
  const tot = segs.reduce((a, s) => a + s.v, 0); if (!tot) return `<div class="empty">${t("none")}</div>`;
  const C = 2 * Math.PI * 40; let off = 0;
  const arcs = segs.filter(s => s.v).map(s => { const l = s.v / tot * C, e = `<circle r="40" cx="50" cy="50" fill="none" stroke="${s.c}" stroke-width="14" stroke-dasharray="${l} ${C - l}" stroke-dashoffset="${-off}"/>`; off += l; return e; }).join("");
  return `<svg viewBox="0 0 100 100" class="donut"><g transform="rotate(-90 50 50)">${arcs}</g><text x="50" y="55" text-anchor="middle" class="dn">${tot}</text></svg>
  <div class="lg">${segs.map(s => `<span><i style="background:${s.c}"></i>${s.l}: ${s.v}</span>`).join("")}</div>`;
}
function bars(rows) {
  const mx = Math.max(1, ...rows.map(r => r.v));
  return rows.map(r => `<div class="brow"><span>${r.l}</span><div class="bar"><i style="width:${r.v / mx * 100}%;${r.c ? "background:" + r.c : ""}"></i></div><b>${r.v}</b></div>`).join("");
}
function drawMap(el, list) {
  const roads = [[0, 50, 100, 50], [50, 0, 50, 100], [0, 16, 100, 16], [0, 84, 100, 84], [16, 0, 16, 100], [84, 0, 84, 100]].map(r => `<line x1="${r[0]}" y1="${r[1]}" x2="${r[2]}" y2="${r[3]}" stroke="#1d2c52" stroke-width="${r[0] === 0 && r[1] === 50 || r[0] === 50 && r[1] === 0 ? 1.6 : .7}"/>`).join("");
  const zones = Object.entries(meta.districts).map(([k, d]) => `<rect x="${d.x - 11}" y="${d.y - 9}" width="22" height="18" rx="2" fill="#13234a" opacity=".45"/><text x="${d.x}" y="${d.y + 8}" text-anchor="middle">${d[lang]}</text>`).join("");
  const mk = list.filter(r => r.status !== "resolved").map(r => `${r.level === "critical" ? `<circle class="pulse" cx="${r.x}" cy="${r.y}" r="2.2"/>` : ""}<circle class="mk" data-id="${r.id}" cx="${r.x}" cy="${r.y}" r="2.1" fill="${COL[r.level]}" stroke="#0a1020" stroke-width=".3"><title>#${r.id} ${esc(r.title)} — ${r.priority}</title></circle>`).join("");
  el.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">${zones}${roads}${mk}</svg>`;
  el.querySelectorAll(".mk").forEach(c => c.onclick = () => openDetail(+c.dataset.id));
  if (!list.some(r => r.status !== "resolved")) el.insertAdjacentHTML("beforeend", `<div class="empty">${t("none")}</div>`);
}
const legend = () => LEVELS.map(l => `<span><i style="background:${COL[l]}"></i>${t(l)}</span>`).join("");

/* ---------- pages ---------- */
let reports = [];
async function renderDashboard() {
  const [s, list] = await Promise.all([api("/stats"), api("/reports")]); reports = list;
  const k = (v, l, c = "") => `<div class="kpi ${c}"><b>${v}</b><span>${t(l)}</span></div>`;
  $("#kpis").innerHTML = k(s.total, "k_total") + k(s.pending, "k_pending") + k(s.progress, "k_progress") + k(s.resolved, "k_resolved") + k(s.critical, "k_crit", "crit")
    + k(s.avg_response == null ? "—" : `${s.avg_response} <small>${t("hours")}</small>`, "k_resp", "gold");
  const sc = { new: "#3b82f6", review: "#a78bfa", progress: "#22d3ee", resolved: "#22c55e" };
  $("#chStatus").innerHTML = donut(STATUSES.map(x => ({ v: s.by_status[x], c: sc[x], l: t(x) })));
  $("#chCat").innerHTML = bars(CATS.map(c => ({ l: catL(c), v: s.by_category[c] })));
  $("#chPrio").innerHTML = bars(LEVELS.map(l => ({ l: t(l), v: s.by_level[l], c: COL[l] })));
  drawMap($("#mapDash"), list); $("#mapLegend").innerHTML = legend();
  const hc = s.health >= 70 ? COL.low : s.health >= 45 ? COL.medium : COL.critical;
  $("#city").innerHTML = `<div class="health"><b style="color:${hc}">${s.health}</b><div style="flex:1"><div class="muted">${t("health")}</div><div class="bar"><i style="width:${s.health}%;background:${hc}"></i></div></div></div>`
    + Object.entries(s.districts).map(([d, v]) => `<div class="brow" style="grid-template-columns:110px 1fr 60px"><span>${dist(d)}</span><div class="bar ${v.max >= 55 ? "warn" : ""}"><i style="width:${v.max}%"></i></div><small class="muted">${v.count} ${t("open_n")}</small></div>`).join("")
    + `<p class="muted" style="margin:8px 0 0">${t("eta")}: <b class="score">${s.est_eta} ${t("hours")}</b></p>`;
  const rec = [...list].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 6);
  $("#recent").innerHTML = rec.length ? rec.map(r => `<div class="item" data-id="${r.id}"><div><b>${esc(r.title)}</b><small>${catL(r.category)} · ${dist(r.district)} · ${t(r.status)}</small></div>${badge(r.level)}</div>`).join("") : `<div class="empty">${t("empty_list")}</div>`;
  $$("#recent .item").forEach(e => e.onclick = () => openDetail(+e.dataset.id));
}

function analysisHTML(a, withTitle) {
  const an = a.analysis, f = an.factors, lines = [];
  const hits = an.hits[an.detected] || [];
  lines.push(`<li><b>${t("w_cat")}:</b> ${hits.length ? hits.map(esc).join("، ") : t("w_nokw")}</li>`);
  if (an.chosen !== an.detected) lines.push(`<li>${t("w_user")} ${catL(an.detected)})</li>`);
  const sig = Object.values(an.signals).flat();
  if (sig.length) lines.push(`<li><b>${t("w_sig")}:</b> ${sig.map(esc).join("، ")}</li>`);
  const fac = Object.keys(f).map(k => `<div class="brow" style="grid-template-columns:130px 1fr 60px"><span>${t("fa_" + k)}</span><div class="bar"><i style="width:${f[k]}%"></i></div><small>${f[k]} ×${an.weights[k]}</small></div>`).join("");
  lines.push(`<li><b>${t("base")}:</b> ${an.base}${an.bonus ? ` + ${t("w_bonus")} ${an.bonus}` : ""} = <span class="score">${a.priority}</span></li>`);
  return `${withTitle ? `<h3>${esc(withTitle)}</h3>` : ""}<p class="muted" style="margin-top:0">${t("engine")}</p>
  <div class="between"><div><div class="muted">${t("a_score")}</div><div class="big-score">${a.priority}</div></div><div>${badge(a.level)}</div></div>
  <dl class="kv"><dt>${t("a_cat")}</dt><dd>${catL(a.category)}</dd><dt>${t("a_team")}</dt><dd>${teamL(a.team)}</dd>
  <dt>${t("a_action")}</dt><dd>${esc(an.action[lang])}</dd><dt>${t("a_urg")}</dt><dd>${t("within")} ${a.urgency_h} ${t("hours")}</dd></dl>
  ${an.dup ? `<div class="dup"><b>${t("a_dup")}:</b> ${t("a_dup_t")}${an.dup.id} — ${esc(an.dup.title)} (${an.dup.score})</div>` : ""}
  <div class="explain"><b>${t("a_why")}</b>${fac}<ul>${lines.join("")}</ul></div>`;
}

function formData() {
  const f = Object.fromEntries(new FormData($("#form")));
  if (f.category === "auto") f.category = null;
  if (!f.created_at) delete f.created_at;
  return f;
}
function initForm() {
  const sel = (id, h) => { const el = $(id), v = el.value; el.innerHTML = h; if (v) el.value = v; };
  sel("#fCat", `<option value="auto">${t("auto")}</option>` + opts(CATS, catL));
  sel("#fSev", [1, 2, 3, 4, 5].map(n => `<option value="${n}" ${n === 3 ? "selected" : ""}>${t("sev" + n)}</option>`).join(""));
  sel("#fDist", opts(Object.keys(meta.districts), dist));
  const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); if (!$("#form [name=created_at]").value) $("#form [name=created_at]").value = d.toISOString().slice(0, 16);
}
$("#previewBtn").onclick = async () => { const a = await api("/analyze", "POST", formData()); $("#analysisBox").innerHTML = analysisHTML(a); };
$("#form").onsubmit = async e => {
  e.preventDefault();
  const r = await api("/reports", "POST", formData());
  $("#analysisBox").innerHTML = analysisHTML(r, `#${r.id} ${r.title}`);
  toast(t("created") + ` (#${r.id})`); $("#form").reset(); initForm();
};
const emptyAnalysis = () => $("#analysisBox").innerHTML = `<div class="empty">${t("empty_an")}</div>`;

/* ---------- incidents ---------- */
function initFilters() {
  const keep = id => $(id).value;
  const c = keep("#fcat"), l = keep("#flev"), s = keep("#fsta");
  $("#fcat").innerHTML = `<option value="">${t("th_cat")}: ${t("all")}</option>` + opts(CATS, catL);
  $("#flev").innerHTML = `<option value="">${t("th_prio")}: ${t("all")}</option>` + opts(LEVELS, t);
  $("#fsta").innerHTML = `<option value="">${t("th_status")}: ${t("all")}</option>` + opts(STATUSES, t);
  $("#fcat").value = c; $("#flev").value = l; $("#fsta").value = s;
}
async function renderIncidents() {
  const q = new URLSearchParams({ q: $("#fq").value, category: $("#fcat").value, level: $("#flev").value, status: $("#fsta").value });
  const list = await api("/reports?" + q);
  const head = `<tr>${["th", "th_title", "th_cat", "th_dist", "th_prio", "th_status", "th_team", "th_act"].map(k => `<th>${t(k)}</th>`).join("")}</tr>`;
  if (!list.length) { $("#tbl").innerHTML = head + `<tr><td colspan="8" class="empty">${t("empty_list")}</td></tr>`; return; }
  $("#tbl").innerHTML = head + list.map(r => `<tr class="clk" data-id="${r.id}"><td>${r.id}</td><td><b>${esc(r.title)}</b>${r.duplicate_of ? ` <span class="chip">${t("merged")}${r.duplicate_of}</span>` : ""}<br><small class="muted">${fmtD(r.created_at)}</small></td>
  <td><span class="chip">${catL(r.category)}</span></td><td>${dist(r.district)}</td><td>${badge(r.level)} <span class="score">${r.priority}</span></td>
  <td><select data-a="status">${opts(STATUSES, t, r.status)}</select></td>
  <td><select data-a="team"><option value="">${t("unassigned")}</option>${opts(meta.teams.map(x => x.type), teamL, r.assigned_team)}</select></td>
  <td><button class="ghost sm" data-a="open">${t("details")}</button> ${r.status !== "resolved" ? `<button class="sm" data-a="resolve">${t("resolve")}</button>` : ""}</td></tr>`).join("");
  $$("#tbl tr.clk").forEach(tr => {
    const id = +tr.dataset.id;
    tr.querySelectorAll("[data-a]").forEach(el => el.onclick = e => e.stopPropagation());
    tr.querySelector("[data-a=open]").onclick = () => openDetail(id);
    tr.querySelector("[data-a=status]").onchange = e => upd(id, { status: e.target.value });
    tr.querySelector("[data-a=team]").onchange = e => upd(id, { assigned_team: e.target.value });
    const rs = tr.querySelector("[data-a=resolve]"); if (rs) rs.onclick = () => upd(id, { status: "resolved" });
    tr.onclick = () => openDetail(id);
  });
}
async function upd(id, body) { await api("/reports/" + id, "PUT", body); toast(t("saved")); refresh(); }
["#fq", "#fcat", "#flev", "#fsta"].forEach(s => $(s).addEventListener(s === "#fq" ? "input" : "change", renderIncidents));
$("#fclear").onclick = () => { $("#fq").value = $("#fcat").value = $("#flev").value = $("#fsta").value = ""; renderIncidents(); };

async function openDetail(id) {
  const r = await api("/reports/" + id), d = meta.districts;
  $("#mBody").innerHTML = `<h3>#${r.id} — ${esc(r.title)} ${badge(r.level)}</h3><p class="muted">${fmtD(r.created_at)}${r.resolved_at ? " → " + fmtD(r.resolved_at) : ""}</p>
  <form id="ef"><label><span>${t("f_title")}</span><input name="title" value="${esc(r.title)}"></label>
  <label><span>${t("f_desc")}</span><textarea name="description" rows="3">${esc(r.description)}</textarea></label>
  <div class="row2"><label><span>${t("f_cat")}</span><select name="category">${opts(CATS, catL, r.category)}</select></label>
  <label><span>${t("f_sev")}</span><select name="severity">${[1, 2, 3, 4, 5].map(n => `<option value="${n}" ${n === r.severity ? "selected" : ""}>${t("sev" + n)}</option>`).join("")}</select></label></div>
  <div class="row2"><label><span>${t("f_district")}</span><select name="district">${opts(Object.keys(d), dist, r.district)}</select></label><label><span>${t("f_street")}</span><input name="street" value="${esc(r.street)}"></label></div>
  <div class="row2"><label><span>${t("f_people")}</span><input name="people" type="number" min="0" value="${r.people}"></label>
  <label><span>${t("th_status")}</span><select name="status">${opts(STATUSES, t, r.status)}</select></label></div>
  <label><span>${t("assign_t")}</span><select name="assigned_team"><option value="">${t("unassigned")}</option>${opts(meta.teams.map(x => x.type), teamL, r.assigned_team)}</select></label>
  <div class="btns"><button type="button" class="danger" id="delBtn">${t("del")}</button><button class="primary">${t("save")}</button></div></form>${analysisHTML(r)}`;
  $("#modal").hidden = false;
  $("#ef").onsubmit = async e => { e.preventDefault(); await api("/reports/" + id, "PUT", Object.fromEntries(new FormData(e.target))); $("#modal").hidden = true; toast(t("saved")); refresh(); };
  $("#delBtn").onclick = async () => { if (confirm(t("del_q"))) { await api("/reports/" + id, "DELETE"); $("#modal").hidden = true; toast(t("deleted")); refresh(); } };
}
$("#mClose").onclick = () => $("#modal").hidden = true;
$("#modal").onclick = e => { if (e.target.id === "modal") $("#modal").hidden = true; };
document.addEventListener("keydown", e => { if (e.key === "Escape") $("#modal").hidden = true; });

/* ---------- map / resources / simulation ---------- */
async function renderMap() { drawMap($("#mapFull"), await api("/reports")); $("#mapLegend2").innerHTML = legend(); }

function planHTML(p) {
  if (!p.plan.length && !p.merged.length) return `<div class="empty">${t("no_pending")}</div>`;
  return p.plan.map(x => `<div class="item" data-id="${x.id}"><div><b>#${x.id} ${esc(x.title)}</b><small>${t("a_team")}: ${teamL(x.team)}${x.fallback ? " — " + t("fallback") : ""} · ${t("eta_h")}: ${x.start == null ? "—" : x.start + 0.5} ${t("hours")}</small></div>
  <div>${badge(x.level)} <span class="score">${x.priority}</span> <span class="chip">${x.assigned ? t("assigned_ok") : x.start === 0 ? t("now") : t("queued")}</span></div></div>`).join("")
    + p.merged.map(m => `<div class="item" data-id="${m.id}"><div><b>#${m.id} ${esc(m.title)}</b></div><span class="chip">${t("merged")}${m.of}</span></div>`).join("");
}
async function renderResources(commit = false) {
  const [res, p] = await Promise.all([api("/resources"), api("/allocate", "POST", { commit })]);
  $("#resCards").innerHTML = res.map(r => `<div class="res"><h4>${teamL(r.type)}</h4><div class="muted">${t("total")}: ${r.total} · ${t("busy")}: ${r.busy} · ${t("avail")}: ${r.available}</div>
  <div class="bar ${r.util >= 80 ? "warn" : ""}" style="margin:8px 0"><i style="width:${r.util}%"></i></div><b>${t("util")}: ${r.util}%</b>
  ${r.jobs.map(j => `<div class="muted" style="font-size:12px">#${j.id} ${esc(j.title)}</div>`).join("")}</div>`).join("");
  $("#allocPlan").innerHTML = planHTML(p);
  $$("#allocPlan .item").forEach(e => e.onclick = () => openDetail(+e.dataset.id));
  if (commit) toast(t("assigned_ok")); return p;
}
$("#allocBtn").onclick = async () => { await renderResources(true); refresh(false); };

function initScenarios() {
  $("#scenarios").innerHTML = ["water", "accidents", "blackout", "garbage", "limited"].map(s => `<div class="sc ${s === scen ? "on" : ""}" data-s="${s}"><b>${t("s_" + s)}</b><small>${t("s_" + s + "_d")}</small></div>`).join("");
  $$(".sc").forEach(e => e.onclick = () => { scen = e.dataset.s; initScenarios(); });
}
function simHTML(s) {
  const rows = [["m_pending", "pending"], ["m_crit", "critical"], ["m_prio", "avg_priority"], ["m_eta", "avg_eta"], ["m_ceta", "crit_eta"], ["m_max", "max_eta"], ["m_wait", "waiting"]];
  const delta = (a, b) => { const d = +(b - a).toFixed(1); return d ? `<span class="${d > 0 ? "up" : "dn2"}">(${d > 0 ? "+" : ""}${d})</span>` : ""; };
  const dec = s.decisions.map(d => `<li>#<b>${esc(d.title)}</b> (${t("d_prio")} ${d.priority}) — ${d.type === "queued" ? t("d_queue") + " " + teamL(d.team) : d.type === "fallback" ? t("d_fb") : t("d_assign") + " " + teamL(d.team)}</li>`).join("")
    + (s.overload.length ? `<li class="up">${t("d_over")} ${s.overload.map(teamL).join("، ")}</li>` : "") + (s.caps_factor < 1 ? `<li>${t("d_scaled")} ${Math.round(s.caps_factor * 100)}%</li>` : "");
  return `<div class="grid2"><div class="card"><h3>${t("before")} / ${t("after")} (+${s.added})</h3><table class="cmp"><tr><th>${t("metric")}</th><th>${t("before")}</th><th>${t("after")}</th></tr>
  ${rows.map(([l, k]) => `<tr><td>${t(l)}</td><td>${s.before[k]}</td><td><b>${s.after[k]}</b> ${delta(s.before[k], s.after[k])}</td></tr>`).join("")}</table>${s.applied ? `<p class="muted">${t("applied")}</p>` : ""}</div>
  <div class="card"><h3>${t("s_util")}</h3>${Object.keys(s.after.util).map(k => `<div class="brow" style="grid-template-columns:120px 1fr 40px"><span>${teamL(k)}</span><div class="bar ${s.after.util[k].util >= 80 ? "warn" : ""}"><i style="width:${s.after.util[k].util}%"></i></div><b>${s.after.util[k].util}%</b></div>`).join("")}</div></div>
  <div class="card"><h3>${t("s_decisions")}</h3><ul class="explain" style="margin:0;padding-inline-start:28px">${dec}</ul></div>`;
}
$("#simBtn").onclick = async () => {
  const s = await api("/simulate", "POST", { scenario: scen, apply: $("#simApply").checked });
  $("#simOut").innerHTML = simHTML(s); if (s.applied) refresh(false);
};

/* ---------- demo mode ---------- */
$("#demoBtn").onclick = () => {
  const steps = ["ds1", "ds2", "ds3", "ds4", "ds5", "ds6", "ds7", "ds8"];
  $("#mBody").innerHTML = `<h3>${t("demo_h")}</h3><div id="dsteps">${steps.map((s, i) => `<div class="step wait" id="st${i}"><span class="ok">○</span><div><b>${t(s)}</b><div class="muted" id="sv${i}"></div></div></div>`).join("")}</div><div id="dlast"></div>
  <div class="btns" style="margin-top:12px"><button class="primary" id="dgo">${t("demo_run")}</button></div>`;
  $("#modal").hidden = false;
  const mark = (i, txt) => { const e = $("#st" + i); e.classList.remove("wait"); e.querySelector(".ok").textContent = "✓"; $("#sv" + i).innerHTML = txt; };
  const pause = () => new Promise(r => setTimeout(r, 800));
  $("#dgo").onclick = async () => {
    $("#dgo").disabled = true;
    const r = await api("/reports", "POST", { title: t("demo_title"), description: t("demo_desc"), district: "university", street: "شارع الجامعة", severity: 4, people: 250, category: null });
    mark(0, `#${r.id} ${esc(r.title)}`); await pause();
    mark(1, `${catL(r.category)} · ${badge(r.level)}`); await pause();
    mark(2, `<span class="score">${r.priority}</span> / 100`); await pause();
    const d = r.analysis.dup; mark(3, d ? `${t("a_dup_t")}${d.id} — ${esc(d.title)} (${d.score})` : t("no_dup")); await pause();
    mark(4, `${teamL(r.team)} — ${esc(r.analysis.action[lang])}`); await pause();
    const p = await api("/allocate", "POST", { commit: true });
    mark(5, p.plan.slice(0, 4).map(x => `#${x.id} → ${teamL(x.team)}`).join(" · ") || t("no_pending")); await pause();
    const s = await api("/simulate", "POST", { scenario: "water", apply: false });
    mark(6, `${t("m_eta")}: ${s.before.avg_eta} → <b>${s.after.avg_eta}</b> · ${t("m_wait")}: ${s.before.waiting} → <b>${s.after.waiting}</b>`); await pause();
    const st = await api("/stats"); mark(7, `${t("k_total")}: ${st.total} · ${t("k_progress")}: ${st.progress} · ${t("k_crit")}: ${st.critical} · ${t("health")}: ${st.health}`);
    $("#dlast").innerHTML = `<p class="muted">${t("demo_done")}</p>`; refresh(false);
  };
};

/* ---------- shell ---------- */
$("#resetBtn").onclick = async () => { if (confirm(t("reset_q"))) { await api("/reset", "POST"); toast(t("reset_ok")); refresh(); } };
async function show(p) {
  page = p; location.hash = p;
  $$(".page").forEach(e => e.classList.toggle("on", e.id === "p-" + p)); $$("#nav button").forEach(b => b.classList.toggle("on", b.dataset.page === p));
  await ({ dashboard: renderDashboard, report: async () => { }, incidents: renderIncidents, map: renderMap, resources: () => renderResources(false), simulation: async () => { } }[p])();
}
const refresh = (go = true) => go ? show(page) : (page === "dashboard" || page === "incidents" || page === "map" || page === "resources" ? show(page) : Promise.resolve());
function applyLang() {
  document.documentElement.lang = lang; document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  $("#langBtn").textContent = lang === "ar" ? "EN" : "عربي";
  $$("[data-i]").forEach(e => e.textContent = t(e.dataset.i)); $$("[data-ph]").forEach(e => e.placeholder = t(e.dataset.ph));
  $("#foot").textContent = t("foot"); initForm(); initFilters(); initScenarios(); if (!$("#analysisBox").innerHTML.trim()) emptyAnalysis();
}
$("#langBtn").onclick = () => { lang = lang === "ar" ? "en" : "ar"; localStorage.setItem("up_lang", lang); applyLang(); $("#simOut").innerHTML = ""; if (!$("#analysisBox .big-score")) emptyAnalysis(); show(page); };
$$("#nav button").forEach(b => b.onclick = () => show(b.dataset.page));
(async () => { meta = await api("/meta"); applyLang(); const h = location.hash.slice(1); show(["dashboard", "report", "incidents", "map", "resources", "simulation"].includes(h) ? h : "dashboard"); })();
