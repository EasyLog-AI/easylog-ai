import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

import ChartContainer from '@/app/_ui/components/Chart/ChartContainer';
import ChartLegend from '@/app/_ui/components/Chart/ChartLegend';
import ChartLegendContent from '@/app/_ui/components/Chart/ChartLegendContent';
import ChartTooltip from '@/app/_ui/components/Chart/ChartTooltip';
import ChartTooltipContent from '@/app/_ui/components/Chart/ChartTooltipContent';
import { ChartConfig } from '@/app/_ui/components/Chart/utils/chartConfig';

import BarChartTick from './BarChartTick';
import { InternalChartConfig } from '../schemas/internalChartConfigSchema';

export interface StackedBarChartProps {
  config: InternalChartConfig;
}

const StackedBarChart = ({ config }: StackedBarChartProps) => {
  const { series, xAxisKey, data } = config;

  const chartConfig = series.reduce((acc, item) => {
    acc[item.dataKey] = {
      label: item.label,
      color: item.color
    };
    return acc;
  }, {} as ChartConfig);

  return (
    <ChartContainer config={chartConfig}>
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey={xAxisKey}
          tickLine={false}
          tickMargin={14}
          axisLine={false}
          tick={(props) => <BarChartTick {...props} />}
          interval={0}
        />
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <ChartLegend verticalAlign="bottom" align="center" content={<ChartLegendContent verticalAlign="bottom" />} />
        {series.map((s, idx, arr) => (
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
