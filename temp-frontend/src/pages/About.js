import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';

const About = () => {
  return (
    <div className="about-page">
      <h1 className="mb-4">About PowerPay</h1>
      
      <Card className="mb-4">
        <Card.Body>
          <h2 className="mb-3">Revolutionizing Micropayments on Solana</h2>
          <p className="lead">
            PowerPay is a next-generation blockchain-based digital wallet that implements
            a revolutionary probabilistic payment model to increase transaction throughput
            for micropayments on the Solana blockchain.
          </p>
          <p>
            By leveraging probability theory and statistics, PowerPay can reduce on-chain
            transaction costs while still ensuring that payees receive their correct payment
            amounts over time. This approach dramatically increases transaction throughput by
            up to 3x compared to traditional blockchain payments.
          </p>
        </Card.Body>
      </Card>
      
      <Row className="mb-4">
        <Col md={6} className="mb-3 mb-md-0">
          <Card className="h-100">
            <Card.Header>
              <h3 className="h5 mb-0">How It Works</h3>
            </Card.Header>
            <Card.Body>
              <h4>1. Create a Wallet</h4>
              <p>
                Start by creating a Solana-compatible wallet through the PowerPay platform.
                This wallet will hold your funds and manage your payment channels.
              </p>
              
              <h4>2. Establish Payment Channels</h4>
              <p>
                Create payment channels with your chosen recipients. These channels lock a
                predetermined amount of funds for use with that specific recipient.
              </p>
              
              <h4>3. Micropayment Intents</h4>
              <p>
                As you consume services or content, add micropayment intents to the channel.
                These intents represent your commitment to pay small amounts to the recipient.
              </p>
              
              <h4>4. Probabilistic Processing</h4>
              <p>
                When you choose to process payments, the system uses a probabilistic mechanism:
                if you've accumulated 1 SOL in intents, instead of processing it directly
                (which would incur transaction fees), the system has a 10% chance of paying
                10 SOL, resulting in the correct expected value of 1 SOL over time.
              </p>
              
              <h4>5. Channel Settlement</h4>
              <p>
                When you're done, close the channel to settle any remaining funds and
                finalize all transactions on the Solana blockchain.
              </p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="h-100">
            <Card.Header>
              <h3 className="h5 mb-0">Benefits</h3>
            </Card.Header>
            <Card.Body>
              <h4>Increased Efficiency</h4>
              <p>
                By batching micropayments and using probabilistic execution, PowerPay
                reduces the number of on-chain transactions needed, decreasing network
                congestion and fees.
              </p>
              
              <h4>Lower Transaction Costs</h4>
              <p>
                Fewer blockchain transactions mean lower overall fees, making micropayments
                economically viable even for amounts as small as fractions of a cent.
              </p>
              
              <h4>Higher Throughput</h4>
              <p>
                Our tests show up to 3x increase in effective transaction throughput
                compared to traditional payment methods on Solana.
              </p>
              
              <h4>Statistical Fairness</h4>
              <p>
                While individual payments may vary, the law of large numbers ensures
                that recipients receive statistically correct payment amounts over time.
              </p>
              
              <h4>Solana Integration</h4>
              <p>
                Built on the Solana blockchain, PowerPay benefits from fast transaction
                speeds and low base fees while adding our probabilistic layer for even
                greater efficiency.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Card className="mb-4">
        <Card.Header>
          <h3 className="h5 mb-0">Use Cases</h3>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4} className="mb-3">
              <h4>Content Creators</h4>
              <p>
                Enable pay-per-view or pay-per-second content consumption without
                prohibitive transaction fees eating into earnings.
              </p>
            </Col>
            <Col md={4} className="mb-3">
              <h4>Subscription Services</h4>
              <p>
                Implement truly usage-based billing with fair, granular pricing
                that accurately reflects actual consumption.
              </p>
            </Col>
            <Col md={4} className="mb-3">
              <h4>Micro-tipping</h4>
              <p>
                Allow users to reward content they enjoy with small tips that
                would otherwise be impractical due to transaction costs.
              </p>
            </Col>
          </Row>
          <Row>
            <Col md={4} className="mb-3">
              <h4>API & Data Services</h4>
              <p>
                Pay only for the exact API calls or data used, with no minimum
                transaction amounts or monthly commitments.
              </p>
            </Col>
            <Col md={4} className="mb-3">
              <h4>Gaming & Virtual Economies</h4>
              <p>
                Enable in-game micropayments and transactions without disrupting
                gameplay with constant wallet confirmations.
              </p>
            </Col>
            <Col md={4}>
              <h4>IoT & Machine Payments</h4>
              <p>
                Allow devices to autonomously make micropayments for services
                or resources they consume in real-time.
              </p>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      <Card>
        <Card.Header>
          <h3 className="h5 mb-0">Technical Stack</h3>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4} className="mb-3 mb-md-0">
              <h4>Smart Contract</h4>
              <ul>
                <li>Solana Blockchain</li>
                <li>Rust Programming Language</li>
                <li>Solana Program Library (SPL)</li>
              </ul>
            </Col>
            <Col md={4} className="mb-3 mb-md-0">
              <h4>Backend</h4>
              <ul>
                <li>Node.js</li>
                <li>Express.js</li>
                <li>Solana Web3.js SDK</li>
              </ul>
            </Col>
            <Col md={4}>
              <h4>Frontend</h4>
              <ul>
                <li>React.js</li>
                <li>Bootstrap</li>
                <li>Axios for API communication</li>
              </ul>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </div>
  );
};

export default About;
