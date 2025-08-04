import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Alert, ListGroup, Badge } from 'react-bootstrap';
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
    <div className="dashboard fadeIn">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Dashboard</h1>
        
        <div>
          {wallets.length > 0 && (
            <Link to="/wallet/create" className="btn btn-primary me-2">
              <i className="bi bi-plus"></i> New Wallet
            </Link>
          )}
          {wallets.length > 0 && (
            <Link to="/channel/create" className="btn btn-outline-primary">
              <i className="bi bi-plus"></i> New Channel
            </Link>
          )}
        </div>
      </div>
      
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      
      {!loading && wallets.length === 0 && (
        <Card className="text-center welcome-card mb-4">
          <Card.Body className="p-5">
            <div className="mb-4">
              <svg width="80" height="80" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 0L39.1747 10.5V31.5L21 42L2.82531 31.5V10.5L21 0Z" fill="#5646FF" />
                <path d="M30 15.75L21 21L12 15.75L21 10.5L30 15.75Z" fill="white" />
                <path d="M21 21L30 26.25L21 31.5L12 26.25L21 21Z" fill="white" />
              </svg>
            </div>
            <h2 className="mb-3">Welcome to PowerPay!</h2>
            <p className="lead mb-4">
              Get started by creating your first Solana wallet with PowerPay's probabilistic payment mechanism.
            </p>
            <Link to="/wallet/create" className="btn btn-lg btn-primary">
              Create Your First Wallet
            </Link>
            <div className="mt-3">
              <Link to="/about" className="text-decoration-none">
                Learn more about PowerPay
              </Link>
            </div>
          </Card.Body>
        </Card>
      )}
      
      {wallets.length > 0 && (
        <Row className="mb-4 gx-4">
          <Col md={6} lg={7}>
            <Card className="h-100">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">My Wallets</h5>
                <Link to="/wallet/create" className="btn btn-sm btn-outline-primary">New</Link>
              </Card.Header>
              <Card.Body className="p-0">
                {loading ? (
                  <div className="text-center p-4">
                    <div className="spinner-border text-primary spinner-border-sm me-2" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <span>Loading wallets...</span>
                  </div>
                ) : wallets.length > 0 ? (
                  <ListGroup variant="flush">
                    {wallets.map((wallet) => (
                      <ListGroup.Item key={wallet.address} className="d-flex justify-content-between align-items-center py-3">
                        <div>
                          <div className="d-flex align-items-center">
                            <div className="wallet-icon me-2 rounded-circle bg-primary bg-opacity-10 p-2">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19.3 7.9H4.7C3.2 7.9 2 9.1 2 10.6V17.4C2 18.9 3.2 20.1 4.7 20.1H19.3C20.8 20.1 22 18.9 22 17.4V10.6C22 9.1 20.8 7.9 19.3 7.9Z" stroke="#5646FF" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M19.3 7.9C20.8 7.9 22 6.7 22 5.2V4.5C22 3 20.8 1.8 19.3 1.8H4.7C3.2 1.8 2 3 2 4.5V5.2C2 6.7 3.2 7.9 4.7 7.9" stroke="#5646FF" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M16.5 14H19.3" stroke="#5646FF" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                            <div>
                              <div className="fw-bold">{wallet.name || 'Wallet'}</div>
                              <div className="text-muted small">{wallet.address.substring(0, 8)}...{wallet.address.substring(wallet.address.length - 8)}</div>
                            </div>
                          </div>
                        </div>
                        <Link to={`/wallet/${wallet.address}`} className="btn btn-sm btn-outline-primary">
                          View Details
                        </Link>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                ) : null}
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={6} lg={5}>
            <Card className="h-100">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Payment Channels</h5>
                {wallets.length > 0 && (
                  <Link to="/channel/create" className="btn btn-sm btn-outline-primary">New</Link>
                )}
              </Card.Header>
              <Card.Body className="p-0">
                {loading ? (
                  <div className="text-center p-4">
                    <div className="spinner-border text-primary spinner-border-sm me-2" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <span>Loading channels...</span>
                  </div>
                ) : channels.length > 0 ? (
                  <ListGroup variant="flush">
                    {channels.map((channel) => (
                      <ListGroup.Item key={channel.id} className="d-flex justify-content-between align-items-center py-3">
                        <div>
                          <div className="d-flex align-items-center">
                            <div className="channel-icon me-2 rounded-circle bg-success bg-opacity-10 p-2">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8.7 10.7H15.3C16.7 10.7 17.5 9.9 17.5 8.5V5.3C17.5 3.9 16.7 3.1 15.3 3.1H8.7C7.3 3.1 6.5 3.9 6.5 5.3V8.5C6.5 9.9 7.3 10.7 8.7 10.7Z" stroke="#5646FF" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M8.7 20.9H15.3C16.7 20.9 17.5 20.1 17.5 18.7V15.5C17.5 14.1 16.7 13.3 15.3 13.3H8.7C7.3 13.3 6.5 14.1 6.5 15.5V18.7C6.5 20.1 7.3 20.9 8.7 20.9Z" stroke="#5646FF" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M6.7 7H3.5" stroke="#5646FF" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M6.7 17H3.5" stroke="#5646FF" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M20.5 7H17.3" stroke="#5646FF" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M20.5 17H17.3" stroke="#5646FF" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                            <div>
                              <div className="fw-bold d-flex align-items-center">
                                Channel {channel.id.substring(0, 6)}...
                                {channel.status === 'active' ? (
                                  <Badge bg="success" className="ms-2">Active</Badge>
                                ) : (
                                  <Badge bg="secondary" className="ms-2">Closed</Badge>
                                )}
                              </div>
                              <div className="text-muted small">
                                Paid: {channel.paidAmount}/{channel.totalAmount} SOL
                              </div>
                            </div>
                          </div>
                        </div>
                        <Link to={`/channel/${channel.id}`} className="btn btn-sm btn-outline-primary">
                          View
                        </Link>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                ) : (
                  <div className="text-center p-4">
                    <p className="text-muted">No payment channels found.</p>
                    {wallets.length > 0 && (
                      <Link to="/channel/create" className="btn btn-outline-primary btn-sm">
                        Create First Channel
                      </Link>
                    )}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
      
      {wallets.length > 0 && (
        <Row>
          <Col md={12}>
            <Card className="stats-card">
              <Card.Header>
                <h5 className="mb-0">Probabilistic Payment Statistics</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={4}>
                    <Card className="stat-card text-center mb-3 border-0 shadow-sm">
                      <Card.Body className="py-4">
                        <div className="stat-icon mb-3 rounded-circle bg-primary bg-opacity-10 mx-auto">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="#5646FF" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M7.75 12L10.58 14.83L16.25 9.17" stroke="#5646FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <h3 className="fs-2 fw-bold mb-0">0</h3>
                        <p className="text-muted mb-0">Total Transactions</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={4}>
                    <Card className="stat-card text-center mb-3 border-0 shadow-sm">
                      <Card.Body className="py-4">
                        <div className="stat-icon mb-3 rounded-circle bg-primary bg-opacity-10 mx-auto">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9.5 13.75C9.5 14.72 10.25 15.5 11.17 15.5H13.05C13.85 15.5 14.5 14.82 14.5 13.97C14.5 13.06 14.1 12.73 13.51 12.52L10.5 11.47C9.91 11.26 9.51001 10.94 9.51001 10.02C9.51001 9.18 10.16 8.49001 10.96 8.49001H12.84C13.76 8.49001 14.51 9.27001 14.51 10.24" stroke="#5646FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 7.5V16.5" stroke="#5646FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2C17.52 2 22 6.48 22 12Z" stroke="#5646FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <h3 className="fs-2 fw-bold mb-0">0 SOL</h3>
                        <p className="text-muted mb-0">Total Volume</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={4}>
                    <Card className="stat-card text-center mb-3 border-0 shadow-sm">
                      <Card.Body className="py-4">
                        <div className="stat-icon mb-3 rounded-circle bg-primary bg-opacity-10 mx-auto">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22 6V8.42C22 10 21 11 19.42 11H16V4.01C16 2.9 16.91 2 18.02 2C19.11 2.01 20.11 2.45 20.83 3.17C21.55 3.9 22 4.9 22 6Z" stroke="#5646FF" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M2 7V21C2 21.83 2.93999 22.3 3.59999 21.8L5.31 20.52C5.71 20.22 6.27 20.26 6.63 20.62L8.28999 22.29C8.67999 22.68 9.32001 22.68 9.71001 22.29L11.39 20.61C11.74 20.26 12.3 20.22 12.69 20.52L14.4 21.8C15.06 22.29 16 21.82 16 21V4C16 2.9 16.9 2 18 2H7H6C3 2 2 3.79 2 6V7Z" stroke="#5646FF" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M9 13.01H12" stroke="#5646FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M9 9.01001H12" stroke="#5646FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M5.99561 13H6.00459" stroke="#5646FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M5.99561 9H6.00459" stroke="#5646FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <h3 className="fs-2 fw-bold mb-0">0%</h3>
                        <p className="text-muted mb-0">Fee Savings</p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
                <div className="text-center mt-3">
                  <p className="mb-0 text-muted">
                    PowerPay's probabilistic payment mechanism is ready to save you transaction fees.
                    Start making micropayments to see your savings grow!
                  </p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default Dashboard;
