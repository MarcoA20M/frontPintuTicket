import React from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MainContent from './components/MainContent';
import './components/App.css';

function App() {
  return (
    <div className="container">
      <Sidebar />
      <div className="main-content-wrapper">
        <Header />
        <MainContent />
      </div>
    </div>
  );
}

export default App;