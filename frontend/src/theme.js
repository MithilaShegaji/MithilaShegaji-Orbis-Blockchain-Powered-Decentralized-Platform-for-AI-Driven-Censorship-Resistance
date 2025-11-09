
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6366f1', // Indigo
      light: '#818cf8',
      dark: '#4f46e5',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#8b5cf6', // Purple
      light: '#a78bfa',
      dark: '#7c3aed',
      contrastText: '#ffffff',
    },
    success: {
      main: '#10b981', // Emerald
      light: '#34d399',
      dark: '#059669',
    },
    error: {
      main: '#ef4444', // Red
      light: '#f87171',
      dark: '#dc2626',
    },
    warning: {
      main: '#f59e0b', // Amber
      light: '#fbbf24',
      dark: '#d97706',
    },
    info: {
      main: '#3b82f6', // Blue
      light: '#60a5fa',
      dark: '#2563eb',
    },
    background: {
      default: '#0f172a', // Slate 900
      paper: 'rgba(30, 41, 59, 0.8)', // Slate 800 with transparency
    },
    text: {
      primary: '#f8fafc', // Slate 50 - even lighter for better contrast
      secondary: '#e2e8f0', // Slate 200 - lighter for better readability
      disabled: '#94a3b8', // Slate 400
    },
    divider: 'rgba(226, 232, 240, 0.12)', // Lighter dividers
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '3rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          fontSize: '1rem',
          boxShadow: 'none',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)',
            transform: 'translateY(-2px)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(148, 163, 184, 0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 20px 40px -10px rgba(99, 102, 241, 0.3)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(30, 41, 59, 0.5)',
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: 'rgba(30, 41, 59, 0.7)',
            },
            '&.Mui-focused': {
              backgroundColor: 'rgba(30, 41, 59, 0.8)',
              '& fieldset': {
                borderColor: '#6366f1',
                borderWidth: 2,
              },
            },
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontSize: '1rem',
          fontWeight: 500,
          '&.Mui-selected': {
            color: '#818cf8',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
          height: 3,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundImage: 'linear-gradient(135deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          color: '#f8fafc',
          fontWeight: 600,
          borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          color: '#e2e8f0',
        },
        dividers: {
          borderTop: '1px solid rgba(148, 163, 184, 0.15)',
          borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
        standardInfo: {
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
          color: '#93c5fd',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          '& .MuiAlert-icon': {
            color: '#60a5fa',
          },
        },
        standardSuccess: {
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          color: '#6ee7b7',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          '& .MuiAlert-icon': {
            color: '#34d399',
          },
        },
        standardError: {
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          color: '#fca5a5',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          '& .MuiAlert-icon': {
            color: '#f87171',
          },
        },
        standardWarning: {
          backgroundColor: 'rgba(245, 158, 11, 0.15)',
          color: '#fcd34d',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          '& .MuiAlert-icon': {
            color: '#fbbf24',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: '#cbd5e1',
          '&:hover': {
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            color: '#e2e8f0',
          },
        },
      },
    },
  },
});

export default theme;
