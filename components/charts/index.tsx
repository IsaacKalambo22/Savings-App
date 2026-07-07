// Lightweight, dependency-light charts built directly on react-native-svg.
// (react-native-svg ships with Expo Go — no extra native modules needed.)
// All charts take explicit colors so they stay theme-aware.

import { View, Text, Dimensions } from "react-native";
import Svg, { Circle, G, Line, Path, Rect } from "react-native-svg";

const SCREEN_WIDTH = Dimensions.get("window").width;

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

// ─────────────────────────────────────────────
// LINE CHART — savings growth over time
// ─────────────────────────────────────────────

export function LineChart({
  data,
  labels,
  color,
  gridColor,
  labelColor,
  height = 180,
  width = SCREEN_WIDTH - 64,
}: {
  data: number[];
  labels: string[];
  color: string;
  gridColor: string;
  labelColor: string;
  height?: number;
  width?: number;
}) {
  if (data.length === 0) return null;

  const padding = { top: 12, right: 8, bottom: 24, left: 8 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const max = niceMax(Math.max(...data, 0));
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const pointX = (i: number) =>
    padding.left + (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW);
  const pointY = (v: number) => padding.top + chartH - ((v - min) / range) * chartH;

  const linePath = data
    .map((v, i) => `${i === 0 ? "M" : "L"} ${pointX(i)} ${pointY(v)}`)
    .join(" ");
  const areaPath = `${linePath} L ${pointX(data.length - 1)} ${padding.top + chartH} L ${pointX(0)} ${padding.top + chartH} Z`;

  return (
    <View>
      <Svg width={width} height={height}>
        {/* horizontal grid lines */}
        {[0, 0.5, 1].map((t) => (
          <Line
            key={t}
            x1={padding.left}
            y1={padding.top + chartH * t}
            x2={padding.left + chartW}
            y2={padding.top + chartH * t}
            stroke={gridColor}
            strokeWidth={1}
          />
        ))}
        <Path d={areaPath} fill={color} fillOpacity={0.12} />
        <Path d={linePath} stroke={color} strokeWidth={2.5} fill="none" />
        {data.map((v, i) => (
          <Circle key={i} cx={pointX(i)} cy={pointY(v)} r={3} fill={color} />
        ))}
      </Svg>
      <View className="flex-row justify-between" style={{ paddingHorizontal: padding.left }}>
        {labels.map((l, i) => (
          <Text key={i} style={{ color: labelColor, fontSize: 10 }}>
            {l}
          </Text>
        ))}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// GROUPED BAR CHART — monthly deposits vs withdrawals
// ─────────────────────────────────────────────

export function GroupedBarChart({
  groups,
  labels,
  colors,
  gridColor,
  labelColor,
  height = 200,
  width = SCREEN_WIDTH - 64,
}: {
  groups: number[][]; // each entry: [deposits, withdrawals]
  labels: string[];
  colors: string[]; // [depositColor, withdrawalColor]
  gridColor: string;
  labelColor: string;
  height?: number;
  width?: number;
}) {
  if (groups.length === 0) return null;

  const padding = { top: 12, right: 8, bottom: 24, left: 8 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const allValues = groups.flat();
  const max = niceMax(Math.max(...allValues, 0));

  const groupWidth = chartW / groups.length;
  const barGap = 4;
  const barsPerGroup = 2;
  const barWidth = Math.max(6, (groupWidth - barGap * (barsPerGroup + 1)) / barsPerGroup);

  return (
    <View>
      <Svg width={width} height={height}>
        {[0, 0.5, 1].map((t) => (
          <Line
            key={t}
            x1={padding.left}
            y1={padding.top + chartH * t}
            x2={padding.left + chartW}
            y2={padding.top + chartH * t}
            stroke={gridColor}
            strokeWidth={1}
          />
        ))}
        {groups.map((group, gi) => (
          <G key={gi} x={padding.left + gi * groupWidth}>
            {group.map((value, bi) => {
              const barH = max > 0 ? (value / max) * chartH : 0;
              const x = barGap + bi * (barWidth + barGap);
              return (
                <Rect
                  key={bi}
                  x={x}
                  y={padding.top + chartH - barH}
                  width={barWidth}
                  height={barH}
                  rx={3}
                  fill={colors[bi]}
                />
              );
            })}
          </G>
        ))}
      </Svg>
      <View className="flex-row" style={{ paddingHorizontal: padding.left }}>
        {labels.map((l, i) => (
          <Text
            key={i}
            style={{ color: labelColor, fontSize: 10, width: groupWidth, textAlign: "center" }}
          >
            {l}
          </Text>
        ))}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// DONUT CHART — account distribution
// ─────────────────────────────────────────────

export function DonutChart({
  segments,
  size = 160,
  strokeWidth = 26,
  trackColor,
  centerLabel,
  centerColor,
}: {
  segments: { value: number; color: string }[];
  size?: number;
  strokeWidth?: number;
  trackColor: string;
  centerLabel?: string;
  centerColor?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const cx = size / 2;
  const cy = size / 2;

  let offset = 0;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${cx}, ${cy}`}>
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {total > 0 &&
            segments.map((s, i) => {
              const fraction = s.value / total;
              const dash = fraction * circumference;
              const circle = (
                <Circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={radius}
                  stroke={s.color}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                />
              );
              offset += dash;
              return circle;
            })}
        </G>
      </Svg>
      {centerLabel ? (
        <View style={{ position: "absolute", alignItems: "center" }}>
          <Text style={{ color: centerColor, fontSize: 16, fontWeight: "700" }}>{centerLabel}</Text>
        </View>
      ) : null}
    </View>
  );
}
