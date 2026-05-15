import React, { useState } from 'react';
import CrawlerTab from './components/CrawlerTab';
import ManualTestTab from './components/ManualTestTab';

function App() {
  const [activeTab, setActiveTab] = useState('manual');

  return (
    <div className="container">
      <h1>API Tester Pro</h1>
      <p className="subtitle">Automated website crawling & Comprehensive API Testing</p>

      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'manual' ? 'active' : ''}`}
          onClick={() => setActiveTab('manual')}
        >
          Comprehensive Tester
        </button>
        <button 
          className={`tab-btn ${activeTab === 'crawler' ? 'active' : ''}`}
          onClick={() => setActiveTab('crawler')}
        >
          Automated Crawler
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'manual' ? <ManualTestTab /> : <CrawlerTab />}
      </div>
    </div>
  );
}

export default App;
