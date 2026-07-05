// ════════════════════════════════════════════════════════════════════════
// FFP Professional — GROW (Business Mentorship) · Phase 1: business habits + streak
// The member Passport turns people into active people via daily habits + streaks.
// GROW points the same engine at the COACH's business: small daily/weekly business
// habits, a streak, and a weekly score. Loaded lazily via _provLoaderSrc['grow'];
// renderPanel('grow') calls renderGrow(). Uses window.FFP_PROVIDER.id + window.supabase.
// DB: grow_habit_catalog / pro_grow_log · RPCs: pro_grow_state / pro_grow_toggle.
// ════════════════════════════════════════════════════════════════════════

function _growProvId(){ return (window.FFP_PROVIDER || {}).id || null; }
function _growEsc(s){ return (typeof escHtml === 'function') ? escHtml(s == null ? '' : String(s)) : String(s == null ? '' : s); }
function _growToast(m, t){ if (typeof showToast === 'function') showToast(m, t); }

function _growStat(n, label, accent){
  return '<div style="flex:1;background:var(--ffp-bg-card);border:1px solid var(--ffp-border-mid);border-radius:14px;padding:14px 8px;text-align:center;">'
    + '<div style="font-size:26px;font-weight:900;color:'+(accent||'var(--ffp-text)')+';line-height:1;">'+n+'</div>'
    + '<div class="psub" style="margin:5px 0 0;text-transform:uppercase;font-size:9.5px;font-weight:800;letter-spacing:.6px;">'+label+'</div></div>';
}

function _growRow(h){
  var done = !!h.done;
  var bd = done ? 'var(--ffp-purple)' : 'var(--ffp-border-mid)';
  return '<button type="button" onclick="growToggle(\''+h.code+'\',this)" data-code="'+h.code+'" class="grow-row" '
    + 'style="width:100%;display:flex;align-items:center;gap:12px;text-align:left;background:var(--ffp-bg-card);border:1px solid '+bd+';border-radius:12px;padding:12px 14px;margin-bottom:8px;cursor:pointer;font-family:inherit;">'
    + '<span style="width:24px;height:24px;border-radius:50%;flex:0 0 auto;display:flex;align-items:center;justify-content:center;border:2px solid '+bd+';background:'+(done?'var(--ffp-purple)':'transparent')+';color:#fff;">'+(done?'<span class="ms" style="font-size:16px;">check</span>':'')+'</span>'
    + '<span style="flex:1;min-width:0;"><span style="display:block;font-weight:800;font-size:13.5px;color:var(--ffp-text);'+(done?'opacity:.55;':'')+'">'+_growEsc(h.title)+'</span>'
    + '<span style="display:block;font-size:11px;color:var(--ffp-text-muted);line-height:1.35;margin-top:1px;">'+_growEsc(h.description||'')+'</span></span>'
    + '<span style="flex:0 0 auto;font-size:11px;font-weight:800;color:var(--ffp-text-dim);">+'+(h.points||0)+'</span></button>';
}

async function renderGrow(){
  var host = document.getElementById('grow-body'); if (!host) return;
  var pid = _growProvId();
  if (!pid){ host.innerHTML = '<div class="psub" style="padding:12px 0;">Sign in to see your Grow habits.</div>'; return; }
  host.innerHTML = '<div class="ov-empty" style="padding:16px;">Loading…</div>';
  var st = {};
  try { var r = await window.supabase.rpc('pro_grow_state', { p_pro: pid }); st = (r && r.data) || {}; }
  catch (e) { console.error('[FFP Grow] state', e); host.innerHTML = '<div class="psub" style="padding:12px 0;">Could not load your habits.</div>'; return; }
  var habits = st.habits || [];
  var daily = habits.filter(function(h){ return h.frequency === 'daily'; });
  var weekly = habits.filter(function(h){ return h.frequency === 'weekly'; });
  var streak = st.streak || 0, wd = st.week_done || 0, wp = st.week_points || 0;

  var head = '<div style="display:flex;gap:10px;margin-bottom:18px;">'
    + _growStat((streak>0?'🔥 ':'')+streak, 'Day streak', 'var(--ffp-purple)')
    + _growStat(wd, 'Done this week')
    + _growStat(wp, 'Points')
    + '</div>';

  var body = head
    + (daily.length ? ('<div class="form-section-title">Do today</div>' + daily.map(_growRow).join('')) : '')
    + (weekly.length ? ('<div class="form-section-title" style="margin-top:18px;">This week</div>' + weekly.map(_growRow).join('')) : '')
    + '<div class="psub" style="margin:14px 2px 0;">Small, consistent actions build a business. Tick each one as you do it — keep the streak alive.</div>';
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

// First open (renderPanel('grow') also calls this once the script loads).
try { if (document.getElementById('grow-body')) renderGrow(); } catch (e) {}
