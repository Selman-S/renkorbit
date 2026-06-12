import { spendCoins } from './coins';

export type BallSkinId = 'classic' | 'neon' | 'matte' | 'crystal';
export type ThemeId = 'cosmic' | 'nebula' | 'aurora';

export type ShopItemType = 'ballSkin' | 'theme';

export interface ShopItem {
  id: string;
  type: ShopItemType;
  name: string;
  description: string;
  price: number;
  emoji: string;
  free?: boolean;
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'skin-classic',
    type: 'ballSkin',
    name: 'Klasik Küre',
    description: 'Varsayılan parlak 3D top',
    price: 0,
    emoji: '🔮',
    free: true,
  },
  {
    id: 'skin-neon',
    type: 'ballSkin',
    name: 'Neon Işık',
    description: 'Parlayan neon hale',
    price: 150,
    emoji: '💡',
  },
  {
    id: 'skin-matte',
    type: 'ballSkin',
    name: 'Mat Gezegen',
    description: 'Yumuşak, mat yüzey',
    price: 100,
    emoji: '🪨',
  },
  {
    id: 'skin-crystal',
    type: 'ballSkin',
    name: 'Kristal',
    description: 'Keskin cam parıltısı',
    price: 200,
    emoji: '💎',
  },
  {
    id: 'theme-cosmic',
    type: 'theme',
    name: 'Kozmik',
    description: 'Varsayılan mor galaksi',
    price: 0,
    emoji: '🌌',
    free: true,
  },
  {
    id: 'theme-nebula',
    type: 'theme',
    name: 'Nebula',
    description: 'Pembe-mor bulutsu',
    price: 250,
    emoji: '🌸',
  },
  {
    id: 'theme-aurora',
    type: 'theme',
    name: 'Aurora',
    description: 'Kuzey ışıkları tonu',
    price: 250,
    emoji: '🌊',
  },
];

const INVENTORY_KEY = 'renkorbit_inventory';

export interface PlayerInventory {
  owned: string[];
  equippedBallSkin: BallSkinId;
  equippedTheme: ThemeId;
}

const DEFAULT_OWNED = ['skin-classic', 'theme-cosmic'];

const DEFAULT_INVENTORY: PlayerInventory = {
  owned: DEFAULT_OWNED,
  equippedBallSkin: 'classic',
  equippedTheme: 'cosmic',
};

function itemIdToBallSkin(id: string): BallSkinId | null {
  if (id === 'skin-classic') return 'classic';
  if (id === 'skin-neon') return 'neon';
  if (id === 'skin-matte') return 'matte';
  if (id === 'skin-crystal') return 'crystal';
  return null;
}

function itemIdToTheme(id: string): ThemeId | null {
  if (id === 'theme-cosmic') return 'cosmic';
  if (id === 'theme-nebula') return 'nebula';
  if (id === 'theme-aurora') return 'aurora';
  return null;
}

export function loadInventory(): PlayerInventory {
  try {
    const raw = localStorage.getItem(INVENTORY_KEY);
    if (!raw) return { ...DEFAULT_INVENTORY };
    const parsed = JSON.parse(raw) as Partial<PlayerInventory>;
    const owned = Array.isArray(parsed.owned)
      ? [...new Set([...DEFAULT_OWNED, ...parsed.owned])]
      : [...DEFAULT_OWNED];
    return {
      owned,
      equippedBallSkin: parsed.equippedBallSkin ?? 'classic',
      equippedTheme: parsed.equippedTheme ?? 'cosmic',
    };
  } catch {
    return { ...DEFAULT_INVENTORY };
  }
}

function saveInventory(inv: PlayerInventory): void {
  try {
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inv));
  } catch {
    /* ignore */
  }
}

export function isOwned(itemId: string): boolean {
  return loadInventory().owned.includes(itemId);
}

export function getShopItem(itemId: string): ShopItem | undefined {
  return SHOP_ITEMS.find((i) => i.id === itemId);
}

export function purchaseItem(itemId: string): { ok: boolean; error?: string } {
  const item = getShopItem(itemId);
  if (!item) return { ok: false, error: 'Ürün bulunamadı' };

  const inv = loadInventory();
  if (inv.owned.includes(itemId)) return { ok: false, error: 'Zaten sahipsin' };
  if (item.free || item.price === 0) {
    inv.owned.push(itemId);
    saveInventory(inv);
    return { ok: true };
  }
  if (!spendCoins(item.price)) return { ok: false, error: 'Yetersiz coin' };

  inv.owned.push(itemId);
  saveInventory(inv);
  return { ok: true };
}

export function equipItem(itemId: string): boolean {
  const item = getShopItem(itemId);
  if (!item) return false;

  const inv = loadInventory();
  if (!inv.owned.includes(itemId)) return false;

  if (item.type === 'ballSkin') {
    const skin = itemIdToBallSkin(itemId);
    if (!skin) return false;
    inv.equippedBallSkin = skin;
  } else {
    const theme = itemIdToTheme(itemId);
    if (!theme) return false;
    inv.equippedTheme = theme;
  }

  saveInventory(inv);
  return true;
}

export function ballSkinToItemId(skin: BallSkinId): string {
  return `skin-${skin}`;
}

export function themeToItemId(theme: ThemeId): string {
  return `theme-${theme}`;
}
