// ════════════════════════════════════════════════════════════════════════
// FFP Professional — GROW (Business Mentorship)
// Stage 1: FOUNDATIONS — understand where the coach is (assess), then a single
// focus + small wins. The FFP Coach chat is where the questions/coaching happen.
// Daily/weekly business HABITS sit underneath for momentum. Loaded lazily via
// _provLoaderSrc['grow']; renderPanel('grow') calls renderGrow().
// DB: grow_habit_catalog / pro_grow_log / pro_grow_foundations
// RPCs: pro_grow_state / pro_grow_toggle / pro_grow_foundations_state / pro_grow_foundation_set
// ════════════════════════════════════════════════════════════════════════

var _growState = null;
var _foundMap = {};
var _faSel = {};

// The foundations of a great coach + the seed question the FFP Coach opens with.
var FFP_FOUNDATIONS = [
  { code:'niche', title:'Your niche', q:'Who is your ideal client, and what do you help them with?', seed:'Help me nail my niche — my ideal client and the problem I solve. Ask me questions until we land on a clear one-liner.' },
  { code:'offer', title:'Your offer', q:'Do you sell a clear result or package, or mostly one-off sessions?', seed:'Help me turn what I do into a clear offer / package with an outcome, not just one-off sessions.' },
  { code:'pricing', title:'Pricing', q:'Are your prices set — and can you quote them without flinching?', seed:'Help me set my pricing and feel confident quoting it.' },
  { code:'profile', title:'Your profile', q:'Is your FFP profile complete and published?', seed:'Help me finish and publish my FFP profile so clients can find and trust me.' },
  { code:'payments', title:'Payments', q:'Can clients pay you online today (Stripe connected)?', seed:'Help me get set up to take payments — Stripe, packages and invoices.' },
  { code:'onboarding', title:'Onboarding', q:'When someone says yes, do you have a standard way to onboard them?', seed:'Help me build a simple, repeatable onboarding for new clients.' },
  { code:'delivery', title:'Delivery', q:'How do you deliver and check in between sessions?', seed:'Help me set up a consistent way to deliver and check in with clients between sessions.' },
  { code:'lead_gen', title:'Lead generation', q:'Where do your new clients come from right now?', seed:'Help me build a reliable way to get new clients — referrals, social, network or paid.' },
  { code:'retention', title:'Retention', q:'What keeps a client with you after their first block?', seed:'Help me keep clients progressing and re-signing past their first block.' },
  { code:'social_proof', title:'Social proof', q:'Are you regularly collecting reviews and client wins?', seed:'Help me start collecting reviews, testimonials and client wins — and using them.' },
  { code:'lead_by_example', title:'Lead by example', q:'Are you training in your own discipline and posting it on your Passport?', seed:'Coach me on leading by example — living my discipline and posting my own training on the Passport to build my brand over the next two years.', cornerstone:true }
];

function _growProvId(){ return (window.FFP_PROVIDER || {}).id || null; }
function _growEsc(s){ return (typeof escHtml === 'function') ? escHtml(s == null ? '' : String(s)) : String(s == null ? '' : s); }
function _growToast(m, t){ if (typeof showToast === 'function') showToast(m, t); }

function _growStat(n, label, accent){
  return '<div style="flex:1;background:var(--ffp-bg-card);border:1px solid var(--ffp-border-mid);border-radius:14px;padding:14px 8px;text-align:center;">'
    + '<div style="font-size:26px;font-weight:900;color:'+(accent||'var(--ffp-text)')+';line-height:1;">'+n+'</div>'
    + '<div class="psub" style="margin:5px 0 0;text-transform:uppercase;font-size:9.5px;font-weight:800;letter-spacing:.6px;">'+label+'</div></div>';
}

function _foundStatus(code){ var f = _foundMap[code]; return (f && f.status) || 'not_yet'; }
function _foundDot(status){
  var c = status === 'sorted' ? '#1d7a4d' : (status === 'getting_there' ? '#c8871a' : '#c3cfd1');
  return '<span style="width:11px;height:11px;border-radius:50%;background:'+c+';flex:0 0 auto;"></span>';
}
function _foundRow(f){
  var st = _foundStatus(f.code);
  return '<button type="button" onclick="growAssess(\''+f.code+'\')" style="width:100%;display:flex;align-items:center;gap:11px;text-align:left;background:var(--ffp-bg-card);border:1px solid var(--ffp-border-mid);border-radius:11px;padding:11px 13px;margin-bottom:7px;cursor:pointer;font-family:inherit;">'
    + _foundDot(st)
    + '<span style="flex:1;min-width:0;font-weight:800;font-size:13.5px;color:var(--ffp-text);">'+_growEsc(f.title)+(f.cornerstone?' <span style="font-size:9.5px;font-weight:800;color:var(--ffp-purple);text-transform:uppercase;letter-spacing:.4px;">cornerstone</span>':'')+'</span>'
    + '<span class="ms" style="color:var(--ffp-text-dim);flex:0 0 auto;">chevron_right</span></button>';
}
function _focusFoundation(){
  for (var i = 0; i < FFP_FOUNDATIONS.length; i++){ if (_foundStatus(FFP_FOUNDATIONS[i].code) !== 'sorted') return FFP_FOUNDATIONS[i]; }
  return null;
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

async function renderGrow(){
  var host = document.getElementById('grow-body'); if (!host) return;
  var pid = _growProvId();
  if (!pid){ host.innerHTML = '<div class="psub" style="padding:12px 0;">Sign in to see Grow.</div>'; return; }
  host.innerHTML = '<div class="ov-empty" style="padding:16px;">Loading…</div>';
  var st = {}, founds = [];
  try { var r = await window.supabase.rpc('pro_grow_state', { p_pro: pid }); st = (r && r.data) || {}; } catch (e) { console.error('[FFP Grow] state', e); }
  try { var rf = await window.supabase.rpc('pro_grow_foundations_state', { p_pro: pid }); founds = (rf && rf.data) || []; } catch (e) { console.error('[FFP Grow] foundations', e); }
  _growState = st;
  _foundMap = {};
  (founds || []).forEach(function (x){ _foundMap[x.foundation_code] = { status: x.status, confidence: x.confidence }; });

  var habits = st.habits || [];
  var daily = habits.filter(function (h){ return h.frequency === 'daily'; });
  var weekly = habits.filter(function (h){ return h.frequency === 'weekly'; });
  var streak = st.streak || 0, wd = st.week_done || 0, wp = st.week_points || 0;

  var focus = _focusFoundation();
  var focusHtml = '';
  if (focus){
    focusHtml = '<div style="background:var(--ffp-bg-card);border:1px solid var(--ffp-purple);border-radius:14px;padding:15px;margin-bottom:18px;">'
      + '<div style="font-size:10px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:var(--ffp-purple);margin-bottom:5px;">Your focus now</div>'
      + '<div style="font-size:16px;font-weight:900;color:var(--ffp-text);">'+_growEsc(focus.title)+'</div>'
      + '<div class="psub" style="margin:4px 0 12px;">'+_growEsc(focus.q)+'</div>'
      + '<button class="btn btn-pri btn-block" style="justify-content:center;gap:8px;" onclick="growFoundationTalk(\''+focus.code+'\')"><span class="ms">sports</span> Talk it through with your FFP Coach</button>'
      + '</div>';
  }

  var head = '<div style="display:flex;gap:10px;margin-bottom:18px;">'
    + _growStat((streak>0?'🔥 ':'')+streak, 'Day streak', 'var(--ffp-purple)')
    + _growStat(wd, 'Done this week')
    + _growStat(wp, 'Points')
    + '</div>';

  var body = focusHtml + head
    + '<div class="form-section-title">Your foundations</div>'
    + FFP_FOUNDATIONS.map(_foundRow).join('')
    + (daily.length ? ('<div class="form-section-title" style="margin-top:18px;">Do today</div>' + daily.map(_growRow).join('')) : '')
    + (weekly.length ? ('<div class="form-section-title" style="margin-top:18px;">This week</div>' + weekly.map(_growRow).join('')) : '');
  host.innerHTML = body;
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

// ── Foundation assessment (status + confidence) ──
function _faStatusChip(val, label, cur){
  var on = (cur === val);
  return '<button type="button" data-v="'+val+'" onclick="_faPickStatus(this)" class="fa-st" style="flex:1;padding:11px 6px;border-radius:10px;border:1px solid '+(on?'var(--ffp-purple)':'var(--ffp-border-mid)')+';background:'+(on?'rgba(10,62,68,.10)':'var(--ffp-bg-card)')+';color:var(--ffp-text);font-weight:800;font-size:12px;font-family:inherit;cursor:pointer;">'+label+'</button>';
}
function _faConfBtn(n, cur){
  var on = (cur > 0 && n <= cur);
  return '<button type="button" data-n="'+n+'" onclick="_faPickConf(this)" class="fa-cf" style="flex:1;height:38px;border-radius:9px;border:1px solid '+(on?'var(--ffp-purple)':'var(--ffp-border-mid)')+';background:'+(on?'var(--ffp-purple)':'var(--ffp-bg-card)')+';color:'+(on?'#fff':'var(--ffp-text)')+';font-weight:800;font-family:inherit;cursor:pointer;">'+n+'</button>';
}
function _faPickStatus(el){
  _faSel.status = el.getAttribute('data-v');
  Array.prototype.forEach.call(el.parentNode.querySelectorAll('.fa-st'), function (b){
    var on = (b === el); b.style.borderColor = on ? 'var(--ffp-purple)' : 'var(--ffp-border-mid)'; b.style.background = on ? 'rgba(10,62,68,.10)' : 'var(--ffp-bg-card)';
  });
}
function _faPickConf(el){
  var n = parseInt(el.getAttribute('data-n'), 10); _faSel.conf = n;
  Array.prototype.forEach.call(el.parentNode.querySelectorAll('.fa-cf'), function (b){
    var on = parseInt(b.getAttribute('data-n'), 10) <= n; b.style.borderColor = on ? 'var(--ffp-purple)' : 'var(--ffp-border-mid)'; b.style.background = on ? 'var(--ffp-purple)' : 'var(--ffp-bg-card)'; b.style.color = on ? '#fff' : 'var(--ffp-text)';
  });
}
function growAssess(code){
  var f = FFP_FOUNDATIONS.filter(function (x){ return x.code === code; })[0]; if (!f) return;
  var cur = _foundMap[code] || {}; _faSel = { status: cur.status || '', conf: cur.confidence || 0 };
  var st = cur.status || 'not_yet', cf = cur.confidence || 0;
  openModalShell('', f.title,
    '<div class="psub" style="margin:0 0 14px;">'+_growEsc(f.q)+'</div>'
    + '<div class="form-section-title">Where are you?</div>'
    + '<div style="display:flex;gap:8px;margin-bottom:16px;">' + _faStatusChip('not_yet','Not yet',st) + _faStatusChip('getting_there','Getting there',st) + _faStatusChip('sorted','Sorted',st) + '</div>'
    + '<div class="form-section-title">How confident? (1–5)</div>'
    + '<div style="display:flex;gap:8px;">' + [1,2,3,4,5].map(function (n){ return _faConfBtn(n, cf); }).join('') + '</div>'
    + '<button class="btn btn-sec btn-block" style="justify-content:center;gap:8px;margin-top:16px;" onclick="growFoundationTalk(\''+code+'\')"><span class="ms">sports</span> Talk it through with your FFP Coach</button>',
    '<button class="btn btn-ghost" onclick="closeModal()">Close</button><button class="btn btn-pri" onclick="growSaveAssess(\''+code+'\')">Save</button>');
}
async function growSaveAssess(code){
  var pid = _growProvId(); if (!pid) return;
  var status = _faSel.status || 'not_yet'; var conf = _faSel.conf || null;
  try {
    var r = await window.supabase.rpc('pro_grow_foundation_set', { p_pro: pid, p_code: code, p_status: status, p_confidence: conf });
    if (r && r.error) throw r.error; var d = r && r.data; if (d && d.ok === false) throw new Error(d.error || 'save_failed');
    _growToast('Saved', 'success'); closeModal(); renderGrow();
  } catch (e) { console.error('[FFP Grow] foundation set', e); _growToast('Could not save', 'error'); }
}
function growFoundationTalk(code){
  var f = FFP_FOUNDATIONS.filter(function (x){ return x.code === code; })[0];
  var seed = f ? f.seed : 'Coach me on growing my business.';
  if (window.ffpCoachAsk){ try { closeModal(); } catch (e) {} window.ffpCoachAsk(seed); }
  else _growToast('Coach is loading — try again', 'error');
}

// First open (renderPanel('grow') also calls this once the script loads).
try { if (document.getElementById('grow-body')) renderGrow(); } catch (e) {}
