import { useState } from 'react';
import { loadCoins } from '../game/coins';
import {
  equipItem,
  getCosmeticId,
  isEquipped,
  isOwned,
  loadInventory,
  purchaseItem,
  SHOP_ITEMS,
  type BallSkinId,
  type ShopItem,
  type ShopItemType,
} from '../game/shop';
import { Ball } from './Ball';
import { ModalCard } from './ModalCard';
import './Tube.css';
import './Shop.css';

interface ShopProps {
  open: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

const TABS: { id: ShopItemType; label: string }[] = [
  { id: 'ballSkin', label: 'Toplar' },
  { id: 'tubeSkin', label: 'Tüpler' },
  { id: 'theme', label: 'Temalar' },
];

/** Three palette picks spread across the wheel for previews */
const PREVIEW_COLORS = [0, 5, 8];

export function Shop({ open, onClose, onUpdate }: ShopProps) {
  const [tab, setTab] = useState<ShopItemType>('ballSkin');
  const [message, setMessage] = useState<string | null>(null);
  const [, bump] = useState(0);

  const refresh = () => {
    bump((n) => n + 1);
    onUpdate?.();
  };

  const coins = loadCoins();
  const inventory = loadInventory();
  const items = SHOP_ITEMS.filter((i) => i.type === tab);

  const handlePurchase = (item: ShopItem) => {
    const result = purchaseItem(item.id);
    setMessage(result.ok ? `${item.name} satın alındı!` : (result.error ?? 'Hata'));
    if (result.ok) {
      equipItem(item.id);
      refresh();
    }
  };

  const handleEquip = (item: ShopItem) => {
    if (equipItem(item.id)) {
      setMessage(`${item.name} seçildi`);
      refresh();
    }
  };

  return (
    <ModalCard
      open={open}
      onClose={onClose}
      overlay="transparent"
      anchor="contained"
      titleId="shop-title"
      title="Galaksi Mağazası"
      className="modal-card--tall"
      subtitle={
        <p className="modal-card__subtitle">
          <span aria-hidden>🪙</span> {coins} Orbit Coin
        </p>
      }
    >
      <div className="shop__tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`shop__tab ${tab === t.id ? 'shop__tab--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {message && <p className="shop__toast">{message}</p>}

      <ul className="shop__list">
        {items.map((item) => (
          <ShopRow
            key={item.id}
            item={item}
            owned={isOwned(item.id)}
            equipped={isEquipped(item, inventory)}
            affordable={coins >= item.price}
            onPurchase={() => handlePurchase(item)}
            onEquip={() => handleEquip(item)}
          />
        ))}
      </ul>
    </ModalCard>
  );
}

/** Real look of the cosmetic, not just an emoji */
function ShopPreview({ item }: { item: ShopItem }) {
  const id = getCosmeticId(item);

  if (item.type === 'ballSkin') {
    return (
      <span className="shop__preview shop__preview--balls" aria-hidden>
        {PREVIEW_COLORS.map((c) => (
          <Ball key={c} colorId={c} colorCount={12} size={18} skin={id as BallSkinId} />
        ))}
      </span>
    );
  }

  if (item.type === 'tubeSkin') {
    return (
      <span className={`shop__preview game-board--tube-${id}`} aria-hidden>
        <span className="tube shop__mini-tube">
          <span className="tube__rim" />
          <span className="tube__glass shop__mini-glass">
            {PREVIEW_COLORS.map((c) => (
              <Ball key={c} colorId={c} colorCount={12} size={12} />
            ))}
          </span>
          <span className="tube__base" />
        </span>
      </span>
    );
  }

  return <span className={`shop__preview shop__swatch shop__swatch--${id}`} aria-hidden />;
}

function ShopRow({
  item,
  owned,
  equipped,
  affordable,
  onPurchase,
  onEquip,
}: {
  item: ShopItem;
  owned: boolean;
  equipped: boolean;
  affordable: boolean;
  onPurchase: () => void;
  onEquip: () => void;
}) {
  return (
    <li className={`shop__row ${equipped ? 'shop__row--equipped' : ''}`}>
      <ShopPreview item={item} />
      <div className="shop__info">
        <span className="shop__name">{item.name}</span>
        <span className="shop__desc">{item.description}</span>
      </div>
      {owned ? (
        <button
          type="button"
          className={`shop__btn ${equipped ? 'shop__btn--equipped' : ''}`}
          onClick={onEquip}
          disabled={equipped}
        >
          {equipped ? 'Seçili' : 'Kullan'}
        </button>
      ) : (
        <button
          type="button"
          className={`shop__btn shop__btn--buy${affordable ? '' : ' shop__btn--short'}`}
          onClick={onPurchase}
        >
          {item.free ? 'Ücretsiz' : `🪙 ${item.price}`}
        </button>
      )}
    </li>
  );
}
