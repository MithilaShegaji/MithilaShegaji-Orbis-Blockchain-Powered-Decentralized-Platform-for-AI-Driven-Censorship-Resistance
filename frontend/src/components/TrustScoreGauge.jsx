import React from 'react';
import { Box, Typography } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const TrustScoreGauge = ({ score, size = 'medium', showLabel = true }) => {
  // Size configurations
  const sizeConfig = {
    small: { width: 80, height: 80, innerRadius: 20, outerRadius: 35, fontSize: 16 },
    medium: { width: 120, height: 120, innerRadius: 35, outerRadius: 55, fontSize: 24 },
    large: { width: 180, height: 180, innerRadius: 55, outerRadius: 85, fontSize: 32 }
  };

  const config = sizeConfig[size] || sizeConfig.medium;

  // Normalize score - handle string values from API
  const normalizedScore = Math.min(Math.max(Number(score) || 0, 0), 100);

  // Determine color based on score
  const getScoreColor = () => {
    if (normalizedScore >= 80) return '#10b981'; // Green
    if (normalizedScore >= 50) return '#f59e0b'; // Amber/Orange
    return '#ef4444'; // Red
  };

  const getScoreGradient = () => {
    if (normalizedScore >= 80) return ['#10b981', '#059669']; // Green gradient
    if (normalizedScore >= 50) return ['#f59e0b', '#d97706']; // Amber gradient
    return ['#ef4444', '#dc2626']; // Red gradient
  };

  const getScoreLabel = () => {
    if (normalizedScore >= 80) return 'High Trust';
    if (normalizedScore >= 50) return 'Medium Trust';
    return 'Low Trust';
  };

  const scoreColor = getScoreColor();
  const [gradientStart, gradientEnd] = getScoreGradient();

  // Data for the gauge (filled portion and empty portion)
  const data = [
    { name: 'score', value: normalizedScore },
    { name: 'remaining', value: 100 - normalizedScore }
  ];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Box sx={{ position: 'relative', width: config.width, height: config.height }}>
        {/* Gradient Definition */}
        <svg width={0} height={0}>
          <defs>
            <linearGradient id={`gaugeGradient-${normalizedScore}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradientStart} />
              <stop offset="100%" stopColor={gradientEnd} />
            </linearGradient>
          </defs>
        </svg>

        {/* Recharts Gauge */}
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              startAngle={180}
              endAngle={0}
              innerRadius={config.innerRadius}
              outerRadius={config.outerRadius}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
            >
              <Cell fill={`url(#gaugeGradient-${normalizedScore})`} />
              <Cell fill="rgba(255, 255, 255, 0.1)" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Score Display */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -35%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: scoreColor,
              fontSize: config.fontSize,
              lineHeight: 1,
              textShadow: `0 0 20px ${scoreColor}40`
            }}
          >
            {normalizedScore}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: config.fontSize * 0.3,
              fontWeight: 500,
              mt: 0.5
            }}
          >
            %
          </Typography>
        </Box>
      </Box>

      {/* Label */}
      {showLabel && (
        <Box sx={{ textAlign: 'center', mt: 1 }}>
          <Typography
            variant="body2"
            sx={{
              color: scoreColor,
              fontWeight: 600,
              fontSize: size === 'small' ? '0.75rem' : size === 'large' ? '1rem' : '0.875rem'
            }}
          >
            {getScoreLabel()}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: size === 'small' ? '0.65rem' : '0.75rem'
            }}
          >
            AI Trust Score
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default TrustScoreGauge;
