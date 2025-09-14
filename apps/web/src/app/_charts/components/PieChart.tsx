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
