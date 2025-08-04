import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Alert, ListGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const Dashboard = () => {
  const [wallets, setWallets] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch wallet and channel data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // In a real implementation, we would fetch wallets from local storage or backend
        // For demo purposes, we'll check if there's a wallet in localStorage
        const storedWallets = localStorage.getItem('powerpay_wallets');
        const walletList = storedWallets ? JSON.parse(storedWallets) : [];
        setWallets(walletList);
        
        // If we have wallets, fetch channels for those wallets
        if (walletList.length > 0) {
          // Simulated channel data for now
          // In a real implementation, we would fetch from backend API
          const channelList = localStorage.getItem('powerpay_channels');
          setChannels(channelList ? JSON.parse(channelList) : []);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  return (
    <div className="dashboard">
      <h1 className="mb-4">PowerPay Dashboard</h1>
      
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      
      <Row className="mb-4">
        <Col md={6}>
          <Card className="h-100">
            <Card.Header as="h5">My Wallets</Card.Header>
            <Card.Body>
              {loading ? (
                <p>Loading wallets...</p>
              ) : wallets.length > 0 ? (
                <ListGroup variant="flush">
                  {wallets.map((wallet) => (
                    <ListGroup.Item key={wallet.address} className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="fw-bold">{wallet.name || 'Wallet'}</div>
                        <small className="text-muted">{wallet.address.substring(0, 8)}...{wallet.address.substring(wallet.address.length - 8)}</small>
                      </div>
                      <Link to={`/wallet/${wallet.address}`} className="btn btn-sm btn-outline-primary">
                        Details
                      </Link>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <div className="text-center">
                  <p>No wallets found.</p>
                  <Link to="/wallet/create" className="btn btn-primary">
                    Create a Wallet
                  </Link>
                </div>
              )}
            </Card.Body>
            {wallets.length > 0 && (
              <Card.Footer>
                <Link to="/wallet/create" className="btn btn-primary btn-sm">
                  Create New Wallet
                </Link>
              </Card.Footer>
            )}
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="h-100">
            <Card.Header as="h5">Payment Channels</Card.Header>
            <Card.Body>
              {loading ? (
                <p>Loading channels...</p>
              ) : channels.length > 0 ? (
                <ListGroup variant="flush">
                  {channels.map((channel) => (
                    <ListGroup.Item key={channel.id} className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="fw-bold">Channel {channel.id.substring(0, 6)}...</div>
                        <small className="text-muted">
                          {channel.status === 'active' ? (
                            <span className="text-success">● Active</span>
                          ) : (
                            <span className="text-secondary">● Closed</span>
                          )}
                          {' | '}
                          Paid: {channel.paidAmount}/{channel.totalAmount} SOL
                        </small>
                      </div>
                      <Link to={`/channel/${channel.id}`} className="btn btn-sm btn-outline-primary">
                        Details
                      </Link>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <div className="text-center">
                  <p>No payment channels found.</p>
                  {wallets.length > 0 ? (
                    <Link to="/channel/create" className="btn btn-primary">
                      Create a Channel
                    </Link>
                  ) : (
                    <p className="text-muted">Create a wallet first to create payment channels.</p>
                  )}
                </div>
              )}
            </Card.Body>
            {wallets.length > 0 && channels.length > 0 && (
              <Card.Footer>
                <Link to="/channel/create" className="btn btn-primary btn-sm">
                  Create New Channel
                </Link>
              </Card.Footer>
            )}
          </Card>
        </Col>
      </Row>
      
      <Card>
        <Card.Header as="h5">Probabilistic Payment Statistics</Card.Header>
        <Card.Body>
          <Row>
            <Col md={4}>
              <Card className="text-center mb-3">
                <Card.Body>
                  <h3 className="fs-2">0</h3>
                  <p className="text-muted">Total Transactions</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="text-center mb-3">
                <Card.Body>
                  <h3 className="fs-2">0 SOL</h3>
                  <p className="text-muted">Total Volume</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="text-center mb-3">
                <Card.Body>
                  <h3 className="fs-2">0%</h3>
                  <p className="text-muted">Fee Savings</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          <p className="text-center mt-3">
            PowerPay's probabilistic payment mechanism has saved you 0 SOL in transaction fees.
          </p>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Dashboard;
