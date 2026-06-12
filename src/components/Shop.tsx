import { useState } from 'react';
import { loadCoins } from '../game/coins';
import {
  equipItem,
  isOwned,
  loadInventory,
  purchaseItem,
  SHOP_ITEMS,
  type ShopItem,
} from '../game/shop';
import { ModalCard } from './ModalCard';
import './Shop.css';

interface ShopProps {
  open: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export function Shop({ open, onClose, onUpdate }: ShopProps) {
  const [tab, setTab] = useState<'ballSkin' | 'theme'>('ballSkin');
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

  const isEquipped = (item: ShopItem) => {
    if (item.type === 'ballSkin') return inventory.equippedBallSkin === item.id.replace('skin-', '');
    return inventory.equippedTheme === item.id.replace('theme-', '');
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
      <div className="shop__tabs">
        <button
          type="button"
          className={`shop__tab ${tab === 'ballSkin' ? 'shop__tab--active' : ''}`}
          onClick={() => setTab('ballSkin')}
        >
          Top Skinleri
        </button>
        <button
          type="button"
          className={`shop__tab ${tab === 'theme' ? 'shop__tab--active' : ''}`}
          onClick={() => setTab('theme')}
        >
          Temalar
        </button>
      </div>

      {message && <p className="shop__toast">{message}</p>}

      <ul className="shop__list">
        {items.map((item) => (
          <ShopRow
            key={item.id}
            item={item}
            owned={isOwned(item.id)}
            equipped={isEquipped(item)}
            onPurchase={() => handlePurchase(item)}
            onEquip={() => handleEquip(item)}
          />
        ))}
      </ul>
    </ModalCard>
  );
}

function ShopRow({
  item,
  owned,
  equipped,
  onPurchase,
  onEquip,
}: {
  item: ShopItem;
  owned: boolean;
  equipped: boolean;
  onPurchase: () => void;
  onEquip: () => void;
}) {
  return (
    <li className={`shop__row ${equipped ? 'shop__row--equipped' : ''}`}>
      <span className="shop__emoji" aria-hidden>
        {item.emoji}
      </span>
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
        <button type="button" className="shop__btn shop__btn--buy" onClick={onPurchase}>
          {item.free ? 'Ücretsiz' : `🪙 ${item.price}`}
        </button>
      )}
    </li>
  );
}
