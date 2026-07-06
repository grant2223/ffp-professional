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
      '.ffpt-tl{border-radius:16px;overflow:hidden;background:#fff;border:1px solid #e4ebec;box-shadow:0 6px 18px rgba(10,62,68,.07);margin-bottom:13px;cursor:pointer;}',
      '.ffpt-tlcover{height:176px;position:relative;display:flex;align-items:flex-end;padding:14px;}',
      '.ffpt-tlcover:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(6,18,26,0) 30%,rgba(6,18,26,.66) 100%);}',
      '.ffpt-tlcrest{width:38px;height:38px;border-radius:11px;background:rgba(255,255,255,.16);border:1.5px solid rgba(255,255,255,.4);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:13px;flex:0 0 auto;background-size:cover;background-position:center;}',
      '.ffpt-tlfoot{display:flex;align-items:center;gap:8px;padding:11px 14px;}',
      '.ffpt-tlnew{border:1.5px dashed #ccd9da;border-radius:16px;padding:16px;text-align:center;color:#0a3e44;font-weight:800;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;}',
      '.ffpt-cardg{background:#eef3f4;border:none;border-radius:0;max-width:none;margin:0;box-shadow:none;overflow:hidden;min-height:calc(100dvh - 96px);}',
      '.ffpt-hero{position:relative;background:radial-gradient(120% 95% at 50% 0%,#0f3b4a 0%,#0a1a24 62%,#06121a 100%);padding:15px 16px 16px;overflow:hidden;}',
      '.ffpt-glow{position:absolute;top:-40px;right:-30px;width:230px;height:180px;background:radial-gradient(circle,rgba(43,168,224,.26),transparent 62%);pointer-events:none;}',
      '.ffpt-logo{width:30px;height:30px;border-radius:8px;background:#fff;display:flex;align-items:center;justify-content:center;color:#0a3e44;font-weight:800;font-size:11px;flex:0 0 auto;box-shadow:0 1px 4px rgba(0,0,0,.18);}',
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
      '.ffpt-day .dd{font-size:9.5px;font-weight:800;color:#869599;text-transform:uppercase;letter-spacing:.3px;}.ffpt-day .dnum{font-size:13px;font-weight:900;color:#0f2327;margin-top:1px;line-height:1;}.ffpt-day .dk{font-size:9px;font-weight:800;color:#0a3e44;margin-top:3px;}',
      '.ffpt-day.on{background:#0a3e44;}.ffpt-day.on .dd,.ffpt-day.on .dk,.ffpt-day.on .dnum{color:#fff;}',
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
    _showTeamsLanding();
  }

  // ════════ TEAMS LANDING (cards to click into) ════════
  function _showTeamsLanding() {
    var S = window.FFP_TEAM, host = document.getElementById('team-body'); if (!host) return;
    _styles(); S.tab = 'overview'; S.team = null; S.sel = null; S.detail = null;
    var cards = (S.teams || []).map(function (t) {
      var cover = t.cover_url ? ('background:#0a3e44 center/cover no-repeat;background-image:url(\'' + _tEsc(t.cover_url) + '\');') : ('background:linear-gradient(135deg,#1d6a8f,#0a3e44);');
      var logoBg = t.logo_url ? ('background-size:cover;background-position:center;background-image:url(\'' + _tEsc(t.logo_url) + '\');') : '';
      var meta = [t.sport, (t.member_count || 0) + ' athlete' + (t.member_count === 1 ? '' : 's'), (t.mark_count || 0) + ' benchmark' + (t.mark_count === 1 ? '' : 's')].filter(Boolean).join('  ·  ');
      return '<div class="ffpt-tl" onclick="teamOpen(\'' + t.id + '\')">' +
        '<div class="ffpt-tlcover" style="' + cover + '"><div style="position:relative;z-index:2;display:flex;align-items:center;gap:11px;"><div class="ffpt-tlcrest" style="' + logoBg + '">' + (t.logo_url ? '' : _tEsc(_initials(t.name) || 'T')) + '</div><div style="font-size:16px;font-weight:800;color:#fff;">' + _tEsc(t.name) + '</div></div></div>' +
        '<div class="ffpt-tlfoot"><span style="font-size:12.5px;font-weight:700;color:#5a6b6e;">' + _tEsc(meta) + '</span><div style="flex:1;"></div>' + _ic('chevron_right', 20, '#869599') + '</div></div>';
    }).join('');
    host.innerHTML = '<div class="ffpt"><div style="max-width:560px;margin:0 auto;padding:16px 16px 0;box-sizing:border-box;">' +
      '<div style="font-size:20px;font-weight:900;color:#0f2327;letter-spacing:-.3px;margin-bottom:16px;">Your teams</div>' + cards +
      '<div class="ffpt-tlnew" onclick="teamShowCreate()">' + _ic('add', 19) + 'Create a team</div></div></div>';
  }
  window.teamOpen = function (id) { window.FFP_TEAM.team = id; _load(id); };
  window.teamBackToLanding = function () { _showTeamsLanding(); };

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
    if (!S.cKey) S.cKey = Date.now();
    var canBack = S.teams && S.teams.length;
    var cover = S.cCover ? ('background:#0a3e44 center/cover no-repeat;background-image:url(\'' + _tEsc(S.cCover) + '\');') : ('background:radial-gradient(120% 120% at 30% 0%,#0f3b4a 0%,#0a1a24 62%,#06121a 100%);');
    var logoInner = S.cLogo ? ('<img src="' + _tEsc(S.cLogo) + '" style="width:100%;height:100%;object-fit:cover;">') : (S.cName ? _tEsc(_initials(S.cName)) : 'FFP');
    host.innerHTML = '<div class="ffpt"><div class="ffpt-cardg">' +
      '<div style="position:relative;height:185px;overflow:hidden;' + cover + '"><div class="ffpt-glow" style="right:-30px;"></div>' +
        '<div style="position:relative;display:flex;align-items:center;justify-content:space-between;padding:14px 16px 0;">' +
          '<div style="display:flex;align-items:center;gap:9px;">' + (canBack ? '<span onclick="teamBackFromCreate()" style="cursor:pointer;">' + _ic('arrow_back', 20, 'rgba(255,255,255,.85)') + '</span>' : '') + '<div style="font-size:11px;font-weight:800;letter-spacing:1.5px;color:#7fe3ea;text-transform:uppercase;">New team</div></div>' +
          '<div onclick="teamPickCover()" style="display:flex;align-items:center;gap:6px;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.25);border-radius:100px;padding:6px 12px;color:#fff;font-size:11.5px;font-weight:700;cursor:pointer;">' + _ic('photo_camera', 15) + (S.cCover ? 'Change header' : 'Add header photo') + '</div></div>' +
        '<div style="position:relative;padding:10px 16px 0;"><div style="font-size:22px;font-weight:900;color:#fff;letter-spacing:-.4px;text-shadow:0 2px 8px rgba(0,0,0,.4);">Create your team</div><div style="font-size:12px;font-weight:600;color:rgba(255,255,255,.78);margin-top:4px;text-shadow:0 1px 6px rgba(0,0,0,.4);">Everything your athletes log to their Passport shows up here.</div></div>' +
      '</div>' +
      '<div style="padding:0 16px 18px;">' +
        '<div style="display:flex;align-items:flex-end;gap:13px;margin-top:-30px;position:relative;margin-bottom:18px;">' +
          '<div onclick="teamPickLogo()" style="position:relative;width:66px;height:66px;flex:0 0 auto;border-radius:18px;background:#fff;display:flex;align-items:center;justify-content:center;color:#0a3e44;font-weight:800;font-size:22px;box-shadow:0 8px 22px rgba(10,26,36,.28),0 0 0 4px #eef3f4;cursor:pointer;overflow:hidden;">' + logoInner + '<div style="position:absolute;bottom:-5px;right:-5px;width:26px;height:26px;border-radius:50%;background:#FFCC00;color:#0a3e44;display:flex;align-items:center;justify-content:center;border:2.5px solid #eef3f4;">' + _ic('photo_camera', 14) + '</div></div>' +
          '<div style="padding-bottom:6px;"><div style="font-size:12px;font-weight:800;color:#0f2327;">Add a team logo</div><div style="font-size:11px;color:#869599;">Optional · shows on the athletes\' cards</div></div></div>' +
        '<div class="ffpt-clab">Team name</div><input class="ffpt-in" id="tc-name" placeholder="Riverside U18s" value="' + _tEsc(S.cName || '') + '" style="margin-bottom:20px;">' +
        '<div class="ffpt-clab">Type</div><div style="display:flex;gap:8px;margin-bottom:20px;" id="tc-types">' +
        TYPES.map(function (t) { return '<button class="ffpt-typ' + (S.cType === t[0] ? ' on' : '') + '" onclick="teamCType(\'' + t[0] + '\')">' + _ic(t[2], 21) + '<div style="font-size:10.5px;font-weight:700;margin-top:5px;">' + t[1] + '</div></button>'; }).join('') + '</div>' +
        '<div class="ffpt-clab">Sport</div><div id="tc-sport-wrap" style="margin-bottom:20px;"><select class="ffpt-in" id="tc-sport">' + _sportOptions(S.cSport || '') + '</select></div>' +
        '<div class="ffpt-clab">Description</div><textarea class="ffpt-in" id="tc-desc" rows="3" style="resize:vertical;margin-bottom:22px;" placeholder="What this team is about…">' + _tEsc(S.cDesc || '') + '</textarea>' +
        '<button class="ffpt-cta" onclick="teamCreateSave()">Create team</button>' +
      '</div></div></div>';
    try { if (window.FFPSelect) FFPSelect.enhance(document.getElementById('tc-sport-wrap')); } catch (e) {}
  }
  function _capCreate() { var S = window.FFP_TEAM, n = document.getElementById('tc-name'); if (n) S.cName = n.value; var sp = document.getElementById('tc-sport'); if (sp) S.cSport = sp.value; var d = document.getElementById('tc-desc'); if (d) S.cDesc = d.value; }
  window.teamPickCover = function () { _capCreate(); var S = window.FFP_TEAM; if (!window.FFPUpload) { _tToast('Photo upload unavailable', 'error'); return; } FFPUpload.pick({ bucket: 'team-images', key: 'team-cover-' + S.pid + '-' + S.cKey, aspect: 16 / 9, outW: 1280, outH: 720, title: 'Header image', onDone: function (url) { S.cCover = url; _showCreatePage(); }, onError: function () { _tToast('Upload failed', 'error'); } }); };
  window.teamPickLogo = function () { _capCreate(); var S = window.FFP_TEAM; if (!window.FFPUpload) { _tToast('Photo upload unavailable', 'error'); return; } FFPUpload.pick({ bucket: 'team-images', key: 'team-logo-' + S.pid + '-' + S.cKey, aspect: 1, outW: 512, outH: 512, title: 'Team logo', onDone: function (url) { S.cLogo = url; _showCreatePage(); }, onError: function () { _tToast('Upload failed', 'error'); } }); };
  window.teamCType = function (t) { _capCreate(); window.FFP_TEAM.cType = t; document.querySelectorAll('#tc-types .ffpt-typ').forEach(function (b, i) { b.classList.toggle('on', TYPES[i][0] === t); }); };
  function _clearCreate() { var S = window.FFP_TEAM; S.cName = S.cSport = S.cDesc = S.cCover = S.cLogo = null; S.cKey = null; }
  window.teamBackFromCreate = function () { _clearCreate(); if (window.FFP_TEAM.teams && window.FFP_TEAM.teams.length) _showTeamsLanding(); };
  window.teamCreateSave = async function () {
    var S = window.FFP_TEAM, name = (document.getElementById('tc-name') || {}).value || '';
    if (!name.trim()) { _tToast('Give the team a name', 'error'); return; }
    var sport = (document.getElementById('tc-sport') || {}).value || null;
    var desc = (document.getElementById('tc-desc') || {}).value || null;
    try { var r = await _tSb().rpc('pro_team_create', { p_pro: S.pid, p_name: name.trim(), p_type: S.cType || 'sports', p_sport: sport, p_description: desc, p_logo_url: S.cLogo || null, p_cover_url: S.cCover || null }); S.team = (r && r.data) || null; S.tab = 'overview'; _clearCreate(); _tToast('Team created', ''); renderTeam(); }
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
      '<button class="ffpt-tab' + (S.tab === 'players' ? ' on' : '') + '" onclick="teamTab(\'players\')">Athletes</button></div>';
  }
  function _teamIdRow(sub) {
    var team = _teamMeta(), c = _count();
    var logoBg = team.logo_url ? ('background-size:cover;background-position:center;background-image:url(\'' + _tEsc(team.logo_url) + '\');') : '';
    return '<div style="position:relative;display:flex;align-items:center;gap:9px;">' +
      '<span onclick="event.stopPropagation();teamBackToLanding()" style="cursor:pointer;flex:0 0 auto;">' + _ic('arrow_back', 20, 'rgba(255,255,255,.8)') + '</span>' +
      '<div style="flex:1;display:flex;align-items:center;gap:9px;cursor:pointer;min-width:0;" onclick="teamSettingsOpen()">' +
      '<div class="ffpt-logo" style="' + logoBg + '">' + (team.logo_url ? '' : _tEsc(_initials(team.name) || 'T')) + '</div>' +
      '<div style="flex:1;font-size:15px;font-weight:800;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + _tEsc(team.name || 'Team') + '</div>' +
      '<div style="font-size:11px;font-weight:700;color:rgba(255,255,255,.5);flex:0 0 auto;">' + (sub || (c + ' athlete' + (c === 1 ? '' : 's'))) + '</div></div></div>';
  }

  function _paint() {
    var S = window.FFP_TEAM, host = document.getElementById('team-body'); if (!host) return;
    if (S.tab === 'overview') host.innerHTML = '<div class="ffpt"><div class="ffpt-card">' + _overviewHero() + _tabs() + _overviewSections() + '</div></div>';
    else {
      var detail = !(S.players || []).length ? '<div class="ffpt-sec" style="text-align:center;color:#5a6b6e;font-weight:700;padding:26px 16px;">No athletes yet — tap <b style="color:#0a3e44;">+ Add</b> to add your first athlete.</div>' : ((S.detail && S.detail.member && S.detail.member.id === S.sel) ? _detailSections() : '<div class="ffpt-sec" style="color:#869599;font-weight:700;">Loading athlete…</div>');
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
    var hit = (f && f.hit != null) ? (f.hit + ' of ' + c + ' hit') : '';
    h += '<div style="position:relative;display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:11px;">' +
      '<div><div style="font-size:9.5px;font-weight:800;letter-spacing:1.5px;color:#7fe3ea;">TEAM AVG</div><div style="font-size:34px;font-weight:800;color:#fff;line-height:1;margin-top:3px;">' + (f ? _fmtVal(f.avg, f.unit) : '—') + '</div></div>' +
      '<div style="text-align:right;">' + (f && f.target != null ? '<div style="font-size:14px;font-weight:800;color:#37E0C6;">target ' + _fmtVal(f.target, f.unit) + '</div>' : '') + (hit ? '<div style="font-size:11px;color:rgba(255,255,255,.55);">' + hit + '</div>' : '') + '</div></div>' +
      (f ? _barSVG(f) : _barPlaceholder()) +
      '<div style="position:relative;display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;">' +
      fits.map(function (x, i) { return '<button class="ffpt-pill' + (i === S.ovMark ? ' ony' : '') + '" onclick="teamOvMark(' + i + ')">' + _tEsc(x.name) + '</button>'; }).join('') + '</div></div>';
    return h;
  }
  // Empty graph — drawn full-height even with no players/results so the header always reads as a graph.
  function _barPlaceholder() {
    var S = window.FFP_TEAM, players = (S.players || []);
    var names = players.length ? players.map(function (p) { return p.name; }) : ['', '', '', '', '', ''];
    var deco = [52, 78, 40, 88, 60, 70, 46, 66, 56, 82];
    var n = names.length, slot = 284 / n, bw = Math.min(16, slot - 4), base = 108;
    var rects = '', labs = '';
    for (var i = 0; i < n; i++) {
      var hh = deco[i % deco.length] * 0.78, x = 8 + i * slot + (slot - bw) / 2, y = base - hh;
      rects += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(0) + '" width="' + bw.toFixed(1) + '" height="' + hh.toFixed(0) + '" rx="2" fill="rgba(255,255,255,.09)"/>';
      if (players.length) labs += '<text x="' + (8 + i * slot + slot / 2).toFixed(1) + '" y="' + (base + 11) + '" text-anchor="middle" font-size="7" font-weight="700" fill="rgba(255,255,255,.4)" font-family="Montserrat">' + _tEsc(_initials(names[i])) + '</text>';
    }
    var avg = '<line x1="6" y1="' + (base - 60) + '" x2="272" y2="' + (base - 60) + '" stroke="rgba(255,255,255,.26)" stroke-width="1.3" stroke-dasharray="4 3"/><text x="297" y="' + (base - 57) + '" text-anchor="end" font-size="8" font-weight="800" fill="rgba(255,255,255,.45)" font-family="Montserrat">avg</text>';
    var svg = '<svg viewBox="0 0 300 ' + (base + 18) + '" style="position:relative;width:100%;height:auto;display:block;margin-bottom:8px;" xmlns="http://www.w3.org/2000/svg">' + avg + rects + labs + '</svg>';
    var cap = '<div style="position:relative;text-align:center;color:rgba(255,255,255,.5);font-size:11.5px;font-weight:600;margin-bottom:12px;">' + _ic('bar_chart', 15, 'rgba(255,255,255,.4)') + ' Record a benchmark result to bring this to life</div>';
    return svg + cap;
  }
  function _barSVG(f) {
    var bars = f.bars || [], lb = _lowerBetter(f.direction);
    var vals = bars.map(function (b) { return b.value; }).filter(function (v) { return v != null; });
    if (!vals.length) return _barPlaceholder();
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
    // Skills — list EVERY skill (each with its own level columns), not a dropdown-selected one.
    var sk = ov.skills || [];
    html += '<div class="ffpt-band"></div><div class="ffpt-sec"><div class="st" style="margin-bottom:14px;">Skills</div>';
    if (!sk.length) html += '<div style="color:#869599;font-size:12.5px;font-weight:700;">No skills yet — add them in Team settings.</div>';
    else html += sk.map(function (s, i) { return '<div style="' + (i ? 'margin-top:20px;padding-top:16px;border-top:1px solid #eef3f4;' : '') + '"><div style="font-size:13.5px;font-weight:800;color:#0f2327;margin-bottom:11px;">' + _tEsc(s.name) + '</div>' + _skillCols(s) + '</div>'; }).join('');
    html += '</div>';
    // What they're training
    var tr = ov.training || [];
    html += '<div class="ffpt-band"></div><div class="ffpt-sec"><div class="st" style="margin-bottom:4px;">Training Focus</div><div style="font-size:11.5px;color:#869599;margin-bottom:13px;">Activities the squad is logging — sessions &amp; share.</div>';
    if (tr.length) {
      var mx = Math.max.apply(null, tr.map(function (x) { return x.sessions; }).concat([1]));
      html += tr.slice(0, 6).map(function (x, i) {
        var w = Math.max(18, Math.round(x.sessions * 100 / mx));
        var pat = i === 0 ? 'repeating-linear-gradient(45deg,#0a3e44,#0a3e44 6px,#17616b 6px,#17616b 12px)' : 'repeating-linear-gradient(45deg,#2ba8e0,#2ba8e0 6px,#57c0e8 6px,#57c0e8 12px)';
        return '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;"><span style="width:80px;font-size:12px;font-weight:700;color:#5a6b6e;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + _tEsc(x.category) + '</span><div class="ffpt-tbar"><div style="width:' + w + '%;height:100%;background:' + pat + ';"></div><span style="position:absolute;left:10px;top:0;bottom:0;display:flex;align-items:center;font-size:11.5px;font-weight:800;color:#fff;">' + x.sessions + ' session' + (x.sessions === 1 ? '' : 's') + '</span></div><span style="width:34px;text-align:right;font-size:12px;font-weight:800;color:#0f2327;">' + x.pct + '%</span></div>';
      }).join('');
    } else html += '<div style="color:#869599;font-size:12.5px;font-weight:700;">No sessions logged yet — this fills in as they train.</div>';
    html += '</div>';
    // Who needs you
    var flags = ov.flags || [];
    html += '<div class="ffpt-band"></div><div class="ffpt-sec"><div class="st" style="color:' + (flags.length ? '#a32d2d' : '#0f2327') + ';margin-bottom:12px;">Who needs you</div>';
    if (flags.length) html += flags.map(function (fl) {
      return '<div style="display:flex;align-items:center;gap:11px;margin-bottom:11px;">' + _av(fl.name, fl.photo, 42, '#f0b6b6', '#fbeaea', '#a32d2d') +
        '<div style="flex:1;font-size:13px;color:#0f2327;font-weight:700;">' + _tEsc(fl.name) + ' · <b style="color:#d64545;">' + _tEsc(fl.reason) + '</b></div>' +
        '<button style="background:#0a3e44;color:#fff;border:none;border-radius:9px;padding:8px 13px;font-size:12px;font-weight:800;font-family:inherit;cursor:pointer;" onclick="teamFlag(\'' + fl.member_id + '\')">' + _tEsc(fl.action || 'Open') + '</button></div>';
    }).join('');
    else html += '<div style="display:flex;align-items:center;gap:8px;color:#1d7a4d;font-size:12.5px;font-weight:700;">' + _ic('check_circle', 18, '#37b06a') + 'Everyone\'s on track.</div>';
    html += '</div>';
    return html;
  }
  function _skillCols(sk) {
    var levels = (sk.levels || []).slice().sort(function (a, b) { return a.level_no - b.level_no; });
    if (!levels.length) return '<div style="font-size:12.5px;color:#869599;">No levels defined.</div>';
    var players = sk.players || [], byL = {}; levels.forEach(function (l) { byL[l.level_no] = []; });
    players.forEach(function (p) { if (p.level_no != null && byL[p.level_no]) byL[p.level_no].push(p); });
    return '<div style="display:grid;grid-template-columns:repeat(' + levels.length + ',1fr);gap:6px;text-align:center;">' +
      levels.map(function (l) {
        var isT = sk.target_level === l.level_no, cnt = byL[l.level_no].length;
        var faces = byL[l.level_no].slice(0, 4).map(function (p, i) { return '<span style="margin-left:' + (i ? -9 : 0) + 'px;">' + _av(p.name, p.photo, 26) + '</span>'; }).join('');
        return '<div><div style="font-size:9px;font-weight:800;text-transform:uppercase;color:' + (isT ? '#0a3e44' : '#869599') + ';margin-bottom:6px;">' + _tEsc(l.name.slice(0, 7)) + (isT ? '★' : '') + '</div>' +
          '<div style="font-size:19px;font-weight:900;line-height:1;margin-bottom:6px;color:' + (isT ? '#0a3e44' : (cnt ? '#0f2327' : '#c2cdcf')) + ';">' + cnt + '</div>' +
          '<div style="display:flex;justify-content:center;min-height:26px;">' + (faces || '') + '</div></div>';
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
    // First item is always the "+" Add-athlete button.
    var addBtn = '<div style="text-align:center;flex:0 0 auto;cursor:pointer;" onclick="teamAddMemberOpen()"><div style="width:44px;height:44px;border-radius:50%;border:2px dashed #bcd2d4;display:flex;align-items:center;justify-content:center;background:#f4f7f8;">' + _ic('add', 24, '#0a3e44') + '</div><div style="font-size:9.5px;font-weight:800;color:#0a3e44;margin-top:5px;">Add</div></div>';
    return '<div style="padding:6px 16px 12px;border-bottom:1px solid #f1f4f5;"><div class="ffpt-scroll" style="gap:13px;padding:9px 4px 14px;align-items:flex-start;">' + addBtn +
      players.map(function (p) {
        var on = S.sel === p.member_id, ring = _arrCol(p.trajectory), down = p.trajectory === 'down';
        var badge = '<span class="ffpt-ab" style="background:' + ring + ';">' + _arrow(p.trajectory) + '</span>';
        if (on) return '<div style="text-align:center;flex:0 0 auto;cursor:pointer;" onclick="teamSelectPlayer(\'' + p.member_id + '\')"><div style="position:relative;display:inline-block;"><span style="box-shadow:0 0 0 3px #37b06a,0 0 0 5px #0a3e44;border-radius:50%;display:inline-block;">' + _av(p.name, p.photo, 50, null, down ? '#fbeaea' : '#e5f6f1', down ? '#a32d2d' : '#0a3e44') + '</span>' + badge + '</div><div style="font-size:9.5px;font-weight:800;color:#0a3e44;margin-top:5px;">' + _tEsc((p.name || '').split(' ')[0]) + '</div></div>';
        return '<div style="position:relative;flex:0 0 auto;cursor:pointer;" onclick="teamSelectPlayer(\'' + p.member_id + '\')">' + _av(p.name, p.photo, 44, ring, down ? '#fbeaea' : '#e5f6f1', down ? '#a32d2d' : '#0a3e44') + badge + '</div>';
      }).join('') + '</div></div>';
  }
  async function teamSelectPlayer(mid) {
    var S = window.FFP_TEAM; S.sel = mid; S.heroMark = 0; S.detail = null; S.nutri = null; S.nutriBase = null; S.nutriDay = null; _paint();
    try { var rd = await _tSb().rpc('pro_player_detail', { p_pro: S.pid, p_team: S.team, p_member: mid }); S.detail = (rd && rd.data) || {}; } catch (e) { console.error('[FFP Team] detail', e); S.detail = {}; }
    if (S.sel !== mid) return; _paint();
    try { var rn = await _tSb().rpc('pro_player_nutrition', { p_pro: S.pid, p_member: mid }); if (S.sel === mid) { S.nutri = (rn && rn.data) || {}; S.nutriBase = S.nutri; S.nutriDay = S.nutri.day; _paint(); } } catch (e) { console.error('[FFP Team] nutrition', e); }
  }
  function _detailSections() {
    var S = window.FFP_TEAM, d = S.detail || {}, html = '', marks = d.marks || [];
    if (marks.length) {
      if (S.heroMark >= marks.length) S.heroMark = 0; var m = marks[S.heroMark];
      var dl = (m.current != null && m.previous != null) ? '<div style="font-size:13px;font-weight:800;color:#37E0C6;">▼ ' + _fmtGap(m.current, m.previous, m.unit) + '</div>' : '<div style="font-size:12px;color:rgba(255,255,255,.5);">first result</div>';
      var away = '';
      if (m.target != null && m.current != null) {
        // Direction-aware: if the athlete has BEATEN the target, say "under" (lower-is-better) / "over" (higher-is-better), not "away".
        var lbT = _lowerBetter(m.direction), metT = lbT ? (Number(m.current) <= Number(m.target)) : (Number(m.current) >= Number(m.target));
        var wordT = metT ? (lbT ? 'under' : 'over') : 'away', colT = metT ? '#37E0C6' : '#fff';
        away = 'target ' + _fmtVal(m.target, m.unit) + '<br><b style="color:' + colT + ';">' + _fmtGap(m.current, m.target, m.unit) + ' ' + wordT + '</b>';
      } else if (m.target != null) { away = 'target ' + _fmtVal(m.target, m.unit); }
      html += '<div class="ffpt-hero" style="padding:16px;"><div class="ffpt-glow" style="left:-20px;right:auto;background:radial-gradient(circle,rgba(55,224,198,.2),transparent 62%);"></div>' +
        '<div style="position:relative;display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px;"><div style="display:flex;align-items:baseline;gap:9px;"><div style="font-size:34px;font-weight:800;color:#fff;line-height:1;">' + _fmtVal(m.current, m.unit) + '</div>' + dl + '</div>' +
        '<div style="font-size:10.5px;color:rgba(255,255,255,.55);text-align:right;line-height:1.4;">' + away + '</div></div>' + _dotSVG(m) +
        '<div style="position:relative;display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;">' + marks.map(function (x, i) { return '<button class="ffpt-pill' + (i === S.heroMark ? ' ony' : '') + '" onclick="teamHeroMark(' + i + ')">' + _tEsc(x.name) + '</button>'; }).join('') + '</div></div>';
    } else html += '<div class="ffpt-hero" style="padding:18px 16px;color:rgba(255,255,255,.7);font-size:13px;font-weight:600;">No benchmarks yet — add them in Team settings.</div>';
    var wk = d.week || {};
    html += '<div class="ffpt-sec"><div style="display:flex;gap:9px;"><div class="ffpt-tile"><div class="tv">' + (d.streak || 0) + '</div><div class="tl">Day streak</div></div><div class="ffpt-tile"><div class="tv">' + (wk.sessions || 0) + '</div><div class="tl">This week</div></div><div class="ffpt-tile"><div class="tv" style="font-size:15px;">' + _relDay(d.last_logged) + '</div><div class="tl">Last logged</div></div></div></div>';
    var sk = d.skills || [];
    if (sk.length) html += '<div class="ffpt-band"></div><div class="ffpt-sec"><div class="st" style="margin-bottom:3px;">Skills</div><div style="font-size:11.5px;color:#869599;margin-bottom:14px;">Tap the level this athlete is at (★ = target).</div>' + sk.map(function (s) {
      var lvl = s.level_no || 0, col = lvl ? SPECTRUM[Math.min(lvl, SPECTRUM.length) - 1] : '#b6c1c3';
      var chips = SKILL_LEVELS.map(function (nm, i) {
        var lv = i + 1, on = lvl === lv, isT = s.target_level === lv, cc = SPECTRUM[Math.min(lv, SPECTRUM.length) - 1];
        return '<button onclick="teamSkillSet(\'' + s.id + '\',' + lv + ')" style="flex:0 0 auto;border:1.5px solid ' + (on ? cc : '#e4ebec') + ';background:' + (on ? cc : '#fff') + ';color:' + (on ? '#fff' : '#5a6b6e') + ';border-radius:9px;padding:7px 11px;font-size:11px;font-weight:800;cursor:pointer;font-family:inherit;white-space:nowrap;">' + nm + (isT ? ' ★' : '') + '</button>';
      }).join('');
      return '<div style="margin-bottom:16px;"><div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px;"><span style="font-size:14px;font-weight:800;color:#0f2327;">' + _tEsc(s.name) + '</span><span style="font-size:11.5px;font-weight:800;color:' + col + ';">' + _tEsc(s.level_name || (lvl ? 'Level ' + lvl : 'Not assessed')) + '</span></div><div style="display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px;">' + chips + '</div></div>';
    }).join('') + '</div>';
    var rec = d.recent || [];
    html += '<div class="ffpt-band"></div><div class="ffpt-sec"><div class="st" style="margin-bottom:12px;">Recent activity</div><div style="display:flex;gap:9px;margin-bottom:14px;"><div class="ffpt-tile"><div class="tv">' + (wk.sessions || 0) + '</div><div class="tl">Sessions · 7d</div></div><div class="ffpt-tile"><div class="tv">' + (wk.distance_km || 0) + '<span style="font-size:11px;color:#869599;">km</span></div><div class="tl">Distance</div></div><div class="ffpt-tile"><div class="tv">' + (Math.round((wk.minutes || 0) / 60 * 10) / 10) + '<span style="font-size:11px;color:#869599;">h</span></div><div class="tl">Time</div></div></div>';
    if (rec.length) {
      var gr = ['linear-gradient(135deg,#0e5a63,#0a1a24)', 'linear-gradient(135deg,#243b1f,#0a1a24)', 'linear-gradient(135deg,#2a2352,#0a1a24)'];
      html += '<div style="display:flex;gap:11px;overflow-x:auto;scrollbar-width:none;">' + rec.slice(0, 8).map(function (a, i) {
        var stat = [a.distance_km ? (a.distance_km + 'km') : '', a.duration_min ? (a.duration_min + ' min') : ''].filter(Boolean).join(' · ') || _relDay(a.logged_at);
        var v = a.verified ? '<span style="position:absolute;top:7px;right:7px;color:#37E0C6;">' + _ic('verified', 14) + '</span>' : '';
        var cov = a.photo_url ? ('height:64px;background:#0a1a24 center/cover no-repeat;background-image:url(\'' + _tEsc(a.photo_url) + '\');position:relative;') : ('height:52px;background:' + gr[i % 3] + ';position:relative;');
        var covIcon = a.photo_url ? '' : ('<span style="position:absolute;left:9px;bottom:7px;color:#fff;">' + _ic(_sportIcon(a.category, a.activity), 20) + '</span>');
        return '<div class="ffpt-act" onclick="teamOpenActivity(\'' + a.id + '\')"><div style="' + cov + '">' + v + covIcon + '</div><div style="padding:9px 11px;"><div style="font-size:12.5px;font-weight:800;color:#0f2327;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + _tEsc(a.activity || 'Activity') + '</div><div style="font-size:10px;color:#869599;font-weight:600;margin:2px 0 4px;">' + _relDay(a.logged_at) + '</div><div style="font-size:11px;font-weight:800;color:#0a3e44;">' + _tEsc(stat) + '</div></div></div>';
      }).join('') + '</div>';
    } else html += '<div style="color:#869599;font-size:12.5px;font-weight:700;">No activity in the last 7 days.</div>';
    html += '</div>';
    html += '<div class="ffpt-band"></div><div class="ffpt-sec">' + _nutriHtml() + '</div>';
    return html;
  }
  function _dotSVG(m) {
    var hist = (m.history || []).filter(function (h) { return h.value != null; });
    if (!hist.length) {
      // Empty graph — drawn so the benchmark section always reads as a chart, awaiting the first result.
      var xs = [16, 86, 150, 214, 284], ys = [40, 30, 36, 26, 34];
      var tgtE = (m.target != null) ? '<line x1="6" y1="30" x2="294" y2="30" stroke="rgba(55,224,198,.45)" stroke-width="1.2" stroke-dasharray="4 3"/><text x="294" y="24" text-anchor="end" font-size="8" font-weight="800" fill="rgba(55,224,198,.7)" font-family="Montserrat">target</text>' : '';
      var pl = xs.map(function (x, i) { return x + ',' + ys[i]; }).join(' ');
      var dts = xs.map(function (x, i) { return '<circle cx="' + x + '" cy="' + ys[i] + '" r="3.5" fill="rgba(255,255,255,.12)"/>'; }).join('');
      return '<svg viewBox="0 0 300 60" style="position:relative;width:100%;height:auto;display:block;margin-bottom:7px;" xmlns="http://www.w3.org/2000/svg">' + tgtE + '<polyline points="' + pl + '" fill="none" stroke="rgba(255,255,255,.10)" stroke-width="1.5"/>' + dts + '</svg>' +
        '<div style="position:relative;color:rgba(255,255,255,.5);font-size:11px;font-weight:600;margin-bottom:12px;">Awaiting the first result — log one to start the graph.</div>';
    }
    var vals = hist.map(function (h) { return Number(h.value); }), all = vals.concat(m.target != null ? [Number(m.target)] : []);
    var mn = Math.min.apply(null, all), mx = Math.max.apply(null, all), span = (mx - mn) || 1;
    // Raw number-line axis: HIGHER value = HIGHER on the graph (no direction flip). Dot above the dashed target line = value above target.
    function y(v) { var f = (Number(v) - mn) / span; return 52 - 44 * f; }
    var n = hist.length; function x(i) { return n === 1 ? 150 : (16 + i * 268 / (n - 1)); }
    var line = hist.map(function (h, i) { return x(i).toFixed(0) + ',' + y(h.value).toFixed(0); }).join(' ');
    var dots = hist.map(function (h, i) { var last = i === n - 1; return '<circle cx="' + x(i).toFixed(0) + '" cy="' + y(h.value).toFixed(0) + '" r="' + (last ? 5.5 : 4) + '" fill="' + (last ? '#37E0C6' : '#8fe0d0') + '"' + (last ? ' stroke="#0a1a24" stroke-width="2"' : '') + '/>'; }).join('');
    var tgt = (m.target != null) ? '<line x1="6" y1="' + y(m.target).toFixed(0) + '" x2="294" y2="' + y(m.target).toFixed(0) + '" stroke="rgba(55,224,198,.5)" stroke-width="1.2" stroke-dasharray="4 3"/>' : '';
    return '<svg viewBox="0 0 300 60" style="position:relative;width:100%;height:auto;display:block;margin-bottom:13px;" xmlns="http://www.w3.org/2000/svg">' + tgt + '<polyline points="' + line + '" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="1.5"/>' + dots + '</svg>';
  }
  function _nutriHtml() {
    var S = window.FFP_TEAM, nu = S.nutri, base = S.nutriBase || nu;
    var head = '<div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:13px;"><div class="st">Nutrition</div>' + (base ? '<div style="font-size:11px;font-weight:700;color:#869599;">7-day avg <b style="color:#0f2327;">' + (base.avg_kcal || 0) + '</b> kcal · ' + (base.days_logged || 0) + '/7</div>' : '') + '</div>';
    if (!base) return head + '<div style="color:#869599;font-size:12.5px;font-weight:700;">Loading nutrition…</div>';
    var WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    function _dp(ds) { try { return new Date(ds + 'T00:00:00'); } catch (e) { return null; } }
    var dn = function (ds) { var d = _dp(ds); return d ? WD[d.getDay()] : ''; };
    var dnum = function (ds) { var d = _dp(ds); return d ? d.getDate() : ''; };
    var dfull = function (ds) { var d = _dp(ds); return d ? (WD[d.getDay()] + ' ' + d.getDate() + ' ' + MO[d.getMonth()]) : ''; };
    var kf = function (k) { return k >= 1000 ? ((Math.round(k / 100) / 10) + 'k') : k; };
    var sel = S.nutriDay || base.day;
    // FIXED window: the last 7 days ENDING TODAY (from the base/today load). Selecting a day loads that day's panel but NEVER reorders/shifts the chips.
    var week = (base.last7 || []).slice(-7);
    var days = '<div style="display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin-bottom:14px;">' + week.map(function (d) { return '<div class="ffpt-day' + (d.date === sel ? ' on' : '') + '" onclick="teamNutriDay(\'' + d.date + '\')"><div class="dd">' + dn(d.date) + '</div><div class="dnum">' + dnum(d.date) + '</div><div class="dk">' + (d.logged ? kf(d.kcal) : '—') + '</div></div>'; }).join('') + '</div>';
    var panel;
    if (nu && sel === nu.day) {
      var meals = nu.meals || {}, mac = nu.macros || {}, pC = mac.protein || 0, cC = mac.carbs || 0, fC = mac.fat || 0, tot = pC + cC + fC || 1;
      var mIcon = { breakfast: ['free_breakfast', '#fdeede', '#c8871a'], lunch: ['lunch_dining', '#e5f6ee', '#1d7a4d'], dinner: ['dinner_dining', '#e5f1f2', '#0a3e44'], snacks: ['bakery_dining', '#eaf4fb', '#2ba8e0'] };
      var mh = ['breakfast', 'lunch', 'dinner', 'snacks'].map(function (kk) {
        var items = meals[kk] || []; if (!items.length) return '';
        var kc = items.reduce(function (t, it) { return t + (it.calories || 0); }, 0), names = items.map(function (it) { return it.food_name; }).filter(Boolean).slice(0, 3).join(', '), ic = mIcon[kk];
        return '<div class="ffpt-meal"><div class="ffpt-mi" style="background:' + ic[1] + ';color:' + ic[2] + ';">' + _ic(ic[0], 18) + '</div><div style="flex:1;min-width:0;"><div style="font-size:12.5px;font-weight:800;color:#0f2327;">' + kk.charAt(0).toUpperCase() + kk.slice(1) + '</div><div style="font-size:11px;color:#5a6b6e;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + _tEsc(names) + '</div></div><div class="ffpt-kc">' + kc + '</div></div>';
      }).join('') || '<div style="color:#869599;font-size:12.5px;font-weight:700;padding:6px 0;">Nothing logged this day.</div>';
      var w = nu.water || {}, wp = w.goal ? Math.min(100, Math.round((w.ml || 0) * 100 / w.goal)) : 0;
      var pat = function (a, b) { return 'repeating-linear-gradient(45deg,' + a + ',' + a + ' 6px,' + b + ' 6px,' + b + ' 12px)'; };
      panel = '<div style="background:#f9fbfb;border:1px solid #eef3f4;border-radius:14px;padding:13px;"><div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:10px;"><div style="font-size:13px;font-weight:800;color:#0f2327;">' + dfull(sel) + '</div><div style="font-size:11.5px;font-weight:800;color:#0a3e44;">' + (nu.day_total || 0) + ' kcal</div></div>' +
        '<div style="display:flex;height:16px;border-radius:6px;overflow:hidden;margin-bottom:8px;border:1px solid #e4ebec;"><div style="width:' + (pC * 100 / tot) + '%;background:' + pat('#37b06a', '#2f9a5c') + ';"></div><div style="width:' + (cC * 100 / tot) + '%;background:' + pat('#2ba8e0', '#2492c4') + ';"></div><div style="width:' + (fC * 100 / tot) + '%;background:' + pat('#FFCC00', '#e6b800') + ';"></div></div>' +
        '<div style="display:flex;gap:12px;margin-bottom:13px;font-size:10px;font-weight:800;color:#5a6b6e;"><span><span style="color:#37b06a;">■</span> P ' + Math.round(pC) + 'g</span><span><span style="color:#2ba8e0;">■</span> C ' + Math.round(cC) + 'g</span><span><span style="color:#e6b800;">■</span> F ' + Math.round(fC) + 'g</span></div>' + mh +
        '<div style="display:flex;align-items:center;gap:10px;margin-top:12px;padding-top:12px;border-top:1px solid #eef3f4;">' + _ic('local_drink', 17, '#2ba8e0') + '<div style="flex:1;"><div style="height:8px;border-radius:4px;background:#eef3f4;overflow:hidden;"><div style="width:' + wp + '%;height:100%;background:#2ba8e0;"></div></div></div><div style="font-size:11px;font-weight:800;color:#0a3e44;">' + ((w.ml || 0) / 1000).toFixed(1) + ' / ' + ((w.goal || 3000) / 1000).toFixed(1) + ' L</div></div></div>';
    } else panel = '<div style="background:#f9fbfb;border:1px solid #eef3f4;border-radius:14px;padding:13px;color:#869599;font-weight:700;font-size:12.5px;">Loading day…</div>';
    return head + days + panel;
  }
  window.teamHeroMark = function (i) { window.FFP_TEAM.heroMark = i; _paint(); };
  function _actCloseFoot() { return '<button class="ffpt-min" style="width:auto;padding:11px 20px;background:#0a3e44;color:#fff;font-weight:800;cursor:pointer;" onclick="ffpCloseModal()">Close</button>'; }
  function _paceStr(km, min) { if (!km || !min) return null; var p = min / km, m = Math.floor(p), s = Math.round((p - m) * 60); return m + ':' + (s < 10 ? '0' : '') + s + ' /km'; }
  function _renderActivityCard(a) {
    var grad = 'linear-gradient(135deg,#0e5a63,#0a1a24)';
    var photos = (a.photos && a.photos.length ? a.photos : (a.photo_url ? [a.photo_url] : []));
    var verBadge = a.verified ? '<span style="position:absolute;top:10px;right:10px;background:rgba(8,20,32,.6);color:#37E0C6;border-radius:100px;padding:4px 10px;font-size:11px;font-weight:800;">' + _ic('verified', 13) + ' Verified</span>' : '';
    var cover;
    if (photos.length) {
      cover = '<div style="height:210px;border-radius:12px;overflow:hidden;margin-bottom:12px;position:relative;background:#0a1a24 center/cover no-repeat;background-image:url(\'' + _tEsc(photos[0]) + '\');">' + verBadge + (photos.length > 1 ? '<span style="position:absolute;bottom:10px;right:10px;background:rgba(8,20,32,.6);color:#fff;border-radius:100px;padding:3px 9px;font-size:11px;font-weight:800;">' + _ic('collections', 13) + ' ' + photos.length + '</span>' : '') + '</div>';
      if (photos.length > 1) cover += '<div style="display:flex;gap:7px;overflow-x:auto;scrollbar-width:none;margin-bottom:12px;">' + photos.slice(1, 6).map(function (u) { return '<div style="flex:0 0 auto;width:64px;height:64px;border-radius:9px;background:#0a1a24 center/cover no-repeat;background-image:url(\'' + _tEsc(u) + '\');"></div>'; }).join('') + '</div>';
    } else {
      cover = '<div style="height:120px;border-radius:12px;background:' + grad + ';display:flex;align-items:center;justify-content:center;margin-bottom:12px;position:relative;">' + _ic(_sportIcon(a.category, a.activity), 44, '#fff') + verBadge + '</div>';
    }
    var place = [a.venue, a.area, a.city, a.country].filter(Boolean).filter(function (v, i, arr) { return arr.indexOf(v) === i; }).join(', ');
    var when = a.logged_at ? (new Date(a.logged_at).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' }) + ' · ' + new Date(a.logged_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })) : '';
    var tile = function (val, lab) { return '<div class="ffpt-tile" style="min-width:78px;"><div class="tv">' + val + '</div><div class="tl">' + lab + '</div></div>'; };
    var u = function (t) { return '<span style="font-size:11px;color:#869599;font-weight:700;">' + t + '</span>'; };
    var tiles = [];
    if (a.distance_km) tiles.push(tile(a.distance_km + u(' km'), 'Distance'));
    if (a.duration_min) tiles.push(tile(a.duration_min + u(' min'), 'Time'));
    var pace = _paceStr(a.distance_km, a.duration_min); if (pace) tiles.push(tile('<span style="font-size:15px;">' + pace.replace(' /km', '') + '</span>' + u(' /km'), 'Pace'));
    if (a.calories) tiles.push(tile(a.calories + u(' kcal'), 'Energy'));
    if (a.avg_heart_rate) tiles.push(tile(a.avg_heart_rate + u(' bpm'), 'Avg HR'));
    if (a.steps) tiles.push(tile(a.steps, 'Steps'));
    var tilesHtml = tiles.length ? '<div style="display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;margin-top:14px;">' + tiles.join('') + '</div>' : '';
    return cover +
      '<div style="font-size:19px;font-weight:900;color:#0f2327;line-height:1.15;">' + _tEsc(a.activity || 'Activity') + '</div>' +
      (a.category ? '<div style="font-size:12px;color:#869599;margin-top:2px;">' + _tEsc(a.category) + (a.intensity ? ' · ' + _tEsc(a.intensity) : '') + '</div>' : '') +
      (place ? '<div style="display:flex;align-items:center;gap:5px;margin-top:8px;color:#5a6b6e;font-size:12.5px;font-weight:600;">' + _ic('place', 15, '#0a3e44') + _tEsc(place) + '</div>' : '') +
      (when ? '<div style="display:flex;align-items:center;gap:5px;margin-top:4px;color:#869599;font-size:12px;">' + _ic('schedule', 14, '#869599') + when + '</div>' : '') +
      tilesHtml +
      (a.notes ? '<div style="margin-top:14px;padding:12px 13px;background:#f4f7f8;border-radius:11px;font-size:13px;color:#0f2327;line-height:1.5;white-space:pre-wrap;">' + _tEsc(a.notes) + '</div>' : '');
  }
  window.teamOpenActivity = async function (id) {
    var S = window.FFP_TEAM;
    if (typeof openModalShell === 'function') openModalShell('sm', 'Activity', '<div style="padding:26px 0;text-align:center;color:#869599;font-weight:700;">Loading activity…</div>', _actCloseFoot());
    var a = null;
    try { var r = await _tSb().rpc('pro_activity_detail', { p_pro: S.pid, p_activity: id }); a = (r && r.data) || null; } catch (e) { console.error('[FFP Team] activity', e); }
    if (!a) { a = ((S.detail || {}).recent || []).find(function (x) { return x.id === id; }); }   // fallback to the summary row
    if (!a) { _tToast('Could not load activity', 'error'); ffpCloseModal(); return; }
    if (typeof openModalShell === 'function') openModalShell('sm', 'Activity', _renderActivityCard(a), _actCloseFoot());
    else _tToast(a.activity || 'Activity', '');
  };
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

  window.teamSettingsOpen = function () { window.FFP_TEAM.setTab = 'details'; _showTeamSettings(); };
  window.teamSettingsBack = function () { var S = window.FFP_TEAM; S.tab = 'overview'; if (S.overview || S.players) _paint(); else _load(S.team); };
  var SET_TABS = [['players', 'Athletes'], ['benchmarks', 'Benchmarks'], ['skills', 'Skills'], ['details', 'Details']];
  function _yAdd(label, fn) { return '<button onclick="' + fn + '" style="background:#FFCC00;color:#0a1a24;border:none;border-radius:9px;padding:7px 14px;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:5px;">' + _ic('add', 15, '#0a1a24') + label + '</button>'; }
  function _showTeamSettings() {
    var S = window.FFP_TEAM, host = document.getElementById('team-body'), team = _teamMeta(); if (!host) return;
    _styles(); if (!S.sKey) S.sKey = Date.now();
    if (!S.setTab) S.setTab = 'details';
    if (S.sType == null) S.sType = (team.type && TYPES.some(function (t) { return t[0] === team.type; })) ? team.type : 'sports';
    var cover = S.sCover ? ('background:#0a3e44 center/cover no-repeat;background-image:url(\'' + _tEsc(S.sCover) + '\');') : (team.cover_url ? ('background:#0a3e44 center/cover no-repeat;background-image:url(\'' + _tEsc(team.cover_url) + '\');') : ('background:linear-gradient(135deg,#1d6a8f,#0a3e44);'));
    var lg = S.sLogo || team.logo_url, logoBg = lg ? ('background-size:cover;background-position:center;background-image:url(\'' + _tEsc(lg) + '\');') : '';
    var nameV = (S.sName != null ? S.sName : (team.name || '')), sportV = (S.sSport != null ? S.sSport : (team.sport || '')), descV = (S.sDesc != null ? S.sDesc : (team.description || ''));

    // persistent header: cover + logo crest (team identity, editable)
    var header = '<div style="position:relative;height:210px;overflow:hidden;' + cover + '"><div class="ffpt-glow" style="right:-30px;"></div>' +
      '<div style="position:relative;display:flex;align-items:center;justify-content:space-between;padding:14px 16px 0;">' +
        '<div style="display:flex;align-items:center;gap:9px;"><span onclick="teamSettingsBack()" style="cursor:pointer;">' + _ic('arrow_back', 20, 'rgba(255,255,255,.85)') + '</span><div style="font-size:11px;font-weight:800;letter-spacing:1.5px;color:#7fe3ea;text-transform:uppercase;">Team settings</div></div>' +
        '<div onclick="teamSetPickCover()" style="display:flex;align-items:center;gap:6px;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.25);border-radius:100px;padding:6px 12px;color:#fff;font-size:11.5px;font-weight:700;cursor:pointer;">' + _ic('photo_camera', 15) + 'Change header</div></div></div>' +
      '<div style="padding:0 16px;"><div style="display:flex;align-items:flex-end;gap:13px;margin-top:-14px;position:relative;margin-bottom:16px;">' +
        '<div onclick="teamSetPickLogo()" style="position:relative;width:66px;height:66px;flex:0 0 auto;border-radius:18px;background:#fff;display:flex;align-items:center;justify-content:center;color:#0a3e44;font-weight:800;font-size:22px;box-shadow:0 8px 22px rgba(10,26,36,.28),0 0 0 4px #ffffff;cursor:pointer;overflow:hidden;' + logoBg + '">' + (lg ? '' : _tEsc(_initials(team.name) || 'T')) + '<div style="position:absolute;bottom:-5px;right:-5px;width:26px;height:26px;border-radius:50%;background:#FFCC00;color:#0a3e44;display:flex;align-items:center;justify-content:center;border:2.5px solid #ffffff;">' + _ic('photo_camera', 14) + '</div></div>' +
        '<div style="padding-bottom:6px;flex:1;min-width:0;"><div style="font-size:16px;font-weight:900;color:#0f2327;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + _tEsc(team.name || 'Team') + '</div><div style="font-size:11px;color:#869599;">Tap the logo to change</div></div></div></div>';

    var tabs = '<div class="ffpt-tabrow">' + SET_TABS.map(function (t) { return '<button class="ffpt-tab' + (S.setTab === t[0] ? ' on' : '') + '" onclick="teamSetTab(\'' + t[0] + '\')">' + t[1] + '</button>'; }).join('') + '</div>';

    var body = '';
    if (S.setTab === 'details') {
      body = '<div class="ffpt-clab">Team name</div><input class="ffpt-in" id="ts-name" value="' + _tEsc(nameV) + '" style="margin-bottom:20px;">' +
        '<div class="ffpt-clab">Type</div><div style="display:flex;gap:8px;margin-bottom:20px;" id="ts-types">' +
        TYPES.map(function (t) { return '<button class="ffpt-typ' + (S.sType === t[0] ? ' on' : '') + '" onclick="teamSetType(\'' + t[0] + '\')">' + _ic(t[2], 21) + '<div style="font-size:10.5px;font-weight:700;margin-top:5px;">' + t[1] + '</div></button>'; }).join('') + '</div>' +
        '<div class="ffpt-clab">Sport</div><div id="ts-sport-wrap" style="margin-bottom:20px;"><select class="ffpt-in" id="ts-sport">' + _sportOptions(sportV) + '</select></div>' +
        '<div class="ffpt-clab">Description</div><textarea class="ffpt-in" id="ts-desc" rows="3" style="resize:vertical;">' + _tEsc(descV) + '</textarea>' +
        '<button class="ffpt-cta" style="margin-top:24px;" onclick="teamSettingsSave()">Save changes</button>' +
        '<div onclick="teamDeleteConfirm()" style="text-align:center;margin-top:14px;color:#c0392b;font-size:12.5px;font-weight:800;cursor:pointer;">Delete team</div>';
    } else if (S.setTab === 'benchmarks') {
      body = _benchmarksSectionHtml('measured');
    } else if (S.setTab === 'skills') {
      body = _benchmarksSectionHtml('skill');
    } else {
      var roster = (S.players || []).map(function (p) { return '<div style="display:flex;align-items:center;gap:11px;padding:9px 0;border-top:1px solid #e4ebec;">' + _av(p.name, p.photo, 34) + '<span style="flex:1;font-weight:700;color:#0f2327;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + _tEsc(p.name) + '</span><span style="color:#e24b4a;font-weight:800;font-size:13px;cursor:pointer;" onclick="teamRemoveMember(\'' + p.member_id + '\',\'' + _tEsc((p.name || '').replace(/\'/g, '')) + '\')">Remove</span></div>'; }).join('') || '<div style="color:#869599;font-size:13px;padding:8px 0;">No athletes yet — add from your clients or share your invite link.</div>';
      body = '<div id="tg-reqs"></div>' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin:2px 0 4px;"><div style="font-size:15px;font-weight:800;color:#0f2327;">Roster · ' + (S.players || []).length + '</div>' + _yAdd('Add athletes', 'teamAddMemberOpen()') + '</div>' + roster;
    }

    host.innerHTML = '<div class="ffpt"><div class="ffpt-cardg">' + header + tabs + '<div style="padding:16px;">' + body + '</div></div></div>';
    if (S.setTab === 'details') { try { if (window.FFPSelect) FFPSelect.enhance(document.getElementById('ts-sport-wrap')); } catch (e) {} }
    if (S.setTab === 'players') _teamLoadReqs();
  }
  window.teamSetTab = function (t) { var S = window.FFP_TEAM; if (S.setTab === 'details') _capSet(); S.setTab = t; _showTeamSettings(); };
  function _capSet() { var S = window.FFP_TEAM, n = document.getElementById('ts-name'); if (n) S.sName = n.value; var sp = document.getElementById('ts-sport'); if (sp) S.sSport = sp.value; var d = document.getElementById('ts-desc'); if (d) S.sDesc = d.value; }
  window.teamSetType = function (t) { _capSet(); window.FFP_TEAM.sType = t; document.querySelectorAll('#ts-types .ffpt-typ').forEach(function (b, i) { b.classList.toggle('on', TYPES[i][0] === t); }); };
  window.teamSetPickCover = function () { _capSet(); var S = window.FFP_TEAM; if (!window.FFPUpload) { _tToast('Upload unavailable', 'error'); return; } FFPUpload.pick({ bucket: 'team-images', key: 'team-cover-' + S.team + '-' + Date.now(), aspect: 16 / 9, outW: 1280, outH: 720, title: 'Header image', onDone: function (url) { S.sCover = url; _showTeamSettings(); }, onError: function () { _tToast('Upload failed', 'error'); } }); };
  window.teamSetPickLogo = function () { _capSet(); var S = window.FFP_TEAM; if (!window.FFPUpload) { _tToast('Upload unavailable', 'error'); return; } FFPUpload.pick({ bucket: 'team-images', key: 'team-logo-' + S.team + '-' + Date.now(), aspect: 1, outW: 512, outH: 512, title: 'Team logo', onDone: function (url) { S.sLogo = url; _showTeamSettings(); }, onError: function () { _tToast('Upload failed', 'error'); } }); };
  function _clearSet() { var S = window.FFP_TEAM; S.sName = S.sSport = S.sDesc = S.sLogo = S.sCover = null; S.sType = null; S.sKey = null; }
  window.teamSettingsSave = async function () {
    _capSet(); var S = window.FFP_TEAM, name = (S.sName || '');
    if (!name.trim()) { _tToast('Name can\'t be empty', 'error'); return; }
    try {
      await _tSb().rpc('pro_team_update', { p_pro: S.pid, p_team: S.team, p_name: name.trim(), p_type: S.sType || null, p_sport: S.sSport || null, p_description: S.sDesc || null, p_logo_url: S.sLogo || null, p_cover_url: S.sCover || null });
      try { var lr = await _tSb().rpc('pro_teams_list', { p_pro: S.pid }); S.teams = (lr && lr.data) || S.teams; } catch (e) {}
      _clearSet(); _tToast('Saved', ''); _load(S.team);
    } catch (e) { console.error(e); _tToast('Could not save', 'error'); }
  };
  window.teamDeleteConfirm = function () {
    var S = window.FFP_TEAM, team = _teamMeta();
    var go = async function () { try { await _tSb().rpc('pro_team_delete', { p_pro: S.pid, p_team: S.team }); _clearSet(); _tToast('Team deleted', ''); renderTeam(); } catch (e) { console.error(e); _tToast('Could not delete', 'error'); } };
    if (typeof ffpConfirm === 'function') ffpConfirm({ danger: true, title: 'Delete ' + (team.name || 'this team') + '?', body: 'This removes the team, its benchmarks, and every recorded result. This can\'t be undone.', action: 'Delete team', onOk: go }); else if (confirm('Delete this team?')) go();
  };
  function _benchmarksSectionHtml(kind) {
    var ov = window.FFP_TEAM.overview || {}, fits = ov.fitness || [], sk = ov.skills || [], rows = '';
    if (kind === 'skill') {
      sk.forEach(function (s) { var tl = s.target_level, ln = (s.levels || []).filter(function (l) { return l.level_no === tl; })[0]; rows += _benchRow(s.id, 'skill', s.name, tl ? ('Target · ' + (ln ? ln.name : ('Level ' + tl))) : 'No target set'); });
      if (!rows) rows = '<div style="color:#869599;font-size:12.5px;font-weight:700;padding:10px 0;">No skills yet — add the skills this squad is assessed on.</div>';
      return '<div style="display:flex;align-items:center;justify-content:space-between;margin:2px 0 2px;"><div style="font-size:15px;font-weight:800;color:#0f2327;">Skills</div>' + _yAdd('Add', 'teamAddSkill()') + '</div><div style="font-size:11.5px;color:#869599;margin-bottom:2px;">What this squad is assessed on (5 levels each).</div>' + rows;
    }
    fits.forEach(function (f) { rows += _benchRow(f.id, 'measured', f.name, f.target != null ? ('Target ' + _fmtVal(f.target, f.unit)) : 'No target set'); });
    if (!rows) rows = '<div style="color:#869599;font-size:12.5px;font-weight:700;padding:10px 0;">No benchmarks yet — add the tests this squad is measured on.</div>';
    return '<div style="display:flex;align-items:center;justify-content:space-between;margin:2px 0 2px;"><div style="font-size:15px;font-weight:800;color:#0f2327;">Benchmarks</div>' + _yAdd('Add', 'teamAddBenchmark()') + '</div><div style="font-size:11.5px;color:#869599;margin-bottom:2px;">Measured tests this squad is timed/scored on.</div>' + rows;
  }
  function _benchRow(id, kind, name, sub) {
    var ico = kind === 'skill' ? 'my_location' : 'timer', bg = kind === 'skill' ? 'background:#eaf1fb;color:#2ba8e0;' : 'background:#e5f6f1;color:#0a3e44;';
    var nm = _tEsc((name || '').replace(/\'/g, ''));
    return '<div style="display:flex;align-items:center;gap:12px;padding:11px 0;border-top:1px solid #e4ebec;cursor:pointer;" onclick="teamBenchEdit(\'' + id + '\',\'' + kind + '\')"><div style="width:36px;height:36px;border-radius:10px;' + bg + 'display:flex;align-items:center;justify-content:center;flex:0 0 auto;">' + _ic(ico, 20) + '</div><div style="flex:1;min-width:0;"><div style="font-size:14px;font-weight:800;color:#0f2327;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + _tEsc(name) + '</div><div style="font-size:11px;color:#869599;">' + _tEsc(sub) + '</div></div>' + _ic('edit', 17, '#869599') + '<span onclick="event.stopPropagation();teamBenchDelete(\'' + id + '\',\'' + nm + '\')" style="color:#c0392b;cursor:pointer;flex:0 0 auto;padding-left:4px;">' + _ic('delete_outline', 20) + '</span></div>';
  }
  window.teamBenchEdit = async function (id, kind) {
    var S = window.FFP_TEAM;
    _clearBench();
    S.setTab = (kind === 'skill') ? 'skills' : 'benchmarks';
    var b = null;
    try { var r = await _tSb().rpc('pro_benchmark_get', { p_pro: S.pid, p_benchmark: id }); if (r && r.error) throw r.error; b = (r && r.data) || null; }
    catch (e) { console.error('[FFP Team] bench get', e); _tToast('Could not open' + (e && e.message ? ': ' + e.message : ''), 'error'); return; }
    if (!b) { _tToast('Benchmark not found', 'error'); return; }
    S.bEditId = b.id; S.bKind = b.kind; S.bName = b.name;
    if (b.kind === 'skill') {
      S.bTargetLevel = b.target_level || 3;
      S.bDescs = ['', '', '', '', ''];
      (b.levels || []).forEach(function (l) { if (l.level_no >= 1 && l.level_no <= 5) S.bDescs[l.level_no - 1] = l.description || ''; });
    } else {
      S.bCustom = true; S.bTemplate = null;
      var u = b.unit;
      S.bMeasure = (u === 's' || u === 'time') ? 'time' : (u === 'kg' ? 'weight' : 'level');
      S.bUnit = (S.bMeasure === 'level') ? u : null;
      S.bDir = b.direction || 'lower';
      if (b.target_value == null) S.bTargetVal = '';
      else if (S.bMeasure === 'time') { var s = Math.round(b.target_value), m = Math.floor(s / 60), ss = s % 60; S.bTargetVal = m + ':' + (ss < 10 ? '0' : '') + ss; }
      else S.bTargetVal = String(b.target_value);
    }
    _showBenchmarkPage(b.kind);
  };
  window.teamAddBenchmark = function () { window.FFP_TEAM.setTab = 'benchmarks'; if (typeof _clearBench === 'function') _clearBench(); _showBenchmarkPage('measured'); };
  window.teamAddSkill = function () { window.FFP_TEAM.setTab = 'skills'; if (typeof _clearBench === 'function') _clearBench(); _showBenchmarkPage('skill'); };
  window.teamBenchDelete = function (id, name) {
    var S = window.FFP_TEAM, go = async function () { try { await _tSb().rpc('pro_benchmark_delete', { p_pro: S.pid, p_benchmark: id }); _tToast('Benchmark removed', ''); try { var ro = await _tSb().rpc('pro_team_overview', { p_pro: S.pid, p_team: S.team }); S.overview = (ro && ro.data) || {}; } catch (e) {} _showTeamSettings(); } catch (e) { console.error(e); _tToast('Could not remove', 'error'); } };
    if (typeof ffpConfirm === 'function') ffpConfirm({ danger: true, title: 'Remove ' + (name || 'benchmark') + '?', body: 'This deletes the benchmark and all recorded results for it.', action: 'Remove', onOk: go }); else go();
  };
  async function _teamLoadReqs() {
    var S = window.FFP_TEAM, host = document.getElementById('tg-reqs'); if (!host) return;
    var reqs = []; try { var r = await _tSb().rpc('pro_team_join_requests_list', { p_pro: S.pid }); reqs = (r && r.data) || []; } catch (e) {}
    reqs = reqs.filter(function (x) { return x.team_id === S.team; });
    if (!reqs.length) { host.innerHTML = ''; return; }
    host.innerHTML = '<label class="ffpt-mlab" style="margin-top:16px;color:#0a3e44;">Requests to join · ' + reqs.length + '</label>' + reqs.map(function (q) {
      return '<div id="tgr-' + q.id + '" style="display:flex;align-items:center;gap:9px;padding:8px 0;border-top:1px solid #e4ebec;">' + _av(q.name, q.photo, 32) + '<span style="font-weight:700;color:#0f2327;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + _tEsc(q.name) + '</span>' +
        '<button style="border:none;background:#0a3e44;color:#fff;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit;" onclick="teamJoinDecide(\'' + q.id + '\',true)">Approve</button>' +
        '<button style="border:1px solid #e4ebec;background:#fff;color:#869599;border-radius:8px;padding:6px 10px;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit;" onclick="teamJoinDecide(\'' + q.id + '\',false)">Decline</button></div>';
    }).join('');
  }
  window.teamJoinDecide = async function (reqId, approve) {
    var S = window.FFP_TEAM;
    try {
      await _tSb().rpc('pro_team_join_decide', { p_pro: S.pid, p_request: reqId, p_approve: approve });
      _tToast(approve ? 'Added to the team' : 'Declined', '');
      if (approve) { try { var rp = await _tSb().rpc('pro_team_players', { p_pro: S.pid, p_team: S.team }); S.players = ((rp && rp.data) || {}).players || []; } catch (e) {} }
      S.setTab = 'players'; _showTeamSettings();   // repaint so an approved player appears in the Roster immediately (+ the request drops off)
    }
    catch (e) { console.error(e); _tToast('Could not update', 'error'); }
  };
  window.teamRename = async function () { var S = window.FFP_TEAM, name = (document.getElementById('tg-name') || {}).value || ''; if (!name.trim()) { _tToast('Name can\'t be empty', 'error'); return; } try { await _tSb().rpc('pro_team_update', { p_pro: S.pid, p_team: S.team, p_name: name.trim() }); _closeModal(); _tToast('Saved', ''); renderTeam(); } catch (e) { console.error(e); _tToast('Could not save', 'error'); } };
  window.teamRemoveMember = function (mid, name) { var S = window.FFP_TEAM, go = async function () { try { await _tSb().rpc('pro_team_remove_member', { p_pro: S.pid, p_team: S.team, p_member: mid }); _tToast('Removed', ''); _closeModal(); _load(S.team); } catch (e) { console.error(e); _tToast('Could not remove', 'error'); } }; if (typeof ffpConfirm === 'function') ffpConfirm({ danger: true, title: 'Remove ' + (name || 'player') + '?', body: 'They\'ll no longer show in this team.', action: 'Remove', onOk: go }); else go(); };

  // ── Add players — full-bleed page (invite/referral link + your clients + email) ──
  async function _showAddPlayerPage() {
    var S = window.FFP_TEAM, host = document.getElementById('team-body'); if (!host) return;
    var team = _teamMeta();
    host.innerHTML = '<div class="ffpt"><div class="ffpt-cardg">' +
      '<div class="ffpt-hero" style="padding:16px 18px 18px;"><div class="ffpt-glow" style="right:-30px;background:radial-gradient(circle,rgba(255,204,0,.22),transparent 62%);"></div>' +
        '<div style="position:relative;display:flex;align-items:center;gap:11px;"><span onclick="teamApDone()" style="cursor:pointer;">' + _ic('arrow_back', 20, 'rgba(255,255,255,.8)') + '</span><div class="ffpt-logo">' + _tEsc(_initials(team.name) || 'T') + '</div><div style="flex:1;"><div style="font-size:16px;font-weight:800;color:#fff;">Add athletes</div><div style="font-size:11px;color:rgba(255,255,255,.55);">' + _tEsc(team.name || 'Team') + '</div></div></div></div>' +
      '<div style="padding:16px;">' +
        '<div style="background:linear-gradient(135deg,#0a3e44,#2ba8e0);border-radius:15px;padding:15px;margin-bottom:20px;color:#fff;box-shadow:0 10px 26px rgba(43,168,224,.3);">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:11px;">' + _ic('link', 17, '#FFCC00') + '<div style="font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">Share your invite link</div></div>' +
          '<div style="display:flex;align-items:center;gap:8px;"><div id="ap-linktext" style="flex:1;background:rgba(255,255,255,.14);border-radius:9px;padding:10px 12px;font-size:12.5px;font-weight:600;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">loading…</div><button onclick="teamApCopy()" style="background:#FFCC00;color:#0a3e44;border:none;border-radius:9px;padding:10px 14px;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit;">Copy</button></div>' +
          '<div style="font-size:11px;color:rgba(255,255,255,.78);margin-top:9px;">They sign up to the Passport through your link (you get the referral), then you add them below.</div>' +
        '</div>' +
        '<div class="ffpt-clab">Add from your clients</div>' +
        '<div style="display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #e4ebec;border-radius:11px;padding:11px 13px;margin-bottom:12px;">' + _ic('search', 16, '#869599') + '<input id="ap-search" oninput="teamApFilter(this.value)" placeholder="Search clients" style="border:none;outline:none;background:transparent;flex:1;font-size:14px;font-family:inherit;color:#0f2327;"></div>' +
        '<div id="ap-list"><div style="color:#869599;font-size:13px;padding:8px 0;">Loading your clients…</div></div>' +
        '<div onclick="teamApEmail()" style="margin-top:16px;display:flex;align-items:center;justify-content:center;gap:7px;color:#0a3e44;font-size:12.5px;font-weight:700;cursor:pointer;">' + _ic('mail', 16) + ' Invite someone by email</div>' +
        '<button class="ffpt-cta" style="margin-top:16px;" onclick="teamApDone()">Done</button>' +
      '</div></div></div>';
    _teamLoadInvite();
    var existing = {}; (S.players || []).forEach(function (p) { existing[p.member_id] = 1; });
    var cands = []; try { var r = await _tSb().rpc('pro_team_candidate_members', { p_pro: S.pid }); cands = (r && r.data) || []; } catch (e) { console.error(e); }
    S._apCands = cands.map(function (c) { return { id: c.id, name: c.name, email: c.email, photo: c.photo, has_passport: !!c.has_passport, added: !!(c.id && existing[c.id]) }; });
    _renderApList('');
  }
  async function _teamLoadInvite() {
    var el = document.getElementById('ap-linktext'); if (!el) return;
    var url = window._proInviteUrl;
    if (!url) {
      var email = (window.FFP_PROVIDER || {}).email || '';
      if (email) { try { var r = await fetch('https://ffp-passport-backend.vercel.app/api/pro/invite?email=' + encodeURIComponent(email)); var j = await r.json(); if (r.ok && j && j.url) { url = j.url; window._proInviteUrl = url; } } catch (e) {} }
    }
    el.textContent = url ? url.replace(/^https?:\/\//, '') : 'ffppassport.com';
    window.FFP_TEAM._invite = url || '';
  }
  function _renderApList(q) {
    var host = document.getElementById('ap-list'); if (!host) return;
    var cands = window.FFP_TEAM._apCands || []; q = (q || '').toLowerCase();
    var list = cands.filter(function (c) { return !q || (c.name || '').toLowerCase().indexOf(q) >= 0 || (c.email || '').toLowerCase().indexOf(q) >= 0; });
    if (!list.length) { host.innerHTML = '<div style="color:#5a6b6e;font-size:13px;padding:10px 2px;">' + (cands.length ? 'No match.' : 'No clients yet — add clients in the Clients tab, or share your link above.') + '</div>'; return; }
    host.innerHTML = list.map(function (c) {
      var action;
      if (c.added) action = '<div style="display:flex;align-items:center;gap:5px;background:#e5f6ee;color:#1d7a4d;border-radius:9px;padding:7px 12px;font-size:12px;font-weight:800;">' + _ic('check', 14) + 'Added</div>';
      else if (c.has_passport) action = '<button style="border:1.5px solid #0a3e44;color:#0a3e44;background:#fff;border-radius:9px;padding:7px 16px;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit;" onclick="teamApAdd(\'' + c.id + '\',\'' + _tEsc((c.name || '').replace(/\'/g, '')) + '\')">Add</button>';
      else action = '<button style="border:1px solid #e4ebec;color:#c8871a;background:#fff6df;border-radius:9px;padding:7px 12px;font-size:11.5px;font-weight:800;cursor:pointer;font-family:inherit;" onclick="teamApCopy()">Invite</button>';
      return '<div style="display:flex;align-items:center;gap:12px;padding:9px 2px;border-top:1px solid #e4ebec;">' + _av(c.name, c.photo, 38) +
        '<div style="flex:1;min-width:0;"><div style="font-size:14px;font-weight:700;color:#0f2327;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + _tEsc(c.name) + '</div><div style="font-size:11px;color:#869599;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (c.has_passport ? _tEsc(c.email || '') : 'No Passport yet · invite to add') + '</div></div>' + action + '</div>';
    }).join('');
  }
  window.teamApFilter = function (v) { _renderApList(v); };
  window.teamApAdd = async function (mid, name) {
    var S = window.FFP_TEAM;
    try {
      await _tSb().rpc('pro_team_add_member', { p_pro: S.pid, p_team: S.team, p_member: mid, p_full_name: name || null });
      var c = (S._apCands || []).find(function (x) { return x.id === mid; }); if (c) c.added = true;
      _renderApList((document.getElementById('ap-search') || {}).value || '');
      try { var rp = await _tSb().rpc('pro_team_players', { p_pro: S.pid, p_team: S.team }); S.players = ((rp && rp.data) || {}).players || []; } catch (e) {}
    } catch (e) { console.error(e); _tToast('Could not add', 'error'); }
  };
  window.teamApCopy = function () { var url = window._proInviteUrl || window.FFP_TEAM._invite; if (!url) { _tToast('Link not ready yet', 'error'); return; } var ok = false; try { navigator.clipboard.writeText(url); ok = true; } catch (e) {} if (!ok) { try { var ta = document.createElement('textarea'); ta.value = url; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); ok = document.execCommand('copy'); document.body.removeChild(ta); } catch (e2) {} } _tToast(ok ? 'Invite link copied' : ('Link: ' + url), ok ? '' : 'error'); };
  window.teamApEmail = function () { var url = window._proInviteUrl || window.FFP_TEAM._invite || ''; var team = _teamMeta(); try { window.location.href = 'mailto:?subject=' + encodeURIComponent('Join ' + (team.name || 'my team') + ' on FFP Passport') + '&body=' + encodeURIComponent('Join our team on FFP Passport — sign up here: ' + url); } catch (e) {} };
  window.teamApDone = async function () { var S = window.FFP_TEAM; S.setTab = 'players'; try { var rp = await _tSb().rpc('pro_team_players', { p_pro: S.pid, p_team: S.team }); S.players = ((rp && rp.data) || {}).players || []; } catch (e) {} _showTeamSettings(); };
  window.teamAddMemberOpen = function () { window.FFP_TEAM.setTab = 'players'; _showAddPlayerPage(); };

  // ── New benchmark — full-bleed page (Measured templates / Skill locked levels) ──
  var SKILL_LEVELS = ['Developing', 'Competent', 'Proficient', 'Advanced', 'Elite'];
  var _benchTpl = null;
  async function _showBenchmarkPage(kind) {
    var S = window.FFP_TEAM, host = document.getElementById('team-body'); if (!host) return;
    S.bKind = kind || S.bKind || 'measured';
    if (S.bTargetLevel == null) S.bTargetLevel = 3;
    if (!S.bDescs) S.bDescs = ['', '', '', '', ''];
    if (!S.bMeasure) S.bMeasure = 'time';
    if (!S.bDir) S.bDir = 'lower';
    if (_benchTpl == null) { try { var r = await _tSb().rpc('benchmark_templates_list', { p_pro: S.pid }); _benchTpl = (r && r.data) || []; _benchTpl.sort(function (a, b) { return String(a.name || '').toLowerCase().localeCompare(String(b.name || '').toLowerCase()); }); } catch (e) { _benchTpl = []; } }
    host.innerHTML = _benchHtml();
    try { if (window.FFPSelect) FFPSelect.enhance(document.getElementById('bm-tpl-wrap')); } catch (e) {}
  }
  function _measHint(meas) { var u = window.FFP_TEAM.bUnit; return meas === 'time' ? 'min:sec (e.g. 15:00)' : (meas === 'weight' ? (u || 'kg') : (u || 'number')); }
  function _benchHtml() {
    var S = window.FFP_TEAM, team = _teamMeta();
    var editing = !!S.bEditId;
    var title = editing ? ('Edit ' + (S.bKind === 'skill' ? 'skill' : 'benchmark')) : 'New benchmark';
    var head = '<div class="ffpt-hero" style="padding:16px 18px 16px;"><div class="ffpt-glow" style="right:-30px;"></div>' +
      '<div style="position:relative;display:flex;align-items:center;gap:11px;"><span onclick="teamBenchBack()" style="cursor:pointer;">' + _ic('arrow_back', 20, 'rgba(255,255,255,.8)') + '</span><div style="flex:1;"><div style="font-size:16px;font-weight:800;color:#fff;">' + title + '</div><div style="font-size:11px;color:rgba(255,255,255,.55);">' + _tEsc(team.name || 'Team') + '</div></div></div></div>';
    var toggle = editing ? '' : ('<div style="display:flex;gap:9px;margin-bottom:20px;">' +
      '<button class="ffpt-typ' + (S.bKind === 'measured' ? ' on' : '') + '" onclick="teamBenchKind(\'measured\')">' + _ic('timer', 22) + '<div style="font-size:12.5px;font-weight:800;margin-top:5px;">Measured test</div></button>' +
      '<button class="ffpt-typ' + (S.bKind === 'skill' ? ' on' : '') + '" onclick="teamBenchKind(\'skill\')">' + _ic('my_location', 22) + '<div style="font-size:12.5px;font-weight:800;margin-top:5px;">Skill</div></button></div>');
    var body;
    if (S.bKind === 'measured') {
      if (editing) {
        body = '<div class="ffpt-clab">Test name</div><input class="ffpt-in" id="bm-name" value="' + _tEsc(S.bName || '') + '" placeholder="e.g. 3km run" style="margin-bottom:20px;">';
      } else {
        var opts = '<option value="">Select a test…</option>' + (_benchTpl || []).map(function (t) { return '<option value="' + t.id + '"' + (S.bTemplate && S.bTemplate.id === t.id ? ' selected' : '') + '>' + _tEsc(t.name) + (t.category ? ' · ' + _tEsc(t.category) : '') + '</option>'; }).join('') + '<option value="custom"' + (S.bCustom ? ' selected' : '') + '>＋ Custom test</option>';
        body = '<div class="ffpt-clab">Test or assessment</div><div id="bm-tpl-wrap" style="margin-bottom:7px;"><select class="ffpt-in" id="bm-tpl" onchange="teamBenchTemplate(this.value)">' + opts + '</select></div><div style="font-size:11.5px;color:#869599;margin-bottom:20px;">Pick a standard test — or create your own.</div>';
        if (S.bCustom) body += '<div class="ffpt-clab">Test name</div><input class="ffpt-in" id="bm-name" value="' + _tEsc(S.bName || '') + '" placeholder="e.g. 3km run" style="margin-bottom:20px;">';
      }
      body += '<div class="ffpt-clab">What you measure</div><div style="display:flex;gap:8px;margin-bottom:20px;">' +
        ['time', 'weight', 'level'].map(function (m) { var ic = { time: 'schedule', weight: 'fitness_center', level: 'stairs' }[m]; return '<button class="ffpt-typ' + (S.bMeasure === m ? ' on' : '') + '" onclick="teamBenchMeasure(\'' + m + '\')">' + _ic(ic, 19) + '<div style="font-size:11.5px;font-weight:800;margin-top:4px;text-transform:capitalize;">' + m + '</div></button>'; }).join('') + '</div>';
      body += '<div class="ffpt-clab">Target</div><input class="ffpt-in" id="bm-target" value="' + _tEsc(S.bTargetVal || '') + '" placeholder="' + _measHint(S.bMeasure) + '" style="margin-bottom:20px;">';
      body += '<div class="ffpt-clab">Better is <span style="text-transform:none;letter-spacing:0;color:#37b06a;font-weight:700;">· auto, tap to change</span></div><div style="display:flex;gap:9px;margin-bottom:22px;">' +
        '<button class="ffpt-typ' + (S.bDir === 'lower' ? ' on' : '') + '" style="padding:12px;" onclick="teamBenchDir(\'lower\')">Lower · faster</button>' +
        '<button class="ffpt-typ' + (S.bDir === 'higher' ? ' on' : '') + '" style="padding:12px;" onclick="teamBenchDir(\'higher\')">Higher · more</button></div>';
    } else {
      var COLS = ['#e24b4a', '#f0932b', '#37b06a', '#2ba8e0', '#8b5cf6'];
      body = '<div class="ffpt-clab">Skill name</div><input class="ffpt-in" id="bm-skname" value="' + _tEsc(S.bName || '') + '" placeholder="Snatch, First touch…" style="margin-bottom:20px;">';
      body += '<div class="ffpt-clab">Describe each level · athletes see these</div>';
      body += SKILL_LEVELS.map(function (nm, i) {
        var lv = i + 1, on = S.bTargetLevel === lv;
        return '<div style="display:flex;align-items:flex-start;gap:11px;margin-bottom:14px;"><div style="width:12px;height:12px;border-radius:50%;background:' + COLS[i] + ';margin-top:4px;flex:0 0 auto;"></div>' +
          '<div style="flex:1;min-width:0;"><div style="display:flex;align-items:center;justify-content:space-between;gap:8px;"><div style="font-size:14px;font-weight:800;color:' + (on ? '#0a3e44' : '#0f2327') + ';">' + nm + '</div>' +
          '<button onclick="teamBenchTarget(' + lv + ')" style="border:1.5px solid ' + (on ? '#0a3e44' : '#ccd9da') + ';background:' + (on ? '#0a3e44' : 'transparent') + ';color:' + (on ? '#fff' : '#869599') + ';border-radius:8px;padding:6px 10px;font-size:9px;font-weight:800;letter-spacing:.4px;cursor:pointer;font-family:inherit;white-space:nowrap;">' + (on ? '✓ TARGET' : 'SET TARGET') + '</button></div>' +
          '<textarea class="ffpt-in" id="bm-desc-' + i + '" rows="2" style="margin-top:6px;font-size:12.5px;font-weight:500;resize:vertical;' + (on ? 'border-color:#0a3e44;background:#f0f7f9;' : '') + '" placeholder="What ' + nm.toLowerCase() + ' looks like…">' + _tEsc(S.bDescs[i] || '') + '</textarea></div></div>';
      }).join('');
    }
    return '<div class="ffpt"><div class="ffpt-cardg">' + head + '<div style="padding:16px;">' + toggle + body + '<button class="ffpt-cta" onclick="teamBenchSave()">' + (editing ? 'Save changes' : 'Add benchmark') + '</button></div></div></div>';
  }
  function _capBench() {
    var S = window.FFP_TEAM;
    var t = document.getElementById('bm-target'); if (t) S.bTargetVal = t.value;
    var nm = document.getElementById('bm-name'); if (nm) S.bName = nm.value;
    var sk = document.getElementById('bm-skname'); if (sk) S.bName = sk.value;
    for (var i = 0; i < 5; i++) { var d = document.getElementById('bm-desc-' + i); if (d) S.bDescs[i] = d.value; }
  }
  window.teamBenchKind = function (k) { _capBench(); window.FFP_TEAM.bKind = k; _showBenchmarkPage(); };
  window.teamBenchMeasure = function (m) { _capBench(); window.FFP_TEAM.bMeasure = m; window.FFP_TEAM.bUnit = null; _showBenchmarkPage(); };
  window.teamBenchDir = function (d) { _capBench(); window.FFP_TEAM.bDir = d; _showBenchmarkPage(); };
  window.teamBenchTarget = function (lv) { _capBench(); window.FFP_TEAM.bTargetLevel = lv; _showBenchmarkPage(); };
  window.teamBenchTemplate = function (val) {
    _capBench(); var S = window.FFP_TEAM;
    if (val === 'custom') { S.bCustom = true; S.bTemplate = null; }
    else if (!val) { S.bCustom = false; S.bTemplate = null; }
    else { var t = (_benchTpl || []).find(function (x) { return x.id === val; }); if (t) { S.bCustom = false; S.bTemplate = t; S.bName = t.name; S.bMeasure = t.measure_type; S.bDir = t.direction; S.bUnit = t.unit_hint; } }
    _showBenchmarkPage();
  };
  function _clearBench() { var S = window.FFP_TEAM; S.bTemplate = null; S.bCustom = false; S.bName = null; S.bTargetVal = null; S.bDescs = null; S.bMeasure = null; S.bDir = null; S.bTargetLevel = null; S.bUnit = null; S.bEditId = null; }
  window.teamBenchBack = function () { var S = window.FFP_TEAM; S.setTab = (S.bKind === 'skill') ? 'skills' : 'benchmarks'; _clearBench(); _showTeamSettings(); };
  function _parseTarget(v, meas) { if (v == null || v === '') return null; v = String(v).trim(); if (meas === 'time' && /^\d+:\d{1,2}$/.test(v)) { var p = v.split(':'); return Number(p[0]) * 60 + Number(p[1]); } var n = Number(v); return isNaN(n) ? null : n; }
  async function _afterBenchSave(kind) { var S = window.FFP_TEAM; try { var ro = await _tSb().rpc('pro_team_overview', { p_pro: S.pid, p_team: S.team }); S.overview = (ro && ro.data) || {}; } catch (e) {} try { var lr = await _tSb().rpc('pro_teams_list', { p_pro: S.pid }); S.teams = (lr && lr.data) || S.teams; } catch (e) {} S.setTab = (kind === 'skill') ? 'skills' : 'benchmarks'; _showTeamSettings(); }
  window.teamBenchSave = async function () {
    _capBench(); var S = window.FFP_TEAM;
    if (S.bKind === 'skill') {
      var sname = S.bName || ''; if (!sname.trim()) { _tToast('Name the skill', 'error'); return; }
      // Read the description textareas DIRECTLY at save time (source of truth), falling back to captured state — so an edit always sends what's on screen.
      var levels = SKILL_LEVELS.map(function (nm, i) {
        var d = document.getElementById('bm-desc-' + i);
        var desc = d ? d.value : ((S.bDescs && S.bDescs[i]) || '');
        desc = (desc == null ? '' : String(desc)).trim();
        return { level_no: i + 1, name: nm, description: desc || null };
      });
      try { var rs = await _tSb().rpc('pro_benchmark_upsert', { p_pro: S.pid, p_team: S.team, p_kind: 'skill', p_name: sname.trim(), p_target_level: S.bTargetLevel || 3, p_levels: levels, p_id: S.bEditId || null }); if (rs && rs.error) throw rs.error; _tToast(S.bEditId ? 'Skill updated' : 'Skill added', ''); _clearBench(); _afterBenchSave('skill'); }
      catch (e) { console.error('[FFP Team] skill save', e); _tToast('Could not add skill' + (e && e.message ? ': ' + e.message : ''), 'error'); }
      return;
    }
    var mname = S.bTemplate ? S.bTemplate.name : (S.bName || '');
    if (!mname.trim()) { _tToast('Pick or name a test', 'error'); return; }
    var unit = S.bMeasure === 'time' ? 's' : (S.bMeasure === 'weight' ? 'kg' : (S.bUnit || 'level'));
    var target = _parseTarget(S.bTargetVal, S.bMeasure);
    try {
      var rm = await _tSb().rpc('pro_benchmark_upsert', { p_pro: S.pid, p_team: S.team, p_kind: 'measured', p_name: mname.trim(), p_unit: unit, p_target_value: target, p_direction: S.bDir || 'lower', p_id: S.bEditId || null });
      if (rm && rm.error) throw rm.error;
      if (S.bCustom && !S.bEditId) { try { await _tSb().rpc('benchmark_template_save', { p_pro: S.pid, p_name: mname.trim(), p_measure_type: S.bMeasure, p_direction: S.bDir, p_unit_hint: unit }); } catch (e) {} }
      _tToast(S.bEditId ? 'Benchmark updated' : 'Benchmark added', ''); _clearBench(); _afterBenchSave('measured');
    } catch (e) { console.error('[FFP Team] benchmark save', e); _tToast('Could not add benchmark' + (e && e.message ? ': ' + e.message : ''), 'error'); }
  };
  window.teamMarkCreateOpen = function () { _clearBench(); _showBenchmarkPage('measured'); };
  window.teamSkillCreateOpen = function () { _clearBench(); _showBenchmarkPage('skill'); };

  window.teamRecordOpen = function (benchId, kind) {
    var S = window.FFP_TEAM; if (!S.sel) { _tToast('Open an athlete first', 'error'); return; }
    var pname = (S.detail && S.detail.member && S.detail.member.name) || 'athlete', body;
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
  // Tap-to-confirm a skill level straight from the athlete detail (no modal).
  window.teamSkillSet = async function (skillId, levelNo) {
    var S = window.FFP_TEAM; if (!S.sel) { _tToast('Open an athlete first', 'error'); return; }
    try {
      await _tSb().rpc('pro_benchmark_record', { p_pro: S.pid, p_benchmark: skillId, p_member: S.sel, p_level_no: levelNo, p_note: null });
      _tToast('Level set', '');
      try { var rd = await _tSb().rpc('pro_player_detail', { p_pro: S.pid, p_team: S.team, p_member: S.sel }); S.detail = (rd && rd.data) || {}; } catch (e) {}
      try { var ro = await _tSb().rpc('pro_team_overview', { p_pro: S.pid, p_team: S.team }); S.overview = (ro && ro.data) || {}; } catch (e) {}
      _paint();
    } catch (e) { console.error(e); _tToast('Could not set level', 'error'); }
  };
  window.teamSwitchOpen = function () { var S = window.FFP_TEAM; var body = (S.teams || []).map(function (t) { return '<button style="display:flex;width:100%;align-items:center;gap:10px;padding:12px;border:1px solid #e4ebec;border-radius:12px;background:' + (t.id === S.team ? '#eef3f4' : '#fff') + ';margin-bottom:8px;cursor:pointer;font-family:inherit;text-align:left;" onclick="teamSwitch(\'' + t.id + '\')">' + _ic('groups', 20, '#0a3e44') + '<div><div style="font-weight:800;">' + _tEsc(t.name) + '</div><div style="font-size:12px;color:#5a6b6e;">' + (t.member_count || 0) + ' athletes</div></div></button>'; }).join('') + '<button class="ffpt-min" style="width:100%;margin-top:6px;background:#0a3e44;color:#fff;font-weight:800;cursor:pointer;" onclick="teamShowCreate();ffpCloseModal()">+ New team</button>'; openModalShell('sm', 'Your teams', body, '<button class="ffpt-min" style="width:auto;padding:11px 18px;background:#eef3f4;font-weight:800;cursor:pointer;" onclick="ffpCloseModal()">Close</button>'); };
  window.teamSwitch = function (id) { window.FFP_TEAM.team = id; _closeModal(); _load(id); };

  window.renderTeam = renderTeam;
  try { if (document.getElementById('team-body')) renderTeam(); } catch (e) {}
})();
