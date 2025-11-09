import React from 'react';
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Chip
} from '@mui/material';
import {
  Description as SubmitIcon,
  Psychology as AIIcon,
  HowToVote as ValidatorIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  Publish as PublishIcon
} from '@mui/icons-material';

const ValidationFlowTimeline = ({ article }) => {
  // Safety check
  if (!article) {
    return null;
  }

  const status = article?.status || 'Submitted';
  const trustScore = Number(article?.trustScore || 0);
  const yesVotes = parseInt(article?.yesVotes || 0);
  const noVotes = parseInt(article?.noVotes || 0);
  const totalVotes = yesVotes + noVotes;

  // Determine active step based on status
  const getActiveStep = () => {
    switch (status) {
      case 'Submitted':
        return 0;
      case 'AI Approved':
        return trustScore >= 80 ? 4 : 1; // Skip validator steps if auto-approved
      case 'Under Review':
        return 2;
      case 'Validator Approved':
        return 3;
      case 'Published':
        return 4;
      case 'Rejected':
        return 3;
      default:
        return 0;
    }
  };

  const activeStep = getActiveStep();
  const isAutoApproved = trustScore >= 80 && status === 'AI Approved';
  const isRejected = status === 'Rejected';

  // Define steps
  const steps = [
    {
      label: 'Article Submitted',
      description: 'Article submitted to the blockchain',
      icon: <SubmitIcon />,
      timestamp: article?.timestamp,
      completed: true
    },
    {
      label: 'AI Analysis',
      description: `AI trust score: ${trustScore}%`,
      icon: <AIIcon />,
      completed: activeStep >= 1,
      active: activeStep === 1,
      details: trustScore >= 80
        ? 'Score meets 80% threshold - Auto-approved!'
        : 'Score below threshold - Validator review required'
    },
    {
      label: 'Validator Review',
      description: totalVotes > 0 ? `${totalVotes} vote(s) received` : 'Waiting for validators',
      icon: <ValidatorIcon />,
      completed: activeStep >= 2 && status !== 'AI Approved',
      active: activeStep === 2,
      skipped: isAutoApproved,
      details: totalVotes > 0 ? `Yes: ${yesVotes} | No: ${noVotes}` : 'Awaiting validator consensus'
    },
    {
      label: isRejected ? 'Rejected' : 'Approved',
      description: isRejected ? 'Article rejected by validators' : 'Consensus reached',
      icon: isRejected ? <RejectedIcon /> : <ApprovedIcon />,
      completed: activeStep >= 3 || isRejected,
      active: activeStep === 3,
      skipped: isAutoApproved && status !== 'Rejected',
      error: isRejected
    },
    {
      label: 'Published',
      description: 'Article live on platform',
      icon: <PublishIcon />,
      completed: activeStep >= 4,
      active: activeStep === 4,
      skipped: isRejected
    }
  ];

  const getStepColor = (step) => {
    if (step.error) return 'error';
    if (step.completed) return 'success';
    if (step.active) return 'primary';
    if (step.skipped) return 'default';
    return 'inherit';
  };

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
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'white', flexGrow: 1 }}>
          Validation Flow
        </Typography>
        {isAutoApproved && (
          <Chip
            label="AI Auto-Approved"
            color="success"
            size="small"
            icon={<AIIcon />}
            sx={{ fontWeight: 600 }}
          />
        )}
      </Box>

      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={index} completed={step.completed} disabled={step.skipped}>
            <StepLabel
              StepIconComponent={() => (
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: step.skipped
                      ? 'rgba(255, 255, 255, 0.1)'
                      : step.completed
                      ? step.error
                        ? '#ef4444'
                        : '#10b981'
                      : step.active
                      ? '#6366f1'
                      : 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    border: '2px solid',
                    borderColor: step.skipped
                      ? 'rgba(255, 255, 255, 0.2)'
                      : step.completed
                      ? step.error
                        ? '#dc2626'
                        : '#059669'
                      : step.active
                      ? '#4f46e5'
                      : 'rgba(255, 255, 255, 0.3)',
                    transition: 'all 0.3s ease',
                    opacity: step.skipped ? 0.5 : 1
                  }}
                >
                  {React.cloneElement(step.icon, { sx: { fontSize: 20 } })}
                </Box>
              )}
              sx={{
                '& .MuiStepLabel-label': {
                  color: step.skipped ? 'rgba(255, 255, 255, 0.4)' : 'white',
                  fontWeight: step.active ? 600 : 500,
                  fontSize: '1rem',
                  textDecoration: step.skipped ? 'line-through' : 'none'
                }
              }}
            >
              {step.label}
            </StepLabel>
            <StepContent
              sx={{
                borderLeft: '2px solid rgba(255, 255, 255, 0.1)',
                ml: 2.5,
                pl: 3
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  mb: 1
                }}
              >
                {step.description}
              </Typography>
              {step.details && (
                <Box
                  sx={{
                    mt: 1,
                    p: 1.5,
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: 1
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#c7d2fe',
                      fontWeight: 500
                    }}
                  >
                    {step.details}
                  </Typography>
                </Box>
              )}
              {step.skipped && (
                <Chip
                  label="Skipped"
                  size="small"
                  sx={{
                    mt: 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.5)'
                  }}
                />
              )}
            </StepContent>
          </Step>
        ))}
      </Stepper>

      {/* Summary Box */}
      {(isAutoApproved || isRejected || status === 'Published') && (
        <Box
          sx={{
            mt: 3,
            p: 2,
            backgroundColor: isRejected
              ? 'rgba(239, 68, 68, 0.1)'
              : 'rgba(16, 185, 129, 0.1)',
            border: '1px solid',
            borderColor: isRejected
              ? 'rgba(239, 68, 68, 0.3)'
              : 'rgba(16, 185, 129, 0.3)',
            borderRadius: 2
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: 'white',
              fontWeight: 500
            }}
          >
            {isRejected
              ? '❌ Article rejected - does not meet platform standards'
              : isAutoApproved
              ? '✓ Article automatically approved by AI and published'
              : '✓ Article approved by validator consensus and published'
            }
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default ValidationFlowTimeline;
