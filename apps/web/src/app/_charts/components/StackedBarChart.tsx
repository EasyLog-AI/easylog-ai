import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import ChartContainer from '@/app/_ui/components/Chart/ChartContainer';
import ChartLegend from '@/app/_ui/components/Chart/ChartLegend';
import ChartLegendContent from '@/app/_ui/components/Chart/ChartLegendContent';
import ChartTooltip from '@/app/_ui/components/Chart/ChartTooltip';
import ChartTooltipContent from '@/app/_ui/components/Chart/ChartTooltipContent';
import { ChartConfig } from '@/app/_ui/components/Chart/utils/chartConfig';

import { InternalChartConfig } from '../schemas/internalChartConfigSchema';

export interface StackedBarChartProps {
  config: InternalChartConfig;
}

const StackedBarChart = ({ config }: StackedBarChartProps) => {
  const { values, xAxisKey, data } = config;

  const chartConfig = values.reduce((acc, item) => {
    acc[item.dataKey] = {
      label: item.label,
      color: item.color
    };
    return acc;
  }, {} as ChartConfig);

  return (
    <ChartContainer config={chartConfig} className="aspect-[4/3] my-4">
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey={xAxisKey}
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => String(value).slice(0, 10)}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <ChartLegend content={<ChartLegendContent />} />
        {values.map((s, idx, arr) => (
          <Bar
            key={s.dataKey}
            dataKey={s.dataKey}
            stackId="a"
            fill={s.color}
            radius={
              idx === 0
                ? [0, 0, 4, 4]
                : idx === arr.length - 1
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
