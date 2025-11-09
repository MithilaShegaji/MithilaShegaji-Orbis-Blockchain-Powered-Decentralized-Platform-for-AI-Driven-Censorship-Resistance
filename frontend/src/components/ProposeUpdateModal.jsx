import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import { proposeArticleUpdate } from '../services/api';

const ProposeUpdateModal = ({ open, onClose, articleId, currentContent, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Reset form when modal opens
  React.useEffect(() => {
    if (open) {
      setTitle('');
      setContent('');
      setError('');
      setSuccess('');
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const result = await proposeArticleUpdate(articleId, title, content);
      setSuccess(`Update proposed successfully! Proposal ID: ${result.proposalId}`);

      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error proposing update:', err);
      setError(err.message || 'Failed to propose update');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EditIcon />
          <Typography variant="h6">Propose Article Update</Typography>
        </Box>
        <IconButton onClick={handleClose} size="small" disabled={loading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Alert severity="info" sx={{ mb: 3 }}>
          Your update will go through AI validation and may require validator approval before being published.
        </Alert>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <TextField
          label="Title"
          fullWidth
          variant="outlined"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
          placeholder="Enter new title for this version..."
          sx={{ mb: 3 }}
        />

        <TextField
          label="Content"
          fullWidth
          multiline
          rows={12}
          variant="outlined"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={loading}
          placeholder="Enter your updated article content here..."
        />

        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Article ID: {articleId}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !title.trim() || !content.trim()}
          startIcon={loading ? <CircularProgress size={20} /> : <EditIcon />}
        >
          {loading ? 'Proposing...' : 'Propose Update'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProposeUpdateModal;
