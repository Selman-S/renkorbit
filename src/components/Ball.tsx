import { getColorDef } from '../game/constants';
import type { BallSkinId } from '../game/shop';
import type { ColorId } from '../game/types';
import './Ball.css';

interface BallProps {
  colorId: ColorId;
  size?: number;
  ghost?: boolean;
  skin?: BallSkinId;
  className?: string;
}

function getBallStyle(color: ReturnType<typeof getColorDef>, skin: BallSkinId, ghost: boolean) {
  if (ghost) {
    return {
      background: `radial-gradient(circle at 32% 28%, ${color.highlight} 0%, ${color.hex} 45%, ${color.shadow} 100%)`,
      boxShadow: 'none',
    };
  }

  switch (skin) {
    case 'neon':
      return {
        background: `radial-gradient(circle at 30% 26%, #fff 0%, ${color.highlight} 18%, ${color.hex} 55%, ${color.shadow} 100%)`,
        boxShadow: `0 0 14px ${color.hex}88, 0 4px 8px rgba(0,0,0,0.35), inset 0 -2px 4px ${color.shadow}`,
      };
    case 'matte':
      return {
        background: `radial-gradient(circle at 42% 38%, ${color.hex} 0%, ${color.shadow} 100%)`,
        boxShadow: `0 3px 6px rgba(0,0,0,0.28)`,
      };
    case 'crystal':
      return {
        background: `radial-gradient(circle at 28% 22%, #ffffff 0%, ${color.highlight} 25%, ${color.hex} 50%, ${color.shadow} 100%)`,
        boxShadow: `0 0 8px ${color.highlight}66, 0 4px 10px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(255,255,255,0.35)`,
      };
    default:
      return {
        background: `radial-gradient(circle at 32% 28%, ${color.highlight} 0%, ${color.hex} 45%, ${color.shadow} 100%)`,
        boxShadow: `0 4px 8px rgba(0,0,0,0.35), inset 0 -2px 4px ${color.shadow}`,
      };
  }
}

export function Ball({ colorId, size, ghost = false, skin = 'classic', className = '' }: BallProps) {
  const color = getColorDef(colorId);
  const style = getBallStyle(color, skin, ghost);

  return (
    <div
      className={`ball ball--skin-${skin} ${ghost ? 'ball--ghost' : ''} ${className}`.trim()}
      style={{
        width: size,
        height: size,
        ...style,
      }}
    />
  );
}
