import type { ColorId } from './types';

export interface ColorDef {
  id: number;
  name: string;
  hex: string;
  highlight: string;
  shadow: string;
}

// Full 12-color palette; each level uses the first N colors
// Vibrant candy/neon palette — pops on dark cosmic background
export const COLOR_PALETTE: ColorDef[] = [
  { id: 0, name: 'Mars', hex: '#ff4d6d', highlight: '#ff8fa3', shadow: '#c9184a' },
  { id: 1, name: 'Güneş', hex: '#ff9e00', highlight: '#ffd166', shadow: '#e85d04' },
  { id: 2, name: 'Altın', hex: '#ffe566', highlight: '#fff3a3', shadow: '#f4a261' },
  { id: 3, name: 'Neon', hex: '#06d6a0', highlight: '#7bffb8', shadow: '#059669' },
  { id: 4, name: 'Buz', hex: '#4cc9f0', highlight: '#a8ecff', shadow: '#0096c7' },
  { id: 5, name: 'Okyanus', hex: '#4895ef', highlight: '#90b8ff', shadow: '#3a56c4' },
  { id: 6, name: 'Galaksi', hex: '#9d4edd', highlight: '#e0aaff', shadow: '#6a2c9e' },
  { id: 7, name: 'Şeker', hex: '#ff6bcb', highlight: '#ffb3e0', shadow: '#d63384' },
  { id: 8, name: 'Turkuaz', hex: '#2ec4b6', highlight: '#8ef0e4', shadow: '#1a9e8f' },
  { id: 9, name: 'Lavanta', hex: '#b8a9ff', highlight: '#e2dbff', shadow: '#7c6fd4' },
  { id: 10, name: 'Ay', hex: '#f8f9fa', highlight: '#ffffff', shadow: '#ced4da' },
  { id: 11, name: 'Gece', hex: '#5c4d7d', highlight: '#9d8ec4', shadow: '#3d2f5c' },
];

export function getColorDef(id: ColorId): ColorDef {
  return COLOR_PALETTE[id] ?? COLOR_PALETTE[0];
}
