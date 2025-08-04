import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Button, Alert, Spinner, ListGroup, Row, Col, Badge } from 'react-bootstrap';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const WalletDetails = () => {
  const { address } = useParams();
  const [wallet, setWallet] = useState(null);
  const [balance, setBalance] = useState(null);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch wallet details on component mount
  useEffect(() => {
    const fetchWalletDetails = async () => {
      try {
        setLoading(true);
        
        // In a real implementation, we'd fetch wallet details from the API
        // For now, we're using localStorage to simulate this
        const storedWallets = JSON.parse(localStorage.getItem('powerpay_wallets') || '[]');
        const foundWallet = storedWallets.find(w => w.address === address);
        
        if (!foundWallet) {
          setError('Wallet not found');
          setLoading(false);
          return;
        }
        
        setWallet(foundWallet);
        
        // Fetch wallet balance from API
        const balanceResponse = await axios.get(`${API_URL}/wallet/${address}/balance`);
        setBalance(balanceResponse.data.balance);
        
        // Get channels for this wallet
        const storedChannels = JSON.parse(localStorage.getItem('powerpay_channels') || '[]');
        const relatedChannels = storedChannels.filter(
          c => c.payer === address || c.payee === address
        );
        setChannels(relatedChannels);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching wallet details:', err);
        setError(err.response?.data?.message || 'Failed to load wallet details');
        setLoading(false);
      }
    };
    
    fetchWalletDetails();
  }, [address]);

  // Format address for display
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 8)}...${addr.substring(addr.length - 8)}`;
  };

  return (
    <div className="wallet-details">
      <h1 className="mb-4">Wallet Details</h1>
      
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <div className="text-center p-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3">Loading wallet details...</p>
        </div>
      ) : wallet ? (
        <>
          <Card className="mb-4">
            <Card.Body>
              <Row>
                <Col md={8}>
                  <h4>{wallet.name || 'PowerPay Wallet'}</h4>
                  <p className="text-muted text-break mb-1">
                    Address: {wallet.address}
                  </p>
                  <p className="text-muted mb-3">
                    Created: {new Date(wallet.createdAt).toLocaleString()}
                  </p>
                  
                  <div className="d-flex flex-wrap gap-2">
                    <Link to="/channel/create" className="btn btn-primary">
                      Create Payment Channel
                    </Link>
                    <Button variant="outline-secondary">
                      Request Airdrop
                    </Button>
                  </div>
                </Col>
                <Col md={4} className="text-md-end mt-3 mt-md-0">
                  <div className="p-3 bg-light rounded">
                    <p className="mb-1">Balance:</p>
                    <h2 className="mb-0">
                      {balance ? (
                        `${balance.sol} SOL`
                      ) : (
                        <small className="text-muted">Loading...</small>
                      )}
                    </h2>
                    {balance && (
                      <small className="text-muted">
                        {balance.lamports} lamports
                      </small>
                    )}
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
          
          <Card className="mb-4">
            <Card.Header as="h5">Payment Channels</Card.Header>
            <Card.Body>
              {channels.length > 0 ? (
                <ListGroup variant="flush">
                  {channels.map(channel => (
                    <ListGroup.Item key={channel.id} className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="fw-bold">
                          Channel {channel.id.substring(0, 6)}...
                          {' '}
                          {channel.status === 'active' ? (
                            <Badge bg="success" pill>Active</Badge>
                          ) : (
                            <Badge bg="secondary" pill>Closed</Badge>
                          )}
                        </div>
                        <div>
                          {channel.payer === address ? (
                            <>
                              <span className="text-muted">Paying to: </span>
                              <span>{formatAddress(channel.payee)}</span>
                            </>
                          ) : (
                            <>
                              <span className="text-muted">Receiving from: </span>
                              <span>{formatAddress(channel.payer)}</span>
                            </>
                          )}
                        </div>
                        <div>
                          <span className="text-muted">Amount: </span>
                          <span>{channel.paidAmount}/{channel.totalAmount} SOL</span>
                        </div>
                      </div>
                      <Link
                        to={`/channel/${channel.id}`}
                        className="btn btn-sm btn-outline-primary"
                      >
                        Details
                      </Link>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <div className="text-center p-4">
                  <p className="text-muted">No payment channels found for this wallet.</p>
                  <Link to="/channel/create" className="btn btn-primary">
                    Create a Payment Channel
                  </Link>
                </div>
              )}
            </Card.Body>
          </Card>
          
          <Card>
            <Card.Header as="h5">Recent Transactions</Card.Header>
            <Card.Body>
              <div className="text-center p-4">
                <p className="text-muted">No transactions found for this wallet.</p>
              </div>
            </Card.Body>
          </Card>
        </>
      ) : (
        <Alert variant="warning">
          Wallet not found. The requested wallet does not exist or has been removed.
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

export default WalletDetails;
