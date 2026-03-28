import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const VaultView = ({ provider, account, contracts }) => {
  const [nfts, setNfts] = useState([]);
  const [yieldBalance, setYieldBalance] = useState('0');
  const [loading, setLoading] = useState(false);

  const fetchVaultData = async () => {
    if (!account || !contracts.receiptToken) return;
    try {
      // In a real app, we'd fetch the user's NFT balance from the ReceiptToken (ERC1155)
      // For MVP, we simulate the view of deposited assets
      const balance = await contracts.yieldStreamer.getPendingYield(account);
      setYieldBalance(ethers.formatEther(balance));
      
      // Mocking the list of deposited NFTs for the UI
      setNfts([
        { id: '42', collection: 'Bored Ape Yacht Club', status: 'Streaming' },
        { id: '777', collection: 'Virtual Land', status: 'Streaming' }
      ]);
    } catch (err) {
      console.error("Failed to fetch vault data:", err);
    }
  };

  useEffect(() => {
    fetchVaultData();
    const interval = setInterval(fetchVaultData, 10000);
    return () => clearInterval(interval);
  }, [account]);

  const depositNFT = async (collectionAddr, tokenId) => {
    setLoading(true);
    try {
      const nftContract = new ethers.Contract(
        collectionAddr,
        ['function approve(address to, uint256 tokenId) external', 'function setApprovalForAll(address operator, bool approved) external'],
        await provider.getSigner()
      );
      
      const tx1 = await nftContract.approve(contracts.receiptToken.target, tokenId);
      await tx1.wait();

      const tx2 = await contracts.receiptToken.depositNFT(collectionAddr, tokenId);
      await tx2.wait();
      
      fetchVaultData();
    } catch (err) {
      alert("Deposit failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#1a1a1a', color: 'white', borderRadius: '12px' }}>
      <h2>Your MorphVault</h2>
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #333', borderRadius: '8px' }}>
        <p>Total U-Token Yield Earned:</p>
        <h1 style={{ color: '#00ff88' }}>{yieldBalance} USDC-U</h1>
      </div>

      <h3>Deposited Assets</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {nfts.map(nft => (
          <div key={nft.id} style={{ padding: '10px', border: '1px solid #444', borderRadius: '6px' }}>
            <strong>{nft.collection} #{nft.id}</strong>
            <div style={{ fontSize: '12px', color: '#aaa' }}>Status: {nft.status}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={() => depositNFT("0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D", "123")}
          disabled={loading}
          style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', border: 'none', color: 'white', cursor: 'pointer' }}
        >
          {loading ? "Processing..." : "Deposit Mock NFT (BAYC #123)"}
        </button>
      </div>
    </div>
  );
};

export default VaultView;