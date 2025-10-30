import { Cell, Pie, PieChart as RechartsPieChart } from 'recharts';

import { PieChartConfig } from '@/app/_chats/tools/charts/schemas';
import ChartContainer from '@/app/_ui/components/Chart/ChartContainer';
import ChartLegend from '@/app/_ui/components/Chart/ChartLegend';
import ChartLegendContent from '@/app/_ui/components/Chart/ChartLegendContent';
import ChartTooltip from '@/app/_ui/components/Chart/ChartTooltip';
import ChartTooltipContent from '@/app/_ui/components/Chart/ChartTooltipContent';
import { ChartConfig } from '@/app/_ui/components/Chart/utils/chartConfig';

export interface PieChartProps {
  config: PieChartConfig;
}

const PieChart = ({ config }: PieChartProps) => {
  const { segments } = config;

  const availableColors = [
    'var(--color-chart-1)',
    'var(--color-chart-2)',
    'var(--color-chart-3)',
    'var(--color-chart-4)',
    'var(--color-chart-5)'
  ];

  // Assign colors to segments
  const colors = segments.map(
    (segment, index) =>
      segment.color || availableColors[index % availableColors.length]
  );

  // Build chart config for legend
  const chartConfig = segments.reduce((acc, segment, index) => {
    acc[segment.label] = {
      label: segment.label,
      color: colors[index]
    };
    return acc;
  }, {} as ChartConfig);

  function getAutoContrastColor(
    hexOrCss: string | undefined,
    fallback: string
  ): string {
    if (!hexOrCss) return fallback;
    if (hexOrCss.startsWith('var(')) {
      return fallback;
    }
    if (hexOrCss.startsWith('#')) {
      const hex = hexOrCss.replace('#', '');
      const bigint = parseInt(
        hex.length === 3
          ? hex
              .split('')
              .map((c) => c + c)
              .join('')
          : hex,
        16
      );
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
    fill?: string;
  };

  const renderPercentLabel = (props: LabelProps) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent, fill } = props;

    const RADIAN = Math.PI / 180;
    const radiusInside = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radiusInside * Math.cos(-midAngle * RADIAN);
    const y = cy + radiusInside * Math.sin(-midAngle * RADIAN);

    const percentLabel = `${Math.round(percent * 100)}%`;
    const fillColor = getAutoContrastColor(fill, '#FFFFFF');

    return (
      <text
        x={x}
        y={y}
        fill={fillColor}
        fontSize={12}
        fontWeight={600}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {percentLabel}
      </text>
    );
  };

  return (
    <ChartContainer config={chartConfig} className="my-4 aspect-[4/3]">
      <RechartsPieChart>
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Pie
          data={segments}
          dataKey="value"
          nameKey="label"
          innerRadius="35%"
          outerRadius="75%"
          strokeWidth={5}
          stroke="var(--card)"
          label={renderPercentLabel}
          labelLine={false}
        >
          {segments.map((_, index) => (
            <Cell key={`cell-${index}`} fill={colors[index]} />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="label" />} />
      </RechartsPieChart>
    </ChartContainer>
  );
};

export default PieChart;
