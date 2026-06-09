import React from 'react';

const buildPoints = (data, width, height, padding) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  return data.map((value, index) => ({
    x: padding.left + (index / (data.length - 1)) * innerWidth,
    y: padding.top + (1 - (value - min) / range) * innerHeight,
    value
  }));
};

const formatAxisValue = (value) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }

  if (value >= 1000) {
    return `${Math.round(value / 1000)}K`;
  }

  return String(Math.round(value));
};

const AdminAreaChart = ({
  data,
  labels = [],
  chartId,
  trend = 'up',
  formatValue = formatAxisValue,
  emptyLabel = 'Not enough data to display chart.'
}) => {
  if (!Array.isArray(data) || data.length < 2) {
    return <p className="admin-inventory-empty">{emptyLabel}</p>;
  }

  const width = 360;
  const height = 180;
  const padding = { top: 12, right: 12, bottom: 28, left: 36 };
  const points = buildPoints(data, width, height, padding);
  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;
  const strokeColor = trend === 'up' ? '#C9A86A' : '#c62828';
  const gradientId = `admin-area-${chartId}`;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const mid = min + (max - min) / 2;
  const gridValues = [max, mid, min];

  return (
    <div className="admin-area-chart">
      <svg className="admin-area-chart-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.28" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.03" />
          </linearGradient>
        </defs>

        {gridValues.map((value) => {
          const y =
            padding.top +
            (1 - (value - min) / (max - min || 1)) * (height - padding.top - padding.bottom);

          return (
            <g key={value}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                className="admin-area-chart-grid"
              />
              <text x={padding.left - 6} y={y + 3} className="admin-area-chart-axis-y" textAnchor="end">
                {formatValue(value)}
              </text>
            </g>
          );
        })}

        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path
          d={linePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        {points.map((point, index) => (
          <circle
            key={`${chartId}-point-${index}`}
            cx={point.x}
            cy={point.y}
            r="2.5"
            fill={strokeColor}
            className="admin-area-chart-dot"
          />
        ))}

        {labels.map((label, index) => {
          if (!label) {
            return null;
          }

          const x =
            padding.left +
            (index / Math.max(labels.length - 1, 1)) * (width - padding.left - padding.right);

          return (
            <text key={`${label}-${index}`} x={x} y={height - 8} className="admin-area-chart-axis-x" textAnchor="middle">
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

export default AdminAreaChart;
