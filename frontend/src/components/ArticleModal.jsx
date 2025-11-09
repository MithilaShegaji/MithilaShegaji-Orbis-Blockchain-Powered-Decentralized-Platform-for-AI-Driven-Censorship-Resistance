
import React, { useState } from 'react';
import { Modal, Box, Typography, Button, Chip, Divider, IconButton, Alert, Grid } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VerifiedIcon from '@mui/icons-material/Verified';
import PendingIcon from '@mui/icons-material/Pending';
import CancelIcon from '@mui/icons-material/Cancel';
import RateReviewIcon from '@mui/icons-material/RateReview';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import PersonIcon from '@mui/icons-material/Person';
import HistoryIcon from '@mui/icons-material/History';
import EditIcon from '@mui/icons-material/Edit';
import TrustScoreGauge from './TrustScoreGauge';
import AIAnalysisCard from './AIAnalysisCard';
import ValidationFlowTimeline from './ValidationFlowTimeline';
import VoteDistributionChart from './VoteDistributionChart';
import VersionHistory from './VersionHistory';
import ProposeUpdateModal from './ProposeUpdateModal';
import { useAppContext } from '../contexts/AppContext';

// Helper to map status enum to text
const getStatusText = (status) => {
  const statusNumber = Number(status);
  switch (statusNumber) {
    case 0: return 'Submitted';
    case 1: return 'AI Approved';
    case 2: return 'Under Review';
    case 3: return 'Validator Approved';
    case 4: return 'Rejected';
    case 5: return 'Published';
    default: return 'Unknown';
  }
};

// Helper to get status chip styling
const getStatusChip = (status) => {
  const statusNumber = Number(status);
  switch (statusNumber) {
    case 0:
      return { label: 'Submitted', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', icon: <PendingIcon fontSize="small" /> };
    case 1:
      return { label: 'AI Approved', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', icon: <VerifiedIcon fontSize="small" /> };
    case 2:
      return { label: 'Under Review', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', icon: <RateReviewIcon fontSize="small" /> };
    case 3:
      return { label: 'Validator Approved', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', icon: <VerifiedIcon fontSize="small" /> };
    case 4:
      return { label: 'Rejected', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', icon: <CancelIcon fontSize="small" /> };
    case 5:
      return { label: 'Published', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', icon: <VerifiedIcon fontSize="small" /> };
    default:
      return { label: 'Unknown', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)', icon: null };
  }
};

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '95%', sm: '90%', md: '85%', lg: 1200 },
  maxHeight: '95vh',
  overflow: 'auto',
  background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(99, 102, 241, 0.3)',
  borderRadius: 3,
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  p: 0,
};

const ArticleModal = ({ article, content, onClose, onVote, voteMessage }) => {
  const { account } = useAppContext();
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showProposeUpdate, setShowProposeUpdate] = useState(false);

  if (!article) return null;

  const articleId = article.id;
  const isUnderReview = [0, 2].includes(Number(article.status));
  const statusInfo = getStatusChip(article.status);
  const trustScore = Number(article.trustScore);
  const versionCount = Number(article.versionCount || 1);
  const isAuthor = account && article.author.toLowerCase() === account.toLowerCase();
  const isPublished = Number(article.status) === 5;

  return (
    <>
    <Modal
      open={Boolean(article)}
      onClose={onClose}
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <Box sx={style}>
        {/* Header */}
        <Box
          sx={{
            p: 3,
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 1) 0%, rgba(15, 23, 42, 1) 100%)',
            borderBottom: '1px solid rgba(99, 102, 241, 0.3)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backdropFilter: 'blur(10px)',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <Chip
                icon={statusInfo.icon}
                label={statusInfo.label}
                size="small"
                sx={{
                  background: statusInfo.bg,
                  color: statusInfo.color,
                  border: `1px solid ${statusInfo.color}40`,
                  fontWeight: 600,
                  '& .MuiChip-icon': {
                    color: statusInfo.color,
                  },
                }}
              />
              {versionCount > 1 && (
                <Chip
                  icon={<HistoryIcon fontSize="small" />}
                  label={`v${versionCount}`}
                  size="small"
                  sx={{
                    background: 'rgba(139, 92, 246, 0.1)',
                    color: '#a78bfa',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    fontWeight: 600,
                  }}
                />
              )}
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <TrustScoreGauge score={trustScore} size="small" showLabel={false} />
              </Box>
            </Box>
            <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Typography id="modal-title" variant="h4" component="h2" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
            {content?.title || 'Loading title...'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <PersonIcon fontSize="small" sx={{ color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {article.author}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              •
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Article #{articleId}
            </Typography>
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ p: 4 }}>
          {/* Article Content - Moved to top */}
          <Box sx={{ mb: 4 }}>
            <Typography
              id="modal-description"
              variant="body1"
              sx={{
                lineHeight: 1.8,
                whiteSpace: 'pre-wrap',
                color: 'text.primary',
                fontSize: '1.05rem',
                mb: 4,
              }}
            >
              {content?.content || 'Loading content...'}
            </Typography>
          </Box>

          {/* Version Actions */}
          <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<HistoryIcon />}
              onClick={() => setShowVersionHistory(true)}
              sx={{
                borderColor: 'rgba(139, 92, 246, 0.5)',
                color: '#a78bfa',
                '&:hover': {
                  borderColor: '#a78bfa',
                  background: 'rgba(139, 92, 246, 0.1)',
                }
              }}
            >
              Version History ({versionCount})
            </Button>

            {isAuthor && isPublished ? (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => setShowProposeUpdate(true)}
                sx={{
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.8) 0%, rgba(139, 92, 246, 0.8) 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 1) 0%, rgba(139, 92, 246, 1) 100%)',
                  }
                }}
              >
                Propose Update
              </Button>
            ) : (
              !isPublished && (
                <Alert severity="info" sx={{ flex: 1 }}>
                  "Propose Update" button will appear when article is published (status: {getStatusText(article.status)})
                </Alert>
              )
            )}
          </Box>

          {/* Debug info for author check */}
          {isPublished && !isAuthor && account && (
            <Alert severity="info" sx={{ mb: 4 }}>
              Only the article author can propose updates. Author: {article.author.substring(0, 10)}... | You: {account.substring(0, 10)}...
            </Alert>
          )}

          {isPublished && !account && (
            <Alert severity="warning" sx={{ mb: 4 }}>
              Connect your wallet to propose updates to your articles
            </Alert>
          )}

          <Divider sx={{ my: 4, borderColor: 'rgba(255, 255, 255, 0.15)' }} />

          {/* AI & Blockchain Validation Details */}
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
            Validation Details
          </Typography>

          {/* AI & Blockchain Visualization Section */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Left Column - AI Analysis */}
            <Grid xs={12} lg={6}>
              <AIAnalysisCard article={article} aiDetails={article?.aiDetails} />
              <VoteDistributionChart article={article} />
            </Grid>

            {/* Right Column - Validation Flow */}
            <Grid xs={12} lg={6}>
              <ValidationFlowTimeline article={article} />
            </Grid>
          </Grid>
        </Box>

        {/* Voting Section */}
        {isUnderReview && (
          <Box
            sx={{
              p: 3,
              background: 'rgba(30, 41, 59, 0.5)',
              borderTop: '1px solid rgba(148, 163, 184, 0.1)',
              position: 'sticky',
              bottom: 0,
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
              Validator Action
            </Typography>
            {voteMessage && (
              <Alert
                severity={voteMessage.includes('successful') ? 'success' : voteMessage.includes('❌') ? 'error' : 'info'}
                sx={{ mb: 2 }}
              >
                {voteMessage}
              </Alert>
            )}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                onClick={() => onVote(articleId, true)}
                variant="contained"
                color="success"
                startIcon={<ThumbUpIcon />}
                sx={{
                  flex: 1,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                }}
              >
                Approve
              </Button>
              <Button
                onClick={() => onVote(articleId, false)}
                variant="contained"
                color="error"
                startIcon={<ThumbDownIcon />}
                sx={{
                  flex: 1,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                }}
              >
                Reject
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Modal>

    {/* Version History Modal */}
    <VersionHistory
      articleId={articleId}
      open={showVersionHistory}
      onClose={() => setShowVersionHistory(false)}
    />

    {/* Propose Update Modal */}
    <ProposeUpdateModal
      open={showProposeUpdate}
      onClose={() => setShowProposeUpdate(false)}
      articleId={articleId}
      currentContent={content}
      onSuccess={() => {
        // Refresh the article list or show success message
        setShowProposeUpdate(false);
      }}
    />
  </>
  );
};

export default ArticleModal;
