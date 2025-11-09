
import React, { useState, useEffect } from 'react';
import StakingForm from '../components/StakingForm';
import { useAppContext } from '../contexts/AppContext';
import { getValidatorStats } from '../services/api';
import { Box, Typography, Card, CardContent, Grid, Chip, LinearProgress, Alert } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VerifiedIcon from '@mui/icons-material/Verified';
import { ethers } from 'ethers';

const DashboardPage = () => {
  const { account } = useAppContext();
  const [validatorStats, setValidatorStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (account) {
      loadValidatorStats();
    }
  }, [account]);

  const loadValidatorStats = async () => {
    setIsLoading(true);
    try {
      const stats = await getValidatorStats(account);
      setValidatorStats(stats);
    } catch (error) {
      console.error('Error loading validator stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {[...Array(5)].map((_, index) => (
          <StarIcon
            key={index}
            sx={{
              fontSize: 32,
              color: index < fullStars ? '#fbbf24' : '#4b5563',
            }}
          />
        ))}
        <Typography variant="h4" sx={{ ml: 1, fontWeight: 700, color: 'text.primary' }}>
          {rating.toFixed(1)}
        </Typography>
      </Box>
    );
  };

  return (
    <Box>
      {/* Validator Stats Section */}
      {account && validatorStats && (
        <Box sx={{ mb: 4 }}>
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                mb: 1,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Your Validator Profile
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Track your performance, rating, and earnings as a validator
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {/* Rating Card */}
            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  height: '100%',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Validator Rating
                    </Typography>
                    {validatorStats.verified && (
                      <Chip
                        icon={<VerifiedIcon fontSize="small" />}
                        label="Verified"
                        size="small"
                        sx={{
                          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(52, 211, 153, 0.2) 100%)',
                          color: '#34d399',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          fontWeight: 600,
                        }}
                      />
                    )}
                  </Box>
                  {renderStars(validatorStats.rating || 0)}
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Based on accuracy, stake, and participation
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Accuracy Card */}
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Voting Accuracy
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                    {validatorStats.accuracy.toFixed(1)}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={validatorStats.accuracy}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      mb: 1,
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        background: validatorStats.accuracy >= 90
                          ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
                          : validatorStats.accuracy >= 70
                          ? 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)'
                          : 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)',
                      },
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {validatorStats.correctVotes} correct / {validatorStats.totalVotes} total votes
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Stake Card */}
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Total Stake
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                    {parseFloat(ethers.formatEther(validatorStats.totalStake || '0')).toFixed(0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    NEWS tokens staked
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Statistics Grid */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Performance Stats
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Total Votes
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                          {validatorStats.totalVotes}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Articles Validated
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                          {validatorStats.articlesValidated}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Correct Streak
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 600, color: 'success.main' }}>
                          {validatorStats.consecutiveCorrectVotes}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Member Since
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {new Date(validatorStats.joinedDate).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Earnings Card */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <TrendingUpIcon sx={{ color: 'success.main' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Earnings & Penalties
                    </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Total Rewards
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 600, color: 'success.main' }}>
                          +{parseFloat(ethers.formatEther(validatorStats.totalRewardsEarned || '0')).toFixed(0)} NEWS
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Total Penalties
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 600, color: 'error.main' }}>
                          -{parseFloat(ethers.formatEther(validatorStats.totalPenaltiesPaid || '0')).toFixed(0)} NEWS
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(52, 211, 153, 0.1) 100%)',
                          border: '1px solid rgba(16, 185, 129, 0.2)',
                        }}
                      >
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          Net Earnings
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                          +{(parseFloat(ethers.formatEther(validatorStats.totalRewardsEarned || '0')) -
                             parseFloat(ethers.formatEther(validatorStats.totalPenaltiesPaid || '0'))).toFixed(0)} NEWS
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {!account && (
        <Alert severity="info" sx={{ mb: 4 }}>
          Connect your wallet to view your validator stats and manage your stake
        </Alert>
      )}

      {/* Staking Form */}
      <StakingForm />
    </Box>
  );
};

export default DashboardPage;
