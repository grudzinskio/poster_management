// frontend/src/App.jsx

import { useState, useEffect } from 'react';
import Login from './components/Login';
import UserManagement from './components/UserManagement';
import './App.css';

function App() {
  const [campaigns, setCampaigns] = useState([]);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [showLogin, setShowLogin] = useState(true);

  const fetchCampaigns = async (authToken) => {
    try {
      const response = await fetch('http://localhost:3001/api/campaigns', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

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

  useEffect(() => {
    if (user && token) {
      fetchCampaigns(token);
    }
  }, [user, token]);

  const handleLogin = (loginData) => {
    setUser(loginData.user);
    setToken(loginData.token);
    setShowLogin(false);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setCampaigns([]);
    setError(null);
    setShowLogin(true);
  };

  if (showLogin) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Poster Campaigns</h1>
        <div className="user-info">
          <span>Welcome, {user.username} ({user.role})</span>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      <main>
        {user.role === 'employee' && <UserManagement token={token} />}
        {error ? (
          <div className="error">Error: {error}</div>
        ) : (
          <div className="campaigns-list" align="left">
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