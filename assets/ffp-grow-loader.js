// ════════════════════════════════════════════════════════════════════════
// FFP Professional — GROW · a LIVE read of your business + accountability.
// Tabs: NOW (the honest pulse — real numbers → your #1 blocker + today), BRAND
// (build your brand: articulate the foundations), HABITS (daily actions).
// The pulse updates every time you open it, from your real actions. "Work it
// through with your Coach" hands the diagnostic to the FFP Coach (whistle) to
// probe deeper + hold you accountable. renderPanel('grow') → renderGrow().
// RPCs: pro_grow_pulse / pro_grow_state / pro_grow_toggle /
//       pro_grow_foundations_state / pro_grow_foundation_set
// ════════════════════════════════════════════════════════════════════════

var _growTab = 'now';
var _growState = null;
var _growPulse = null;
var _foundAns = {};

var FFP_FOUNDATIONS = [
  { code:'niche', title:'Your niche', label:'Who I help', q:'Who do you help — and with what?', ph:'e.g. I help busy dads over 40 get lean and strong in 3 sessions a week', seed:'Help me nail my niche in one sharp line — my ideal client and the problem I solve. Ask me questions until it is crystal clear.' },
  { code:'offer', title:'Your offer', label:'My offer', q:'What is your signature offer?', ph:'e.g. A 12-week "Strong Dad" transformation — training + nutrition', seed:'Help me turn what I do into one clear signature offer with an outcome, not one-off sessions.' },
  { code:'pricing', title:'Pricing', label:'My price', q:'What do you charge — and can you own it?', ph:'e.g. AED 2,400 for the 12-week programme', seed:'Help me set my pricing and be able to quote it with confidence.' },
  { code:'profile', title:'Your profile', label:'My storefront', q:'In a line, why is your FFP profile worth booking?', ph:'e.g. Proven dad-transformation coach, 50+ success stories, Dubai', seed:'Help me sharpen my FFP profile so a stranger instantly gets why they should book me.' },
  { code:'payments', title:'Payments', label:'How I get paid', q:'How does a client pay you — today?', ph:'e.g. Stripe online, the 12-week package upfront', seed:'Help me get set up so clients can pay me easily — Stripe, packages, invoices.' },
  { code:'onboarding', title:'Onboarding', label:'My onboarding', q:'What happens the moment someone says yes?', ph:'e.g. Welcome message, intake form, goal call, first session booked', seed:'Help me build a simple, repeatable onboarding for the moment a client says yes.' },
  { code:'delivery', title:'Delivery', label:'How I deliver', q:'How do you deliver results between sessions?', ph:'e.g. App programme, weekly check-in, WhatsApp support', seed:'Help me set up a consistent way to deliver and check in between sessions.' },
  { code:'lead_gen', title:'Lead generation', label:'Where clients come from', q:'Where will your next 5 clients come from?', ph:'e.g. Referrals + 3 reels a week + a gym partnership', seed:'Help me build a reliable way to get my next clients — referrals, social, network or paid.' },
  { code:'retention', title:'Retention', label:'How I keep clients', q:'Why do clients stay with you past 12 weeks?', ph:'e.g. A new goal, progress reviews, and a community', seed:'Help me keep clients progressing and re-signing past their first block.' },
  { code:'social_proof', title:'Social proof', label:'My proof', q:'What proof shows you get results?', ph:'e.g. 20 before/afters and 15 five-star reviews', seed:'Help me start collecting and using proof — reviews, testimonials, client wins.' },
  { code:'lead_by_example', title:'Lead by example', label:'How I lead', q:'How are you living it — and posting it on your Passport?', ph:'e.g. I train 5x a week and post every session on my Passport', seed:'Coach me on leading by example — living my discipline and posting my own training on the Passport to build my brand over the next two years.', cornerstone:true }
];

function _growProvId(){ return (window.FFP_PROVIDER || {}).id || null; }
function _growEsc(s){ return (typeof escHtml === 'function') ? escHtml(s == null ? '' : String(s)) : String(s == null ? '' : s); }
function _growToast(m, t){ if (typeof showToast === 'function') showToast(m, t); }

function _growTabs(){
  var t = function (id, label){ var on = (_growTab === id);
    return '<button type="button" onclick="growTab(\''+id+'\')" style="padding:11px 0;margin-right:26px;border:none;background:none;font-size:13.5px;font-weight:'+(on?'800':'700')+';color:'+(on?'var(--ffp-purple)':'var(--ffp-text-dim)')+';border-bottom:3px solid '+(on?'var(--ffp-purple)':'transparent')+';margin-bottom:-1px;font-family:inherit;cursor:pointer;">'+label+'</button>'; };
  return '<div style="display:flex;border-bottom:1px solid var(--ffp-border-mid);margin-bottom:18px;">' + t('now','Now') + t('brand','Brand') + t('habits','Habits') + '</div>';
}

// ── NOW: the live pulse (real numbers → your #1 blocker + today) ──
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

// ── BRAND: articulate the foundations (build your brand) ──
function _growSteps(nailed, total){
  var s = '';
  for (var i = 0; i < total; i++){
    if (i < nailed) s += '<div style="flex:1;height:12px;border-radius:4px;background:repeating-linear-gradient(45deg,#FFCC00,#FFCC00 5px,#ffb020 5px,#ffb020 10px);"></div>';
    else if (i === nailed) s += '<div style="flex:1;height:22px;border-radius:5px;background:#fff;box-shadow:0 0 14px rgba(255,255,255,.7);"></div>';
    else s += '<div style="flex:1;height:12px;border-radius:4px;background:rgba(255,255,255,.15);"></div>';
  }
  return '<div style="display:flex;align-items:flex-end;gap:5px;">' + s + '<div style="font-size:13px;font-weight:900;color:#FFCC00;white-space:nowrap;margin-left:6px;">'+nailed+'<span style="color:#8fe0d0;font-weight:700;">/'+total+'</span></div></div>';
}
function _growBlueprintItem(f){
  return '<div onclick="growAnswer(\''+f.code+'\')" style="display:flex;background:var(--ffp-bg-card);border-radius:14px;margin-bottom:10px;box-shadow:0 4px 14px rgba(10,62,68,.07);overflow:hidden;cursor:pointer;">'
    + '<div style="width:5px;flex:0 0 auto;background:linear-gradient(180deg,#1d7a4d,#37b06a);"></div>'
    + '<div style="padding:12px 14px;min-width:0;"><div style="font-size:9.5px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:#1d7a4d;">'+_growEsc(f.label)+'</div>'
    + '<div style="font-size:15px;font-weight:700;color:var(--ffp-text);margin-top:3px;line-height:1.35;">'+_growEsc(_foundAns[f.code])+'</div></div></div>';
}
function _growBrandTab(){
  var nailed = FFP_FOUNDATIONS.filter(function (f){ return !!_foundAns[f.code]; }).length;
  var total = FFP_FOUNDATIONS.length;
  var hero = '<div style="position:relative;background:linear-gradient(135deg,#0a3e44 0%,#0e5a63 60%,#127d78 100%);border-radius:20px;padding:20px 18px 18px;color:#fff;margin-bottom:18px;overflow:hidden;box-shadow:0 12px 30px rgba(10,62,68,.28);">'
    + '<div style="position:absolute;inset:0;background-image:radial-gradient(circle at 1px 1px, rgba(255,255,255,.10) 1px, transparent 0);background-size:16px 16px;opacity:.6;"></div>'
    + '<div style="position:relative;"><div style="font-size:10px;font-weight:800;letter-spacing:1.6px;color:#8fe0d0;">730-DAY BRAND JOURNEY</div>'
    + '<div style="font-size:24px;font-weight:900;margin:5px 0 16px;letter-spacing:-.3px;">Build your brand</div>'
    + _growSteps(nailed, total) + '</div></div>';
  var focus = null;
  for (var i = 0; i < FFP_FOUNDATIONS.length; i++){ if (!_foundAns[FFP_FOUNDATIONS[i].code]){ focus = FFP_FOUNDATIONS[i]; break; } }
  var card = focus
    ? '<div style="background:var(--ffp-bg-card);border-radius:18px;box-shadow:0 10px 26px rgba(10,62,68,.10);overflow:hidden;margin-bottom:20px;">'
      + '<div style="height:5px;background:linear-gradient(90deg,#0a3e44,#2ba8e0,#5b3fa6);"></div>'
      + '<div style="padding:18px;"><div style="font-size:10px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:var(--ffp-blue);margin-bottom:8px;">◆ Nail this next</div>'
      + '<div style="font-size:20px;font-weight:900;color:var(--ffp-text);line-height:1.2;letter-spacing:-.3px;">'+_growEsc(focus.q)+'</div>'
      + '<div class="psub" style="margin:8px 0 16px;">One sharp answer. If you know it, you can write it.</div>'
      + '<button type="button" style="width:100%;background:linear-gradient(135deg,#0a3e44,#2ba8e0);color:#fff;border:none;border-radius:13px;padding:14px;font-size:14.5px;font-weight:800;font-family:inherit;cursor:pointer;box-shadow:0 8px 18px rgba(43,168,224,.30);" onclick="growAnswer(\''+focus.code+'\')">Answer it →</button></div></div>'
    : '<div style="background:var(--ffp-bg-card);border-radius:18px;box-shadow:0 10px 26px rgba(10,62,68,.10);overflow:hidden;margin-bottom:20px;"><div style="height:5px;background:linear-gradient(90deg,#1d7a4d,#37b06a,#FFCC00);"></div><div style="padding:20px 18px;text-align:center;"><div style="font-size:30px;">🏆</div><div style="font-size:17px;font-weight:900;color:var(--ffp-text);margin:6px 0 3px;">Your blueprint is built</div><div class="psub">Every foundation nailed. Keep it sharp.</div></div></div>';
  var done = FFP_FOUNDATIONS.filter(function (f){ return !!_foundAns[f.code]; });
  var blueprint = done.length ? ('<div class="form-section-title">Your brand so far</div>' + done.map(_growBlueprintItem).join('')) : '';
  return hero + card + blueprint;
}

// ── HABITS: daily actions ──
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
  var content = _growTab === 'brand' ? _growBrandTab() : (_growTab === 'habits' ? _growHabitsTab() : _growNowTab());
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

// ── Articulate a foundation (modal) ──
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

// ── Live refresh: re-read the pulse through the day while Grow is open + visible (silent, no loading flash) ──
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
