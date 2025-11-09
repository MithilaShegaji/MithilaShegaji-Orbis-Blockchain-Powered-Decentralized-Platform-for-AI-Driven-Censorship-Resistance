
import React, { createContext, useState, useContext } from 'react';
import { ethers } from 'ethers';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [account, setAccount] = useState(null);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const sepoliaChainId = '0xaa36a7';

        if (chainId !== sepoliaChainId) {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: sepoliaChainId }],
            });
          } catch (switchError) {
            if (switchError.code === 4902) {
              try {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [{
                    chainId: sepoliaChainId,
                    chainName: 'Sepolia Testnet',
                    nativeCurrency: {
                      name: 'Sepolia Ether',
                      symbol: 'SEP',
                      decimals: 18,
                    },
                    rpcUrls: ['https://rpc.sepolia.org'],
                    blockExplorerUrls: ['https://sepolia.etherscan.io'],
                  }],
                });
                await window.ethereum.request({
                  method: 'wallet_switchEthereumChain',
                  params: [{ chainId: sepoliaChainId }],
                });
              } catch (addError) {
                console.error("Failed to add Sepolia network", addError);
                alert('Failed to add the Sepolia network. Please add it manually to MetaMask.');
                return;
              }
            }
            console.error("Failed to switch to the Sepolia network", switchError);
            return;
          }
        }

        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);

      } catch (error) {
        console.error("Error connecting to MetaMask", error);
        alert(`An error occurred: ${error.message}`);
      }
    } else {
      alert('Please install MetaMask!');
    }
  };

  return (
    <AppContext.Provider value={{ account, connectWallet }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
