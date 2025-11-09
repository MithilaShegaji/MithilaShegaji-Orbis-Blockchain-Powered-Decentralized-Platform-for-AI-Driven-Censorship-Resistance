
import React, { useState, useEffect } from 'react';
import ArticleList from '../components/ArticleList';
import { fetchArticles } from '../services/api';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const HomePage = () => {
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const loadArticles = async () => {
    setIsLoading(true);
    try {
      const data = await fetchArticles();
      setArticles(data);
    } catch (error) {
      console.error("Fetch Error:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const handleVoteSuccess = () => {
    setTimeout(() => loadArticles(), 5000);
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
            <TrendingUpIcon sx={{ color: 'primary.light', fontSize: 32 }} />
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Discover Verified News
            </Typography>
          </Box>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3, maxWidth: 700 }}>
            AI-powered content validation meets decentralized consensus. Read articles verified by blockchain validators and contribute to the future of trustworthy journalism.
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => navigate('/submit')}
            sx={{
              fontWeight: 600,
              px: 4,
            }}
          >
            Submit Your Article
          </Button>
        </Box>
      </Box>

      {/* Article List */}
      <ArticleList articles={articles} isLoading={isLoading} onVoteSuccess={handleVoteSuccess} />
    </Box>
  );
};

export default HomePage;
