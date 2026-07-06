// ════════════════════════════════════════════════════════════════════════
// FFP Professional — GROW · guided STEP flow engine (reused by every road-map step).
// Full-screen: the Coach asks a few OPEN questions one at a time, the coach
// answers by TYPING or VOICE, then the AI synthesises their answers into a real
// result they own. Saves to pro_grow_steps. Backend: POST /api/pro/grow/synthesize.
//   window.growFlowOpen('strengths' | 'ideal_client')   — open a step
//   window.growStep1Open()                              — back-compat (= strengths)
// Add a new step = add one entry to FLOWS (questions + how to show the result).
// ════════════════════════════════════════════════════════════════════════
(function () {
  if (window.__growFlowLoaded) return; window.__growFlowLoaded = true;
  var API = (typeof PRO_API !== 'undefined' && PRO_API) || 'https://ffp-passport-backend.vercel.app';
  function pid() { return (window.FFP_PROVIDER || {}).id || null; }
  function mid() { var p = window.FFP_PROVIDER || {}; return p.member_id || p.id || null; }
  function esc(s) { return (typeof escHtml === 'function') ? escHtml(s == null ? '' : String(s)) : String(s == null ? '' : s); }
  function toast(m, t) { if (typeof showToast === 'function') showToast(m, t); }

  function _row(label, val) {
    if (!val) return '';
    return '<div style="padding:12px 0;border-bottom:1px solid var(--ffp-border,#e4ebec);"><div style="font-size:9.5px;font-weight:800;letter-spacing:.7px;text-transform:uppercase;color:#8a99a0;margin-bottom:4px;">' + esc(label) + '</div><div style="font-size:14px;font-weight:600;color:var(--ffp-text,#0f2327);line-height:1.45;">' + esc(val) + '</div></div>';
  }
  function _headline(over, big) {
    return '<div style="background:#fff;border-radius:18px;box-shadow:0 12px 30px rgba(10,62,68,.13);overflow:hidden;margin-bottom:16px;"><div style="height:6px;background:linear-gradient(90deg,#0a3e44,#2ba8e0,#FFCC00);"></div><div style="padding:17px;"><div style="font-size:9.5px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#2ba8e0;margin-bottom:8px;">' + esc(over) + '</div><div style="font-size:19px;font-weight:800;color:var(--ffp-text,#0f2327);line-height:1.35;">' + esc(big) + '</div></div></div>';
  }

  function outcomeStrengths(o) {
    var hasProof = o.has_proof !== false;
    var html = '<div style="font-size:10px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:#2ba8e0;margin-bottom:10px;">Your result</div>'
      + _headline("Who you're built to help", o.audience_line || '');
    if (o.strengths && o.strengths.length) html += '<div style="font-size:9.5px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;color:#8a99a0;margin-bottom:8px;">Your strengths</div><div style="display:flex;flex-wrap:wrap;gap:7px;margin-bottom:16px;">' + o.strengths.map(function (s) { return '<div style="background:#e5f6f1;color:#0a3e44;border-radius:99px;padding:7px 13px;font-size:12.5px;font-weight:800;">' + esc(s) + '</div>'; }).join('') + '</div>';
    if (hasProof) { if (o.proof) html += '<div style="display:flex;gap:10px;background:#e5f6ee;border:1px solid #c3e9d5;border-radius:14px;padding:13px 15px;margin-bottom:16px;"><span class="ms" style="color:#1d7a4d;">verified</span><div style="font-size:13px;color:#0f2327;font-weight:600;line-height:1.45;">' + esc(o.proof) + '</div></div>'; }
    else { html += '<div style="background:#fff8e8;border:1px solid #f0d9a0;border-radius:14px;padding:14px;margin-bottom:16px;"><div style="font-size:11px;font-weight:800;color:#9a6b00;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;">Your development plan — build the proof</div>' + (o.development_plan || []).map(function (d) { return '<div style="display:flex;gap:8px;padding:5px 0;"><span class="ms" style="color:#c8871a;font-size:18px;">arrow_right</span><div style="font-size:13px;color:#0f2327;font-weight:600;line-height:1.4;">' + esc(d) + '</div></div>'; }).join('') + '</div>'; }
    if (o.note) html += '<div style="font-size:12.5px;color:var(--ffp-text-muted,#5a6b6e);font-style:italic;">' + esc(o.note) + '</div>';
    return html;
  }
  function outcomeIdealClient(o) {
    var html = '<div style="font-size:10px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:#2ba8e0;margin-bottom:10px;">Your ideal client</div>'
      + _headline('Your one line', o.one_liner || o.profile || '');
    if (o.profile && o.one_liner) html += '<div style="font-size:13.5px;color:var(--ffp-text,#0f2327);font-weight:600;line-height:1.5;margin-bottom:14px;">' + esc(o.profile) + '</div>';
    html += _row('Their biggest problem', o.problem) + _row('What winning looks like', o.outcome) + _row('Where to find them', o.where) + _row('Why you', o.edge);
    if (o.note) html += '<div style="font-size:12.5px;color:var(--ffp-text-muted,#5a6b6e);font-style:italic;margin-top:14px;">' + esc(o.note) + '</div>';
    return html;
  }

  var FLOWS = {
    strengths: {
      code: 'strengths', title: 'Step 1 · Your strengths', outcome: outcomeStrengths,
      qs: [
        { label: 'Your strength', q: 'What are you great at?' },
        { label: 'Why', q: 'Why are you good at it?' },
        { label: 'Your knowledge', q: 'What do you know about it?' },
        { label: 'Your experience', q: 'What experience do you have?' },
        { label: 'Your proof', q: 'What’s your proof?' },
        { label: 'Your people', q: 'Who do you want to help?' },
        { label: 'The gaps', q: 'What are you still missing?' },
        { label: 'World-class', q: 'What would world-class look like?' }
      ]
    },
    ideal_client: {
      code: 'ideal_client', title: 'Step 2 · Your ideal client', outcome: outcomeIdealClient,
      qs: [
        { label: 'Who', q: 'Who exactly do you want to work with?' },
        { label: 'Their struggle', q: 'What’s their biggest struggle?' },
        { label: 'Tried before', q: 'What have they already tried?' },
        { label: 'Winning', q: 'What does winning look like for them?' },
        { label: 'Where', q: 'Where do you find these people?' },
        { label: 'Why you', q: 'Why are you the right coach for them?' }
      ]
    }
  };

  var cur = null, idx = 0, ans = [], rec = null, recOn = false, lastOutcome = null;

  function ensure() {
    if (document.getElementById('gs1-ov')) return;
    var ov = document.createElement('div'); ov.id = 'gs1-ov';
    ov.style.cssText = 'position:fixed;inset:0;z-index:4000;background:var(--ffp-bg,#f4f7f8);display:none;flex-direction:column;';
    ov.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:16px 18px;padding-top:calc(16px + env(safe-area-inset-top));border-bottom:1px solid var(--ffp-border,#e4ebec);flex:0 0 auto;">'
        + '<div id="gs1-title" style="font-size:15px;font-weight:900;color:var(--ffp-text,#0f2327);"></div>'
        + '<button onclick="window.__gs1.close()" style="background:none;border:none;color:var(--ffp-text-muted,#5a6b6e);cursor:pointer;"><span class="ms" style="font-size:24px;">close</span></button></div>'
      + '<div id="gs1-prog" style="display:flex;gap:5px;padding:12px 18px 0;flex:0 0 auto;width:100%;max-width:620px;margin:0 auto;box-sizing:border-box;"></div>'
      + '<div id="gs1-body" style="flex:1 1 auto;overflow-y:auto;padding:18px;width:100%;max-width:620px;margin:0 auto;box-sizing:border-box;"></div>'
      + '<div id="gs1-foot" style="padding:14px 18px;padding-bottom:calc(14px + env(safe-area-inset-bottom));border-top:1px solid var(--ffp-border,#e4ebec);display:flex;gap:10px;flex:0 0 auto;width:100%;max-width:620px;margin:0 auto;box-sizing:border-box;"></div>';
    document.body.appendChild(ov);
  }

  function answersObj() { var o = {}; for (var i = 0; i < cur.qs.length; i++) o['q' + (i + 1)] = ans[i] || ''; return o; }
  function capture() { var ta = document.getElementById('gs1-ta'); if (ta) ans[idx] = ta.value; }

  async function loadSaved() {
    var p = pid(); if (!p) return;
    try {
      var r = await window.supabase.rpc('pro_grow_step_get', { p_pro: p, p_code: cur.code });
      var d = r && r.data;
      if (d && d.answers) { for (var i = 0; i < cur.qs.length; i++) ans[i] = d.answers['q' + (i + 1)] || ''; if (document.getElementById('gs1-ov').style.display === 'flex') render(); }
    } catch (e) {}
  }

  function open(key) {
    cur = FLOWS[key]; if (!cur) { toast('Coming soon', 'info'); return; }
    ensure(); idx = 0; ans = cur.qs.map(function () { return ''; });
    var tt = document.getElementById('gs1-title'); if (tt) tt.textContent = cur.title;
    document.getElementById('gs1-ov').style.display = 'flex'; render(); loadSaved();
  }
  function close() { stopVoice(); var o = document.getElementById('gs1-ov'); if (o) o.style.display = 'none'; }

  function render() {
    var prog = document.getElementById('gs1-prog');
    if (prog) { var s = ''; for (var i = 0; i < cur.qs.length; i++) s += '<div style="flex:1;height:5px;border-radius:99px;background:' + (i < idx ? '#0a3e44' : (i === idx ? '#FFCC00' : '#dbe4e5')) + ';"></div>'; prog.innerHTML = s; }
    var q = cur.qs[idx];
    document.getElementById('gs1-body').innerHTML =
      '<div style="font-size:10px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:#2ba8e0;margin-bottom:8px;">Question ' + (idx + 1) + ' of ' + cur.qs.length + ' · ' + esc(q.label) + '</div>'
      + '<div style="font-size:24px;font-weight:900;color:var(--ffp-text,#0f2327);line-height:1.2;letter-spacing:-.4px;margin-bottom:16px;">' + esc(q.q) + '</div>'
      + '<textarea id="gs1-ta" rows="6" placeholder="Type your answer, or tap the mic…" style="width:100%;box-sizing:border-box;background:#fff;border:1.5px solid var(--ffp-border-mid,#ccd9da);border-radius:14px;padding:14px;font-size:16px;font-family:inherit;color:var(--ffp-text,#0f2327);line-height:1.5;">' + esc(ans[idx] || '') + '</textarea>'
      + '<div style="display:flex;align-items:center;gap:9px;margin-top:12px;">'
        + '<button id="gs1-mic" onclick="window.__gs1.voice()" style="width:38px;height:38px;flex:0 0 auto;border-radius:50%;background:#0a3e44;color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;"><span class="ms" style="font-size:19px;">mic</span></button>'
        + '<div id="gs1-michint" style="font-size:12.5px;color:var(--ffp-text-muted,#5a6b6e);font-weight:600;">Tap to speak</div></div>';
    document.getElementById('gs1-foot').innerHTML =
      (idx > 0 ? '<button onclick="window.__gs1.back()" style="flex:0 0 auto;background:#fff;color:#0a3e44;border:1.5px solid #dbe4e5;border-radius:13px;padding:14px 18px;font-size:14px;font-weight:800;font-family:inherit;cursor:pointer;">Back</button>' : '')
      + '<button onclick="window.__gs1.next()" style="flex:1;background:linear-gradient(135deg,#0a3e44,#2ba8e0);color:#fff;border:none;border-radius:13px;padding:14px;font-size:15px;font-weight:800;font-family:inherit;cursor:pointer;box-shadow:0 8px 18px rgba(43,168,224,.28);">' + (idx < cur.qs.length - 1 ? 'Next →' : 'See my result ✨') + '</button>';
  }

  function setMic(on) {
    var b = document.getElementById('gs1-mic'); if (b) { b.style.background = on ? '#d64545' : '#0a3e44'; b.innerHTML = '<span class="ms" style="font-size:19px;">' + (on ? 'stop' : 'mic') + '</span>'; }
    var h = document.getElementById('gs1-michint'); if (h) h.textContent = on ? 'Listening… tap to stop' : 'Tap to speak';
  }
  function stopVoice() { if (rec) { try { rec.stop(); } catch (e) {} } rec = null; recOn = false; setMic(false); }
  function voice() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast('Voice isn’t supported here — type your answer', 'error'); return; }
    if (recOn) { stopVoice(); return; }
    var ta = document.getElementById('gs1-ta'); if (!ta) return;
    var base = ta.value;
    rec = new SR(); rec.lang = 'en-GB'; rec.continuous = true; rec.interimResults = true;
    rec.onresult = function (e) { var t = ''; for (var i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript; ta.value = (base ? base + ' ' : '') + t; };
    rec.onerror = function () { stopVoice(); };
    rec.onend = function () { recOn = false; setMic(false); };
    try { rec.start(); recOn = true; setMic(true); } catch (e) { recOn = false; }
  }

  async function saveAnswers() { var p = pid(); if (!p) return; try { await window.supabase.rpc('pro_grow_step_save', { p_pro: p, p_code: cur.code, p_answers: answersObj() }); } catch (e) {} }

  function next() { capture(); stopVoice(); if (idx < cur.qs.length - 1) { idx++; render(); saveAnswers(); } else { finish(); } }
  function back() { capture(); stopVoice(); if (idx > 0) { idx--; render(); } }

  async function finish() {
    capture(); stopVoice();
    document.getElementById('gs1-body').innerHTML = '<div style="text-align:center;padding:54px 12px;"><div style="font-size:15px;font-weight:800;color:#0a3e44;">Turning your answers into your result…</div><div class="spin" style="margin:20px auto;"></div></div>';
    document.getElementById('gs1-foot').innerHTML = '';
    await saveAnswers();
    try {
      var r = await fetch(API + '/api/pro/grow/synthesize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ member_id: mid(), step: cur.code, answers: answersObj() }) });
      var j = await r.json();
      if (!r.ok || !j || !j.outcome) throw new Error('synth');
      showOutcome(j.outcome);
    } catch (e) {
      document.getElementById('gs1-body').innerHTML = '<div style="text-align:center;padding:44px 16px;color:#5a6b6e;font-weight:600;">Couldn’t build your result — check your connection and try again.</div>';
      document.getElementById('gs1-foot').innerHTML = '<button onclick="window.__gs1.retry()" style="flex:1;background:#0a3e44;color:#fff;border:none;border-radius:13px;padding:14px;font-weight:800;font-family:inherit;cursor:pointer;">Try again</button>';
    }
  }

  function showOutcome(o) {
    lastOutcome = o;
    document.getElementById('gs1-body').innerHTML = cur.outcome(o);
    document.getElementById('gs1-foot').innerHTML =
      '<button onclick="window.__gs1.sharpen()" style="flex:0 0 auto;background:#fff;color:#0a3e44;border:1.5px solid #dbe4e5;border-radius:13px;padding:14px 16px;font-size:14px;font-weight:800;font-family:inherit;cursor:pointer;">Sharpen</button>'
      + '<button onclick="window.__gs1.nail()" style="flex:1;background:linear-gradient(135deg,#0a3e44,#2ba8e0);color:#fff;border:none;border-radius:13px;padding:14px;font-size:15px;font-weight:800;font-family:inherit;cursor:pointer;box-shadow:0 8px 18px rgba(43,168,224,.28);">Nail it ✓</button>';
  }

  function sharpen() {
    var line = (lastOutcome && (lastOutcome.audience_line || lastOutcome.one_liner || lastOutcome.profile)) || '';
    if (window.ffpCoachAsk) { close(); window.ffpCoachAsk('Help me sharpen this until it is razor-sharp: "' + line + '". Ask me questions and push me to be more specific.'); }
    else { idx = 0; render(); }
  }
  async function nail() {
    var p = pid(); if (!p) { close(); return; }
    try { await window.supabase.rpc('pro_grow_step_complete', { p_pro: p, p_code: cur.code, p_outcome: lastOutcome }); toast('Step complete 🎉', 'success'); } catch (e) { toast('Saved', 'success'); }
    close();
    try { if (typeof renderGrow === 'function') renderGrow(); } catch (e) {}
  }

  window.growFlowOpen = open;
  window.growStep1Open = function () { open('strengths'); };
  window.__gs1 = { close: close, voice: voice, next: next, back: back, nail: nail, sharpen: sharpen, retry: finish };
})();
