import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  XAxis,
  YAxis
} from 'recharts';

import { LineChartConfig } from '@/app/_chats/tools/charts/schemas';
import ChartContainer from '@/app/_ui/components/Chart/ChartContainer';
import ChartLegend from '@/app/_ui/components/Chart/ChartLegend';
import ChartLegendContent from '@/app/_ui/components/Chart/ChartLegendContent';
import ChartTooltip from '@/app/_ui/components/Chart/ChartTooltip';
import ChartTooltipContent from '@/app/_ui/components/Chart/ChartTooltipContent';
import { ChartConfig } from '@/app/_ui/components/Chart/utils/chartConfig';

import { createDynamicTickFormatter } from '../utils/createDynamicTickFormatter';

export interface LineChartProps {
  config: LineChartConfig;
}

const LineChart = ({ config }: LineChartProps) => {
  const { categories, series } = config;

  const availableColors = [
    'var(--color-chart-1)',
    'var(--color-chart-2)',
    'var(--color-chart-3)',
    'var(--color-chart-4)',
    'var(--color-chart-5)'
  ];

  // Transform simplified format to chart data
  const data = categories.map((category: string, categoryIndex: number) => {
    const dataObj: Record<string, string | number> = { category };
    series.forEach((s, seriesIndex: number) => {
      dataObj[`series_${seriesIndex}`] = s.data[categoryIndex] || 0;
    });
    return dataObj;
  });

  // Create chart config for legend
  const chartConfig = series.reduce((acc, s, index: number) => {
    acc[`series_${index}`] = {
      label: s.name,
      color: s.color || availableColors[index % availableColors.length]
    };
    return acc;
  }, {} as ChartConfig);

  return (
    <ChartContainer config={chartConfig} className="my-4 aspect-[4/3]">
      <RechartsLineChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="category"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={createDynamicTickFormatter(categories)}
        />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <ChartLegend content={<ChartLegendContent />} />
        {series.map((s, index: number) => (
          <Line
            key={`series_${index}`}
            dataKey={`series_${index}`}
            stroke={s.color || availableColors[index % availableColors.length]}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </RechartsLineChart>
    </ChartContainer>
  );
};

export default LineChart;
