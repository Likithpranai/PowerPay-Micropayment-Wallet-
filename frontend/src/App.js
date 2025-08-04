import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import './App.css';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import CreateWallet from './pages/CreateWallet';
import WalletDetails from './pages/WalletDetails';
import CreateChannel from './pages/CreateChannel';
import ChannelDetails from './pages/ChannelDetails';
import About from './pages/About';

function App() {
  return (
    <div className="app-container d-flex flex-column min-vh-100">
      <Header />
      
      <Container className="flex-grow-1 py-4">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/wallet/create" element={<CreateWallet />} />
          <Route path="/wallet/:address" element={<WalletDetails />} />
          <Route path="/channel/create" element={<CreateChannel />} />
          <Route path="/channel/:channelId" element={<ChannelDetails />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Container>
      
      <Footer />
    </div>
  );
}

export default App;
