const {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
  clusterApiUrl
} = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');
const borsh = require('borsh');

// Configure Solana connection to devnet for testing
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

// Program ID (replace with your actual deployed program ID after deployment)
// For now, we're using a placeholder
const PROGRAM_ID = new PublicKey('PowerPayXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');

// Borsh schema for serialization (matching the contract's schema)
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

// Function to get SOL balance
async function getBalance(publicKey) {
  const balance = await connection.getBalance(publicKey);
  return balance / LAMPORTS_PER_SOL;
}

// Function to request airdrop for testing
async function requestAirdrop(publicKey, amount) {
  console.log(`Requesting airdrop of ${amount} SOL...`);
  const signature = await connection.requestAirdrop(
    publicKey, 
    amount * LAMPORTS_PER_SOL
  );
  await connection.confirmTransaction(signature);
  console.log(`Airdrop completed. New balance: ${await getBalance(publicKey)} SOL`);
}

// Function to create a payment channel
async function createPaymentChannel(payerKeypair, payeePublicKey, amount, expiryTimestamp = 0) {
  console.log('Creating payment channel...');
  
  // Generate a new keypair for the payment channel
  const channelKeypair = Keypair.generate();
  
  // Prepare instruction data
  const instructionData = borsh.serialize(
    PaymentInstructionSchema,
    {
      variant: InstructionVariant.InitChannel,
      amount: BigInt(amount * LAMPORTS_PER_SOL),
      expiry_timestamp: BigInt(expiryTimestamp)
    }
  );
  
  // Create transaction instruction
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: payerKeypair.publicKey, isSigner: true, isWritable: true },
      { pubkey: payeePublicKey, isSigner: false, isWritable: false },
      { pubkey: channelKeypair.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
    ],
    programId: PROGRAM_ID,
    data: Buffer.from(instructionData)
  });
  
  // Create and send transaction
  const transaction = new Transaction().add(instruction);
  
  try {
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [payerKeypair, channelKeypair]
    );
    
    console.log('Payment channel created successfully!');
    console.log('Channel Address:', channelKeypair.publicKey.toString());
    console.log('Transaction Signature:', signature);
    
    return {
      channelPublicKey: channelKeypair.publicKey,
      channelKeypair,
      signature
    };
  } catch (error) {
    console.error('Error creating payment channel:', error);
    throw error;
  }
}

// Function to add micropayment intent
async function addMicropaymentIntent(payerKeypair, channelPublicKey, amount) {
  console.log(`Adding micropayment intent of ${amount} SOL...`);
  
  // Prepare instruction data
  const instructionData = borsh.serialize(
    PaymentInstructionSchema,
    {
      variant: InstructionVariant.AddMicroPaymentIntent,
      amount: BigInt(amount * LAMPORTS_PER_SOL)
    }
  );
  
  // Create transaction instruction
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: payerKeypair.publicKey, isSigner: true, isWritable: false },
      { pubkey: channelPublicKey, isSigner: false, isWritable: true }
    ],
    programId: PROGRAM_ID,
    data: Buffer.from(instructionData)
  });
  
  // Create and send transaction
  const transaction = new Transaction().add(instruction);
  
  try {
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [payerKeypair]
    );
    
    console.log('Micropayment intent added successfully!');
    console.log('Transaction Signature:', signature);
    
    return { signature };
  } catch (error) {
    console.error('Error adding micropayment intent:', error);
    throw error;
  }
}

// Function to process probabilistic payment
async function processProbabilisticPayment(payerKeypair, payeePublicKey, channelPublicKey) {
  console.log('Processing probabilistic payment...');
  
  // Generate random seed
  const randomSeed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
  
  // Prepare instruction data
  const instructionData = borsh.serialize(
    PaymentInstructionSchema,
    {
      variant: InstructionVariant.ProcessProbabilisticPayment,
      random_seed: BigInt(randomSeed),
      amount: BigInt(0) // Not used for this instruction
    }
  );
  
  // Create transaction instruction
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: payerKeypair.publicKey, isSigner: true, isWritable: false },
      { pubkey: payeePublicKey, isSigner: false, isWritable: true },
      { pubkey: channelPublicKey, isSigner: false, isWritable: true }
    ],
    programId: PROGRAM_ID,
    data: Buffer.from(instructionData)
  });
  
  // Create and send transaction
  const transaction = new Transaction().add(instruction);
  
  try {
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [payerKeypair]
    );
    
    console.log('Probabilistic payment processed!');
    console.log('Random Seed:', randomSeed);
    console.log('Transaction Signature:', signature);
    
    return {
      signature,
      randomSeed
    };
  } catch (error) {
    console.error('Error processing probabilistic payment:', error);
    throw error;
  }
}

// Function to close payment channel
async function closePaymentChannel(payerKeypair, payeePublicKey, channelPublicKey) {
  console.log('Closing payment channel...');
  
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
      { pubkey: payerKeypair.publicKey, isSigner: true, isWritable: true },
      { pubkey: payeePublicKey, isSigner: false, isWritable: true },
      { pubkey: channelPublicKey, isSigner: false, isWritable: true }
    ],
    programId: PROGRAM_ID,
    data: Buffer.from(instructionData)
  });
  
  // Create and send transaction
  const transaction = new Transaction().add(instruction);
  
  try {
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [payerKeypair]
    );
    
    console.log('Payment channel closed successfully!');
    console.log('Transaction Signature:', signature);
    
    return { signature };
  } catch (error) {
    console.error('Error closing payment channel:', error);
    throw error;
  }
}

// Function to run a full simulation test
async function runSimulation() {
  console.log('=== Starting PowerPay Probabilistic Payment Simulation ===');
  
  // Create keypairs for testing
  const payerKeypair = Keypair.generate();
  const payeeKeypair = Keypair.generate();
  
  console.log('Payer public key:', payerKeypair.publicKey.toString());
  console.log('Payee public key:', payeeKeypair.publicKey.toString());
  
  // Request airdrop for payer
  await requestAirdrop(payerKeypair.publicKey, 2);
  
  // Create payment channel with 1 SOL
  const channelInfo = await createPaymentChannel(
    payerKeypair,
    payeeKeypair.publicKey,
    1
  );
  
  // Wait a bit before continuing
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Show balances
  console.log('Payer balance:', await getBalance(payerKeypair.publicKey), 'SOL');
  console.log('Payee balance:', await getBalance(payeeKeypair.publicKey), 'SOL');
  
  // Add 10 micropayment intents of 0.01 SOL each
  console.log('\n=== Adding micropayment intents ===');
  for (let i = 0; i < 10; i++) {
    await addMicropaymentIntent(payerKeypair, channelInfo.channelPublicKey, 0.01);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Process probabilistic payment multiple times
  console.log('\n=== Processing probabilistic payments ===');
  const payeeInitialBalance = await getBalance(payeeKeypair.publicKey);
  
  for (let i = 0; i < 5; i++) {
    await processProbabilisticPayment(
      payerKeypair,
      payeeKeypair.publicKey,
      channelInfo.channelPublicKey
    );
    
    // Check if payment was executed by checking balance change
    const currentPayeeBalance = await getBalance(payeeKeypair.publicKey);
    if (currentPayeeBalance > payeeInitialBalance) {
      console.log(`Payment executed on attempt ${i+1}! New payee balance: ${currentPayeeBalance} SOL`);
    } else {
      console.log(`Payment skipped on attempt ${i+1}. Payee balance unchanged: ${currentPayeeBalance} SOL`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Close channel
  console.log('\n=== Closing payment channel ===');
  await closePaymentChannel(
    payerKeypair,
    payeeKeypair.publicKey,
    channelInfo.channelPublicKey
  );
  
  // Final balances
  console.log('\n=== Final balances ===');
  console.log('Payer final balance:', await getBalance(payerKeypair.publicKey), 'SOL');
  console.log('Payee final balance:', await getBalance(payeeKeypair.publicKey), 'SOL');
  
  console.log('\n=== Simulation complete ===');
}

// Run simulation
runSimulation().catch(console.error);
