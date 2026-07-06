// ════════════════════════════════════════════════════════════════════════
// FFP Professional — TEAM · coach tracks their squad. Two tabs only:
//   OVERVIEW — the 5 coach needs on one page: FITNESS (mark pills + team avg +
//              per-player bar graph), DOING THE WORK (today/yesterday/7d),
//              SKILLS (level columns), WHAT THEY'RE TRAINING (thick bars),
//              WHO NEEDS YOU (flags).
//   PLAYERS  — pick a player from the avatar strip → marks dot-graph hero,
//              streak/week tiles, spectrum skills, recent activity, nutrition
//              (7-day selector + day meals/macros + hydration).
// Benchmarks TAB was dropped, but CREATING a mark/skill stays: ＋ on the
// Overview Fitness/Skills headers, record results inline on a player's marks,
// team setup behind the gear on the team header.
// renderPanel('team') → renderTeam().  Pro app light theme + a dark hero.
// RPCs: pro_teams_list / pro_team_overview / pro_team_players / pro_player_detail /
//       pro_player_nutrition / pro_team_create|update / pro_team_add_member|remove_member /
//       pro_team_candidate_members / pro_benchmark_upsert / pro_benchmark_record.
// ════════════════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ---- shared state ----
  window.FFP_TEAM = window.FFP_TEAM || {};

  // ---- tiny helpers (reuse the app's globals) ----
  function _tPid() { return (window.FFP_PROVIDER || {}).id || null; }
  function _tEsc(s) { return (typeof escHtml === 'function') ? escHtml(s == null ? '' : String(s)) : String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function _tToast(m, t) { if (typeof showToast === 'function') showToast(m, t); }
  function _tSb() { return window.supabase; }

  // colours
  var C = {
    green: '#37b06a', grey: '#b6c1c3', red: '#e24b4a',
    aqua: '#37E0C6', coral: '#FF7A66', blue: '#2ba8e0',
    yellow: '#FFCC00', teal: '#0a3e44'
  };
  var SPECTRUM = ['#e24b4a', '#f0932b', '#37b06a', '#2ba8e0', '#8b5cf6']; // level 1→5

  function _lowerBetter(dir) { return /^(lower|down|less|desc|faster)$/i.test(dir || ''); }

  // format a mark value (seconds → m:ss, else number + unit)
  function _fmtVal(v, unit) {
    if (v == null || v === '') return '—';
    v = Number(v);
    if (unit && /^s/i.test(unit)) {
      var s = Math.round(v), m = Math.floor(s / 60), ss = s % 60;
      return m + ':' + (ss < 10 ? '0' : '') + ss;
    }
    var n = Math.round(v * 10) / 10;
    return n + (unit ? ' ' + _tEsc(unit) : '');
  }
  function _fmtDelta(cur, prev, unit, dir) {
    if (cur == null || prev == null) return '';
    var d = Number(cur) - Number(prev);
    if (d === 0) return '';
    var better = _lowerBetter(dir) ? d < 0 : d > 0;
    var mag = Math.abs(d);
    var magTxt = (unit && /^s/i.test(unit)) ? (Math.round(mag) + 's') : (Math.round(mag * 10) / 10);
    return '<span style="color:' + (better ? C.green : C.red) + ';font-weight:800;">' + (better ? '▲' : '▼') + ' ' + magTxt + '</span>';
  }

  function _initials(name) {
    var p = (name || '').trim().split(/\s+/);
    return ((p[0] || '')[0] || '') + ((p[1] || '')[0] || '');
  }
  function _av(name, photo, size, ring) {
    size = size || 44;
    var st = 'width:' + size + 'px;height:' + size + 'px;border-radius:50%;flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:' + Math.round(size * 0.36) + 'px;color:#0f2327;background:#dbe6e8;overflow:hidden;';
    if (ring) st += 'box-shadow:0 0 0 2.5px ' + ring + ',0 0 0 4px #fff;';
    var inner = photo ? '<img src="' + _tEsc(photo) + '" style="width:100%;height:100%;object-fit:cover;" alt="">' : _tEsc(_initials(name).toUpperCase());
    return '<span style="' + st + '">' + inner + '</span>';
  }
  function _ringFor(traj) { return traj === 'up' ? C.green : (traj === 'down' ? C.red : C.grey); }

  // ─── styles (injected once) ───
  function _styles() {
    if (document.getElementById('ffpt-styles')) return;
    var s = document.createElement('style'); s.id = 'ffpt-styles';
    s.textContent = [
      '.ffpt-wrap{font-family:Montserrat,-apple-system,system-ui,sans-serif;color:var(--ffp-text,#0f2327);}',
      '.ffpt-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px;}',
      '.ffpt-tname{font-size:20px;font-weight:900;letter-spacing:-.3px;}',
      '.ffpt-tsub{font-size:12px;font-weight:700;color:var(--ffp-text-dim,#869599);text-transform:uppercase;letter-spacing:.4px;}',
      '.ffpt-icbtn{width:38px;height:38px;border-radius:10px;border:1px solid var(--ffp-border,#e4ebec);background:#fff;color:var(--ffp-text,#0f2327);display:inline-flex;align-items:center;justify-content:center;cursor:pointer;}',
      '.ffpt-tabs{display:flex;gap:6px;background:var(--ffp-bg-3,#eef3f4);padding:4px;border-radius:12px;margin-bottom:16px;}',
      '.ffpt-tab{flex:1;text-align:center;padding:9px 0;border-radius:9px;font-size:14px;font-weight:800;color:var(--ffp-text-muted,#5a6b6e);cursor:pointer;border:none;background:transparent;font-family:inherit;}',
      '.ffpt-tab.on{background:#fff;color:var(--ffp-text,#0f2327);box-shadow:0 1px 3px rgba(0,0,0,.08);}',
      '.ffpt-sec{margin:0 0 8px;}',
      '.ffpt-band{height:8px;}',
      '.ffpt-card{background:#fff;border:1px solid var(--ffp-border,#e4ebec);border-radius:16px;padding:16px;}',
      '.ffpt-sechead{display:flex;align-items:center;justify-content:space-between;margin:18px 0 10px;}',
      '.ffpt-sectitle{font-size:15px;font-weight:900;}',
      '.ffpt-add{width:30px;height:30px;border-radius:8px;border:1px dashed var(--ffp-border-mid,#ccd9da);background:transparent;color:var(--ffp-blue,#2ba8e0);font-size:20px;line-height:1;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;}',
      // dark hero
      '.ffpt-hero{background:radial-gradient(120% 140% at 20% 0%,#0f3b4a 0%,#0a1a24 78%);border-radius:18px;padding:18px;color:#eaf6f7;position:relative;overflow:hidden;}',
      '.ffpt-hero .h-pills{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:14px;}',
      '.ffpt-pill{padding:7px 12px;border-radius:999px;font-size:12.5px;font-weight:800;cursor:pointer;border:1px solid rgba(255,255,255,.16);color:#cfe6ea;background:rgba(255,255,255,.05);}',
      '.ffpt-pill.on{background:var(--ffp-yellow,#FFCC00);color:#20140a;border-color:var(--ffp-yellow,#FFCC00);}',
      '.ffpt-bighead{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:12px;}',
      '.ffpt-big{font-size:42px;font-weight:900;line-height:1;letter-spacing:-1px;}',
      '.ffpt-biglab{font-size:12px;font-weight:700;color:#9fc0c6;text-transform:uppercase;letter-spacing:.4px;margin-top:5px;}',
      // bar graph
      '.ffpt-bars{position:relative;display:flex;align-items:flex-end;gap:8px;height:132px;padding-top:6px;}',
      '.ffpt-bar{flex:1 1 0;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;min-width:0;}',
      '.ffpt-bar .b-fill{width:100%;max-width:34px;border-radius:6px 6px 0 0;}',
      '.ffpt-bar .b-face{width:26px;height:26px;border-radius:50%;overflow:hidden;margin-top:7px;background:#dbe6e8;}',
      '.ffpt-bar .b-face img{width:100%;height:100%;object-fit:cover;}',
      '.ffpt-avg{position:absolute;left:0;right:0;border-top:2px dashed rgba(255,255,255,.5);}',
      '.ffpt-avg span{position:absolute;right:0;top:-9px;font-size:10px;font-weight:800;color:#cfe6ea;background:#0a1a24;padding:0 4px;}',
      // doing the work
      '.ffpt-strip{display:flex;gap:12px;overflow-x:auto;padding:4px 2px 8px;-ms-overflow-style:none;scrollbar-width:none;}',
      '.ffpt-strip::-webkit-scrollbar{display:none;}',
      '.ffpt-wk{display:flex;flex-direction:column;align-items:center;gap:6px;flex:0 0 auto;width:58px;}',
      '.ffpt-wk .nm{font-size:11px;font-weight:700;color:var(--ffp-text-muted,#5a6b6e);max-width:58px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center;}',
      '.ffpt-badge{position:absolute;right:-2px;bottom:-2px;width:18px;height:18px;border-radius:50%;background:var(--ffp-blue,#2ba8e0);color:#fff;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;border:2px solid #fff;}',
      '.ffpt-seg{display:flex;gap:8px;margin:6px 0 2px;}',
      '.ffpt-segbtn{flex:1;padding:7px 0;border-radius:8px;border:1px solid var(--ffp-border,#e4ebec);background:#fff;font-size:12.5px;font-weight:800;color:var(--ffp-text-muted,#5a6b6e);cursor:pointer;font-family:inherit;}',
      '.ffpt-segbtn.on{background:var(--ffp-purple,#0a3e44);color:#fff;border-color:var(--ffp-purple,#0a3e44);}',
      '.ffpt-quiet{font-size:12px;font-weight:700;color:var(--ffp-text-dim,#869599);margin-top:6px;}',
      // skills columns
      '.ffpt-cols{display:flex;gap:8px;}',
      '.ffpt-col{flex:1;background:var(--ffp-bg-3,#eef3f4);border-radius:12px;padding:9px 7px;min-height:96px;}',
      '.ffpt-col h5{margin:0 0 8px;font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.3px;color:var(--ffp-text-muted,#5a6b6e);text-align:center;}',
      '.ffpt-col .faces{display:flex;flex-direction:column;gap:6px;align-items:center;}',
      // training bars
      '.ffpt-trow{margin:9px 0;}',
      '.ffpt-tbar{position:relative;height:30px;border-radius:8px;background:var(--ffp-bg-3,#eef3f4);overflow:hidden;}',
      '.ffpt-tbar .fill{position:absolute;left:0;top:0;bottom:0;border-radius:8px;background:linear-gradient(90deg,#0a3e44,#2ba8e0);}',
      '.ffpt-tbar .lab{position:absolute;left:10px;top:0;bottom:0;display:flex;align-items:center;font-size:12.5px;font-weight:800;color:#fff;z-index:2;text-shadow:0 1px 2px rgba(0,0,0,.25);}',
      '.ffpt-tbar .pct{position:absolute;right:9px;top:0;bottom:0;display:flex;align-items:center;font-size:12px;font-weight:800;color:var(--ffp-text-muted,#5a6b6e);}',
      // flags
      '.ffpt-flag{display:flex;align-items:center;gap:11px;padding:11px 0;border-top:1px solid var(--ffp-border,#e4ebec);}',
      '.ffpt-flag:first-child{border-top:none;}',
      '.ffpt-flag .r{font-size:13px;font-weight:800;}',
      '.ffpt-flag .s{font-size:12px;color:var(--ffp-text-muted,#5a6b6e);font-weight:600;}',
      '.ffpt-flag button{margin-left:auto;padding:7px 14px;border-radius:9px;border:none;background:var(--ffp-purple,#0a3e44);color:#fff;font-weight:800;font-size:12.5px;cursor:pointer;font-family:inherit;}',
      // players strip
      '.ffpt-pstrip{display:flex;gap:12px;overflow-x:auto;padding:6px 2px 12px;scrollbar-width:none;}',
      '.ffpt-pstrip::-webkit-scrollbar{display:none;}',
      '.ffpt-pp{display:flex;flex-direction:column;align-items:center;gap:5px;flex:0 0 auto;cursor:pointer;opacity:.62;transition:opacity .15s;}',
      '.ffpt-pp.on{opacity:1;}',
      '.ffpt-pp .nm{font-size:11px;font-weight:800;color:var(--ffp-text,#0f2327);max-width:66px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      // dot graph
      '.ffpt-dots{position:relative;height:110px;margin:8px 0 12px;}',
      // tiles
      '.ffpt-tiles{display:flex;gap:8px;}',
      '.ffpt-tile{flex:1;background:var(--ffp-bg-3,#eef3f4);border-radius:12px;padding:12px 10px;text-align:center;}',
      '.ffpt-tile .v{font-size:22px;font-weight:900;letter-spacing:-.5px;}',
      '.ffpt-tile .l{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.3px;color:var(--ffp-text-muted,#5a6b6e);margin-top:3px;}',
      // spectrum skill meter
      '.ffpt-skrow{margin:11px 0;}',
      '.ffpt-skrow .top{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;}',
      '.ffpt-skrow .nm{font-size:13.5px;font-weight:800;}',
      '.ffpt-skrow .lv{font-size:12.5px;font-weight:800;}',
      '.ffpt-meter{display:flex;gap:4px;}',
      '.ffpt-meter .sg{flex:1;height:9px;border-radius:5px;background:var(--ffp-bg-3,#eef3f4);}',
      // recent
      '.ffpt-recent{display:flex;gap:10px;overflow-x:auto;padding:4px 2px 8px;scrollbar-width:none;}',
      '.ffpt-recent::-webkit-scrollbar{display:none;}',
      '.ffpt-rcard{flex:0 0 auto;width:150px;background:#fff;border:1px solid var(--ffp-border,#e4ebec);border-radius:13px;overflow:hidden;cursor:pointer;}',
      '.ffpt-rcard .ph{height:82px;background:var(--ffp-bg-3,#eef3f4);background-size:cover;background-position:center;}',
      '.ffpt-rcard .bd{padding:9px 10px;}',
      '.ffpt-rcard .a{font-size:12.5px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.ffpt-rcard .m{font-size:11px;font-weight:600;color:var(--ffp-text-muted,#5a6b6e);margin-top:2px;}',
      // nutrition
      '.ffpt-days{display:flex;gap:6px;}',
      '.ffpt-day{flex:1;background:var(--ffp-bg-3,#eef3f4);border-radius:10px;padding:8px 4px;text-align:center;cursor:pointer;border:2px solid transparent;}',
      '.ffpt-day.on{border-color:var(--ffp-blue,#2ba8e0);background:#fff;}',
      '.ffpt-day .d{font-size:10px;font-weight:800;text-transform:uppercase;color:var(--ffp-text-muted,#5a6b6e);}',
      '.ffpt-day .k{font-size:12.5px;font-weight:900;margin-top:3px;}',
      '.ffpt-macro{display:flex;height:9px;border-radius:5px;overflow:hidden;margin:12px 0;}',
      '.ffpt-meal{padding:10px 0;border-top:1px solid var(--ffp-border,#e4ebec);}',
      '.ffpt-meal .mh{display:flex;align-items:center;gap:7px;font-size:12.5px;font-weight:800;margin-bottom:5px;}',
      '.ffpt-meal .it{display:flex;justify-content:space-between;font-size:12.5px;padding:2px 0;color:var(--ffp-text-muted,#5a6b6e);}',
      '.ffpt-hyd{margin-top:12px;}',
      '.ffpt-hyd .bar{height:10px;border-radius:6px;background:rgba(43,168,224,.14);overflow:hidden;}',
      '.ffpt-hyd .fill{height:100%;border-radius:6px;background:linear-gradient(90deg,#2ba8e0,#5fc7ec);}',
      '.ffpt-empty{text-align:center;padding:48px 20px;}',
      '.ffpt-empty .ic{font-size:52px;color:var(--ffp-border-mid,#ccd9da);}',
      '.ffpt-empty h3{font-size:19px;font-weight:900;margin:12px 0 6px;}',
      '.ffpt-empty p{font-size:13.5px;color:var(--ffp-text-muted,#5a6b6e);max-width:320px;margin:0 auto 18px;}',
      '.ffpt-cta{padding:12px 22px;border-radius:11px;border:none;background:var(--ffp-purple,#0a3e44);color:#fff;font-weight:800;font-size:14px;cursor:pointer;font-family:inherit;}',
      '.ffpt-mlab{font-size:12px;font-weight:800;color:var(--ffp-text-muted,#5a6b6e);margin:12px 0 5px;display:block;}',
      '.ffpt-in{width:100%;padding:11px 12px;border:1px solid var(--ffp-border,#e4ebec);border-radius:10px;font-size:16px;font-family:inherit;box-sizing:border-box;background:#fff;color:var(--ffp-text,#0f2327);}'
    ].join('');
    document.head.appendChild(s);
  }

  // ════════ ENTRY ════════
  async function renderTeam() {
    var host = document.getElementById('team-body'); if (!host) return;
    _styles();
    var pid = _tPid();
    var S = window.FFP_TEAM; S.pid = pid;
    if (!pid) { host.innerHTML = '<div class="ffpt-tsub" style="padding:16px;">Sign in to see your teams.</div>'; return; }
    host.innerHTML = '<div class="ffpt-tsub" style="padding:16px;">Loading your team…</div>';
    try { var r = await _tSb().rpc('pro_teams_list', { p_pro: pid }); S.teams = (r && r.data) || []; }
    catch (e) { console.error('[FFP Team] list', e); S.teams = []; }
    if (!S.teams.length) { host.innerHTML = _emptyState(); return; }
    if (!S.team || !S.teams.find(function (t) { return t.id === S.team; })) S.team = S.teams[0].id;
    await _load(S.team);
  }

  function _emptyState() {
    return '<div class="ffpt-wrap"><div class="ffpt-empty">' +
      '<span class="ms ic">groups</span>' +
      '<h3>Track your team</h3>' +
      '<p>Add your players and watch what they do — every session and meal they log to their Passport shows up here. Set the marks and skills you care about, and see who\'s hitting them.</p>' +
      '<button class="ffpt-cta" onclick="teamCreateOpen()">Create your first team</button>' +
      '</div></div>';
  }

  async function _load(teamId) {
    var S = window.FFP_TEAM; S.team = teamId;
    var host = document.getElementById('team-body');
    host.innerHTML = '<div class="ffpt-tsub" style="padding:16px;">Reading the team…</div>';
    try { var ro = await _tSb().rpc('pro_team_overview', { p_pro: S.pid, p_team: teamId }); S.overview = (ro && ro.data) || {}; }
    catch (e) { console.error('[FFP Team] overview', e); S.overview = {}; }
    try { var rp = await _tSb().rpc('pro_team_players', { p_pro: S.pid, p_team: teamId }); S.players = ((rp && rp.data) || {}).players || []; }
    catch (e) { console.error('[FFP Team] players', e); S.players = []; }
    S.tab = S.tab || 'overview';
    S.ovMark = 0; S.ovSkill = 0; S.sel = null; S.detail = null; S.nutri = null; S.heroMark = 0; S.workView = 'today';
    _paint();
  }

  function _paint() {
    var S = window.FFP_TEAM, host = document.getElementById('team-body'); if (!host) return;
    var team = (S.teams || []).find(function (t) { return t.id === S.team; }) || {};
    var sub = [team.sport, team.type].filter(Boolean).join(' · ') || 'Squad';
    var teamSw = (S.teams.length > 1) ? ('<button class="ffpt-icbtn" onclick="teamSwitchOpen()" title="Switch team"><span class="ms">unfold_more</span></button>') : '';
    var h = '<div class="ffpt-wrap">' +
      '<div class="ffpt-head"><div><div class="ffpt-tsub">' + _tEsc(sub) + '</div><div class="ffpt-tname">' + _tEsc(team.name || 'Team') + '</div></div>' +
      '<div style="display:flex;gap:8px;">' + teamSw + '<button class="ffpt-icbtn" onclick="teamGearOpen()" title="Team settings"><span class="ms">settings</span></button></div></div>' +
      '<div class="ffpt-tabs">' +
      '<button class="ffpt-tab' + (S.tab === 'overview' ? ' on' : '') + '" onclick="teamTab(\'overview\')">Overview</button>' +
      '<button class="ffpt-tab' + (S.tab === 'players' ? ' on' : '') + '" onclick="teamTab(\'players\')">Players</button>' +
      '</div><div id="ffpt-body"></div></div>';
    host.innerHTML = h;
    if (S.tab === 'overview') _paintOverview();
    else _paintPlayers();
  }

  function teamTab(t) {
    var S = window.FFP_TEAM; S.tab = t;
    _paint();
    if (t === 'players' && !S.detail) {
      var first = (S.players && S.players[0]) ? S.players[0].member_id : null;
      if (first) teamSelectPlayer(first);
    }
  }

  // ════════ OVERVIEW ════════
  function _paintOverview() {
    var S = window.FFP_TEAM, ov = S.overview || {}, body = document.getElementById('ffpt-body'); if (!body) return;
    var html = '';

    // ── FITNESS hero ──
    var fits = ov.fitness || [];
    html += '<div class="ffpt-sechead"><div class="ffpt-sectitle">Fitness</div><button class="ffpt-add" onclick="teamMarkCreateOpen()" title="Add a mark">+</button></div>';
    if (!fits.length) {
      html += '<div class="ffpt-card" style="text-align:center;color:var(--ffp-text-muted,#5a6b6e);font-size:13px;">No marks yet. Add a fitness mark (3km, beep test, etc.) and record results.</div>';
    } else {
      if (S.ovMark >= fits.length) S.ovMark = 0;
      var f = fits[S.ovMark] || fits[0];
      html += '<div class="ffpt-hero">';
      html += '<div class="h-pills">' + fits.map(function (x, i) {
        return '<button class="ffpt-pill' + (i === S.ovMark ? ' on' : '') + '" onclick="teamOvMark(' + i + ')">' + _tEsc(x.name) + '</button>';
      }).join('') + '</div>';
      var hitTxt = (f.hit != null) ? (f.hit + ' hit' + (f.target != null ? ' target' : '')) : '';
      html += '<div class="ffpt-bighead"><div><div class="ffpt-big">' + _fmtVal(f.avg, f.unit) + '</div><div class="ffpt-biglab">Team average' + (hitTxt ? ' · ' + hitTxt : '') + '</div></div>';
      if (f.target != null) html += '<div style="text-align:right;"><div style="font-size:13px;font-weight:800;color:var(--ffp-yellow,#FFCC00);">Target ' + _fmtVal(f.target, f.unit) + '</div></div>';
      html += '</div>';
      html += _barGraph(f);
      html += '</div>';
    }

    // ── DOING THE WORK ──
    html += '<div class="ffpt-band"></div>';
    html += '<div class="ffpt-sechead"><div class="ffpt-sectitle">Doing the work</div></div>';
    html += '<div class="ffpt-seg">' +
      '<button class="ffpt-segbtn' + (S.workView === 'today' ? ' on' : '') + '" onclick="teamWork(\'today\')">Today</button>' +
      '<button class="ffpt-segbtn' + (S.workView === 'yesterday' ? ' on' : '') + '" onclick="teamWork(\'yesterday\')">Yesterday</button>' +
      '<button class="ffpt-segbtn' + (S.workView === 'week' ? ' on' : '') + '" onclick="teamWork(\'week\')">7 days</button>' +
      '</div>';
    html += '<div id="ffpt-work"></div>';

    // ── SKILLS ──
    var sk = ov.skills || [];
    html += '<div class="ffpt-band"></div>';
    html += '<div class="ffpt-sechead"><div class="ffpt-sectitle">Skills</div><button class="ffpt-add" onclick="teamSkillCreateOpen()" title="Add a skill">+</button></div>';
    if (!sk.length) {
      html += '<div class="ffpt-card" style="text-align:center;color:var(--ffp-text-muted,#5a6b6e);font-size:13px;">No skills yet. Add a skill (Snatch, first touch…) with its levels.</div>';
    } else {
      if (S.ovSkill >= sk.length) S.ovSkill = 0;
      html += '<div class="h-pills" style="margin-bottom:12px;">' + sk.map(function (x, i) {
        return '<button class="ffpt-pill' + (i === S.ovSkill ? ' on' : '') + '" style="' + (i === S.ovSkill ? '' : 'color:var(--ffp-text-muted,#5a6b6e);border-color:var(--ffp-border,#e4ebec);background:#fff;') + '" onclick="teamOvSkill(' + i + ')">' + _tEsc(x.name) + '</button>';
      }).join('') + '</div>';
      html += _skillColumns(sk[S.ovSkill]);
    }

    // ── WHAT THEY'RE TRAINING ──
    var tr = ov.training || [];
    if (tr.length) {
      html += '<div class="ffpt-band"></div>';
      html += '<div class="ffpt-sechead"><div class="ffpt-sectitle">What they\'re training</div><div class="ffpt-tsub">last 30 days</div></div>';
      var maxN = Math.max.apply(null, tr.map(function (x) { return x.sessions; }).concat([1]));
      html += tr.slice(0, 6).map(function (x) {
        var w = Math.max(12, Math.round(x.sessions * 100 / maxN));
        return '<div class="ffpt-trow"><div class="ffpt-tbar"><div class="fill" style="width:' + w + '%;"></div>' +
          '<div class="lab">' + _tEsc(x.category) + ' · ' + x.sessions + '</div><div class="pct">' + x.pct + '%</div></div></div>';
      }).join('');
    }

    // ── WHO NEEDS YOU ──
    var flags = ov.flags || [];
    if (flags.length) {
      html += '<div class="ffpt-band"></div>';
      html += '<div class="ffpt-sechead"><div class="ffpt-sectitle">Who needs you</div></div>';
      html += '<div class="ffpt-card" style="padding:4px 16px;">' + flags.map(function (fl) {
        return '<div class="ffpt-flag">' + _av(fl.name, fl.photo, 40, _ringFor('down')) +
          '<div><div class="r">' + _tEsc(fl.name) + '</div><div class="s">' + _tEsc(fl.reason) + '</div></div>' +
          '<button onclick="teamFlagAct(\'' + fl.member_id + '\')">' + _tEsc(fl.action || 'Open') + '</button></div>';
      }).join('') + '</div>';
    }

    body.innerHTML = html;
    _paintWork();
  }

  function _barGraph(f) {
    var bars = f.bars || [];
    var lb = _lowerBetter(f.direction);
    var vals = bars.map(function (b) { return b.value; }).filter(function (v) { return v != null; });
    if (!vals.length) return '<div style="color:#9fc0c6;font-size:12.5px;">No results recorded yet.</div>';
    // score: taller = better
    function score(v) { return lb ? -Number(v) : Number(v); }
    var scores = vals.map(score);
    var mn = Math.min.apply(null, scores), mx = Math.max.apply(null, scores);
    var span = (mx - mn) || 1;
    function pct(v) { return v == null ? 0 : Math.round(22 + 70 * (score(v) - mn) / span); }
    var avgPct = (f.avg != null) ? pct(f.avg) : null;
    var barsHtml = bars.map(function (b) {
      var p = pct(b.value);
      var better = (b.value == null) ? null : (lb ? Number(b.value) < Number(f.avg) : Number(b.value) > Number(f.avg));
      var col = b.value == null ? C.grey : (better ? C.aqua : C.coral);
      var face = b.photo ? '<img src="' + _tEsc(b.photo) + '">' : '';
      return '<div class="ffpt-bar" title="' + _tEsc(b.name) + ': ' + _fmtVal(b.value, f.unit) + '">' +
        '<div class="b-fill" style="height:' + p + '%;background:' + col + ';"></div>' +
        '<div class="b-face">' + face + '</div></div>';
    }).join('');
    var avgLine = (avgPct != null) ? '<div class="ffpt-avg" style="bottom:calc(' + avgPct + '% + 33px);"><span>avg</span></div>' : '';
    return '<div class="ffpt-bars">' + avgLine + barsHtml + '</div>';
  }

  function _paintWork() {
    var S = window.FFP_TEAM, ov = S.overview || {}, host = document.getElementById('ffpt-work'); if (!host) return;
    var work = ov.work || [], view = S.workView;
    var did, quiet;
    if (view === 'week') {
      did = work.filter(function (w) { return (w.week_n || 0) > 0; }).sort(function (a, b) { return b.week_n - a.week_n; });
      quiet = work.filter(function (w) { return !(w.week_n || 0); });
    } else {
      var key = view === 'today' ? 'today' : 'yesterday';
      did = work.filter(function (w) { return w[key]; });
      quiet = work.filter(function (w) { return !w[key]; });
    }
    var h = '';
    if (did.length) {
      h += '<div class="ffpt-strip">' + did.map(function (w) {
        var badge = (view === 'week') ? '<div class="ffpt-badge">' + w.week_n + '</div>' : (w.last_activity ? '<div class="ffpt-badge" style="background:' + C.green + ';"><span class="ms" style="font-size:11px;">check</span></div>' : '');
        return '<div class="ffpt-wk"><div style="position:relative;">' + _av(w.name, w.photo, 48, C.green) + badge + '</div><div class="nm">' + _tEsc((w.name || '').split(' ')[0]) + '</div></div>';
      }).join('') + '</div>';
    } else {
      h += '<div class="ffpt-quiet">Nobody logged ' + (view === 'week' ? 'this week' : view) + ' yet.</div>';
    }
    if (quiet.length) {
      h += '<div class="ffpt-quiet">' + (view === 'week' ? 'Quiet all week' : 'Not yet') + ' · ' + quiet.length +
        '  <button style="border:none;background:transparent;color:var(--ffp-blue,#2ba8e0);font-weight:800;font-size:12px;cursor:pointer;font-family:inherit;" onclick="teamNudgeQuiet()">Nudge</button></div>';
    }
    host.innerHTML = h;
  }

  function _skillColumns(sk) {
    if (!sk) return '';
    var levels = (sk.levels || []).slice().sort(function (a, b) { return a.level_no - b.level_no; });
    if (!levels.length) return '<div class="ffpt-card" style="font-size:12.5px;color:var(--ffp-text-muted,#5a6b6e);">No levels defined for this skill.</div>';
    var players = sk.players || [];
    var byLevel = {}; levels.forEach(function (l) { byLevel[l.level_no] = []; });
    var unassessed = [];
    players.forEach(function (p) { if (p.level_no != null && byLevel[p.level_no]) byLevel[p.level_no].push(p); else unassessed.push(p); });
    var cols = levels.map(function (l) {
      var star = (sk.target_level === l.level_no) ? ' <span class="ms" style="font-size:11px;color:var(--ffp-yellow,#FFCC00);vertical-align:middle;">star</span>' : '';
      var faces = byLevel[l.level_no].map(function (p) { return _av(p.name, p.photo, 30); }).join('') || '<span style="font-size:11px;color:var(--ffp-text-dim,#869599);">—</span>';
      return '<div class="ffpt-col"><h5>' + _tEsc(l.name) + star + '</h5><div class="faces">' + faces + '</div></div>';
    }).join('');
    var un = unassessed.length ? '<div class="ffpt-quiet" style="margin-top:8px;">Not assessed · ' + unassessed.length + '</div>' : '';
    return '<div class="ffpt-cols">' + cols + '</div>' + un;
  }

  // overview interactions
  window.teamOvMark = function (i) { window.FFP_TEAM.ovMark = i; _paintOverview(); };
  window.teamOvSkill = function (i) { window.FFP_TEAM.ovSkill = i; _paintOverview(); };
  window.teamWork = function (v) { window.FFP_TEAM.workView = v; _paintWork(); document.querySelectorAll('#ffpt-body .ffpt-segbtn').forEach(function (b) { b.classList.remove('on'); }); var idx = { today: 0, yesterday: 1, week: 2 }[v]; var btns = document.querySelectorAll('#ffpt-body .ffpt-seg .ffpt-segbtn'); if (btns[idx]) btns[idx].classList.add('on'); };
  window.teamFlagAct = function (mid) { window.FFP_TEAM.tab = 'players'; _paint(); teamSelectPlayer(mid); };
  window.teamNudgeQuiet = function () { _tToast('Nudge sent to quiet players', ''); };

  // ════════ PLAYERS ════════
  function _paintPlayers() {
    var S = window.FFP_TEAM, body = document.getElementById('ffpt-body'); if (!body) return;
    var players = S.players || [];
    if (!players.length) {
      body.innerHTML = '<div class="ffpt-card" style="text-align:center;color:var(--ffp-text-muted,#5a6b6e);font-size:13.5px;padding:32px 16px;">No players yet.<br><button class="ffpt-cta" style="margin-top:14px;" onclick="teamAddMemberOpen()">Add a player</button></div>';
      return;
    }
    var strip = '<div class="ffpt-pstrip">' + players.map(function (p) {
      var on = S.sel === p.member_id;
      var size = on ? 62 : 50;
      return '<div class="ffpt-pp' + (on ? ' on' : '') + '" onclick="teamSelectPlayer(\'' + p.member_id + '\')">' +
        _av(p.name, p.photo, size, _ringFor(p.trajectory)) +
        (on ? '<div class="nm">' + _tEsc((p.name || '').split(' ')[0]) + '</div>' : '') + '</div>';
    }).join('') + '</div>';
    body.innerHTML = strip + '<div id="ffpt-detail"><div class="ffpt-tsub" style="padding:16px;">Loading player…</div></div>';
    if (S.detail && S.detail.member && S.detail.member.id === S.sel) _paintDetail();
  }

  async function teamSelectPlayer(mid) {
    var S = window.FFP_TEAM; S.sel = mid; S.heroMark = 0; S.detail = null; S.nutri = null;
    _paintPlayers();
    try { var rd = await _tSb().rpc('pro_player_detail', { p_pro: S.pid, p_team: S.team, p_member: mid }); S.detail = (rd && rd.data) || {}; }
    catch (e) { console.error('[FFP Team] detail', e); S.detail = {}; }
    if (S.sel !== mid) return;
    _paintDetail();
    // nutrition (async, fills its slot)
    try { var rn = await _tSb().rpc('pro_player_nutrition', { p_pro: S.pid, p_member: mid }); if (S.sel === mid) { S.nutri = (rn && rn.data) || {}; _paintNutrition(); } }
    catch (e) { console.error('[FFP Team] nutrition', e); }
  }

  function _paintDetail() {
    var S = window.FFP_TEAM, d = S.detail || {}, host = document.getElementById('ffpt-detail'); if (!host) return;
    var html = '';
    var marks = d.marks || [];

    // marks hero
    if (marks.length) {
      if (S.heroMark >= marks.length) S.heroMark = 0;
      var m = marks[S.heroMark];
      html += '<div class="ffpt-hero">';
      html += '<div class="ffpt-bighead"><div><div class="ffpt-big">' + _fmtVal(m.current, m.unit) + '</div>' +
        '<div class="ffpt-biglab">' + _tEsc(m.name) + ' · PR ' + (_fmtDelta(m.current, m.previous, m.unit, m.direction) || '<span style="color:#9fc0c6;">first result</span>') + '</div></div>';
      if (m.target != null) html += '<div style="text-align:right;"><div style="font-size:13px;font-weight:800;color:var(--ffp-yellow,#FFCC00);">Target ' + _fmtVal(m.target, m.unit) + '</div><button style="margin-top:8px;padding:6px 12px;border-radius:9px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#eaf6f7;font-weight:800;font-size:12px;cursor:pointer;font-family:inherit;" onclick="teamRecordOpen(\'' + m.id + '\',\'measured\')">＋ Log</button></div>';
      else html += '<button style="padding:6px 12px;border-radius:9px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#eaf6f7;font-weight:800;font-size:12px;cursor:pointer;font-family:inherit;height:fit-content;" onclick="teamRecordOpen(\'' + m.id + '\',\'measured\')">＋ Log</button>';
      html += '</div>';
      html += _dotGraph(m);
      html += '<div class="h-pills" style="margin-top:12px;margin-bottom:0;">' + marks.map(function (x, i) {
        return '<button class="ffpt-pill' + (i === S.heroMark ? ' on' : '') + '" onclick="teamHeroMark(' + i + ')">' + _tEsc(x.name) + '</button>';
      }).join('') + '</div>';
      html += '</div>';
    } else {
      html += '<div class="ffpt-card" style="text-align:center;color:var(--ffp-text-muted,#5a6b6e);font-size:13px;">No marks set for this team yet.</div>';
    }

    // tiles
    var wk = d.week || {};
    html += '<div class="ffpt-tiles" style="margin-top:14px;">' +
      '<div class="ffpt-tile"><div class="v">' + (d.streak || 0) + '</div><div class="l">Day streak</div></div>' +
      '<div class="ffpt-tile"><div class="v">' + (wk.sessions || 0) + '</div><div class="l">This week</div></div>' +
      '<div class="ffpt-tile"><div class="v">' + _relDay(d.last_logged) + '</div><div class="l">Last logged</div></div>' +
      '</div>';

    // skills spectrum
    var sk = d.skills || [];
    if (sk.length) {
      html += '<div class="ffpt-sechead"><div class="ffpt-sectitle">Skills</div></div>';
      html += '<div class="ffpt-card">' + sk.map(function (s) {
        var maxL = s.max_level || 5, lvl = s.level_no || 0;
        var segs = '';
        for (var i = 1; i <= maxL; i++) segs += '<div class="sg" style="' + (i <= lvl ? 'background:' + SPECTRUM[Math.min(i, SPECTRUM.length) - 1] + ';' : '') + '"></div>';
        var col = lvl ? SPECTRUM[Math.min(lvl, SPECTRUM.length) - 1] : C.grey;
        var lname = s.level_name || (lvl ? ('Level ' + lvl) : 'Not assessed');
        var star = (s.target_level && lvl >= s.target_level) ? ' ✓' : '';
        return '<div class="ffpt-skrow"><div class="top"><div class="nm">' + _tEsc(s.name) + '</div>' +
          '<div class="lv" style="color:' + col + ';cursor:pointer;" onclick="teamRecordOpen(\'' + s.id + '\',\'skill\')">' + _tEsc(lname) + star + '</div></div>' +
          '<div class="ffpt-meter">' + segs + '</div></div>';
      }).join('') + '</div>';
    }

    // recent activity
    var rec = d.recent || [];
    html += '<div class="ffpt-sechead"><div class="ffpt-sectitle">Recent activity</div></div>';
    html += '<div class="ffpt-tiles" style="margin-bottom:10px;">' +
      '<div class="ffpt-tile"><div class="v">' + (wk.sessions || 0) + '</div><div class="l">7-day sessions</div></div>' +
      '<div class="ffpt-tile"><div class="v">' + (wk.distance_km || 0) + '</div><div class="l">km</div></div>' +
      '<div class="ffpt-tile"><div class="v">' + Math.round((wk.minutes || 0) / 60 * 10) / 10 + '</div><div class="l">hours</div></div>' +
      '</div>';
    if (rec.length) {
      html += '<div class="ffpt-recent">' + rec.map(function (a) {
        var meta = [a.distance_km ? (a.distance_km + ' km') : '', a.duration_min ? (a.duration_min + ' min') : '', _relDay(a.logged_at)].filter(Boolean).join(' · ');
        var ph = a.photo_url ? ('background-image:url(' + _tEsc(a.photo_url) + ');') : '';
        return '<div class="ffpt-rcard" onclick="teamOpenActivity(\'' + a.id + '\')"><div class="ph" style="' + ph + '"></div>' +
          '<div class="bd"><div class="a">' + _tEsc(a.activity || 'Activity') + '</div><div class="m">' + _tEsc(meta) + '</div></div></div>';
      }).join('') + '</div>';
    } else {
      html += '<div class="ffpt-quiet">No activity logged in the last 7 days.</div>';
    }

    // nutrition slot
    html += '<div class="ffpt-band"></div><div class="ffpt-sechead"><div class="ffpt-sectitle">Nutrition</div></div><div id="ffpt-nutri"><div class="ffpt-quiet">Loading nutrition…</div></div>';

    host.innerHTML = html;
    if (S.nutri) _paintNutrition();
  }

  function _dotGraph(m) {
    var hist = (m.history || []).filter(function (h) { return h.value != null; });
    if (hist.length < 1) return '<div style="color:#9fc0c6;font-size:12.5px;margin:8px 0;">No history yet.</div>';
    var lb = _lowerBetter(m.direction);
    var vals = hist.map(function (h) { return Number(h.value); });
    var allv = vals.concat(m.target != null ? [Number(m.target)] : []);
    var mn = Math.min.apply(null, allv), mx = Math.max.apply(null, allv), span = (mx - mn) || 1;
    function y(v) { return 90 - 78 * (Number(v) - mn) / span; } // px within 110h (invert)
    var n = hist.length, W = 100;
    function x(i) { return n === 1 ? 50 : (6 + i * (W - 12) / (n - 1)); }
    var pts = hist.map(function (h, i) { return x(i) + ',' + y(h.value); }).join(' ');
    var dots = hist.map(function (h, i) {
      var last = i === n - 1;
      return '<circle cx="' + x(i) + '" cy="' + y(h.value) + '" r="' + (last ? 3.4 : 2.2) + '" fill="' + (last ? C.yellow : '#8fdfe0') + '"/>';
    }).join('');
    var targetLine = (m.target != null) ? '<line x1="0" y1="' + y(m.target) + '" x2="100" y2="' + y(m.target) + '" stroke="' + C.yellow + '" stroke-width="0.7" stroke-dasharray="2,2" opacity="0.8"/>' : '';
    return '<div class="ffpt-dots"><svg viewBox="0 0 100 110" preserveAspectRatio="none" style="width:100%;height:100%;">' +
      targetLine +
      '<polyline points="' + pts + '" fill="none" stroke="#37E0C6" stroke-width="1.4" stroke-linejoin="round"/>' +
      dots + '</svg></div>';
  }

  function _paintNutrition() {
    var S = window.FFP_TEAM, nu = S.nutri || {}, host = document.getElementById('ffpt-nutri'); if (!host) return;
    var last7 = nu.last7 || [];
    var sel = S.nutriDay || nu.day;
    var dayName = function (ds) { try { return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(ds + 'T00:00:00').getDay()]; } catch (e) { return ''; } };
    var head = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;"><div class="ffpt-tsub">7-day avg ' + (nu.avg_kcal || 0) + ' kcal · ' + (nu.days_logged || 0) + '/7 logged</div></div>';
    var days = '<div class="ffpt-days">' + last7.map(function (d) {
      var on = d.date === sel;
      return '<div class="ffpt-day' + (on ? ' on' : '') + '" onclick="teamNutriDay(\'' + d.date + '\')"><div class="d">' + dayName(d.date) + '</div><div class="k">' + (d.logged ? (d.kcal) : '—') + '</div></div>';
    }).join('') + '</div>';

    // selected-day panel (only accurate for nu.day; other days re-fetch)
    var panel = '';
    if (sel === nu.day) {
      var meals = nu.meals || {}, mac = nu.macros || {};
      var pC = mac.protein || 0, cC = mac.carbs || 0, fC = mac.fat || 0, tot = pC + cC + fC || 1;
      var macbar = '<div class="ffpt-macro"><div style="width:' + (pC * 100 / tot) + '%;background:#2ba8e0;"></div><div style="width:' + (cC * 100 / tot) + '%;background:#FFCC00;"></div><div style="width:' + (fC * 100 / tot) + '%;background:#FF7A66;"></div></div>';
      var macLab = '<div style="display:flex;gap:14px;font-size:11.5px;font-weight:700;color:var(--ffp-text-muted,#5a6b6e);margin-bottom:4px;"><span style="color:#2ba8e0;">P ' + Math.round(pC) + 'g</span><span style="color:#c99b00;">C ' + Math.round(cC) + 'g</span><span style="color:#e0674f;">F ' + Math.round(fC) + 'g</span></div>';
      var mealIcons = { breakfast: 'wb_twilight', lunch: 'lunch_dining', dinner: 'dinner_dining', snacks: 'bakery_dining' };
      var mealsHtml = ['breakfast', 'lunch', 'dinner', 'snacks'].map(function (k) {
        var items = meals[k] || []; if (!items.length) return '';
        var kc = items.reduce(function (t, it) { return t + (it.calories || 0); }, 0);
        return '<div class="ffpt-meal"><div class="mh"><span class="ms" style="font-size:16px;color:var(--ffp-blue,#2ba8e0);">' + mealIcons[k] + '</span>' + k.charAt(0).toUpperCase() + k.slice(1) + ' <span style="margin-left:auto;color:var(--ffp-text-muted,#5a6b6e);">' + kc + ' kcal</span></div>' +
          items.map(function (it) { return '<div class="it"><span>' + _tEsc(it.food_name || 'Item') + '</span><span>' + (it.calories || 0) + '</span></div>'; }).join('') + '</div>';
      }).join('');
      var w = nu.water || {}, wpct = w.goal ? Math.min(100, Math.round((w.ml || 0) * 100 / w.goal)) : 0;
      var hyd = '<div class="ffpt-hyd"><div style="display:flex;justify-content:space-between;font-size:12.5px;font-weight:800;margin-bottom:6px;"><span><span class="ms" style="font-size:15px;color:var(--ffp-blue,#2ba8e0);vertical-align:middle;">local_drink</span> Hydration</span><span style="color:var(--ffp-blue,#2ba8e0);">' + ((w.ml || 0) / 1000).toFixed(1) + ' / ' + ((w.goal || 3000) / 1000).toFixed(1) + ' L</span></div><div class="bar"><div class="fill" style="width:' + wpct + '%;"></div></div></div>';
      panel = '<div class="ffpt-card" style="margin-top:12px;"><div style="display:flex;align-items:baseline;justify-content:space-between;"><div style="font-size:24px;font-weight:900;">' + (nu.day_total || 0) + ' <span style="font-size:13px;color:var(--ffp-text-muted,#5a6b6e);">kcal</span></div></div>' +
        macbar + macLab + (mealsHtml || '<div class="ffpt-quiet">Nothing logged this day.</div>') + hyd + '</div>';
    } else {
      panel = '<div class="ffpt-card" style="margin-top:12px;"><div class="ffpt-quiet">Loading day…</div></div>';
    }
    host.innerHTML = head + days + panel;
  }

  async function teamNutriDay(dateStr) {
    var S = window.FFP_TEAM; S.nutriDay = dateStr;
    _paintNutrition();
    try {
      var rn = await _tSb().rpc('pro_player_nutrition', { p_pro: S.pid, p_member: S.sel, p_day: dateStr });
      S.nutri = (rn && rn.data) || {}; S.nutriDay = dateStr;
      _paintNutrition();
    } catch (e) { console.error('[FFP Team] nutrition day', e); }
  }

  window.teamSelectPlayer = teamSelectPlayer;
  window.teamHeroMark = function (i) { window.FFP_TEAM.heroMark = i; _paintDetail(); };
  window.teamNutriDay = teamNutriDay;
  window.teamOpenActivity = function (id) { if (typeof openProClientProfile === 'function') { /* activity detail not yet a modal */ } _tToast('Activity: ' + id, ''); };

  function _relDay(iso) {
    if (!iso) return '—';
    var d = new Date(iso), now = new Date();
    var days = Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000);
    if (days <= 0) return 'Today'; if (days === 1) return 'Yest'; if (days < 7) return days + 'd'; return Math.floor(days / 7) + 'w';
  }

  // ════════ MANAGE — create team / add member / marks / skills / record ════════
  function _foot(saveLabel, saveFn) {
    return '<button class="ffpt-cta" style="background:var(--ffp-bg-3,#eef3f4);color:var(--ffp-text,#0f2327);" onclick="ffpCloseModal&&ffpCloseModal()">Cancel</button>' +
      '<button class="ffpt-cta" style="margin-left:8px;" onclick="' + saveFn + '">' + saveLabel + '</button>';
  }
  function _closeModal() { var ov = document.getElementById('ffp-modal'); if (ov) ov.classList.remove('show'); }
  window.ffpCloseModal = window.ffpCloseModal || _closeModal;

  window.teamCreateOpen = function () {
    var body = '<label class="ffpt-mlab">Team name</label><input class="ffpt-in" id="tc-name" placeholder="e.g. Riverside U18s">' +
      '<label class="ffpt-mlab">Sport</label><input class="ffpt-in" id="tc-sport" placeholder="e.g. Football">' +
      '<label class="ffpt-mlab">Type</label><input class="ffpt-in" id="tc-type" placeholder="e.g. Squad / Class / 1-on-1s">';
    openModalShell('sm', 'Create a team', body, _foot('Create', 'teamCreateSave()'));
  };
  window.teamCreateSave = async function () {
    var S = window.FFP_TEAM;
    var name = (document.getElementById('tc-name') || {}).value || '';
    if (!name.trim()) { _tToast('Give the team a name', 'error'); return; }
    try {
      var r = await _tSb().rpc('pro_team_create', { p_pro: S.pid, p_name: name.trim(), p_type: (document.getElementById('tc-type') || {}).value || null, p_sport: (document.getElementById('tc-sport') || {}).value || null });
      _closeModal(); S.team = (r && r.data) || null; _tToast('Team created', ''); renderTeam();
    } catch (e) { console.error(e); _tToast('Could not create team', 'error'); }
  };

  window.teamGearOpen = async function () {
    var S = window.FFP_TEAM, team = (S.teams || []).find(function (t) { return t.id === S.team; }) || {};
    var body = '<label class="ffpt-mlab">Team name</label><input class="ffpt-in" id="tg-name" value="' + _tEsc(team.name || '') + '">' +
      '<div style="margin-top:16px;"><button class="ffpt-cta" style="width:100%;" onclick="teamAddMemberOpen()">＋ Add a player</button></div>' +
      '<label class="ffpt-mlab" style="margin-top:18px;">Roster</label><div id="tg-roster" style="font-size:13px;color:var(--ffp-text-muted,#5a6b6e);">Loading…</div>';
    openModalShell('sm', 'Team settings', body, _foot('Save name', 'teamRename()'));
    // load roster (players list already has names)
    var roster = (S.players || []).map(function (p) {
      return '<div style="display:flex;align-items:center;gap:9px;padding:7px 0;border-top:1px solid var(--ffp-border,#e4ebec);">' + _av(p.name, p.photo, 32) +
        '<span style="font-weight:700;color:var(--ffp-text,#0f2327);">' + _tEsc(p.name) + '</span>' +
        '<button style="margin-left:auto;border:none;background:transparent;color:var(--ffp-red,#e24b4a);font-weight:800;cursor:pointer;font-family:inherit;" onclick="teamRemoveMember(\'' + p.member_id + '\',\'' + _tEsc((p.name || '').replace(/'/g, '')) + '\')">Remove</button></div>';
    }).join('') || '<div>No players yet.</div>';
    var host = document.getElementById('tg-roster'); if (host) host.innerHTML = roster;
  };
  window.teamRename = async function () {
    var S = window.FFP_TEAM, name = (document.getElementById('tg-name') || {}).value || '';
    if (!name.trim()) { _tToast('Name can\'t be empty', 'error'); return; }
    try { await _tSb().rpc('pro_team_update', { p_pro: S.pid, p_team: S.team, p_name: name.trim() }); _closeModal(); _tToast('Saved', ''); renderTeam(); }
    catch (e) { console.error(e); _tToast('Could not save', 'error'); }
  };
  window.teamRemoveMember = function (mid, name) {
    var S = window.FFP_TEAM;
    var go = async function () {
      try { await _tSb().rpc('pro_team_remove_member', { p_pro: S.pid, p_team: S.team, p_member: mid }); _tToast('Removed', ''); _closeModal(); _load(S.team); }
      catch (e) { console.error(e); _tToast('Could not remove', 'error'); }
    };
    if (typeof ffpConfirm === 'function') ffpConfirm({ danger: true, title: 'Remove ' + (name || 'player') + '?', body: 'They\'ll no longer show in this team.', action: 'Remove', onOk: go }); else go();
  };

  window.teamAddMemberOpen = async function () {
    var S = window.FFP_TEAM;
    var body = '<div id="tam-list" style="max-height:52vh;overflow:auto;">Loading your clients…</div>' +
      '<div style="margin-top:10px;font-size:12px;color:var(--ffp-text-dim,#869599);">Only your Passport clients appear here. They log activity + meals to their Passport; it flows to this team.</div>';
    openModalShell('sm', 'Add a player', body, '<button class="ffpt-cta" style="background:var(--ffp-bg-3,#eef3f4);color:var(--ffp-text,#0f2327);" onclick="ffpCloseModal()">Done</button>');
    var existing = {}; (S.players || []).forEach(function (p) { existing[p.member_id] = 1; });
    var cands = [];
    try { var r = await _tSb().rpc('pro_team_candidate_members', { p_pro: S.pid }); cands = (r && r.data) || []; } catch (e) { console.error(e); }
    var host = document.getElementById('tam-list'); if (!host) return;
    if (!cands.length) { host.innerHTML = '<div style="color:var(--ffp-text-muted,#5a6b6e);font-size:13px;padding:8px 0;">No Passport clients yet. Invite clients from the Clients tab first.</div>'; return; }
    host.innerHTML = cands.map(function (c) {
      var added = existing[c.id];
      return '<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-top:1px solid var(--ffp-border,#e4ebec);">' + _av(c.name, c.photo, 36) +
        '<div style="min-width:0;"><div style="font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + _tEsc(c.name) + '</div><div style="font-size:11px;color:var(--ffp-text-dim,#869599);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + _tEsc(c.email || '') + '</div></div>' +
        '<button id="tam-b-' + c.id + '" style="margin-left:auto;padding:7px 13px;border-radius:9px;border:none;font-weight:800;cursor:pointer;font-family:inherit;' + (added ? 'background:var(--ffp-bg-3,#eef3f4);color:var(--ffp-text-dim,#869599);' : 'background:var(--ffp-purple,#0a3e44);color:#fff;') + '" ' + (added ? 'disabled' : '') + ' onclick="teamAddMember(\'' + c.id + '\',\'' + _tEsc((c.name || '').replace(/'/g, '')) + '\')">' + (added ? 'Added' : 'Add') + '</button></div>';
    }).join('');
  };
  window.teamAddMember = async function (mid, name) {
    var S = window.FFP_TEAM;
    var btn = document.getElementById('tam-b-' + mid);
    try {
      await _tSb().rpc('pro_team_add_member', { p_pro: S.pid, p_team: S.team, p_member: mid, p_full_name: name || null });
      if (btn) { btn.textContent = 'Added'; btn.disabled = true; btn.style.background = 'var(--ffp-bg-3,#eef3f4)'; btn.style.color = 'var(--ffp-text-dim,#869599)'; }
      // refresh players in the background
      try { var rp = await _tSb().rpc('pro_team_players', { p_pro: S.pid, p_team: S.team }); S.players = ((rp && rp.data) || {}).players || []; } catch (e) {}
    } catch (e) { console.error(e); _tToast('Could not add', 'error'); }
  };

  window.teamMarkCreateOpen = function () {
    var body = '<label class="ffpt-mlab">Mark name</label><input class="ffpt-in" id="mk-name" placeholder="e.g. 3km run, Beep test">' +
      '<label class="ffpt-mlab">Unit</label><input class="ffpt-in" id="mk-unit" placeholder="e.g. s (seconds), level, kg">' +
      '<label class="ffpt-mlab">Target (optional)</label><input class="ffpt-in" id="mk-target" inputmode="decimal" placeholder="e.g. 900">' +
      '<label class="ffpt-mlab">Better is…</label><select class="ffpt-in" id="mk-dir"><option value="lower">Lower (faster / less time)</option><option value="higher">Higher (more / further)</option></select>' +
      '<div style="margin-top:8px;font-size:12px;color:var(--ffp-text-dim,#869599);">Tip: for times use unit "s" — it shows as m:ss.</div>';
    openModalShell('sm', 'Add a fitness mark', body, _foot('Create', 'teamMarkCreateSave()'));
  };
  window.teamMarkCreateSave = async function () {
    var S = window.FFP_TEAM, name = (document.getElementById('mk-name') || {}).value || '';
    if (!name.trim()) { _tToast('Name the mark', 'error'); return; }
    var tv = (document.getElementById('mk-target') || {}).value; tv = tv === '' ? null : Number(tv);
    try {
      await _tSb().rpc('pro_benchmark_upsert', { p_pro: S.pid, p_team: S.team, p_kind: 'measured', p_name: name.trim(), p_unit: (document.getElementById('mk-unit') || {}).value || null, p_target_value: tv, p_direction: (document.getElementById('mk-dir') || {}).value || 'lower' });
      _closeModal(); _tToast('Mark added', ''); _load(S.team);
    } catch (e) { console.error(e); _tToast('Could not add mark', 'error'); }
  };

  window.teamSkillCreateOpen = function () {
    var body = '<label class="ffpt-mlab">Skill name</label><input class="ffpt-in" id="sk-name" placeholder="e.g. Snatch, First touch">' +
      '<label class="ffpt-mlab">Levels (one per line, low → high)</label>' +
      '<textarea class="ffpt-in" id="sk-levels" rows="5" style="resize:vertical;">Developing\nCompetent\nProficient\nAdvanced\nElite</textarea>' +
      '<label class="ffpt-mlab">Target level (number)</label><input class="ffpt-in" id="sk-target" inputmode="numeric" placeholder="e.g. 3">';
    openModalShell('sm', 'Add a skill', body, _foot('Create', 'teamSkillCreateSave()'));
  };
  window.teamSkillCreateSave = async function () {
    var S = window.FFP_TEAM, name = (document.getElementById('sk-name') || {}).value || '';
    if (!name.trim()) { _tToast('Name the skill', 'error'); return; }
    var lines = ((document.getElementById('sk-levels') || {}).value || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
    if (lines.length < 2) { _tToast('Add at least 2 levels', 'error'); return; }
    var levels = lines.map(function (nm, i) { return { level_no: i + 1, name: nm }; });
    var tl = (document.getElementById('sk-target') || {}).value; tl = tl === '' ? null : Number(tl);
    try {
      await _tSb().rpc('pro_benchmark_upsert', { p_pro: S.pid, p_team: S.team, p_kind: 'skill', p_name: name.trim(), p_target_level: tl, p_levels: levels });
      _closeModal(); _tToast('Skill added', ''); _load(S.team);
    } catch (e) { console.error(e); _tToast('Could not add skill', 'error'); }
  };

  // record a result for the CURRENTLY selected player
  window.teamRecordOpen = function (benchId, kind) {
    var S = window.FFP_TEAM;
    if (!S.sel) { _tToast('Open a player first', 'error'); return; }
    var pname = (S.detail && S.detail.member && S.detail.member.name) || 'player';
    var body;
    if (kind === 'skill') {
      var sk = (S.detail.skills || []).find(function (x) { return x.id === benchId; }) || {};
      var maxL = sk.max_level || 5;
      var opts = '';
      for (var i = 1; i <= maxL; i++) opts += '<option value="' + i + '"' + (sk.level_no === i ? ' selected' : '') + '>Level ' + i + (sk.level_name && sk.level_no === i ? ' · ' + _tEsc(sk.level_name) : '') + '</option>';
      body = '<div style="font-size:13px;color:var(--ffp-text-muted,#5a6b6e);margin-bottom:6px;">' + _tEsc(sk.name || 'Skill') + ' — ' + _tEsc(pname) + '</div>' +
        '<label class="ffpt-mlab">Level</label><select class="ffpt-in" id="rec-level">' + opts + '</select>' +
        '<label class="ffpt-mlab">Note (optional)</label><input class="ffpt-in" id="rec-note" placeholder="What you saw">';
      openModalShell('sm', 'Assess skill', body, _foot('Save', 'teamRecordSave(\'' + benchId + '\',\'skill\')'));
    } else {
      var mk = (S.detail.marks || []).find(function (x) { return x.id === benchId; }) || {};
      body = '<div style="font-size:13px;color:var(--ffp-text-muted,#5a6b6e);margin-bottom:6px;">' + _tEsc(mk.name || 'Mark') + ' — ' + _tEsc(pname) + '</div>' +
        '<label class="ffpt-mlab">Result' + (mk.unit ? ' (' + _tEsc(mk.unit) + ')' : '') + '</label><input class="ffpt-in" id="rec-value" inputmode="decimal" placeholder="' + (mk.unit && /^s/i.test(mk.unit) ? 'seconds, e.g. 930' : 'value') + '">' +
        '<label class="ffpt-mlab">Date</label><input class="ffpt-in" id="rec-date" type="date" value="' + _todayStr() + '">' +
        '<label class="ffpt-mlab">Note (optional)</label><input class="ffpt-in" id="rec-note" placeholder="Conditions, effort…">';
      openModalShell('sm', 'Log a result', body, _foot('Save', 'teamRecordSave(\'' + benchId + '\',\'measured\')'));
    }
  };
  window.teamRecordSave = async function (benchId, kind) {
    var S = window.FFP_TEAM, args = { p_pro: S.pid, p_benchmark: benchId, p_member: S.sel, p_note: (document.getElementById('rec-note') || {}).value || null };
    if (kind === 'skill') {
      args.p_level_no = Number((document.getElementById('rec-level') || {}).value) || null;
    } else {
      var v = (document.getElementById('rec-value') || {}).value;
      if (v === '' || isNaN(Number(v))) { _tToast('Enter a number', 'error'); return; }
      args.p_value = Number(v);
      args.p_recorded_on = (document.getElementById('rec-date') || {}).value || null;
    }
    try {
      await _tSb().rpc('pro_benchmark_record', args);
      _closeModal(); _tToast('Saved', '');
      // reload detail + overview so bars/graphs update
      var mid = S.sel;
      try { var rd = await _tSb().rpc('pro_player_detail', { p_pro: S.pid, p_team: S.team, p_member: mid }); S.detail = (rd && rd.data) || {}; } catch (e) {}
      try { var ro = await _tSb().rpc('pro_team_overview', { p_pro: S.pid, p_team: S.team }); S.overview = (ro && ro.data) || {}; } catch (e) {}
      try { var rp = await _tSb().rpc('pro_team_players', { p_pro: S.pid, p_team: S.team }); S.players = ((rp && rp.data) || {}).players || []; } catch (e) {}
      if (S.tab === 'players') { _paintPlayers(); _paintDetail(); } else _paintOverview();
    } catch (e) { console.error(e); _tToast('Could not save', 'error'); }
  };

  window.teamSwitchOpen = function () {
    var S = window.FFP_TEAM;
    var body = (S.teams || []).map(function (t) {
      return '<button style="display:flex;width:100%;align-items:center;gap:10px;padding:12px;border:1px solid var(--ffp-border,#e4ebec);border-radius:12px;background:' + (t.id === S.team ? 'var(--ffp-bg-3,#eef3f4)' : '#fff') + ';margin-bottom:8px;cursor:pointer;font-family:inherit;text-align:left;" onclick="teamSwitch(\'' + t.id + '\')">' +
        '<span class="ms" style="color:var(--ffp-purple,#0a3e44);">groups</span><div><div style="font-weight:800;">' + _tEsc(t.name) + '</div><div style="font-size:12px;color:var(--ffp-text-muted,#5a6b6e);">' + (t.member_count || 0) + ' players</div></div></button>';
    }).join('') + '<button class="ffpt-cta" style="width:100%;margin-top:6px;" onclick="teamCreateOpen()">＋ New team</button>';
    openModalShell('sm', 'Your teams', body, '<button class="ffpt-cta" style="background:var(--ffp-bg-3,#eef3f4);color:var(--ffp-text,#0f2327);" onclick="ffpCloseModal()">Close</button>');
  };
  window.teamSwitch = function (id) { window.FFP_TEAM.team = id; _closeModal(); _load(id); };

  function _todayStr() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }

  // expose entry + tab
  window.renderTeam = renderTeam;
  window.teamTab = teamTab;

  // first open (renderPanel('team') also calls this once the script loads)
  try { if (document.getElementById('team-body')) renderTeam(); } catch (e) {}
})();
