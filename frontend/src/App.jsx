// frontend/src/App.jsx

import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [campaigns, setCampaigns] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch data from your backend API
    fetch('http://localhost:3001/api/campaigns')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data) => setCampaigns(data))
      .catch((error) => {
        console.error('Error fetching data:', error);
        setError(error.message);
      });
  }, []); // The empty array [] means this effect runs once when the component mounts

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <>
      <h1>Poster Campaigns</h1>
      <ul>
        {campaigns.map((campaign) => (
          <li key={campaign.id}>
            <strong>{campaign.name}</strong> for {campaign.client}
          </li>
        ))}
      </ul>
    </>
  );
}

export default App;