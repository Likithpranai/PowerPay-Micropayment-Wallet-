import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Spinner, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const CreateChannel = () => {
  const [wallets, setWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState('');
  const [payeeAddress, setPayeeAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [expiryDays, setExpiryDays] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingWallets, setLoadingWallets] = useState(true);
  const [error, setError] = useState(null);
  const [channel, setChannel] = useState(null);
  const navigate = useNavigate();

  // Load wallets on component mount
  useEffect(() => {
    // In a real implementation, we'd fetch wallets from the API
    // For now, we're using localStorage to simulate this
    const storedWallets = JSON.parse(localStorage.getItem('powerpay_wallets') || '[]');
    setWallets(storedWallets);
    setLoadingWallets(false);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      if (!selectedWallet || !payeeAddress || !amount || parseFloat(amount) <= 0) {
        setError('Please fill in all required fields with valid values.');
        setLoading(false);
        return;
      }
      
      // Calculate expiry timestamp if provided
      let expiryTimestamp = 0;
      if (expiryDays && parseInt(expiryDays) > 0) {
        expiryTimestamp = Math.floor(Date.now() / 1000) + (parseInt(expiryDays) * 24 * 60 * 60);
      }
      
      // API call to create a payment channel
      const response = await axios.post(`${API_URL}/channel/create`, {
        payerAddress: selectedWallet,
        payeeAddress: payeeAddress,
        amount: parseFloat(amount) * 1000000000, // Convert SOL to lamports
        expiryTimestamp
      });
      
      const newChannel = {
        id: response.data.channel.id,
        payer: response.data.channel.payer,
        payee: response.data.channel.payee,
        totalAmount: parseFloat(amount),
        paidAmount: 0,
        accumulatedIntent: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
        expiryTimestamp: expiryTimestamp || 0
      };
      
      // Store channel in localStorage for demo
      const existingChannels = JSON.parse(localStorage.getItem('powerpay_channels') || '[]');
      localStorage.setItem('powerpay_channels', JSON.stringify([...existingChannels, newChannel]));
      
      setChannel(newChannel);
      setLoading(false);
      
    } catch (err) {
      console.error('Error creating payment channel:', err);
      setError(err.response?.data?.message || 'Failed to create payment channel. Please try again.');
      setLoading(false);
    }
  };

  const goToDashboard = () => {
    navigate('/');
  };

  const viewChannel = () => {
    navigate(`/channel/${channel.id}`);
  };

  // Format wallet address for display
  const formatAddress = (address) => {
    return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`;
  };

  return (
    <div className="create-channel">
      <h1 className="mb-4">Create Payment Channel</h1>
      
      <Card>
        <Card.Body>
          {error && (
            <Alert variant="danger" onClose={() => setError(null)} dismissible>
              {error}
            </Alert>
          )}
          
          {channel ? (
            <div className="text-center">
              <Alert variant="success">
                <Alert.Heading>Payment Channel Created!</Alert.Heading>
                <p>Your payment channel has been successfully created.</p>
              </Alert>
              
              <div className="mb-4">
                <h5>Channel ID</h5>
                <p className="text-break">{channel.id}</p>
                
                <h5>Payer</h5>
                <p>{formatAddress(channel.payer)}</p>
                
                <h5>Payee</h5>
                <p>{formatAddress(channel.payee)}</p>
                
                <h5>Amount</h5>
                <p className="lead">{channel.totalAmount} SOL</p>
                
                {channel.expiryTimestamp > 0 && (
                  <>
                    <h5>Expires On</h5>
                    <p>{new Date(channel.expiryTimestamp * 1000).toLocaleString()}</p>
                  </>
                )}
              </div>
              
              <div className="d-flex justify-content-center gap-2">
                <Button variant="outline-secondary" onClick={goToDashboard}>
                  Back to Dashboard
                </Button>
                <Button variant="primary" onClick={viewChannel}>
                  View Channel Details
                </Button>
              </div>
            </div>
          ) : (
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Select Your Wallet (Payer)</Form.Label>
                {loadingWallets ? (
                  <p className="text-muted">Loading wallets...</p>
                ) : wallets.length > 0 ? (
                  <Form.Select
                    value={selectedWallet}
                    onChange={(e) => setSelectedWallet(e.target.value)}
                    required
                  >
                    <option value="">Select a wallet</option>
                    {wallets.map(wallet => (
                      <option key={wallet.address} value={wallet.address}>
                        {wallet.name || 'Wallet'} ({formatAddress(wallet.address)})
                      </option>
                    ))}
                  </Form.Select>
                ) : (
                  <Alert variant="warning">
                    No wallets found. <a href="/wallet/create">Create a wallet</a> first.
                  </Alert>
                )}
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Recipient Address (Payee)</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter recipient's Solana address"
                  value={payeeAddress}
                  onChange={(e) => setPayeeAddress(e.target.value)}
                  required
                />
                <Form.Text className="text-muted">
                  The Solana address of the recipient who will receive payments.
                </Form.Text>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Channel Amount (SOL)</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="number"
                    min="0.001"
                    step="0.001"
                    placeholder="0.0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                  <InputGroup.Text>SOL</InputGroup.Text>
                </InputGroup>
                <Form.Text className="text-muted">
                  The total amount of SOL to lock in this payment channel.
                </Form.Text>
              </Form.Group>
              
              <Form.Group className="mb-4">
                <Form.Label>Channel Expiry (Optional)</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="number"
                    min="1"
                    placeholder="30"
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(e.target.value)}
                  />
                  <InputGroup.Text>Days</InputGroup.Text>
                </InputGroup>
                <Form.Text className="text-muted">
                  Set an expiration time for this payment channel. Leave empty for no expiration.
                </Form.Text>
              </Form.Group>
              
              <div className="d-grid gap-2">
                <Button 
                  variant="primary" 
                  type="submit" 
                  disabled={loading || wallets.length === 0}
                >
                  {loading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Creating...
                    </>
                  ) : (
                    'Create Payment Channel'
                  )}
                </Button>
              </div>
            </Form>
          )}
        </Card.Body>
      </Card>
      
      <div className="mt-4">
        <h4>About Payment Channels</h4>
        <p>
          Payment channels allow you to make multiple micropayments efficiently by locking
          funds upfront and then making off-chain transactions that only settle periodically
          on the blockchain using PowerPay's probabilistic payment mechanism.
        </p>
        <p>
          This approach significantly reduces transaction costs and increases throughput,
          making it ideal for use cases like streaming content, pay-per-use services, and
          small recurring payments.
        </p>
      </div>
    </div>
  );
};

export default CreateChannel;
