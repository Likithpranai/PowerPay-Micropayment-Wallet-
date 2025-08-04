import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Button, Alert, Spinner, Badge, InputGroup, Form, Row, Col, ListGroup, Modal } from 'react-bootstrap';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const ChannelDetails = () => {
  const { channelId } = useParams();
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [micropaymentAmount, setMicropaymentAmount] = useState('0.001');
  const [showModal, setShowModal] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [wallets, setWallets] = useState([]);

  // Fetch channel details on component mount
  useEffect(() => {
    const fetchChannelDetails = async () => {
      try {
        setLoading(true);
        
        // In a real implementation, we'd fetch this from the API
        // For now, we're using localStorage to simulate this
        const storedChannels = JSON.parse(localStorage.getItem('powerpay_channels') || '[]');
        const foundChannel = storedChannels.find(c => c.id === channelId);
        
        if (!foundChannel) {
          setError('Payment channel not found');
          setLoading(false);
          return;
        }
        
        setChannel(foundChannel);
        
        // Load wallets for reference
        const storedWallets = JSON.parse(localStorage.getItem('powerpay_wallets') || '[]');
        setWallets(storedWallets);
        
        // Generate some mock transactions for demo
        // In a real app, this would come from the API
        setTransactions([
          {
            id: '1',
            type: 'create',
            amount: foundChannel.totalAmount,
            timestamp: foundChannel.createdAt,
            signature: 'tx_' + Math.random().toString(36).substring(2, 10)
          }
        ]);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching channel details:', err);
        setError(err.response?.data?.message || 'Failed to load channel details');
        setLoading(false);
      }
    };
    
    fetchChannelDetails();
  }, [channelId]);

  const addMicropaymentIntent = async () => {
    try {
      setLoadingAction(true);
      setError(null);
      setSuccess(null);
      
      if (!micropaymentAmount || parseFloat(micropaymentAmount) <= 0) {
        setError('Please enter a valid amount');
        setLoadingAction(false);
        return;
      }
      
      // API call to add micropayment intent
      const response = await axios.post(`${API_URL}/channel/${channelId}/micropayment`, {
        amount: parseFloat(micropaymentAmount) * 1000000000 // Convert SOL to lamports
      });
      
      // Update channel in localStorage for demo
      const storedChannels = JSON.parse(localStorage.getItem('powerpay_channels') || '[]');
      const updatedChannels = storedChannels.map(c => {
        if (c.id === channelId) {
          return {
            ...c,
            accumulatedIntent: c.accumulatedIntent + parseFloat(micropaymentAmount)
          };
        }
        return c;
      });
      localStorage.setItem('powerpay_channels', JSON.stringify(updatedChannels));
      
      // Update channel state
      setChannel(prev => ({
        ...prev,
        accumulatedIntent: prev.accumulatedIntent + parseFloat(micropaymentAmount)
      }));
      
      // Add transaction
      setTransactions(prev => [
        {
          id: 'tx_' + Date.now(),
          type: 'intent',
          amount: parseFloat(micropaymentAmount),
          timestamp: new Date().toISOString(),
          signature: response.data.intent.signature || 'signature_' + Math.random().toString(36).substring(2, 10)
        },
        ...prev
      ]);
      
      setSuccess(`Successfully added micropayment intent of ${micropaymentAmount} SOL`);
      setLoadingAction(false);
      
    } catch (err) {
      console.error('Error adding micropayment intent:', err);
      setError(err.response?.data?.message || 'Failed to add micropayment intent');
      setLoadingAction(false);
    }
  };

  const processProbabilisticPayment = async () => {
    try {
      setLoadingAction(true);
      setError(null);
      setSuccess(null);
      
      // API call to process probabilistic payment
      const response = await axios.post(`${API_URL}/channel/${channelId}/process`);
      
      // For demonstration purposes, let's simulate probabilistic behavior
      // In a real implementation, this would be determined by the smart contract
      const paymentExecuted = Math.random() < 0.1; // 10% chance of payment execution
      
      if (paymentExecuted) {
        // Update channel in localStorage for demo
        const storedChannels = JSON.parse(localStorage.getItem('powerpay_channels') || '[]');
        const updatedChannels = storedChannels.map(c => {
          if (c.id === channelId) {
            return {
              ...c,
              paidAmount: c.paidAmount + c.accumulatedIntent,
              accumulatedIntent: 0
            };
          }
          return c;
        });
        localStorage.setItem('powerpay_channels', JSON.stringify(updatedChannels));
        
        // Update channel state
        setChannel(prev => ({
          ...prev,
          paidAmount: prev.paidAmount + prev.accumulatedIntent,
          accumulatedIntent: 0
        }));
        
        // Add transaction
        setTransactions(prev => [
          {
            id: 'tx_' + Date.now(),
            type: 'payment_executed',
            amount: channel.accumulatedIntent,
            timestamp: new Date().toISOString(),
            signature: response.data?.payment?.signature || 'signature_' + Math.random().toString(36).substring(2, 10)
          },
          ...prev
        ]);
        
        setSuccess(`Payment executed! ${channel.accumulatedIntent} SOL has been transferred to the payee.`);
      } else {
        // Add transaction
        setTransactions(prev => [
          {
            id: 'tx_' + Date.now(),
            type: 'payment_skipped',
            amount: 0,
            timestamp: new Date().toISOString(),
            signature: response.data?.payment?.signature || 'signature_' + Math.random().toString(36).substring(2, 10)
          },
          ...prev
        ]);
        
        setSuccess('Payment processing attempt completed. Payment was not executed this time (probabilistic mechanism).');
      }
      
      setLoadingAction(false);
      
    } catch (err) {
      console.error('Error processing probabilistic payment:', err);
      setError(err.response?.data?.message || 'Failed to process probabilistic payment');
      setLoadingAction(false);
    }
  };

  const closeChannel = async () => {
    try {
      setLoadingAction(true);
      setError(null);
      setSuccess(null);
      
      // API call to close channel
      const response = await axios.post(`${API_URL}/channel/${channelId}/close`);
      
      // Update channel in localStorage for demo
      const storedChannels = JSON.parse(localStorage.getItem('powerpay_channels') || '[]');
      const updatedChannels = storedChannels.map(c => {
        if (c.id === channelId) {
          return {
            ...c,
            status: 'closed',
            paidAmount: c.paidAmount + c.accumulatedIntent,
            accumulatedIntent: 0,
            closedAt: new Date().toISOString()
          };
        }
        return c;
      });
      localStorage.setItem('powerpay_channels', JSON.stringify(updatedChannels));
      
      // Update channel state
      setChannel(prev => ({
        ...prev,
        status: 'closed',
        paidAmount: prev.paidAmount + prev.accumulatedIntent,
        accumulatedIntent: 0,
        closedAt: new Date().toISOString()
      }));
      
      // Add transaction
      setTransactions(prev => [
        {
          id: 'tx_' + Date.now(),
          type: 'close',
          amount: channel.accumulatedIntent,
          timestamp: new Date().toISOString(),
          signature: response.data?.channel?.signature || 'signature_' + Math.random().toString(36).substring(2, 10)
        },
        ...prev
      ]);
      
      setSuccess('Payment channel closed successfully');
      setShowModal(false);
      setLoadingAction(false);
      
    } catch (err) {
      console.error('Error closing payment channel:', err);
      setError(err.response?.data?.message || 'Failed to close payment channel');
      setLoadingAction(false);
    }
  };

  // Format address for display
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 8)}...${addr.substring(addr.length - 8)}`;
  };

  // Get wallet name if available
  const getWalletName = (address) => {
    const wallet = wallets.find(w => w.address === address);
    return wallet ? wallet.name : formatAddress(address);
  };

  // Format transaction for display
  const formatTransaction = (tx) => {
    switch (tx.type) {
      case 'create':
        return `Channel created with ${tx.amount} SOL`;
      case 'intent':
        return `Added micropayment intent of ${tx.amount} SOL`;
      case 'payment_executed':
        return `Payment executed: ${tx.amount} SOL transferred to payee`;
      case 'payment_skipped':
        return `Payment processing attempt (payment skipped)`;
      case 'close':
        return `Channel closed, remaining ${tx.amount} SOL settled`;
      default:
        return `Transaction: ${tx.type}`;
    }
  };

  return (
    <div className="channel-details">
      <h1 className="mb-4">Payment Channel</h1>
      
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
          {success}
        </Alert>
      )}
      
      {loading ? (
        <div className="text-center p-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3">Loading channel details...</p>
        </div>
      ) : channel ? (
        <>
          <Card className="mb-4">
            <Card.Body>
              <Row>
                <Col lg={8}>
                  <div className="d-flex align-items-center mb-3">
                    <h4 className="mb-0 me-2">
                      Channel {formatAddress(channel.id)}
                    </h4>
                    {channel.status === 'active' ? (
                      <Badge bg="success">Active</Badge>
                    ) : (
                      <Badge bg="secondary">Closed</Badge>
                    )}
                  </div>
                  
                  <div className="mb-3">
                    <div className="text-muted mb-1">Payer:</div>
                    <div className="fw-bold mb-2">
                      {getWalletName(channel.payer)}
                    </div>
                    
                    <div className="text-muted mb-1">Payee:</div>
                    <div className="fw-bold">
                      {getWalletName(channel.payee)}
                    </div>
                  </div>
                  
                  {channel.status === 'active' && (
                    <div className="d-flex flex-wrap gap-2 mt-3">
                      <Button 
                        variant="warning" 
                        onClick={() => setShowModal(true)}
                        disabled={loadingAction}
                      >
                        Close Channel
                      </Button>
                    </div>
                  )}
                </Col>
                <Col lg={4} className="mt-3 mt-lg-0">
                  <div className="p-3 bg-light rounded mb-3">
                    <div className="mb-2">
                      <div className="text-muted">Total Amount:</div>
                      <div className="fs-4 fw-bold">{channel.totalAmount} SOL</div>
                    </div>
                    
                    <div className="mb-2">
                      <div className="text-muted">Paid Amount:</div>
                      <div className="fs-5">{channel.paidAmount} SOL</div>
                    </div>
                    
                    {channel.status === 'active' && (
                      <div>
                        <div className="text-muted">Accumulated Intent:</div>
                        <div className="fs-5">{channel.accumulatedIntent} SOL</div>
                      </div>
                    )}
                  </div>
                  
                  {channel.status === 'active' && (
                    <div className="progress mb-2">
                      <div 
                        className="progress-bar bg-success" 
                        role="progressbar"
                        style={{ width: `${(channel.paidAmount / channel.totalAmount) * 100}%` }}
                        aria-valuenow={(channel.paidAmount / channel.totalAmount) * 100}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      >
                        {Math.round((channel.paidAmount / channel.totalAmount) * 100)}%
                      </div>
                    </div>
                  )}
                </Col>
              </Row>
            </Card.Body>
          </Card>
          
          {channel.status === 'active' && (
            <Row className="mb-4">
              <Col md={6}>
                <Card>
                  <Card.Header>Add Micropayment Intent</Card.Header>
                  <Card.Body>
                    <p>Add a micropayment intent to the channel.</p>
                    <InputGroup className="mb-3">
                      <Form.Control
                        type="number"
                        min="0.0001"
                        step="0.0001"
                        value={micropaymentAmount}
                        onChange={(e) => setMicropaymentAmount(e.target.value)}
                        disabled={loadingAction}
                      />
                      <InputGroup.Text>SOL</InputGroup.Text>
                    </InputGroup>
                    <Button
                      variant="primary"
                      onClick={addMicropaymentIntent}
                      disabled={loadingAction}
                      className="w-100"
                    >
                      {loadingAction ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-2"
                          />
                          Processing...
                        </>
                      ) : (
                        'Add Micropayment Intent'
                      )}
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6} className="mt-3 mt-md-0">
                <Card>
                  <Card.Header>Process Probabilistic Payment</Card.Header>
                  <Card.Body>
                    <p>
                      Process accumulated micropayment intents using the probabilistic
                      payment mechanism. There's a small chance the payment will be executed
                      on each attempt.
                    </p>
                    <Button
                      variant="success"
                      onClick={processProbabilisticPayment}
                      disabled={loadingAction || channel.accumulatedIntent <= 0}
                      className="w-100"
                    >
                      {loadingAction ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-2"
                          />
                          Processing...
                        </>
                      ) : (
                        'Process Probabilistic Payment'
                      )}
                    </Button>
                    {channel.accumulatedIntent <= 0 && (
                      <small className="text-muted d-block mt-2">
                        Add micropayment intent first to enable processing.
                      </small>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
          
          <Card>
            <Card.Header>Transaction History</Card.Header>
            <Card.Body>
              {transactions.length > 0 ? (
                <ListGroup variant="flush">
                  {transactions.map((tx) => (
                    <ListGroup.Item key={tx.id} className="d-flex justify-content-between align-items-start">
                      <div>
                        <div>
                          {formatTransaction(tx)}
                          {' '}
                          {tx.type === 'payment_executed' && (
                            <Badge bg="success" pill>Executed</Badge>
                          )}
                          {tx.type === 'payment_skipped' && (
                            <Badge bg="secondary" pill>Skipped</Badge>
                          )}
                        </div>
                        <small className="text-muted">
                          {new Date(tx.timestamp).toLocaleString()}
                        </small>
                        <small className="text-muted d-block">
                          Tx: {tx.signature}
                        </small>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <p className="text-center">No transactions found for this channel.</p>
              )}
            </Card.Body>
          </Card>
          
          <Modal show={showModal} onHide={() => setShowModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Close Payment Channel</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p>
                Are you sure you want to close this payment channel?
              </p>
              <p>
                This will settle all remaining funds and the channel will no longer
                be usable for payments.
              </p>
              {channel.accumulatedIntent > 0 && (
                <Alert variant="info">
                  There are {channel.accumulatedIntent} SOL in accumulated micropayment intents
                  that will be settled immediately when closing this channel.
                </Alert>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button 
                variant="danger" 
                onClick={closeChannel}
                disabled={loadingAction}
              >
                {loadingAction ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Closing...
                  </>
                ) : (
                  'Close Channel'
                )}
              </Button>
            </Modal.Footer>
          </Modal>
        </>
      ) : (
        <Alert variant="warning">
          Channel not found. The requested payment channel does not exist or has been removed.
        </Alert>
      )}
      
      <div className="mt-3">
        <Link to="/" className="btn btn-outline-secondary">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default ChannelDetails;
