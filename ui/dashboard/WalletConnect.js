import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

const TARGET_CHAIN_ID = '0x7a69'; // Hardhat Localhost 31337

export default function WalletConnect({ onConnected }) {
    const [account, setAccount] = useState(null);
    const [error, setError] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);

    const checkNetwork = async (provider) => {
        const network = await provider.getNetwork();
        const chainIdHex = '0x' + network.chainId.toString(16);
        if (chainIdHex !== TARGET_CHAIN_ID) {
            setError(`Please switch to Localhost 31337 (Current: ${network.chainId})`);
            return false;
        }
        return true;
    };

    const connect = useCallback(async () => {
        if (!window.ethereum) {
            setError('MetaMask not found');
            return;
        }

        try {
            setIsConnecting(true);
            setError('');
            
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const provider = new ethers.BrowserProvider(window.ethereum);
            
            const isCorrectNetwork = await checkNetwork(provider);
            if (!isCorrectNetwork) {
                setIsConnecting(false);
                return;
            }

            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            
            setAccount(address);
            localStorage.setItem('morphyield_connected', 'true');
            if (onConnected) onConnected(signer, address);
        } catch (err) {
            if (err.code === 4001) {
                setError('Connection rejected by user');
            } else {
                setError(err.message || 'Connection failed');
            }
            console.error('WalletConnect Error:', err);
        } finally {
            setIsConnecting(false);
        }
    }, [onConnected]);

    const disconnect = () => {
        setAccount(null);
        localStorage.removeItem('morphyield_connected');
        // Note: EIP-1193 doesn't support programmatic disconnect, 
        // but we clear local state and session markers to force re-auth flow.
        window.location.reload(); 
    };

    useEffect(() => {
        const handleAccountsChanged = (accounts) => {
            if (accounts.length === 0) {
                disconnect();
            } else {
                setAccount(accounts[0]);
                connect(); // Re-validate network and update signer
            }
        };

        const handleChainChanged = () => window.location.reload();

        if (window.ethereum) {
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);

            // Auto-connect if session exists
            if (localStorage.getItem('morphyield_connected') === 'true') {
                connect();
            }
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            }
        };
    }, [connect]);

    return (
        <div style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '8px' }}>
            {!account ? (
                <button 
                    onClick={connect} 
                    disabled={isConnecting}
                    style={{ padding: '10px 20px', cursor: 'pointer' }}
                >
                    {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </button>
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                        {account.substring(0, 6)}...{account.substring(38)}
                    </span>
                    <button onClick={disconnect} style={{ padding: '5px 10px' }}>Disconnect</button>
                </div>
            )}
            {error && <p style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>{error}</p>}
        </div>
    );
}