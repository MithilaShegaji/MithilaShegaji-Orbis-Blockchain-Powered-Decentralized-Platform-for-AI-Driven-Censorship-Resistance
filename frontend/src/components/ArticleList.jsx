
import React, { useState, useEffect } from 'react';
import { readContent, voteOnArticle } from '../services/api';
import { useAppContext } from '../contexts/AppContext';
import ArticleModal from './ArticleModal';
import TrustScoreGauge from './TrustScoreGauge';
import { Card, CardContent, Typography, Tabs, Tab, Box, Chip, CircularProgress, Grid } from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import PendingIcon from '@mui/icons-material/Pending';
import CancelIcon from '@mui/icons-material/Cancel';
import RateReviewIcon from '@mui/icons-material/RateReview';
import HistoryIcon from '@mui/icons-material/History';

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

const ArticleList = ({ articles, isLoading, onVoteSuccess }) => {
  const { account } = useAppContext();
  const [activeTab, setActiveTab] = useState(0);
  const [contentCache, setContentCache] = useState({});
  const [isContentLoading, setIsContentLoading] = useState(null);
  const [modalArticle, setModalArticle] = useState(null);
  const [voteMessage, setVoteMessage] = useState('');

  const articlesUnderReview = articles.filter(article => [0, 2].includes(Number(article.status)));
  const articlesReviewed = articles.filter(article => [3, 4, 5].includes(Number(article.status)));

  const handleReadContent = async (cid) => {
    if (contentCache[cid]) return;
    setIsContentLoading(cid);
    try {
      const data = await readContent(cid);
      setContentCache(prev => ({ ...prev, [cid]: data }));
    } catch (error) {
      console.error("Content Fetch Error:", error);
      setContentCache(prev => ({
        ...prev,
        [cid]: {
          title: '[Content Unavailable]',
          content: 'This article content is no longer available on IPFS.'
        }
      }));
    }
    setIsContentLoading(null);
  };

  const handleOpenModal = (article) => {
    const cid = article.ipfsCid;
    if (!contentCache[cid]) {
      handleReadContent(cid);
    }
    setModalArticle(article);
  };

  const handleVote = async (articleId, decision) => {
    setVoteMessage(`Submitting vote for article ${articleId}...`);
    try {
      const tx = await voteOnArticle(articleId, decision, account);
      setVoteMessage(`Vote successful! TxHash: ${tx.hash}`);
      setModalArticle(null);
      onVoteSuccess();
    } catch (error) {
      console.error("Error voting:", error);
      if (error.code === 4001) {
        setVoteMessage("❌ Transaction cancelled by user.");
      } else if (error.message.includes("already voted") || error.message.includes("Already voted")) {
        setVoteMessage("ℹ️ You have already voted on this article. Each validator can only vote once per article.");
      } else if (error.message.includes("Must stake first")) {
        setVoteMessage("⚠️ You must stake NEWS tokens before voting. Please stake tokens first.");
      } else if (error.message.includes("Not under review")) {
        setVoteMessage("ℹ️ This article is no longer available for voting.");
      } else if (error.code === -32603) {
        setVoteMessage("❌ Transaction failed. Please try again or check your wallet connection.");
      } else {
        setVoteMessage(`❌ Voting failed: ${error.reason || error.message || 'Unknown error'}`);
      }
      setTimeout(() => {
        setVoteMessage('');
      }, 5000);
    }
  };

  useEffect(() => {
    if (activeTab === 1) {
      articlesUnderReview.forEach(article => {
        if (!contentCache[article.ipfsCid]) {
          handleReadContent(article.ipfsCid);
        }
      });
    }
  }, [activeTab, articles, contentCache]);

  const getActiveArticleList = () => {
    switch (activeTab) {
      case 1:
        return articlesUnderReview;
      case 2:
        return articlesReviewed;
      case 0:
      default:
        return articles;
    }
  };

  const handleChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box
        sx={{
          background: 'rgba(30, 41, 59, 0.5)',
          backdropFilter: 'blur(10px)',
          borderRadius: 3,
          border: '1px solid rgba(148, 163, 184, 0.1)',
          mb: 4,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleChange}
          aria-label="article tabs"
          sx={{
            px: 2,
            '& .MuiTabs-flexContainer': {
              gap: 2,
            },
          }}
        >
          <Tab
            label="All Articles"
            sx={{
              fontSize: '1rem',
              fontWeight: 600,
            }}
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Needs Review</span>
                <Chip
                  label={articlesUnderReview.length}
                  size="small"
                  sx={{
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(251, 191, 36, 0.2) 100%)',
                    color: '#fbbf24',
                    fontWeight: 700,
                    minWidth: '30px',
                  }}
                />
              </Box>
            }
            sx={{
              fontSize: '1rem',
              fontWeight: 600,
            }}
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Reviewed</span>
                <Chip
                  label={articlesReviewed.length}
                  size="small"
                  sx={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(52, 211, 153, 0.2) 100%)',
                    color: '#34d399',
                    fontWeight: 700,
                    minWidth: '30px',
                  }}
                />
              </Box>
            }
            sx={{
              fontSize: '1rem',
              fontWeight: 600,
            }}
          />
        </Tabs>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      ) : getActiveArticleList().length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            px: 4,
            background: 'rgba(30, 41, 59, 0.3)',
            borderRadius: 3,
            border: '1px solid rgba(148, 163, 184, 0.1)',
          }}
        >
          <Typography variant="h6" color="text.secondary">
            No articles found in this category
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {getActiveArticleList().map((article, index) => {
            const statusInfo = getStatusChip(article.status);
            const trustScore = Number(article.trustScore);
            const versionCount = Number(article.versionCount || 1);

            return (
              <Grid xs={12} md={6} lg={4} key={index}>
                <Card
                  onClick={() => handleOpenModal(article)}
                  sx={{
                    height: '100%',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 24px -10px rgba(99, 102, 241, 0.3)'
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    {/* Header with Status and Trust Score Gauge */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
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
                      </Box>
                    </Box>

                    {/* Trust Score Gauge - Centered */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                      <TrustScoreGauge score={trustScore} size="small" showLabel={true} />
                    </Box>

                    <Typography
                      variant="h6"
                      component="div"
                      sx={{
                        mb: 2,
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        minHeight: '3.6em',
                        color: 'text.primary',
                      }}
                    >
                      {contentCache[article.ipfsCid]?.title || `Article #${article.id}`}
                    </Typography>

                    {contentCache[article.ipfsCid]?.content && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          mb: 2,
                        }}
                      >
                        {contentCache[article.ipfsCid].content}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 'auto' }}>
                      <Typography variant="caption" color="text.secondary">
                        ID: {article.id}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        •
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Author: {article.author.substring(0, 10)}...
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {modalArticle && (
        <ArticleModal
          article={modalArticle}
          content={contentCache[modalArticle.ipfsCid]}
          onClose={() => setModalArticle(null)}
          onVote={handleVote}
          voteMessage={voteMessage}
        />
      )}
    </Box>
  );
};

export default ArticleList;
