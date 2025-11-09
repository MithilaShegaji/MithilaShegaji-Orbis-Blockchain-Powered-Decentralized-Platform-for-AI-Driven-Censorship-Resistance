import React from 'react';
import { Box, Typography, Paper, LinearProgress, Chip } from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip as RechartsTooltip
} from 'recharts';
import {
  ThumbUp as ApproveIcon,
  ThumbDown as RejectIcon,
  HowToVote as VoteIcon
} from '@mui/icons-material';

const VoteDistributionChart = ({ article }) => {
  // Safety check
  if (!article) {
    return null;
  }

  const yesVotes = parseInt(article?.yesVotes || 0);
  const noVotes = parseInt(article?.noVotes || 0);
  const totalVotes = yesVotes + noVotes;

  const yesPercentage = totalVotes > 0 ? ((yesVotes / totalVotes) * 100).toFixed(1) : 0;
  const noPercentage = totalVotes > 0 ? ((noVotes / totalVotes) * 100).toFixed(1) : 0;

  const consensusRequired = 75; // 75% consensus required
  const minimumVotes = 3;
  const hasConsensus = yesPercentage >= consensusRequired && totalVotes >= minimumVotes;

  const data = [
    { name: 'Approve', value: yesVotes, color: '#10b981', icon: '✓' },
    { name: 'Reject', value: noVotes, color: '#ef4444', icon: '✗' }
  ];

  // Custom label for pie chart
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

    if (percent === 0) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        style={{ fontSize: '14px', fontWeight: 600 }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <Paper
          sx={{
            p: 1.5,
            backgroundColor: 'rgba(26, 32, 44, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
            {payload[0].name}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            {payload[0].value} vote{payload[0].value !== 1 ? 's' : ''} ({payload[0].payload.percent}%)
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  if (totalVotes === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          background: 'linear-gradient(135deg, rgba(26, 32, 44, 0.95) 0%, rgba(45, 55, 72, 0.95) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 3,
          textAlign: 'center'
        }}
      >
        <VoteIcon sx={{ fontSize: 48, color: 'rgba(255, 255, 255, 0.3)', mb: 2 }} />
        <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
          No Votes Yet
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          Waiting for validators to review this article
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Chip
            label={`Minimum ${minimumVotes} votes required`}
            size="small"
            sx={{
              backgroundColor: 'rgba(99, 102, 241, 0.2)',
              color: '#c7d2fe',
              fontWeight: 500
            }}
          />
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        background: 'linear-gradient(135deg, rgba(26, 32, 44, 0.95) 0%, rgba(45, 55, 72, 0.95) 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 3
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
            Validator Voting
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            {totalVotes} total vote{totalVotes !== 1 ? 's' : ''} received
          </Typography>
        </Box>
        {hasConsensus ? (
          <Chip
            icon={<ApproveIcon />}
            label="Consensus Reached"
            color="success"
            sx={{ fontWeight: 600 }}
          />
        ) : (
          <Chip
            label={`${consensusRequired}% needed`}
            color="warning"
            sx={{ fontWeight: 600 }}
          />
        )}
      </Box>

      {/* Pie Chart */}
      <Box sx={{ height: 250, mb: 3 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.filter(d => d.value > 0)}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <RechartsTooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </Box>

      {/* Vote Breakdown */}
      <Box sx={{ mb: 2 }}>
        {/* Approve Votes */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ApproveIcon sx={{ color: '#10b981', fontSize: 20 }} />
              <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                Approve
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 600 }}>
                {yesVotes} vote{yesVotes !== 1 ? 's' : ''}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', minWidth: 50, textAlign: 'right' }}>
                {yesPercentage}%
              </Typography>
            </Box>
          </Box>
          <LinearProgress
            variant="determinate"
            value={parseFloat(yesPercentage)}
            sx={{
              height: 8,
              borderRadius: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 1,
                background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
              }
            }}
          />
        </Box>

        {/* Reject Votes */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <RejectIcon sx={{ color: '#ef4444', fontSize: 20 }} />
              <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                Reject
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ color: '#ef4444', fontWeight: 600 }}>
                {noVotes} vote{noVotes !== 1 ? 's' : ''}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', minWidth: 50, textAlign: 'right' }}>
                {noPercentage}%
              </Typography>
            </Box>
          </Box>
          <LinearProgress
            variant="determinate"
            value={parseFloat(noPercentage)}
            sx={{
              height: 8,
              borderRadius: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 1,
                background: 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
              }
            }}
          />
        </Box>
      </Box>

      {/* Consensus Status */}
      <Box
        sx={{
          mt: 3,
          p: 2,
          backgroundColor: hasConsensus
            ? 'rgba(16, 185, 129, 0.1)'
            : totalVotes < minimumVotes
            ? 'rgba(245, 158, 11, 0.1)'
            : 'rgba(99, 102, 241, 0.1)',
          border: '1px solid',
          borderColor: hasConsensus
            ? 'rgba(16, 185, 129, 0.3)'
            : totalVotes < minimumVotes
            ? 'rgba(245, 158, 11, 0.3)'
            : 'rgba(99, 102, 241, 0.3)',
          borderRadius: 2
        }}
      >
        <Typography variant="body2" sx={{ color: 'white', fontWeight: 500, mb: 1 }}>
          {hasConsensus
            ? `✓ Consensus achieved (${yesPercentage}% approval)`
            : totalVotes < minimumVotes
            ? `⏳ Waiting for minimum ${minimumVotes} votes (${minimumVotes - totalVotes} more needed)`
            : `⏳ ${yesPercentage}% approval - need ${consensusRequired}% for consensus`
          }
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          {hasConsensus
            ? 'Article meets validator consensus requirements'
            : 'Validators continue to review and vote on this article'
          }
        </Typography>
      </Box>
    </Paper>
  );
};

export default VoteDistributionChart;
