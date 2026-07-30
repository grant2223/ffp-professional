/* FFP Professional — Guided Workout Builder (mirrors the FFP App member builder: Style → Exercises →
   Reps/Rounds/Rest). Produces the SAME plan-shaped `exercises` array the member app renders, and saves
   it assigned to the client + a day via pro_workout_save (kind='assigned', source='builder'). */
(function () {
  "use strict";

  var STYLES = [
    { k: "sets",     name: "Straight sets", icon: "fitness_center", c: "#64748b", desc: "Each exercise its own sets, reps & rest." },
    { k: "superset", name: "Superset",      icon: "sync_alt",       c: "#7c5cff", desc: "Pair moves, reps each, no rest inside." },
    { k: "circuit",  name: "Circuit",       icon: "repeat",         c: "#1e88c7", desc: "Rounds through all stations; rest per round." },
    { k: "amrap",    name: "AMRAP",         icon: "timer",          c: "#10a37f", desc: "Time cap + fixed reps; loop till the clock stops." },
    { k: "emom",     name: "EMOM",          icon: "av_timer",       c: "#e0891e", desc: "Every minute, on the minute — set reps/min." },
    { k: "tabata",   name: "Tabata",        icon: "bolt",           c: "#e04b3a", desc: "Work / rest × rounds. Max effort." },
    { k: "fortime",  name: "For Time",      icon: "speed",          c: "#d6336c", desc: "Fixed work — finish as fast as you can." }
  ];
  var LIB = [
    ["Goblet squat","Legs"],["Back squat","Legs"],["Romanian deadlift","Hamstrings"],["Walking lunges","Legs"],
    ["DB bench press","Chest"],["Push-ups","Chest"],["DB shoulder press","Shoulders"],["One-arm DB row","Back"],
    ["Pull-ups","Back"],["Bicep curl","Arms"],["Tricep dips","Arms"],["Plank","Core"],["Hanging knee raise","Core"],
    ["Kettlebell swing","Full body"],["Burpees","Conditioning"],["Mountain climbers","Conditioning"],
    ["Box jumps","Legs"],["Wall balls","Full body"],["Rowing","Conditioning"],["Assault bike","Conditioning"],
    ["Run","Cardio"],["Ski erg","Cardio"],["Double-unders","Conditioning"]
  ];
  var MEAS = ["reps", "m", "cal", "s"];
  function unitOf(m) { return m === "m" ? "m" : m === "cal" ? "cal" : m === "s" ? "sec" : "reps"; }
  var DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var DEF_P = { rounds: 3, rest: 60, capMin: 12, emomMin: 10, tabWork: 20, tabRest: 10, tabRounds: 8, ftRounds: 10, ftCap: 15 };

  var S = null; // builder state
  function esc(s) { return (window.escHtml ? window.escHtml(s) : String(s == null ? "" : s)); }
  function meta() { return STYLES.filter(function (x) { return x.k === S.style; })[0] || STYLES[0]; }
  function grouped() { return S.style === "superset" || S.style === "circuit"; }

  window.proGuidedBuild = function (clientId) {
    S = { clientId: clientId, step: 1, style: null, ex: [], p: JSON.parse(JSON.stringify(DEF_P)), q: "", day: null, title: "", notes: "" };
    render();
  };

  function render() {
    var titles = ["Pick a style", "Add exercises", "Reps · rounds · rest"];
    var body =
      '<div style="display:flex;gap:6px;margin:0 0 14px;">' +
        ["Style", "Exercises", "Reps · Rest"].map(function (l, i) {
          var on = S.step === i + 1, done = S.step > i + 1;
          return '<div style="flex:1;"><div style="height:4px;border-radius:3px;background:' + (on || done ? "var(--ffp-purple)" : "var(--ffp-border-mid)") + ';"></div>' +
            '<div style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.4px;margin-top:5px;color:' + (on ? "var(--ffp-purple)" : "var(--ffp-text-dim)") + ';">' + l + '</div></div>';
        }).join("") +
      '</div><div id="pgb-body"></div>';
    var foot =
      '<button class="btn btn-ghost" onclick="' + (S.step > 1 ? "pgbBack()" : "openClientWorkouts('" + S.clientId + "')") + '">' + (S.step > 1 ? "Back" : "Cancel") + '</button>' +
      (S.step < 3
        ? '<button class="btn btn-pri" onclick="pgbNext()">Next</button>'
        : '<button class="btn btn-pri" onclick="pgbSave()"><span class="ms">send</span> Assign to client</button>');
    window.openModalShell("lg", titles[S.step - 1], body, foot);
    if (S.step === 1) stepStyle();
    else if (S.step === 2) stepExercises();
    else stepParams();
  }

  window.pgbBack = function () { if (S.step > 1) { S.step--; render(); } };
  window.pgbNext = function () {
    if (S.step === 1 && !S.style) { window.showToast("Pick a style", "error"); return; }
    if (S.step === 2 && !S.ex.length) { window.showToast("Add at least one exercise", "error"); return; }
    S.step++; render();
  };

  function stepStyle() {
    var host = document.getElementById("pgb-body");
    host.innerHTML =
      '<div style="font-size:13px;color:var(--ffp-text-dim);margin:0 0 12px;">This drives the prescription in the next steps.</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
      STYLES.map(function (s) {
        var on = S.style === s.k;
        return '<button onclick="pgbPickStyle(\'' + s.k + '\')" style="text-align:left;padding:12px;border-radius:12px;border:1.5px solid ' + (on ? s.c : "var(--ffp-border-mid)") + ';background:' + (on ? "rgba(124,58,237,0.06)" : "var(--ffp-bg-card)") + ';cursor:pointer;font-family:inherit;">' +
          '<span class="ms" style="font-size:20px;color:' + s.c + ';">' + s.icon + '</span>' +
          '<div style="font-weight:800;font-size:13.5px;color:var(--ffp-text);margin-top:5px;">' + s.name + '</div>' +
          '<div style="font-size:10.5px;color:var(--ffp-text-dim);line-height:1.35;margin-top:2px;">' + s.desc + '</div></button>';
      }).join("") + '</div>';
  }
  window.pgbPickStyle = function (k) { S.style = k; stepStyle(); };

  function stepExercises() {
    var host = document.getElementById("pgb-body");
    var ql = S.q.trim().toLowerCase();
    var have = {}; S.ex.forEach(function (e) { have[e.name.toLowerCase()] = 1; });
    var lib = LIB.filter(function (x) { return !have[x[0].toLowerCase()] && (!ql || (x[0] + " " + x[1]).toLowerCase().indexOf(ql) > -1); });
    var inp = "padding:7px 9px;border:1px solid var(--ffp-border-mid);border-radius:8px;font-family:inherit;background:var(--ffp-bg);color:var(--ffp-text);font-size:13px;";
    var picked = S.ex.map(function (e, i) {
      return '<div style="display:flex;align-items:center;gap:7px;padding:9px 10px;background:var(--ffp-bg-card);border:1px solid var(--ffp-border-mid);border-radius:11px;margin-bottom:6px;">' +
        '<span class="ms" style="color:var(--ffp-purple);font-size:18px;">fitness_center</span>' +
        '<span style="flex:1;min-width:0;font-weight:700;font-size:13px;color:var(--ffp-text);">' + esc(e.name) + '<span style="color:var(--ffp-text-dim);font-weight:600;"> · ' + esc(e.muscle || "") + '</span></span>' +
        '<input value="' + esc(e.reps) + '" oninput="pgbReps(' + i + ',this.value)" style="width:46px;text-align:center;' + inp + '" title="Reps">' +
        '<button onclick="pgbCycleMeasure(' + i + ')" style="min-width:40px;' + inp + 'cursor:pointer;" title="Unit">' + unitOf(e.measure) + '</button>' +
        (S.style === "sets" ? '<input type="number" value="' + (e.sets || 3) + '" oninput="pgbSets(' + i + ',this.value)" style="width:40px;text-align:center;' + inp + '" title="Sets">' : "") +
        (S.style === "fortime" ? '<button onclick="pgbScope(' + i + ')" style="' + inp + 'cursor:pointer;font-size:10px;" title="Once vs each round">' + (e.scope === "once" ? "once" : "rounds") + '</button>' : "") +
        '<button onclick="pgbRm(' + i + ')" style="background:none;border:none;color:var(--ffp-text-dim);cursor:pointer;">&times;</button></div>';
    }).join("");
    host.innerHTML =
      '<div style="font-size:12px;color:var(--ffp-text-dim);margin:0 0 8px;">' + meta().name + ' block · tap to add' + (S.style === "sets" ? " · reps + sets each" : " · reps each") + '</div>' +
      '<div style="position:relative;margin-bottom:10px;"><span class="ms" style="position:absolute;left:10px;top:9px;color:var(--ffp-text-dim);font-size:18px;">search</span>' +
        '<input id="pgb-q" value="' + esc(S.q) + '" oninput="pgbQ(this.value)" onkeydown="if(event.key===\'Enter\'&&this.value.trim())pgbAdd(this.value.trim(),\'Custom\')" placeholder="Search or type an exercise…" style="width:100%;box-sizing:border-box;padding:9px 9px 9px 34px;' + inp + '"></div>' +
      (picked ? '<div style="margin-bottom:10px;">' + picked + '</div>' : "") +
      '<div style="font-size:10px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;color:var(--ffp-text-dim);margin:2px 0 6px;">Suggestions</div>' +
      (lib.length ? lib.map(function (x) {
        return '<div onclick="pgbAdd(\'' + x[0].replace(/'/g, "\\'") + '\',\'' + x[1] + '\')" style="display:flex;align-items:center;justify-content:space-between;padding:10px 11px;background:var(--ffp-bg-card);border:1px solid var(--ffp-border-mid);border-radius:10px;margin-bottom:5px;cursor:pointer;">' +
          '<span style="font-weight:700;font-size:13px;color:var(--ffp-text);">' + esc(x[0]) + '<span style="color:var(--ffp-text-dim);font-weight:600;"> · ' + esc(x[1]) + '</span></span><span class="ms" style="color:var(--ffp-purple);">add_circle</span></div>';
      }).join("") : '<div class="psub" style="padding:6px 0;">' + (S.q ? 'Press Enter to add “' + esc(S.q.trim()) + '”' : "All added — nice.") + '</div>');
    var qEl = document.getElementById("pgb-q"); if (qEl && document.activeElement !== qEl && S.q) { qEl.focus(); qEl.setSelectionRange(qEl.value.length, qEl.value.length); }
  }
  window.pgbQ = function (v) { S.q = v; stepExercises(); };
  window.pgbAdd = function (name, muscle) { S.ex.push({ name: name, muscle: muscle, sets: 3, reps: "10", rest: 75, measure: "reps", scope: "round" }); S.q = ""; stepExercises(); };
  window.pgbRm = function (i) { S.ex.splice(i, 1); stepExercises(); };
  window.pgbReps = function (i, v) { if (S.ex[i]) S.ex[i].reps = v; };
  window.pgbSets = function (i, v) { if (S.ex[i]) S.ex[i].sets = Math.max(1, parseInt(v, 10) || 1); };
  window.pgbCycleMeasure = function (i) { if (S.ex[i]) { S.ex[i].measure = MEAS[(MEAS.indexOf(S.ex[i].measure) + 1) % MEAS.length]; stepExercises(); } };
  window.pgbScope = function (i) { if (S.ex[i]) { S.ex[i].scope = S.ex[i].scope === "once" ? "round" : "once"; stepExercises(); } };

  function stepParams() {
    var host = document.getElementById("pgb-body");
    var inp = "padding:8px 9px;border:1px solid var(--ffp-border-mid);border-radius:8px;font-family:inherit;background:var(--ffp-bg);color:var(--ffp-text);font-size:14px;width:78px;text-align:center;";
    function num(label, key, min) {
      return '<div style="display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--ffp-border);"><span style="font-size:13px;color:var(--ffp-text);">' + label + '</span>' +
        '<span style="display:flex;align-items:center;gap:8px;"><button onclick="pgbP(\'' + key + '\',-1,' + min + ')" class="btn btn-sec btn-sm" style="width:34px;">−</button>' +
        '<b style="min-width:34px;text-align:center;">' + S.p[key] + '</b>' +
        '<button onclick="pgbP(\'' + key + '\',1,' + min + ')" class="btn btn-sec btn-sm" style="width:34px;">+</button></span></div>';
    }
    var rows = "";
    if (S.style === "sets") rows = '<div class="psub" style="margin:0 0 4px;">Sets, reps & rest are set per exercise on the previous step.</div>';
    else if (S.style === "superset" || S.style === "circuit") rows = num("Rounds", "rounds", 1) + num("Rest between rounds (sec)", "rest", 0);
    else if (S.style === "amrap") rows = num("Time cap (min)", "capMin", 1) + num("Rest (sec)", "rest", 0);
    else if (S.style === "emom") rows = num("Minutes", "emomMin", 1);
    else if (S.style === "tabata") rows = num("Work (sec)", "tabWork", 5) + num("Rest (sec)", "tabRest", 5) + num("Rounds", "tabRounds", 1);
    else if (S.style === "fortime") rows = num("Rounds", "ftRounds", 1) + num("Time cap (min)", "ftCap", 1);

    var iinp = "width:100%;box-sizing:border-box;padding:10px 11px;border:1px solid var(--ffp-border-mid);border-radius:10px;font-family:inherit;background:var(--ffp-bg);color:var(--ffp-text);font-size:14px;";
    host.innerHTML =
      '<input id="pgb-title" value="' + esc(S.title) + '" placeholder="Workout title (e.g. ' + esc(meta().name) + ' block)" style="' + iinp + 'font-weight:700;margin-bottom:8px;">' +
      '<input id="pgb-notes" value="' + esc(S.notes) + '" placeholder="Coaching note (optional)" style="' + iinp + 'font-size:13px;margin-bottom:14px;">' +
      (rows ? '<div style="margin-bottom:14px;">' + rows + '</div>' : "") +
      '<div style="font-size:10px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;color:var(--ffp-text-dim);margin:2px 0 7px;">Assign to a day</div>' +
      '<div style="display:flex;gap:5px;">' + DOW.map(function (d, i) {
        var on = S.day === i;
        return '<button onclick="pgbDay(' + i + ')" style="flex:1;padding:9px 0;border-radius:9px;border:1px solid ' + (on ? "var(--ffp-purple)" : "var(--ffp-border-mid)") + ';background:' + (on ? "var(--ffp-purple)" : "transparent") + ';color:' + (on ? "#fff" : "var(--ffp-text)") + ';font-weight:800;font-size:12px;cursor:pointer;font-family:inherit;">' + d.charAt(0) + '</button>';
      }).join("") + '</div>' +
      '<div class="psub" style="margin:7px 0 0;">Leave a day unselected to save it as a template.</div>';
  }
  window.pgbP = function (key, d, min) { S.p[key] = Math.max(min, (S.p[key] || 0) + d); stepParams(); };
  window.pgbDay = function (i) { S.day = (S.day === i ? null : i); stepParams(); };

  function buildExercises() {
    var isGroup = grouped() || S.style === "fortime";
    var out = S.ex.map(function (e, i) {
      var unit = unitOf(e.measure);
      var repsStr = unit === "reps" ? String(e.reps) : (String(e.reps) + " " + unit);
      var o = { name: e.name, reps: repsStr, rest_sec: S.style === "sets" ? (Number(e.rest) || 75) : (Number(S.p.rest) || 0) };
      if (S.style === "sets") o.sets = Number(e.sets) || 3;
      if (i > 0 && isGroup) o.link = true;
      if (S.style === "fortime" && e.scope === "once") o.once = true;
      return o;
    });
    if (out[0]) {
      out[0].style = S.style;
      if (S.style === "circuit" || S.style === "superset") out[0].rounds = S.p.rounds;
      if (S.style === "amrap") out[0].capMin = S.p.capMin;
      if (S.style === "emom") out[0].emomMin = S.p.emomMin;
      if (S.style === "tabata") { out[0].tabWork = S.p.tabWork; out[0].tabRest = S.p.tabRest; out[0].rounds = S.p.tabRounds; }
      if (S.style === "fortime") { out[0].rounds = S.p.ftRounds; out[0].capMin = S.p.ftCap; }
    }
    return out;
  }

  window.pgbSave = async function () {
    var tEl = document.getElementById("pgb-title"), nEl = document.getElementById("pgb-notes");
    if (tEl) S.title = tEl.value; if (nEl) S.notes = nEl.value;
    var title = (S.title || "").trim() || (meta().name + " block");
    var exercises = buildExercises();
    if (!exercises.length) { window.showToast("Add an exercise first", "error"); return; }
    var pid = (window._memProvId ? window._memProvId() : null);
    if (!pid) { window.showToast("Sign in again", "error"); return; }
    window.showToast("Assigning…");
    try {
      var r = await window.supabase.rpc("pro_workout_save", {
        p_professional: pid, p_id: null, p_client_id: S.clientId,
        p_kind: "assigned", p_title: title, p_notes: (S.notes || "").trim() || null,
        p_exercises: exercises, p_day_of_week: (S.day == null ? null : S.day), p_source: "builder"
      });
      if (r && r.error) throw r.error;
      window.showToast("Workout assigned", "success");
      if (window.openClientWorkouts) window.openClientWorkouts(S.clientId);
    } catch (e) { console.error("[pgb save]", e); window.showToast("Couldn’t assign — try again", "error"); }
  };
})();
