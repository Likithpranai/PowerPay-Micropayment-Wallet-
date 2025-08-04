import React from 'react';
import { Container } from 'react-bootstrap';

const Footer = () => {
  return (
    <footer className="bg-light py-3 mt-auto">
      <Container>
        <div className="d-flex flex-wrap justify-content-between align-items-center">
          <div className="col-md-4 mb-2 mb-md-0">
            <span className="text-muted">
              &copy; {new Date().getFullYear()} PowerPay Wallet
            </span>
          </div>
          <div className="col-md-4 d-flex justify-content-md-center mb-2 mb-md-0">
            <span className="text-muted">Built on Solana Blockchain</span>
          </div>
          <div className="col-md-4 d-flex justify-content-md-end">
            <ul className="nav">
              <li className="nav-item">
                <a href="https://github.com/solana-labs" className="nav-link px-2 text-muted" target="_blank" rel="noopener noreferrer">
                  GitHub
                </a>
              </li>
              <li className="nav-item">
                <a href="https://solana.com" className="nav-link px-2 text-muted" target="_blank" rel="noopener noreferrer">
                  Solana
                </a>
              </li>
              <li className="nav-item">
                <a href="https://discord.gg/solana" className="nav-link px-2 text-muted" target="_blank" rel="noopener noreferrer">
                  Discord
                </a>
              </li>
            </ul>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
