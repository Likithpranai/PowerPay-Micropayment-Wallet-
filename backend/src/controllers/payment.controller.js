const {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  Keypair,
  SystemProgram,
  sendAndConfirmTransaction,
  clusterApiUrl,
  LAMPORTS_PER_SOL
} = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');
const borsh = require('borsh');

// Configure Solana connection - default to devnet for development
const connection = new Connection(
  process.env.SOLANA_RPC_URL || clusterApiUrl('devnet'),
  'confirmed'
);

// PowerPay program ID (this would be the actual deployed program ID)
// For now we're using a placeholder ID
const PROGRAM_ID = new PublicKey(process.env.POWERPAY_PROGRAM_ID || 'PowerPayXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');

// Wallet directory for keypair storage
const WALLET_DIR = path.join(__dirname, '../../wallet-store');

// Payment channel directory to store channel states
const CHANNEL_DIR = path.join(__dirname, '../../channel-store');
if (!fs.existsSync(CHANNEL_DIR)) {
  fs.mkdirSync(CHANNEL_DIR, { recursive: true });
}

// Borsh schema for serialization
const PaymentInstructionSchema = {
  struct: {
    variant: 'u8',
    amount: 'u64',
    expiry_timestamp: { optional: true, type: 'u64' },
    random_seed: { optional: true, type: 'u64' },
  }
};

// Instruction variants
const InstructionVariant = {
  InitChannel: 0,
  AddMicroPaymentIntent: 1,
  ProcessProbabilisticPayment: 2,
  CloseChannel: 3
};

/**
 * Create a new payment channel between payer and payee
 */
exports.createChannel = async (req, res) => {
  try {
    const { payerAddress, payeeAddress, amount, expiryTimestamp } = req.body;
    
    // Validate required parameters
    if (!payerAddress || !payeeAddress || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: payerAddress, payeeAddress, or amount'
      });
    }
    
    // Convert addresses to PublicKey
    const payerPublicKey = new PublicKey(payerAddress);
    const payeePublicKey = new PublicKey(payeeAddress);
    
    // Load payer wallet (in production this would use a more secure approach)
    const walletPath = path.join(WALLET_DIR, `${payerAddress}.json`);
    if (!fs.existsSync(walletPath)) {
      return res.status(404).json({
        success: false,
        message: 'Payer wallet not found'
      });
    }
    
    const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
    const payerKeypair = Keypair.fromSecretKey(
      Buffer.from(walletData.secretKey, 'base64')
    );
    
    // Generate a new keypair for the payment channel account
    const channelKeypair = Keypair.generate();
    const channelAddress = channelKeypair.publicKey.toString();
    
    // Prepare instruction data
    const instructionData = borsh.serialize(
      PaymentInstructionSchema,
      {
        variant: InstructionVariant.InitChannel,
        amount: BigInt(amount),
        expiry_timestamp: expiryTimestamp ? BigInt(expiryTimestamp) : BigInt(0)
      }
    );
    
    // Create transaction instruction
    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: payerPublicKey, isSigner: true, isWritable: true },
        { pubkey: payeePublicKey, isSigner: false, isWritable: false },
        { pubkey: channelKeypair.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
      ],
      programId: PROGRAM_ID,
      data: Buffer.from(instructionData)
    });
    
    // Create and sign transaction
    const transaction = new Transaction().add(instruction);
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [payerKeypair, channelKeypair]
    );
    
    // Store channel information
    const channelInfo = {
      id: channelAddress,
      payer: payerAddress,
      payee: payeeAddress,
      totalAmount: amount,
      paidAmount: 0,
      accumulatedIntent: 0,
      expiryTimestamp: expiryTimestamp || 0,
      status: 'active',
      createdAt: Date.now(),
      transactions: [{
        type: 'create',
        signature,
        amount,
        timestamp: Date.now()
      }]
    };
    
    // Save channel info
    fs.writeFileSync(
      path.join(CHANNEL_DIR, `${channelAddress}.json`),
      JSON.stringify(channelInfo, null, 2)
    );
    
    res.status(201).json({
      success: true,
      channel: {
        id: channelAddress,
        payer: payerAddress,
        payee: payeeAddress,
        totalAmount: amount,
        signature
      },
      message: 'Payment channel created successfully'
    });
  } catch (error) {
    console.error('Error creating payment channel:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment channel'
    });
  }
};

/**
 * Add a micropayment intent to a channel
 */
exports.addMicropaymentIntent = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { amount } = req.body;
    
    // Validate parameters
    if (!amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameter: amount'
      });
    }
    
    // Load channel information
    const channelPath = path.join(CHANNEL_DIR, `${channelId}.json`);
    if (!fs.existsSync(channelPath)) {
      return res.status(404).json({
        success: false,
        message: 'Payment channel not found'
      });
    }
    
    const channelInfo = JSON.parse(fs.readFileSync(channelPath, 'utf8'));
    
    // Check if channel is still active
    if (channelInfo.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Channel is ${channelInfo.status}`
      });
    }
    
    // Check if channel has expired
    if (channelInfo.expiryTimestamp > 0 && 
        channelInfo.expiryTimestamp < Date.now() / 1000) {
      return res.status(400).json({
        success: false,
        message: 'Channel has expired'
      });
    }
    
    // Load payer wallet
    const walletPath = path.join(WALLET_DIR, `${channelInfo.payer}.json`);
    if (!fs.existsSync(walletPath)) {
      return res.status(404).json({
        success: false,
        message: 'Payer wallet not found'
      });
    }
    
    const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
    const payerKeypair = Keypair.fromSecretKey(
      Buffer.from(walletData.secretKey, 'base64')
    );
    
    // Prepare instruction data
    const instructionData = borsh.serialize(
      PaymentInstructionSchema,
      {
        variant: InstructionVariant.AddMicroPaymentIntent,
        amount: BigInt(amount)
      }
    );
    
    // Create transaction instruction
    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: new PublicKey(channelInfo.payer), isSigner: true, isWritable: false },
        { pubkey: new PublicKey(channelId), isSigner: false, isWritable: true }
      ],
      programId: PROGRAM_ID,
      data: Buffer.from(instructionData)
    });
    
    // Create and sign transaction
    const transaction = new Transaction().add(instruction);
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [payerKeypair]
    );
    
    // Update channel information
    channelInfo.accumulatedIntent += parseInt(amount);
    channelInfo.transactions.push({
      type: 'intent',
      signature,
      amount,
      timestamp: Date.now()
    });
    
    // Save updated channel info
    fs.writeFileSync(
      path.join(CHANNEL_DIR, `${channelId}.json`),
      JSON.stringify(channelInfo, null, 2)
    );
    
    res.status(200).json({
      success: true,
      intent: {
        channelId,
        amount,
        accumulatedIntent: channelInfo.accumulatedIntent,
        signature
      },
      message: 'Micropayment intent added successfully'
    });
  } catch (error) {
    console.error('Error adding micropayment intent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add micropayment intent'
    });
  }
};

/**
 * Process a probabilistic payment in a channel
 * This is the core of the probabilistic payment mechanism
 */
exports.processProbabilisticPayment = async (req, res) => {
  try {
    const { channelId } = req.params;
    
    // Generate a random seed for probabilistic decision
    // In a real implementation, this should be cryptographically secure
    const randomSeed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    
    // Load channel information
    const channelPath = path.join(CHANNEL_DIR, `${channelId}.json`);
    if (!fs.existsSync(channelPath)) {
      return res.status(404).json({
        success: false,
        message: 'Payment channel not found'
      });
    }
    
    const channelInfo = JSON.parse(fs.readFileSync(channelPath, 'utf8'));
    
    // Check if channel is still active
    if (channelInfo.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Channel is ${channelInfo.status}`
      });
    }
    
    // Check if there's any accumulated intent to process
    if (channelInfo.accumulatedIntent === 0) {
      return res.status(400).json({
        success: false,
        message: 'No accumulated payment intent to process'
      });
    }
    
    // Load payer wallet
    const walletPath = path.join(WALLET_DIR, `${channelInfo.payer}.json`);
    if (!fs.existsSync(walletPath)) {
      return res.status(404).json({
        success: false,
        message: 'Payer wallet not found'
      });
    }
    
    const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
    const payerKeypair = Keypair.fromSecretKey(
      Buffer.from(walletData.secretKey, 'base64')
    );
    
    // Prepare instruction data
    const instructionData = borsh.serialize(
      PaymentInstructionSchema,
      {
        variant: InstructionVariant.ProcessProbabilisticPayment,
        random_seed: BigInt(randomSeed)
      }
    );
    
    // Create transaction instruction
    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: new PublicKey(channelInfo.payer), isSigner: true, isWritable: false },
        { pubkey: new PublicKey(channelInfo.payee), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(channelId), isSigner: false, isWritable: true }
      ],
      programId: PROGRAM_ID,
      data: Buffer.from(instructionData)
    });
    
    // Create and sign transaction
    const transaction = new Transaction().add(instruction);
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [payerKeypair]
    );
    
    // Calculate probability result
    // This simulates the on-chain logic for demonstration purposes
    // In the real implementation, this happens inside the Solana program
    
    // For demonstration: use threshold of 1% (100 out of 10000)
    const threshold = 100;
    const randomValue = randomSeed % 10000;
    const paymentExecuted = randomValue < threshold;
    
    // Update channel information based on probabilistic result
    if (paymentExecuted) {
      // Payment executed
      channelInfo.paidAmount += channelInfo.accumulatedIntent;
      const processedAmount = channelInfo.accumulatedIntent;
      channelInfo.accumulatedIntent = 0;
      
      channelInfo.transactions.push({
        type: 'payment_executed',
        signature,
        amount: processedAmount,
        randomSeed,
        randomValue,
        threshold,
        timestamp: Date.now()
      });
      
      res.status(200).json({
        success: true,
        payment: {
          channelId,
          executed: true,
          amount: processedAmount,
          signature,
          newPaidTotal: channelInfo.paidAmount
        },
        message: 'Probabilistic payment executed successfully!'
      });
    } else {
      // Payment skipped this time
      channelInfo.transactions.push({
        type: 'payment_skipped',
        signature,
        pendingAmount: channelInfo.accumulatedIntent,
        randomSeed,
        randomValue,
        threshold,
        timestamp: Date.now()
      });
      
      res.status(200).json({
        success: true,
        payment: {
          channelId,
          executed: false,
          pendingAmount: channelInfo.accumulatedIntent,
          signature
        },
        message: 'Probabilistic payment skipped this time (threshold not met)'
      });
    }
    
    // Save updated channel info
    fs.writeFileSync(
      path.join(CHANNEL_DIR, `${channelId}.json`),
      JSON.stringify(channelInfo, null, 2)
    );
    
  } catch (error) {
    console.error('Error processing probabilistic payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process probabilistic payment'
    });
  }
};

/**
 * Close a payment channel and settle final balance
 */
exports.closeChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    
    // Load channel information
    const channelPath = path.join(CHANNEL_DIR, `${channelId}.json`);
    if (!fs.existsSync(channelPath)) {
      return res.status(404).json({
        success: false,
        message: 'Payment channel not found'
      });
    }
    
    const channelInfo = JSON.parse(fs.readFileSync(channelPath, 'utf8'));
    
    // Check if channel is already closed
    if (channelInfo.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: 'Channel is already closed'
      });
    }
    
    // Load payer wallet
    const walletPath = path.join(WALLET_DIR, `${channelInfo.payer}.json`);
    if (!fs.existsSync(walletPath)) {
      return res.status(404).json({
        success: false,
        message: 'Payer wallet not found'
      });
    }
    
    const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
    const payerKeypair = Keypair.fromSecretKey(
      Buffer.from(walletData.secretKey, 'base64')
    );
    
    // Prepare instruction data
    const instructionData = borsh.serialize(
      PaymentInstructionSchema,
      {
        variant: InstructionVariant.CloseChannel,
        amount: BigInt(0) // Not used for close instruction
      }
    );
    
    // Create transaction instruction
    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: new PublicKey(channelInfo.payer), isSigner: true, isWritable: true },
        { pubkey: new PublicKey(channelInfo.payee), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(channelId), isSigner: false, isWritable: true }
      ],
      programId: PROGRAM_ID,
      data: Buffer.from(instructionData)
    });
    
    // Create and sign transaction
    const transaction = new Transaction().add(instruction);
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [payerKeypair]
    );
    
    // Update channel information
    const remainingIntent = channelInfo.accumulatedIntent;
    channelInfo.paidAmount += remainingIntent;
    channelInfo.accumulatedIntent = 0;
    channelInfo.status = 'closed';
    channelInfo.closedAt = Date.now();
    channelInfo.transactions.push({
      type: 'close',
      signature,
      remainingIntent,
      timestamp: Date.now()
    });
    
    // Save updated channel info
    fs.writeFileSync(
      path.join(CHANNEL_DIR, `${channelId}.json`),
      JSON.stringify(channelInfo, null, 2)
    );
    
    res.status(200).json({
      success: true,
      channel: {
        id: channelId,
        status: 'closed',
        finalPaidAmount: channelInfo.paidAmount,
        signature
      },
      message: 'Payment channel closed successfully'
    });
  } catch (error) {
    console.error('Error closing payment channel:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to close payment channel'
    });
  }
};

/**
 * Get payment channel details
 */
exports.getChannelDetails = async (req, res) => {
  try {
    const { channelId } = req.params;
    
    // Load channel information
    const channelPath = path.join(CHANNEL_DIR, `${channelId}.json`);
    if (!fs.existsSync(channelPath)) {
      return res.status(404).json({
        success: false,
        message: 'Payment channel not found'
      });
    }
    
    const channelInfo = JSON.parse(fs.readFileSync(channelPath, 'utf8'));
    
    // Return channel details
    res.status(200).json({
      success: true,
      channel: {
        id: channelId,
        payer: channelInfo.payer,
        payee: channelInfo.payee,
        totalAmount: channelInfo.totalAmount,
        paidAmount: channelInfo.paidAmount,
        accumulatedIntent: channelInfo.accumulatedIntent,
        status: channelInfo.status,
        expiryTimestamp: channelInfo.expiryTimestamp,
        createdAt: channelInfo.createdAt,
        closedAt: channelInfo.closedAt || null
      }
    });
  } catch (error) {
    console.error('Error retrieving channel details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve channel details'
    });
  }
};
