// ════════════════════════════════════════════════════════════════════════
// FFP Professional — TEAM · coach tracks their squad.
// Built to the THREE LOCKED designs (Grant, 2026-07-06 — "LOCK THIS ALL IN"):
//   • CREATE PAGE  (create_team_v4) — intro hero + 3 steps; Type = Sports team /
//     Community / Friends group; Sport = searchable taxonomy (FFP_TAX.activities);
//     Team name + Description; gradient Create button.
//   • OVERVIEW     (pro_overview_fitness_header_v2) — ONE white card: blended DARK
//     hero (team id + TEAM AVG + per-player bar graph + mark pills, active=YELLOW)
//     → underline tabs → Doing the work (Today/Yest/7d) → Skills (level columns) →
//     What they're training (patterned bars) → Who needs you.
//   • PLAYERS      (pro_players_full_card) — team header → avatar strip (trajectory
//     ring+arrow) → marks dot hero → streak/week tiles → spectrum skills → recent
//     activity → nutrition (7-day selector + meals/macros + hydration).
// renderPanel('team') → renderTeam(). Material Icons (.ffpt-ms). RPCs: pro_teams_list,
// pro_team_overview/players, pro_player_detail/nutrition, pro_team_candidate_members,
// pro_team_create/update, pro_team_add_member/remove_member, pro_benchmark_upsert/record.
// ════════════════════════════════════════════════════════════════════════

(function () {
  'use strict';
  window.FFP_TEAM = window.FFP_TEAM || {};

  function _tPid() { return (window.FFP_PROVIDER || {}).id || null; }
  function _tEsc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function _tToast(m, t) { if (typeof showToast === 'function') showToast(m, t); }
  function _tSb() { return window.supabase; }
  function _lowerBetter(dir) { return /^(lower|down|less|desc|faster)$/i.test(dir || ''); }
  function _initials(name) { var p = (name || '').trim().split(/\s+/); return (((p[0] || '')[0] || '') + ((p[1] || '')[0] || '')).toUpperCase(); }
  function _todayStr() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function _ic(n, s, c) { return '<span class="ffpt-ms" style="font-size:' + (s || 16) + 'px;' + (c ? 'color:' + c + ';' : '') + '">' + n + '</span>'; }

  function _fmtVal(v, unit) {
    if (v == null || v === '') return '—';
    v = Number(v);
    if (unit && /^s/i.test(unit)) { var s = Math.round(v), m = Math.floor(s / 60), ss = s % 60; return m + ':' + (ss < 10 ? '0' : '') + ss; }
    return (Math.round(v * 10) / 10) + (unit ? ' ' + _tEsc(unit) : '');
  }
  function _fmtGap(a, b, unit) { var d = Math.abs(Number(a) - Number(b)); if (unit && /^s/i.test(unit)) return Math.round(d) + 's'; return (Math.round(d * 10) / 10) + (unit ? ' ' + _tEsc(unit) : ''); }
  function _relDay(iso) {
    if (!iso) return '—';
    var d = new Date(iso), now = new Date();
    var days = Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000);
    if (days <= 0) return 'Today'; if (days === 1) return 'Yesterday'; if (days < 7) return days + 'd'; return Math.round(days / 7) + 'w';
  }
  function _sportIcon(cat, act) {
    var s = ((cat || '') + ' ' + (act || '')).toLowerCase();
    if (/run|jog/.test(s)) return 'directions_run';
    if (/cycl|bike|ride/.test(s)) return 'directions_bike';
    if (/swim/.test(s)) return 'pool';
    if (/gym|strength|weight|lift/.test(s)) return 'fitness_center';
    if (/football|soccer/.test(s)) return 'sports_soccer';
    if (/mobil|stretch|yoga|recover/.test(s)) return 'self_improvement';
    if (/walk/.test(s)) return 'directions_walk';
    if (/skill|drill|technique/.test(s)) return 'my_location';
    if (/team|training|practice|session/.test(s)) return 'groups';
    return 'fitness_center';
  }
  var SPECTRUM = ['#e24b4a', '#f0932b', '#37b06a', '#2ba8e0', '#8b5cf6'];

  // avatar: initials or photo; ring = box-shadow ring colour; bg/fg override
  function _av(name, photo, size, ring, bg, fg) {
    size = size || 42;
    var st = 'width:' + size + 'px;height:' + size + 'px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:' + Math.round(size * 0.3) + 'px;flex:0 0 auto;overflow:hidden;background:' + (bg || '#e5f6f1') + ';color:' + (fg || '#0a3e44') + ';';
    if (ring) st += 'box-shadow:0 0 0 2.5px ' + ring + ';';
    var inner = photo ? '<img src="' + _tEsc(photo) + '" style="width:100%;height:100%;object-fit:cover;">' : _tEsc(_initials(name));
    return '<span style="' + st + '">' + inner + '</span>';
  }

  function _styles() {
    if (document.getElementById('ffpt-styles')) return;
    var s = document.createElement('style'); s.id = 'ffpt-styles';
    s.textContent = [
      // FULL BLEED: break out of .main-scroll padding (18/26 desktop, 14/14 mobile) so Team pages are edge-to-edge.
      '.ffpt{font-family:Montserrat,-apple-system,system-ui,sans-serif;margin:-18px -26px 0;}',
      '@media (max-width:859px){.ffpt{margin:-14px -14px 0;}}',
      '.ffpt-ms{font-family:"Material Icons";font-style:normal;line-height:1;vertical-align:middle;}',
      '.ffpt-card{background:#fff;border:none;border-radius:0;max-width:none;margin:0;box-shadow:none;overflow:hidden;min-height:calc(100dvh - 96px);}',
      '.ffpt-cardg{background:#eef3f4;border:none;border-radius:0;max-width:none;margin:0;box-shadow:none;overflow:hidden;min-height:calc(100dvh - 96px);}',
      '.ffpt-hero{position:relative;background:radial-gradient(120% 95% at 50% 0%,#0f3b4a 0%,#0a1a24 62%,#06121a 100%);padding:15px 16px 16px;overflow:hidden;}',
      '.ffpt-glow{position:absolute;top:-40px;right:-30px;width:230px;height:180px;background:radial-gradient(circle,rgba(43,168,224,.26),transparent 62%);pointer-events:none;}',
      '.ffpt-logo{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,#2ba8e0,#0a3e44);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:11px;flex:0 0 auto;}',
      '.ffpt-tabrow{display:flex;gap:22px;padding:0 16px;border-bottom:1px solid #e4ebec;}',
      '.ffpt-tab{padding:11px 0;font-size:13px;font-weight:700;color:#869599;cursor:pointer;background:none;border:none;font-family:inherit;}',
      '.ffpt-tab.on{font-weight:800;color:#0a3e44;border-bottom:3px solid #0a3e44;margin-bottom:-1px;}',
      '.ffpt-pill{border-radius:16px;padding:5px 13px;font-size:11px;font-weight:700;cursor:pointer;background:rgba(255,255,255,.12);color:rgba(255,255,255,.75);border:none;font-family:inherit;flex:0 0 auto;}',
      '.ffpt-pill.on{background:#fff;color:#0a3e44;font-weight:800;}',
      '.ffpt-pill.ony{background:#FFCC00;color:#0a3e44;font-weight:800;}',
      '.ffpt-sec{padding:16px;}',
      '.ffpt-band{height:8px;background:#eef3f4;}',
      '.st{font-size:15px;font-weight:800;color:#0f2327;}',
      '.ffpt-scroll{display:flex;gap:14px;overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none;padding:2px 0;}.ffpt-scroll::-webkit-scrollbar{display:none;}',
      '.ffpt-bd{position:absolute;bottom:-3px;right:-4px;width:18px;height:18px;border-radius:50%;background:#0a3e44;color:#fff;border:2px solid #fff;display:flex;align-items:center;justify-content:center;}',
      '.ffpt-ab{position:absolute;bottom:-2px;right:-3px;width:17px;height:17px;border-radius:50%;color:#fff;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;}',
      '.ffpt-seg{display:flex;background:#eef3f4;border-radius:8px;padding:3px;}',
      '.ffpt-seg button{border:none;background:none;color:#5a6b6e;padding:5px 10px;font-size:11px;font-weight:700;border-radius:6px;cursor:pointer;font-family:inherit;}',
      '.ffpt-seg button.on{background:#0a3e44;color:#fff;font-weight:800;}',
      '.ffpt-sm{width:30px;height:30px;border-radius:50%;background:#f7eded;color:#c1706f;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:10px;flex:0 0 auto;}',
      '.ffpt-tile{flex:1;background:#f4f7f8;border-radius:12px;padding:11px 6px;text-align:center;}',
      '.ffpt-tile .tv{font-size:17px;font-weight:800;color:#0f2327;line-height:1;}',
      '.ffpt-tile .tl{font-size:8.5px;font-weight:800;text-transform:uppercase;letter-spacing:.3px;color:#869599;margin-top:4px;}',
      '.ffpt-spec{display:flex;gap:3px;}.ffpt-spec div{flex:1;height:9px;border-radius:3px;}',
      '.ffpt-act{flex:0 0 auto;width:146px;background:#fff;border:1px solid #e4ebec;border-radius:14px;overflow:hidden;box-shadow:0 6px 16px rgba(10,62,68,.07);cursor:pointer;}',
      '.ffpt-day{flex:0 0 auto;width:42px;text-align:center;background:#f4f7f8;border-radius:10px;padding:8px 0;cursor:pointer;}',
      '.ffpt-day .dd{font-size:10px;font-weight:800;color:#869599;}.ffpt-day .dk{font-size:10px;font-weight:800;color:#0f2327;margin-top:3px;}',
      '.ffpt-day.on{background:#0a3e44;}.ffpt-day.on .dd,.ffpt-day.on .dk{color:#fff;}',
      '.ffpt-meal{display:flex;align-items:center;gap:11px;padding:9px 0;}',
      '.ffpt-mi{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex:0 0 auto;}',
      '.ffpt-kc{font-size:11px;font-weight:800;color:#0a3e44;background:#f4f7f8;border-radius:7px;padding:4px 8px;}',
      '.ffpt-tbar{flex:1;height:24px;border-radius:6px;background:#eef3f4;overflow:hidden;position:relative;}',
      // create page
      '.ffpt-clab{font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;color:#869599;margin-bottom:9px;}',
      '.ffpt-in{width:100%;background:#fff;border:1px solid #e4ebec;border-radius:12px;padding:14px 15px;font-size:15px;font-weight:600;font-family:inherit;color:#0f2327;box-sizing:border-box;}',
      '.ffpt-in::placeholder{color:#a8b4b6;font-weight:500;}',
      '.ffpt-sn{width:24px;height:24px;border-radius:50%;background:rgba(55,224,198,.16);color:#37E0C6;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;flex:0 0 auto;}',
      '.ffpt-typ{flex:1;border-radius:12px;padding:13px 4px;text-align:center;cursor:pointer;border:1px solid #e4ebec;background:#fff;color:#5a6b6e;font-family:inherit;}',
      '.ffpt-typ.on{background:#0a3e44;color:#fff;border-color:#0a3e44;box-shadow:0 6px 16px rgba(10,62,68,.22);}',
      '.ffpt-cta{width:100%;background:linear-gradient(135deg,#0a3e44,#2ba8e0);color:#fff;border:none;border-radius:13px;padding:15px;text-align:center;font-size:14px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;box-shadow:0 10px 24px rgba(43,168,224,.32);cursor:pointer;font-family:inherit;}',
      '.ffpt-mlab{font-size:12px;font-weight:800;color:#5a6b6e;margin:12px 0 5px;display:block;}',
      '.ffpt-min{width:100%;padding:11px 12px;border:1px solid #e4ebec;border-radius:10px;font-size:16px;font-family:inherit;box-sizing:border-box;background:#fff;color:#0f2327;}'
    ].join('');
    document.head.appendChild(s);
  }

  // ════════ ENTRY ════════
  async function renderTeam() {
    var host = document.getElementById('team-body'); if (!host) return;
    _styles();
    var pid = _tPid(); var S = window.FFP_TEAM; S.pid = pid;
    if (!pid) { host.innerHTML = '<div class="ffpt" style="padding:16px;color:#5a6b6e;">Sign in to see your teams.</div>'; return; }
    host.innerHTML = '<div class="ffpt" style="padding:16px;color:#869599;font-weight:700;">Loading your team…</div>';
    try { var r = await _tSb().rpc('pro_teams_list', { p_pro: pid }); S.teams = (r && r.data) || []; }
    catch (e) { console.error('[FFP Team] list', e); S.teams = []; }
    if (!S.teams.length) { _showCreatePage(); return; }
    if (!S.team || !S.teams.find(function (t) { return t.id === S.team; })) S.team = S.teams[0].id;
    await _load(S.team);
  }

  // ════════ CREATE PAGE (locked create_team_v4) ════════
  var TYPES = [['sports', 'Sports team', 'sports_soccer'], ['community', 'Community', 'groups'], ['friends', 'Friends group', 'group']];
  function _sportOptions(sel) {
    var a = (window.FFP_TAX && FFP_TAX.activities) || [];
    var names = a.map(function (x) { return x.n || x.name; }).filter(Boolean);
    names = names.filter(function (v, i) { return names.indexOf(v) === i; }).sort();
    return '<option value="">Search sport…</option>' + names.map(function (n) { return '<option' + (n === sel ? ' selected' : '') + '>' + _tEsc(n) + '</option>'; }).join('');
  }
  function _showCreatePage() {
    var S = window.FFP_TEAM, host = document.getElementById('team-body'); if (!host) return;
    if (!S.cType) S.cType = 'sports';
    var back = S.teams && S.teams.length ? '<span onclick="teamBackFromCreate()" style="cursor:pointer;">' + _ic('arrow_back', 20, 'rgba(255,255,255,.7)') + '</span>' : _ic('shield', 20, 'rgba(255,255,255,.5)');
    host.innerHTML = '<div class="ffpt"><div class="ffpt-cardg">' +
      '<div class="ffpt-hero" style="padding:16px 18px 20px;"><div class="ffpt-glow" style="right:-30px;"></div>' +
      '<div style="position:relative;display:flex;align-items:center;gap:10px;margin-bottom:14px;">' + back + '<div style="font-size:11px;font-weight:800;letter-spacing:1.5px;color:#7fe3ea;text-transform:uppercase;">New team</div></div>' +
      '<div style="position:relative;font-size:24px;font-weight:900;color:#fff;letter-spacing:-.4px;line-height:1.1;">Create your team</div>' +
      '<div style="position:relative;font-size:13px;font-weight:600;color:rgba(255,255,255,.62);margin-top:7px;">Everything your players log to their Passport shows up here.</div>' +
      '<div style="position:relative;margin-top:16px;">' +
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:11px;"><div class="ffpt-sn">1</div><span style="font-size:12.5px;font-weight:700;color:rgba(255,255,255,.85);">Add your players</span></div>' +
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:11px;"><div class="ffpt-sn">2</div><span style="font-size:12.5px;font-weight:700;color:rgba(255,255,255,.85);">Set the marks &amp; skills that matter</span></div>' +
      '<div style="display:flex;align-items:center;gap:10px;"><div class="ffpt-sn">3</div><span style="font-size:12.5px;font-weight:700;color:rgba(255,255,255,.85);">See who\'s hitting them</span></div>' +
      '</div></div>' +
      '<div style="padding:18px 16px;">' +
      '<div class="ffpt-clab">Team name</div><input class="ffpt-in" id="tc-name" placeholder="Riverside U18s" style="margin-bottom:20px;">' +
      '<div class="ffpt-clab">Type</div><div style="display:flex;gap:8px;margin-bottom:20px;" id="tc-types">' +
      TYPES.map(function (t) { return '<button class="ffpt-typ' + (S.cType === t[0] ? ' on' : '') + '" onclick="teamCType(\'' + t[0] + '\')">' + _ic(t[2], 21) + '<div style="font-size:10.5px;font-weight:700;margin-top:5px;">' + t[1] + '</div></button>'; }).join('') + '</div>' +
      '<div class="ffpt-clab">Sport</div><div id="tc-sport-wrap" style="margin-bottom:20px;"><select class="ffpt-in" id="tc-sport">' + _sportOptions('') + '</select></div>' +
      '<div class="ffpt-clab">Description</div><textarea class="ffpt-in" id="tc-desc" rows="3" style="resize:vertical;margin-bottom:22px;" placeholder="What this team is about…"></textarea>' +
      '<button class="ffpt-cta" onclick="teamCreateSave()">Create team</button>' +
      '</div></div></div>';
    try { if (window.FFPSelect) FFPSelect.enhance(document.getElementById('tc-sport-wrap')); } catch (e) {}
  }
  window.teamCType = function (t) { window.FFP_TEAM.cType = t; document.querySelectorAll('#tc-types .ffpt-typ').forEach(function (b, i) { b.classList.toggle('on', TYPES[i][0] === t); }); };
  window.teamBackFromCreate = function () { var S = window.FFP_TEAM; if (S.teams && S.teams.length) { if (!S.team) S.team = S.teams[0].id; _load(S.team); } };
  window.teamCreateSave = async function () {
    var S = window.FFP_TEAM, name = (document.getElementById('tc-name') || {}).value || '';
    if (!name.trim()) { _tToast('Give the team a name', 'error'); return; }
    var sport = (document.getElementById('tc-sport') || {}).value || null;
    var desc = (document.getElementById('tc-desc') || {}).value || null;
    try { var r = await _tSb().rpc('pro_team_create', { p_pro: S.pid, p_name: name.trim(), p_type: S.cType || 'sports', p_sport: sport, p_description: desc }); S.team = (r && r.data) || null; S.tab = 'overview'; _tToast('Team created', ''); renderTeam(); }
    catch (e) { console.error(e); _tToast('Could not create team', 'error'); }
  };
  window.teamShowCreate = _showCreatePage;

  async function _load(teamId) {
    var S = window.FFP_TEAM; S.team = teamId;
    var host = document.getElementById('team-body');
    host.innerHTML = '<div class="ffpt" style="padding:16px;color:#869599;font-weight:700;">Reading the team…</div>';
    try { var ro = await _tSb().rpc('pro_team_overview', { p_pro: S.pid, p_team: teamId }); S.overview = (ro && ro.data) || {}; }
    catch (e) { console.error('[FFP Team] overview', e); S.overview = {}; }
    try { var rp = await _tSb().rpc('pro_team_players', { p_pro: S.pid, p_team: teamId }); S.players = ((rp && rp.data) || {}).players || []; }
    catch (e) { console.error('[FFP Team] players', e); S.players = []; }
    S.tab = S.tab || 'overview';
    S.ovMark = 0; S.ovSkill = 0; S.workView = 'today'; S.sel = null; S.detail = null; S.nutri = null; S.heroMark = 0; S.nutriDay = null;
    _paint();
  }

  function _teamMeta() { var S = window.FFP_TEAM; return (S.teams || []).find(function (t) { return t.id === S.team; }) || {}; }
  function _count() { var S = window.FFP_TEAM; return (S.overview && S.overview.member_count != null) ? S.overview.member_count : (S.players || []).length; }
  function _tabs() {
    var S = window.FFP_TEAM;
    return '<div class="ffpt-tabrow">' +
      '<button class="ffpt-tab' + (S.tab === 'overview' ? ' on' : '') + '" onclick="teamTab(\'overview\')">Overview</button>' +
      '<button class="ffpt-tab' + (S.tab === 'players' ? ' on' : '') + '" onclick="teamTab(\'players\')">Players</button></div>';
  }
  function _teamIdRow(sub) {
    var team = _teamMeta(), c = _count();
    return '<div style="position:relative;display:flex;align-items:center;gap:9px;cursor:pointer;" onclick="teamSettingsOpen()">' +
      '<div class="ffpt-logo">' + _tEsc(_initials(team.name) || 'T') + '</div>' +
      '<div style="flex:1;font-size:15px;font-weight:800;color:#fff;">' + _tEsc(team.name || 'Team') + '</div>' +
      '<div style="font-size:11px;font-weight:700;color:rgba(255,255,255,.5);">' + (sub || (c + ' player' + (c === 1 ? '' : 's'))) + '</div></div>';
  }

  function _paint() {
    var S = window.FFP_TEAM, host = document.getElementById('team-body'); if (!host) return;
    if (S.tab === 'overview') host.innerHTML = '<div class="ffpt"><div class="ffpt-card">' + _overviewHero() + _tabs() + _overviewSections() + '</div></div>';
    else {
      var detail = (S.detail && S.detail.member && S.detail.member.id === S.sel) ? _detailSections() : '<div class="ffpt-sec" style="color:#869599;font-weight:700;">Loading player…</div>';
      host.innerHTML = '<div class="ffpt"><div class="ffpt-card">' +
        '<div class="ffpt-hero" style="padding:14px 16px;">' + _teamIdRow() + '</div>' + _tabs() + _playersStrip() + '<div id="ffpt-detail">' + detail + '</div></div></div>';
    }
  }
  function teamTab(t) { var S = window.FFP_TEAM; S.tab = t; _paint(); if (t === 'players' && !S.sel) { var f = (S.players && S.players[0]) ? S.players[0].member_id : null; if (f) teamSelectPlayer(f); } }

  // ════════ OVERVIEW ════════
  function _overviewHero() {
    var S = window.FFP_TEAM, ov = S.overview || {};
    var fits = ov.fitness || []; if (S.ovMark >= fits.length) S.ovMark = 0;
    var f = fits[S.ovMark], c = _count();
    var h = '<div class="ffpt-hero"><div class="ffpt-glow"></div>' + _teamIdRow() + '<div style="height:12px;"></div>';
    if (!f) {
      h += '<div style="position:relative;color:rgba(255,255,255,.7);font-size:13px;margin-bottom:10px;">No fitness marks yet.</div>' +
        '<div style="position:relative;"><button class="ffpt-pill on" onclick="teamMarkCreateOpen()">+ Add a mark</button></div></div>';
      return h;
    }
    var hit = (f.hit != null) ? (f.hit + ' of ' + c + ' hit') : '';
    h += '<div style="position:relative;display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:11px;">' +
      '<div><div style="font-size:9.5px;font-weight:800;letter-spacing:1.5px;color:#7fe3ea;">TEAM AVG</div><div style="font-size:34px;font-weight:800;color:#fff;line-height:1;margin-top:3px;">' + _fmtVal(f.avg, f.unit) + '</div></div>' +
      '<div style="text-align:right;">' + (f.target != null ? '<div style="font-size:14px;font-weight:800;color:#37E0C6;">target ' + _fmtVal(f.target, f.unit) + '</div>' : '') + (hit ? '<div style="font-size:11px;color:rgba(255,255,255,.55);">' + hit + '</div>' : '') + '</div></div>' +
      _barSVG(f) +
      '<div style="position:relative;display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;">' +
      fits.map(function (x, i) { return '<button class="ffpt-pill' + (i === S.ovMark ? ' ony' : '') + '" onclick="teamOvMark(' + i + ')">' + _tEsc(x.name) + '</button>'; }).join('') + '</div></div>';
    return h;
  }
  function _barSVG(f) {
    var bars = f.bars || [], lb = _lowerBetter(f.direction);
    var vals = bars.map(function (b) { return b.value; }).filter(function (v) { return v != null; });
    if (!vals.length) return '<div style="position:relative;color:rgba(255,255,255,.55);font-size:12px;margin-bottom:12px;">No results recorded yet.</div>';
    function sc(v) { return lb ? -Number(v) : Number(v); }
    var scr = vals.map(sc), mn = Math.min.apply(null, scr), mx = Math.max.apply(null, scr), span = (mx - mn) || 1;
    var n = bars.length, slot = 284 / n, bw = Math.min(16, slot - 4), base = 74, top = 12;
    function hg(v) { return v == null ? 0 : Math.round(14 + (base - top - 14) * (sc(v) - mn) / span); }
    var avgH = (f.avg != null) ? hg(f.avg) : null;
    var rects = bars.map(function (b, i) {
      var x = 8 + i * slot + (slot - bw) / 2, hh = hg(b.value), y = base - hh;
      var better = (b.value == null) ? null : (lb ? Number(b.value) < Number(f.avg) : Number(b.value) > Number(f.avg));
      var col = b.value == null ? '#40525a' : (better ? '#37E0C6' : '#FF7A66');
      return '<rect x="' + x.toFixed(1) + '" y="' + y + '" width="' + bw.toFixed(1) + '" height="' + Math.max(hh, 3) + '" rx="2" fill="' + col + '"/>';
    }).join('');
    var labs = bars.map(function (b, i) { var x = 8 + i * slot + slot / 2; return '<text x="' + x.toFixed(1) + '" y="84" text-anchor="middle" font-size="7" font-weight="700" fill="rgba(255,255,255,.5)" font-family="Montserrat">' + _tEsc(_initials(b.name)) + '</text>'; }).join('');
    var avg = (avgH != null) ? '<line x1="6" y1="' + (base - avgH) + '" x2="272" y2="' + (base - avgH) + '" stroke="rgba(255,255,255,.45)" stroke-width="1.3" stroke-dasharray="4 3"/><text x="297" y="' + (base - avgH + 3) + '" text-anchor="end" font-size="8" font-weight="800" fill="rgba(255,255,255,.6)" font-family="Montserrat">avg</text>' : '';
    return '<svg viewBox="0 0 300 88" style="position:relative;width:100%;height:auto;display:block;margin-bottom:12px;" xmlns="http://www.w3.org/2000/svg">' + avg + rects + labs + '</svg>';
  }
  function _overviewSections() {
    var S = window.FFP_TEAM, ov = S.overview || {}, html = '';
    // Doing the work
    html += '<div class="ffpt-sec"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:13px;"><div class="st">Doing the work</div>' +
      '<div class="ffpt-seg"><button class="' + (S.workView === 'today' ? 'on' : '') + '" onclick="teamWork(\'today\')">Today</button><button class="' + (S.workView === 'yesterday' ? 'on' : '') + '" onclick="teamWork(\'yesterday\')">Yesterday</button><button class="' + (S.workView === 'week' ? 'on' : '') + '" onclick="teamWork(\'week\')">7d</button></div></div>';
    var work = ov.work || [], did, quiet;
    if (S.workView === 'week') { did = work.filter(function (w) { return (w.week_n || 0) > 0; }).sort(function (a, b) { return b.week_n - a.week_n; }); quiet = work.filter(function (w) { return !(w.week_n || 0); }); }
    else { var k = S.workView === 'today' ? 'today' : 'yesterday'; did = work.filter(function (w) { return w[k]; }); quiet = work.filter(function (w) { return !w[k]; }); }
    if (did.length) html += '<div class="ffpt-scroll" style="margin-bottom:15px;">' + did.map(function (w) {
      var badge = (S.workView === 'week') ? '<span class="ffpt-bd" style="font-size:9px;font-weight:900;">' + w.week_n + '</span>' : '<span class="ffpt-bd">' + _ic(_sportIcon(w.last_category, w.last_activity), 10) + '</span>';
      return '<div style="position:relative;flex:0 0 auto;" title="' + _tEsc(w.name) + '">' + _av(w.name, w.photo, 42, '#37b06a') + badge + '</div>';
    }).join('') + '</div>';
    else html += '<div style="color:#869599;font-size:12.5px;font-weight:700;margin-bottom:15px;">Nobody logged ' + (S.workView === 'week' ? 'this week' : S.workView) + ' yet.</div>';
    html += '<div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap;"><span style="font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.4px;color:#a32d2d;">' + (S.workView === 'week' ? 'Quiet all week' : 'Not yet') + ' · ' + quiet.length + '</span>' +
      quiet.slice(0, 5).map(function (w) { return '<div class="ffpt-sm">' + _tEsc(_initials(w.name)) + '</div>'; }).join('') + '<div style="flex:1;"></div>' +
      (quiet.length ? '<button style="background:#0a3e44;color:#fff;border:none;border-radius:8px;padding:6px 12px;font-size:11px;font-weight:800;font-family:inherit;cursor:pointer;" onclick="teamNudge()">Nudge</button>' : '') + '</div></div>';
    // Skills
    var sk = ov.skills || [];
    html += '<div class="ffpt-band"></div><div class="ffpt-sec">';
    if (!sk.length) html += '<div style="display:flex;align-items:center;justify-content:space-between;"><div class="st">Skills</div><span style="font-size:12px;font-weight:800;color:#0a3e44;cursor:pointer;" onclick="teamSkillCreateOpen()">+ Add ▾</span></div>';
    else {
      if (S.ovSkill >= sk.length) S.ovSkill = 0; var cur = sk[S.ovSkill];
      html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;"><div class="st">Skills</div><span style="font-size:12px;font-weight:800;color:#0a3e44;cursor:pointer;" onclick="teamSkillCycle()">' + _tEsc(cur.name) + ' ▾</span></div>' + _skillCols(cur);
    }
    html += '</div>';
    // What they're training
    var tr = ov.training || [];
    if (tr.length) {
      var mx = Math.max.apply(null, tr.map(function (x) { return x.sessions; }).concat([1]));
      html += '<div class="ffpt-band"></div><div class="ffpt-sec"><div class="st" style="margin-bottom:14px;">What they\'re training</div>' +
        tr.slice(0, 6).map(function (x, i) {
          var w = Math.max(18, Math.round(x.sessions * 100 / mx));
          var pat = i === 0 ? 'repeating-linear-gradient(45deg,#0a3e44,#0a3e44 6px,#17616b 6px,#17616b 12px)' : 'repeating-linear-gradient(45deg,#2ba8e0,#2ba8e0 6px,#57c0e8 6px,#57c0e8 12px)';
          return '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;"><span style="width:80px;font-size:12px;font-weight:700;color:#5a6b6e;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + _tEsc(x.category) + '</span><div class="ffpt-tbar"><div style="width:' + w + '%;height:100%;background:' + pat + ';"></div><span style="position:absolute;left:10px;top:0;bottom:0;display:flex;align-items:center;font-size:11.5px;font-weight:800;color:#fff;">' + x.sessions + ' session' + (x.sessions === 1 ? '' : 's') + '</span></div><span style="width:34px;text-align:right;font-size:12px;font-weight:800;color:#0f2327;">' + x.pct + '%</span></div>';
        }).join('') + '</div>';
    }
    // Who needs you
    var flags = ov.flags || [];
    if (flags.length) html += '<div class="ffpt-band"></div><div class="ffpt-sec"><div class="st" style="color:#a32d2d;margin-bottom:12px;">Who needs you</div>' +
      flags.map(function (fl) {
        return '<div style="display:flex;align-items:center;gap:11px;margin-bottom:11px;">' + _av(fl.name, fl.photo, 42, '#f0b6b6', '#fbeaea', '#a32d2d') +
          '<div style="flex:1;font-size:13px;color:#0f2327;font-weight:700;">' + _tEsc(fl.name) + ' · <b style="color:#d64545;">' + _tEsc(fl.reason) + '</b></div>' +
          '<button style="background:#0a3e44;color:#fff;border:none;border-radius:9px;padding:8px 13px;font-size:12px;font-weight:800;font-family:inherit;cursor:pointer;" onclick="teamFlag(\'' + fl.member_id + '\')">' + _tEsc(fl.action || 'Open') + '</button></div>';
      }).join('') + '</div>';
    return html;
  }
  function _skillCols(sk) {
    var levels = (sk.levels || []).slice().sort(function (a, b) { return a.level_no - b.level_no; });
    if (!levels.length) return '<div style="font-size:12.5px;color:#869599;">No levels defined.</div>';
    var players = sk.players || [], byL = {}; levels.forEach(function (l) { byL[l.level_no] = []; });
    players.forEach(function (p) { if (p.level_no != null && byL[p.level_no]) byL[p.level_no].push(p); });
    return '<div style="display:grid;grid-template-columns:repeat(' + levels.length + ',1fr);gap:6px;text-align:center;">' +
      levels.map(function (l) {
        var isT = sk.target_level === l.level_no;
        var faces = byL[l.level_no].map(function (p, i) { return '<span style="margin-left:' + (i ? -9 : 0) + 'px;">' + _av(p.name, p.photo, 30) + '</span>'; }).join('') || '<span style="font-size:11px;color:#c2cdcf;">—</span>';
        return '<div><div style="font-size:9px;font-weight:800;text-transform:uppercase;color:' + (isT ? '#0a3e44' : '#869599') + ';margin-bottom:8px;">' + _tEsc(l.name.slice(0, 7)) + (isT ? '★' : '') + '</div><div style="display:flex;justify-content:center;">' + faces + '</div></div>';
      }).join('') + '</div>';
  }
  window.teamOvMark = function (i) { window.FFP_TEAM.ovMark = i; _paint(); };
  window.teamSkillCycle = function () { var S = window.FFP_TEAM, n = (S.overview.skills || []).length; if (n) S.ovSkill = (S.ovSkill + 1) % n; _paint(); };
  window.teamWork = function (v) { window.FFP_TEAM.workView = v; _paint(); };
  window.teamNudge = function () { _tToast('Nudge sent', ''); };
  window.teamFlag = function (mid) { var S = window.FFP_TEAM; S.tab = 'players'; S.sel = null; _paint(); teamSelectPlayer(mid); };

  // ════════ PLAYERS ════════
  function _arrow(t) { return t === 'up' ? '↑' : (t === 'down' ? '↓' : '→'); }
  function _arrCol(t) { return t === 'up' ? '#37b06a' : (t === 'down' ? '#e24b4a' : '#b6c1c3'); }
  function _playersStrip() {
    var S = window.FFP_TEAM, players = S.players || [];
    if (!players.length) return '<div class="ffpt-sec" style="text-align:center;color:#5a6b6e;">No players yet.<br><button class="ffpt-cta" style="width:auto;margin-top:12px;padding:11px 20px;" onclick="teamAddMemberOpen()">Add a player</button></div>';
    return '<div style="padding:12px 16px 14px;border-bottom:1px solid #f1f4f5;"><div class="ffpt-scroll" style="gap:13px;">' +
      players.map(function (p) {
        var on = S.sel === p.member_id, ring = _arrCol(p.trajectory), down = p.trajectory === 'down';
        var badge = '<span class="ffpt-ab" style="background:' + ring + ';">' + _arrow(p.trajectory) + '</span>';
        if (on) return '<div style="text-align:center;flex:0 0 auto;cursor:pointer;" onclick="teamSelectPlayer(\'' + p.member_id + '\')"><div style="position:relative;display:inline-block;"><span style="box-shadow:0 0 0 3px #37b06a,0 0 0 5px #0a3e44;border-radius:50%;display:inline-block;">' + _av(p.name, p.photo, 50, null, down ? '#fbeaea' : '#e5f6f1', down ? '#a32d2d' : '#0a3e44') + '</span>' + badge + '</div><div style="font-size:9.5px;font-weight:800;color:#0a3e44;margin-top:5px;">' + _tEsc((p.name || '').split(' ')[0]) + '</div></div>';
        return '<div style="position:relative;flex:0 0 auto;cursor:pointer;" onclick="teamSelectPlayer(\'' + p.member_id + '\')">' + _av(p.name, p.photo, 44, ring, down ? '#fbeaea' : '#e5f6f1', down ? '#a32d2d' : '#0a3e44') + badge + '</div>';
      }).join('') + '</div></div>';
  }
  async function teamSelectPlayer(mid) {
    var S = window.FFP_TEAM; S.sel = mid; S.heroMark = 0; S.detail = null; S.nutri = null; S.nutriDay = null; _paint();
    try { var rd = await _tSb().rpc('pro_player_detail', { p_pro: S.pid, p_team: S.team, p_member: mid }); S.detail = (rd && rd.data) || {}; } catch (e) { console.error('[FFP Team] detail', e); S.detail = {}; }
    if (S.sel !== mid) return; _paint();
    try { var rn = await _tSb().rpc('pro_player_nutrition', { p_pro: S.pid, p_member: mid }); if (S.sel === mid) { S.nutri = (rn && rn.data) || {}; _paint(); } } catch (e) { console.error('[FFP Team] nutrition', e); }
  }
  function _detailSections() {
    var S = window.FFP_TEAM, d = S.detail || {}, html = '', marks = d.marks || [];
    if (marks.length) {
      if (S.heroMark >= marks.length) S.heroMark = 0; var m = marks[S.heroMark];
      var dl = (m.current != null && m.previous != null) ? '<div style="font-size:13px;font-weight:800;color:#37E0C6;">▼ ' + _fmtGap(m.current, m.previous, m.unit) + '</div>' : '<div style="font-size:12px;color:rgba(255,255,255,.5);">first result</div>';
      var away = (m.target != null && m.current != null) ? ('target ' + _fmtVal(m.target, m.unit) + '<br><b style="color:#fff;">' + _fmtGap(m.current, m.target, m.unit) + ' away</b>') : (m.target != null ? 'target ' + _fmtVal(m.target, m.unit) : '');
      html += '<div class="ffpt-hero" style="padding:16px;"><div class="ffpt-glow" style="left:-20px;right:auto;background:radial-gradient(circle,rgba(55,224,198,.2),transparent 62%);"></div>' +
        '<div style="position:relative;display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px;"><div style="display:flex;align-items:baseline;gap:9px;"><div style="font-size:34px;font-weight:800;color:#fff;line-height:1;">' + _fmtVal(m.current, m.unit) + '</div>' + dl + '</div>' +
        '<div style="font-size:10.5px;color:rgba(255,255,255,.55);text-align:right;line-height:1.4;">' + away + '</div></div>' + _dotSVG(m) +
        '<div style="position:relative;display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;">' + marks.map(function (x, i) { return '<button class="ffpt-pill' + (i === S.heroMark ? ' ony' : '') + '" onclick="teamHeroMark(' + i + ')">' + _tEsc(x.name) + '</button>'; }).join('') + '<button class="ffpt-pill" style="background:rgba(255,255,255,.08);" onclick="teamRecordOpen(\'' + m.id + '\',\'measured\')">+ log</button></div></div>';
    } else html += '<div class="ffpt-hero" style="padding:16px;color:rgba(255,255,255,.75);font-size:13px;">No marks set yet. <button class="ffpt-pill ony" style="margin-left:6px;" onclick="teamMarkCreateOpen()">+ Add a mark</button></div>';
    var wk = d.week || {};
    html += '<div class="ffpt-sec"><div style="display:flex;gap:9px;"><div class="ffpt-tile"><div class="tv">' + (d.streak || 0) + '</div><div class="tl">Day streak</div></div><div class="ffpt-tile"><div class="tv">' + (wk.sessions || 0) + '</div><div class="tl">This week</div></div><div class="ffpt-tile"><div class="tv" style="font-size:15px;">' + _relDay(d.last_logged) + '</div><div class="tl">Last logged</div></div></div></div>';
    var sk = d.skills || [];
    if (sk.length) html += '<div class="ffpt-band"></div><div class="ffpt-sec"><div class="st" style="margin-bottom:14px;">Skills</div>' + sk.map(function (s) {
      var maxL = s.max_level || 5, lvl = s.level_no || 0, col = lvl ? SPECTRUM[Math.min(lvl, SPECTRUM.length) - 1] : '#b6c1c3', segs = '';
      for (var i = 1; i <= maxL; i++) segs += '<div style="background:' + (i <= lvl ? SPECTRUM[Math.min(i, SPECTRUM.length) - 1] : '#eef3f4') + ';"></div>';
      return '<div style="margin-bottom:15px;cursor:pointer;" onclick="teamRecordOpen(\'' + s.id + '\',\'skill\')"><div style="display:flex;justify-content:space-between;margin-bottom:7px;"><span style="font-size:13px;font-weight:800;color:#0f2327;">' + _tEsc(s.name) + '</span><span style="font-size:11.5px;font-weight:800;color:' + col + ';">' + _tEsc(s.level_name || (lvl ? 'Level ' + lvl : 'Not assessed')) + '</span></div><div class="ffpt-spec">' + segs + '</div></div>';
    }).join('') + '</div>';
    var rec = d.recent || [];
    html += '<div class="ffpt-band"></div><div class="ffpt-sec"><div class="st" style="margin-bottom:12px;">Recent activity</div><div style="display:flex;gap:9px;margin-bottom:14px;"><div class="ffpt-tile"><div class="tv">' + (wk.sessions || 0) + '</div><div class="tl">Sessions · 7d</div></div><div class="ffpt-tile"><div class="tv">' + (wk.distance_km || 0) + '<span style="font-size:11px;color:#869599;">km</span></div><div class="tl">Distance</div></div><div class="ffpt-tile"><div class="tv">' + (Math.round((wk.minutes || 0) / 60 * 10) / 10) + '<span style="font-size:11px;color:#869599;">h</span></div><div class="tl">Time</div></div></div>';
    if (rec.length) {
      var gr = ['linear-gradient(135deg,#0e5a63,#0a1a24)', 'linear-gradient(135deg,#243b1f,#0a1a24)', 'linear-gradient(135deg,#2a2352,#0a1a24)'];
      html += '<div style="display:flex;gap:11px;overflow-x:auto;scrollbar-width:none;">' + rec.slice(0, 8).map(function (a, i) {
        var stat = [a.distance_km ? (a.distance_km + 'km') : '', a.duration_min ? (a.duration_min + ' min') : ''].filter(Boolean).join(' · ') || _relDay(a.logged_at);
        var v = a.verified ? '<span style="position:absolute;top:7px;right:7px;color:#37E0C6;">' + _ic('verified', 14) + '</span>' : '';
        return '<div class="ffpt-act" onclick="teamOpenActivity(\'' + a.id + '\')"><div style="height:52px;background:' + gr[i % 3] + ';position:relative;">' + v + '<span style="position:absolute;left:9px;bottom:7px;color:#fff;">' + _ic(_sportIcon(a.category, a.activity), 20) + '</span></div><div style="padding:9px 11px;"><div style="font-size:12.5px;font-weight:800;color:#0f2327;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + _tEsc(a.activity || 'Activity') + '</div><div style="font-size:10px;color:#869599;font-weight:600;margin:2px 0 4px;">' + _relDay(a.logged_at) + '</div><div style="font-size:11px;font-weight:800;color:#0a3e44;">' + _tEsc(stat) + '</div></div></div>';
      }).join('') + '</div>';
    } else html += '<div style="color:#869599;font-size:12.5px;font-weight:700;">No activity in the last 7 days.</div>';
    html += '</div>';
    html += '<div class="ffpt-band"></div><div class="ffpt-sec">' + _nutriHtml() + '</div>';
    return html;
  }
  function _dotSVG(m) {
    var hist = (m.history || []).filter(function (h) { return h.value != null; });
    if (!hist.length) return '<div style="position:relative;color:rgba(255,255,255,.5);font-size:12px;margin-bottom:13px;">No history yet.</div>';
    var vals = hist.map(function (h) { return Number(h.value); }), all = vals.concat(m.target != null ? [Number(m.target)] : []);
    var mn = Math.min.apply(null, all), mx = Math.max.apply(null, all), span = (mx - mn) || 1, lb = _lowerBetter(m.direction);
    function y(v) { var f = (Number(v) - mn) / span; return lb ? (8 + 44 * f) : (52 - 44 * f); }
    var n = hist.length; function x(i) { return n === 1 ? 150 : (16 + i * 268 / (n - 1)); }
    var line = hist.map(function (h, i) { return x(i).toFixed(0) + ',' + y(h.value).toFixed(0); }).join(' ');
    var dots = hist.map(function (h, i) { var last = i === n - 1; return '<circle cx="' + x(i).toFixed(0) + '" cy="' + y(h.value).toFixed(0) + '" r="' + (last ? 5.5 : 4) + '" fill="' + (last ? '#37E0C6' : '#8fe0d0') + '"' + (last ? ' stroke="#0a1a24" stroke-width="2"' : '') + '/>'; }).join('');
    var tgt = (m.target != null) ? '<line x1="6" y1="' + y(m.target).toFixed(0) + '" x2="294" y2="' + y(m.target).toFixed(0) + '" stroke="rgba(55,224,198,.5)" stroke-width="1.2" stroke-dasharray="4 3"/>' : '';
    return '<svg viewBox="0 0 300 60" style="position:relative;width:100%;height:auto;display:block;margin-bottom:13px;" xmlns="http://www.w3.org/2000/svg">' + tgt + '<polyline points="' + line + '" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="1.5"/>' + dots + '</svg>';
  }
  function _nutriHtml() {
    var S = window.FFP_TEAM, nu = S.nutri;
    var head = '<div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:13px;"><div class="st">Nutrition</div>' + (nu ? '<div style="font-size:11px;font-weight:700;color:#869599;">7-day avg <b style="color:#0f2327;">' + (nu.avg_kcal || 0) + '</b> kcal · ' + (nu.days_logged || 0) + '/7</div>' : '') + '</div>';
    if (!nu) return head + '<div style="color:#869599;font-size:12.5px;font-weight:700;">Loading nutrition…</div>';
    var sel = S.nutriDay || nu.day, dn = function (ds) { try { return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(ds + 'T00:00:00').getDay()]; } catch (e) { return ''; } };
    var kf = function (k) { return k >= 1000 ? ((Math.round(k / 100) / 10) + 'k') : k; };
    var days = '<div style="display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin-bottom:14px;">' + (nu.last7 || []).map(function (d) { return '<div class="ffpt-day' + (d.date === sel ? ' on' : '') + '" onclick="teamNutriDay(\'' + d.date + '\')"><div class="dd">' + dn(d.date) + '</div><div class="dk">' + (d.logged ? kf(d.kcal) : '—') + '</div></div>'; }).join('') + '</div>';
    var panel;
    if (sel === nu.day) {
      var meals = nu.meals || {}, mac = nu.macros || {}, pC = mac.protein || 0, cC = mac.carbs || 0, fC = mac.fat || 0, tot = pC + cC + fC || 1;
      var mIcon = { breakfast: ['free_breakfast', '#fdeede', '#c8871a'], lunch: ['lunch_dining', '#e5f6ee', '#1d7a4d'], dinner: ['dinner_dining', '#e5f1f2', '#0a3e44'], snacks: ['bakery_dining', '#eaf4fb', '#2ba8e0'] };
      var mh = ['breakfast', 'lunch', 'dinner', 'snacks'].map(function (kk) {
        var items = meals[kk] || []; if (!items.length) return '';
        var kc = items.reduce(function (t, it) { return t + (it.calories || 0); }, 0), names = items.map(function (it) { return it.food_name; }).filter(Boolean).slice(0, 3).join(', '), ic = mIcon[kk];
        return '<div class="ffpt-meal"><div class="ffpt-mi" style="background:' + ic[1] + ';color:' + ic[2] + ';">' + _ic(ic[0], 18) + '</div><div style="flex:1;min-width:0;"><div style="font-size:12.5px;font-weight:800;color:#0f2327;">' + kk.charAt(0).toUpperCase() + kk.slice(1) + '</div><div style="font-size:11px;color:#5a6b6e;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + _tEsc(names) + '</div></div><div class="ffpt-kc">' + kc + '</div></div>';
      }).join('') || '<div style="color:#869599;font-size:12.5px;font-weight:700;padding:6px 0;">Nothing logged this day.</div>';
      var w = nu.water || {}, wp = w.goal ? Math.min(100, Math.round((w.ml || 0) * 100 / w.goal)) : 0;
      panel = '<div style="background:#f9fbfb;border:1px solid #eef3f4;border-radius:14px;padding:13px;"><div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:10px;"><div style="font-size:13px;font-weight:800;color:#0f2327;">' + dn(sel) + '</div><div style="font-size:11.5px;font-weight:800;color:#0a3e44;">' + (nu.day_total || 0) + ' kcal</div></div>' +
        '<div style="display:flex;height:7px;border-radius:4px;overflow:hidden;margin-bottom:13px;"><div style="width:' + (pC * 100 / tot) + '%;background:#37b06a;"></div><div style="width:' + (cC * 100 / tot) + '%;background:#2ba8e0;"></div><div style="width:' + (fC * 100 / tot) + '%;background:#FFCC00;"></div></div>' + mh +
        '<div style="display:flex;align-items:center;gap:10px;margin-top:12px;padding-top:12px;border-top:1px solid #eef3f4;">' + _ic('local_drink', 17, '#2ba8e0') + '<div style="flex:1;"><div style="height:8px;border-radius:4px;background:#eef3f4;overflow:hidden;"><div style="width:' + wp + '%;height:100%;background:#2ba8e0;"></div></div></div><div style="font-size:11px;font-weight:800;color:#0a3e44;">' + ((w.ml || 0) / 1000).toFixed(1) + ' / ' + ((w.goal || 3000) / 1000).toFixed(1) + ' L</div></div></div>';
    } else panel = '<div style="background:#f9fbfb;border:1px solid #eef3f4;border-radius:14px;padding:13px;color:#869599;font-weight:700;font-size:12.5px;">Loading day…</div>';
    return head + days + panel;
  }
  window.teamHeroMark = function (i) { window.FFP_TEAM.heroMark = i; _paint(); };
  window.teamOpenActivity = function (id) { _tToast('Activity ' + id, ''); };
  async function teamNutriDay(dateStr) {
    var S = window.FFP_TEAM; S.nutriDay = dateStr; _paint();
    try { var rn = await _tSb().rpc('pro_player_nutrition', { p_pro: S.pid, p_member: S.sel, p_day: dateStr }); S.nutri = (rn && rn.data) || {}; S.nutriDay = dateStr; _paint(); } catch (e) { console.error('[FFP Team] nutri day', e); }
  }
  window.teamSelectPlayer = teamSelectPlayer;
  window.teamNutriDay = teamNutriDay;
  window.teamTab = teamTab;

  // ════════ MANAGE ════════
  function _foot(label, fn) { return '<button class="ffpt-min" style="width:auto;padding:11px 18px;background:#eef3f4;font-weight:800;cursor:pointer;" onclick="ffpCloseModal()">Cancel</button><button class="ffpt-min" style="width:auto;padding:11px 18px;margin-left:8px;background:#0a3e44;color:#fff;font-weight:800;cursor:pointer;" onclick="' + fn + '">' + label + '</button>'; }
  function _closeModal() { var ov = document.getElementById('ffp-modal'); if (ov) ov.classList.remove('show'); }
  window.ffpCloseModal = window.ffpCloseModal || _closeModal;

  window.teamSettingsOpen = function () {
    var S = window.FFP_TEAM, team = _teamMeta();
    var roster = (S.players || []).map(function (p) { return '<div style="display:flex;align-items:center;gap:9px;padding:7px 0;border-top:1px solid #e4ebec;">' + _av(p.name, p.photo, 30) + '<span style="font-weight:700;color:#0f2327;">' + _tEsc(p.name) + '</span><button style="margin-left:auto;border:none;background:none;color:#e24b4a;font-weight:800;cursor:pointer;font-family:inherit;" onclick="teamRemoveMember(\'' + p.member_id + '\',\'' + _tEsc((p.name || '').replace(/\'/g, '')) + '\')">Remove</button></div>'; }).join('') || '<div style="color:#869599;font-size:13px;">No players yet.</div>';
    var body = '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px;">' +
      '<button class="ffpt-min" style="flex:1;min-width:130px;background:#0a3e44;color:#fff;font-weight:800;cursor:pointer;" onclick="teamAddMemberOpen()">+ Add player</button>' +
      '<button class="ffpt-min" style="flex:1;min-width:130px;background:#2ba8e0;color:#fff;font-weight:800;cursor:pointer;" onclick="teamMarkCreateOpen()">+ New mark</button>' +
      '<button class="ffpt-min" style="flex:1;min-width:130px;background:#2ba8e0;color:#fff;font-weight:800;cursor:pointer;" onclick="teamSkillCreateOpen()">+ New skill</button>' +
      '<button class="ffpt-min" style="flex:1;min-width:130px;background:#eef3f4;color:#0f2327;font-weight:800;cursor:pointer;" onclick="teamShowCreate();ffpCloseModal()">+ New team</button>' +
      (S.teams.length > 1 ? '<button class="ffpt-min" style="flex:1;min-width:130px;background:#eef3f4;color:#0f2327;font-weight:800;cursor:pointer;" onclick="teamSwitchOpen()">Switch team</button>' : '') + '</div>' +
      '<label class="ffpt-mlab">Team name</label><input class="ffpt-min" id="tg-name" value="' + _tEsc(team.name || '') + '"><label class="ffpt-mlab" style="margin-top:16px;">Roster</label>' + roster;
    openModalShell('sm', 'Team settings', body, _foot('Save name', 'teamRename()'));
  };
  window.teamRename = async function () { var S = window.FFP_TEAM, name = (document.getElementById('tg-name') || {}).value || ''; if (!name.trim()) { _tToast('Name can\'t be empty', 'error'); return; } try { await _tSb().rpc('pro_team_update', { p_pro: S.pid, p_team: S.team, p_name: name.trim() }); _closeModal(); _tToast('Saved', ''); renderTeam(); } catch (e) { console.error(e); _tToast('Could not save', 'error'); } };
  window.teamRemoveMember = function (mid, name) { var S = window.FFP_TEAM, go = async function () { try { await _tSb().rpc('pro_team_remove_member', { p_pro: S.pid, p_team: S.team, p_member: mid }); _tToast('Removed', ''); _closeModal(); _load(S.team); } catch (e) { console.error(e); _tToast('Could not remove', 'error'); } }; if (typeof ffpConfirm === 'function') ffpConfirm({ danger: true, title: 'Remove ' + (name || 'player') + '?', body: 'They\'ll no longer show in this team.', action: 'Remove', onOk: go }); else go(); };

  window.teamAddMemberOpen = async function () {
    var S = window.FFP_TEAM;
    openModalShell('sm', 'Add a player', '<div id="tam-list" style="max-height:52vh;overflow:auto;">Loading your clients…</div><div style="margin-top:10px;font-size:12px;color:#869599;">Only your Passport clients appear here — they log activity + meals to their Passport, which flows into this team.</div>', '<button class="ffpt-min" style="width:auto;padding:11px 18px;background:#eef3f4;font-weight:800;cursor:pointer;" onclick="ffpCloseModal()">Done</button>');
    var existing = {}; (S.players || []).forEach(function (p) { existing[p.member_id] = 1; });
    var cands = []; try { var r = await _tSb().rpc('pro_team_candidate_members', { p_pro: S.pid }); cands = (r && r.data) || []; } catch (e) { console.error(e); }
    var host = document.getElementById('tam-list'); if (!host) return;
    if (!cands.length) { host.innerHTML = '<div style="color:#5a6b6e;font-size:13px;padding:8px 0;">No Passport clients yet. Invite clients from the Clients tab first.</div>'; return; }
    host.innerHTML = cands.map(function (c) { var added = existing[c.id]; return '<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-top:1px solid #e4ebec;">' + _av(c.name, c.photo, 36) + '<div style="min-width:0;"><div style="font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + _tEsc(c.name) + '</div><div style="font-size:11px;color:#869599;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + _tEsc(c.email || '') + '</div></div><button id="tam-b-' + c.id + '" style="margin-left:auto;padding:7px 13px;border-radius:9px;border:none;font-weight:800;cursor:pointer;font-family:inherit;' + (added ? 'background:#eef3f4;color:#869599;' : 'background:#0a3e44;color:#fff;') + '" ' + (added ? 'disabled' : '') + ' onclick="teamAddMember(\'' + c.id + '\',\'' + _tEsc((c.name || '').replace(/\'/g, '')) + '\')">' + (added ? 'Added' : 'Add') + '</button></div>'; }).join('');
  };
  window.teamAddMember = async function (mid, name) { var S = window.FFP_TEAM, btn = document.getElementById('tam-b-' + mid); try { await _tSb().rpc('pro_team_add_member', { p_pro: S.pid, p_team: S.team, p_member: mid, p_full_name: name || null }); if (btn) { btn.textContent = 'Added'; btn.disabled = true; btn.style.background = '#eef3f4'; btn.style.color = '#869599'; } try { var rp = await _tSb().rpc('pro_team_players', { p_pro: S.pid, p_team: S.team }); S.players = ((rp && rp.data) || {}).players || []; } catch (e) {} } catch (e) { console.error(e); _tToast('Could not add', 'error'); } };

  window.teamMarkCreateOpen = function () { openModalShell('sm', 'Add a fitness mark', '<label class="ffpt-mlab">Mark name</label><input class="ffpt-min" id="mk-name" placeholder="3km run, Beep test"><label class="ffpt-mlab">Unit</label><input class="ffpt-min" id="mk-unit" placeholder="s (seconds), level, kg"><label class="ffpt-mlab">Target (optional)</label><input class="ffpt-min" id="mk-target" inputmode="decimal" placeholder="900"><label class="ffpt-mlab">Better is…</label><select class="ffpt-min" id="mk-dir"><option value="lower">Lower (faster / less time)</option><option value="higher">Higher (more / further)</option></select><div style="margin-top:8px;font-size:12px;color:#869599;">For times use unit "s" — shows as m:ss.</div>', _foot('Create', 'teamMarkCreateSave()')); };
  window.teamMarkCreateSave = async function () { var S = window.FFP_TEAM, name = (document.getElementById('mk-name') || {}).value || ''; if (!name.trim()) { _tToast('Name the mark', 'error'); return; } var tv = (document.getElementById('mk-target') || {}).value; tv = tv === '' ? null : Number(tv); try { await _tSb().rpc('pro_benchmark_upsert', { p_pro: S.pid, p_team: S.team, p_kind: 'measured', p_name: name.trim(), p_unit: (document.getElementById('mk-unit') || {}).value || null, p_target_value: tv, p_direction: (document.getElementById('mk-dir') || {}).value || 'lower' }); _closeModal(); _tToast('Mark added', ''); _load(S.team); } catch (e) { console.error(e); _tToast('Could not add mark', 'error'); } };
  window.teamSkillCreateOpen = function () { openModalShell('sm', 'Add a skill', '<label class="ffpt-mlab">Skill name</label><input class="ffpt-min" id="sk-name" placeholder="Snatch, First touch"><label class="ffpt-mlab">Levels (one per line, low → high)</label><textarea class="ffpt-min" id="sk-levels" rows="5" style="resize:vertical;">Developing\nCompetent\nProficient\nAdvanced\nElite</textarea><label class="ffpt-mlab">Target level (number)</label><input class="ffpt-min" id="sk-target" inputmode="numeric" placeholder="3">', _foot('Create', 'teamSkillCreateSave()')); };
  window.teamSkillCreateSave = async function () { var S = window.FFP_TEAM, name = (document.getElementById('sk-name') || {}).value || ''; if (!name.trim()) { _tToast('Name the skill', 'error'); return; } var lines = ((document.getElementById('sk-levels') || {}).value || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean); if (lines.length < 2) { _tToast('Add at least 2 levels', 'error'); return; } var levels = lines.map(function (nm, i) { return { level_no: i + 1, name: nm }; }); var tl = (document.getElementById('sk-target') || {}).value; tl = tl === '' ? null : Number(tl); try { await _tSb().rpc('pro_benchmark_upsert', { p_pro: S.pid, p_team: S.team, p_kind: 'skill', p_name: name.trim(), p_target_level: tl, p_levels: levels }); _closeModal(); _tToast('Skill added', ''); _load(S.team); } catch (e) { console.error(e); _tToast('Could not add skill', 'error'); } };

  window.teamRecordOpen = function (benchId, kind) {
    var S = window.FFP_TEAM; if (!S.sel) { _tToast('Open a player first', 'error'); return; }
    var pname = (S.detail && S.detail.member && S.detail.member.name) || 'player', body;
    if (kind === 'skill') { var sk = (S.detail.skills || []).find(function (x) { return x.id === benchId; }) || {}, maxL = sk.max_level || 5, opts = ''; for (var i = 1; i <= maxL; i++) opts += '<option value="' + i + '"' + (sk.level_no === i ? ' selected' : '') + '>Level ' + i + '</option>'; body = '<div style="font-size:13px;color:#5a6b6e;margin-bottom:6px;">' + _tEsc(sk.name || 'Skill') + ' — ' + _tEsc(pname) + '</div><label class="ffpt-mlab">Level</label><select class="ffpt-min" id="rec-level">' + opts + '</select><label class="ffpt-mlab">Note (optional)</label><input class="ffpt-min" id="rec-note" placeholder="What you saw">'; openModalShell('sm', 'Assess skill', body, _foot('Save', 'teamRecordSave(\'' + benchId + '\',\'skill\')')); }
    else { var mk = (S.detail.marks || []).find(function (x) { return x.id === benchId; }) || {}; body = '<div style="font-size:13px;color:#5a6b6e;margin-bottom:6px;">' + _tEsc(mk.name || 'Mark') + ' — ' + _tEsc(pname) + '</div><label class="ffpt-mlab">Result' + (mk.unit ? ' (' + _tEsc(mk.unit) + ')' : '') + '</label><input class="ffpt-min" id="rec-value" inputmode="decimal" placeholder="' + (mk.unit && /^s/i.test(mk.unit) ? 'seconds, e.g. 930' : 'value') + '"><label class="ffpt-mlab">Date</label><input class="ffpt-min" id="rec-date" type="date" value="' + _todayStr() + '"><label class="ffpt-mlab">Note (optional)</label><input class="ffpt-min" id="rec-note" placeholder="Conditions, effort…">'; openModalShell('sm', 'Log a result', body, _foot('Save', 'teamRecordSave(\'' + benchId + '\',\'measured\')')); }
  };
  window.teamRecordSave = async function (benchId, kind) {
    var S = window.FFP_TEAM, args = { p_pro: S.pid, p_benchmark: benchId, p_member: S.sel, p_note: (document.getElementById('rec-note') || {}).value || null };
    if (kind === 'skill') args.p_level_no = Number((document.getElementById('rec-level') || {}).value) || null;
    else { var v = (document.getElementById('rec-value') || {}).value; if (v === '' || isNaN(Number(v))) { _tToast('Enter a number', 'error'); return; } args.p_value = Number(v); args.p_recorded_on = (document.getElementById('rec-date') || {}).value || null; }
    try { await _tSb().rpc('pro_benchmark_record', args); _closeModal(); _tToast('Saved', ''); var mid = S.sel;
      try { var rd = await _tSb().rpc('pro_player_detail', { p_pro: S.pid, p_team: S.team, p_member: mid }); S.detail = (rd && rd.data) || {}; } catch (e) {}
      try { var ro = await _tSb().rpc('pro_team_overview', { p_pro: S.pid, p_team: S.team }); S.overview = (ro && ro.data) || {}; } catch (e) {}
      try { var rp = await _tSb().rpc('pro_team_players', { p_pro: S.pid, p_team: S.team }); S.players = ((rp && rp.data) || {}).players || []; } catch (e) {}
      _paint();
    } catch (e) { console.error(e); _tToast('Could not save', 'error'); }
  };
  window.teamSwitchOpen = function () { var S = window.FFP_TEAM; var body = (S.teams || []).map(function (t) { return '<button style="display:flex;width:100%;align-items:center;gap:10px;padding:12px;border:1px solid #e4ebec;border-radius:12px;background:' + (t.id === S.team ? '#eef3f4' : '#fff') + ';margin-bottom:8px;cursor:pointer;font-family:inherit;text-align:left;" onclick="teamSwitch(\'' + t.id + '\')">' + _ic('groups', 20, '#0a3e44') + '<div><div style="font-weight:800;">' + _tEsc(t.name) + '</div><div style="font-size:12px;color:#5a6b6e;">' + (t.member_count || 0) + ' players</div></div></button>'; }).join('') + '<button class="ffpt-min" style="width:100%;margin-top:6px;background:#0a3e44;color:#fff;font-weight:800;cursor:pointer;" onclick="teamShowCreate();ffpCloseModal()">+ New team</button>'; openModalShell('sm', 'Your teams', body, '<button class="ffpt-min" style="width:auto;padding:11px 18px;background:#eef3f4;font-weight:800;cursor:pointer;" onclick="ffpCloseModal()">Close</button>'); };
  window.teamSwitch = function (id) { window.FFP_TEAM.team = id; _closeModal(); _load(id); };

  window.renderTeam = renderTeam;
  try { if (document.getElementById('team-body')) renderTeam(); } catch (e) {}
})();
