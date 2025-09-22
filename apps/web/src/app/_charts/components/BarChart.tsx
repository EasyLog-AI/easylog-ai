import {
  Bar,
  CartesianGrid,
  BarChart as RechartsBarChart,
  XAxis,
  YAxis
} from 'recharts';

import { BarChartConfig } from '@/app/_chats/tools/charts/schemas';
import ChartContainer from '@/app/_ui/components/Chart/ChartContainer';
import ChartLegend from '@/app/_ui/components/Chart/ChartLegend';
import ChartLegendContent from '@/app/_ui/components/Chart/ChartLegendContent';
import ChartTooltip from '@/app/_ui/components/Chart/ChartTooltip';
import ChartTooltipContent from '@/app/_ui/components/Chart/ChartTooltipContent';
import { ChartConfig } from '@/app/_ui/components/Chart/utils/chartConfig';

export interface BarChartProps {
  config: BarChartConfig;
}

const BarChart = ({ config }: BarChartProps) => {
  const { categories, series } = config;

  const availableColors = [
    'var(--color-chart-1)',
    'var(--color-chart-2)',
    'var(--color-chart-3)',
    'var(--color-chart-4)',
    'var(--color-chart-5)'
  ];

  // Transform simplified format to chart data
  const data = categories.map((category, categoryIndex) => {
    const dataObj: Record<string, string | number> = { category };
    series.forEach((s, seriesIndex) => {
      dataObj[`series_${seriesIndex}`] = s.data[categoryIndex] || 0;
    });
    return dataObj;
  });

  // Create chart config for legend
  const chartConfig = series.reduce((acc, s, index) => {
    acc[`series_${index}`] = {
      label: s.name,
      color: s.color || availableColors[index % availableColors.length]
    };
    return acc;
  }, {} as ChartConfig);

  return (
    <ChartContainer config={chartConfig} className="my-4 aspect-[4/3]">
      <RechartsBarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="category"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => String(value).slice(0, 10)}
          interval={0}
        />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <ChartLegend content={<ChartLegendContent />} />
        {series.map((s, index) => (
          <Bar
            key={`series_${index}`}
            dataKey={`series_${index}`}
            fill={s.color || availableColors[index % availableColors.length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </RechartsBarChart>
    </ChartContainer>
  );
};

export default BarChart;
