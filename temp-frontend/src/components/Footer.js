import React from 'react';
import { Container, Row, Col, Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="py-4 mt-5">
      <Container>
        <Row className="align-items-center mb-4">
          <Col md={3} className="mb-3 mb-md-0">
            <div className="d-flex align-items-center">
              <div className="brand-logo me-2">
                <svg width="24" height="24" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 0L39.1747 10.5V31.5L21 42L2.82531 31.5V10.5L21 0Z" fill="#5646FF" fillOpacity="0.7" />
                  <path d="M30 15.75L21 21L12 15.75L21 10.5L30 15.75Z" fill="white" />
                  <path d="M21 21L30 26.25L21 31.5L12 26.25L21 21Z" fill="white" />
                </svg>
              </div>
              <span className="text-brand fw-bold fs-5">PowerPay</span>
            </div>
            <p className="text-muted small mt-2 mb-0">
              A blockchain-based micropayment wallet with probabilistic payment mechanism.
            </p>
          </Col>
          <Col xs={6} md={3} className="mb-3 mb-md-0">
            <h6 className="fw-bold mb-3">Navigation</h6>
            <Nav className="flex-column">
              <Nav.Link as={Link} to="/" className="ps-0 py-1">Dashboard</Nav.Link>
              <Nav.Link as={Link} to="/wallet/create" className="ps-0 py-1">Create Wallet</Nav.Link>
              <Nav.Link as={Link} to="/channel/create" className="ps-0 py-1">Create Channel</Nav.Link>
              <Nav.Link as={Link} to="/about" className="ps-0 py-1">About</Nav.Link>
            </Nav>
          </Col>
          <Col xs={6} md={3} className="mb-3 mb-md-0">
            <h6 className="fw-bold mb-3">Resources</h6>
            <Nav className="flex-column">
              <Nav.Link href="https://solana.com" target="_blank" rel="noopener noreferrer" className="ps-0 py-1">Solana</Nav.Link>
              <Nav.Link href="https://docs.solana.com" target="_blank" rel="noopener noreferrer" className="ps-0 py-1">Documentation</Nav.Link>
              <Nav.Link href="https://github.com/solana-labs" target="_blank" rel="noopener noreferrer" className="ps-0 py-1">GitHub</Nav.Link>
              <Nav.Link href="https://solana.com/developers" target="_blank" rel="noopener noreferrer" className="ps-0 py-1">Developers</Nav.Link>
            </Nav>
          </Col>
          <Col md={3}>
            <h6 className="fw-bold mb-3">Connect</h6>
            <div className="social-links">
              <a href="https://twitter.com/solana" target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-secondary me-2">
                Twitter
              </a>
              <a href="https://discord.com/invite/solana" target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-secondary me-2">
                Discord
              </a>
              <a href="https://www.reddit.com/r/solana" target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-secondary">
                Reddit
              </a>
            </div>
          </Col>
        </Row>
        <hr className="my-4" />
        <Row className="align-items-center">
          <Col md={6} className="mb-3 mb-md-0">
            <p className="text-muted mb-0">&copy; {new Date().getFullYear()} PowerPay. All rights reserved.</p>
          </Col>
          <Col md={6} className="text-md-end">
            <p className="text-muted mb-0">
              <small>Powered by <a href="https://solana.com" target="_blank" rel="noopener noreferrer">Solana</a> | 
              <span className="ms-2">Made with ❤️ for blockchain micropayments</span></small>
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
