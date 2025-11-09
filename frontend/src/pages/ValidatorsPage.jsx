import React, { useState, useEffect } from 'react';
import { getLeaderboard } from '../services/api';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Avatar,
  LinearProgress
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import VerifiedIcon from '@mui/icons-material/Verified';
import StarIcon from '@mui/icons-material/Star';
import { ethers } from 'ethers';

const ValidatorsPage = () => {
  const [validators, setValidators] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    try {
      const data = await getLeaderboard(20);
      setValidators(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankColor = (rank) => {
    if (rank === 1) return 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)'; // Gold
    if (rank === 2) return 'linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%)'; // Silver
    if (rank === 3) return 'linear-gradient(135deg, #cd7f32 0%, #e8a87c 100%)'; // Bronze
    return 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)';
  };

  const getRankIcon = (rank) => {
    if (rank <= 3) {
      return (
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: getRankColor(rank),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '1.2rem',
            color: rank <= 2 ? '#000' : '#fff',
          }}
        >
          {rank}
        </Box>
      );
    }
    return (
      <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.secondary' }}>
        #{rank}
      </Typography>
    );
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {[...Array(5)].map((_, index) => (
          <StarIcon
            key={index}
            sx={{
              fontSize: 20,
              color: index < fullStars ? '#fbbf24' :
                     index === fullStars && hasHalfStar ? '#fbbf24' :
                     '#4b5563',
            }}
          />
        ))}
        <Typography variant="body2" sx={{ ml: 0.5, fontWeight: 600, color: 'text.secondary' }}>
          {rating.toFixed(1)}
        </Typography>
      </Box>
    );
  };

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          mb: 5,
          p: 4,
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
          borderRadius: 3,
          border: '1px solid rgba(99, 102, 241, 0.2)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(40px)',
          }}
        />
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <EmojiEventsIcon sx={{ color: 'primary.light', fontSize: 32 }} />
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Validator Leaderboard
            </Typography>
          </Box>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 700 }}>
            Top validators ranked by accuracy, stake amount, and community trust
          </Typography>
        </Box>
      </Box>

      {/* Leaderboard */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress size={60} />
            </Box>
          ) : validators.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                No validators found
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>Rank</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>Validator</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>Rating</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>Accuracy</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>Total Votes</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>Stake</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {validators.map((validator, index) => (
                    <TableRow
                      key={validator.address}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'rgba(99, 102, 241, 0.05)',
                        },
                      }}
                    >
                      <TableCell>
                        {getRankIcon(index + 1)}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            sx={{
                              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                              width: 48,
                              height: 48,
                            }}
                          >
                            {validator.address.substring(2, 4).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {validator.address.substring(0, 10)}...{validator.address.substring(38)}
                              </Typography>
                              {validator.verified && (
                                <Chip
                                  icon={<VerifiedIcon fontSize="small" />}
                                  label="Verified"
                                  size="small"
                                  sx={{
                                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(52, 211, 153, 0.2) 100%)',
                                    color: '#34d399',
                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                    fontWeight: 600,
                                    '& .MuiChip-icon': {
                                      color: '#10b981',
                                    },
                                  }}
                                />
                              )}
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              Member since {new Date(validator.joinedDate).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {renderStars(validator.rating || 0)}
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {validator.accuracy.toFixed(1)}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={validator.accuracy}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: 'rgba(99, 102, 241, 0.1)',
                              '& .MuiLinearProgress-bar': {
                                background: validator.accuracy >= 90
                                  ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
                                  : validator.accuracy >= 70
                                  ? 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)'
                                  : 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)',
                              },
                            }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {validator.correctVotes}/{validator.totalVotes} correct
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {validator.totalVotes}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {parseFloat(ethers.formatEther(validator.totalStake)).toFixed(0)} NEWS
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ValidatorsPage;
