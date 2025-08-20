export interface BarChartTickProps {
  x: number;
  y: number;
  payload: { value: string };
}

const BarChartTick = ({ x, y, payload }: BarChartTickProps) => {
  const label = payload.value ?? '';
  const shouldRotate = label.length >= 10;

  return (
    <g transform={`translate(${x},${y})`}>
      {shouldRotate ? (
        <text dy={12} textAnchor="end" transform="rotate(-35)">
          {label}
        </text>
      ) : (
        <text dy={16} textAnchor="middle">
          {label}
        </text>
      )}
    </g>
  );
};

export default BarChartTick;


