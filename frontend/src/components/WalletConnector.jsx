
import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Button, Box, Chip } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const WalletConnector = () => {
  const { account, connectWallet } = useAppContext();

  return (
    <Box sx={{ ml: 2 }}>
      {account ? (
        <Chip
          icon={<CheckCircleIcon />}
          label={`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}
          sx={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(52, 211, 153, 0.2) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            fontWeight: 600,
            px: 1,
            '& .MuiChip-icon': {
              color: '#10b981',
            },
          }}
        />
      ) : (
        <Button
          onClick={connectWallet}
          variant="contained"
          startIcon={<AccountBalanceWalletIcon />}
          sx={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            },
          }}
        >
          Connect Wallet
        </Button>
      )}
    </Box>
  );
};

export default WalletConnector;
