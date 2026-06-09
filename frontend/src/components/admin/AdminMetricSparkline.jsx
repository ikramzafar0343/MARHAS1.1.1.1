import React from 'react';

const buildPoints = (data, width, height, padding) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  return data.map((value, index) => ({
    x: padding + (index / (data.length - 1)) * innerWidth,
    y: padding + (1 - (value - min) / range) * innerHeight
  }));
};

const AdminMetricSparkline = ({ data, trend = 'up', chartId }) => {
  if (!Array.isArray(data) || data.length < 2) {
    return null;
  }

  const width = 120;
  const height = 32;
  const padding = 2;
  const points = buildPoints(data, width, height, padding);
  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
  const strokeColor = trend === 'up' ? '#C9A86A' : '#c62828';
  const gradientId = `admin-spark-${chartId}`;

  return (
    <svg
      className="admin-metric-spark"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.32" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};

export default AdminMetricSparkline;
