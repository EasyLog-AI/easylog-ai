import { Cell, Pie, PieChart as RechartsPieChart } from 'recharts';

import ChartContainer from '@/app/_ui/components/Chart/ChartContainer';
import ChartLegend from '@/app/_ui/components/Chart/ChartLegend';
import ChartLegendContent from '@/app/_ui/components/Chart/ChartLegendContent';
import ChartTooltip from '@/app/_ui/components/Chart/ChartTooltip';
import ChartTooltipContent from '@/app/_ui/components/Chart/ChartTooltipContent';
import { ChartConfig } from '@/app/_ui/components/Chart/utils/chartConfig';

import { InternalChartConfig } from '../schemas/internalChartConfigSchema';

export interface PieChartProps {
  config: InternalChartConfig;
}

const PieChart = ({ config }: PieChartProps) => {
  const { values, xAxisKey, data } = config;

  // For pie charts, if we only have one series, we need to generate colors for each data point
  const availableColors = [
    'var(--color-chart-1)',
    'var(--color-chart-2)',
    'var(--color-chart-3)',
    'var(--color-chart-4)',
    'var(--color-chart-5)'
  ];

  // Generate colors for each data point - for pie charts, use colors from values array
  const colors =
    values.length >= data.length
      ? data.map(
          (_, index) =>
            values[index]?.color ||
            availableColors[index % availableColors.length]
        )
      : values.map((s) => s.color);

  /**
   * Build legend config per category to ensure correct label-color mapping per
   * segment
   */
  const chartConfig = data.reduce((acc, row, index) => {
    const record = row as Record<string, string | number>;
    const categoryKey = String(record[xAxisKey]);
    acc[categoryKey] = {
      label: categoryKey,
      color: colors[index % colors.length]
    };
    return acc;
  }, {} as ChartConfig);

  /** Assuming the first value entry is the one to display in the pie chart */
  const pieValue = values[0];

  // Label configuration with safe defaults (backward compatible)
  const showLabels = config.showLabels ?? false;
  const labelContent = config.labelContent ?? 'name+percent';
  const labelPosition = config.labelPosition ?? 'auto';
  const minSliceAngleForInside = config.minSliceAngleForInside ?? 18;
  const showLeaderLines = config.showLeaderLines ?? true;
  const labelFontSize = config.labelFontSize ?? 12;
  const labelFontWeight = config.labelFontWeight ?? 500;
  const explicitLabelColor = config.labelColor;

  function getAutoContrastColor(hexOrCss: string | undefined, fallback: string): string {
    if (!hexOrCss) return fallback;
    if (hexOrCss.startsWith('var(')) {
      return fallback;
    }
    if (hexOrCss.startsWith('#')) {
      const hex = hexOrCss.replace('#', '');
      const bigint = parseInt(hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex, 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      // Relative luminance
      const [R, G, B] = [r, g, b].map((v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      });
      const luminance = 0.2126 * R + 0.7152 * G + 0.0722 * B;
      return luminance > 0.5 ? '#111827' : '#FFFFFF'; // gray-900 or white
    }
    return fallback;
  }

  type LabelProps = {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
    index: number;
    name?: string;
    value?: number;
    fill?: string;
  };

  const renderLabel = (props: LabelProps) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent, name, value, fill } = props;

    if (!showLabels) return null;

    const angleDeg = percent * 360;
    const shouldPlaceInside =
      labelPosition === 'inside' ||
      (labelPosition === 'auto' && angleDeg >= minSliceAngleForInside);
    const shouldPlaceOutside = labelPosition === 'outside' || !shouldPlaceInside;

    const RADIAN = Math.PI / 180;
    const radiusInside = innerRadius + (outerRadius - innerRadius) * 0.5;
    const radiusOutside = outerRadius + 16;
    const xInside = cx + radiusInside * Math.cos(-midAngle * RADIAN);
    const yInside = cy + radiusInside * Math.sin(-midAngle * RADIAN);
    const xOutside = cx + radiusOutside * Math.cos(-midAngle * RADIAN);
    const yOutside = cy + radiusOutside * Math.sin(-midAngle * RADIAN);

    const percentLabel = `${Math.round(percent * 100)}%`;
    const content =
      labelContent === 'percent'
        ? percentLabel
        : labelContent === 'name'
        ? String(name ?? '')
        : `${String(name ?? '')} ${percentLabel}`;

    const fillColor = explicitLabelColor
      ? explicitLabelColor
      : shouldPlaceInside
      ? getAutoContrastColor(fill, '#FFFFFF')
      : 'var(--foreground)';

    if (shouldPlaceInside) {
      return (
        <text
          x={xInside}
          y={yInside}
          fill={fillColor}
          fontSize={labelFontSize}
          fontWeight={labelFontWeight}
          textAnchor="middle"
          dominantBaseline="central"
        >
          {content}
        </text>
      );
    }

    const isRight = xOutside >= cx;
    return (
      <text
        x={xOutside}
        y={yOutside}
        fill={fillColor}
        fontSize={labelFontSize}
        fontWeight={labelFontWeight}
        textAnchor={isRight ? 'start' : 'end'}
        dominantBaseline="central"
      >
        {content}
      </text>
    );
  };

  return (
    <ChartContainer config={chartConfig} className="my-4 aspect-[4/3]">
      <RechartsPieChart>
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Pie
          data={data}
          dataKey={pieValue.dataKey}
          nameKey={xAxisKey}
          innerRadius="35%"
          outerRadius="75%"
          strokeWidth={5}
          stroke="var(--card)"
          label={renderLabel}
          labelLine={showLabels && showLeaderLines}
        >
          {data.map((_, index) => {
            return (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
              />
            );
          })}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey={xAxisKey} />} />
      </RechartsPieChart>
    </ChartContainer>
  );
};

export default PieChart;
