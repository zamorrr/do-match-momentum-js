// ==UserScript==
// @name         Dugout Online - Match Momentum
// @namespace    https://github.com/zamorrr/do-match-momentum-js
// @version      1.6.24
// @description  Adds a Match Momentum tab with an SVG momentum chart, compact match timeline and statistics. No external services, no credentials, no Google Drive.
// @author       zamorrr
// @match        https://dugout-online.com/game/*
// @match        https://www.dugout-online.com/game/*
// @homepageURL  https://github.com/zamorrr/do-match-momentum-js
// @updateURL    https://raw.githubusercontent.com/zamorrr/do-match-momentum-js/main/Dugout_Match_Momentum.user.js
// @downloadURL  https://raw.githubusercontent.com/zamorrr/do-match-momentum-js/main/Dugout_Match_Momentum.user.js
// @run-at       document-idle
// @grant        GM_info
// ==/UserScript==

(() => {
  'use strict';

  // ---------------------------------------------------------------------------
  // Theme
  // ---------------------------------------------------------------------------
  const THEME = {
    bg: '#f3f4ef',
    panel: '#ecece6',
    field: '#efefe8',
    text: '#2f3532',
    header: '#1f5b24',
    grid: '#d3d5cb',
    border: '#c6c9bd',
    subtle: '#5f6c62',
    track: '#d2d6cf',
    goal: '#d0a03a',
    yellow: '#f0c419',
    red: '#c65151',
    goalHomeBg: '#f2dddd',
    goalAwayBg: '#dee8f4',
    fallbackHome: '#c65151',
    fallbackAway: '#4f79a7',
  };

  const BAR_WEIGHTS = {
    goal: 10.0,
    shot_on: 3.0,
    shot_off: 1.2,
    shot_blocked: 1.5,
    offside: 0,
    yellow: 0,
    red: 0,
    injury: 0,
    substitution: 0,
  };

  // Consistent vector icon set. We intentionally avoid emoji here so the
  // appearance is identical in Chrome and Firefox and scales cleanly at any DPI.
  const ICON_PATHS = {
    goal: `
      <circle cx="12" cy="12" r="9" fill="#fff" stroke="currentColor" stroke-width="1.55"/>
      <path d="M12 7.2 15 9.35 13.85 12.85h-3.7L9 9.35 12 7.2z" fill="currentColor"/>
      <path d="M12 7.2 10.2 4.1M15 9.35l3.5-1.05M13.85 12.85l2.25 3.25M10.15 12.85 7.9 16.1M9 9.35 5.5 8.3" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/>
      <path d="M9.25 3.75 12 3l2.75.75-1.25 1.55h-3zM18.7 6.35 21 8.55l-.2 2.35-2-.45-1-2.35zM18.35 16.2l-.85 2.75-2.2 1.35-1.1-1.9 1.9-2.3zM8.7 20.3l-2.2-1.35-.85-2.75 2.25-.1 1.9 2.3zM3.2 10.9 3 8.55l2.3-2.2.9 1.75-1 2.35z" fill="currentColor"/>
    `,
    shot_on: `
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/>
      <circle cx="12" cy="12" r="4.6" fill="none" stroke="currentColor" stroke-width="1.8"/>
      <circle cx="12" cy="12" r="1.7" fill="currentColor"/>
      <path d="M17.2 6.8l3.1-3.1M20.3 3.7v3.2M20.3 3.7h-3.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    `,
    shot_off: `
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.6" opacity=".55"/>
      <path d="M8 8l8 8M16 8l-8 8" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"/>
    `,
    shot_blocked: `
      <path d="M12 3.4 19 6v5.1c0 4.8-2.8 8-7 9.6-4.2-1.6-7-4.8-7-9.6V6l7-2.6z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M8.2 12h7.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    `,
    yellow: `
      <rect x="7.4" y="4.2" width="9.2" height="15.6" rx="1.2" fill="#f0c419" stroke="rgba(0,0,0,.45)" stroke-width="1"/>
    `,
    red: `
      <rect x="7.4" y="4.2" width="9.2" height="15.6" rx="1.2" fill="#c65151" stroke="rgba(0,0,0,.45)" stroke-width="1"/>
    `,
    injury: `
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.7"/>
      <path d="M12 7.2v9.6M7.2 12h9.6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
    `,
    offside: `
      <path d="M7 20V4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M8 5h10L8 11z" fill="currentColor" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
    `,
    substitution: `
      <path d="M6.2 8.4h10.2l-2.6-2.6M17.8 15.6H7.6l2.6 2.6" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
    `,
  };

  function iconHtml(type, size = 18, extraClass = '') {
    const body = ICON_PATHS[type] || '<circle cx="12" cy="12" r="2" fill="currentColor"/>';
    return `<svg class="do-mm-icon ${extraClass}" viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" focusable="false">${body}</svg>`;
  }

  function flagHtml(lang) {
    if (lang === 'en') {
      // Union Jack drawn as SVG, so it always represents the United Kingdom
      // instead of depending on the platform's emoji glyph.
      return `<svg class="do-mm-flag" viewBox="0 0 60 36" aria-hidden="true" focusable="false">
        <rect width="60" height="36" rx="2" fill="#012169"/>
        <path d="M0 0 60 36M60 0 0 36" stroke="#fff" stroke-width="8"/>
        <path d="M0 0 60 36M60 0 0 36" stroke="#C8102E" stroke-width="4"/>
        <path d="M30 0v36M0 18h60" stroke="#fff" stroke-width="12"/>
        <path d="M30 0v36M0 18h60" stroke="#C8102E" stroke-width="7"/>
      </svg>`;
    }
    return `<svg class="do-mm-flag" viewBox="0 0 60 36" aria-hidden="true" focusable="false">
      <rect width="60" height="18" rx="2" fill="#fff"/>
      <path d="M0 18h60v16a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2z" fill="#DC143C"/>
      <rect width="60" height="36" rx="2" fill="none" stroke="rgba(0,0,0,.18)"/>
    </svg>`;
  }

  const I18N = {
    en: {
      event: {
        goal: 'Goal', shot_on: 'Shot on target', shot_off: 'Shot off target',
        shot_blocked: 'Blocked', yellow: 'Yellow card', red: 'Red card',
        injury: 'Injury', offside: 'Offside', substitution: 'Substitution',
      },
      halftime: 'HALF-TIME', extraTime: 'EXTRA TIME', minute: 'Minute',
      stats: 'STATISTICS', possession: 'POSSESSION', shotsTotal: 'TOTAL SHOTS',
      shotsOn: 'SHOTS ON TARGET', shotsOff: 'SHOTS OFF TARGET', cards: 'CARDS',
      fouls: 'FOULS', offsides: 'OFFSIDES', corners: 'CORNERS', freeKicks: 'FREE KICKS',
      timeline: 'MATCH TIMELINE', firstHalf: '1ST HALF', secondHalf: '2ND HALF',
      matchMomentum: 'MATCH MOMENTUM',
    },
    pl: {
      event: {
        goal: 'Gol', shot_on: 'Strzał celny', shot_off: 'Strzał niecelny',
        shot_blocked: 'Zablokowany', yellow: 'Żółta kartka', red: 'Czerwona kartka',
        injury: 'Kontuzja', offside: 'Spalony', substitution: 'Zmiana',
      },
      halftime: 'PRZERWA', extraTime: 'DOGRYWKA', minute: 'Minuta',
      stats: 'STATYSTYKI', possession: 'POSIADANIE PIŁKI', shotsTotal: 'STRZAŁY ŁĄCZNIE',
      shotsOn: 'STRZAŁY CELNE', shotsOff: 'STRZAŁY NIECELNE', cards: 'KARTKI',
      fouls: 'FAULE', offsides: 'SPALONE', corners: 'RZUTY ROŻNE', freeKicks: 'RZUTY WOLNE',
      timeline: 'PRZEBIEG MECZU', firstHalf: '1. POŁOWA', secondHalf: '2. POŁOWA',
      matchMomentum: 'MATCH MOMENTUM',
    },
  };

  let currentLang = 'en';
  let timelineNewestFirst = false;
  const tr = key => I18N[currentLang]?.[key] ?? I18N.en[key] ?? key;
  const eventLabel = type => I18N[currentLang]?.event?.[type] ?? I18N.en.event[type] ?? type;

  const APP_ID = 'do-mm-app';
  const TAB_ID = 'do-mm-tab';
  const STYLE_ID = 'do-mm-style';

  // ---------------------------------------------------------------------------
  // Small helpers
  // ---------------------------------------------------------------------------
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  function normText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function escapeRegex(value) {
    return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function normalizePlayerNameForMatch(value) {
    return normText(value)
      .replace(/\s*\((?:p\.?|og\.?)\)\s*$/i, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/gi, ' ')
      .trim()
      .toLowerCase();
  }

  function playerNameMatchesKeyEvent(fullName, keyName) {
    const full = normalizePlayerNameForMatch(fullName);
    const key = normalizePlayerNameForMatch(keyName);
    if (!full || !key) return false;
    if (full === key || full.endsWith(` ${key}`)) return true;

    const fullTokens = full.split(/\s+/);
    const keyTokens = key.split(/\s+/);
    const fullLast = fullTokens[fullTokens.length - 1];
    const keyLast = keyTokens[keyTokens.length - 1];
    return fullLast === keyLast;
  }

  function fullGoalScorerFromComment(ev, authoritativeName) {
    const candidates = Array.isArray(ev.goal_comment_players) ? ev.goal_comment_players : [];
    const matched = candidates.filter(item => playerNameMatchesKeyEvent(item.name, authoritativeName));
    if (matched.length === 1) return matched[0];

    // If more than one linked player shares the same surname, prefer the player
    // already selected by the Python-equivalent shooter parser, but never guess
    // between different people solely from link order.
    if (matched.length > 1) {
      const current = matched.find(item => normalizePlayerNameForMatch(item.name) === normalizePlayerNameForMatch(ev.player));
      if (current) return current;
    }
    return null;
  }

  function esc(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function hexToRgb(color) {
    let c = String(color || '').trim();
    const rgb = c.match(/^rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
    c = c.replace('#', '');
    if (c.length === 3) c = c.split('').map(ch => ch + ch).join('');
    if (c.length >= 8) c = c.slice(0, 6);
    if (!/^[0-9a-f]{6}$/i.test(c)) return [47, 53, 50];
    return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
  }

  function rgbToHex(rgb) {
    return '#' + rgb.map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
  }

  function colorWithAlpha(color, alpha) {
    const [r, g, b] = hexToRgb(color);
    return `rgba(${r}, ${g}, ${b}, ${clamp(alpha, 0, 1)})`;
  }

  function relLuminance(color) {
    const [r, g, b] = hexToRgb(color).map(v => {
      const x = v / 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function contrastRatio(a, b) {
    const l1 = relLuminance(a);
    const l2 = relLuminance(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }

  function mixColors(a, b, weight) {
    const ar = hexToRgb(a);
    const br = hexToRgb(b);
    const w = clamp(weight, 0, 1);
    return rgbToHex(ar.map((v, i) => v * (1 - w) + br[i] * w));
  }

  // Team fills/markers always keep the exact official club colour.
  // Only text is adjusted when that colour is too pale for the light UI surfaces.
  function readableTeamTextColor(color) {
    if (!color) return THEME.text;

    // Text appears on a few very similar light backgrounds. Require acceptable
    // contrast on all of them; otherwise use the standard dark interface text.
    const backgrounds = [THEME.field, THEME.panel, '#fbfbfa'];
    const minContrast = Math.min(...backgrounds.map(bg => contrastRatio(color, bg)));

    if (minContrast >= 3.8) return color;
    return THEME.text;
  }

  function statBarSeparatorColor(homeColor, awayColor) {
    // Choose whichever neutral divider (white or near-black) keeps the best
    // minimum contrast against both adjacent team fills. This handles dark,
    // light and mixed colour pairs without hardcoding any club colour.
    const white = '#ffffff';
    const dark = '#202420';
    const whiteScore = Math.min(contrastRatio(white, homeColor), contrastRatio(white, awayColor));
    const darkScore = Math.min(contrastRatio(dark, homeColor), contrastRatio(dark, awayColor));
    return whiteScore >= darkScore ? white : dark;
  }

  function colorFromStyle(el, property = 'backgroundColor') {
    if (!el) return null;
    const v = getComputedStyle(el)[property];
    if (!v || v === 'rgba(0, 0, 0, 0)' || v === 'transparent') return null;
    return rgbToHex(hexToRgb(v));
  }

  function minuteFloat(ev) {
    return ev.minute + ev.seconds / 60;
  }

  function displayTime(ev) {
    return `${String(ev.minute).padStart(2, '0')}:${String(ev.seconds).padStart(2, '0')}`;
  }

  function displayMinuteCeil(ev) {
    return `${ev.minute + (ev.seconds > 0 ? 1 : 0)}'`;
  }

  function uniqueBy(items, keyFn) {
    const seen = new Set();
    const out = [];
    for (const item of items) {
      const key = keyFn(item);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(item);
    }
    return out;
  }

  // ---------------------------------------------------------------------------
  // Parser - supports the redesigned and legacy match views
  // ---------------------------------------------------------------------------
  function parseTeamInfo() {
    const newHome = document.querySelector('.do-mv-team.home .do-mv-team-name');
    const newAway = document.querySelector('.do-mv-team.away .do-mv-team-name');

    let homeName = newHome ? normText(newHome.textContent) : '';
    let awayName = newAway ? normText(newAway.textContent) : '';

    if (!homeName || !awayName) {
      const candidates = [...document.querySelectorAll('div.game_general')]
        .filter(el => /371px/.test(el.getAttribute('style') || '') && normText(el.textContent));
      if (!homeName && candidates[0]) homeName = normText(candidates[0].textContent);
      if (!awayName && candidates[1]) awayName = normText(candidates[1].textContent);
    }

    if (!homeName || !awayName) {
      const clubLinks = [...document.querySelectorAll('a[href*="clubid/"]')]
        .map(a => normText(a.textContent)).filter(Boolean);
      homeName ||= clubLinks[0] || 'Home';
      awayName ||= clubLinks[1] || 'Away';
    }

    const clubLinks = [...document.querySelectorAll('a[href*="clubid/"]')];
    const clubIdForName = name => {
      const exact = clubLinks.find(a => normText(a.textContent) === name);
      const m = exact?.href.match(/clubid\/(\d+)/i);
      return m ? m[1] : null;
    };

    let homeClubId = clubIdForName(homeName);
    let awayClubId = clubIdForName(awayName);

    const allIds = uniqueBy(
      clubLinks.map(a => (a.href.match(/clubid\/(\d+)/i) || [])[1]).filter(Boolean),
      x => x,
    );
    homeClubId ||= allIds[0] || null;
    awayClubId ||= allIds.find(x => x !== homeClubId) || allIds[1] || null;

    const homeBadgeWrap = document.querySelector('.do-mv-team.home .do-mv-badge-wrap');
    const awayBadgeWrap = document.querySelector('.do-mv-team.away .do-mv-badge-wrap');

    const fallbackBadge = clubId => clubId
      ? `<img class="do-mm-fallback-badge" src="https://www.dugout-online.com/inc/show_custom_badge.php?id=${encodeURIComponent(clubId)}" alt="">`
      : '';

    const homeBadgeHtml = homeBadgeWrap ? homeBadgeWrap.outerHTML : fallbackBadge(homeClubId);
    const awayBadgeHtml = awayBadgeWrap ? awayBadgeWrap.outerHTML : fallbackBadge(awayClubId);

    return { homeName, awayName, homeClubId, awayClubId, homeBadgeHtml, awayBadgeHtml };
  }

  function parseUiPalette() {
    const scorebar = document.querySelector('.do-mv-scorebar');
    const bodyBg = colorFromStyle(document.body) || THEME.bg;
    const headerBg = colorFromStyle(scorebar) || '#f5f5f0';
    const headerText = colorFromStyle(scorebar, 'color') || THEME.text;
    const headerBorder = scorebar ? rgbToHex(hexToRgb(getComputedStyle(scorebar).borderTopColor)) : THEME.border;
    return { bodyBg, headerBg, headerText, headerBorder };
  }

  function parseScore() {
    const score = document.querySelector('.do-mv-score-nums');
    if (score) {
      const nums = (score.textContent.match(/\d+/g) || []).map(Number);
      if (nums.length >= 2) return [nums[0], nums[1]];
    }
    const h = Number(normText(document.querySelector('#goals_home')?.textContent)) || 0;
    const a = Number(normText(document.querySelector('#goals_away')?.textContent)) || 0;
    return [h, a];
  }

  function parseTeamColors() {
    let home = null;
    let away = null;

    for (const script of [...document.scripts]) {
      const txt = script.textContent || '';
      const hm = txt.match(/homeColor\s*:\s*["'](#[0-9a-f]{3,8})["']/i);
      const am = txt.match(/awayColor\s*:\s*["'](#[0-9a-f]{3,8})["']/i);
      if (hm) home = hm[1];
      if (am) away = am[1];
      if (home && away) break;
    }

    home ||= colorFromStyle(document.querySelector('.do-mv-fchip:first-child'));
    away ||= colorFromStyle(document.querySelector('.do-mv-fchip:last-child'));
    home ||= colorFromStyle(document.querySelector('.do-mv-side.home .do-mv-side-title'));
    away ||= colorFromStyle(document.querySelector('.do-mv-side.away .do-mv-side-title'));
    home ||= colorFromStyle(document.querySelector('.do-mv-stat-tn'), 'color');
    away ||= colorFromStyle(document.querySelector('.do-mv-stat-tn.away'), 'color');

    home ||= THEME.fallbackHome;
    away ||= THEME.fallbackAway;

    return {
      homeOriginal: home,
      awayOriginal: away,
      home,
      away,
      homeText: readableTeamTextColor(home),
      awayText: readableTeamTextColor(away),
    };
  }

  function normalizeIconName(cell) {
    const img = cell?.querySelector('img');
    if (img?.src) {
      const file = img.src.split('/').pop().split('?')[0].replace(/\.[^.]+$/, '');
      return file.replace(/_[A-Za-z0-9]+$/, '').toLowerCase();
    }
    if (cell?.querySelector('.do-mv-cdot')) return 'icon-event';
    return '';
  }

  function extractSurnames(full) {
    const clean = normText(String(full || '').replace(/\./g, ''));
    if (!clean) return new Set();
    const parts = clean.split(/\s+/).filter(Boolean);
    const out = new Set();
    if (parts.length) {
      out.add(parts[parts.length - 1].toLowerCase());
      out.add(clean.toLowerCase());
      if (parts.length >= 2) out.add(parts.slice(1).join(' ').toLowerCase());
    }
    return out;
  }

  function parseGoalkeepers(teamInfo, commentaryRoot) {
    let homeGk = '';
    let awayGk = '';

    // Exact equivalent of the current Python parser for the redesigned viewer.
    for (const [side, selector] of [['home', '.do-mv-side.home'], ['away', '.do-mv-side.away']]) {
      const sideBox = document.querySelector(selector);
      if (!sideBox) continue;
      for (const row of sideBox.querySelectorAll('.do-mv-prow')) {
        const role = row.querySelector('.do-mv-prole');
        const player = row.querySelector('.do-mv-pname');
        if (role && player && normText(role.textContent).toUpperCase() === 'GK') {
          if (side === 'home') homeGk = normText(player.textContent);
          else awayGk = normText(player.textContent);
          break;
        }
      }
    }

    // Legacy formation commentary fallback, matching the Python implementation.
    if (commentaryRoot) {
      for (const table of commentaryRoot.querySelectorAll('table')) {
        const txt = normText(table.textContent);
        if (!txt.includes('(GK)') || !/formation/i.test(txt)) continue;
        const clubLink = table.querySelector('a[href*="clubid/"]');
        let teamSide = 'unknown';
        if (clubLink) {
          const cid = (clubLink.href.match(/clubid\/(\d+)/i) || [])[1];
          if (cid === teamInfo.homeClubId) teamSide = 'home';
          else if (cid === teamInfo.awayClubId) teamSide = 'away';
        }
        for (const pl of table.querySelectorAll('a[href*="playerID/"]')) {
          const plText = normText(pl.textContent);
          if (!plText.endsWith('(GK)')) continue;
          const gkName = plText.replace(/\(GK\)\s*$/, '').trim();
          if (teamSide === 'home' && !homeGk) homeGk = gkName;
          else if (teamSide === 'away' && !awayGk) awayGk = gkName;
          break;
        }
      }
    }

    return {
      homeGk,
      awayGk,
      homeGkNames: extractSurnames(homeGk),
      awayGkNames: extractSurnames(awayGk),
    };
  }

  function classifyEvent(iconName, text, team, homeGkNames, awayGkNames) {
    const tl = String(text || '').toLowerCase();
    iconName = String(iconName || '').replace(/_[A-Za-z0-9]+$/, '');

    // Icon-based classification: exactly the same priority as match_momentum.py.
    if (iconName === 'icon-goal') return 'goal';
    if (iconName.includes('yellowcard')) return 'yellow';
    if (iconName.includes('redcard')) return 'red';
    if (iconName.includes('offside')) return 'offside';
    if (iconName.includes('substitution')) return 'substitution';
    if (iconName.includes('injury')) return 'injury';
    if (iconName !== 'icon-event') return null;

    const opposingGk = team === 'home'
      ? awayGkNames
      : team === 'away'
        ? homeGkNames
        : new Set([...homeGkNames, ...awayGkNames]);

    const shotOnPatterns = [
      /safe hands from/i,
      /safe hands by/i,
      /saves!/i,
      /saves it!/i,
      /saved!/i,
      /saved by the keeper/i,
      /saved by the goalkeeper/i,
      /saved by/i,
      /keeper with a save/i,
      /no problem for the keeper/i,
      /no problem for/i,
      /with fantastic save/i,
      /fantastic save by/i,
      /great save by/i,
      /good save by the keeper/i,
      /quality save by the keeper/i,
      /quality goalkeeping/i,
      /oh,? what a save by/i,
      /what a save by/i,
      /keeper with a brilliant save/i,
      /keeper dives and tips it away/i,
      /keeper parries and tips it wide/i,
      /dives and tips it away/i,
      /great reactions from the keeper/i,
      /goalkeeper pushed it over/i,
      /he reacted quickly/i,
      /saves and holds the ball/i,
      /keeper (saves?|dives?|tips?|catches)/i,
      /goalkeeper saves/i,
      /had it covered/i,
      /got it covered/i,
      /equals to it/i,
      /off the bar/i,
      /off the post/i,
      /it hits? the post/i,
      /hit the post/i,
      /hits the post/i,
      /but it hit the post/i,
      /thunders off the bar/i,
      /cannons off the bar/i,
      /effort bounces off the bar/i,
    ];
    if (shotOnPatterns.some(rx => rx.test(tl))) return 'shot_on';

    for (const gk of opposingGk) {
      if (!gk) continue;
      const escGk = escapeRegex(gk);
      const rx = new RegExp(`(saved? by\\s+.*?${escGk}|${escGk}\\s+saves?)`, 'i');
      if (rx.test(tl)) return 'shot_on';
    }

    const shotOffPatterns = [
      /off target!/i,
      /but it goes off target/i,
      /wide off target/i,
      /goes? wide off target/i,
      /goes? high and wide off target/i,
      /goes? just wide off target/i,
      /way off target/i,
      /just off target/i,
      /but just off target/i,
      /over the bar!/i,
      /just over the bar/i,
      /but it goes over the bar/i,
      /nods it over the bar/i,
      /heads it over the bar/i,
      /header goes over the bar/i,
      /goes? wide!/i,
      /but it goes wide/i,
      /just wide!/i,
      /oh,? just wide/i,
      /inches wide/i,
      /oh,? inches wide/i,
      /header off target/i,
      /but the header goes off target/i,
      /deflects of the wall and goes wide/i,
    ];
    if (shotOffPatterns.some(rx => rx.test(tl))) return 'shot_off';

    const blockedPatterns = [
      /blocks the shot!/i,
      /blocks the shot just in time/i,
      /good block by/i,
    ];
    if (blockedPatterns.some(rx => rx.test(tl))) return 'shot_blocked';

    if (/but (the ball )?hits /i.test(tl) && /shoot|latches onto|fires|drives it|blasts/i.test(tl)) {
      return 'shot_blocked';
    }

    return null;
  }

  function findPlayerLinks(desc) {
    return [...desc.querySelectorAll('a[href*="playerID/"]')];
  }

  function playerUrlFromLink(link) {
    if (!link) return '';
    try {
      return new URL(link.getAttribute('href') || link.href, location.href).href;
    } catch (_) {
      return link.href || '';
    }
  }

  function playerUrlByName(links, playerName) {
    const wanted = normText(playerName).replace(/\s*\(p\.\)\s*$/i, '').trim().toLowerCase();
    if (!wanted) return '';
    const exact = links.find(link => normText(link.textContent).toLowerCase() === wanted);
    if (exact) return playerUrlFromLink(exact);
    const partial = links.find(link => wanted.includes(normText(link.textContent).toLowerCase()) || normText(link.textContent).toLowerCase().includes(wanted));
    return playerUrlFromLink(partial);
  }

  function getCardPlayerName(desc) {
    const links = findPlayerLinks(desc);
    if (!links.length) return '';

    const text = normText(desc.textContent);
    const tl = text.toLowerCase();

    if (tl.includes('goes to the ground') && tl.includes('missed the ball completely')) {
      for (const link of links) {
        const playerName = normText(link.textContent);
        const rx = new RegExp(`${escapeRegex(playerName)}\\s+missed\\s+the\\s+ball\\s+completely`, 'i');
        if (rx.test(text)) return playerName;
      }
    }

    return normText(links[0].textContent);
  }

  function getShooterName(desc, eventType) {
    const links = findPlayerLinks(desc);
    if (!links.length) return '';

    const text = normText(desc.textContent).toLowerCase();

    if (['shot_on', 'shot_off', 'shot_blocked', 'goal'].includes(eventType)) {
      // Ported literally from the current Python get_shooter_name().
      const targetPatterns = [
        /(?:long ball|long pass|high pass|low pass|quick pass|direct pass|short pass|pass|ball)\s+towards\s+(?!(?:the\s+)?goal\b|(?:the\s+)?(?:top|bottom|far|near)\s+corner\b)/gi,
        /finds\s+(?!himself\b|his\s+way\b)/gi,
        /towards\s+(?!(?:the\s+)?goal\b|(?:the\s+)?(?:top|bottom|far|near)\s+corner\b)/gi,
      ];

      for (const pattern of targetPatterns) {
        pattern.lastIndex = 0;
        let last = null;
        let m;
        while ((m = pattern.exec(text)) !== null) {
          last = { end: pattern.lastIndex };
          if (pattern.lastIndex === m.index) pattern.lastIndex++;
        }
        if (!last) continue;

        const targetText = text.slice(last.end);
        for (const link of links) {
          const linkText = normText(link.textContent).toLowerCase();
          if (linkText && targetText.includes(linkText)) return normText(link.textContent);
        }
      }
    }

    return normText(links[0].textContent);
  }

  function resolveTeam(desc, teamInfo) {
    // Do not infer the team from arbitrary player names or free text.
    // This mirrors the Python parser: only the club link decides the side.
    const club = desc.querySelector('a[href*="clubid/"]');
    if (!club) return 'unknown';
    const id = (club.href.match(/clubid\/(\d+)/i) || [])[1];
    if (id && id === teamInfo.homeClubId) return 'home';
    if (id && id === teamInfo.awayClubId) return 'away';
    return 'unknown';
  }

  function hasInjuryReplacement(text) {
    const patterns = [
      /\bis\s+(?:getting\s+)?ready\s+to\s+replace\s+(?:him|her|them)\b/i,
      /\bwill\s+replace\s+(?:him|her|them)\b/i,
      /\bwill\s+come\s+on\s+to\s+replace\s+(?:him|her|them)\b/i,
      /\bcomes?\s+on\s+to\s+replace\s+(?:him|her|them)\b/i,
      /\bwill\s+replace\s+the\s+injured\b/i,
      /\b(?:he|she)(?:['’]ll|\s+will)\s+be\s+replaced\s+by\b/i,
    ];
    return patterns.some(rx => rx.test(text));
  }

  function isFoulComment(text) {
    const tl = String(text || '').toLowerCase();
    if (/\bno\s+foul\b/i.test(tl)) return false;
    if (/\bplay\s+on\b/i.test(tl)) return false;
    if (/\bfoul\b/i.test(tl)) return true;

    const foulAction = /\b(?:trips?|kicks?|tackles?|clatters?|holds?|pulls?|climbs?|slid|missed)\b/i.test(tl);
    const refereeStops = /\b(?:ref|referee)\s+stops?\s+the\s+play\b/i.test(tl);
    const cardGiven = /\b(?:yellow|red)\s+card\b/i.test(tl);
    const illegalContact = /didn'?t\s+play\s+the\s+ball|did\s+not\s+play\s+the\s+ball|nowhere\s+near\s+the\s+ball|missed\s+the\s+ball\s+completely/i.test(tl);
    return foulAction && refereeStops && cardGiven && illegalContact;
  }

  function isCornerComment(text) {
    return /(?:^|\.\.\.)\s*corner(?:\s+awarded)?!|\b(?:will\s+take|to\s+take|takes?|prepares\s+to\s+take)\s+(?:this|the)\s+corner\b/i.test(text);
  }

  function isFreeKickComment(text) {
    return /\b(?:indirect\s+)?free\s+kick\b/i.test(text);
  }

  function parsePossessionFromText(text, homeName, awayName) {
    if (!String(text || '').toLowerCase().startsWith('game ends')) return null;

    const even = text.match(/even\s+possession-wise\s*\((\d+)%\)/i);
    if (even) {
      const pct = Number(even[1]);
      return [pct, pct];
    }

    const homeRx = new RegExp(`${escapeRegex(homeName)}.*?held\\s+the\\s+ball\\s+(\\d+)%`, 'i');
    const awayRx = new RegExp(`${escapeRegex(awayName)}.*?held\\s+the\\s+ball\\s+(\\d+)%`, 'i');
    const hm = text.match(homeRx);
    const am = text.match(awayRx);
    if (hm && am) return [Number(hm[1]), Number(am[1])];

    const pcts = [...text.matchAll(/(\d+)%/g)].map(m => Number(m[1]));
    if (pcts.length === 2 && pcts[0] + pcts[1] === 100) {
      const lower = text.toLowerCase();
      const hp = lower.indexOf(homeName.toLowerCase());
      const ap = lower.indexOf(awayName.toLowerCase());
      if (hp >= 0 && ap >= 0) return hp < ap ? [pcts[0], pcts[1]] : [pcts[1], pcts[0]];
    }
    return null;
  }

  function extractGoalScorersFromKeyEvents() {
    const scorers = [];

    // Redesigned viewer: authoritative home/away key event panels.
    for (const [side, selector] of [['home', '#doMvHomeEv'], ['away', '#doMvAwayEv']]) {
      const panel = document.querySelector(selector);
      if (!panel) continue;
      for (const row of panel.querySelectorAll('.do-mv-ev')) {
        if (!row.querySelector('.do-mv-ev-goal')) continue;
        const minuteEl = row.querySelector('.do-mv-ev-min');
        const playerEl = row.querySelector('.do-mv-ev-tx');
        if (!minuteEl || !playerEl) continue;
        const mm = normText(minuteEl.textContent).match(/(\d+)/);
        if (!mm) continue;
        let player = normText(playerEl.textContent);
        const isPenalty = /\(p\.?\)|\bpen\.?\b/i.test(player);
        const isOwnGoal = /\(og\.?\)|\bown\s+goal\b/i.test(player);
        player = player
          .replace(/\s*\(p\.?\)\s*$/i, '')
          .replace(/\s*\(og\.?\)\s*$/i, '')
          .trim();
        const playerLink = playerEl.matches?.('a[href*="playerID/"]')
          ? playerEl
          : playerEl.querySelector?.('a[href*="playerID/"]');
        scorers.push({ minute: Number(mm[1]), side, player, isPenalty, isOwnGoal, player_url: playerUrlFromLink(playerLink) });
      }
    }

    // Legacy viewer key_events_inside fallback.
    const legacyPanels = [...document.querySelectorAll('div.key_events_inside')];
    legacyPanels.forEach((panel, idx) => {
      const side = idx === 0 ? 'home' : 'away';
      for (const table of panel.querySelectorAll('table')) {
        const img = table.querySelector('img');
        if (!img || !/icon-goal/i.test(img.getAttribute('src') || '')) continue;
        const tds = table.querySelectorAll('td');
        if (tds.length < 2) continue;
        const txt = normText(tds[1].textContent);
        const m = txt.match(/(.+?)\s*\((\d+)'\)/);
        if (!m) continue;
        const pl = tds[1].querySelector('a[href*="playerID/"]');
        const player = pl ? normText(pl.textContent) : m[1].trim();
        const rawGoalText = normText(tds[1].textContent);
        const isPenalty = [...tds[1].querySelectorAll('b')].some(b => normText(b.textContent).toLowerCase() === 'p');
        const isOwnGoal = /\(og\.?\)|\bown\s+goal\b/i.test(rawGoalText);
        scorers.push({ minute: Number(m[2]), side, player, isPenalty, isOwnGoal, player_url: playerUrlFromLink(pl) });
      }
    });

    return scorers;
  }

  function parseOfficialStats() {
    const out = { home: {}, away: {} };
    const map = {
      possession: 'possession',
      goals: 'goals',
      'shots on target': 'shots_on',
      'shots off target': 'shots_off',
      corners: 'corners',
      offsides: 'offsides',
      'yellow cards': 'yellow_cards',
      'red cards': 'red_cards',
    };
    for (const row of document.querySelectorAll('#doMvStats .do-mv-stat')) {
      const label = normText(row.querySelector('.do-mv-stat-lbl')?.textContent).toLowerCase();
      const key = map[label];
      if (!key) continue;
      const hv = normText(row.querySelector('.do-mv-stat-hv')?.textContent);
      const av = normText(row.querySelector('.do-mv-stat-av')?.textContent);
      const toNum = s => {
        const m = s.match(/-?\d+/);
        return m ? Number(m[0]) : null;
      };
      out.home[key] = toNum(hv);
      out.away[key] = toNum(av);
    }
    return out;
  }

  function parseMatch() {
    const teams = parseTeamInfo();
    const [homeGoals, awayGoals] = parseScore();
    const colors = parseTeamColors();
    const ui = parseUiPalette();
    const officialStats = parseOfficialStats();

    const root = document.querySelector('#doMvCommentary') || document.querySelector('#events_content');
    const goalkeepers = parseGoalkeepers(teams, root);
    const events = [];
    const extras = {
      home: { fouls: 0, corners: 0, free_kicks: 0 },
      away: { fouls: 0, corners: 0, free_kicks: 0 },
    };
    let possession = [officialStats.home.possession ?? null, officialStats.away.possession ?? null];

    if (root) {
      for (const table of root.querySelectorAll('table')) {
        const tds = table.querySelectorAll('td');
        if (tds.length < 3) continue;

        const tm = normText(tds[1].textContent).match(/\[(\d+):(\d+)\]/);
        if (!tm) continue;
        const minute = Number(tm[1]);
        const seconds = Number(tm[2]);

        // Exactly as in Python: shoot-out commentary is excluded from normal events.
        if (minute >= 125) continue;

        const desc = tds[2];
        const text = normText(desc.textContent);
        const team = resolveTeam(desc, teams);
        const icon = normalizeIconName(tds[0]);

        const pos = parsePossessionFromText(text, teams.homeName, teams.awayName);
        if (pos) possession = pos;

        if (team === 'home' || team === 'away') {
          if (isFoulComment(text)) extras[team].fouls++;
          if (isCornerComment(text)) extras[team].corners++;
          if (isFreeKickComment(text)) extras[team].free_kicks++;
        }

        const type = classifyEvent(
          icon,
          text,
          team,
          goalkeepers.homeGkNames,
          goalkeepers.awayGkNames,
        );
        if (!type) continue;

        const links = findPlayerLinks(desc);

        // Injury + automatic replacement: same logic and ordering as Python.
        if (type === 'injury') {
          const injured = links.length ? normText(links[0].textContent) : '';
          events.push({
            minute, seconds, team, event_type: 'injury', player: injured, detail: '',
            player_url: playerUrlFromLink(links[0]), detail_player_url: '',
          });

          if (hasInjuryReplacement(text.toLowerCase()) && links.length >= 2) {
            const playerOut = normText(links[0].textContent);
            const playerIn = normText(links[1].textContent);
            events.push({
              minute,
              seconds,
              team,
              event_type: 'substitution',
              player: playerOut,
              detail: `-> ${playerIn}`,
              player_url: playerUrlFromLink(links[0]),
              detail_player_url: playerUrlFromLink(links[1]),
            });
          }
          continue;
        }

        let playerName = '';
        if (['shot_on', 'shot_off', 'shot_blocked', 'goal'].includes(type)) {
          playerName = getShooterName(desc, type);
        } else if (type === 'yellow') {
          playerName = getCardPlayerName(desc);
        } else if (links.length) {
          playerName = normText(links[0].textContent);
        }

        // Python uses the second linked player for offside events.
        if (type === 'offside' && links.length >= 2) {
          playerName = normText(links[1].textContent);
        }

        let playerUrl = playerUrlByName(links, playerName);
        let detailPlayerUrl = '';
        let detail = '';
        if (type === 'substitution' && links.length >= 2) {
          const p1 = normText(links[0].textContent);
          const p2 = normText(links[1].textContent);
          const lower = text.toLowerCase();

          if (/\bon for\b|brought on|will be brought on/i.test(lower)) {
            // p1 enters, p2 leaves
            playerName = p2;
            detail = `-> ${p1}`;
            playerUrl = playerUrlFromLink(links[1]);
            detailPlayerUrl = playerUrlFromLink(links[0]);
          } else {
            // p1 leaves, p2 enters
            playerName = p1;
            detail = `-> ${p2}`;
            playerUrl = playerUrlFromLink(links[0]);
            detailPlayerUrl = playerUrlFromLink(links[1]);
          }
        }

        events.push({
          minute,
          seconds,
          team,
          event_type: type,
          player: playerName,
          detail,
          player_url: playerUrl,
          detail_player_url: detailPlayerUrl,
          // Keep all linked players from a goal commentary row. The key-events
          // panel remains authoritative for the scorer's surname; this list is
          // used only to expand that surname to the full name shown in commentary.
          goal_comment_players: type === 'goal'
            ? links.map(link => ({ name: normText(link.textContent), url: playerUrlFromLink(link) }))
            : [],
        });
      }
    }

    // The Python version treats the key-event scorer panels as authoritative.
    // This intentionally overrides any goal scorer guessed from commentary text.
    const goalScorers = extractGoalScorersFromKeyEvents();
    if (goalScorers.length) {
      const goals = events
        .map((ev, index) => ({ ev, index }))
        .filter(x => x.ev.event_type === 'goal')
        .sort((a, b) => minuteFloat(a.ev) - minuteFloat(b.ev));

      const scorersSorted = [...goalScorers].sort((a, b) => a.minute - b.minute);
      for (const side of ['home', 'away']) {
        const parsed = goals.filter(x => x.ev.team === side);
        const authoritative = scorersSorted.filter(x => x.side === side);
        for (let i = 0; i < Math.min(parsed.length, authoritative.length); i++) {
          const scorer = authoritative[i];
          const goalEvent = events[parsed[i].index];
          const commentScorer = fullGoalScorerFromComment(goalEvent, scorer.player);
          const fullName = commentScorer?.name || scorer.player;
          const suffix = scorer.isOwnGoal ? ' (og.)' : (scorer.isPenalty ? ' (p.)' : '');
          events[parsed[i].index] = {
            ...goalEvent,
            // Identity still comes from Key Events. Commentary is used only to
            // expand the authoritative surname to the matching full name.
            player: `${fullName}${suffix}`,
            player_url: commentScorer?.url || scorer.player_url || goalEvent.player_url || '',
          };
        }
      }
    }

    // Structured stats override commentary-derived corners, as in Python.
    for (const side of ['home', 'away']) {
      if (officialStats[side]?.corners != null) extras[side].corners = officialStats[side].corners;
    }

    events.sort((a, b) => {
      const ta = minuteFloat(a), tb = minuteFloat(b);
      if (ta !== tb) return ta - tb;
      const prio = { injury: 0, substitution: 1 };
      return (prio[a.event_type] ?? 2) - (prio[b.event_type] ?? 2);
    });

    return {
      ...teams,
      homeGoals,
      awayGoals,
      colors,
      ui,
      events,
      extras,
      possessionHome: possession[0],
      possessionAway: possession[1],
      officialStats,
      hasExtraTime: events.some(ev => ev.minute >= 91),
      homeGk: goalkeepers.homeGk,
      awayGk: goalkeepers.awayGk,
    };
  }

  // ---------------------------------------------------------------------------
  // Momentum calculations
  // ---------------------------------------------------------------------------
  function momentumBinIndex(ev, binWidth, maxMinute) {
    // Half-boundary rule used by the Python version:
    // 45:00-45:59 -> final bar BEFORE 45:00,
    // 90:00-90:59 -> final bar BEFORE 90:00.
    // Do not use Number.EPSILON here: at values such as 45/90 it is too small
    // to change the floating-point number, so floor() still produced a new bin.
    if (ev.minute === 45) return Math.max(0, Math.ceil(45 / binWidth) - 1);
    if (ev.minute === 90) return Math.max(0, Math.ceil(90 / binWidth) - 1);

    const minuteForBin = minuteFloat(ev);
    const lastIndex = Math.max(0, Math.ceil(maxMinute / binWidth) - 1);
    return Math.min(Math.floor(minuteForBin / binWidth), lastIndex);
  }

  function computeMomentum(events, maxMinute) {
    const binWidth = 3;
    // Exactly one bar per interval inside the match range. For a 90-minute
    // match this gives 30 bins (0-3 ... 87-90), so there can never be a bar
    // whose centre is drawn to the right of the 90-minute line.
    const n = Math.max(1, Math.ceil(maxMinute / binWidth));
    const home = Array(n).fill(0);
    const away = Array(n).fill(0);

    for (const ev of events) {
      const w = BAR_WEIGHTS[ev.event_type] || 0;
      if (!w) continue;
      const i = momentumBinIndex(ev, binWidth, maxMinute);
      if (ev.team === 'home') home[i] += w;
      else if (ev.team === 'away') away[i] += w;
    }
    return { binWidth, home, away };
  }

  // ---------------------------------------------------------------------------
  // Rendering - SVG chart
  // ---------------------------------------------------------------------------
  function svgEl(name, attrs = {}, text = '') {
    const el = document.createElementNS('http://www.w3.org/2000/svg', name);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
    if (text) el.textContent = text;
    return el;
  }


  function appendSvgIcon(parent, type, x, y, size = 18, color = THEME.text) {
    const ns = 'http://www.w3.org/2000/svg';
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('transform', `translate(${x - size / 2} ${y - size / 2}) scale(${size / 24})`);
    g.setAttribute('color', color);

    const temp = document.createElementNS(ns, 'svg');
    temp.setAttribute('viewBox', '0 0 24 24');
    temp.innerHTML = ICON_PATHS[type] || '<circle cx="12" cy="12" r="2" fill="currentColor"/>';
    while (temp.firstChild) g.appendChild(temp.firstChild);
    parent.appendChild(g);
    return g;
  }

  function drawMomentumSvg(md, host) {
    host.textContent = '';
    const width = 1120;
    const baseHeight = 640;
    const left = 44;
    const right = 28;
    const maxMinute = md.hasExtraTime ? 120 : 90;
    const plotW = width - left - right;
    const x = min => left + (min / maxMinute) * plotW;

    // -----------------------------------------------------------------------
    // Goal-label lanes
    // -----------------------------------------------------------------------
    const labelH = 28;
    const laneStep = 34;
    const goalsSorted = md.events
      .filter(e => e.event_type === 'goal')
      .slice()
      .sort((a, b) => minuteFloat(a) - minuteFloat(b));

    let hsBuild = 0, asBuild = 0;
    const goalLayouts = [];
    for (const ev of goalsSorted) {
      if (ev.team === 'home') hsBuild++; else asBuild++;
      const rawX = x(Math.min(minuteFloat(ev), maxMinute));
      const label = `${hsBuild}:${asBuild}  ${ev.player || ''} ${displayMinuteCeil(ev)}`;
      const w = clamp(label.length * 7.1 + 22, 118, 280);
      const gx = clamp(rawX, left + w / 2 + 4, width - right - w / 2 - 4);
      goalLayouts.push({ ev, rawX, label, w, gx, side: ev.team, lane: 0 });
    }

    function assignLanes(side) {
      const items = goalLayouts.filter(item => item.side === side);
      const lanes = [];
      for (const item of items) {
        const x1 = item.gx - item.w / 2;
        const x2 = item.gx + item.w / 2;
        let chosen = -1;
        for (let lane = 0; lane < lanes.length; lane++) {
          const collides = lanes[lane].some(box => !(x2 + 8 < box.x1 || x1 - 8 > box.x2));
          if (!collides) {
            chosen = lane;
            break;
          }
        }
        if (chosen < 0) {
          chosen = lanes.length;
          lanes.push([]);
        }
        item.lane = chosen;
        lanes[chosen].push({ x1, x2 });
      }
      return lanes.length;
    }

    const homeLaneCount = assignLanes('home');
    const awayLaneCount = assignLanes('away');

    // -----------------------------------------------------------------------
    // Momentum + event stacks
    // -----------------------------------------------------------------------
    const mom = computeMomentum(md.events, maxMinute);
    const grouped = new Map();
    for (const ev of md.events) {
      const idx = momentumBinIndex(ev, mom.binWidth, maxMinute);
      const key = `${ev.team}:${idx}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(ev);
    }

    const gapFromBar = 10;
    const stackGap = 5;
    const plotEdgePad = 8;
    const minBarBudget = 74;

    const iconSize = ev => ev.event_type === 'goal' ? 22 : 18;
    const stackDepth = list => {
      if (!list || !list.length) return 0;
      const sumSizes = list.reduce((sum, ev) => sum + iconSize(ev), 0);
      return gapFromBar + sumSizes + stackGap * Math.max(0, list.length - 1);
    };

    let maxHomeStackDepth = 0;
    let maxAwayStackDepth = 0;
    for (const [key, list] of grouped.entries()) {
      const team = key.split(':')[0];
      const depth = stackDepth(list);
      if (team === 'home') maxHomeStackDepth = Math.max(maxHomeStackDepth, depth);
      else maxAwayStackDepth = Math.max(maxAwayStackDepth, depth);
    }

    // -----------------------------------------------------------------------
    // Dynamic vertical geometry
    // -----------------------------------------------------------------------
    // The scorer-label bands and HALF-TIME/EXTRA-TIME band are separate from
    // the plot. The plot halves themselves are sized from the largest icon
    // stack on each side. This means there is no assumed maximum number of
    // icons: if a stack grows, the plot grows with it.
    const markerBand = 32;
    const topBand = 26 + markerBand + homeLaneCount * laneStep;
    const bottomBand = 44 + awayLaneCount * laneStep;
    const minHalfPlot = 150;

    const requiredHomeHalf = Math.max(
      minHalfPlot,
      maxHomeStackDepth + minBarBudget + plotEdgePad
    );
    const requiredAwayHalf = Math.max(
      minHalfPlot,
      maxAwayStackDepth + minBarBudget + plotEdgePad
    );

    const basePlotH = Math.max(0, baseHeight - topBand - bottomBand);
    const requiredPlotH = requiredHomeHalf + requiredAwayHalf;

    let homeHalf = requiredHomeHalf;
    let awayHalf = requiredAwayHalf;
    if (requiredPlotH < basePlotH) {
      const extra = basePlotH - requiredPlotH;
      homeHalf += extra / 2;
      awayHalf += extra / 2;
    }

    const height = Math.max(baseHeight, topBand + homeHalf + awayHalf + bottomBand);
    const top = topBand;
    const midY = top + homeHalf;
    const plotBottom = midY + awayHalf;
    const plotH = homeHalf + awayHalf;

    // -----------------------------------------------------------------------
    // Dynamic bar scale
    // -----------------------------------------------------------------------
    // Scale bars only after reserving the exact space needed by each icon
    // stack. Every constraint is of the form:
    //   bar height + icon-stack depth <= available half of the plot.
    // Therefore icons can never overlap a bar or escape into the label bands.
    let pxPerMomentum = Infinity;
    const homePeak = Math.max(0, ...mom.home);
    const awayPeak = Math.max(0, ...mom.away);

    if (homePeak > 0) pxPerMomentum = Math.min(pxPerMomentum, (homeHalf - plotEdgePad) / homePeak);
    if (awayPeak > 0) pxPerMomentum = Math.min(pxPerMomentum, (awayHalf - plotEdgePad) / awayPeak);

    for (const [key, list] of grouped.entries()) {
      const [team, idxText] = key.split(':');
      const i = Number(idxText);
      const value = team === 'home' ? (mom.home[i] || 0) : (mom.away[i] || 0);
      if (value <= 0) continue;
      const depth = stackDepth(list);
      const half = team === 'home' ? homeHalf : awayHalf;
      const availableForBar = Math.max(1, half - depth - plotEdgePad);
      pxPerMomentum = Math.min(pxPerMomentum, availableForBar / value);
    }

    if (!Number.isFinite(pxPerMomentum) || pxPerMomentum <= 0) pxPerMomentum = 1;
    const yScale = val => Math.max(0, val) * pxPerMomentum;

    const svg = svgEl('svg', { viewBox: `0 0 ${width} ${height}`, class: 'do-mm-svg', role: 'img' });
    svg.appendChild(svgEl('rect', { x: 1, y: 1, width: width - 2, height: height - 2, rx: 12, fill: THEME.field, stroke: THEME.border }));

    for (let m = 0; m <= maxMinute; m += 3) {
      const major = m % 15 === 0;
      svg.appendChild(svgEl('line', {
        x1: x(m), x2: x(m), y1: top, y2: plotBottom,
        stroke: THEME.grid, 'stroke-width': major ? 1.1 : 0.6,
        opacity: major ? 0.9 : 0.6,
      }));
      if (major) {
        svg.appendChild(svgEl('text', {
          x: x(m), y: plotBottom - 8, 'text-anchor': 'middle',
          fill: THEME.text, 'font-size': 12,
        }, String(m)));
      }
    }

    svg.appendChild(svgEl('line', { x1: left, x2: width - right, y1: midY, y2: midY, stroke: '#6f7b6d', 'stroke-width': 1.3 }));

    const halfLine = minute => {
      svg.appendChild(svgEl('line', {
        x1: x(minute), x2: x(minute), y1: top, y2: plotBottom,
        stroke: '#aeb3a2', 'stroke-width': 1.6, 'stroke-dasharray': '6 5',
      }));
      svg.appendChild(svgEl('text', {
        x: x(minute), y: top - 8, 'text-anchor': 'middle', fill: THEME.header,
        'font-size': 12, 'font-weight': 700, 'font-style': 'italic',
      }, minute === 45 ? tr('halftime') : tr('extraTime')));
    };
    halfLine(45);
    if (md.hasExtraTime) halfLine(90);

    const binPx = (mom.binWidth / maxMinute) * plotW;
    const barW = Math.max(3, binPx * 0.82);
    mom.home.forEach((v, i) => {
      if (!v) return;
      const cx = x(i * mom.binWidth + mom.binWidth / 2);
      const h = yScale(v);
      svg.appendChild(svgEl('rect', { x: cx - barW / 2, y: midY - h, width: barW, height: h, rx: 2.5, fill: md.colors.home, opacity: 0.88 }));
    });
    mom.away.forEach((v, i) => {
      if (!v) return;
      const cx = x(i * mom.binWidth + mom.binWidth / 2);
      const h = yScale(v);
      svg.appendChild(svgEl('rect', { x: cx - barW / 2, y: midY, width: barW, height: h, rx: 2.5, fill: md.colors.away, opacity: 0.88 }));
    });

    // Event icons are positioned strictly outside the bar. Because yScale was
    // solved from the stack constraints above, no corrective shifting is
    // needed and no stack can enter the HALF-TIME/EXTRA-TIME or scorer bands.
    for (const [key, list] of grouped.entries()) {
      const [team, idxText] = key.split(':');
      const i = Number(idxText);
      const cx = x(i * mom.binWidth + mom.binWidth / 2);
      const baseVal = team === 'home' ? (mom.home[i] || 0) : (mom.away[i] || 0);
      const barExtent = yScale(baseVal);
      const barEdge = team === 'home' ? (midY - barExtent) : (midY + barExtent);
      const sizes = list.map(iconSize);
      const ys = [];

      if (team === 'home') {
        let cy = barEdge - gapFromBar - sizes[0] / 2;
        ys.push(cy);
        for (let j = 1; j < list.length; j++) {
          cy -= sizes[j - 1] / 2 + sizes[j] / 2 + stackGap;
          ys.push(cy);
        }
      } else {
        let cy = barEdge + gapFromBar + sizes[0] / 2;
        ys.push(cy);
        for (let j = 1; j < list.length; j++) {
          cy += sizes[j - 1] / 2 + sizes[j] / 2 + stackGap;
          ys.push(cy);
        }
      }

      list.forEach((ev, j) => {
        let iconColor = THEME.text;
        if (ev.event_type === 'injury') iconColor = THEME.red;
        appendSvgIcon(svg, ev.event_type, cx, ys[j], sizes[j], iconColor);
      });
    }

    // Goal guide lines stay behind labels and icons.
    for (const item of goalLayouts) {
      svg.appendChild(svgEl('line', {
        x1: item.rawX, x2: item.rawX, y1: top, y2: plotBottom,
        stroke: THEME.goal, 'stroke-width': 1.5, opacity: 0.45,
      }));
    }

    // Goal labels. Lanes share a row whenever their horizontal boxes do not overlap.
    for (const item of goalLayouts) {
      const { label, w, gx, side, lane } = item;
      const teamColor = side === 'home' ? md.colors.home : md.colors.away;
      const teamTextColor = side === 'home' ? md.colors.homeText : md.colors.awayText;
      const yy = side === 'home'
        ? top - markerBand - labelH / 2 - lane * laneStep
        : plotBottom + labelH / 2 + 12 + lane * laneStep;

      const g = svgEl('g');
      g.appendChild(svgEl('rect', {
        x: gx - w / 2, y: yy - labelH / 2, width: w, height: labelH, rx: 8,
        fill: '#fbfbfa', stroke: teamColor, 'stroke-width': 1.8,
      }));
      g.appendChild(svgEl('text', {
        x: gx, y: yy + 4, 'text-anchor': 'middle', fill: teamTextColor,
        'font-size': 12, 'font-weight': 700,
      }, label));
      svg.appendChild(g);
    }

    svg.appendChild(svgEl('text', {
      x: width / 2, y: height - 10, 'text-anchor': 'middle', fill: THEME.header,
      'font-size': 14, 'font-weight': 700,
    }, tr('minute')));

    host.appendChild(svg);
  }

  // ---------------------------------------------------------------------------
  // Rendering - statistics
  // ---------------------------------------------------------------------------
  function eventCount(md, side, type) {
    return md.events.filter(e => e.team === side && e.event_type === type).length;
  }

  function shotStats(md, side) {
    const goals = eventCount(md, side, 'goal');
    const on = eventCount(md, side, 'shot_on');
    const off = eventCount(md, side, 'shot_off');
    const blocked = eventCount(md, side, 'shot_blocked');
    return { total: goals + on + off + blocked, on: goals + on, off: off + blocked };
  }

  function drawStats(md, host) {
    const hs = shotStats(md, 'home');
    const as = shotStats(md, 'away');
    const oh = md.officialStats.home;
    const oa = md.officialStats.away;
    if (oh.shots_on != null) hs.on = oh.shots_on;
    if (oa.shots_on != null) as.on = oa.shots_on;
    if (oh.shots_off != null) hs.off = oh.shots_off;
    if (oa.shots_off != null) as.off = oa.shots_off;
    if (oh.shots_on != null && oh.shots_off != null) hs.total = oh.shots_on + oh.shots_off;
    if (oa.shots_on != null && oa.shots_off != null) as.total = oa.shots_on + oa.shots_off;

    const hYellow = oh.yellow_cards ?? eventCount(md, 'home', 'yellow');
    const hRed = oh.red_cards ?? eventCount(md, 'home', 'red');
    const aYellow = oa.yellow_cards ?? eventCount(md, 'away', 'yellow');
    const aRed = oa.red_cards ?? eventCount(md, 'away', 'red');
    const hOffside = oh.offsides ?? eventCount(md, 'home', 'offside');
    const aOffside = oa.offsides ?? eventCount(md, 'away', 'offside');
    const hCorners = oh.corners ?? md.extras.home.corners;
    const aCorners = oa.corners ?? md.extras.away.corners;

    const rows = [
      [tr('possession'), md.possessionHome != null ? `${md.possessionHome}%` : '-', md.possessionAway != null ? `${md.possessionAway}%` : '-', md.possessionHome || 0, md.possessionAway || 0],
      [tr('shotsTotal'), hs.total, as.total, hs.total, as.total],
      [tr('shotsOn'), hs.on, as.on, hs.on, as.on],
      [tr('shotsOff'), hs.off, as.off, hs.off, as.off],
      [tr('cards'), `<span class="do-mm-card yellow"></span>${hYellow} <span class="do-mm-card red"></span>${hRed}`, `<span class="do-mm-card yellow"></span>${aYellow} <span class="do-mm-card red"></span>${aRed}`, null, null],
      [tr('fouls'), md.extras.home.fouls, md.extras.away.fouls, md.extras.home.fouls, md.extras.away.fouls],
      [tr('offsides'), hOffside, aOffside, hOffside, aOffside],
      [tr('corners'), hCorners, aCorners, hCorners, aCorners],
      [tr('freeKicks'), md.extras.home.free_kicks, md.extras.away.free_kicks, md.extras.home.free_kicks, md.extras.away.free_kicks],
    ];

    const rowHtml = rows.map((r, idx) => {
      const [label, hv, av, hn, an] = r;
      const total = Number(hn || 0) + Number(an || 0);
      const hp = total > 0 ? (Number(hn || 0) / total) * 100 : 0;
      const ap = total > 0 ? (Number(an || 0) / total) * 100 : 0;
      const separator = idx === 1 || idx === 4 ? ' group-start' : '';
      const splitColor = statBarSeparatorColor(md.colors.home, md.colors.away);
      const showSplit = hn != null && Number(hn || 0) > 0 && Number(an || 0) > 0;
      return `
        <div class="do-mm-stat-row${separator}">
          <div class="do-mm-stat-values">
            <div class="do-mm-stat-value home">${hv}</div>
            <div class="do-mm-stat-label">${label}</div>
            <div class="do-mm-stat-value away">${av}</div>
          </div>
          ${hn == null ? '<div class="do-mm-stat-track"></div>' : `
            <div class="do-mm-stat-track">
              <div class="do-mm-stat-fill home" style="width:${hp}%;background:${md.colors.home}"></div>
              <div class="do-mm-stat-fill away" style="width:${ap}%;background:${md.colors.away}"></div>
              ${showSplit ? `<div class="do-mm-stat-split" style="left:${hp}%;background:${splitColor}"></div>` : ''}
            </div>`}
        </div>`;
    }).join('');

    host.innerHTML = `
      <div class="do-mm-stats-box">
        <div class="do-mm-stats-head">${tr('stats')}</div>
        <div class="do-mm-team-heads">
          <span style="color:${md.colors.homeText}">${esc(md.homeName)}</span>
          <span style="color:${md.colors.awayText}">${esc(md.awayName)}</span>
        </div>
        ${rowHtml}
      </div>`;
  }

  // ---------------------------------------------------------------------------
  // Rendering - compact timeline
  // ---------------------------------------------------------------------------
  function timelinePlayerLink(name, url, color, extraClass = '') {
    const label = esc(name || '');
    if (!label) return '';
    if (!url) return `<span class="do-mm-player ${extraClass}" style="color:${color}">${label}</span>`;
    return `<a class="do-mm-player do-mm-player-link ${extraClass}" href="${esc(url)}" target="_blank" rel="noopener noreferrer" style="color:${color}">${label}</a>`;
  }

  function timelineRow(ev, md) {
    const isHome = ev.team === 'home';
    const teamColor = isHome ? md.colors.home : md.colors.away;
    const teamTextColor = isHome ? md.colors.homeText : md.colors.awayText;
    const isGoal = ev.event_type === 'goal';
    const iconClass = ev.event_type === 'injury' ? 'injury' : '';
    let playerHtml = timelinePlayerLink(ev.player, ev.player_url, teamTextColor);
    if (ev.event_type === 'substitution' && ev.detail) {
      const incoming = ev.detail.replace(/^\s*->\s*/, '').trim();
      const incomingHtml = timelinePlayerLink(incoming, ev.detail_player_url, teamTextColor);
      playerHtml = `${playerHtml}<span class="do-mm-sub-arrow"> → </span>${incomingHtml}`;
    }
    const content = `
      <span class="do-mm-time">${displayTime(ev)}</span>
      <span class="do-mm-event-icon ${iconClass}">${iconHtml(ev.event_type, isGoal ? 20 : 17)}</span>
      <span class="do-mm-player-wrap">${playerHtml}</span>`;

    const rowStyle = [
      `--team:${teamColor}`,
      `--team-goal-border:${colorWithAlpha(teamColor, 0.7)}`,
      `--team-goal-fill:${colorWithAlpha(teamColor, 0.25)}`
    ].join(';');

    return `
      <div class="do-mm-event ${isHome ? 'home' : 'away'} ${isGoal ? 'goal' : ''}" style="${rowStyle}">
        ${content}
      </div>`;
  }

  function drawTimeline(md, host) {
    const byTimeAsc = (a, b) => minuteFloat(a) - minuteFloat(b);
    const byTimeDesc = (a, b) => minuteFloat(b) - minuteFloat(a);
    const sorter = timelineNewestFirst ? byTimeDesc : byTimeAsc;

    const first = md.events.filter(e => e.minute < 46).sort(sorter);
    const second = md.events.filter(e => e.minute >= 46 && e.minute < 91).sort(sorter);
    const extra = md.events.filter(e => e.minute >= 91 && e.minute < 125).sort(sorter);

    const section = (title, list) => list.length ? `
      <div class="do-mm-half-title">-- ${title} --</div>
      ${list.map(ev => timelineRow(ev, md)).join('')}` : '';

    const sections = timelineNewestFirst
      ? [section(tr('extraTime'), extra), section(tr('secondHalf'), second), section(tr('firstHalf'), first)]
      : [section(tr('firstHalf'), first), section(tr('secondHalf'), second), section(tr('extraTime'), extra)];

    const sortTitle = timelineNewestFirst
      ? (currentLang === 'pl' ? 'Najstarsze zdarzenia na górze' : 'Oldest events first')
      : (currentLang === 'pl' ? 'Najnowsze zdarzenia na górze' : 'Newest events first');

    host.innerHTML = `
      <div class="do-mm-timeline-box">
        <div class="do-mm-timeline-title">
          <span>${tr('timeline')}</span>
          <button type="button" class="do-mm-timeline-sort ${timelineNewestFirst ? 'active' : ''}" title="${esc(sortTitle)}" aria-label="${esc(sortTitle)}">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 6h11M8 12h8M8 18h5" />
              <path d="M4 5v14M2 17l2 2 2-2" />
            </svg>
          </button>
        </div>
        ${sections.join('')}
      </div>`;

    const sortButton = host.querySelector('.do-mm-timeline-sort');
    if (sortButton) {
      sortButton.addEventListener('click', () => {
        timelineNewestFirst = !timelineNewestFirst;
        drawTimeline(md, host);
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Main app
  // ---------------------------------------------------------------------------
  function detectMatchInterface() {
    // Detect the match UI from native Dugout markup, not from where our own
    // container happened to be mounted. This keeps the new-interface layout
    // completely independent from the legacy fallback wrapper.
    const isNew = Boolean(
      document.querySelector('.do-mv-scorebar') ||
      document.querySelector('#doMvCommentary') ||
      document.querySelector('.do-mv-team') ||
      document.querySelector('#doMvStats')
    );
    return isNew ? 'new' : 'legacy';
  }

  function scriptVersion() {
    try {
      return (typeof GM_info !== 'undefined' && GM_info && GM_info.script && GM_info.script.version)
        ? String(GM_info.script.version)
        : '1.6.24';
    } catch (_) {
      return '1.6.24';
    }
  }

  function renderApp() {
    const app = document.getElementById(APP_ID);
    if (!app) return;
    const md = parseMatch();

    app.style.setProperty('--do-mm-page-bg', md.ui.bodyBg);
    app.style.setProperty('--do-mm-header-bg', md.ui.headerBg);
    app.style.setProperty('--do-mm-header-text', md.ui.headerText);
    app.style.setProperty('--do-mm-header-border', md.ui.headerBorder);

    const tabButton = document.getElementById(TAB_ID);
    if (tabButton) {
      tabButton.style.setProperty('background', md.ui.headerBg, 'important');
      tabButton.style.setProperty('color', md.ui.headerText, 'important');
      tabButton.style.setProperty('border-color', md.ui.headerBorder, 'important');
    }

    const hasNativeStatsTab = Boolean(document.querySelector('.do-mv-tab[data-mv-pane="doMvStats"], [data-mv-pane="doMvStats"]'));
    const momentumHeader = hasNativeStatsTab ? '' : `
      <div class="do-mm-topline">
        <div class="do-mm-topteam home">
          <div class="do-mm-badge">${md.homeBadgeHtml || ''}</div>
          <span>${esc(md.homeName)}</span>
        </div>
        <div class="do-mm-scoreblock">
          <small>${tr('matchMomentum')}</small>
          <strong>${md.homeGoals} : ${md.awayGoals}</strong>
        </div>
        <div class="do-mm-topteam away">
          <span>${esc(md.awayName)}</span>
          <div class="do-mm-badge">${md.awayBadgeHtml || ''}</div>
        </div>
      </div>`;

    const creatorInfo = `
      <div class="do-mm-creator-info">
        <span class="do-mm-version">v${esc(scriptVersion())}</span>
        <span class="do-mm-creator-sep">·</span>
        <span>created by Zamor, manager of <a href="https://dugout-online.com/clubinfo/none/clubid/10131/" target="_blank" rel="noopener noreferrer">Jelonki FC</a></span>
      </div>`;

    const chartBlock = `
      <div id="do-mm-chart"></div>
      <div class="do-mm-chart-tools">
        <span class="do-mm-lang-switch do-mm-lang-switch-inline" aria-label="Language">
          <button type="button" data-lang="en" class="${currentLang === 'en' ? 'active' : ''}" title="English">${flagHtml('en')} <span>EN</span></button>
          <button type="button" data-lang="pl" class="${currentLang === 'pl' ? 'active' : ''}" title="Polski">${flagHtml('pl')} <span>PL</span></button>
        </span>
        <div class="do-mm-legend">
          ${['shot_on','shot_off','shot_blocked','yellow','offside','substitution','injury'].map(k => `<span>${iconHtml(k, 18, k === 'injury' ? 'injury' : '')}<span>${eventLabel(k)}</span></span>`).join('')}
        </div>
      </div>`;

    const isLegacyInterface = detectMatchInterface() === 'legacy';
    if (isLegacyInterface) {
      // Legacy match view is much narrower. Keep every major panel in one
      // vertical column so nothing is squeezed side-by-side:
      // chart -> timeline -> statistics.
      app.innerHTML = `
        ${creatorInfo}
        ${momentumHeader}
        <div class="do-mm-layout do-mm-layout-legacy">
          <div class="do-mm-legacy-chart">${chartBlock}</div>
          <div id="do-mm-timeline"></div>
          <div id="do-mm-stats"></div>
        </div>`;
    } else {
      // New interface: preserve the existing two-column layout unchanged.
      app.innerHTML = `
        ${creatorInfo}
        ${momentumHeader}
        <div class="do-mm-layout">
          <div class="do-mm-left">
            ${chartBlock}
            <div id="do-mm-stats"></div>
          </div>
          <div id="do-mm-timeline"></div>
        </div>`;
    }

    bindLanguageSwitcher(app);
    updateLanguageSwitcher();

    drawMomentumSvg(md, app.querySelector('#do-mm-chart'));
    drawStats(md, app.querySelector('#do-mm-stats'));
    drawTimeline(md, app.querySelector('#do-mm-timeline'));
    requestAnimationFrame(() => syncTimelineHeight(app));
  }

  function syncTimelineHeight(app) {
    if (!app) return;
    const box = app.querySelector('.do-mm-timeline-box');
    if (!box) return;

    // Legacy interface uses a vertical chart -> timeline -> stats stack.
    // Let the timeline take its natural height; do not force it to match a
    // side-by-side column that does not exist there.
    if (detectMatchInterface() === 'legacy') {
      box.style.height = '';
      box.style.maxHeight = 'none';
      box.style.overflowY = 'visible';
      return;
    }

    const left = app.querySelector('.do-mm-left');
    if (!left) return;

    // On narrow layouts the timeline sits below the chart, so it should use
    // its natural height without an internal scrollbar.
    if (window.matchMedia('(max-width: 1050px)').matches) {
      box.style.height = '';
      box.style.maxHeight = 'none';
      box.style.overflowY = 'visible';
      return;
    }

    // Match the timeline panel to the full height of the left column
    // (chart + legend + statistics). Scrolling starts only if the timeline
    // content itself needs more space than that.
    const leftHeight = Math.ceil(left.getBoundingClientRect().height);
    if (leftHeight > 0) {
      box.style.height = `${leftHeight}px`;
      box.style.maxHeight = `${leftHeight}px`;
      box.style.overflowY = 'auto';
    }
  }

  function updateLanguageSwitcher() {
    document.querySelectorAll('.do-mm-lang-switch button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === currentLang);
    });
  }

  function bindLanguageSwitcher(root) {
    root.querySelectorAll('.do-mm-lang-switch button').forEach(btn => {
      btn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const lang = btn.dataset.lang;
        if (!I18N[lang] || lang === currentLang) return;
        currentLang = lang;
        updateLanguageSwitcher();
        const app = document.getElementById(APP_ID);
        if (app && (app.classList.contains('active') || !app.hidden)) renderApp();
      });
    });
  }

  function showMomentumTab() {
    const app = document.getElementById(APP_ID);
    if (!app) return;

    // New UI: behave like a native tab.
    const tabs = document.querySelector('.do-mv-tabs');
    if (tabs) {
      document.querySelectorAll('.do-mv-tabpane').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.do-mv-tab').forEach(b => b.classList.remove('active'));
      app.classList.add('active');
      document.getElementById(TAB_ID)?.classList.add('active');
    } else {
      app.hidden = !app.hidden;
    }
    renderApp();
  }

  function installUi() {
    if (document.getElementById(APP_ID)) return;
    injectCss();

    const tabs = document.querySelector('.do-mv-tabs');
    const livePane = document.querySelector('#doMvLive');

    if (tabs && livePane) {
      const button = document.createElement('button');
      button.type = 'button';
      button.id = TAB_ID;
      button.className = 'do-mv-tab';
      button.innerHTML = '<i class="fas fa-chart-line"></i> Match Momentum';
      const uiPalette = parseUiPalette();
      button.style.setProperty('background', uiPalette.headerBg, 'important');
      button.style.setProperty('color', uiPalette.headerText, 'important');
      button.style.setProperty('border-color', uiPalette.headerBorder, 'important');
      button.addEventListener('click', showMomentumTab);
      tabs.appendChild(button);


      // Make the original tabs explicitly hide our pane as well.
      tabs.querySelectorAll('.do-mv-tab:not(#do-mm-tab)').forEach(btn => {
        btn.addEventListener('click', () => {
          document.getElementById(APP_ID)?.classList.remove('active');
          document.getElementById(TAB_ID)?.classList.remove('active');
        });
      });

      const pane = document.createElement('div');
      pane.id = APP_ID;
      pane.className = 'do-mv-tabpane do-mm-pane';
      livePane.parentNode.insertBefore(pane, livePane.nextSibling);
    } else {
      // Legacy fallback: a clearly separated local tab/button above the commentary area.
      const target = document.querySelector('#events_content') || document.querySelector('#content_main') || document.body;
      const wrap = document.createElement('div');
      wrap.className = 'do-mm-legacy-wrap';
      wrap.innerHTML = `<div class="do-mm-legacy-controls"><button id="${TAB_ID}" class="do-mm-legacy-button">Match Momentum</button></div><div id="${APP_ID}" hidden></div>`;
      target.parentNode.insertBefore(wrap, target);
      wrap.querySelector('#' + TAB_ID).addEventListener('click', showMomentumTab);
    }
  }

  let refreshTimer = null;
  function setupLiveRefresh() {
    const commentary = document.querySelector('#doMvCommentary') || document.querySelector('#events_content');
    if (!commentary) return;
    const observer = new MutationObserver(() => {
      const app = document.getElementById(APP_ID);
      if (!app || (!app.classList.contains('active') && app.hidden)) return;
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(renderApp, 300);
    });
    observer.observe(commentary, { childList: true, subtree: true, characterData: true });
  }

  function injectCss() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${APP_ID}.do-mm-pane { padding:14px 0 30px; background:var(--do-mm-page-bg, ${THEME.bg}); }
      #${APP_ID}.do-mm-pane:not(.active) { display:none; }
      #${APP_ID}.do-mm-pane.active { display:block; }
      #${APP_ID}, #${APP_ID} * { box-sizing:border-box; }
      .do-mm-topline { display:grid; grid-template-columns:minmax(0,1fr) auto minmax(0,1fr); gap:20px; align-items:center; margin:0 14px 12px; padding:8px 18px; background:var(--do-mm-header-bg, #f5f5f0); color:var(--do-mm-header-text, ${THEME.text}); border:1px solid var(--do-mm-header-border, ${THEME.border}); border-radius:6px; box-shadow:0 1px 2px rgba(0,0,0,.08); font-size:20px; font-weight:800; }
      .do-mm-topteam { min-width:0; display:flex; align-items:center; gap:12px; color:var(--do-mm-header-text, ${THEME.text}); }
      .do-mm-creator-info { display:flex; align-items:center; justify-content:flex-start; gap:5px; padding:5px 14px 7px; color:${THEME.subtle}; font-size:10px; line-height:1.25; }
      .do-mm-creator-info .do-mm-version { font-weight:800; color:${THEME.text}; }
      .do-mm-creator-info .do-mm-creator-sep { opacity:.6; }
      .do-mm-creator-info a { color:inherit; font-weight:800; text-decoration:none; }
      .do-mm-creator-info a:hover { text-decoration:underline; }
      .do-mm-topteam.home { justify-content:flex-start; }
      .do-mm-topteam.away { justify-content:flex-end; }
      .do-mm-topteam > span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .do-mm-badge { flex:0 0 52px; width:52px; height:52px; display:flex; align-items:center; justify-content:center; position:relative; }
      .do-mm-badge .do-mv-badge-wrap { width:52px !important; height:52px !important; display:flex; align-items:center; justify-content:center; }
      .do-mm-badge .do-mv-badge, .do-mm-badge .do-mm-fallback-badge { max-width:52px !important; max-height:52px !important; width:auto !important; height:auto !important; object-fit:contain; }
      .do-mm-badge .do-mv-badge-stack { transform:scale(1.18); transform-origin:center; }
      .do-mm-scoreblock { min-width:150px; text-align:center; line-height:1.05; }
      .do-mm-lang-switch { display:inline-flex; justify-content:center; gap:4px; }
      .do-mm-chart-tools { display:flex; align-items:center; gap:12px; padding:8px 8px 12px; }
      .do-mm-lang-switch-inline { flex:0 0 auto; align-items:center; }
      .do-mm-lang-switch button { display:inline-flex; align-items:center; gap:4px; min-width:50px; justify-content:center; border:1px solid var(--do-mm-header-border, ${THEME.border}); border-radius:999px; background:rgba(255,255,255,.62); color:var(--do-mm-header-text, ${THEME.text}); padding:3px 7px; font-size:10px; font-weight:800; cursor:pointer; line-height:1.2; }
      .do-mm-flag { width:18px; height:11px; display:block; flex:0 0 auto; border-radius:2px; box-shadow:0 0 0 1px rgba(0,0,0,.10); }
      .do-mm-lang-switch button.active { background:var(--do-mm-header-text, ${THEME.text}); color:var(--do-mm-header-bg, #f5f5f0); }
      .do-mm-lang-switch button:hover { filter:brightness(.97); }
      .do-mm-scoreblock small { display:block; margin-bottom:4px; font-size:10px; font-weight:900; letter-spacing:.7px; color:#d33b2f; text-transform:uppercase; }
      .do-mm-topline strong { display:block; color:var(--do-mm-header-text, ${THEME.text}); font-size:24px; }
      .do-mm-layout { display:grid; grid-template-columns:minmax(0, 1.9fr) minmax(330px, .9fr); gap:16px; padding:0 14px; align-items:start; }
      .do-mm-layout-legacy { display:flex; flex-direction:column; gap:14px; padding:0; width:100%; min-width:0; }
      .do-mm-layout-legacy > * { width:100%; min-width:0; }
      .do-mm-layout-legacy .do-mm-svg { width:100%; height:auto; display:block; }
      .do-mm-layout-legacy .do-mm-timeline-box { height:auto !important; max-height:none !important; overflow:visible !important; }
      .do-mm-layout-legacy .do-mm-stats-box { margin-top:0; }
      .do-mm-left { min-width:0; }
      .do-mm-svg { width:100%; height:auto; display:block; }
      .do-mm-legend { display:flex; flex:1 1 auto; flex-wrap:wrap; gap:12px 22px; justify-content:center; align-items:center; padding:0 8px; color:${THEME.text}; font-size:12px; }
      .do-mm-legend > span { display:inline-flex; align-items:center; gap:6px; white-space:nowrap; }
      .do-mm-icon { display:block; flex:0 0 auto; color:${THEME.text}; overflow:visible; }
      .do-mm-icon.injury { color:${THEME.red}; }
      .do-mm-stats-box, .do-mm-timeline-box { background:${THEME.panel}; border:1px solid ${THEME.border}; border-radius:12px; overflow:hidden; }
      .do-mm-stats-box { padding:0 16px 14px; }
      .do-mm-stats-head { margin:0 -16px 10px; padding:7px 10px; text-align:center; background:${THEME.header}; color:#fff; font-size:13px; font-weight:800; letter-spacing:.3px; }
      .do-mm-team-heads { display:flex; justify-content:space-between; gap:16px; margin-bottom:8px; font-weight:800; }
      .do-mm-stat-row { padding:6px 0 2px; }
      .do-mm-stat-row.group-start { margin-top:8px; padding-top:12px; border-top:1px solid ${THEME.border}; }
      .do-mm-stat-values { display:grid; grid-template-columns:120px 1fr 120px; gap:8px; align-items:center; }
      .do-mm-stat-value { font-size:16px; font-weight:800; color:${THEME.text}; min-width:0; }
      .do-mm-stat-value.home { text-align:left; padding-left:4px; }
      .do-mm-stat-value.away { text-align:right; padding-right:4px; }
      .do-mm-stat-label { text-align:center; font-size:12px; color:${THEME.text}; }
      .do-mm-stat-track { position:relative; height:5px; margin-top:3px; background:${THEME.track}; border-radius:999px; overflow:hidden; }
      .do-mm-stat-fill { position:absolute; top:0; bottom:0; }
      .do-mm-stat-fill.home { left:0; border-radius:999px 0 0 999px; }
      .do-mm-stat-fill.away { right:0; border-radius:0 999px 999px 0; }
      .do-mm-stat-split { position:absolute; top:0; bottom:0; width:2px; transform:translateX(-1px); z-index:3; pointer-events:none; }
      .do-mm-card { display:inline-block; width:8px; height:13px; margin:0 5px 0 4px; vertical-align:-2px; border:1px solid rgba(0,0,0,.35); border-radius:1px; }
      .do-mm-card.yellow { background:${THEME.yellow}; }
      .do-mm-card.red { background:#d92525; }
      #do-mm-timeline { min-width:0; }
      .do-mm-timeline-box { padding:12px 12px 18px; overflow-y:auto; overflow-x:hidden; }
      .do-mm-timeline-title { position:relative; display:flex; align-items:center; justify-content:center; min-height:28px; padding:4px 36px 10px; text-align:center; font-size:16px; font-weight:900; color:${THEME.header}; }
      .do-mm-timeline-sort { position:absolute; right:4px; top:1px; width:28px; height:28px; display:inline-flex; align-items:center; justify-content:center; padding:4px; border:1px solid ${THEME.border}; border-radius:7px; background:rgba(255,255,255,.50); color:${THEME.header}; cursor:pointer; }
      .do-mm-timeline-sort:hover { background:rgba(255,255,255,.88); }
      .do-mm-timeline-sort.active { background:${THEME.header}; color:#fff; border-color:${THEME.header}; }
      .do-mm-timeline-sort svg { width:17px; height:17px; fill:none; stroke:currentColor; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
      .do-mm-player-wrap { min-width:0; grid-column:3; grid-row:1; text-align:left; }
      .do-mm-event.away .do-mm-player-wrap { grid-column:1; grid-row:1; text-align:right; }
      .do-mm-player-wrap .do-mm-player { display:inline; }
      .do-mm-player-link { text-decoration:none; cursor:pointer; }
      .do-mm-player-link:hover { text-decoration:underline; filter:brightness(.72); }
      .do-mm-sub-arrow { color:${THEME.text}; opacity:.72; }
      .do-mm-half-title { margin:5px 12px 8px; padding-top:9px; border-top:1px solid ${THEME.border}; text-align:center; font-size:12px; font-weight:800; font-style:italic; color:${THEME.header}; }
      .do-mm-event { --team:${THEME.subtle}; position:relative; display:grid; grid-template-columns:60px 26px 1fr; min-height:24px; align-items:center; gap:5px; margin:1px 4px; padding:2px 8px 2px 13px; border-radius:7px; font-size:11px; }
      .do-mm-event::before { content:''; position:absolute; top:5px; bottom:5px; left:2px; width:4px; background:var(--team); border-radius:999px; }
      .do-mm-event.away { grid-template-columns:1fr 26px 60px; padding:2px 13px 2px 8px; }
      .do-mm-event.away::before { left:auto; right:2px; }
      .do-mm-event.away .do-mm-time { grid-column:3; grid-row:1; text-align:right; }
      .do-mm-event.away .do-mm-event-icon { grid-column:2; grid-row:1; }
      .do-mm-event.goal { margin-top:3px; margin-bottom:3px; padding-top:5px; padding-bottom:5px; background:var(--team-goal-fill, ${THEME.goalHomeBg}); border:1px solid var(--team-goal-border, var(--team)); }
      .do-mm-event.away.goal { background:var(--team-goal-fill, ${THEME.goalAwayBg}); }
      .do-mm-time { font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-weight:800; color:${THEME.text}; }
      .do-mm-event-icon { display:flex; align-items:center; justify-content:center; color:${THEME.text}; }
      .do-mm-event-icon.injury { color:${THEME.red}; }
      .do-mm-event-icon .do-mm-icon { margin:auto; }
      .do-mm-player { overflow-wrap:anywhere; }
      .do-mm-event.goal .do-mm-player { font-weight:800; }
      .do-mm-legacy-wrap { margin:12px 0; }
      #${TAB_ID} { background:var(--do-mm-header-bg, #f5f5f0) !important; color:var(--do-mm-header-text, ${THEME.text}) !important; border-color:var(--do-mm-header-border, ${THEME.border}) !important; }
      .do-mm-legacy-controls { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
      .do-mm-legacy-button { border:1px solid var(--do-mm-header-border, ${THEME.border}); border-radius:7px; background:var(--do-mm-header-bg, #f5f5f0); color:var(--do-mm-header-text, ${THEME.text}); padding:9px 15px; font-weight:800; cursor:pointer; }
      .do-mm-legacy-wrap #${APP_ID} { margin-top:10px; background:${THEME.bg}; padding:12px; border:1px solid ${THEME.border}; border-radius:10px; }
      @media (max-width:1050px) {
        .do-mm-layout { grid-template-columns:1fr; }
        .do-mm-timeline-box { height:auto !important; max-height:none !important; overflow:visible; }
      }
      @media (max-width:650px) {
        .do-mm-chart-tools { align-items:flex-start; flex-direction:column; }
        .do-mm-legend { justify-content:flex-start; padding:0; }
        .do-mm-topline { grid-template-columns:1fr; text-align:center; }
        .do-mm-topteam.home, .do-mm-topteam.away { justify-content:center; }
        .do-mm-topteam.away { flex-direction:row-reverse; }
        .do-mm-stat-values { grid-template-columns:86px 1fr 86px; }
      }
    `;
    document.head.appendChild(style);
  }

  function boot() {
    installUi();
    setupLiveRefresh();
    window.addEventListener('resize', () => {
      const app = document.getElementById(APP_ID);
      if (app && (app.classList.contains('active') || !app.hidden)) {
        requestAnimationFrame(() => syncTimelineHeight(app));
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
