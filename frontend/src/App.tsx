import { useState, useEffect } from 'react';
import InvestorList from './components/InvestorList';
import ActorControl from './components/ActorControl';
import type { InvestorData } from './types';

function App() {
  const [investors, setInvestors] = useState<InvestorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [datasetId, setDatasetId] = useState<string | null>(
    import.meta.env.VITE_APIFY_DATASET_ID || null
  );

  useEffect(() => {
    // Try to load from local JSON file first, then fallback to Apify Dataset API
    const loadInvestors = async () => {
      try {
        // Try local JSON file first (for development)
        // File should be at frontend/public/data/investors.json
        const response = await fetch('/data/investors.json');
        if (response.ok) {
          const data = await response.json();
          setInvestors(Array.isArray(data) ? data : data.items || []);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.log('Local JSON not found, trying Apify Dataset API...');
      }

      // Fallback: Try Apify Dataset API
      // Use dataset ID from state (set by completed run) or from env variable
      if (datasetId) {
        try {
          const apiToken = import.meta.env.VITE_APIFY_API_TOKEN;
          if (!apiToken) {
            throw new Error('API token not configured');
          }
          const url = `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apiToken}`;
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            setInvestors(Array.isArray(data) ? data : []);
            setLoading(false);
            return;
          } else {
            console.error('Failed to load dataset:', response.status, response.statusText);
          }
        } catch (err) {
          console.error('Error loading from Apify:', err);
        }
      }

      setError('No data found. Please run the scraper first.');
      setLoading(false);
    };

    loadInvestors();
  }, [refreshKey, datasetId]);

  const handleRunComplete = (newDatasetId?: string) => {
    // Update dataset ID if provided from the run
    if (newDatasetId) {
      setDatasetId(newDatasetId);
      console.log('Using dataset ID from run:', newDatasetId);
    }
    // Refresh investor data after actor completes
    setRefreshKey(prev => prev + 1);
    setLoading(true);
    setError(null);
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading investors...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>OpenVC Investors</h1>
        <p className="subtitle">Found {investors.length} investors</p>
      </header>
      <ActorControl onRunComplete={handleRunComplete} />
      <InvestorList investors={investors} />
    </div>
  );
}

export default App;

