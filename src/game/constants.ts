import type { ColorId } from './types';

export interface ColorDef {
  id: number;
  name: string;
  hex: string;
  highlight: string;
  shadow: string;
}

// 12 hues ~30° apart — high saturation, alternating lightness for neighbors
export const COLOR_PALETTE: ColorDef[] = [
  { id: 0, name: 'Kırmızı', hex: '#FF2D55', highlight: '#FF8FA8', shadow: '#C4002E' },
  { id: 1, name: 'Turuncu', hex: '#FF7B00', highlight: '#FFB366', shadow: '#CC5500' },
  { id: 2, name: 'Amber', hex: '#FFBF00', highlight: '#FFE066', shadow: '#C99700' },
  { id: 3, name: 'Limon', hex: '#A8E600', highlight: '#D4FF66', shadow: '#6F9900' },
  { id: 4, name: 'Yeşil', hex: '#00D166', highlight: '#66FFAA', shadow: '#00994A' },
  { id: 5, name: 'Turkuaz', hex: '#00C8F0', highlight: '#80E8FF', shadow: '#0090B8' },
  { id: 6, name: 'Mavi', hex: '#2B7FFF', highlight: '#80B3FF', shadow: '#0050CC' },
  { id: 7, name: 'İndigo', hex: '#5E4BFF', highlight: '#A899FF', shadow: '#3520CC' },
  { id: 8, name: 'Mor', hex: '#B84DFF', highlight: '#D999FF', shadow: '#7A1ACC' },
  { id: 9, name: 'Pembe', hex: '#FF3DAD', highlight: '#FF99D6', shadow: '#CC0077' },
  { id: 10, name: 'Gümüş', hex: '#E8E8F2', highlight: '#FFFFFF', shadow: '#9898B0' },
  { id: 11, name: 'Kahve', hex: '#C67C4E', highlight: '#E8B08A', shadow: '#8B4A22' },
];

/** Spread palette picks across the wheel when fewer than 12 colors are active */
export function resolvePaletteIndex(colorId: ColorId, colorCount: number): number {
  const max = COLOR_PALETTE.length - 1;
  if (colorCount <= 1) return 0;
  if (colorCount >= COLOR_PALETTE.length) return colorId;
  return Math.round((colorId * max) / (colorCount - 1));
}

export function getColorDef(id: ColorId, colorCount = 12): ColorDef {
  const idx = resolvePaletteIndex(id, colorCount);
  return COLOR_PALETTE[idx] ?? COLOR_PALETTE[0];
}
