import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { StackedBarChartConfig } from '@/app/_chats/tools/charts/schemas';
import ChartContainer from '@/app/_ui/components/Chart/ChartContainer';
import ChartLegend from '@/app/_ui/components/Chart/ChartLegend';
import ChartLegendContent from '@/app/_ui/components/Chart/ChartLegendContent';
import ChartTooltip from '@/app/_ui/components/Chart/ChartTooltip';
import ChartTooltipContent from '@/app/_ui/components/Chart/ChartTooltipContent';
import { ChartConfig } from '@/app/_ui/components/Chart/utils/chartConfig';

export interface StackedBarChartProps {
  config: StackedBarChartConfig;
}

const StackedBarChart = ({ config }: StackedBarChartProps) => {
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
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="category"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => String(value).slice(0, 10)}
        />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <ChartLegend content={<ChartLegendContent />} />
        {series.map((s, index: number, arr) => (
          <Bar
            key={`series_${index}`}
            dataKey={`series_${index}`}
            stackId="a"
            fill={s.color || availableColors[index % availableColors.length]}
            radius={
              index === 0
                ? [0, 0, 4, 4]
                : index === arr.length - 1
                  ? [4, 4, 0, 0]
                  : [0, 0, 0, 0]
            }
          />
        ))}
      </BarChart>
    </ChartContainer>
  );
};

export default StackedBarChart;
