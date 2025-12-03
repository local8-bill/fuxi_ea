// /lib/telemetry.ts

export async function recordTelemetry(eventType, payload = {}) {
  try {
    await fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType,
        timestamp: new Date().toISOString(),
        payload,
      }),
    });
  } catch (err) {
    console.warn('Telemetry failed:', err);
  }
}

// /pages/api/roi/forecast.ts

export async function GET(req) {
  const url = new URL(req.url);
  const project = url.searchParams.get('project') || 'demo';

  // Mock forecast data structure
  const timeline = [
    { month: 0, cost: 100, benefit: 0 },
    { month: 3, cost: 400, benefit: 200 },
    { month: 6, cost: 800, benefit: 650 },
    { month: 9, cost: 1200, benefit: 1300 },
    { month: 12, cost: 1500, benefit: 2100 },
  ];

  const events = [
    {
      id: 'evt-1',
      timestamp: '2025-04-01',
      month: 3,
      type: 'system_deployed',
      title: 'CRM Revamp Launch',
      detail: 'Improved engagement metrics; early ROI observed.',
      severity: 'info',
    },
    {
      id: 'evt-2',
      timestamp: '2025-07-01',
      month: 6,
      type: 'integration_retired',
      title: 'Legacy API Sunset',
      detail: 'Reduced maintenance overhead by 18%.',
      severity: 'success',
    },
    {
      id: 'evt-3',
      timestamp: '2025-12-01',
      month: 12,
      type: 'benefit_realized',
      title: 'Full Modernization ROI Reached',
      detail: 'Annualized benefit exceeds cumulative cost.',
      severity: 'highlight',
    },
  ];

  const predictions = { breakEvenMonth: 10, roiFinal: 1.35 };

  return Response.json({ project, timeline, events, predictions });
}

// /components/roi/ROIDashboard.tsx
import { recordTelemetry } from '@/lib/telemetry';

export default function ROIDashboard() {
  const [size, setSize] = useState('M');
  const [dependencyLevel, setDependencyLevel] = useState(4);
  const [dualRun, setDualRun] = useState(false);
  const [duration, setDuration] = useState(12);
  const [data, setData] = useState([]);

  const handleCalculate = () => {
    const costBase = size === 'S' ? 100 : size === 'M' ? 300 : size === 'L' ? 800 : 1500;
    const integrationCost = dependencyLevel * 15;
    const dualPenalty = dualRun ? costBase * 0.2 : 0;
    const totalCost = costBase + integrationCost + dualPenalty;

    const benefits = Array.from({ length: duration / 3 }, (_, i) => {
      const month = (i + 1) * 3;
      const cost = (totalCost / duration) * month;
      const benefit = Math.min(cost * 0.9 + i * 50, totalCost * 1.1);
      return { month, cost, benefit };
    });

    setData(benefits);
    recordTelemetry('roi_model_generated', { size, dependencyLevel, dualRun, duration, totalCost });

    const breakEven = benefits.find((d) => d.benefit > d.cost);
    if (breakEven) {
      recordTelemetry('roi_break_even_reached', { breakEvenMonth: breakEven.month });
    }
  };

  return (
    <div className="grid grid-cols-3 gap-4 p-6">
      {/* Input and Chart Panels remain identical to the D051 version */}
    </div>
  );
}
