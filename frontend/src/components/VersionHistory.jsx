import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  IconButton,
  Alert
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import CloseIcon from '@mui/icons-material/Close';
import { getVersionHistory, compareVersions } from '../services/api';

const VersionHistory = ({ articleId, open, onClose }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersions, setSelectedVersions] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    if (open && articleId) {
      fetchVersionHistory();
    }
  }, [open, articleId]);

  const fetchVersionHistory = async () => {
    try {
      setLoading(true);
      const data = await getVersionHistory(articleId);
      setVersions(data.versions);
    } catch (error) {
      console.error('Error fetching version history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVersionSelect = (versionIndex) => {
    if (selectedVersions.includes(versionIndex)) {
      setSelectedVersions(selectedVersions.filter(v => v !== versionIndex));
    } else if (selectedVersions.length < 2) {
      setSelectedVersions([...selectedVersions, versionIndex]);
    }
  };

  const handleCompare = async () => {
    if (selectedVersions.length !== 2) return;

    try {
      const [v1, v2] = selectedVersions.sort((a, b) => a - b);
      const data = await compareVersions(articleId, v1, v2);
      setComparisonData(data);
      setShowComparison(true);
    } catch (error) {
      console.error('Error comparing versions:', error);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon />
            <Typography variant="h6">Version History</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {loading ? (
            <Typography>Loading version history...</Typography>
          ) : versions.length === 0 ? (
            <Typography color="text.secondary">No versions found</Typography>
          ) : (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                Select two versions to compare their content
              </Alert>

              <List>
                {versions.map((version, index) => (
                  <ListItem
                    key={version.versionIndex}
                    button
                    selected={selectedVersions.includes(version.versionIndex)}
                    onClick={() => handleVersionSelect(version.versionIndex)}
                    sx={{
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: 2,
                      mb: 1,
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(99, 102, 241, 0.2)',
                        border: '1px solid rgba(99, 102, 241, 0.5)',
                      }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            Version {version.versionIndex + 1}
                          </Typography>
                          {/* Show "Current" for the latest version if there are multiple versions */}
                          {version.versionIndex === versions.length - 1 && versions.length > 1 && (
                            <Chip label="Current" size="small" color="primary" />
                          )}
                          {/* Show "Original" for the first version if there are multiple versions */}
                          {version.versionIndex === 0 && versions.length > 1 && (
                            <Chip label="Original" size="small" color="default" />
                          )}
                          {/* Show single "Latest" chip if there's only one version */}
                          {versions.length === 1 && (
                            <Chip label="Latest" size="small" color="primary" />
                          )}
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          Published: {formatDate(version.timestamp)}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose}>Close</Button>
          <Button
            onClick={handleCompare}
            variant="contained"
            disabled={selectedVersions.length !== 2}
            startIcon={<CompareArrowsIcon />}
          >
            Compare Selected
          </Button>
        </DialogActions>
      </Dialog>

      {/* Comparison Dialog */}
      {showComparison && comparisonData && (
        <Dialog
          open={showComparison}
          onClose={() => setShowComparison(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              maxHeight: '90vh'
            }
          }}
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CompareArrowsIcon />
              <Typography variant="h6">Version Comparison</Typography>
            </Box>
            <IconButton onClick={() => setShowComparison(false)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
              {/* Version 1 */}
              <Box>
                <Box sx={{ mb: 2, p: 2, background: 'rgba(99, 102, 241, 0.1)', borderRadius: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Version {parseInt(comparisonData.version1.versionIndex) + 1}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(comparisonData.version1.timestamp)}
                  </Typography>
                </Box>

                <Box sx={{ p: 2, background: 'rgba(30, 41, 59, 0.5)', borderRadius: 2 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom color="text.primary">
                    {comparisonData.version1.content.title}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary', lineHeight: 1.7 }}>
                    {comparisonData.version1.content.content}
                  </Typography>
                </Box>
              </Box>

              {/* Version 2 */}
              <Box>
                <Box sx={{ mb: 2, p: 2, background: 'rgba(139, 92, 246, 0.1)', borderRadius: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Version {parseInt(comparisonData.version2.versionIndex) + 1}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(comparisonData.version2.timestamp)}
                  </Typography>
                </Box>

                <Box sx={{ p: 2, background: 'rgba(30, 41, 59, 0.5)', borderRadius: 2 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom color="text.primary">
                    {comparisonData.version2.content.title}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary', lineHeight: 1.7 }}>
                    {comparisonData.version2.content.content}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setShowComparison(false)} variant="contained">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};

export default VersionHistory;
