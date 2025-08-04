import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';

// Import Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';

// Import custom CSS
import './App.css';
import './PowerPayStyles.css';

// Import components
import Header from './components/Header';
import Footer from './components/Footer';

// Import pages
import Dashboard from './pages/Dashboard';
import CreateWallet from './pages/CreateWallet';
import WalletDetails from './pages/WalletDetails';
import CreateChannel from './pages/CreateChannel';
import ChannelDetails from './pages/ChannelDetails';
import About from './pages/About';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Header />
        
        <main className="main-content">
          <Container>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/wallet/create" element={<CreateWallet />} />
              <Route path="/wallet/:address" element={<WalletDetails />} />
              <Route path="/channel/create" element={<CreateChannel />} />
              <Route path="/channel/:channelId" element={<ChannelDetails />} />
              <Route path="/about" element={<About />} />
            </Routes>
          </Container>
        </main>
        
        <Footer />
      </div>
    </Router>
  );
}

export default App;
