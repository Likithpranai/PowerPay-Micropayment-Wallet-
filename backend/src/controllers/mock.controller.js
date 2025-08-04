/**
 * Mock Controller for testing payments without blockchain interaction
 */
const fs = require('fs');
const path = require('path');

// Channel directory to store mock channel states
const MOCK_CHANNEL_DIR = path.join(__dirname, '../../mock-channel-store');
if (!fs.existsSync(MOCK_CHANNEL_DIR)) {
  fs.mkdirSync(MOCK_CHANNEL_DIR, { recursive: true });
}

/**
 * Initialize a mock payment channel for testing
 */
exports.createMockChannel = async (req, res) => {
  try {
    const { payerAddress, payeeAddress, totalAmount, expiryTimestamp } = req.body;
    
    // Validate required parameters
    if (!payerAddress || !payeeAddress || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: payerAddress, payeeAddress, or totalAmount'
      });
    }
    
    // Generate a mock channel ID
    const channelId = `mock-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    
    // Create mock channel information
    const channelInfo = {
      id: channelId,
      payer: payerAddress,
      payee: payeeAddress,
      totalAmount: parseInt(totalAmount),
      paidAmount: 0,
      accumulatedIntent: 0,
      expiryTimestamp: expiryTimestamp || 0,
      status: 'active',
      createdAt: Date.now(),
      transactions: [{
        type: 'create',
        signature: `mock-sig-${Date.now()}`,
        amount: parseInt(totalAmount),
        timestamp: Date.now()
      }]
    };
    
    // Save mock channel info
    fs.writeFileSync(
      path.join(MOCK_CHANNEL_DIR, `${channelId}.json`),
      JSON.stringify(channelInfo, null, 2)
    );
    
    res.status(201).json({
      success: true,
      channel: {
        id: channelId,
        payer: payerAddress,
        payee: payeeAddress,
        totalAmount: parseInt(totalAmount)
      },
      message: 'Mock payment channel created successfully'
    });
  } catch (error) {
    console.error('Error creating mock payment channel:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create mock payment channel'
    });
  }
};

/**
 * Add a micropayment intent to a mock channel
 */
exports.addMockMicropaymentIntent = async (req, res) => {
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
    const channelPath = path.join(MOCK_CHANNEL_DIR, `${channelId}.json`);
    if (!fs.existsSync(channelPath)) {
      return res.status(404).json({
        success: false,
        message: 'Mock payment channel not found'
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
    
    // Update channel information
    channelInfo.accumulatedIntent += parseInt(amount);
    
    // Check if we don't exceed total amount
    if (channelInfo.paidAmount + channelInfo.accumulatedIntent > channelInfo.totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient funds in channel'
      });
    }
    
    // Add transaction record
    channelInfo.transactions.push({
      type: 'intent',
      signature: `mock-sig-${Date.now()}`,
      amount: parseInt(amount),
      timestamp: Date.now()
    });
    
    // Save updated channel info
    fs.writeFileSync(
      path.join(MOCK_CHANNEL_DIR, `${channelId}.json`),
      JSON.stringify(channelInfo, null, 2)
    );
    
    res.status(200).json({
      success: true,
      intent: {
        channelId,
        amount: parseInt(amount),
        accumulatedIntent: channelInfo.accumulatedIntent
      },
      message: 'Micropayment intent added successfully'
    });
  } catch (error) {
    console.error('Error adding mock micropayment intent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add micropayment intent'
    });
  }
};

/**
 * Process a mock probabilistic payment in a channel
 */
exports.processMockProbabilisticPayment = async (req, res) => {
  try {
    const { channelId } = req.params;
    // Optional parameters to control the test
    const { forcedRandom, threshold, testMode } = req.body;
    
    // Load channel information
    const channelPath = path.join(MOCK_CHANNEL_DIR, `${channelId}.json`);
    if (!fs.existsSync(channelPath)) {
      return res.status(404).json({
        success: false,
        message: 'Mock payment channel not found'
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
    
    // Generate or use provided random value
    const randomSeed = forcedRandom !== undefined ? 
      parseInt(forcedRandom) : 
      Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    
    // Use provided threshold or default to 1% (100 out of 10000)
    const paymentThreshold = threshold !== undefined ? 
      parseInt(threshold) : 
      100;
    
    // Calculate probability result
    const randomValue = randomSeed % 10000;
    const paymentExecuted = randomValue < paymentThreshold;
    
    // Update channel information based on probabilistic result
    if (paymentExecuted) {
      // Payment executed
      channelInfo.paidAmount += channelInfo.accumulatedIntent;
      const processedAmount = channelInfo.accumulatedIntent;
      channelInfo.accumulatedIntent = 0;
      
      // Add transaction record
      channelInfo.transactions.push({
        type: 'payment_executed',
        signature: `mock-sig-${Date.now()}`,
        amount: processedAmount,
        randomSeed,
        randomValue,
        threshold: paymentThreshold,
        timestamp: Date.now(),
        testMode: testMode || false
      });
      
      res.status(200).json({
        success: true,
        payment: {
          channelId,
          executed: true,
          amount: processedAmount,
          randomValue,
          threshold: paymentThreshold,
          newPaidTotal: channelInfo.paidAmount,
          testDetails: {
            randomSeed,
            forcedRandom: forcedRandom !== undefined,
            customThreshold: threshold !== undefined,
            testMode: testMode || false
          }
        },
        message: 'Mock probabilistic payment executed successfully!'
      });
    } else {
      // Payment skipped this time
      channelInfo.transactions.push({
        type: 'payment_skipped',
        signature: `mock-sig-${Date.now()}`,
        pendingAmount: channelInfo.accumulatedIntent,
        randomSeed,
        randomValue,
        threshold: paymentThreshold,
        timestamp: Date.now(),
        testMode: testMode || false
      });
      
      res.status(200).json({
        success: true,
        payment: {
          channelId,
          executed: false,
          pendingAmount: channelInfo.accumulatedIntent,
          randomValue,
          threshold: paymentThreshold,
          testDetails: {
            randomSeed,
            forcedRandom: forcedRandom !== undefined,
            customThreshold: threshold !== undefined,
            testMode: testMode || false
          }
        },
        message: 'Mock probabilistic payment skipped this time (threshold not met)'
      });
    }
    
    // Save updated channel info
    fs.writeFileSync(
      path.join(MOCK_CHANNEL_DIR, `${channelId}.json`),
      JSON.stringify(channelInfo, null, 2)
    );
    
  } catch (error) {
    console.error('Error processing mock probabilistic payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process mock probabilistic payment'
    });
  }
};

/**
 * Run multiple mock payments to test probability distribution
 */
exports.testProbabilisticPaymentDistribution = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { iterations = 100, threshold = 100, amount = 1 } = req.body;
    
    // Validate parameters
    if (iterations <= 0 || iterations > 10000) {
      return res.status(400).json({
        success: false,
        message: 'Iterations must be between 1 and 10000'
      });
    }
    
    // Load channel information
    const channelPath = path.join(MOCK_CHANNEL_DIR, `${channelId}.json`);
    if (!fs.existsSync(channelPath)) {
      return res.status(404).json({
        success: false,
        message: 'Mock payment channel not found'
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
    
    // Test statistics
    const results = {
      totalIterations: iterations,
      executed: 0,
      skipped: 0,
      executionRate: 0,
      expectedRate: threshold / 10000,
      totalPaid: 0,
      threshold,
      randomValues: []
    };
    
    // Run multiple iterations
    for (let i = 0; i < iterations; i++) {
      // Add intent for each test if needed
      if (channelInfo.accumulatedIntent < amount) {
        channelInfo.accumulatedIntent += parseInt(amount);
      }
      
      // Generate random value
      const randomSeed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
      const randomValue = randomSeed % 10000;
      const paymentExecuted = randomValue < threshold;
      
      // Record result
      results.randomValues.push(randomValue);
      
      if (paymentExecuted) {
        results.executed++;
        results.totalPaid += amount;
        channelInfo.paidAmount += amount;
        channelInfo.accumulatedIntent -= amount;
        
        // Add transaction record
        channelInfo.transactions.push({
          type: 'test_payment_executed',
          iteration: i + 1,
          amount,
          randomSeed,
          randomValue,
          threshold,
          timestamp: Date.now()
        });
      } else {
        results.skipped++;
        
        // Add transaction record
        channelInfo.transactions.push({
          type: 'test_payment_skipped',
          iteration: i + 1,
          amount,
          randomSeed,
          randomValue,
          threshold,
          timestamp: Date.now()
        });
      }
    }
    
    // Calculate final statistics
    results.executionRate = results.executed / iterations;
    
    // Save updated channel info
    fs.writeFileSync(
      path.join(MOCK_CHANNEL_DIR, `${channelId}.json`),
      JSON.stringify(channelInfo, null, 2)
    );
    
    res.status(200).json({
      success: true,
      testResults: results,
      message: `Probabilistic payment test completed with ${results.executed} executions out of ${iterations} attempts (${(results.executionRate * 100).toFixed(2)}%)`
    });
    
  } catch (error) {
    console.error('Error testing probabilistic payment distribution:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test probabilistic payment distribution'
    });
  }
};

/**
 * Get mock payment channel details
 */
exports.getMockChannelDetails = async (req, res) => {
  try {
    const { channelId } = req.params;
    
    const channelPath = path.join(MOCK_CHANNEL_DIR, `${channelId}.json`);
    if (!fs.existsSync(channelPath)) {
      return res.status(404).json({
        success: false,
        message: 'Mock payment channel not found'
      });
    }
    
    const channelInfo = JSON.parse(fs.readFileSync(channelPath, 'utf8'));
    
    res.status(200).json({
      success: true,
      channel: channelInfo
    });
  } catch (error) {
    console.error('Error getting mock channel details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get mock channel details'
    });
  }
};
