const express = require('express');
const walletController = require('../controllers/wallet.controller');
const paymentController = require('../controllers/payment.controller');

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

module.exports = router;
