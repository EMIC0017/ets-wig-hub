function describeArc(cx, cy, radius, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

function polarToCartesian(cx, cy, radius, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

export default function RingArc({ cx, cy, radius, percent, color, strokeWidth, onMouseEnter, onMouseLeave, onClick }) {
  const clampedPercent = Math.min(Math.max(percent, 0), 1);
  const angle = clampedPercent * 359.99;

  return (
    <g className="cursor-pointer" onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <circle
        cx={cx} cy={cy} r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        opacity={0.15}
      />
      {clampedPercent > 0 && (
        <path
          d={describeArc(cx, cy, radius, 0, angle)}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      )}
    </g>
  );
}
