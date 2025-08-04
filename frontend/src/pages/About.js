import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';

const About = () => {
  return (
    <div className="about">
      <h1 className="mb-4">About PowerPay</h1>
      
      <Card className="mb-4">
        <Card.Body>
          <h3 className="mb-3">The Future of Micropayments</h3>
          <p className="lead">
            PowerPay is a revolutionary blockchain-based digital wallet designed to make 
            micropayments efficient, cost-effective, and scalable on the Solana blockchain.
          </p>
          <p>
            Traditional blockchain payment systems struggle with handling small-value 
            transactions due to transaction fees and network congestion. PowerPay solves 
            this problem through a probabilistic payment mechanism that significantly 
            increases transaction throughput while statistically guaranteeing accurate payments.
          </p>
        </Card.Body>
      </Card>
      
      <h3 className="mb-3">How PowerPay Works</h3>
      
      <Row className="mb-4">
        <Col md={4} className="mb-3 mb-md-0">
          <Card className="h-100">
            <Card.Body>
              <h4>1. Payment Channels</h4>
              <p>
                Users create payment channels between payer and payee, locking funds 
                that can be transferred through a series of micropayments over time.
              </p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4} className="mb-3 mb-md-0">
          <Card className="h-100">
            <Card.Body>
              <h4>2. Micropayment Intents</h4>
              <p>
                Instead of executing every small payment on-chain, users accumulate 
                "micropayment intents" within the payment channel off-chain.
              </p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="h-100">
            <Card.Body>
              <h4>3. Probabilistic Execution</h4>
              <p>
                Payments are executed on-chain with a probability proportional to the 
                accumulated amount, reducing the number of on-chain transactions while 
                statistically ensuring accurate payments.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Card className="mb-4">
        <Card.Body>
          <h3 className="mb-3">The Probabilistic Advantage</h3>
          <p>
            When you make a micropayment intent for, say, 0.001 SOL, the payment isn't 
            immediately processed on-chain. Instead, it's accumulated with other micropayment 
            intents. Each time you process payments, there's a probability the entire 
            accumulated amount will be transferred.
          </p>
          <p>
            For example, if you've accumulated 0.01 SOL in micropayment intents, there might be 
            a 10% chance that a 0.1 SOL payment will be executed. Over time, the expected value 
            of payments matches the intents, but with fewer actual blockchain transactions.
          </p>
          <p>
            This approach offers several benefits:
          </p>
          <ul>
            <li>Reduced transaction fees (up to 70% savings)</li>
            <li>Increased throughput (up to 3x improvement)</li>
            <li>Decreased blockchain congestion</li>
            <li>Support for true micropayments (fractions of a cent)</li>
          </ul>
        </Card.Body>
      </Card>
      
      <Row>
        <Col md={6} className="mb-3 mb-md-0">
          <Card className="h-100">
            <Card.Body>
              <h3>Use Cases</h3>
              <ul className="list-unstyled">
                <li className="mb-2">✅ <strong>Content Streaming</strong> - Pay per second of video watched</li>
                <li className="mb-2">✅ <strong>Gaming Microtransactions</strong> - In-game purchases and rewards</li>
                <li className="mb-2">✅ <strong>API Consumption</strong> - Pay-per-call API services</li>
                <li className="mb-2">✅ <strong>Creator Tips</strong> - Micropayments to content creators</li>
                <li className="mb-2">✅ <strong>Usage-based Services</strong> - Pay only for what you use</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="h-100">
            <Card.Body>
              <h3>Technical Implementation</h3>
              <p>
                PowerPay is built on the following technology stack:
              </p>
              <ul>
                <li><strong>Blockchain</strong>: Solana (for high throughput and low fees)</li>
                <li><strong>Smart Contract</strong>: Rust-based Solana program</li>
                <li><strong>Backend</strong>: Node.js with Express</li>
                <li><strong>Frontend</strong>: React with Bootstrap</li>
                <li><strong>Storage</strong>: Secure wallet and channel management</li>
              </ul>
              <p>
                The smart contract implements secure random number generation for 
                probabilistic payment decisions, and the backend provides a 
                user-friendly API for wallet and channel management.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default About;
