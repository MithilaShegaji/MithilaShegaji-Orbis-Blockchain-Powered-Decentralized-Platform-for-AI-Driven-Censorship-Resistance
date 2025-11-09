
import React, { useState } from 'react';
import { mintTokens, stakeTokens } from '../services/api';
import { Card, CardContent, TextField, Button, Typography, Box, Alert, LinearProgress, Stepper, Step, StepLabel, StepContent } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import LockIcon from '@mui/icons-material/Lock';
import InfoIcon from '@mui/icons-material/Info';

const StakingForm = () => {
  const [stakeAmount, setStakeAmount] = useState('100');
  const [stakeMessage, setStakeMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const handleMint = async () => {
    setStakeMessage('');
    setIsLoading(true);
    try {
      const result = await mintTokens();
      setStakeMessage(`success:Tokens minted successfully! Transaction: ${result.txHash}`);
      setActiveStep(1);
    } catch (error) {
      setStakeMessage(`error:${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStake = async (e) => {
    e.preventDefault();
    setStakeMessage('');
    setIsLoading(true);
    try {
      const result = await stakeTokens(stakeAmount);
      setStakeMessage(`success:Tokens staked successfully! Transaction: ${result.stakeTx}`);
      setActiveStep(2);
    } catch (error) {
      setStakeMessage(`error:${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const messageType = stakeMessage.split(':')[0];
  const messageText = stakeMessage.split(':')[1];

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Card sx={{ mb: 3 }}>
        <Box
          sx={{
            p: 3,
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
            borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Box
              sx={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                borderRadius: 2,
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AccountBalanceWalletIcon sx={{ color: 'white', fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                Validator Staking
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Stake NEWS tokens to become a validator and earn rewards
              </Typography>
            </Box>
          </Box>
        </Box>

        <CardContent sx={{ p: 4 }}>
          <Stepper activeStep={activeStep} orientation="vertical">
            <Step>
              <StepLabel>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Mint NEWS Tokens
                </Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  First, mint 1000 NEWS tokens to your wallet. These tokens are required for staking.
                </Typography>
                <Button
                  onClick={handleMint}
                  variant="contained"
                  startIcon={<LocalAtmIcon />}
                  disabled={isLoading}
                  size="large"
                  sx={{
                    fontWeight: 600,
                  }}
                >
                  {isLoading && activeStep === 0 ? 'Minting Tokens...' : 'Mint 1000 NEWS Tokens'}
                </Button>
              </StepContent>
            </Step>

            <Step>
              <StepLabel>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Stake Your Tokens
                </Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Stake your NEWS tokens to activate your validator status and start voting on articles.
                </Typography>
                <form onSubmit={handleStake}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
                      Amount to Stake (NEWS)
                    </Typography>
                    <TextField
                      placeholder="Enter amount to stake..."
                      fullWidth
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      required
                      disabled={isLoading}
                      type="number"
                      inputProps={{ min: "1", step: "1" }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          fontSize: '1.1rem',
                          fontWeight: 500,
                        },
                      }}
                    />
                  </Box>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<LockIcon />}
                    disabled={isLoading}
                    size="large"
                    sx={{
                      fontWeight: 600,
                    }}
                  >
                    {isLoading && activeStep === 1 ? 'Staking Tokens...' : `Stake ${stakeAmount} NEWS Tokens`}
                  </Button>
                </form>
              </StepContent>
            </Step>

            <Step>
              <StepLabel>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Ready to Validate!
                </Typography>
              </StepLabel>
              <StepContent>
                <Box
                  sx={{
                    p: 3,
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(52, 211, 153, 0.1) 100%)',
                    borderRadius: 2,
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#34d399', mb: 1 }}>
                    You're all set!
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    You can now vote on articles that are under review. Visit the Home page to see articles pending validation.
                  </Typography>
                </Box>
              </StepContent>
            </Step>
          </Stepper>

          {isLoading && <LinearProgress sx={{ mt: 3 }} />}

          {stakeMessage && (
            <Alert
              severity={messageType === 'success' ? 'success' : 'error'}
              sx={{ mt: 3 }}
            >
              {messageText}
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <InfoIcon sx={{ color: 'primary.main', mt: 0.5 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                How Validator Staking Works
              </Typography>
              <Typography variant="body2" color="text.secondary" component="div" sx={{ lineHeight: 1.8 }}>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li><strong>Mint Tokens:</strong> Get 1000 NEWS tokens to participate in validation</li>
                  <li><strong>Stake Tokens:</strong> Lock your tokens to become an active validator</li>
                  <li><strong>Vote on Articles:</strong> Review articles with trust scores below 80%</li>
                  <li><strong>Earn Rewards:</strong> Get 10 NEWS tokens for correct votes</li>
                  <li><strong>Avoid Penalties:</strong> Lose 5 NEWS tokens for incorrect votes</li>
                  <li><strong>Consensus Required:</strong> Articles need 80% approval from minimum 5 validators</li>
                </ul>
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default StakingForm;
