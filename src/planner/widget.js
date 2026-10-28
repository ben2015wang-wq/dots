// 日常行程本 · 桌面小工具 (Scriptable)
// Shows today's or this week's schedule on the iPhone home screen, read from the Calendar app.
// Put your schedule into Calendar first: 行程本 › 設定 › 通知 › 匯出到行事曆（.ics）.
//
// Widget Parameter (long-press the widget › Edit Widget › Parameter), words separated by spaces:
//   day | week        今天 or 整週 (default: day; large widgets default to week)
//   color | mono      有色 or 無色 (default: color)
//   any other word    only read the calendar with that name, e.g.  week mono 行程
// Examples:  "week"   "day mono"   "week 行程"

const APP_URL = 'https://ben2015wang-wq.github.io/dots/planner/';
const WD = ['日', '一', '二', '三', '四', '五', '六'];

/* ---------- settings from the widget parameter ---------- */
const family = config.widgetFamily || 'large';
const words = String(args.widgetParameter || '').trim().split(/[\s,，]+/).filter(Boolean);
const lower = words.map(w => w.toLowerCase());
const has = (...k) => lower.some(w => k.includes(w));
const mode = has('week', '週', '整週') ? 'week' : has('day', '日', '今天') ? 'day' : (family === 'large' ? 'week' : 'day');
const mono = has('mono', '無色', 'grey', 'gray');
const calName = words.find(w => !['week', '週', '整週', 'day', '日', '今天', 'mono', '無色', 'grey', 'gray', 'color', '有色'].includes(w.toLowerCase()));

/* ---------- 02 frame / 15 block colors ---------- */
const C = {
  bg: Color.dynamic(new Color('#FFFFFF'), new Color('#181C24')),
  ink: Color.dynamic(new Color('#18202E'), new Color('#E8EBF1')),
  onInk: Color.dynamic(new Color('#FFFFFF'), new Color('#0E1117')),
  mu: Color.dynamic(new Color('#5A6273'), new Color('#98A1B1')),
  sub: Color.dynamic(new Color('#3F4654'), new Color('#B4BBC8')),
  line: Color.dynamic(new Color('#EEF0F4'), new Color('#2A303B')),
  monoBg: Color.dynamic(new Color('#F2F2F2'), new Color('#262A33')),
  monoInk: Color.dynamic(new Color('#121212'), new Color('#E8EBF1')),
  now: Color.dynamic(new Color('#2E7D52'), new Color('#4CC38A')),
};
// 有色: a light tint of the event's calendar color behind the block, the color itself for the rule
function tint(hex, light){
  const h = (hex || '2F5FB3').replace('#', '').slice(0, 6);
  const n = parseInt(h, 16), r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255;
  const mix = (base, a) => [r, g, b].map((v, i) => Math.round(v * a + base[i] * (1 - a)));
  const [lr, lg, lb] = mix([255, 255, 255], 0.12), [dr, dg, db] = mix([24, 28, 36], 0.26);
  const hx = a => '#' + a.map(v => v.toString(16).padStart(2, '0')).join('');
  return light ? hx([lr, lg, lb]) : hx([dr, dg, db]);
}
function blockColors(ev){
  if (mono) return { bg: C.monoBg, rule: C.monoInk, ink: C.monoInk };
  const hex = ev.calendar && ev.calendar.color ? ev.calendar.color.hex : '2F5FB3';
  return { bg: Color.dynamic(new Color(tint(hex, true)), new Color(tint(hex, false))), rule: new Color(hex), ink: C.ink };
}

/* ---------- data ---------- */
const pad = n => String(n).padStart(2, '0');
const hm = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const sod = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const now = new Date(), today = sod(now);
const weekStart = addDays(today, -((today.getDay() + 6) % 7)); // Monday

async function loadEvents(from, to){
  let cals = null;
  if (calName) { try { cals = [await Calendar.forEventsByTitle(calName)]; } catch (e) { cals = null; } }
  const list = cals ? await CalendarEvent.between(from, to, cals) : await CalendarEvent.between(from, to);
  return list.map(e => ({
    title: String(e.title || '').replace(/^待辦[：:]\s*/, ''),
    todo: /^待辦[：:]/.test(e.title || ''),
    start: e.startDate, end: e.endDate, allDay: !!e.isAllDay,
    location: e.location || '', calendar: e.calendar,
  })).sort((a, b) => (b.allDay - a.allDay) || (a.start - b.start));
}
const on = (list, d) => { const s = +sod(d), e = s + 864e5; return list.filter(x => +x.start < e && +x.end > s); };

/* ---------- pieces ---------- */
function text(stack, str, font, color, lines){
  const t = stack.addText(str); t.font = font; t.textColor = color; if (lines) t.lineLimit = lines; t.minimumScaleFactor = 0.8; return t;
}
function badge(stack, d, size){
  const b = stack.addStack(); b.layoutVertically(); b.centerAlignContent();
  b.size = new Size(size, size); b.cornerRadius = size / 3; b.backgroundColor = C.ink;
  const top = b.addStack(); top.addSpacer(); text(top, `${d.getMonth() + 1}月`, Font.systemFont(size * 0.2), C.onInk); top.addSpacer();
  const bot = b.addStack(); bot.addSpacer(); text(bot, String(d.getDate()), Font.boldSystemFont(size * 0.42), C.onInk); bot.addSpacer();
}
function header(w, d, title, subtitle, size){
  const h = w.addStack(); h.layoutHorizontally(); h.centerAlignContent(); h.spacing = 10;
  badge(h, d, size);
  const t = h.addStack(); t.layoutVertically();
  text(t, title, Font.boldSystemFont(size * 0.38), C.ink, 1);
  text(t, subtitle, Font.systemFont(size * 0.26), C.mu, 1);
  h.addSpacer();
}
// 15 block without the number: rule | title / time / place
function block(parent, ev, opt){
  const col = blockColors(ev), done = +ev.end < +now;
  const s = parent.addStack(); s.layoutHorizontally(); s.backgroundColor = col.bg; s.cornerRadius = opt.radius;
  s.setPadding(opt.pad, opt.pad + 3, opt.pad, opt.pad); s.spacing = opt.gap; s.centerAlignContent();
  if (opt.width) s.size = new Size(opt.width, 0);
  const rule = s.addStack(); rule.size = new Size(mono ? 1 : 2, opt.ruleH); rule.backgroundColor = col.rule; rule.cornerRadius = 1;
  const body = s.addStack(); body.layoutVertically(); body.spacing = 1;
  const t = text(body, (ev.todo ? '○ ' : '') + ev.title, Font.boldSystemFont(opt.title), col.ink, opt.lines || 1);
  if (done) t.textOpacity = 0.45;
  if (opt.time) {
    const when = ev.allDay ? (ev.todo ? '今天截止' : '整天') : `${hm(ev.start)}–${hm(ev.end)}`;
    const tm = text(body, when + (opt.place && ev.location ? `・${ev.location}` : ''), Font.regularMonospacedSystemFont(opt.time), mono ? C.mu : C.sub, 1);
    if (done) tm.textOpacity = 0.45;
  }
  s.addSpacer();
  return s;
}
function empty(w, msg, size){
  const e = w.addStack(); e.layoutVertically(); e.backgroundColor = mono ? C.monoBg : Color.dynamic(new Color('#F4F6F9'), new Color('#1F242E'));
  e.cornerRadius = 12; e.setPadding(10, 12, 10, 12);
  text(e, msg, Font.systemFont(size), C.mu, 2);
  const r = e.addStack(); r.addSpacer();
}

/* ---------- layouts ---------- */
async function dayWidget(w){
  const events = on(await loadEvents(today, addDays(today, 2)), today);
  const upcoming = events.filter(e => e.allDay || +e.end > +now);
  const pool = upcoming.length ? upcoming : events;
  const title = `星期${WD[today.getDay()]}`, sub = `今天・${events.length} 個行程`;
  if (family === 'medium') {
    // two columns: date on the left, up to 3 blocks on the right
    const row = w.addStack(); row.layoutHorizontally(); row.spacing = 12; row.topAlignContent();
    const left = row.addStack(); left.layoutVertically(); left.size = new Size(78, 0); left.spacing = 6;
    badge(left, today, 40);
    text(left, title, Font.boldSystemFont(15), C.ink, 1);
    text(left, sub, Font.systemFont(10), C.mu, 2);
    const right = row.addStack(); right.layoutVertically(); right.spacing = 4;
    if (!events.length) empty(right, '今天沒有行程', 12);
    for (const ev of pool.slice(0, 3)) block(right, ev, { radius: 9, pad: 3, gap: 6, ruleH: 22, title: 12, time: 9.5, place: true });
    if (pool.length > 3) text(right, `還有 ${pool.length - 3} 個`, Font.systemFont(9), C.mu);
    return;
  }
  const small = family === 'small';
  const max = small ? 2 : 5;
  header(w, today, title, sub, small ? 32 : 40);
  w.addSpacer(small ? 6 : 10);
  if (!events.length) { empty(w, '今天沒有行程', small ? 12 : 13); w.addSpacer(); return; }
  const list = w.addStack(); list.layoutVertically(); list.spacing = small ? 4 : 6;
  for (const ev of pool.slice(0, max)) block(list, ev, small
    ? { radius: 8, pad: 4, gap: 5, ruleH: 22, title: 11, time: 9 }
    : { radius: 12, pad: 6, gap: 8, ruleH: 30, title: 14, time: 10.5, place: true });
  w.addSpacer();
  if (pool.length > max) text(w, `還有 ${pool.length - max} 個`, Font.systemFont(10), C.mu);
}

async function weekWidget(w){
  const all = await loadEvents(weekStart, addDays(weekStart, 7));
  const days = [...Array(7)].map((_, i) => addDays(weekStart, i));
  const total = all.length, end = days[6];
  const large = family === 'large';
  header(w, today, `${weekStart.getMonth() + 1}/${weekStart.getDate()} – ${end.getMonth() + 1}/${end.getDate()}`, `本週・${total} 個行程`, large ? 36 : 28);
  w.addSpacer(large ? 10 : 6);
  if (large) {
    // one row per day: day label, then up to 2 blocks side by side
    const rows = w.addStack(); rows.layoutVertically(); rows.spacing = 5;
    for (const d of days) {
      const isToday = +d === +today, evs = on(all, d);
      const r = rows.addStack(); r.layoutHorizontally(); r.centerAlignContent(); r.spacing = 6;
      const lab = r.addStack(); lab.size = new Size(32, 32); lab.cornerRadius = 10; lab.layoutVertically(); lab.centerAlignContent();
      if (isToday) lab.backgroundColor = C.ink;
      const l1 = lab.addStack(); l1.addSpacer(); text(l1, WD[d.getDay()], Font.systemFont(9), isToday ? C.onInk : C.mu); l1.addSpacer();
      const l2 = lab.addStack(); l2.addSpacer(); text(l2, String(d.getDate()), Font.boldSystemFont(14), isToday ? C.onInk : C.ink); l2.addSpacer();
      if (!evs.length) { text(r, '—', Font.systemFont(11), C.mu); r.addSpacer(); continue; }
      for (const ev of evs.slice(0, 2)) block(r, ev, { radius: 8, pad: 3, gap: 5, ruleH: 24, title: 11, time: 9, width: 112 });
      if (evs.length > 2) text(r, `+${evs.length - 2}`, Font.mediumSystemFont(10), C.mu);
      r.addSpacer();
    }
    w.addSpacer();
  } else {
    // medium: seven columns
    const cols = w.addStack(); cols.layoutHorizontally(); cols.spacing = 3; cols.topAlignContent();
    for (const d of days) {
      const isToday = +d === +today, evs = on(all, d);
      const c = cols.addStack(); c.layoutVertically(); c.spacing = 3; c.size = new Size(38, 0);
      const lab = c.addStack(); lab.layoutVertically(); lab.cornerRadius = 7; lab.setPadding(2, 0, 2, 0);
      if (isToday) lab.backgroundColor = C.ink;
      const a = lab.addStack(); a.addSpacer(); text(a, WD[d.getDay()], Font.systemFont(8), isToday ? C.onInk : C.mu); a.addSpacer();
      const b = lab.addStack(); b.addSpacer(); text(b, String(d.getDate()), Font.boldSystemFont(12), isToday ? C.onInk : C.ink); b.addSpacer();
      for (const ev of evs.slice(0, 2)) block(c, ev, { radius: 5, pad: 2, gap: 2, ruleH: 14, title: 8, lines: 2 });
      if (evs.length > 2) { const m = c.addStack(); m.addSpacer(); text(m, `+${evs.length - 2}`, Font.systemFont(8), C.mu); m.addSpacer(); }
    }
    w.addSpacer();
  }
}

/* ---------- build ---------- */
const w = new ListWidget();
w.backgroundColor = C.bg;
w.setPadding(14, 14, 12, 14);
w.url = APP_URL;
try {
  if (mode === 'week' && family !== 'small') await weekWidget(w); else await dayWidget(w);
} catch (e) {
  text(w, '讀不到行事曆', Font.boldSystemFont(13), C.ink);
  text(w, '請在 Scriptable 允許取用「行事曆」，或檢查參數裡的行事曆名稱。', Font.systemFont(11), C.mu, 3);
}
w.refreshAfterDate = new Date(Date.now() + 15 * 60000);

if (config.runsInWidget) Script.setWidget(w);
else if (mode === 'week') await w.presentLarge();
else await w.presentMedium();
Script.complete();
