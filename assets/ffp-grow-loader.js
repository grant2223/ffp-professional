// ════════════════════════════════════════════════════════════════════════
// FFP Professional — GROW · "Grow your business". Three tabs:
//   ROAD MAP  — the 8-step journey (Foundation → Setting up the basics →
//               Operational) + upskill bonus. Opens with an EXPLANATION, then a
//               ring tracker (yellow = the step you're on, teal = done). One step
//               at a time; each opens its own in-depth flow. Step 1 (strengths)
//               is the guided flow in ffp-grow-step1.js.
//   OVERVIEW  — the honest live pulse (real numbers → your #1 blocker + today).
//   TASKS     — daily / weekly actions.
// renderPanel('grow') → renderGrow().
// RPCs: pro_grow_pulse / pro_grow_state / pro_grow_toggle / pro_grow_step_get
// ════════════════════════════════════════════════════════════════════════

var _growTab = 'road';
var _growState = null;
var _growPulse = null;
var _stepDone = {};
var _growStepIdx = null;
var _growRoadView = null; // null = auto, 'intro', 'ring'

var GROW_STEPS = [
  { code:'strengths',    phase:'Foundation',              plain:'Understand your strengths & weaknesses', flow:'strengths' },
  { code:'ideal_client', phase:'Setting up the basics',   plain:'Understand your ideal client', flow:'ideal_client' },
  { code:'offer',        phase:'Setting up the basics',   plain:'Create your initial offer' },
  { code:'delivery_plan',phase:'Setting up the basics',   plain:"How you'll deliver it" },
  { code:'operations',   phase:'Operational',             plain:'Set up daily operations' },
  { code:'funnel',       phase:'Operational',             plain:'Build your sales funnel' },
  { code:'sessions',     phase:'Operational',             plain:'Deliver world-class sessions' },
  { code:'retention',    phase:'Operational',             plain:'Look after your clients' }
];
var GROW_BONUS = { plain:'Keep yourself current & upskill' };
function _growPhaseNum(name){ return name === 'Foundation' ? 1 : (name === 'Setting up the basics' ? 2 : 3); }

function _growProvId(){ return (window.FFP_PROVIDER || {}).id || null; }
function _growEsc(s){ return (typeof escHtml === 'function') ? escHtml(s == null ? '' : String(s)) : String(s == null ? '' : s); }
function _growToast(m, t){ if (typeof showToast === 'function') showToast(m, t); }

function _growTabs(){
  var t = function (id, label){ var on = (_growTab === id);
    return '<button type="button" onclick="growTab(\''+id+'\')" style="padding:11px 0;margin-right:26px;border:none;background:none;font-size:13.5px;font-weight:'+(on?'800':'700')+';color:'+(on?'var(--ffp-purple)':'var(--ffp-text-dim)')+';border-bottom:3px solid '+(on?'var(--ffp-purple)':'transparent')+';margin-bottom:-1px;font-family:inherit;cursor:pointer;">'+label+'</button>'; };
  return '<div style="display:flex;border-bottom:1px solid var(--ffp-border-mid);margin-bottom:18px;">' + t('road','Road map') + t('now','Overview') + t('habits','Tasks') + '</div>';
}

// ── ROAD MAP ──
function _growDoneCount(){ var c = 0; for (var i = 0; i < GROW_STEPS.length; i++){ if (_stepDone[GROW_STEPS[i].code]) c++; } return c; }
function _growActiveIdx(){ for (var i = 0; i < GROW_STEPS.length; i++){ if (!_stepDone[GROW_STEPS[i].code]) return i; } return -1; }
function _growRingSegments(activeIdx){
  var N = GROW_STEPS.length, cx = 115, cy = 115, r = 96, gap = 7, seg = 360 / N, out = '';
  for (var i = 0; i < N; i++){
    var a0 = (-90 + i * seg + gap / 2) * Math.PI / 180;
    var a1 = (-90 + (i + 1) * seg - gap / 2) * Math.PI / 180;
    var x0 = (cx + r * Math.cos(a0)).toFixed(1), y0 = (cy + r * Math.sin(a0)).toFixed(1);
    var x1 = (cx + r * Math.cos(a1)).toFixed(1), y1 = (cy + r * Math.sin(a1)).toFixed(1);
    var d = 'M ' + x0 + ' ' + y0 + ' A ' + r + ' ' + r + ' 0 0 1 ' + x1 + ' ' + y1;
    var done = !!_stepDone[GROW_STEPS[i].code];
    if (i === activeIdx){
      out += '<path d="' + d + '" fill="none" stroke="#FFCC00" stroke-width="14" stroke-linecap="round" filter="url(#growGlow)"/>';
      out += '<path d="' + d + '" fill="none" stroke="#FFCC00" stroke-width="14" stroke-linecap="round"/>';
    } else {
      out += '<path d="' + d + '" fill="none" stroke="' + (done ? '#0a3e44' : '#edf1f2') + '" stroke-width="14" stroke-linecap="round"/>';
    }
  }
  return out;
}
function _growRoadIntro(){
  var stepRow = function (n, txt){
    return '<div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;">'
      + '<div style="width:38px;height:38px;flex:0 0 auto;border-radius:11px;background:#fff6d6;color:#a67c00;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;">'+n+'</div>'
      + '<div style="font-size:14.5px;font-weight:600;color:var(--ffp-text);line-height:1.35;">'+txt+'</div></div>';
  };
  return '<div style="position:relative;background:var(--ffp-bg-card);border:1px solid var(--ffp-border);border-radius:16px;padding:26px 20px 24px;max-width:420px;margin:0 auto;box-shadow:0 10px 30px rgba(10,62,68,.08);">'
    + '<div style="font-size:11px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:var(--ffp-text-dim);margin-bottom:6px;">Your road map</div>'
    + '<div style="font-size:26px;font-weight:800;letter-spacing:-.6px;color:var(--ffp-text);line-height:1.1;">Let\'s build your business, properly</div>'
    + '<div style="font-size:14px;color:var(--ffp-text-muted);line-height:1.55;margin-top:10px;">8 steps that set up a strong coaching business — your foundation first, then the basics, then running it day to day. We do them with you, one at a time.</div>'
    + '<div style="height:1px;background:var(--ffp-bg-3);margin:20px 0;"></div>'
    + '<div style="font-size:11px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:var(--ffp-text-dim);margin-bottom:14px;">How it works</div>'
    + stepRow(1, 'Answer a few questions — type or talk.')
    + stepRow(2, 'We shape your answers into your plan.')
    + '<div style="margin-bottom:22px;">' + stepRow(3, 'Lock it in and move to the next.').replace('margin-bottom:16px;', 'margin-bottom:0;') + '</div>'
    + '<button type="button" onclick="growRoadBegin()" style="width:100%;background:var(--ffp-purple);color:#fff;border:none;border-radius:11px;padding:15px;font-size:14px;font-weight:700;letter-spacing:1px;text-transform:uppercase;font-family:inherit;cursor:pointer;box-shadow:0 8px 20px rgba(10,62,68,.22);">Begin</button></div>';
}
function _growRoadRing(){
  var N = GROW_STEPS.length;
  var active = _growActiveIdx();
  if (_growStepIdx == null) _growStepIdx = (active < 0 ? 0 : active);
  var vi = _growStepIdx;
  var f = GROW_STEPS[vi];
  var done = !!_stepDone[f.code];
  var isActive = (vi === active);
  var built = !!f.flow;
  var num = vi + 1;

  var ring = '<div style="position:relative;display:flex;justify-content:center;margin:2px 0 8px;">'
    + '<svg viewBox="0 0 230 230" style="width:224px;height:224px;" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Step '+num+' of '+N+'">'
    + '<defs><filter id="growGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4.5"/></filter></defs>'
    + _growRingSegments(active)
    + '<text x="115" y="90" text-anchor="middle" font-size="11" font-weight="800" letter-spacing="2.5" fill="#869599" font-family="Montserrat,system-ui">STEP</text>'
    + '<text x="115" y="135" text-anchor="middle" font-size="60" font-weight="800" fill="#0a3e44" font-family="Montserrat,system-ui">'+num+'</text>'
    + '<text x="115" y="157" text-anchor="middle" font-size="11" font-weight="700" letter-spacing="2" fill="#a3afb2" font-family="Montserrat,system-ui">OF '+N+'</text></svg>'
    + '<button type="button" onclick="growStepNav(-1)" '+(vi===0?'disabled':'')+' style="position:absolute;left:0;top:50%;transform:translateY(-50%);background:none;border:none;cursor:'+(vi===0?'default':'pointer')+';color:'+(vi===0?'#dbe4e5':'#0a3e44')+';padding:6px;font-family:inherit;"><span class="ms" style="font-size:26px;">chevron_left</span></button>'
    + '<button type="button" onclick="growStepNav(1)" '+(vi===N-1?'disabled':'')+' style="position:absolute;right:0;top:50%;transform:translateY(-50%);background:none;border:none;cursor:'+(vi===N-1?'default':'pointer')+';color:'+(vi===N-1?'#dbe4e5':'#0a3e44')+';padding:6px;font-family:inherit;"><span class="ms" style="font-size:26px;">chevron_right</span></button>'
    + '</div>';

  var overline = 'Phase ' + _growPhaseNum(f.phase) + ' · ' + f.phase;
  var label = done ? 'Review' : (built ? 'Start' : 'Coming soon');
  var muted = (!built && !done);
  var bstyle = muted
    ? 'background:#eef3f4;color:#a3afb2;box-shadow:none;cursor:default;'
    : 'background:var(--ffp-purple);color:#fff;box-shadow:0 8px 20px rgba(10,62,68,.22);cursor:pointer;';
  var btn = '<button type="button"'+(muted?'':' onclick="growStepStart()"')+' style="position:relative;width:100%;'+bstyle+'border:none;border-radius:11px;padding:15px;font-size:14px;font-weight:700;letter-spacing:1px;text-transform:uppercase;font-family:inherit;">'+label+'</button>';

  var nextHtml = '';
  if (vi < N - 1){
    var nx = GROW_STEPS[vi + 1];
    nextHtml = '<div style="position:relative;display:flex;align-items:center;justify-content:center;gap:6px;margin-top:16px;color:#a3afb2;font-size:11px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;"><span class="ms" style="font-size:14px;">arrow_forward</span> Next · '+_growEsc(nx.plain)+'</div>';
  }

  var card = '<div style="position:relative;background:var(--ffp-bg-card);border:1px solid var(--ffp-border);border-radius:16px;padding:28px 18px 28px;max-width:420px;margin:0 auto;box-shadow:0 10px 30px rgba(10,62,68,.08);overflow:hidden;">'
    + '<div style="position:absolute;top:-70px;left:50%;transform:translateX(-50%);width:250px;height:210px;background:radial-gradient(circle, rgba(255,204,0,.16), transparent 65%);pointer-events:none;"></div>'
    + ring
    + '<div style="position:relative;text-align:center;font-size:10.5px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:#c8a038;margin-bottom:6px;">'+_growEsc(overline)+'</div>'
    + '<div style="position:relative;text-align:center;font-size:23px;font-weight:700;letter-spacing:-.3px;color:var(--ffp-text);line-height:1.15;margin:0 8px 22px;">'+_growEsc(f.plain)+'</div>'
    + btn + nextHtml + '</div>';

  var bonus = '<div onclick="growUpskill()" style="max-width:420px;margin:12px auto 0;background:var(--ffp-bg-card);border:1px solid var(--ffp-border);border-radius:14px;padding:13px 15px;display:flex;align-items:center;gap:11px;cursor:pointer;">'
    + '<span class="ms" style="color:#c8a038;">workspace_premium</span>'
    + '<div style="flex:1;min-width:0;"><div style="font-size:9.5px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;color:var(--ffp-text-dim);">Bonus · ongoing</div>'
    + '<div style="font-size:13.5px;font-weight:700;color:var(--ffp-text);">'+_growEsc(GROW_BONUS.plain)+'</div></div>'
    + '<span class="ms" style="color:var(--ffp-text-dim);">chevron_right</span></div>';

  var howLink = '<div style="text-align:center;margin-top:14px;"><button type="button" onclick="growRoadIntro()" style="background:none;border:none;color:var(--ffp-blue);font-size:12px;font-weight:700;font-family:inherit;cursor:pointer;">How this works</button></div>';

  return card + bonus + howLink;
}
function _growRoadmapTab(){
  var view = _growRoadView || (_growDoneCount() === 0 ? 'intro' : 'ring');
  return view === 'intro' ? _growRoadIntro() : _growRoadRing();
}
function growRoadBegin(){ _growRoadView = 'ring'; _growPaint(); }
function growRoadIntro(){ _growRoadView = 'intro'; _growPaint(); }
function growStepNav(d){
  var n = GROW_STEPS.length;
  var vi = (_growStepIdx == null ? 0 : _growStepIdx) + d;
  if (vi < 0) vi = 0; if (vi > n - 1) vi = n - 1;
  _growStepIdx = vi; _growPaint();
}
function growStepStart(){
  var active = _growActiveIdx();
  var vi = (_growStepIdx == null ? (active < 0 ? 0 : active) : _growStepIdx);
  var f = GROW_STEPS[vi]; if (!f) return;
  if (f.flow){ if (window.growFlowOpen) growFlowOpen(f.flow); else _growToast('Loading…', 'error'); return; }
  _growToast('This step is coming soon — we\'re building it next', 'info');
}
function growUpskill(){
  if (window.ffpCoachAsk) window.ffpCoachAsk('Coach me on staying current and upskilling as a coach — what should I be learning or improving right now, and how do I keep my edge?');
  else _growToast('Coach is loading — try again', 'error');
}

// ── OVERVIEW: the live pulse (real numbers → your #1 blocker + today) ──
function _pulseDot(status){
  var c = status === 'strong' ? '#1d7a4d' : (status === 'watch' ? '#c8871a' : '#d64545');
  return '<span style="width:11px;height:11px;border-radius:50%;flex:0 0 auto;background:'+c+';box-shadow:0 0 8px '+c+'88;"></span>';
}
function _growNowTab(){
  var p = _growPulse || {};
  var blocker = p.blocker || 'Reading your business…';
  var today = p.today || '';
  var reads = p.reads || [];
  var hero = '<div style="position:relative;background:linear-gradient(135deg,#0a3e44 0%,#0e5a63 60%,#127d78 100%);border-radius:20px;padding:19px 18px;color:#fff;margin-bottom:8px;overflow:hidden;box-shadow:0 12px 30px rgba(10,62,68,.28);">'
    + '<div style="position:absolute;inset:0;background-image:radial-gradient(circle at 1px 1px, rgba(255,255,255,.10) 1px, transparent 0);background-size:16px 16px;opacity:.6;"></div>'
    + '<div style="position:relative;"><div style="font-size:10px;font-weight:800;letter-spacing:1.6px;color:#8fe0d0;">YOUR BUSINESS · RIGHT NOW</div>'
    + '<div style="font-size:17px;font-weight:800;line-height:1.35;margin:8px 0 12px;">'+_growEsc(blocker)+'</div>'
    + '<div style="display:flex;align-items:center;gap:8px;font-size:12.5px;color:#cfe6e0;font-weight:600;line-height:1.4;"><span class="ms" style="font-size:17px;color:#FFCC00;flex:0 0 auto;">bolt</span><span>'+_growEsc(today)+'</span></div></div></div>';
  var rows = reads.map(function (r){
    return '<div onclick="growTalkArea(\''+_growEsc(r.area)+'\')" style="display:flex;align-items:center;gap:12px;padding:13px 4px;border-bottom:1px solid var(--ffp-border);cursor:pointer;">'
      + _pulseDot(r.status)
      + '<div style="flex:1;min-width:0;font-size:14px;font-weight:800;color:var(--ffp-text);">'+_growEsc(r.area)+'</div>'
      + '<div style="font-size:12px;font-weight:700;color:var(--ffp-text-muted);white-space:nowrap;">'+_growEsc(r.metric)+'</div>'
      + '<span class="ms" style="color:var(--ffp-text-dim);flex:0 0 auto;">chevron_right</span></div>';
  }).join('');
  var coach = '<button type="button" style="width:100%;margin-top:18px;background:linear-gradient(135deg,#0a3e44,#2ba8e0);color:#fff;border:none;border-radius:13px;padding:14px;font-size:14.5px;font-weight:800;font-family:inherit;cursor:pointer;box-shadow:0 8px 18px rgba(43,168,224,.30);display:flex;align-items:center;justify-content:center;gap:8px;" onclick="growTalkPulse()"><span class="ms">sports</span> Work through it with your Coach</button>';
  return hero + rows + coach;
}
function growTalkPulse(){
  var p = _growPulse || {};
  var seed = 'Give me a straight diagnostic of my coaching business and hold me accountable. Right now: ' + (p.clients||0) + ' clients, ' + (p.new_30d||0) + ' new in 30 days, AED ' + (p.revenue_30d||0) + ' collected and AED ' + (p.pending||0) + ' unpaid, ' + (p.posts_7d||0) + ' of my own training posts this week. My biggest blocker looks like: ' + (p.blocker||'') + ' Ask me sharp questions, tell me the truth, and give me my single next move.';
  if (window.ffpCoachAsk) window.ffpCoachAsk(seed);
  else _growToast('Coach is loading — try again', 'error');
}
function growTalkArea(area){
  if (window.ffpCoachAsk) window.ffpCoachAsk('Coach me on ' + area + ' for my business — where am I falling short, and what is my single next move? Be direct with me.');
  else _growToast('Coach is loading — try again', 'error');
}

// ── TASKS: daily / weekly actions ──
function _growStat(n, label, accent){
  return '<div style="flex:1;background:var(--ffp-bg-card);border:1px solid var(--ffp-border-mid);border-radius:14px;padding:14px 8px;text-align:center;">'
    + '<div style="font-size:24px;font-weight:900;color:'+(accent||'var(--ffp-text)')+';line-height:1;">'+n+'</div>'
    + '<div class="psub" style="margin:5px 0 0;text-transform:uppercase;font-size:9.5px;font-weight:800;letter-spacing:.6px;">'+label+'</div></div>';
}
function _growRow(h){
  var done = !!h.done;
  var bd = done ? 'var(--ffp-purple)' : 'var(--ffp-border-mid)';
  return '<button type="button" onclick="growToggle(\''+h.code+'\',this)" data-code="'+h.code+'" class="grow-row" '
    + 'style="width:100%;display:flex;align-items:center;gap:12px;text-align:left;background:var(--ffp-bg-card);border:1px solid '+bd+';border-radius:12px;padding:12px 14px;margin-bottom:8px;cursor:pointer;font-family:inherit;">'
    + '<span style="width:24px;height:24px;border-radius:50%;flex:0 0 auto;display:flex;align-items:center;justify-content:center;border:2px solid '+bd+';background:'+(done?'var(--ffp-purple)':'transparent')+';color:#fff;">'+(done?'<span class="ms" style="font-size:16px;">check</span>':'')+'</span>'
    + '<span style="flex:1;min-width:0;font-weight:800;font-size:14px;color:var(--ffp-text);'+(done?'opacity:.5;':'')+'">'+_growEsc(h.title)+'</span>'
    + '<span style="flex:0 0 auto;font-size:11px;font-weight:800;color:var(--ffp-text-dim);">+'+(h.points||0)+'</span></button>';
}
function _growHabitsTab(){
  var st = _growState || {}; var habits = st.habits || [];
  var daily = habits.filter(function (h){ return h.frequency === 'daily'; });
  var weekly = habits.filter(function (h){ return h.frequency === 'weekly'; });
  var streak = st.streak || 0, wd = st.week_done || 0, wp = st.week_points || 0;
  var head = '<div style="display:flex;gap:10px;margin-bottom:16px;">' + _growStat((streak>0?'🔥 ':'')+streak, 'Day streak', 'var(--ffp-purple)') + _growStat(wd, 'This week') + _growStat(wp, 'Points') + '</div>';
  return head
    + (daily.length ? ('<div class="form-section-title">Do today</div>' + daily.map(_growRow).join('')) : '')
    + (weekly.length ? ('<div class="form-section-title" style="margin-top:16px;">This week</div>' + weekly.map(_growRow).join('')) : '');
}

function _growPaint(){
  var host = document.getElementById('grow-body'); if (!host) return;
  var content = _growTab === 'now' ? _growNowTab() : (_growTab === 'habits' ? _growHabitsTab() : _growRoadmapTab());
  host.innerHTML = _growTabs() + content;
}
function growTab(t){ _growTab = t; _growPaint(); }

async function renderGrow(){
  var host = document.getElementById('grow-body'); if (!host) return;
  var pid = _growProvId();
  if (!pid){ host.innerHTML = '<div class="psub" style="padding:12px 0;">Sign in to see Grow.</div>'; return; }
  host.innerHTML = '<div class="ov-empty" style="padding:16px;">Reading your business…</div>';
  var st = {}, pulse = {};
  try { var rp = await window.supabase.rpc('pro_grow_pulse', { p_pro: pid }); pulse = (rp && rp.data) || {}; } catch (e) { console.error('[FFP Grow] pulse', e); }
  try { var r = await window.supabase.rpc('pro_grow_state', { p_pro: pid }); st = (r && r.data) || {}; } catch (e) { console.error('[FFP Grow] state', e); }
  _growPulse = pulse; _growState = st;
  _stepDone = {};
  for (var gi = 0; gi < GROW_STEPS.length; gi++){
    var gs = GROW_STEPS[gi]; if (!gs.flow) continue;
    try { var rsg = await window.supabase.rpc('pro_grow_step_get', { p_pro: pid, p_code: gs.code }); var sd = rsg && rsg.data; if (sd && sd.status === 'done') _stepDone[gs.code] = true; } catch (e) {}
  }
  _growStepIdx = null; _growRoadView = null;
  _growPaint();
}

async function growToggle(code, el){
  var pid = _growProvId(); if (!pid) return;
  if (el) el.style.opacity = '0.55';
  try {
    var r = await window.supabase.rpc('pro_grow_toggle', { p_pro: pid, p_code: code });
    if (r && r.error) throw r.error;
    var d = r && r.data; if (d && d.ok === false) throw new Error(d.error || 'toggle_failed');
    renderGrow();
  } catch (e) { console.error('[FFP Grow] toggle', e); _growToast('Could not update — try again', 'error'); if (el) el.style.opacity = '1'; }
}

// ── Live refresh: re-read the pulse while Overview is open + visible (silent, no loading flash) ──
async function _growRefreshPulse(){
  var pid = _growProvId(); if (!pid) return;
  try { var rp = await window.supabase.rpc('pro_grow_pulse', { p_pro: pid }); if (rp && rp.data) { _growPulse = rp.data; if (_growTab === 'now' && document.getElementById('grow-body')) _growPaint(); } } catch (e) {}
}
function _growPanelOpen(){ var p = document.getElementById('panel-grow'); return !!(p && p.classList.contains('active')); }
if (!window._growPulseTimer){
  window._growPulseTimer = setInterval(function(){ if (_growPanelOpen() && document.visibilityState === 'visible') _growRefreshPulse(); }, 120000);
  document.addEventListener('visibilitychange', function(){ if (document.visibilityState === 'visible' && _growPanelOpen()) _growRefreshPulse(); });
}

// First open (renderPanel('grow') also calls this once the script loads).
try { if (document.getElementById('grow-body')) renderGrow(); } catch (e) {}
