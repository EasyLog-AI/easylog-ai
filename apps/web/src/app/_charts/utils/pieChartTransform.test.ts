import { describe, it, expect } from 'vitest';
import {
  transformPieChartConfig,
  isPieChartConfigValid
} from './pieChartTransform';
import { InternalChartConfig } from '../schemas/internalChartConfigSchema';

describe('pieChartTransform', () => {
  describe('transformPieChartConfig', () => {
    it('should not transform non-pie charts', () => {
      const config: InternalChartConfig = {
        type: 'bar',
        data: [
          { month: 'Jan', sales: 100 },
          { month: 'Feb', sales: 150 }
        ],
        xAxisKey: 'month',
        values: [
          { dataKey: 'sales', label: 'Sales', color: 'var(--color-chart-1)' }
        ]
      };

      const result = transformPieChartConfig(config);
      expect(result).toEqual(config);
    });

    it('should not transform correctly configured pie charts', () => {
      const config: InternalChartConfig = {
        type: 'pie',
        data: [
          { category: 'Type A', value: 180 },
          { category: 'Type B', value: 120 },
          { category: 'Type C', value: 90 }
        ],
        xAxisKey: 'category',
        values: [
          { dataKey: 'value', label: 'Count', color: 'var(--color-chart-1)' }
        ]
      };

      const result = transformPieChartConfig(config);
      expect(result.values).toHaveLength(1);
      expect(result.values[0].dataKey).toBe('value');
      expect(result.data).toEqual(config.data);
    });

    it('should transform pie charts with multiple value entries (common mistake)', () => {
      const config: InternalChartConfig = {
        type: 'pie',
        data: [
          {
            status: 'all',
            positief_count: 10,
            opmerking_count: 5,
            anders_count: 3
          }
        ],
        xAxisKey: 'status',
        values: [
          {
            dataKey: 'positief_count',
            label: 'Positief',
            color: 'var(--color-chart-1)'
          },
          {
            dataKey: 'opmerking_count',
            label: 'Opmerking',
            color: 'var(--color-chart-2)'
          },
          {
            dataKey: 'anders_count',
            label: 'Anders',
            color: 'var(--color-chart-3)'
          }
        ]
      };

      const result = transformPieChartConfig(config);

      // Should have transformed to single dataKey pattern
      expect(result.values).toHaveLength(1);
      expect(result.values[0].dataKey).toBe('value');

      // Should have created separate data entries for each segment
      expect(result.data).toHaveLength(3);
      expect(result.data[0]).toHaveProperty('value', 10);
      expect(result.data[1]).toHaveProperty('value', 5);
      expect(result.data[2]).toHaveProperty('value', 3);
    });

    it('should transform pie charts with multiple numeric fields in data', () => {
      const config: InternalChartConfig = {
        type: 'pie',
        data: [
          { month: 'Jan', sales: 100, costs: 50, profit: 50 },
          { month: 'Feb', sales: 150, costs: 70, profit: 80 }
        ],
        xAxisKey: 'month',
        values: [
          { dataKey: 'value', label: 'Value', color: 'var(--color-chart-1)' }
        ]
      };

      const result = transformPieChartConfig(config);

      // Should have transformed to segments based on numeric fields
      expect(result.values).toHaveLength(1);
      expect(result.values[0].dataKey).toBe('value');

      // Should have created segments for each numeric field
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data.every((item) => 'value' in item)).toBe(true);
    });
  });

  describe('isPieChartConfigValid', () => {
    it('should return true for non-pie charts', () => {
      const config: InternalChartConfig = {
        type: 'line',
        data: [{ x: 1, y: 2 }],
        xAxisKey: 'x',
        values: [{ dataKey: 'y', label: 'Y', color: 'red' }]
      };

      expect(isPieChartConfigValid(config)).toBe(true);
    });

    it('should return true for correctly configured pie charts', () => {
      const config: InternalChartConfig = {
        type: 'pie',
        data: [
          { category: 'A', value: 10 },
          { category: 'B', value: 20 }
        ],
        xAxisKey: 'category',
        values: [{ dataKey: 'value', label: 'Value', color: 'blue' }]
      };

      expect(isPieChartConfigValid(config)).toBe(true);
    });

    it('should return false for pie charts with multiple value entries', () => {
      const config: InternalChartConfig = {
        type: 'pie',
        data: [{ x: 'all', a: 10, b: 20 }],
        xAxisKey: 'x',
        values: [
          { dataKey: 'a', label: 'A', color: 'red' },
          { dataKey: 'b', label: 'B', color: 'blue' }
        ]
      };

      expect(isPieChartConfigValid(config)).toBe(false);
    });

    it('should return false if data points are missing the dataKey', () => {
      const config: InternalChartConfig = {
        type: 'pie',
        data: [
          { category: 'A', count: 10 },
          { category: 'B', total: 20 } // Different key
        ],
        xAxisKey: 'category',
        values: [{ dataKey: 'value', label: 'Value', color: 'green' }]
      };

      expect(isPieChartConfigValid(config)).toBe(false);
    });
  });
});
