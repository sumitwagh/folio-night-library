// The night's catalogue: the original eight books from data.js plus sixteen more, each with the
// hour of the night it is best read at, a chapter list and the kind of landscape on its pages.
import { books as CORE, authors as A, readers as READERS, rooms as ROOMS } from './data.js';

const MORE = [
  ['tide', 'The Tidewright', 'lena', 'Fantasy', ['strange'], '#0D3B4C', '#7FE3D8', '#E4FBF7', '#082833', 'tide', '4.5', 448, '7,200', 'She could move the sea, but only backwards.', 'A girl who can reverse tides is hired to undo a flood that already happened.', 'sea'],
  ['nine', 'Nine Rooms in Kyoto', 'hana', 'Literary', ['warm', 'tears'], '#EFE6D8', '#B5412E', '#2A211B', '#C8BCA8', 'grid', '4.7', 272, '12,600', 'The first room had only a window and a promise.', 'Nine rented rooms, nine years, one woman learning how to stay.', 'city'],
  ['frequency', 'Dead Frequency', 'dev', 'Thriller', ['fast'], '#14141A', '#FF5A3C', '#F4F0EA', '#0A0A0E', 'rings', '4.3', 304, '10,100', 'At 3:12 a.m. the station played a song from next week.', 'A pirate radio station broadcasts tomorrow’s news, and someone wants it off the air.', 'city'],
  ['atlas', 'Atlas of Unbuilt Cities', 'mira', 'Essays', ['strange'], '#F4EDE0', '#123B3A', '#1C2523', '#D7CDB9', 'grid', '4.6', 196, '4,300', 'Every city is a draft of a better one.', 'Essays on the cities we planned and never built, and what they say about us.', 'city'],
  ['orbit', 'Small Orbit', 'theo', 'Sci-fi', ['strange', 'fast'], '#20103A', '#FF9DE2', '#FBEFFF', '#140A26', 'rings', '4.2', 288, '3,900', 'The station was small enough to love.', 'Six people, one leaking station, and an AI that keeps writing them poems.', 'sky'],
  ['monsoon', 'Monsoon Ledger', 'sana', 'Magical realism', ['warm'], '#1F4B3A', '#F2C14E', '#F3F7EE', '#143329', 'line', '4.5', 208, '2,800', 'Rain kept its own accounts in our house.', 'A family ledger that records every rainfall — and every debt the rain still owes.', 'valley'],
  ['ember', 'Ember Psalms', 'iris', 'Poetry', ['tears'], '#3A1410', '#FFB067', '#FFEBD8', '#260B08', 'sun', '4.4', 96, '2,100', 'Keep the fire small enough to carry.', 'Poems written by firelight during a winter without power.', 'valley'],
  ['wander', 'The Last Wanderer of Leh', 'arjun', 'Travel', ['warm', 'fast'], '#DDE7EE', '#2E5C8A', '#162433', '#B6C5D1', 'arch', '4.3', 232, '1,900', 'Above 4,000 metres, everyone tells the truth.', 'A road-trip novel set on the highest passes in the world.', 'road'],
  ['cipher', 'Cipher Garden', 'theo', 'Mystery', ['strange', 'fast'], '#0F2A1E', '#E8D36B', '#F2F6E9', '#0A1C14', 'diamond', '4.5', 336, '5,600', 'The hedges spelled a word only from the air.', 'A botanical garden whose hedges encode a murder confession.', 'orchard'],
  ['hollow', 'Hollow Bells', 'lena', 'Gothic', ['tears', 'strange'], '#1B1B24', '#D6C4A1', '#EDE6D9', '#111118', 'arch', '4.4', 368, '4,100', 'The bells rang for people who had not died yet.', 'A village whose bells toll a day early, and the bell-ringer who stops listening.', 'valley'],
  ['saltwind', 'Saltwind Letters', 'mira', 'Epistolary', ['warm', 'tears'], '#B9D3D0', '#123B3A', '#102422', '#93B2AE', 'band', '4.6', 184, '3,500', 'Dear stranger, the wind took your letter to me.', 'Letters between two strangers on opposite coasts, carried by the wrong wind.', 'sea'],
  ['vantage', 'Vantage', 'dev', 'Thriller', ['fast'], '#F0EAE0', '#1F1F1F', '#111111', '#D2CABD', 'line', '4.2', 280, '6,900', 'From the 41st floor you can see a lie.', 'A window cleaner witnesses a crime that, officially, never happened.', 'city'],
  ['lanterns', 'A Thousand Lanterns', 'hana', 'Literary', ['tears', 'warm'], '#5A1E2E', '#FFC56B', '#FFF1E2', '#3E1420', 'disc', '4.8', 296, '9,800', 'We lit one for every name we were afraid to say.', 'A festival of lanterns, a family of secrets, and one lantern that will not light.', 'sky'],
  ['drift', 'Continental Drift', 'arjun', 'Essays', ['warm'], '#2C2A26', '#E0A458', '#F4EEE4', '#1E1C19', 'tide', '4.1', 168, '1,300', 'Every border is moving, just slowly.', 'Short essays about borders, crossings and the people who keep moving.', 'road'],
  ['glow', 'Glowworm Arithmetic', 'iris', 'Poetry', ['warm', 'strange'], '#0E2230', '#C6F36B', '#E9F6FF', '#08161F', 'moon', '4.5', 88, '1,600', 'Count the lights; one of them is counting you.', 'Poems about counting, caves and things that glow in the dark.', 'sky'],
  ['quiet', 'The Lantern Census', 'mira', 'Literary sci-fi', ['strange'], '#2B2F3A', '#FFB86B', '#F0ECE3', '#1D2029', 'rings', '—', 0, '0', 'The lamplighter counts in threes.', 'The sequel to Cartographer, being written in public one field log at a time. Out 14 March 2027.', 'city'],
];

const MOTIF = { carto: 'sun', salt: 'band', orchard: 'arch', km: 'disc', weight: 'line', glass: 'diamond', moons: 'moon', field: 'tide' };
const SCENE = { carto: 'city', salt: 'sea', orchard: 'orchard', km: 'road', weight: 'valley', glass: 'city', moons: 'sky', field: 'valley' };

const CHAPTERS = {
  carto: ['Vell, the quiet city', 'The Bureau of Sound', 'A street with no name', 'Pencil, not ink', 'The ledger on p. 211', 'For the ones who listen'],
  salt: ['One station', 'The list', 'Names I haven’t met', 'The 1987 crew', 'Low tide', 'Stay'],
  orchard: ['The plum tree', 'A thimble of milk', 'Sixty years of prayers', 'The god who stopped', 'Frost', 'Harvest'],
  km: ['Kanyakumari, 4 a.m.', 'Oranges', 'The first border', 'Night bus to Tabriz', 'Ararat', 'Istanbul at last'],
  weight: ['212 lux', 'The photometer', 'Rooms he never measured', 'Darkroom', 'Exposure', 'Enough light'],
  glass: ['Glasshouse', 'The negotiation', 'Root access', 'Bloom', 'Night shift', 'Protocol'],
  moons: ['The first fold', 'Monsoon', 'Paper in the sky', 'Grandmother’s hands', 'Eclipse', 'Full'],
  field: ['August keeps a list', 'Heat', 'Swimming at dusk', 'The last fireflies', 'September', 'Fieldnotes'],
};
const GENERIC = ['The first night', 'A door left open', 'What the dark keeps', 'Lamps', 'The long hour', 'Morning, almost'];

export const BOOKS = {};
const hours = ['18:40', '19:10', '19:35', '20:05', '20:30', '20:55', '21:20', '21:40', '22:05', '22:30', '22:55', '23:20', '23:45', '00:10', '00:40', '01:05', '01:30', '02:00', '02:30', '03:00', '03:30', '04:10', '04:50', '05:30'];
const ORDER = ['moons', 'saltwind', 'km', 'wander', 'nine', 'field', 'monsoon', 'salt', 'lanterns', 'carto', 'vantage', 'orchard', 'cipher', 'frequency', 'weight', 'hollow', 'glass', 'orbit', 'tide', 'glow', 'ember', 'atlas', 'drift', 'quiet'];

for (const [k, b] of Object.entries(CORE)) BOOKS[k] = { id: k, ...b, motif: MOTIF[k], scene: SCENE[k], hook: b.l1 };
for (const [id, t, a, g, mood, bg, ac, ink, sp, motif, r, pg, rd, hook, blurb, scene] of MORE) {
  BOOKS[id] = { id, t, a, an: A[a].n, g, mood, bg, ac, ink, sp, motif, r, pg, rd, hl: Math.round(pg / 3), room: 'r7', blurb, l1: hook, l2: blurb, hook, why: 'readers who share your late-night hours rated it highly.', cr: [['Editor', 'Nocturne Editions']], scene, upcoming: id === 'quiet' };
}
ORDER.forEach((id, i) => { BOOKS[id].hour = hours[i]; BOOKS[id].no = String(i + 1).padStart(3, '0'); BOOKS[id].chapters = CHAPTERS[id] || GENERIC; });

export const SHELF = ORDER.map((id) => BOOKS[id]);
export { A as AUTHORS, READERS, ROOMS };

export const MOODS = [['all', 'All night'], ['strange', 'Something strange'], ['warm', 'Something warm'], ['tears', 'A good cry'], ['fast', 'One more chapter']];

/** "21:40" → 21.67 ; hours after midnight count as 24+ so the night is continuous. */
export function hourOf(s) {
  const [h, m] = s.split(':').map(Number);
  const v = h + m / 60;
  return v < 12 ? v + 24 : v;
}
export function clockOf(v) {
  const h = Math.floor(v) % 24, m = Math.round((v % 1) * 60) % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

export const HALL = {
  Authors: [['mira', 94], ['dev', 91], ['hana', 88], ['sana', 85], ['theo', 82], ['lena', 80]].map(([k, sc]) => ({ k, kind: 'author', n: A[k].n, i: A[k].i, c: A[k].c, sc })),
  Readers: [['leila', 61], ['kabir', 58], ['tomas', 54], ['nora', 49], ['priya', 47], ['atlas', 44]].map(([k, sc]) => ({ k, kind: 'reader', n: READERS[k].n, i: READERS[k].i, c: READERS[k].c, sc })),
  Reviewers: [['leila', 84], ['atlas', 69], ['kabir', 52], ['nora', 41], ['priya', 38], ['tomas', 22]].map(([k, sc]) => ({ k, kind: 'reader', n: READERS[k].n, i: READERS[k].i, c: READERS[k].c, sc })),
};

export const ASKS = [
  ['Something strange tonight', 'orchard', 'Orchard of Small Gods — myth told slowly, and a god who has stopped answering. You liked Cartographer’s quiet strangeness; this is its warmer cousin.'],
  ['A short read before bed', 'field', 'Fieldnotes for the End of Summer — 96 pages, one poem per hour. Perfect for your usual 20 minutes before bed.'],
  ['More like Cartographer', 'glass', 'Glasshouse Protocol — a city with a mind of its own. Readers who finished Cartographer rated it 4.9.'],
  ['What is Kabir reading?', 'weight', 'Kabir is 81% into The Weight of Light. Your tastes match 91%, and he gave it five stars.'],
];

export const SEALS = [['Night Owl II', '☾', 'Read past midnight on 20 nights.', 1], ['First Review', '✎', 'Wrote your first review, of Cartographer.', 1], ['23 Nights', '✦', 'Read 23 nights in a row — your longest streak.', 1], ['Trendsetter', '↗', 'Shelved a book before it hit the top 10.', 1], ['Q&A Regular', '?', 'Attend three author Q&As (2 of 3).', 0], ['Century Club', 'C', 'Read 100 books on Nocturne (23 of 100).', 0]];
