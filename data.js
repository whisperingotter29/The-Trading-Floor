/* ============ SEED DATA ============ */
const USERS = {
  arjun:        { handle: 'arjun', badge: 'ARJ', name: 'Arjun', bio: 'Gold and S&P micros. Asia range, London sweep, New York follow-through.', markets: ['MGC', 'MES'], followers: 412, following: 88, tone: 'floor' },
  'kestrel.fx': { handle: 'kestrel.fx', badge: 'KES', name: 'Kestrel', bio: 'London session only. Euro and S&P. If it is not 3am here I am not trading.', markets: ['M6E', 'MES'], followers: 18400, following: 140, tone: 'paper' },
  pitboss_ray:  { handle: 'pitboss_ray', badge: 'RAY', name: 'Ray Delgado', bio: 'Stood in the S&P pit from 1994 to 2004. Now I trade the same auction on a screen.', markets: ['ES', 'MES'], followers: 52100, following: 12, tone: 'board' },
  'delta.dani': { handle: 'delta.dani', badge: 'DNI', name: 'Dani', bio: 'Nasdaq scalps off the open. Small size, many reps.', markets: ['MNQ', 'NQ'], followers: 9600, following: 301, tone: 'floor' },
  'mara.orderflow': { handle: 'mara.orderflow', badge: 'MOF', name: 'Mara', bio: 'Footprint charts and delta. I post the losers too.', markets: ['NQ', 'ES'], followers: 23800, following: 77, tone: 'paper' },
  'sunday.open': { handle: 'sunday.open', badge: 'SUN', name: 'Sol', bio: 'Gold from Manila. Silver Bullet window, one trade a day.', markets: ['MGC'], followers: 7300, following: 190, tone: 'board' },
  'lin.breakouts': { handle: 'lin.breakouts', badge: 'LIN', name: 'Lin', bio: 'Crude oil. Wednesday inventory is my Christmas.', markets: ['MCL'], followers: 4100, following: 65, tone: 'floor' },
};
const ME = 'arjun';

const STRATEGIES = [
  { id: 'london-sweep', user: 'kestrel.fx', title: 'London Sweep to Fair Value Gap', tagline: 'Let Asia build the range. Let London take one side. Trade the return.', market: 'M6E', session: 'London', timeframe: '5m / 1m', style: 'ICT', theme: 'paper', followers: 6120, forks: 344, created: 14, stats: { winRate: 47, avgR: 2.3, sample: 212 },
    steps: [
      { kind: 'Setup', title: 'Mark the Asia range', body: 'Before London opens, draw the high and low of the Asia session. That range is the liquidity London will go looking for.', checks: ['Asia high and low marked', 'Range is less than 40 pips'], chart: { seed: 11, side: 'long', outcome: 'win' } },
      { kind: 'Setup', title: 'Wait for one side to get swept', body: 'Price trades through the Asia high or low and closes back inside the range. No close back inside, no trade.', checks: ['Wick through the level', '5m close back inside the range'] },
      { kind: 'Trigger', title: 'Displacement leaves a gap', body: 'After the sweep, look for a strong candle in the opposite direction that leaves a fair value gap on the 1m or 5m.', checks: ['Body at least 2x average', 'Clear three-candle gap'], chart: { seed: 12, side: 'long', outcome: 'win' } },
      { kind: 'Entry', title: 'Limit order in the gap', body: 'Place a limit at the middle of the gap. If price never comes back, the trade is gone. Do not chase.', checks: ['Limit at 50% of the gap'] },
      { kind: 'Stop', title: 'Stop beyond the sweep wick', body: 'Stop goes a few ticks past the extreme of the sweep. If that wick breaks, the idea is wrong.', checks: ['Stop placed before entry fills'] },
      { kind: 'Target', title: 'Opposite side of Asia', body: 'First target is the other side of the Asia range, or 2R, whichever comes first. Move stop to entry at 1R.', checks: ['TP set', 'Break-even rule set at 1R'] },
    ] },
  { id: 'opening-range-fade', user: 'pitboss_ray', title: 'Opening Range Fade', tagline: 'The first push out of the opening range is usually the wrong one.', market: 'ES', session: 'New York', timeframe: '2m', style: 'Auction', theme: 'board', followers: 11800, forks: 902, created: 40, stats: { winRate: 58, avgR: 1.4, sample: 530 },
    steps: [
      { kind: 'Setup', title: 'Let the first 15 minutes print', body: 'Mark the high and low of 9:30 to 9:45. Do not touch anything before 9:45.', checks: ['OR high and low marked'] },
      { kind: 'Trigger', title: 'A break that cannot hold', body: 'Price breaks the range, then the next two 2m candles fail to extend. Volume dries up on the second one.', checks: ['Break of OR', 'Two candles with no follow-through'], chart: { seed: 21, side: 'short', outcome: 'win' } },
      { kind: 'Entry', title: 'Sell the reclaim', body: 'Enter when a 2m candle closes back inside the range.', checks: ['2m close inside range'] },
      { kind: 'Stop', title: 'Above the failed high', body: 'One tick above the high of the break. Small stop, that is the point.', checks: ['Stop at failed high + 1 tick'] },
      { kind: 'Target', title: 'Middle, then the other side', body: 'Half off at the midpoint of the range, rest at the opposite edge.', checks: ['Half at midpoint', 'Runner to far edge'] },
    ] },
  { id: 'silver-bullet-gold', user: 'sunday.open', title: 'Silver Bullet, Gold Only', tagline: 'One window, one market, one trade. 10 to 11 New York time.', market: 'MGC', session: 'New York', timeframe: '1m', style: 'ICT', theme: 'floor', followers: 3900, forks: 210, created: 7, stats: { winRate: 41, avgR: 2.9, sample: 96 },
    steps: [
      { kind: 'Setup', title: 'Only trade 10:00 to 11:00', body: 'If there is no setup in the hour, there is no trade today.', checks: ['Clock is inside the window'] },
      { kind: 'Setup', title: 'Draw on liquidity', body: 'Pick the obvious high or low price is likely to run to. That is the direction.', checks: ['Target liquidity identified'] },
      { kind: 'Trigger', title: 'Gap in the direction of the draw', body: 'Wait for a 1m fair value gap that forms toward the target.', checks: ['FVG toward draw'], chart: { seed: 31, side: 'long', outcome: 'win' } },
      { kind: 'Entry', title: 'Enter on the retrace', body: 'Limit at the top of the gap for longs, bottom for shorts.', checks: [] },
      { kind: 'Management', title: 'Leave it alone', body: 'Stop under the gap, target the liquidity. No moving the stop until 1.5R.', checks: ['No stop changes before 1.5R'] },
    ] },
  { id: 'delta-divergence', user: 'mara.orderflow', title: 'Delta Divergence Scalp', tagline: 'Price makes a new high, buyers do not. Fade it.', market: 'NQ', session: 'New York', timeframe: 'Footprint 500t', style: 'Order flow', theme: 'board', followers: 8700, forks: 511, created: 21, stats: { winRate: 55, avgR: 1.2, sample: 780 },
    steps: [
      { kind: 'Setup', title: 'Mark prior swing high or low', body: 'Only take this at a level other traders can see.', checks: ['Level visible on 5m'] },
      { kind: 'Trigger', title: 'New high on weaker delta', body: 'Price trades above the swing but cumulative delta prints a lower high.', checks: ['Price HH', 'Delta LH'], chart: { seed: 41, side: 'short', outcome: 'win' } },
      { kind: 'Entry', title: 'Sell the first red footprint bar', body: 'Enter on the first bar that closes with negative delta.', checks: [] },
      { kind: 'Stop', title: 'Tight, above the high', body: '8 to 12 ticks. If it holds above, the buyers were real.', checks: ['Stop under 12 ticks'] },
    ] },
  { id: 'crude-inventory', user: 'lin.breakouts', title: 'Crude Inventory Breakout', tagline: 'Wednesday, 10:30. Trade the second move, not the first.', market: 'MCL', session: 'New York', timeframe: '1m', style: 'Breakout', theme: 'paper', followers: 2200, forks: 96, created: 3, stats: { winRate: 44, avgR: 2.1, sample: 64 },
    steps: [
      { kind: 'Rule', title: 'Flat before the number', body: 'No position at 10:29. The first spike is noise.', checks: ['Flat at 10:29'] },
      { kind: 'Setup', title: 'Mark the first 3 minute range', body: 'High and low from 10:30 to 10:33.', checks: ['Range marked'] },
      { kind: 'Entry', title: 'Break of that range', body: 'Stop order a few ticks outside it, both directions. Cancel the other side when one fills.', checks: ['OCO brackets placed'], chart: { seed: 51, side: 'long', outcome: 'win' } },
      { kind: 'Target', title: '2R or 10:45, whichever first', body: 'The move fades fast. Take it.', checks: [] },
    ] },
  { id: 'asia-low-gold', user: 'arjun', title: 'Asia Low Sweep on Gold', tagline: 'Gold likes to take the Asia low before London decides the day.', market: 'MGC', session: 'London', timeframe: '5m', style: 'ICT', theme: 'floor', followers: 186, forks: 11, created: 2, stats: { winRate: 45, avgR: 2.4, sample: 38 },
    steps: [
      { kind: 'Setup', title: 'Mark the Asia low', body: 'Asia session low on MGC, drawn before 3pm Manila time.', checks: ['Asia low marked'] },
      { kind: 'Trigger', title: 'Sweep and close back above', body: 'London takes the low and a 5m candle closes back above it.', checks: ['Sweep', 'Close back above'], chart: { seed: 61, side: 'long', outcome: 'win' } },
      { kind: 'Entry', title: 'Enter on the 5m gap', body: 'Limit in the fair value gap left by the reclaim candle.', checks: [] },
      { kind: 'Stop', title: 'Below the sweep', body: 'A dollar under the wick.', checks: [] },
    ] },
];

const now = Date.now(); const H = 3600e3;
const POSTS = [
  { id: 'p1', user: 'kestrel.fx', type: 'chart', seed: 101, sym: 'M6E', tf: '5m', session: 'London', side: 'long', outcome: 'win', rr: 2.4, strategy: 'london-sweep', caption: 'Asia low taken at 8:04, closed back inside by 8:10. Gap filled on the retrace and it ran straight to the Asia high. Textbook one.', likes: 1284, comments: [{ u: 'sunday.open', t: 'Clean. Did you take partials at 1R?' }, { u: 'kestrel.fx', t: 'Stop to entry at 1R, no partials.' }], t: now - 2 * H },
  { id: 'p2', user: 'pitboss_ray', type: 'replay', seed: 102, sym: 'ES', tf: '2m', session: 'New York', side: 'short', outcome: 'win', rr: 1.6, strategy: 'opening-range-fade', caption: 'Watch the second candle after the break. No volume, no follow-through. That is the whole trade.', likes: 4410, comments: [{ u: 'delta.dani', t: 'The pause before the reclaim is everything.' }], t: now - 3 * H },
  { id: 'p3', user: 'mara.orderflow', type: 'chart', seed: 103, sym: 'NQ', tf: '1m', session: 'New York', side: 'short', outcome: 'loss', rr: 2, strategy: 'delta-divergence', caption: 'Divergence was there, buyers did not care. Stopped for a full R. Posting it because the losers are half the strategy.', likes: 2031, comments: [{ u: 'pitboss_ray', t: 'Respect for posting it.' }, { u: 'arjun', t: 'Was delta still rising into the stop?' }], t: now - 5 * H },
  { id: 'p4', user: 'sunday.open', type: 'replay', seed: 104, sym: 'MGC', tf: '1m', session: 'New York', side: 'long', outcome: 'win', rr: 3, strategy: 'silver-bullet-gold', caption: '10:12 gap toward the overnight high. One trade, done for the day.', likes: 890, comments: [], t: now - 7 * H },
  { id: 'p5', user: 'delta.dani', type: 'chart', seed: 105, sym: 'MNQ', tf: '1m', session: 'New York', side: 'long', outcome: 'win', rr: 1.5, caption: 'Rep 4 of 6 today. Small size, same setup every time.', likes: 512, comments: [], t: now - 9 * H },
  { id: 'p6', user: 'lin.breakouts', type: 'replay', seed: 106, sym: 'MCL', tf: '1m', session: 'New York', side: 'long', outcome: 'win', rr: 2, strategy: 'crude-inventory', caption: 'Inventory draw, first spike faded, second break went. 10:38 in, 10:44 out.', likes: 377, comments: [{ u: 'kestrel.fx', t: 'Six minutes of work.' }], t: now - 26 * H },
  { id: 'p7', user: 'arjun', type: 'chart', seed: 107, sym: 'MGC', tf: '5m', session: 'London', side: 'long', outcome: 'win', rr: 2.6, strategy: 'asia-low-gold', caption: 'Asia low swept at the London open, reclaimed on the next candle. Held to 2.6R.', likes: 64, comments: [{ u: 'sunday.open', t: 'Gold does this every other day.' }], t: now - 30 * H },
  { id: 'p8', user: 'pitboss_ray', type: 'chart', seed: 108, sym: 'ES', tf: '2m', session: 'New York', side: 'long', outcome: 'loss', rr: 1.5, caption: 'Tried to fade the low. The low was real. Out one tick past the stop, no hesitation.', likes: 3160, comments: [], t: now - 32 * H },
  { id: 'p9', user: 'mara.orderflow', type: 'replay', seed: 109, sym: 'NQ', tf: '500t', session: 'New York', side: 'short', outcome: 'win', rr: 1.3, strategy: 'delta-divergence', caption: 'Same setup as yesterday. This time the sellers showed up.', likes: 1720, comments: [], t: now - 50 * H },
  { id: 'p10', user: 'kestrel.fx', type: 'chart', seed: 110, sym: 'MES', tf: '5m', session: 'London', side: 'short', outcome: 'win', rr: 2, strategy: 'london-sweep', caption: 'S&P took the Asia high overnight and gave it all back into Europe.', likes: 998, comments: [], t: now - 54 * H },
  { id: 'p11', user: 'arjun', type: 'replay', seed: 111, sym: 'MES', tf: '5m', session: 'New York', side: 'short', outcome: 'loss', rr: 2, caption: 'Early on the short. Right idea, wrong time. Stopped then it dumped an hour later.', likes: 41, comments: [], t: now - 75 * H },
  { id: 'p12', user: 'sunday.open', type: 'chart', seed: 112, sym: 'MGC', tf: '1m', session: 'New York', side: 'short', outcome: 'win', rr: 2.2, strategy: 'silver-bullet-gold', caption: 'Short side for once. Draw was the overnight low.', likes: 640, comments: [], t: now - 80 * H },
];
POSTS.forEach((p) => { p.g = genTrade({ seed: p.seed, sym: p.sym, side: p.side, outcome: p.outcome, rr: p.rr }); });

const state = {
  posts: POSTS, strategies: STRATEGIES, users: USERS,
  liked: new Set(['p3']), saved: new Set(), following: new Set(['kestrel.fx', 'sunday.open', 'pitboss_ray']),
  followedStrategies: new Set(['london-sweep']),
  draft: null,
};
const U = (h) => state.users[h];
const S = (id) => state.strategies.find((s) => s.id === id);
const P = (id) => state.posts.find((p) => p.id === id);
