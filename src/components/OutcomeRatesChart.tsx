import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { ScanResult } from '@/types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface OutcomeRatesChartProps {
  scanResult: ScanResult;
  type: 'outcome' | 'representation';
}

export function OutcomeRatesChart({ scanResult, type }: OutcomeRatesChartProps) {
  // Get all unique groups
  const groups: { label: string; passed: boolean; outcomeRate: number; count: number }[] = [];
  
  for (const s of scanResult.slices) {
    const passed = s.worstMetric.passed;
    const existing = groups.find(g => g.label === s.groupLabel);
    if (!existing) {
      groups.push({
        label: s.groupLabel,
        passed,
        outcomeRate: s.groupStats.positiveRate,
        count: s.groupStats.count
      });
    } else {
      if (!passed) existing.passed = false; // if it fails in any slice, mark it as failed
    }
  }

  // overall positive rate
  const overallPositiveRate = scanResult.slices[0] 
    ? scanResult.slices[0].groupStats.positiveRate + (scanResult.slices[0].worstMetric.metricName === 'label_skew' ? scanResult.slices[0].worstMetric.value : 0) // rough approx if we didn't save overall
    : 0.5;

  const getBrandColor = () => getComputedStyle(document.documentElement).getPropertyValue('--brand').trim() || '#3b82f6';
  const getCriticalColor = () => getComputedStyle(document.documentElement).getPropertyValue('--critical').trim() || '#ef4444';
  const getHighColor = () => getComputedStyle(document.documentElement).getPropertyValue('--high').trim() || '#f97316';
  const getTextColor = () => getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#9ca3af';

  const data = {
    labels: groups.map(g => g.label),
    datasets: [
      {
        label: type === 'outcome' ? 'Positive Outcome Rate' : 'Representation Count',
        data: groups.map(g => type === 'outcome' ? g.outcomeRate * 100 : g.count),
        backgroundColor: groups.map(g => g.passed ? getBrandColor() : getCriticalColor()),
        borderRadius: 4,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            if (type === 'outcome') {
              return `${context.raw.toFixed(1)}%`;
            }
            return `${context.raw} rows`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: getTextColor(),
          callback: (val: any) => type === 'outcome' ? `${val}%` : val
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.05)'
        }
      },
      x: {
        ticks: {
          color: getTextColor(),
          maxRotation: 45,
          minRotation: 45
        },
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div className="relative h-[280px] rounded-xl border border-border bg-surface-2 p-4">
      <div className="mb-3 text-[12px] text-text-secondary">
        {type === 'outcome' ? 'Positive Outcome Rate by Group' : 'Group Representation'}
      </div>
      <div className="h-[210px]">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
