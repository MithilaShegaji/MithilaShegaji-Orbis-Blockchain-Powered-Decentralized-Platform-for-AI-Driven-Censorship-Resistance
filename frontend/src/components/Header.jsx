
import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import WalletConnector from './WalletConnector';
import ArticleIcon from '@mui/icons-material/Article';

const Header = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
      }}
    >
      <Container maxWidth="xl">
        <Toolbar sx={{ py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Box
              sx={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                borderRadius: 2,
                p: 1,
                mr: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArticleIcon sx={{ color: 'white', fontSize: 28 }} />
            </Box>
            <Typography
              variant="h5"
              component={Link}
              to="/"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textDecoration: 'none',
                letterSpacing: '-0.02em',
              }}
            >
              Orbis
            </Typography>
            <Typography
              variant="body2"
              sx={{
                ml: 2,
                color: 'text.secondary',
                display: { xs: 'none', md: 'block' },
              }}
            >
              Decentralized News Platform
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              color="inherit"
              component={Link}
              to="/"
              sx={{
                color: isActive('/') ? 'primary.light' : 'text.primary',
                position: 'relative',
                '&:after': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: isActive('/') ? '80%' : '0%',
                  height: '2px',
                  background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
                  transition: 'width 0.3s ease',
                },
                '&:hover:after': {
                  width: '80%',
                },
              }}
            >
              Home
            </Button>
            <Button
              color="inherit"
              component={Link}
              to="/validators"
              sx={{
                color: isActive('/validators') ? 'primary.light' : 'text.primary',
                position: 'relative',
                '&:after': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: isActive('/validators') ? '80%' : '0%',
                  height: '2px',
                  background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
                  transition: 'width 0.3s ease',
                },
                '&:hover:after': {
                  width: '80%',
                },
              }}
            >
              Validators
            </Button>
            <Button
              color="inherit"
              component={Link}
              to="/submit"
              sx={{
                color: isActive('/submit') ? 'primary.light' : 'text.primary',
                position: 'relative',
                '&:after': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: isActive('/submit') ? '80%' : '0%',
                  height: '2px',
                  background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
                  transition: 'width 0.3s ease',
                },
                '&:hover:after': {
                  width: '80%',
                },
              }}
            >
              Submit Article
            </Button>
            <Button
              color="inherit"
              component={Link}
              to="/dashboard"
              sx={{
                color: isActive('/dashboard') ? 'primary.light' : 'text.primary',
                position: 'relative',
                '&:after': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: isActive('/dashboard') ? '80%' : '0%',
                  height: '2px',
                  background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
                  transition: 'width 0.3s ease',
                },
                '&:hover:after': {
                  width: '80%',
                },
              }}
            >
              Dashboard
            </Button>
            <WalletConnector />
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
