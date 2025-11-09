
import React, { useState } from 'react';
import { submitArticle } from '../services/api';
import { Card, CardContent, TextField, Button, Typography, Box, Alert, LinearProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ArticleIcon from '@mui/icons-material/Article';

const ArticleForm = ({ onArticleSubmitted }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsSubmitting(true);
    try {
      const result = await submitArticle(title, content);
      setMessage(`success:Article submitted successfully! Transaction: ${result.txHash}`);
      setTitle('');
      setContent('');
      setTimeout(() => {
        onArticleSubmitted();
      }, 1500);
    } catch (error) {
      setMessage(`error:${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const messageType = message.split(':')[0];
  const messageText = message.split(':')[1];

  return (
    <Card
      sx={{
        maxWidth: 800,
        mx: 'auto',
      }}
    >
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
            <ArticleIcon sx={{ color: 'white', fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
              Submit an Article
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Share your news with the decentralized community
            </Typography>
          </Box>
        </Box>
      </Box>

      <CardContent sx={{ p: 4 }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
              Article Title
            </Typography>
            <TextField
              placeholder="Enter a compelling title for your article..."
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isSubmitting}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '1.1rem',
                  fontWeight: 500,
                },
              }}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
              Article Content
            </Typography>
            <TextField
              placeholder="Write your article content here. Be clear, accurate, and provide valuable information..."
              fullWidth
              multiline
              rows={12}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              disabled={isSubmitting}
              sx={{
                '& .MuiOutlinedInput-root': {
                  lineHeight: 1.8,
                },
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Your article will be analyzed by AI for trust scoring. High-quality content (80%+ trust score) will be auto-published.
            </Typography>
          </Box>

          {message && (
            <Alert
              severity={messageType === 'success' ? 'success' : 'error'}
              sx={{ mb: 3 }}
            >
              {messageText}
            </Alert>
          )}

          {isSubmitting && <LinearProgress sx={{ mb: 3 }} />}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={isSubmitting}
            startIcon={<SendIcon />}
            sx={{
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 600,
            }}
          >
            {isSubmitting ? 'Submitting to Blockchain...' : 'Submit Article'}
          </Button>
        </form>

        <Box
          sx={{
            mt: 4,
            p: 3,
            background: 'rgba(99, 102, 241, 0.05)',
            borderRadius: 2,
            border: '1px solid rgba(99, 102, 241, 0.1)',
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            How it works:
          </Typography>
          <Typography variant="body2" color="text.secondary" component="div">
            <ol style={{ margin: 0, paddingLeft: 20 }}>
              <li>Your article is uploaded to IPFS for decentralized storage</li>
              <li>The smart contract records your submission on the blockchain</li>
              <li>AI analyzes sentiment and assigns a trust score (0-100)</li>
              <li>Articles with 80%+ trust are auto-published</li>
              <li>Lower scores go to validator review for approval</li>
            </ol>
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ArticleForm;
