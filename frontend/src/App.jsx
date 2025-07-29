// frontend/src/App.jsx

import { useState, useEffect } from 'react';
import Login from './components/Login';
import './App.css';

function App() {
  const [campaigns, setCampaigns] = useState([]);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(true);

  // Fetch campaigns data
  const fetchCampaigns = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/campaigns');

      if (!response.ok) {
        throw new Error('Failed to fetch campaigns');
      }

      const data = await response.json();
      setCampaigns(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setError(error.message);
    }
  };

  // Fetch campaigns when user logs in
  useEffect(() => {
    if (user) {
      fetchCampaigns();
    }
  }, [user]);

  // Handle successful login
  const handleLogin = (userData) => {
    setUser(userData);
    setShowLogin(false);
  };

  // Handle back to login (equivalent to logout)
  const handleBackToLogin = () => {
    setUser(null);
    setCampaigns([]);
    setError(null);
    setShowLogin(true);
  };

  // Always show login page first
  if (showLogin) {
    return <Login onLogin={handleLogin} />;
  }

  // Show main app after login
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Poster Campaigns</h1>
        <div className="user-info">
          <span>Welcome, {user.username} ({user.role})</span>
          <button onClick={handleBackToLogin} className="logout-button">
            Back to Login
          </button>
        </div>
      </header>

      <main>
        {error ? (
          <div className="error">Error: {error}</div>
        ) : (
          <div className="campaigns-list">
            <h2>Your Campaigns</h2>
            {campaigns.length === 0 ? (
              <p>No campaigns found.</p>
            ) : (
              <ul>
                {campaigns.map((campaign) => (
                  <li key={campaign.id}>
                    <strong>{campaign.name}</strong> for {campaign.client}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;