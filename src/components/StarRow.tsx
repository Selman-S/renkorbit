import './StarRow.css';

interface StarRowProps {
  count: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export function StarRow({ count, max = 3, size = 'md', label }: StarRowProps) {
  return (
    <div className={`star-row star-row--${size}`} role="img" aria-label={label ?? `${count} yıldız`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`star-row__star ${i < count ? 'star-row__star--filled' : ''}`}>
          ★
        </span>
      ))}
    </div>
  );
}
