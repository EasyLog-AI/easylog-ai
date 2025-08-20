export interface BarChartTickProps {
  x: number;
  y: number;
  payload: { value: string };
}

const BarChartTick = ({ x, y, payload }: BarChartTickProps) => (
  <g transform={`translate(${x},${y})`}>
    <text dy={12} textAnchor="end" transform="rotate(-35)">
      {payload.value}
    </text>
  </g>
);

export default BarChartTick;


