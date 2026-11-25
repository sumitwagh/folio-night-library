// The library's light from dusk (18:00) to dawn (06:00 → 30). Everything that changes with the
// hour — sky, walls, lamps, the interface's own colours — is interpolated from these keys.
const KEYS = [
  // hour, wall, skyTop, skyLow, key light, key intensity, lamp intensity, stars, name
  [18.0, '#EADCC7', '#F4C796', '#EE9A6E', '#FFD7A0', 2.4, 0.4, 0.0, 'Golden hour'],
  [19.3, '#D9B9A2', '#7F86B8', '#F0A27F', '#FFC08A', 1.9, 0.8, 0.05, 'Dusk'],
  [20.5, '#6E6A86', '#2E3A6E', '#9A7FA6', '#B9C4FF', 1.1, 1.4, 0.35, 'Blue hour'],
  [22.0, '#262A40', '#131A38', '#2A3466', '#9FB2FF', 0.55, 2.0, 0.8, 'Lamplight'],
  [24.0, '#171A2A', '#070A18', '#141A36', '#8EA3E8', 0.4, 2.2, 1.0, 'Midnight'],
  [27.0, '#12131F', '#05060F', '#101428', '#7D8FD0', 0.3, 2.0, 1.0, 'The small hours'],
  [28.8, '#3A3247', '#272B55', '#C98680', '#E8B4A6', 0.8, 1.3, 0.35, 'First light'],
  [30.0, '#EAD7C9', '#BFD3E6', '#F4C6A5', '#FFE1C4', 2.2, 0.4, 0.0, 'Dawn'],
];

const hex = (h) => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const toHex = (c) => '#' + c.map((v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0')).join('');
const lum = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];

export function nightAt(hour) {
  const h = Math.min(30, Math.max(18, hour));
  let i = 0;
  while (i < KEYS.length - 2 && h > KEYS[i + 1][0]) i++;
  const A = KEYS[i], B = KEYS[i + 1];
  const t = (h - A[0]) / (B[0] - A[0]);
  const s = t * t * (3 - 2 * t);
  const wall = mix(hex(A[1]), hex(B[1]), s);
  const light = lum(wall) > 0.42;
  return {
    hour: h,
    name: t < 0.5 ? A[8] : B[8],
    wall, skyTop: mix(hex(A[2]), hex(B[2]), s), skyLow: mix(hex(A[3]), hex(B[3]), s),
    key: mix(hex(A[4]), hex(B[4]), s), keyI: A[5] + (B[5] - A[5]) * s, lampI: A[6] + (B[6] - A[6]) * s, stars: A[7] + (B[7] - A[7]) * s,
    // the moon (or sun) travels across the arched window through the night
    sunUp: h < 19.6 || h > 28.9,
    orb: [0.5 + 0.38 * Math.cos(Math.PI * ((h - 18) / 12)), 0.12 + 0.62 * Math.sin(Math.PI * ((h - 18) / 12))],
    light,
    css: {
      '--wall': toHex(wall),
      '--wall2': toHex(mix(wall, light ? [1, 1, 1] : [0, 0, 0], 0.18)),
      '--card': light ? 'rgba(255,252,246,.72)' : 'rgba(14,16,28,.72)',
      '--ink': light ? '#231A12' : '#EEE7DA',
      '--ink2': light ? 'rgba(35,26,18,.66)' : 'rgba(238,231,218,.66)',
      '--ink3': light ? 'rgba(35,26,18,.42)' : 'rgba(238,231,218,.42)',
      '--line': light ? 'rgba(35,26,18,.14)' : 'rgba(238,231,218,.14)',
      '--accent': light ? '#A9431F' : '#FFB86B',
      '--accent-ink': light ? '#FFF6EA' : '#1A0F02',
      '--sky': toHex(mix(hex(A[2]), hex(B[2]), s)),
    },
  };
}

export const START_HOUR = (() => {
  const d = new Date();
  const v = d.getHours() + d.getMinutes() / 60;
  if (v >= 18) return v;
  if (v < 6) return v + 24;
  return 21.67; // daytime: open at 21:40, the library's favourite hour
})();
export const IS_DAYTIME = (() => { const h = new Date().getHours(); return h >= 6 && h < 18; })();
