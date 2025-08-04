const { Keypair, Connection, PublicKey, clusterApiUrl, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');

// Configure Solana connection - default to devnet for development
const connection = new Connection(
  process.env.SOLANA_RPC_URL || clusterApiUrl('devnet'),
  'confirmed'
);

// Directory to store wallet keypairs securely (in production this would use HSM or secure storage)
const WALLET_DIR = path.join(__dirname, '../../wallet-store');
if (!fs.existsSync(WALLET_DIR)) {
  fs.mkdirSync(WALLET_DIR, { recursive: true });
}

/**
 * Create a new wallet keypair
 */
exports.createWallet = async (req, res) => {
  try {
    // Generate new keypair
    const newWallet = Keypair.generate();
    
    // Extract wallet details
    const publicKey = newWallet.publicKey.toString();
    const secretKey = Buffer.from(newWallet.secretKey).toString('base64');
    
    // Store keypair securely (in production, use HSM or secure storage)
    const walletPath = path.join(WALLET_DIR, `${publicKey}.json`);
    fs.writeFileSync(walletPath, JSON.stringify({ publicKey, secretKey }, null, 2));
    
    // In production, we'd only return the public key
    // Here we're returning both for demonstration purposes
    res.status(201).json({
      success: true,
      wallet: {
        address: publicKey,
        // Warning: In production, never return the secret key to clients
        secretKey: secretKey
      },
      message: 'New wallet created successfully'
    });
  } catch (error) {
    console.error('Error creating wallet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create wallet'
    });
  }
};

/**
 * Get wallet details by address
 */
exports.getWalletDetails = async (req, res) => {
  try {
    const { address } = req.params;
    
    // Validate the address
    try {
      new PublicKey(address);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid wallet address'
      });
    }
    
    // Check if wallet exists in our store
    const walletPath = path.join(WALLET_DIR, `${address}.json`);
    if (!fs.existsSync(walletPath)) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }
    
    // Get wallet details
    const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
    
    // Get account info from Solana
    const publicKey = new PublicKey(address);
    const accountInfo = await connection.getAccountInfo(publicKey);
    
    res.status(200).json({
      success: true,
      wallet: {
        address: walletData.publicKey,
        exists: accountInfo !== null
      }
    });
  } catch (error) {
    console.error('Error retrieving wallet details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve wallet details'
    });
  }
};

/**
 * Get wallet balance
 */
exports.getBalance = async (req, res) => {
  try {
    const { address } = req.params;
    
    // Validate the address
    try {
      new PublicKey(address);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid wallet address'
      });
    }
    
    // Get balance from Solana
    const publicKey = new PublicKey(address);
    const balance = await connection.getBalance(publicKey);
    
    res.status(200).json({
      success: true,
      balance: {
        lamports: balance,
        sol: balance / LAMPORTS_PER_SOL
      }
    });
  } catch (error) {
    console.error('Error retrieving wallet balance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve wallet balance'
    });
  }
};
