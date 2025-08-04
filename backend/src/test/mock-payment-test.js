/**
 * Mock Payment Test Script
 * 
 * This script demonstrates how to use the mock payment endpoints to test
 * the probabilistic payment mechanism without interacting with the blockchain.
 */
const axios = require('axios');

// API base URL
const API_BASE_URL = 'http://localhost:3000/api';

// Test wallets (for demonstration)
const TEST_PAYER = 'TestPayerWallet123';
const TEST_PAYEE = 'TestPayeeWallet456';

// Store channel ID for use across the script
let mockChannelId = '';

/**
 * Helper function to make API requests
 */
async function makeRequest(method, endpoint, data = null) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = method === 'GET' 
      ? await axios.get(url)
      : await axios.post(url, data);
      
    return response.data;
  } catch (error) {
    console.error(`Error in ${method} ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Create a new mock payment channel
 */
async function createMockChannel(totalAmount = 100000) {
  console.log('\n=== Creating Mock Payment Channel ===');
  
  const response = await makeRequest('POST', '/mock/channel/create', {
    payerAddress: TEST_PAYER,
    payeeAddress: TEST_PAYEE,
    totalAmount
  });
  
  mockChannelId = response.channel.id;
  console.log(`Mock channel created with ID: ${mockChannelId}`);
  console.log(`Total amount: ${response.channel.totalAmount}`);
  
  return response;
}

/**
 * Add a micropayment intent
 */
async function addMicroPaymentIntent(amount = 1000) {
  console.log('\n=== Adding Micropayment Intent ===');
  
  const response = await makeRequest('POST', `/mock/channel/${mockChannelId}/micropayment`, {
    amount
  });
  
  console.log(`Added intent of ${amount} to channel`);
  console.log(`Accumulated intent: ${response.intent.accumulatedIntent}`);
  
  return response;
}

/**
 * Process a single probabilistic payment
 */
async function processProbabilisticPayment(forcedRandom = null, threshold = null) {
  console.log('\n=== Processing Probabilistic Payment ===');
  
  const payload = {};
  if (forcedRandom !== null) payload.forcedRandom = forcedRandom;
  if (threshold !== null) payload.threshold = threshold;
  
  const response = await makeRequest('POST', `/mock/channel/${mockChannelId}/process`, payload);
  
  console.log(`Payment executed: ${response.payment.executed}`);
  if (response.payment.executed) {
    console.log(`Amount paid: ${response.payment.amount}`);
  } else {
    console.log(`Pending amount: ${response.payment.pendingAmount}`);
  }
  console.log(`Random value: ${response.payment.randomValue}`);
  console.log(`Threshold: ${response.payment.threshold}`);
  
  return response;
}

/**
 * Run a probability distribution test
 */
async function testDistribution(iterations = 100, threshold = 100, amount = 1000) {
  console.log('\n=== Testing Probabilistic Payment Distribution ===');
  console.log(`Running ${iterations} iterations with threshold ${threshold}...`);
  
  const response = await makeRequest('POST', `/mock/channel/${mockChannelId}/test-distribution`, {
    iterations,
    threshold,
    amount
  });
  
  const results = response.testResults;
  
  console.log(`\nTest Results:`);
  console.log(`Total iterations: ${results.totalIterations}`);
  console.log(`Payments executed: ${results.executed}`);
  console.log(`Payments skipped: ${results.skipped}`);
  console.log(`Execution rate: ${(results.executionRate * 100).toFixed(2)}%`);
  console.log(`Expected rate: ${(results.expectedRate * 100).toFixed(2)}%`);
  console.log(`Total amount paid: ${results.totalPaid}`);
  
  return response;
}

/**
 * Get channel details
 */
async function getChannelDetails() {
  console.log('\n=== Getting Channel Details ===');
  
  const response = await makeRequest('GET', `/mock/channel/${mockChannelId}`);
  
  console.log(`Channel ID: ${response.channel.id}`);
  console.log(`Payer: ${response.channel.payer}`);
  console.log(`Payee: ${response.channel.payee}`);
  console.log(`Total amount: ${response.channel.totalAmount}`);
  console.log(`Paid amount: ${response.channel.paidAmount}`);
  console.log(`Accumulated intent: ${response.channel.accumulatedIntent}`);
  console.log(`Status: ${response.channel.status}`);
  console.log(`Transactions: ${response.channel.transactions.length}`);
  
  return response;
}

/**
 * Run the full test scenario
 */
async function runFullTest() {
  try {
    // 1. Create a mock payment channel with 100,000 units
    await createMockChannel(100000);
    
    // 2. Add a micropayment intent of 5,000 units
    await addMicroPaymentIntent(5000);
    
    // 3. Process a probabilistic payment (random)
    await processProbabilisticPayment();
    
    // 4. Check the channel details
    await getChannelDetails();
    
    // 5. Add another micropayment intent
    await addMicroPaymentIntent(3000);
    
    // 6. Force a successful payment (random value below threshold)
    // With threshold 100, any random value 0-99 will trigger payment
    await processProbabilisticPayment(50, 100);
    
    // 7. Check the channel details again
    await getChannelDetails();
    
    // 8. Add another intent for distribution test
    await addMicroPaymentIntent(10000);
    
    // 9. Run a distribution test with 100 iterations
    // Default threshold is 1% (100/10000)
    await testDistribution(100, 100, 100);
    
    // 10. Final channel state
    await getChannelDetails();
    
    console.log('\n=== Test Completed Successfully ===');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

/**
 * Run a controlled test with specific parameters
 */
async function runControlledTest(forcedRandom, threshold) {
  try {
    console.log(`\n=== Running Controlled Test ===`);
    console.log(`ForcedRandom: ${forcedRandom}, Threshold: ${threshold}`);
    
    // Create a new channel
    await createMockChannel(100000);
    
    // Add intent
    await addMicroPaymentIntent(2000);
    
    // Process with controlled parameters
    await processProbabilisticPayment(forcedRandom, threshold);
    
    // Check result
    await getChannelDetails();
    
  } catch (error) {
    console.error('Controlled test failed:', error.message);
  }
}

// Main execution
(async () => {
  console.log('=== PowerPay Mock Payment Test ===');
  
  // Check if the server is available
  try {
    await axios.get(`${API_BASE_URL}/mock/channel/non-existent`);
  } catch (error) {
    if (!error.response) {
      console.error('ERROR: Backend server is not running. Please start the server first.');
      console.log('Run: cd /Users/likith/Desktop/PowerPay/backend && npm start');
      process.exit(1);
    }
  }
  
  // Uncomment the test you want to run:
  
  // Run the full test scenario
  await runFullTest();
  
  // Or run controlled tests with specific parameters
  // To guarantee payment execution (random < threshold):
  // await runControlledTest(50, 100);  // 50 is less than 100, payment will execute
  
  // To guarantee payment skipping (random >= threshold):
  // await runControlledTest(200, 100);  // 200 is greater than 100, payment will skip
})();
