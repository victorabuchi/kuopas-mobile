import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';

const COLORS = ['#046a38', '#84bd00', '#2e8b57', '#598000', '#3a9a5b', '#a6c93c'];

function polar(cx: number, cy: number, r: number, angleDeg: number): [number, number] {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

// Mirrors ChoreWheel in kuopas/web/src/app/(app)/household/ChoreWheel.tsx: the
// wheel turns so the person up next sits under the pointer, and spins a couple
// of extra times when the turn passes to the next person.
export default function ChoreWheel({ names, currentIndex, size = 170 }: { names: string[]; currentIndex: number; size?: number }) {
  const count = Math.max(names.length, 1);
  const segment = 360 / count;
  const target = -(currentIndex * segment + segment / 2);

  const rotation = useRef(new Animated.Value(target)).current;
  const turned = useRef(target);
  const previous = useRef(currentIndex);

  useEffect(() => {
    if (previous.current === currentIndex) return;
    const forward = (currentIndex - previous.current + count) % count;
    turned.current = turned.current - forward * segment - 360 * 2;
    previous.current = currentIndex;
    Animated.timing(rotation, {
      toValue: turned.current,
      duration: 1400,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
      useNativeDriver: true,
    }).start();
  }, [currentIndex, count, segment, rotation]);

  const c = size / 2;
  const radius = size / 2 - 6;
  const spin = rotation.interpolate({ inputRange: [-100000, 100000], outputRange: ['-100000deg', '100000deg'] });

  return (
    <View style={{ width: size, height: size + 14 }}>
      <Animated.View style={{ position: 'absolute', top: 14, width: size, height: size, transform: [{ rotate: spin }] }}>
        <Svg width={size} height={size}>
          <G>
            {names.map((name, i) => {
              const start = i * segment;
              const end = start + segment;
              const [x1, y1] = polar(c, c, radius, start);
              const [x2, y2] = polar(c, c, radius, end);
              const [tx, ty] = polar(c, c, radius * 0.62, start + segment / 2);
              const large = segment > 180 ? 1 : 0;
              const label = name.length > 9 ? `${name.slice(0, 8)}.` : name;
              return (
                <G key={`${name}-${i}`}>
                  {count === 1 ? (
                    <Circle cx={c} cy={c} r={radius} fill={COLORS[0]} />
                  ) : (
                    <Path
                      d={`M ${c} ${c} L ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} Z`}
                      fill={COLORS[i % COLORS.length]}
                      stroke="#fff"
                      strokeWidth={2}
                      opacity={i === currentIndex ? 1 : 0.72}
                    />
                  )}
                  <SvgText
                    x={tx}
                    y={ty}
                    fill="#fff"
                    fontSize={11}
                    fontWeight="700"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    transform={`rotate(${start + segment / 2} ${tx} ${ty})`}
                  >
                    {label}
                  </SvgText>
                </G>
              );
            })}
          </G>
        </Svg>
      </Animated.View>
      <Svg width={size} height={size + 14} style={{ position: 'absolute' }} pointerEvents="none">
        <Circle cx={c} cy={c + 14} r={14} fill="#fff" stroke="#e7e7e7" />
        <Path d={`M ${c - 9} 2 L ${c + 9} 2 L ${c} 22 Z`} fill="#b3261e" />
      </Svg>
    </View>
  );
}
