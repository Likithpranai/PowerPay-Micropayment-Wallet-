const express = require('express');
const walletController = require('../controllers/wallet.controller');
const paymentController = require('../controllers/payment.controller');
const mockController = require('../controllers/mock.controller');

const router = express.Router();

// Wallet routes
router.post('/wallet/create', walletController.createWallet);
router.get('/wallet/:address', walletController.getWalletDetails);
router.get('/wallet/:address/balance', walletController.getBalance);

// Payment channel routes
router.post('/channel/create', paymentController.createChannel);
router.post('/channel/:channelId/micropayment', paymentController.addMicropaymentIntent);
router.post('/channel/:channelId/process', paymentController.processProbabilisticPayment);
router.post('/channel/:channelId/close', paymentController.closeChannel);
router.get('/channel/:channelId', paymentController.getChannelDetails);

// Mock payment routes for testing
router.post('/mock/channel/create', mockController.createMockChannel);
router.post('/mock/channel/:channelId/micropayment', mockController.addMockMicropaymentIntent);
router.post('/mock/channel/:channelId/process', mockController.processMockProbabilisticPayment);
router.post('/mock/channel/:channelId/test-distribution', mockController.testProbabilisticPaymentDistribution);
router.get('/mock/channel/:channelId', mockController.getMockChannelDetails);

module.exports = router;
