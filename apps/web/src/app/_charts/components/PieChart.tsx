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
  const { series, xAxisKey, data } = config;

  // For pie charts, if we only have one series, we need to generate colors for each data point
  const availableColors = [
    'var(--color-chart-1)',
    'var(--color-chart-2)', 
    'var(--color-chart-3)',
    'var(--color-chart-4)',
    'var(--color-chart-5)'
  ];

  // Generate colors for each data point if only one series is provided
  const colors = series.length === 1 && data.length > 1 
    ? data.map((_, index) => availableColors[index % availableColors.length])
    : series.map((s) => s.color);

  /** Build legend config per category to ensure correct label-color mapping per segment */
  const chartConfig = data.reduce((acc, row, index) => {
    const record = row as Record<string, string | number>;
    const categoryKey = String(record[xAxisKey]);
    acc[categoryKey] = {
      label: categoryKey,
      color: colors[index % colors.length]
    };
    return acc;
  }, {} as ChartConfig);

  /** Assuming the first series is the one to display in the pie chart */
  const pieSeries = series[0];

  return (
    <ChartContainer config={chartConfig} className="aspect-[4/3] my-4">
      <RechartsPieChart>
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Pie
          data={data}
          dataKey={pieSeries.dataKey}
          nameKey={xAxisKey}
          innerRadius="35%"
          outerRadius="75%"
          strokeWidth={5}
          stroke="var(--card)"
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