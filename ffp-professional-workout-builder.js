/* FFP Professional — Guided Workout Builder.
   MATCHES the FFP App member builder: staged Style → Warm-up → Workout → Cool-down → Save,
   with colored block headers, quick-pick categories and suggestions — in the Pro TEAL theme.
   Warm-up + workout blocks + cool-down flatten into the plan-shaped `exercises` array the member
   app renders, saved via pro_workout_save (template) + pro_workout_assign (to clients + day). */
(function () {
  "use strict";

  var TEAL = "#1980AD";                            // Accent — IDENTICAL to the FFP App builder (blue)
  var STYLES = [
    { k: "sets",     name: "Straight sets", icon: "fitness_center", c: "#64748b", desc: "Each exercise its own sets, reps & rest." },
    { k: "superset", name: "Superset",      icon: "sync_alt",       c: "#7c5cff", desc: "Pair moves, reps each, no rest inside." },
    { k: "circuit",  name: "Circuit",       icon: "repeat",         c: "#1e88c7", desc: "Rounds through all stations; rest per round." },
    { k: "amrap",    name: "AMRAP",         icon: "timer",          c: "#10a37f", desc: "Time cap + fixed reps; loop till the clock stops." },
    { k: "emom",     name: "EMOM",          icon: "av_timer",       c: "#e0891e", desc: "Every minute, on the minute — set reps/min." },
    { k: "tabata",   name: "Tabata",        icon: "bolt",           c: "#e04b3a", desc: "Work / rest × rounds. Max effort." },
    { k: "fortime",  name: "For Time",      icon: "speed",          c: "#d6336c", desc: "Fixed work — finish as fast as you can." }
  ];
  // ONE library for every stage (warm-up · workout · cool-down) with the same quick-pick categories.
  var LIB = [
    ["Run","Cardio","cardio"],["Treadmill","Cardio","cardio"],["Incline walk","Cardio","cardio"],["Sprints","Cardio","cardio"],
    ["Rower","Conditioning","cardio"],["Ski erg","Cardio","cardio"],["Assault bike","Conditioning","cardio"],["Echo bike","Conditioning","cardio"],
    ["Stationary bike","Cardio","cardio"],["Spin bike","Cardio","cardio"],["Elliptical","Cardio","cardio"],["Stair climber","Cardio","cardio"],
    ["Skipping","Cardio","cardio"],["Double-unders","Conditioning","cardio"],["Battle ropes","Conditioning","cardio"],["Sled push","Full body","cardio"],
    ["Box jumps","Legs","cardio"],["High knees","Cardio","cardio"],["Mountain climbers","Conditioning","cardio"],["Jumping jacks","Cardio","cardio"],
    ["Push-ups","Chest","bodyweight"],["Pull-ups","Back","bodyweight"],["Air squats","Legs","bodyweight"],["Walking lunges","Legs","bodyweight"],
    ["Plank","Core","bodyweight"],["Burpees","Conditioning","bodyweight"],["Tricep dips","Arms","bodyweight"],["Hanging knee raise","Core","bodyweight"],["Sit-ups","Core","bodyweight"],
    ["Goblet squat","Legs","dumbbell"],["DB bench press","Chest","dumbbell"],["DB shoulder press","Shoulders","dumbbell"],["One-arm DB row","Back","dumbbell"],
    ["DB Romanian deadlift","Hamstrings","dumbbell"],["Bicep curl","Arms","dumbbell"],["Hammer curl","Arms","dumbbell"],["DB lunges","Legs","dumbbell"],["Kettlebell swing","Full body","dumbbell"],
    ["Back squat","Legs","barbell"],["Front squat","Legs","barbell"],["Deadlift","Full body","barbell"],["Romanian deadlift","Hamstrings","barbell"],
    ["Bench press","Chest","barbell"],["Overhead press","Shoulders","barbell"],["Barbell row","Back","barbell"]
  ];
  var CATS = [["","All"],["cardio","Cardio"],["bodyweight","Bodyweight"],["dumbbell","Dumbbell"],["barbell","Barbell"]];
  var MEAS = ["reps", "m", "cal", "s"];
  function unitOf(m) { return m === "m" ? "m" : m === "cal" ? "cal" : m === "s" ? "sec" : "reps"; }
  var DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var DEF_P = { rounds: 3, rest: 60, capMin: 12, emomMin: 10, tabWork: 20, tabRest: 10, tabRounds: 8, ftRounds: 10, ftCap: 15 };

  var S = null;
  function esc(s) { return (window.escHtml ? window.escHtml(s) : String(s == null ? "" : s)); }
  function meta() { return STYLES.filter(function (x) { return x.k === S.style; })[0] || STYLES[0]; }
  function grouped() { return S.style === "superset" || S.style === "circuit"; }
  function isGroupStyle() { return grouped() || S.style === "amrap" || S.style === "emom" || S.style === "tabata" || S.style === "fortime"; }
  function newBlock() { return { ex: [], p: JSON.parse(JSON.stringify(DEF_P)) }; }

  // Inject the builder CSS once — mirrors the FFP App .wbz-* look, in the Pro TEAL theme.
  function ensureCss() {
    if (document.getElementById("pgb-css")) return;
    var s = document.createElement("style"); s.id = "pgb-css";
    s.textContent = [
      "#pgb-body .wbz-steps{display:flex;gap:6px;margin:0 0 16px;}",
      "#pgb-body .wbz-s{flex:1;}",
      "#pgb-body .wbz-s .bar{height:4px;border-radius:3px;background:var(--ffp-border-mid);}",
      "#pgb-body .wbz-s .lbl{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.4px;margin-top:5px;color:var(--ffp-text-dim);}",
      "#pgb-body .wbz-s.on .bar,#pgb-body .wbz-s.done .bar{background:" + TEAL + ";}",
      "#pgb-body .wbz-s.on .lbl{color:" + TEAL + ";}",
      "#pgb-body .wbz-h{font-size:18px;font-weight:900;color:var(--ffp-text);margin:0 0 3px;}",
      "#pgb-body .wbz-sub{font-size:12.5px;color:var(--ffp-text-dim);font-weight:600;margin:0 0 12px;}",
      "#pgb-body .wbz-sgrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}",
      "#pgb-body .wbz-scard{text-align:left;padding:14px;border-radius:14px;border:none;background:var(--c);cursor:pointer;font-family:inherit;}",
      "#pgb-body .wbz-scard .ic .ms{font-size:22px;color:#fff;}",
      "#pgb-body .wbz-scard .n{display:block;font-weight:900;font-size:14px;color:#fff;margin-top:6px;}",
      "#pgb-body .wbz-scard .x{display:block;font-size:10.5px;color:rgba(255,255,255,.9);line-height:1.35;margin-top:2px;}",
      "#pgb-body .pgb-hd{display:flex;align-items:center;gap:8px;margin:0 0 16px;}",
      "#pgb-body .pgb-hd .wbz-steps{flex:1;margin:0;}",
      "#pgb-body .pgb-bk{width:34px;height:34px;flex:none;background:var(--ffp-bg-card);border:1px solid var(--ffp-border-mid);border-radius:9px;color:var(--ffp-text);cursor:pointer;display:grid;place-items:center;}",
      "#pgb-body .pgb-bk .ms{font-size:18px;}",
      "#pgb-body .pgb-gen{background:var(--ffp-bg-card);border:1px solid var(--ffp-border-mid);border-radius:14px;padding:14px;margin-bottom:14px;}",
      "#pgb-body .pgb-gen-h{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:900;color:var(--ffp-text);margin-bottom:8px;}",
      "#pgb-body .pgb-gen-h .ms{color:#f2a900;font-size:19px;}",
      "#pgb-body .pgb-gen textarea{width:100%;box-sizing:border-box;padding:10px 11px;border:1px solid var(--ffp-border-mid);border-radius:10px;font-family:inherit;background:var(--ffp-bg);color:var(--ffp-text);font-size:13px;resize:vertical;}",
      "#pgb-body .pgb-gen-cta{width:100%;margin-top:9px;display:flex;align-items:center;justify-content:center;gap:7px;background:#f2a900;color:#3a2d00;border:none;border-radius:11px;padding:12px;font-family:inherit;font-weight:900;font-size:14px;cursor:pointer;}",
      "#pgb-body .pgb-gen-cta .ms{font-size:19px;}",
      "#pgb-body .wbz-or{display:flex;align-items:center;gap:10px;margin:2px 0 14px;color:var(--ffp-text-dim);font-size:11px;font-weight:800;letter-spacing:.4px;text-transform:uppercase;}",
      "#pgb-body .wbz-or:before,#pgb-body .wbz-or:after{content:'';flex:1;height:1px;background:var(--ffp-border-mid);}",
      "#pgb-body .pgb-or{text-align:center;font-size:11px;font-weight:800;letter-spacing:.4px;text-transform:uppercase;color:var(--ffp-text-dim);margin:0 0 12px;}",
      "#pgb-body .wbz-block{border-radius:14px;overflow:hidden;margin-bottom:12px;border:1px solid var(--ffp-border-mid);}",
      "#pgb-body .wbz-block.on{box-shadow:0 0 0 2px color-mix(in srgb,var(--c) 40%,transparent);}",
      "#pgb-body .wbz-block .bc-hd{display:flex;align-items:center;gap:10px;background:var(--c);color:#fff;padding:12px 14px;}",
      "#pgb-body .wbz-block .bc-ic .ms{color:#fff;font-size:24px;}",
      "#pgb-body .wbz-block .bc-nm{font-weight:900;font-size:14px;color:#fff;}",
      "#pgb-body .wbz-block .bc-tag{font-size:11px;color:rgba(255,255,255,.85);font-weight:600;}",
      "#pgb-body .wbz-block .bc-rm{margin-left:auto;background:none;border:none;color:#fff;font-size:22px;line-height:1;cursor:pointer;}",
      "#pgb-body .wbz-block .bc-body{padding:12px 14px;background:var(--ffp-bg-card);}",
      "#pgb-body .wbz-block .bc-empty{font-size:12.5px;color:var(--ffp-text-dim);font-weight:600;padding:4px 0;}",
      "#pgb-body .wbz-exrow{display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--ffp-border);}",
      "#pgb-body .wbz-exrow .lab{width:18px;height:18px;border-radius:5px;background:var(--ffp-border-mid);color:var(--ffp-text);font-size:10px;font-weight:900;display:grid;place-items:center;flex:none;}",
      "#pgb-body .wbz-exrow .nm{flex:1;min-width:0;font-weight:700;font-size:13px;color:var(--ffp-text);}",
      "#pgb-body .wbz-exrow .exset{display:flex;align-items:center;gap:6px;}",
      "#pgb-body .wbz-exrow .mini{display:flex;flex-direction:column;align-items:center;}",
      "#pgb-body .wbz-exrow .rin{width:42px;text-align:center;padding:6px 4px;border:1px solid var(--ffp-border-mid);border-radius:8px;font-family:inherit;background:var(--ffp-bg);color:var(--ffp-text);font-size:13px;}",
      "#pgb-body .wbz-exrow .ml{font-size:8px;font-weight:800;text-transform:uppercase;color:var(--ffp-text-dim);margin-top:2px;}",
      "#pgb-body .wbz-exrow .valgrp{display:flex;}",
      "#pgb-body .wbz-exrow .valgrp .rin{border-radius:8px 0 0 8px;width:48px;}",
      "#pgb-body .wbz-exrow .unit{border:1px solid var(--ffp-border-mid);border-left:none;border-radius:0 8px 8px 0;background:var(--ffp-bg);color:var(--ffp-text-dim);font-family:inherit;font-size:11px;padding:0 8px;cursor:pointer;}",
      "#pgb-body .wbz-exrow .scope{border:1px solid var(--ffp-border-mid);border-radius:8px;background:var(--ffp-bg);color:var(--ffp-text-dim);font-family:inherit;font-size:10px;padding:5px 8px;cursor:pointer;}",
      "#pgb-body .wbz-exrow .scope.once{border-color:" + TEAL + ";color:" + TEAL + ";}",
      "#pgb-body .wbz-exrow .rm{border:none;background:transparent;color:var(--ffp-text-dim);font-size:20px;line-height:1;cursor:pointer;}",
      "#pgb-body .wbz-maxeff{display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:800;color:#e04b3a;}",
      "#pgb-body .wbz-maxeff .ms{font-size:16px;}",
      "#pgb-body .wbz-params{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px;}",
      "#pgb-body .prm{display:flex;flex-direction:column;gap:4px;}",
      "#pgb-body .prm .l{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.3px;color:var(--ffp-text-dim);}",
      "#pgb-body .prm .stp{display:flex;align-items:center;gap:6px;}",
      "#pgb-body .prm .stp button{width:28px;height:28px;border:1px solid var(--ffp-border-mid);background:var(--ffp-bg);color:var(--ffp-text);border-radius:8px;font-size:16px;cursor:pointer;}",
      "#pgb-body .prm .stp .v{font-weight:800;font-size:13px;color:var(--ffp-text);min-width:28px;text-align:center;}",
      "#pgb-body .prm .stp .v small{font-size:9px;color:var(--ffp-text-dim);font-weight:700;}",
      "#pgb-body .wbz-addblk{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;padding:11px;border:1.5px dashed var(--ffp-border-mid);border-radius:12px;background:transparent;color:" + TEAL + ";font-family:inherit;font-weight:800;font-size:13px;cursor:pointer;margin-bottom:14px;}",
      "#pgb-body .wbz-add{background:var(--ffp-bg-card);border:1px solid var(--ffp-border-mid);border-radius:14px;padding:14px;}",
      "#pgb-body .wbz-addh{font-size:11px;font-weight:900;letter-spacing:.4px;text-transform:uppercase;color:var(--ffp-text-dim);margin-bottom:8px;}",
      "#pgb-body .wbz-search{position:relative;margin-bottom:10px;}",
      "#pgb-body .wbz-search .ms{position:absolute;left:10px;top:9px;color:var(--ffp-text-dim);font-size:18px;}",
      "#pgb-body .wbz-search input{width:100%;box-sizing:border-box;padding:9px 9px 9px 34px;border:1px solid var(--ffp-border-mid);border-radius:9px;font-family:inherit;background:var(--ffp-bg);color:var(--ffp-text);font-size:13px;}",
      "#pgb-body .wbz-cats{display:flex;gap:6px;overflow-x:auto;margin-bottom:10px;scrollbar-width:none;}",
      "#pgb-body .wbz-cats::-webkit-scrollbar{display:none;}",
      "#pgb-body .wbz-cat{flex:none;padding:6px 12px;border-radius:20px;border:1px solid var(--ffp-border-mid);background:var(--ffp-bg-card);color:var(--ffp-text-dim);font-family:inherit;font-size:11.5px;font-weight:700;cursor:pointer;}",
      "#pgb-body .wbz-cat.on{background:" + TEAL + ";border-color:" + TEAL + ";color:#fff;}",
      "#pgb-body .wbz-lrow{display:flex;align-items:center;justify-content:space-between;padding:10px 11px;background:var(--ffp-bg-card);border:1px solid var(--ffp-border-mid);border-radius:10px;margin-bottom:5px;cursor:pointer;}",
      "#pgb-body .wbz-lrow .nm{font-weight:700;font-size:13px;color:var(--ffp-text);}",
      "#pgb-body .wbz-lrow .nm small{color:var(--ffp-text-dim);font-weight:600;}",
      "#pgb-body .wbz-lrow .add{color:" + TEAL + ";}",
      "#pgb-body .wbz-empty{font-size:12.5px;color:var(--ffp-text-dim);font-weight:600;padding:6px 0;}",
      "#pgb-body .wbz-sumblk{background:var(--ffp-bg-card);border:1px solid var(--ffp-border-mid);border-radius:12px;padding:8px 14px;margin-top:10px;}",
      "#pgb-body .wbz-sumblk .se{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--ffp-border);font-size:13px;color:var(--ffp-text);}",
      "#pgb-body .wbz-sumblk .se:last-child{border-bottom:none;}",
      "#pgb-body .wbz-sumblk .se.hd{font-weight:900;color:var(--ffp-text);}",
      "#pgb-body .wbz-sumblk .se .d{color:var(--ffp-text-dim);font-weight:700;}"
    ].join("");
    document.head.appendChild(s);
  }

  window.proGuidedBuild = function (clientId) {
    ensureCss();
    S = { clientId: clientId || null, step: 1, style: null, blocks: [newBlock()], active: 0, warm: [], cool: [],
          q: "", qw: "", qc: "", cat: "", wcat: "", ccat: "", name: "", notes: "", day: null, clients: [], sel: {} };
    if (clientId) S.sel[clientId] = true;
    render();
    loadClients();
  };
  function loadClients() {
    var pid = window._memProvId ? window._memProvId() : null; if (!pid || !window.supabase) return;
    window.supabase.rpc("pro_list_clients", { p_pro: pid }).then(function (r) { S.clients = (r && r.data) || []; if (S.step === 5) stepSave(); }, function () {});
  }

  var TITLES = ["Pick a style", "Warm-up", "Your workout", "Cool-down", "Review & save"];
  function render() {
    var steps = ["Style", "Warm-up", "Workout", "Cool-down", "Save"].map(function (l, i) {
      var cls = S.step === i + 1 ? " on" : S.step > i + 1 ? " done" : "";
      return '<div class="wbz-s' + cls + '"><div class="bar"></div><div class="lbl">' + l + '</div></div>';
    }).join("");
    var back = '<button class="pgb-bk" onclick="' + (S.step > 1 ? "pgbBack()" : "closeModal()") + '"><span class="ms">arrow_back_ios_new</span></button>';
    var body = '<div id="pgb-body"><div class="pgb-hd">' + back + '<div class="wbz-steps">' + steps + '</div></div><div id="pgb-stage"></div></div>';
    // Single full-width CTA per step (identical to the FFP App builder). Step 1 = tap a style to advance.
    var foot =
      S.step === 1 ? ''
      : S.step === 2 ? '<button class="btn btn-pri" style="width:100%;" onclick="pgbGoto(3)">' + (S.warm.length ? "Continue · " + S.warm.length + " added" : "Skip warm-up") + '</button>'
      : S.step === 3 ? '<button class="btn btn-pri" style="width:100%;" onclick="pgbToCool()">Continue</button>'
      : S.step === 4 ? '<button class="btn btn-pri" style="width:100%;" onclick="pgbGoto(5)">' + (S.cool.length ? "Continue · " + S.cool.length + " added" : "Skip cool-down") + '</button>'
      : '<button class="btn btn-pri" style="width:100%;" onclick="pgbSave()"><span class="ms">bookmark_add</span> Save workout</button>';
    window.openModalShell("lg", TITLES[S.step - 1], body, foot);
    stage();
  }
  function stage() {
    if (!document.getElementById("pgb-stage")) return;
    if (S.step === 1) stepStyle();
    else if (S.step === 2) stepMob("warm");
    else if (S.step === 3) stepWorkout();
    else if (S.step === 4) stepMob("cool");
    else stepSave();
  }
  window.pgbBack = function () { if (S.step > 1) { S.step--; render(); } };
  window.pgbGoto = function (n) { S.step = n; render(); };
  window.pgbNext = function () { if (!S.style) { window.showToast("Pick a style", "error"); return; } S.step = 2; render(); };
  window.pgbToCool = function () { if (!S.blocks.some(function (b) { return b.ex.length; })) { window.showToast("Add an exercise", "error"); return; } S.step = 4; render(); };

  function stepStyle() {
    document.getElementById("pgb-stage").innerHTML =
      // AI describe-and-build sits at the TOP of the first page (unified with manual build).
      '<div class="pgb-gen"><div class="pgb-gen-h"><span class="ms">auto_awesome</span>Describe it — AI builds it</div>' +
        '<textarea id="pgb-gen-q" placeholder="e.g. 45-min lower-body dumbbell session, intermediate, protect a sore knee" rows="3">' + esc(S.genq || "") + '</textarea>' +
        '<button class="pgb-gen-cta" onclick="pgbGenerate()"><span class="ms">auto_awesome</span> Generate with AI</button></div>' +
      '<div class="wbz-or"><span>or build it yourself</span></div>' +
      '<div class="wbz-h">How should this workout run?</div><div class="wbz-sub">Tap a style — it sets up the rest for you.</div>' +
      '<div class="wbz-sgrid">' + STYLES.map(function (s) {
        return '<button class="wbz-scard" style="--c:' + s.c + ';" onclick="pgbPickStyle(\'' + s.k + '\')">' +
          '<span class="ic"><span class="ms">' + s.icon + '</span></span><span class="n">' + s.name + '</span><span class="x">' + s.desc + '</span></button>';
      }).join("") + '</div>';
  }
  window.pgbPickStyle = function (k) { S.style = k; S.step = 2; render(); };   // full-color style card → tap to advance

  // Convert a generated/normalised plan ({warmup, exercises, cooldown}) into the builder state.
  function loadPlanIntoState(plan) {
    var exs = (plan && Array.isArray(plan.exercises)) ? plan.exercises : [];
    var lead = exs.filter(function (e) { return e && e.style; })[0];
    S.style = (lead && lead.style) || "sets";
    var isGrouped = S.style === "superset" || S.style === "circuit";
    var groups = [];
    // Grouped styles (superset/circuit) split into blocks by `link`; every other style is ONE block
    // holding all the exercises (straight sets = one list of exercises, each with its own sets/reps/rest).
    exs.forEach(function (e) {
      if (!e || !e.name) return;
      if (isGrouped) { if (e.link && groups.length) groups[groups.length - 1].push(e); else groups.push([e]); }
      else { if (!groups.length) groups.push([]); groups[0].push(e); }
    });
    S.blocks = groups.map(function (g) {
      var leader = g[0], p = JSON.parse(JSON.stringify(DEF_P));
      if (leader.rest_sec != null) p.rest = parseInt(leader.rest_sec, 10) || p.rest;
      if (leader.rounds != null) { p.rounds = parseInt(leader.rounds, 10) || p.rounds; p.tabRounds = p.rounds; p.ftRounds = p.rounds; }
      if (leader.capMin != null) { p.capMin = parseInt(leader.capMin, 10) || p.capMin; p.ftCap = p.capMin; }
      if (leader.emomMin != null) p.emomMin = parseInt(leader.emomMin, 10) || p.emomMin;
      if (leader.tabWork != null) p.tabWork = parseInt(leader.tabWork, 10) || p.tabWork;
      if (leader.tabRest != null) p.tabRest = parseInt(leader.tabRest, 10) || p.tabRest;
      var ex = g.map(function (e) {
        var rs = String(e.reps == null ? "10" : e.reps), measure = "reps";
        if (/\bcal/i.test(rs)) measure = "cal"; else if (/\b(?:km|m|meters?|metres?)\b/i.test(rs)) measure = "m"; else if (/\b(?:s|sec|secs)\b/i.test(rs)) measure = "s";
        return { name: e.name, muscle: "", sets: parseInt(e.sets, 10) || 3, reps: (rs.match(/\d+/) || ["10"])[0], rest: parseInt(e.rest_sec, 10) || 75, measure: measure, scope: e.once ? "once" : "round" };
      });
      return { ex: ex, p: p };
    });
    if (!S.blocks.length) S.blocks = [newBlock()];
    var toMob = function (arr) { return (Array.isArray(arr) ? arr : []).filter(function (x) { return x && x.name; }).map(function (x) { var d = parseInt(x.duration_sec, 10) || 30; return { name: x.name, duration_sec: d, unit: (d >= 60 && d % 60 === 0 ? "min" : "sec") }; }); };
    S.warm = toMob(plan && plan.warmup); S.cool = toMob(plan && plan.cooldown);
    S.name = String((plan && plan.title) || ""); S.active = 0;
  }
  // Legacy entry kept for any old callers — AI generate now lives on the builder's first page,
  // so this just opens the unified guided builder (describe box + style picker together).
  window.proGenerateWorkout = function (clientId) { window.proGuidedBuild(clientId); };
  window.pgbGenerate = async function () {
    var el = document.getElementById("pgb-gen-q"), q = el ? el.value.trim() : "";
    if (el) S.genq = q;
    if (q.length < 3) { window.showToast("Describe the workout first", "error"); return; }
    window.showToast("Generating…");
    try {
      var r = await fetch("https://ffp-passport-backend.vercel.app/api/workout/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: q }) });
      var j = await r.json();
      if (!r.ok || !j || !j.plan) { window.showToast(r.status === 503 ? "Workout AI isn’t on yet" : "Couldn’t generate — rephrase", "error"); return; }
      loadPlanIntoState(j.plan);
      S.step = 3; render();
      window.showToast("Built — review & tweak", "success");
    } catch (e) { window.showToast("Network error — try again", "error"); }
  };

  // Warm-up / Cool-down — SAME quick picker as Workout (LIB + CATS), timed moves.
  function stepMob(which) {
    var isW = which === "warm", list = isW ? S.warm : S.cool, q = isW ? S.qw : S.qc, catv = isW ? S.wcat : S.ccat;
    var hd = isW ? { c: "#e0891e", ic: "self_improvement", nm: "Warm-up", tag: "Easy moves to get the body ready." }
                 : { c: "#1e88c7", ic: "spa", nm: "Cool-down", tag: "Gentle stretches to ease down." };
    var rows = list.length ? list.map(function (m, i) {
      return '<div class="wbz-exrow"><span class="nm">' + esc(m.name) + '</span>' +
        '<div class="exset"><div class="valgrp"><input class="rin" value="' + mobShown(m) + '" oninput="pgbMobVal(\'' + which + '\',' + i + ',this.value)"><button class="unit" onclick="pgbMobUnit(\'' + which + '\',' + i + ')">' + m.unit + '</button></div></div>' +
        '<button class="rm" onclick="pgbMobRm(\'' + which + '\',' + i + ')">&times;</button></div>';
    }).join("") : '<div class="bc-empty">No moves yet — add from the suggestions below.</div>';
    document.getElementById("pgb-stage").innerHTML =
      '<div class="wbz-h">' + hd.nm + '</div>' +
      '<div class="wbz-block" style="--c:' + hd.c + ';"><div class="bc-hd"><span class="bc-ic"><span class="ms">' + hd.ic + '</span></span>' +
        '<div class="bc-tt"><div class="bc-nm">' + hd.nm + '</div><div class="bc-tag">' + hd.tag + '</div></div></div>' +
        '<div class="bc-body">' + rows + '</div></div>' +
      addPanel(isW ? "Add a move" : "Add a stretch", which, q, catv);
    focusSearch();
  }
  function stepWorkout() {
    var m = meta();
    var blocksHtml = S.blocks.map(function (b, bi) {
      var on = bi === S.active;
      var body = paramsRow(bi, b) + (b.ex.length ? b.ex.map(function (e, i) { return exRow(bi, e, i); }).join("")
        : '<div class="bc-empty">' + (on ? "No exercises yet — add from below." : "Tap to add exercises.") + '</div>');
      return '<div class="wbz-block' + (on ? " on" : "") + '" style="--c:' + m.c + ';" onclick="pgbActive(' + bi + ')">' +
        '<div class="bc-hd"><span class="bc-ic"><span class="ms">' + m.icon + '</span></span>' +
        '<div class="bc-tt"><div class="bc-nm">' + m.name + (S.blocks.length > 1 ? " · block " + (bi + 1) : "") + '</div><div class="bc-tag">' + m.desc + '</div></div>' +
        (S.blocks.length > 1 ? '<button class="bc-rm" onclick="event.stopPropagation();pgbRmBlock(' + bi + ')">&times;</button>' : "") +
        '</div><div class="bc-body">' + body + '</div></div>';
    }).join("");
    document.getElementById("pgb-stage").innerHTML =
      '<div class="wbz-h">Your workout</div>' + blocksHtml +
      // Multiple blocks only make sense for grouped styles (superset/circuit). Straight sets, AMRAP, EMOM,
      // Tabata and For-Time are ONE block holding all the exercises.
      (grouped() ? '<button class="wbz-addblk" onclick="pgbAddBlock()"><span class="ms">add</span>Add ' + (S.blocks.length ? "another" : "a") + ' block</button>' : "") +
      addPanel("Add exercises" + (grouped() && S.blocks.length > 1 ? " · block " + (S.active + 1) : ""), "work", S.q, S.cat);
    focusSearch();
  }
  function addPanel(title, which, q, catv) {
    var lib = suggest(which, q, catv);
    var handler = which === "work" ? "pgbAddEx" : "pgbAddMob";
    var qh = which === "work" ? "pgbQ" : (which === "warm" ? "pgbQw" : "pgbQc");
    var chip = CATS.map(function (c) { return '<button class="wbz-cat' + (catv === c[0] ? " on" : "") + '" onclick="pgbCat(\'' + which + '\',\'' + c[0] + '\')">' + c[1] + '</button>'; }).join("");
    var rows = lib.length ? lib.map(function (x) {
      return '<div class="wbz-lrow" onclick="' + handler + '(\'' + which + '\',\'' + x[0].replace(/'/g, "\\'") + '\',\'' + x[1] + '\')"><span class="nm">' + esc(x[0]) + ' <small>' + esc(x[1]) + '</small></span><span class="ms add">add_circle</span></div>';
    }).join("") : '<div class="wbz-empty">' + (q ? 'Press Enter to add “' + esc(q.trim()) + '”' : "Nothing here — try another category.") + '</div>';
    return '<div class="wbz-add"><div class="wbz-addh">' + title + '</div>' +
      '<div class="wbz-search"><span class="ms">search</span><input id="pgb-q" value="' + esc(q) + '" oninput="' + qh + '(this.value)" onkeydown="if(event.key===\'Enter\'&&this.value.trim())' + handler + '(\'' + which + '\',this.value.trim(),\'Custom\')" placeholder="Search or type…"></div>' +
      '<div class="wbz-cats">' + chip + '</div>' + rows + '</div>';
  }
  function suggest(which, q, catv) {
    var ql = (q || "").trim().toLowerCase();
    var have = {};
    if (which === "work") { S.blocks[S.active].ex.forEach(function (e) { have[e.name.toLowerCase()] = 1; }); }
    else { (which === "warm" ? S.warm : S.cool).forEach(function (m) { have[m.name.toLowerCase()] = 1; }); }
    var out = LIB.filter(function (x) { return !have[x[0].toLowerCase()] && (!catv || x[2] === catv) && (!ql || (x[0] + " " + x[1]).toLowerCase().indexOf(ql) > -1); });
    return out.slice(0, 5);
  }
  function focusSearch() { var el = document.getElementById("pgb-q"); if (el && document.activeElement !== el) { /* keep caret only when typing */ } }

  function paramsRow(bi, b) {
    if (S.style === "sets") return "";
    function prm(label, key, unit, min, step) { return '<div class="prm"><span class="l">' + label + '</span><div class="stp"><button onclick="event.stopPropagation();pgbP(' + bi + ',\'' + key + '\',' + (-step) + ',' + min + ')">−</button><span class="v">' + b.p[key] + (unit ? '<small>' + unit + '</small>' : "") + '</span><button onclick="event.stopPropagation();pgbP(' + bi + ',\'' + key + '\',' + step + ',' + min + ')">+</button></div></div>'; }
    var r = "";
    if (S.style === "tabata") r = prm("Work", "tabWork", "s", 5, 5) + prm("Rest", "tabRest", "s", 0, 5) + prm("Rounds", "tabRounds", "", 1, 1);
    else if (grouped()) r = prm(S.style === "circuit" ? "Rounds" : "Sets", "rounds", "", 1, 1) + prm("Rest / round", "rest", "s", 0, 15);
    else if (S.style === "amrap") r = prm("Time cap", "capMin", "min", 1, 1);
    else if (S.style === "emom") r = prm("Total minutes", "emomMin", "min", 1, 1);
    else if (S.style === "fortime") r = prm("Rounds", "ftRounds", "", 1, 1) + prm("Time cap", "ftCap", "min", 0, 1);
    return r ? '<div class="wbz-params">' + r + '</div>' : "";
  }
  function exRow(bi, e, i) {
    var right;
    if (S.style === "sets") right = '<div class="exset"><div class="mini"><input class="rin" value="' + esc(e.sets) + '" oninput="pgbExF(' + bi + ',' + i + ',\'sets\',this.value)"><span class="ml">Sets</span></div><div class="mini"><input class="rin" value="' + esc(e.reps) + '" oninput="pgbExF(' + bi + ',' + i + ',\'reps\',this.value)"><span class="ml">Reps</span></div><div class="mini"><input class="rin" value="' + esc(e.rest) + '" oninput="pgbExF(' + bi + ',' + i + ',\'rest\',this.value)"><span class="ml">Rest s</span></div></div>';
    else if (S.style === "tabata") right = '<span class="wbz-maxeff"><span class="ms">whatshot</span>Max effort</span>';
    else right = '<div class="exset"><div class="valgrp"><input class="rin" value="' + esc(e.reps) + '" oninput="pgbExF(' + bi + ',' + i + ',\'reps\',this.value)"><button class="unit" onclick="pgbCycleMeas(' + bi + ',' + i + ')">' + unitOf(e.measure) + '</button></div>' + (S.style === "fortime" ? '<button class="scope' + (e.scope === "once" ? " once" : "") + '" onclick="pgbScope(' + bi + ',' + i + ')">' + (e.scope === "once" ? "Once" : "Round") + '</button>' : "") + '</div>';
    return '<div class="wbz-exrow" onclick="event.stopPropagation();">' + (grouped() ? '<span class="lab">' + String.fromCharCode(65 + i) + '</span>' : "") + '<span class="nm">' + esc(e.name) + '</span>' + right + '<button class="rm" onclick="pgbExRm(' + bi + ',' + i + ')">&times;</button></div>';
  }

  // ---- edits ----
  window.pgbActive = function (bi) { if (bi !== S.active) { S.active = bi; stepWorkout(); } };
  window.pgbAddBlock = function () { S.blocks.push(newBlock()); S.active = S.blocks.length - 1; S.q = ""; stepWorkout(); };
  window.pgbRmBlock = function (bi) { S.blocks.splice(bi, 1); if (!S.blocks.length) S.blocks = [newBlock()]; S.active = Math.max(0, Math.min(S.active, S.blocks.length - 1)); stepWorkout(); };
  window.pgbP = function (bi, key, d, min) { var b = S.blocks[bi]; b.p[key] = Math.max(min, (b.p[key] || 0) + d); stepWorkout(); };
  window.pgbExF = function (bi, i, f, v) { var e = S.blocks[bi].ex[i]; if (e) e[f] = (f === "sets") ? Math.max(1, parseInt(v, 10) || 1) : v; };
  window.pgbExRm = function (bi, i) { S.blocks[bi].ex.splice(i, 1); stepWorkout(); };
  window.pgbCycleMeas = function (bi, i) { var e = S.blocks[bi].ex[i]; if (e) { e.measure = MEAS[(MEAS.indexOf(e.measure) + 1) % MEAS.length]; stepWorkout(); } };
  window.pgbScope = function (bi, i) { var e = S.blocks[bi].ex[i]; if (e) { e.scope = e.scope === "once" ? "round" : "once"; stepWorkout(); } };
  window.pgbQ = function (v) { S.q = v; stepWorkout(); };
  window.pgbCat = function (which, k) { if (which === "work") S.cat = k; else if (which === "warm") S.wcat = k; else S.ccat = k; stage(); };
  window.pgbAddEx = function (_w, name, muscle) { S.blocks[S.active].ex.push({ name: name, muscle: muscle, sets: 3, reps: "10", rest: 75, measure: "reps", scope: "round" }); S.q = ""; stepWorkout(); };
  window.pgbQw = function (v) { S.qw = v; stepMob("warm"); };
  window.pgbQc = function (v) { S.qc = v; stepMob("cool"); };
  window.pgbAddMob = function (which, name) { var list = which === "warm" ? S.warm : S.cool; if (!list.some(function (m) { return m.name.toLowerCase() === name.toLowerCase(); })) list.push({ name: name, duration_sec: 30, unit: "sec" }); if (which === "warm") S.qw = ""; else S.qc = ""; stepMob(which); };
  window.pgbMobRm = function (which, i) { (which === "warm" ? S.warm : S.cool).splice(i, 1); stepMob(which); };
  window.pgbMobVal = function (which, i, v) { var m = (which === "warm" ? S.warm : S.cool)[i]; if (!m) return; var n = Math.max(0, parseInt(String(v).replace(/\D/g, ""), 10) || 0); m.duration_sec = m.unit === "min" ? n * 60 : n; };
  window.pgbMobUnit = function (which, i) { var m = (which === "warm" ? S.warm : S.cool)[i]; if (m) { m.unit = m.unit === "min" ? "sec" : "min"; stepMob(which); } };
  function mobShown(m) { return m.unit === "min" ? Math.max(0, Math.round(m.duration_sec / 60)) : m.duration_sec; }

  // ---- Review & save ----
  function stepSave() {
    var m = meta();
    var sum = "";
    if (S.warm.length) { sum += '<div class="se hd"><span>Warm-up</span><span class="d">' + S.warm.length + ' move' + (S.warm.length === 1 ? "" : "s") + '</span></div>'; sum += S.warm.map(function (x) { return '<div class="se"><span>' + esc(x.name) + '</span><span class="d">' + x.duration_sec + 's</span></div>'; }).join(""); }
    S.blocks.filter(function (b) { return b.ex.length; }).forEach(function (b, bi) {
      sum += '<div class="se hd"><span>Block ' + (bi + 1) + ' · ' + m.name + '</span><span class="d"></span></div>';
      sum += b.ex.map(function (e, i) { return '<div class="se"><span>' + (grouped() ? String.fromCharCode(65 + i) + " · " : "") + esc(e.name) + '</span><span class="d">' + summaryDetail(e) + '</span></div>'; }).join("");
    });
    if (S.cool.length) { sum += '<div class="se hd"><span>Cool-down</span><span class="d">' + S.cool.length + ' move' + (S.cool.length === 1 ? "" : "s") + '</span></div>'; sum += S.cool.map(function (x) { return '<div class="se"><span>' + esc(x.name) + '</span><span class="d">' + x.duration_sec + 's</span></div>'; }).join(""); }
    var iinp = "width:100%;box-sizing:border-box;padding:10px 11px;border:1px solid var(--ffp-border-mid);border-radius:10px;font-family:inherit;background:var(--ffp-bg);color:var(--ffp-text);font-size:14px;";
    document.getElementById("pgb-stage").innerHTML =
      '<div class="wbz-h">Review &amp; save</div><div class="wbz-sub">Name it, assign it, save to your library.</div>' +
      '<input id="pgb-title" value="' + esc(S.name) + '" placeholder="' + esc(m.name) + ' workout" style="' + iinp + 'font-weight:700;margin-bottom:8px;">' +
      '<input id="pgb-notes" value="' + esc(S.notes) + '" placeholder="Coaching note (optional)" style="' + iinp + 'font-size:13px;margin-bottom:14px;">' +
      '<div class="wbz-sumblk">' + (sum || '<div class="se"><span>No exercises yet</span></div>') + '</div>' +
      clientPicker() +
      '<div style="font-size:10px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;color:var(--ffp-text-dim);margin:14px 0 7px;">On which day (optional)</div>' +
      '<div style="display:flex;gap:5px;">' + DOW.map(function (d, i) { var on = S.day === i; return '<button onclick="pgbDay(' + i + ')" style="flex:1;padding:9px 0;border-radius:9px;border:1px solid ' + (on ? TEAL : "var(--ffp-border-mid)") + ';background:' + (on ? TEAL : "transparent") + ';color:' + (on ? "#fff" : "var(--ffp-text)") + ';font-weight:800;font-size:12px;cursor:pointer;font-family:inherit;">' + d.charAt(0) + '</button>'; }).join("") + '</div>';
  }
  function clientPicker() {
    var all = S.clients || [], selCount = Object.keys(S.sel).filter(function (k) { return S.sel[k]; }).length;
    var rows = all.map(function (c) {
      var on = !!S.sel[c.id];
      return '<button onclick="pgbToggleClient(\'' + c.id + '\')" style="display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:10px 11px;background:var(--ffp-bg-card);border:1px solid ' + (on ? TEAL : "var(--ffp-border-mid)") + ';border-radius:10px;margin-bottom:6px;cursor:pointer;font-family:inherit;">' +
        '<span style="width:20px;height:20px;flex:0 0 auto;border-radius:6px;border:2px solid ' + (on ? TEAL : "var(--ffp-border-mid)") + ';background:' + (on ? TEAL : "transparent") + ';display:flex;align-items:center;justify-content:center;">' + (on ? '<span class="ms" style="font-size:15px;color:#fff;">check</span>' : "") + '</span>' +
        '<span style="flex:1;min-width:0;font-weight:700;font-size:13.5px;color:var(--ffp-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(c.full_name || "Client") + '</span></button>';
    }).join("");
    return '<div style="display:flex;align-items:center;justify-content:space-between;margin:14px 0 8px;"><span style="font-size:10px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;color:var(--ffp-text-dim);">Assign to clients' + (selCount ? " · " + selCount : "") + '</span>' +
      (all.length ? '<button onclick="pgbSelAll()" style="background:none;border:none;color:' + TEAL + ';font-size:11.5px;font-weight:800;cursor:pointer;">' + (selCount === all.length ? "Clear all" : "Select all") + '</button>' : "") + '</div>' +
      (all.length ? rows : '<div class="wbz-empty" style="padding:2px 0;">No clients yet — you can still save this to your library.</div>');
  }
  window.pgbDay = function (i) { S.day = (S.day === i ? null : i); stepSave(); };
  window.pgbToggleClient = function (id) { S.sel[id] = !S.sel[id]; stepSave(); };
  window.pgbSelAll = function () { var all = S.clients || [], sc = Object.keys(S.sel).filter(function (k) { return S.sel[k]; }).length; if (sc === all.length) S.sel = {}; else all.forEach(function (c) { S.sel[c.id] = true; }); stepSave(); };
  function summaryDetail(e) { if (S.style === "sets") return e.sets + " × " + e.reps + " · " + e.rest + "s"; if (S.style === "tabata") return "Max effort"; var d = e.reps + " " + unitOf(e.measure || "reps"); if (S.style === "fortime" && e.scope === "once") d += " · once"; return d; }

  // Flatten warm-up + workout blocks + cool-down into ONE plan-shaped exercises array (what the model stores).
  function buildExercises() {
    var out = [];
    S.warm.forEach(function (m) { out.push({ name: m.name, reps: m.duration_sec + " sec", rest_sec: 0, section: "warmup" }); });
    S.blocks.forEach(function (b) {
      if (!b.ex.length) return;
      b.ex.forEach(function (e, i) {
        var unit = unitOf(e.measure), repsStr = unit === "reps" ? String(e.reps) : (String(e.reps) + " " + unit);
        var o = { name: e.name, reps: repsStr, rest_sec: S.style === "sets" ? (Number(e.rest) || 75) : (Number(b.p.rest) || 0) };
        if (S.style === "sets") o.sets = Number(e.sets) || 3;
        if (i > 0 && isGroupStyle()) o.link = true;
        if (S.style === "fortime" && e.scope === "once") o.once = true;
        if (i === 0) {
          o.style = S.style;
          if (S.style === "circuit" || S.style === "superset") o.rounds = b.p.rounds;
          if (S.style === "amrap") o.capMin = b.p.capMin;
          if (S.style === "emom") o.emomMin = b.p.emomMin;
          if (S.style === "tabata") { o.tabWork = b.p.tabWork; o.tabRest = b.p.tabRest; o.rounds = b.p.tabRounds; }
          if (S.style === "fortime") { o.rounds = b.p.ftRounds; o.capMin = b.p.ftCap; }
        }
        out.push(o);
      });
    });
    S.cool.forEach(function (m) { out.push({ name: m.name, reps: m.duration_sec + " sec", rest_sec: 0, section: "cooldown" }); });
    return out;
  }
  window.pgbSave = async function () {
    var tEl = document.getElementById("pgb-title"), nEl = document.getElementById("pgb-notes");
    if (tEl) S.name = tEl.value; if (nEl) S.notes = nEl.value;
    var title = (S.name || "").trim() || (meta().name + " workout");
    var exercises = buildExercises();
    if (!exercises.some(function (o) { return !o.section; })) { window.showToast("Add an exercise first", "error"); return; }
    var pid = (window._memProvId ? window._memProvId() : null);
    if (!pid) { window.showToast("Sign in again", "error"); return; }
    var sel = Object.keys(S.sel).filter(function (k) { return S.sel[k]; });
    window.showToast("Saving…");
    try {
      var r = await window.supabase.rpc("pro_workout_save", { p_professional: pid, p_id: null, p_client_id: null, p_kind: "template", p_title: title, p_notes: (S.notes || "").trim() || null, p_exercises: exercises, p_day_of_week: null, p_source: "builder" });
      if (r && r.error) throw r.error;
      var tid = r && r.data && r.data.id;
      if (sel.length && tid) {
        var a = await window.supabase.rpc("pro_workout_assign", { p_pro: pid, p_template_id: tid, p_client_ids: sel, p_day: (S.day == null ? null : S.day) });
        if (a && a.error) throw a.error;
        window.showToast("Saved to library · assigned to " + sel.length + " client" + (sel.length === 1 ? "" : "s"), "success");
      } else { window.showToast("Saved to your library", "success"); }
      if (S.clientId && window.openClientWorkouts) window.openClientWorkouts(S.clientId);
      else { if (window.closeModal) window.closeModal(); if (window.renderWorkoutHub) window.renderWorkoutHub(); }
    } catch (e) { console.error("[pgb save]", e); window.showToast("Couldn’t save — try again", "error"); }
  };

  /* Assign an existing library workout to 1+ clients (opened from the Workouts library). */
  var A = null;
  window.proAssignLibrary = function (templateId, title) {
    if (!title && window._wkLib) { var f = (window._wkLib || []).filter(function (w) { return w.id === templateId; })[0]; title = f && f.title; }
    A = { tid: templateId, title: title || "Workout", clients: [], sel: {}, day: null };
    renderAssign();
    var pid = window._memProvId ? window._memProvId() : null;
    if (pid && window.supabase) window.supabase.rpc("pro_list_clients", { p_pro: pid }).then(function (r) { A.clients = (r && r.data) || []; renderAssign(); }, function () {});
  };
  function renderAssign() {
    var all = A.clients || [], sel = Object.keys(A.sel).filter(function (k) { return A.sel[k]; });
    var rows = all.map(function (c) {
      var on = !!A.sel[c.id];
      return '<button onclick="paToggle(\'' + c.id + '\')" style="display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:10px 11px;background:var(--ffp-bg-card);border:1px solid ' + (on ? TEAL : "var(--ffp-border-mid)") + ';border-radius:10px;margin-bottom:6px;cursor:pointer;font-family:inherit;">' +
        '<span style="width:20px;height:20px;flex:0 0 auto;border-radius:6px;border:2px solid ' + (on ? TEAL : "var(--ffp-border-mid)") + ';background:' + (on ? TEAL : "transparent") + ';display:flex;align-items:center;justify-content:center;">' + (on ? '<span class="ms" style="font-size:15px;color:#fff;">check</span>' : "") + '</span>' +
        '<span style="flex:1;min-width:0;font-weight:700;font-size:13.5px;color:var(--ffp-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(c.full_name || "Client") + '</span></button>';
    }).join("");
    var body = '<div class="psub" style="margin:0 0 10px;">Choose who gets <b>' + esc(A.title) + '</b>.</div>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin:2px 0 8px;"><span style="font-size:10px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;color:var(--ffp-text-dim);">Clients' + (sel.length ? " · " + sel.length : "") + '</span>' +
      (all.length ? '<button onclick="paSelAll()" style="background:none;border:none;color:' + TEAL + ';font-size:11.5px;font-weight:800;cursor:pointer;">' + (sel.length === all.length ? "Clear all" : "Select all") + '</button>' : "") + '</div>' +
      (all.length ? rows : '<div class="psub" style="padding:4px 0;">No clients yet.</div>') +
      '<div style="font-size:10px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;color:var(--ffp-text-dim);margin:14px 0 7px;">On which day (optional)</div>' +
      '<div style="display:flex;gap:5px;">' + DOW.map(function (d, i) { var on = A.day === i; return '<button onclick="paDay(' + i + ')" style="flex:1;padding:9px 0;border-radius:9px;border:1px solid ' + (on ? TEAL : "var(--ffp-border-mid)") + ';background:' + (on ? TEAL : "transparent") + ';color:' + (on ? "#fff" : "var(--ffp-text)") + ';font-weight:800;font-size:12px;cursor:pointer;font-family:inherit;">' + d.charAt(0) + '</button>'; }).join("") + '</div>';
    window.openModalShell("lg", "Assign workout", body,
      '<button class="btn btn-ghost" onclick="closeModal();if(window.renderWorkoutHub)renderWorkoutHub()">Cancel</button>' +
      '<button class="btn btn-pri" onclick="paDo()"><span class="ms">send</span> Assign' + (sel.length ? " to " + sel.length : "") + '</button>');
  }
  window.paToggle = function (id) { A.sel[id] = !A.sel[id]; renderAssign(); };
  window.paSelAll = function () { var all = A.clients || [], sc = Object.keys(A.sel).filter(function (k) { return A.sel[k]; }).length; if (sc === all.length) A.sel = {}; else all.forEach(function (c) { A.sel[c.id] = true; }); renderAssign(); };
  window.paDay = function (i) { A.day = (A.day === i ? null : i); renderAssign(); };
  window.paDo = async function () {
    var pid = window._memProvId ? window._memProvId() : null, sel = Object.keys(A.sel).filter(function (k) { return A.sel[k]; });
    if (!sel.length) { window.showToast("Pick at least one client", "error"); return; }
    window.showToast("Assigning…");
    try {
      var a = await window.supabase.rpc("pro_workout_assign", { p_pro: pid, p_template_id: A.tid, p_client_ids: sel, p_day: (A.day == null ? null : A.day) });
      if (a && a.error) throw a.error;
      window.showToast("Assigned to " + sel.length + " client" + (sel.length === 1 ? "" : "s"), "success");
      if (window.closeModal) window.closeModal(); if (window.renderWorkoutHub) window.renderWorkoutHub();
    } catch (e) { console.error("[pa]", e); window.showToast("Couldn’t assign — try again", "error"); }
  };
})();
