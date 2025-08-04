import React, { useState } from 'react';
import { Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const CreateWallet = () => {
  const [walletName, setWalletName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [wallet, setWallet] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // API call to create a new wallet
      const response = await axios.post(`${API_URL}/wallet/create`);
      
      // Store wallet information
      const newWallet = {
        name: walletName || 'PowerPay Wallet',
        address: response.data.wallet.address,
        secretKey: response.data.wallet.secretKey, // In a real app, we would NEVER store this in localStorage
        createdAt: new Date().toISOString()
      };
      
      // Store wallet in localStorage for demo
      // In a production app, we'd use a more secure storage and authentication
      const existingWallets = JSON.parse(localStorage.getItem('powerpay_wallets') || '[]');
      localStorage.setItem('powerpay_wallets', JSON.stringify([...existingWallets, newWallet]));
      
      setWallet(newWallet);
      setLoading(false);
      
    } catch (err) {
      console.error('Error creating wallet:', err);
      setError(err.response?.data?.message || 'Failed to create wallet. Please try again.');
      setLoading(false);
    }
  };

  const goToDashboard = () => {
    navigate('/');
  };

  const viewWallet = () => {
    navigate(`/wallet/${wallet.address}`);
  };

  return (
    <div className="create-wallet">
      <h1 className="mb-4">Create New Wallet</h1>
      
      <Card>
        <Card.Body>
          {error && (
            <Alert variant="danger" onClose={() => setError(null)} dismissible>
              {error}
            </Alert>
          )}
          
          {wallet ? (
            <div className="text-center">
              <Alert variant="success">
                <Alert.Heading>Wallet Created Successfully!</Alert.Heading>
                <p>Your new PowerPay wallet has been created. Keep your secret key safe!</p>
              </Alert>
              
              <div className="mb-4">
                <h5>Wallet Name</h5>
                <p className="lead">{wallet.name}</p>
                
                <h5>Wallet Address</h5>
                <p className="text-break">{wallet.address}</p>
                
                <div className="mb-3">
                  <h5>Secret Key (Keep Private!)</h5>
                  <div className="bg-light p-3 text-break">
                    <small>{wallet.secretKey}</small>
                  </div>
                  <small className="text-danger">
                    Warning: Never share your secret key with anyone! In a real application,
                    this key would be stored securely, not displayed.
                  </small>
                </div>
              </div>
              
              <div className="d-flex justify-content-center gap-2">
                <Button variant="outline-secondary" onClick={goToDashboard}>
                  Back to Dashboard
                </Button>
                <Button variant="primary" onClick={viewWallet}>
                  View Wallet Details
                </Button>
              </div>
            </div>
          ) : (
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Wallet Name (Optional)</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="My PowerPay Wallet"
                  value={walletName}
                  onChange={(e) => setWalletName(e.target.value)}
                />
                <Form.Text className="text-muted">
                  Give your wallet a name to easily identify it later.
                </Form.Text>
              </Form.Group>
              
              <div className="d-grid gap-2">
                <Button 
                  variant="primary" 
                  type="submit" 
                  disabled={loading}
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
                    'Create Wallet'
                  )}
                </Button>
              </div>
            </Form>
          )}
        </Card.Body>
      </Card>
      
      <div className="mt-4">
        <h4>About PowerPay Wallets</h4>
        <p>
          PowerPay wallets are Solana blockchain wallets optimized for micropayments.
          They use a revolutionary probabilistic payment mechanism that increases 
          transaction throughput by up to 3x compared to traditional blockchain systems.
        </p>
        <p>
          With PowerPay, you can make small payments efficiently without incurring 
          excessive transaction fees, making it perfect for content creators, 
          subscription services, and micro-tipping.
        </p>
      </div>
    </div>
  );
};

export default CreateWallet;
