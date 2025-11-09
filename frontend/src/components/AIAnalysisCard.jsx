import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Divider,
  Tooltip,
  Paper
} from '@mui/material';
import {
  Psychology as AIIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Info as InfoIcon
} from '@mui/icons-material';

const AIAnalysisCard = ({ article, aiDetails }) => {
  // Safety check
  if (!article) {
    return null;
  }

  // Parse AI details if available
  const hasDetailedAnalysis = aiDetails && aiDetails.models;

  const trustScore = Number(article?.trustScore || 0);
  const isAutoApproved = trustScore >= 80;

  // Mock model data structure (will be replaced with real data from backend)
  const mockModels = aiDetails?.models || [
    { name: 'Fake News Detector', prediction: trustScore >= 80 ? 'REAL' : 'FAKE', confidence: trustScore },
    { name: 'Sentiment Analysis', prediction: trustScore >= 70 ? 'POSITIVE' : 'NEGATIVE', confidence: Math.min(trustScore + 10, 100) },
    { name: 'Content Classifier', prediction: trustScore >= 75 ? 'CREDIBLE' : 'SUSPICIOUS', confidence: Math.max(trustScore - 5, 0) }
  ];

  const modelCount = aiDetails?.totalModels || mockModels.length;
  const consensus = aiDetails?.consensus || (trustScore >= 80 ? 'HIGH_TRUST' : trustScore >= 50 ? 'MEDIUM_TRUST' : 'LOW_TRUST');

  const getConsensusColor = () => {
    if (trustScore >= 80) return 'success';
    if (trustScore >= 50) return 'warning';
    return 'error';
  };

  const getConsensusIcon = () => {
    if (trustScore >= 80) return <CheckIcon />;
    return <CloseIcon />;
  };

  const getPredictionColor = (prediction) => {
    const normalized = prediction.toUpperCase();
    if (normalized.includes('REAL') || normalized.includes('POSITIVE') || normalized.includes('CREDIBLE')) {
      return 'success';
    }
    return 'error';
  };

  return (
    <Card
      sx={{
        background: 'linear-gradient(135deg, rgba(26, 32, 44, 0.95) 0%, rgba(45, 55, 72, 0.95) 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 3,
        mb: 3
      }}
    >
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <AIIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
              AI Analysis Breakdown
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              Multi-model ensemble verification
            </Typography>
          </Box>
          <Chip
            icon={getConsensusIcon()}
            label={`${trustScore}% Trust Score`}
            color={getConsensusColor()}
            sx={{
              fontSize: '0.9rem',
              fontWeight: 600,
              px: 1
            }}
          />
        </Box>

        <Divider sx={{ mb: 3, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

        {/* Consensus Summary */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            background: isAutoApproved
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)'
              : 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)',
            border: '1px solid',
            borderColor: isAutoApproved ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)',
            borderRadius: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>
              AI Decision:
            </Typography>
            <Chip
              size="small"
              label={isAutoApproved ? 'Auto-Approved ✓' : 'Sent to Validators'}
              color={isAutoApproved ? 'success' : 'warning'}
              sx={{ ml: 2, fontWeight: 600 }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 1 }}>
            {isAutoApproved
              ? `Trust score meets the 80% threshold. Article was automatically approved and published.`
              : `Trust score below 80% threshold. Article requires validator consensus for publication.`
            }
          </Typography>
        </Paper>

        {/* Model Breakdown */}
        <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
          Individual Model Predictions ({modelCount} models)
        </Typography>

        {mockModels.map((model, index) => (
          <Box key={index} sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                  {model.name}
                </Typography>
                <Tooltip title="Model uses deep learning to analyze content authenticity" arrow>
                  <InfoIcon sx={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.4)', cursor: 'help' }} />
                </Tooltip>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Chip
                  size="small"
                  label={model.prediction}
                  color={getPredictionColor(model.prediction)}
                  variant="outlined"
                  sx={{ fontWeight: 600, minWidth: 90 }}
                />
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', minWidth: 45, textAlign: 'right' }}>
                  {model.confidence.toFixed(1)}%
                </Typography>
              </Box>
            </Box>
            <LinearProgress
              variant="determinate"
              value={model.confidence}
              sx={{
                height: 8,
                borderRadius: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 1,
                  background: model.confidence >= 80
                    ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                    : model.confidence >= 50
                    ? 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)'
                    : 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
                }
              }}
            />
          </Box>
        ))}

        <Divider sx={{ my: 3, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

        {/* Methodology Note */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <InfoIcon sx={{ fontSize: 18, color: 'primary.main', mt: 0.3 }} />
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', lineHeight: 1.6 }}>
            <strong>How it works:</strong> Our AI system uses a multi-model ensemble approach, combining
            fake news detection, sentiment analysis, and content classification. The final trust score
            represents the weighted consensus of all models. Articles scoring 80% or higher are
            automatically published, while lower scores require human validator review.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AIAnalysisCard;
