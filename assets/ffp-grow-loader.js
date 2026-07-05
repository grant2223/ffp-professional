// ════════════════════════════════════════════════════════════════════════
// FFP Professional — GROW · "Grow your business".
// LANDS on FOUNDATIONS: a world-class ring (11 segments = the 11 foundations),
// one step at a time, swipe through, Start opens that step's guided flow.
// Then two working tabs sit behind it — OVERVIEW (the honest live pulse: real
// numbers → your #1 blocker + today) and TASKS (daily/weekly actions).
// renderPanel('grow') → renderGrow().
// RPCs: pro_grow_pulse / pro_grow_state / pro_grow_toggle /
//       pro_grow_foundations_state / pro_grow_foundation_set / pro_grow_step_get
// ════════════════════════════════════════════════════════════════════════

var _growTab = 'foundations';
var _growState = null;
var _growPulse = null;
var _foundAns = {};
var _growFoundIdx = null;

var FFP_FOUNDATIONS = [
  { code:'niche', title:'Your niche', plain:"Who you're best at helping", label:'Who I help', q:'Who do you help — and with what?', ph:'e.g. I help busy dads over 40 get lean and strong in 3 sessions a week', seed:'Help me nail my niche in one sharp line — my ideal client and the problem I solve. Ask me questions until it is crystal clear.' },
  { code:'offer', title:'Your offer', plain:'What you sell', label:'My offer', q:'What is your signature offer?', ph:'e.g. A 12-week "Strong Dad" transformation — training + nutrition', seed:'Help me turn what I do into one clear signature offer with an outcome, not one-off sessions.' },
  { code:'pricing', title:'Pricing', plain:'What you charge', label:'My price', q:'What do you charge — and can you own it?', ph:'e.g. AED 2,400 for the 12-week programme', seed:'Help me set my pricing and be able to quote it with confidence.' },
  { code:'profile', title:'Your profile', plain:'Your FFP profile', label:'My storefront', q:'In a line, why is your FFP profile worth booking?', ph:'e.g. Proven dad-transformation coach, 50+ success stories, Dubai', seed:'Help me sharpen my FFP profile so a stranger instantly gets why they should book me.' },
  { code:'payments', title:'Payments', plain:'How clients pay you', label:'How I get paid', q:'How does a client pay you — today?', ph:'e.g. Stripe online, the 12-week package upfront', seed:'Help me get set up so clients can pay me easily — Stripe, packages, invoices.' },
  { code:'onboarding', title:'Onboarding', plain:'Starting a new client', label:'My onboarding', q:'What happens the moment someone says yes?', ph:'e.g. Welcome message, intake form, goal call, first session booked', seed:'Help me build a simple, repeatable onboarding for the moment a client says yes.' },
  { code:'delivery', title:'Delivery', plain:'How you get results', label:'How I deliver', q:'How do you deliver results between sessions?', ph:'e.g. App programme, weekly check-in, WhatsApp support', seed:'Help me set up a consistent way to deliver and check in between sessions.' },
  { code:'lead_gen', title:'Lead generation', plain:'Where clients come from', label:'Where clients come from', q:'Where will your next 5 clients come from?', ph:'e.g. Referrals + 3 reels a week + a gym partnership', seed:'Help me build a reliable way to get my next clients — referrals, social, network or paid.' },
  { code:'retention', title:'Retention', plain:'Keeping clients longer', label:'How I keep clients', q:'Why do clients stay with you past 12 weeks?', ph:'e.g. A new goal, progress reviews, and a community', seed:'Help me keep clients progressing and re-signing past their first block.' },
  { code:'social_proof', title:'Social proof', plain:'Proof you get results', label:'My proof', q:'What proof shows you get results?', ph:'e.g. 20 before/afters and 15 five-star reviews', seed:'Help me start collecting and using proof — reviews, testimonials, client wins.' },
  { code:'lead_by_example', title:'Lead by example', plain:'Lead by example', label:'How I lead', q:'How are you living it — and posting it on your Passport?', ph:'e.g. I train 5x a week and post every session on my Passport', seed:'Coach me on leading by example — living my discipline and posting my own training on the Passport to build my brand over the next two years.', cornerstone:true }
];

function _growProvId(){ return (window.FFP_PROVIDER || {}).id || null; }
function _growEsc(s){ return (typeof escHtml === 'function') ? escHtml(s == null ? '' : String(s)) : String(s == null ? '' : s); }
function _growToast(m, t){ if (typeof showToast === 'function') showToast(m, t); }

function _growTabs(){
  var t = function (id, label){ var on = (_growTab === id);
    return '<button type="button" onclick="growTab(\''+id+'\')" style="padding:11px 0;margin-right:26px;border:none;background:none;font-size:13.5px;font-weight:'+(on?'800':'700')+';color:'+(on?'var(--ffp-purple)':'var(--ffp-text-dim)')+';border-bottom:3px solid '+(on?'var(--ffp-purple)':'transparent')+';margin-bottom:-1px;font-family:inherit;cursor:pointer;">'+label+'</button>'; };
  return '<div style="display:flex;border-bottom:1px solid var(--ffp-border-mid);margin-bottom:18px;">' + t('foundations','Foundations') + t('now','Overview') + t('habits','Tasks') + '</div>';
}

// ── FOUNDATIONS: the ring home (one step at a time) ──
function _growActiveIdx(){
  for (var i = 0; i < FFP_FOUNDATIONS.length; i++){ if (!_foundAns[FFP_FOUNDATIONS[i].code]) return i; }
  return -1; // all done
}
function _growRingSegments(activeIdx){
  var N = FFP_FOUNDATIONS.length, cx = 110, cy = 110, r = 92, gap = 8, seg = 360 / N, out = '';
  for (var i = 0; i < N; i++){
    var a0 = (-90 + i * seg + gap / 2) * Math.PI / 180;
    var a1 = (-90 + (i + 1) * seg - gap / 2) * Math.PI / 180;
    var x0 = (cx + r * Math.cos(a0)).toFixed(1), y0 = (cy + r * Math.sin(a0)).toFixed(1);
    var x1 = (cx + r * Math.cos(a1)).toFixed(1), y1 = (cy + r * Math.sin(a1)).toFixed(1);
    var d = 'M ' + x0 + ' ' + y0 + ' A ' + r + ' ' + r + ' 0 0 1 ' + x1 + ' ' + y1;
    var done = !!_foundAns[FFP_FOUNDATIONS[i].code];
    if (i === activeIdx){
      out += '<path d="' + d + '" fill="none" stroke="url(#growRing)" stroke-width="13" stroke-linecap="round" filter="url(#growGlow)" opacity="0.4"/>';
      out += '<path d="' + d + '" fill="none" stroke="url(#growRing)" stroke-width="13" stroke-linecap="round"/>';
    } else {
      out += '<path d="' + d + '" fill="none" stroke="' + (done ? '#2ba8e0' : '#e9eff1') + '" stroke-width="13" stroke-linecap="round"/>';
    }
  }
  return out;
}
function _growFoundationsHome(){
  var N = FFP_FOUNDATIONS.length;
  var active = _growActiveIdx();
  if (_growFoundIdx == null) _growFoundIdx = (active < 0 ? 0 : active);
  var vi = _growFoundIdx;
  var f = FFP_FOUNDATIONS[vi];
  var done = !!_foundAns[f.code];
  var isActive = (vi === active);
  var locked = (active >= 0 && vi > active && !done);
  var num = vi + 1;

  var ring = '<div style="position:relative;display:flex;justify-content:center;margin:6px 0 2px;">'
    + '<svg viewBox="0 0 220 220" style="width:206px;height:206px;" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Step '+num+' of '+N+'">'
    + '<defs><linearGradient id="growRing" x1="0" y1="0" x2="1" y2="0.5"><stop offset="0%" stop-color="#0a3e44"/><stop offset="50%" stop-color="#2ba8e0"/><stop offset="100%" stop-color="#FFCC00"/></linearGradient>'
    + '<filter id="growGlow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="3.5"/></filter></defs>'
    + _growRingSegments(active)
    + '<text x="110" y="86" text-anchor="middle" font-size="11" font-weight="800" letter-spacing="2.5" fill="#869599" font-family="Montserrat,system-ui">STEP</text>'
    + '<text x="110" y="129" text-anchor="middle" font-size="56" font-weight="800" fill="#0a3e44" font-family="Montserrat,system-ui">'+num+'</text>'
    + '<text x="110" y="150" text-anchor="middle" font-size="11" font-weight="700" letter-spacing="2" fill="#a3afb2" font-family="Montserrat,system-ui">OF '+N+'</text></svg>'
    + '<button type="button" onclick="growFoundNav(-1)" '+(vi===0?'disabled':'')+' style="position:absolute;left:0;top:50%;transform:translateY(-50%);background:none;border:none;cursor:'+(vi===0?'default':'pointer')+';color:'+(vi===0?'#dbe4e5':'#0a3e44')+';padding:6px;font-family:inherit;"><span class="ms" style="font-size:26px;">chevron_left</span></button>'
    + '<button type="button" onclick="growFoundNav(1)" '+(vi===N-1?'disabled':'')+' style="position:absolute;right:0;top:50%;transform:translateY(-50%);background:none;border:none;cursor:'+(vi===N-1?'default':'pointer')+';color:'+(vi===N-1?'#dbe4e5':'#0a3e44')+';padding:6px;font-family:inherit;"><span class="ms" style="font-size:26px;">chevron_right</span></button>'
    + '</div>';

  var label = done ? 'Review' : (locked ? 'Locked' : 'Start');
  var bstyle = locked
    ? 'background:#eef3f4;color:#a3afb2;box-shadow:none;cursor:default;'
    : 'background:#0a3e44;color:#fff;box-shadow:0 8px 20px rgba(10,62,68,.22);cursor:pointer;';
  var btn = '<button type="button"'+(locked?'':' onclick="growFoundStart()"')+' style="position:relative;width:100%;'+bstyle+'border:none;border-radius:10px;padding:14px;font-size:14px;font-weight:700;letter-spacing:1px;text-transform:uppercase;font-family:inherit;">'+label+'</button>';

  var nextHtml = '';
  if (vi < N - 1){
    var nx = FFP_FOUNDATIONS[vi + 1];
    var nxLocked = (active >= 0 && (vi + 1) > active && !_foundAns[nx.code]);
    nextHtml = '<div style="position:relative;display:flex;align-items:center;justify-content:center;gap:6px;margin-top:14px;color:#a3afb2;font-size:11px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;">'
      + (nxLocked ? '<span class="ms" style="font-size:14px;">lock</span>' : '<span class="ms" style="font-size:14px;">arrow_forward</span>')
      + ' Next · ' + _growEsc(nx.plain || nx.title) + '</div>';
  }

  return '<div style="position:relative;background:var(--ffp-bg-card);border:1px solid var(--ffp-border);border-radius:16px;padding:20px 18px 22px;max-width:420px;margin:0 auto;box-shadow:0 10px 30px rgba(10,62,68,.08);overflow:hidden;">'
    + '<div style="position:absolute;top:-70px;left:50%;transform:translateX(-50%);width:240px;height:200px;background:radial-gradient(circle, rgba(43,168,224,.12), transparent 65%);pointer-events:none;"></div>'
    + ring
    + '<div style="position:relative;text-align:center;font-size:22px;font-weight:700;letter-spacing:-.3px;color:var(--ffp-text);line-height:1.15;margin:6px 8px 18px;">'+_growEsc(f.plain || f.title)+'</div>'
    + btn + nextHtml + '</div>';
}
function growFoundNav(d){
  var n = FFP_FOUNDATIONS.length;
  var vi = (_growFoundIdx == null ? 0 : _growFoundIdx) + d;
  if (vi < 0) vi = 0; if (vi > n - 1) vi = n - 1;
  _growFoundIdx = vi; _growPaint();
}
function growFoundStart(){
  var active = _growActiveIdx();
  var vi = (_growFoundIdx == null ? (active < 0 ? 0 : active) : _growFoundIdx);
  var f = FFP_FOUNDATIONS[vi]; if (!f) return;
  var done = !!_foundAns[f.code];
  if (!done && active >= 0 && vi > active){ _growToast('Finish the earlier steps first', 'error'); return; }
  if (f.code === 'niche'){ if (window.growStep1Open) growStep1Open(); else _growToast('Loading…', 'error'); }
  else growAnswer(f.code);
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
  var seed = 'Give me a straight diagnostic of my coaching business and hold me accountable. Right now: ' + (p.clients||0) + ' clients, ' + (p.new_30d||0) + ' new in 30 days, AED ' + (p.revenue_30d||0) + ' collected and AED ' + (p.pending||0) + ' unpaid, ' + (p.posts_7d||0) + ' of my own training posts this week, ' + (p.foundations||0) + ' of 11 business basics nailed. My biggest blocker looks like: ' + (p.blocker||'') + ' Ask me sharp questions, tell me the truth, and give me my single next move.';
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
  var content = _growTab === 'now' ? _growNowTab() : (_growTab === 'habits' ? _growHabitsTab() : _growFoundationsHome());
  host.innerHTML = _growTabs() + content;
}
function growTab(t){ _growTab = t; _growPaint(); }

async function renderGrow(){
  var host = document.getElementById('grow-body'); if (!host) return;
  var pid = _growProvId();
  if (!pid){ host.innerHTML = '<div class="psub" style="padding:12px 0;">Sign in to see Grow.</div>'; return; }
  host.innerHTML = '<div class="ov-empty" style="padding:16px;">Reading your business…</div>';
  var st = {}, founds = [], pulse = {};
  try { var rp = await window.supabase.rpc('pro_grow_pulse', { p_pro: pid }); pulse = (rp && rp.data) || {}; } catch (e) { console.error('[FFP Grow] pulse', e); }
  try { var r = await window.supabase.rpc('pro_grow_state', { p_pro: pid }); st = (r && r.data) || {}; } catch (e) { console.error('[FFP Grow] state', e); }
  try { var rf = await window.supabase.rpc('pro_grow_foundations_state', { p_pro: pid }); founds = (rf && rf.data) || []; } catch (e) { console.error('[FFP Grow] foundations', e); }
  _growPulse = pulse; _growState = st;
  _foundAns = {};
  (founds || []).forEach(function (x){ if (x.answer) _foundAns[x.foundation_code] = x.answer; });
  try { var rs = await window.supabase.rpc('pro_grow_step_get', { p_pro: pid, p_code: 'strengths' }); var sd = rs && rs.data; if (sd && sd.status === 'done') _foundAns['niche'] = (sd.outcome && sd.outcome.audience_line) || 'Done'; } catch (e) {}
  _growFoundIdx = null;
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

// ── Articulate a foundation (modal) — used by foundations 2–11 and to review a saved answer ──
function growAnswer(code){
  var f = FFP_FOUNDATIONS.filter(function (x){ return x.code === code; })[0]; if (!f) return;
  var cur = _foundAns[code] || '';
  openModalShell('', f.title,
    '<div style="font-size:18px;font-weight:900;color:var(--ffp-text);line-height:1.25;">'+_growEsc(f.q)+'</div>'
    + '<div class="psub" style="margin:6px 0 12px;">In your own words. Clear and specific — that clarity is your brand.</div>'
    + '<textarea class="textarea" id="ga-input" rows="4" placeholder="'+_growEsc(f.ph)+'" style="width:100%;box-sizing:border-box;">'+_growEsc(cur)+'</textarea>'
    + '<button type="button" class="btn btn-sec btn-block" style="justify-content:center;gap:8px;margin-top:12px;" onclick="growFoundationTalk(\''+code+'\')"><span class="ms">sports</span> Not sure? Coach me through it</button>',
    '<button class="btn btn-ghost" onclick="closeModal()">Close</button><button class="btn btn-pri" onclick="growSaveAnswer(\''+code+'\')">Lock it in</button>');
}
async function growSaveAnswer(code){
  var pid = _growProvId(); if (!pid) return;
  var el = document.getElementById('ga-input'); var ans = el ? el.value : '';
  try {
    var r = await window.supabase.rpc('pro_grow_foundation_set', { p_pro: pid, p_code: code, p_answer: ans });
    if (r && r.error) throw r.error; var d = r && r.data; if (d && d.ok === false) throw new Error(d.error || 'save_failed');
    _growToast('Locked in', 'success'); closeModal(); renderGrow();
  } catch (e) { console.error('[FFP Grow] answer', e); _growToast('Could not save', 'error'); }
}
function growFoundationTalk(code){
  var f = FFP_FOUNDATIONS.filter(function (x){ return x.code === code; })[0];
  var seed = f ? f.seed : 'Coach me on growing my business.';
  if (window.ffpCoachAsk){ try { closeModal(); } catch (e) {} window.ffpCoachAsk(seed); }
  else _growToast('Coach is loading — try again', 'error');
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
