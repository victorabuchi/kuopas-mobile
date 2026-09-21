import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type TabIconName = 'updates' | 'chats' | 'communities' | 'messages' | 'more';

type Props = {
  name: TabIconName;
  active: boolean;
  color: string;
  // The colour behind the icon, so overlapping shapes can be separated by a gap.
  background: string;
  size?: number;
};

// Outline when idle, solid when selected, like WhatsApp's and Telegram's tab bars.
export default function TabIcon({ name, active, color, background, size = 28 }: Props) {
  const stroke = { stroke: color, strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const fill = active ? color : 'none';

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {name === 'updates' && (
        <>
          <Path d="M3.8 11.2 12 4l8.2 7.2V19a1.5 1.5 0 0 1-1.5 1.5H5.3A1.5 1.5 0 0 1 3.8 19z" fill={fill} {...stroke} />
          <Path d="M10 20.5v-5a2 2 0 0 1 4 0v5" fill={active ? background : 'none'} {...stroke} stroke={active ? background : color} />
        </>
      )}

      {name === 'chats' && (
        <>
          <Path
            d="M15.5 3.5c3.3 0 6 2.4 6 5.4 0 1.1-.4 2.1-1 3l1 3.1-3.2-1.2c-.9.3-1.8.5-2.8.5-3.3 0-6-2.4-6-5.4s2.7-5.4 6-5.4z"
            fill={fill}
            {...stroke}
          />
          <Path
            d="M8.5 8.5c3.3 0 6 2.4 6 5.4s-2.7 5.4-6 5.4c-.9 0-1.7-.15-2.5-.45L3 20l1-3.1c-.9-1-1.5-2-1.5-3 0-3 2.7-5.4 6-5.4z"
            fill={active ? color : background}
            {...stroke}
            stroke={active ? background : color}
            strokeWidth={active ? 1.9 : 1.7}
          />
          {active && (
            <Path
              d="M8.5 8.5c3.3 0 6 2.4 6 5.4s-2.7 5.4-6 5.4c-.9 0-1.7-.15-2.5-.45L3 20l1-3.1c-.9-1-1.5-2-1.5-3 0-3 2.7-5.4 6-5.4z"
              fill={color}
            />
          )}
        </>
      )}

      {name === 'communities' && (
        <>
          <Circle cx={12} cy={7.6} r={3} fill={fill} {...stroke} />
          <Circle cx={4.9} cy={10.9} r={2.2} fill={fill} {...stroke} />
          <Circle cx={19.1} cy={10.9} r={2.2} fill={fill} {...stroke} />
          <Path d="M6.8 19.6a5.2 5.2 0 0 1 10.4 0z" fill={fill} {...stroke} />
          <Path d="M1.5 17.9a3.6 3.6 0 0 1 4.9-2.9M22.5 17.9a3.6 3.6 0 0 0-4.9-2.9" {...stroke} />
        </>
      )}

      {name === 'messages' && (
        <>
          <Rect x={3} y={5} width={18} height={14} rx={3} fill={fill} {...stroke} />
          <Path d="m4.2 7.6 7.8 5.9 7.8-5.9" {...stroke} stroke={active ? background : color} />
        </>
      )}

      {name === 'more' && (
        <>
          <Rect x={4} y={4} width={6.6} height={6.6} rx={2} fill={fill} {...stroke} />
          <Rect x={13.4} y={4} width={6.6} height={6.6} rx={2} fill={fill} {...stroke} />
          <Rect x={4} y={13.4} width={6.6} height={6.6} rx={2} fill={fill} {...stroke} />
          <Rect x={13.4} y={13.4} width={6.6} height={6.6} rx={2} fill={fill} {...stroke} />
        </>
      )}
    </Svg>
  );
}
