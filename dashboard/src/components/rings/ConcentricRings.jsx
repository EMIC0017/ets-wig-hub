import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RingArc from './RingArc';
import RingTooltip from './RingTooltip';

const SIZE = 320;
const CX = SIZE / 2;
const CY = SIZE / 2;
const STROKE = 18;
const GAP = 6;
const OUTER_RADIUS = 140;

export default function ConcentricRings({ dashboardData }) {
  const navigate = useNavigate();
  const [tooltip, setTooltip] = useState({ visible: false, team: null, score: '', x: 0, y: 0 });

  const onTrack = dashboardData.filter(d => {
    if (d.wig.targetType === 'percent') {
      const val = parseFloat(d.score) || 0;
      return val >= 0.5;
    }
    return d.score && d.score !== '';
  }).length;

  return (
    <div className="relative inline-block">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {dashboardData.map((d, i) => {
          const radius = OUTER_RADIUS - i * (STROKE + GAP);
          let percent = 0;
          if (d.wig.targetType === 'percent') {
            percent = parseFloat(d.score) || 0;
          } else {
            percent = d.score ? 0.5 : 0;
          }

          return (
            <RingArc
              key={d.wig.wig}
              cx={CX}
              cy={CY}
              radius={radius}
              percent={percent}
              color={d.wig.color}
              strokeWidth={STROKE}
              onClick={() => navigate(`/wig/${d.wig.wig}`)}
              onMouseEnter={(e) =>
                setTooltip({ visible: true, team: d.wig, score: d.score, x: e.clientX, y: e.clientY })
              }
              onMouseLeave={() => setTooltip({ visible: false, team: null, score: '', x: 0, y: 0 })}
            />
          );
        })}
        <text x={CX} y={CY - 6} textAnchor="middle" className="fill-gray-100 text-2xl font-bold">
          {onTrack}/6
        </text>
        <text x={CX} y={CY + 14} textAnchor="middle" className="fill-gray-500 text-xs">
          on track
        </text>
      </svg>
      <RingTooltip {...tooltip} />
    </div>
  );
}
