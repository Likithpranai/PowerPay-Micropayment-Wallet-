import React from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const location = useLocation();
  
  // Check if the current path matches the link
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <Navbar bg="white" expand="lg" className="navbar-shadow py-3 mb-4" sticky="top">
      <Container>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <div className="brand-logo me-2">
            <svg width="32" height="32" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 0L39.1747 10.5V31.5L21 42L2.82531 31.5V10.5L21 0Z" fill="#5646FF" />
              <path d="M30 15.75L21 21L12 15.75L21 10.5L30 15.75Z" fill="white" />
              <path d="M21 21L30 26.25L21 31.5L12 26.25L21 21Z" fill="white" />
            </svg>
          </div>
          <div>
            <span className="text-brand fw-bold fs-4">PowerPay</span>
            <span className="badge bg-primary ms-2 fw-normal">Beta</span>
          </div>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center">
            <Nav.Link 
              as={Link} 
              to="/" 
              className={`mx-1 px-3 py-2 ${isActive('/') ? 'nav-active' : ''}`}
            >
              Dashboard
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/wallet/create" 
              className={`mx-1 px-3 py-2 ${isActive('/wallet/create') ? 'nav-active' : ''}`}
            >
              Create Wallet
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/channel/create" 
              className={`mx-1 px-3 py-2 ${isActive('/channel/create') ? 'nav-active' : ''}`}
            >
              Create Channel
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/about" 
              className={`mx-1 px-3 py-2 ${isActive('/about') ? 'nav-active' : ''}`}
            >
              About
            </Nav.Link>
            <div className="ms-2">
              <Button 
                as="a" 
                href="https://github.com/solana-labs" 
                target="_blank" 
                variant="outline-primary" 
                size="sm" 
                className="ms-2 d-none d-md-inline-block"
              >
                GitHub
              </Button>
            </div>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;
