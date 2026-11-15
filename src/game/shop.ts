import { spendCoins } from './coins';

export type BallSkinId = 'classic' | 'neon' | 'matte' | 'crystal';
export type TubeSkinId = 'glass' | 'neon' | 'gold' | 'ice';
export type ThemeId = 'cosmic' | 'nebula' | 'aurora' | 'sunset' | 'deepspace';

export type ShopItemType = 'ballSkin' | 'tubeSkin' | 'theme';

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
    id: 'skin-matte',
    type: 'ballSkin',
    name: 'Mat Gezegen',
    description: 'Yumuşak, mat yüzey',
    price: 100,
    emoji: '🪨',
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
    id: 'skin-crystal',
    type: 'ballSkin',
    name: 'Kristal',
    description: 'Keskin cam parıltısı',
    price: 200,
    emoji: '💎',
  },
  {
    id: 'tube-glass',
    type: 'tubeSkin',
    name: 'Cam Tüp',
    description: 'Varsayılan şeffaf cam',
    price: 0,
    emoji: '🧪',
    free: true,
  },
  {
    id: 'tube-neon',
    type: 'tubeSkin',
    name: 'Neon Tüp',
    description: 'Pembe-mavi parlayan kenarlar',
    price: 300,
    emoji: '🌈',
  },
  {
    id: 'tube-ice',
    type: 'tubeSkin',
    name: 'Buz Tüp',
    description: 'Buzlu, soğuk mavi cam',
    price: 400,
    emoji: '🧊',
  },
  {
    id: 'tube-gold',
    type: 'tubeSkin',
    name: 'Altın Tüp',
    description: 'Altın çerçeve, sıcak ışıltı',
    price: 600,
    emoji: '🏆',
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
  {
    id: 'theme-sunset',
    type: 'theme',
    name: 'Gün Batımı',
    description: 'Turuncu-pembe ufuk',
    price: 450,
    emoji: '🌅',
  },
  {
    id: 'theme-deepspace',
    type: 'theme',
    name: 'Derin Uzay',
    description: 'Kapkara gökyüzü, binlerce yıldız',
    price: 600,
    emoji: '✨',
  },
];

const INVENTORY_KEY = 'renkorbit_inventory';

export interface PlayerInventory {
  owned: string[];
  equippedBallSkin: BallSkinId;
  equippedTubeSkin: TubeSkinId;
  equippedTheme: ThemeId;
}

const DEFAULT_OWNED = ['skin-classic', 'tube-glass', 'theme-cosmic'];

const DEFAULT_INVENTORY: PlayerInventory = {
  owned: DEFAULT_OWNED,
  equippedBallSkin: 'classic',
  equippedTubeSkin: 'glass',
  equippedTheme: 'cosmic',
};

const ITEM_PREFIX: Record<ShopItemType, string> = {
  ballSkin: 'skin-',
  tubeSkin: 'tube-',
  theme: 'theme-',
};

function cosmeticId(item: ShopItem): string {
  return item.id.slice(ITEM_PREFIX[item.type].length);
}

function isKnown(type: ShopItemType, id: string | undefined): boolean {
  return SHOP_ITEMS.some((i) => i.type === type && cosmeticId(i) === id);
}

export function loadInventory(): PlayerInventory {
  try {
    const raw = localStorage.getItem(INVENTORY_KEY);
    if (!raw) return { ...DEFAULT_INVENTORY, owned: [...DEFAULT_OWNED] };
    const parsed = JSON.parse(raw) as Partial<PlayerInventory>;
    const owned = Array.isArray(parsed.owned)
      ? [...new Set([...DEFAULT_OWNED, ...parsed.owned])]
      : [...DEFAULT_OWNED];
    return {
      owned,
      equippedBallSkin: isKnown('ballSkin', parsed.equippedBallSkin)
        ? (parsed.equippedBallSkin as BallSkinId)
        : 'classic',
      equippedTubeSkin: isKnown('tubeSkin', parsed.equippedTubeSkin)
        ? (parsed.equippedTubeSkin as TubeSkinId)
        : 'glass',
      equippedTheme: isKnown('theme', parsed.equippedTheme)
        ? (parsed.equippedTheme as ThemeId)
        : 'cosmic',
    };
  } catch {
    return { ...DEFAULT_INVENTORY, owned: [...DEFAULT_OWNED] };
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

export function isEquipped(item: ShopItem, inv: PlayerInventory = loadInventory()): boolean {
  const id = cosmeticId(item);
  if (item.type === 'ballSkin') return inv.equippedBallSkin === id;
  if (item.type === 'tubeSkin') return inv.equippedTubeSkin === id;
  return inv.equippedTheme === id;
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

  const id = cosmeticId(item);
  if (item.type === 'ballSkin') inv.equippedBallSkin = id as BallSkinId;
  else if (item.type === 'tubeSkin') inv.equippedTubeSkin = id as TubeSkinId;
  else inv.equippedTheme = id as ThemeId;

  saveInventory(inv);
  return true;
}

/** Cosmetic id (e.g. "neon") for a shop item — used by previews */
export function getCosmeticId(item: ShopItem): string {
  return cosmeticId(item);
}
