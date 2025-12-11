import { useState, useEffect } from 'react';

interface ActorRun {
  id: string;
  status: string;
  startedAt: string;
  finishedAt?: string;
  defaultDatasetId?: string;
}

interface ActorDetails {
  username: string;
  name: string;
  description: string;
  stats: {
    totalRuns: number;
    users: number;
  };
  latestRun?: ActorRun;
}

export default function ActorControl({ onRunComplete }: { onRunComplete?: (datasetId?: string) => void }) {
  const [actorDetails, setActorDetails] = useState<ActorDetails | null>(null);
  const [currentRun, setCurrentRun] = useState<ActorRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  // Normalize actor ID format: convert username/actor-name to username~actor-name for API
  const rawActorId = import.meta.env.VITE_APIFY_ACTOR_ID || '';
  const actorId = rawActorId.replace(/\//g, '~'); // Convert / to ~ for API format
  const apiToken = import.meta.env.VITE_APIFY_API_TOKEN || '';

  // Load actor details
  useEffect(() => {
    if (actorId && apiToken) {
      loadActorDetails();
    }
  }, [actorId, apiToken]);

  // Poll for run status
  useEffect(() => {
    if (polling && currentRun) {
      const interval = setInterval(() => {
        checkRunStatus(currentRun.id);
      }, 3000); // Poll every 3 seconds

      return () => clearInterval(interval);
    }
  }, [polling, currentRun]);

  const loadActorDetails = async () => {
    try {
      const response = await fetch(
        `https://api.apify.com/v2/acts/${actorId}?token=${apiToken}`
      );
      if (response.ok) {
        const data = await response.json();
        setActorDetails({
          username: data.data.username,
          name: data.data.name,
          description: data.data.description || 'OpenVC Investor Scraper',
          stats: {
            totalRuns: data.data.stats?.totalRuns || 0,
            users: data.data.stats?.users || 0,
          },
        });

        // Load latest run if available
        if (data.data.lastRun) {
          setCurrentRun({
            id: data.data.lastRun.id,
            status: data.data.lastRun.status,
            startedAt: data.data.lastRun.startedAt,
            finishedAt: data.data.lastRun.finishedAt,
            defaultDatasetId: data.data.lastRun.defaultDatasetId,
          });
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
        console.error('Failed to load actor details:', errorData);
        setError(errorData.error?.message || `Failed to load actor: ${response.status} ${response.statusText}`);
      }
    } catch (err: any) {
      console.error('Error loading actor details:', err);
      setError(err.message || 'Failed to fetch actor details. Check your API token and actor ID.');
    }
  };

  const startActor = async () => {
    if (!actorId || !apiToken) {
      setError('Apify Actor ID and API Token must be configured in environment variables');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://api.apify.com/v2/acts/${actorId}/runs?token=${apiToken}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            startUrls: ['https://openvc.app/search'],
            exportToJson: true,
            proxyConfiguration: {
              useApifyProxy: true,
              apifyProxyGroups: ['RESIDENTIAL'] // Use residential proxies for better success rate
            }
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const run: ActorRun = {
          id: data.data.id,
          status: data.data.status,
          startedAt: data.data.startedAt,
          defaultDatasetId: data.data.defaultDatasetId,
        };
        setCurrentRun(run);
        setPolling(true);
      } else {
        const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
        setError(errorData.error?.message || `Failed to start actor: ${response.status} ${response.statusText}`);
      }
    } catch (err: any) {
      console.error('Error starting actor:', err);
      setError(err.message || 'Failed to start actor. Check your API token and actor ID.');
    } finally {
      setLoading(false);
    }
  };

  const checkRunStatus = async (runId: string) => {
    try {
      const response = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}?token=${apiToken}`
      );
      if (response.ok) {
        const data = await response.json();
        const updatedRun: ActorRun = {
          id: data.data.id,
          status: data.data.status,
          startedAt: data.data.startedAt,
          finishedAt: data.data.finishedAt,
          defaultDatasetId: data.data.defaultDatasetId,
        };
        setCurrentRun(updatedRun);

        if (data.data.status === 'SUCCEEDED' || data.data.status === 'FAILED' || data.data.status === 'ABORTED') {
          setPolling(false);
          if (data.data.status === 'SUCCEEDED' && onRunComplete) {
            // Wait a bit for dataset to be ready, then reload with dataset ID
            setTimeout(() => {
              onRunComplete(data.data.defaultDatasetId);
            }, 2000);
          }
        }
      } else {
        console.error('Failed to check run status:', response.status, response.statusText);
        setPolling(false);
      }
    } catch (err: any) {
      console.error('Error checking run status:', err);
      setError(err.message || 'Failed to check run status');
      setPolling(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCEEDED':
        return '#27ae60';
      case 'RUNNING':
        return '#3498db';
      case 'FAILED':
        return '#e74c3c';
      case 'ABORTED':
        return '#95a5a6';
      default:
        return '#f39c12';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="actor-control">
      <div className="actor-header">
        <h2>Apify Actor Control</h2>
        {!actorId || !apiToken ? (
          <div className="actor-warning">
            <p>⚠️ Configure Apify credentials:</p>
            <p className="hint">Set VITE_APIFY_ACTOR_ID and VITE_APIFY_API_TOKEN in .env file</p>
          </div>
        ) : null}
      </div>

      {actorDetails && (
        <div className="actor-info">
          <div className="info-row">
            <span className="info-label">Actor:</span>
            <span className="info-value">{actorDetails.name}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Username:</span>
            <span className="info-value">{actorDetails.username}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Total Runs:</span>
            <span className="info-value">{actorDetails.stats.totalRuns}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Description:</span>
            <span className="info-value">{actorDetails.description}</span>
          </div>
        </div>
      )}

      {currentRun && (
        <div className="run-status">
          <div className="status-header">
            <span className="status-label">Current Run:</span>
            <span
              className="status-badge"
              style={{ backgroundColor: getStatusColor(currentRun.status) }}
            >
              {currentRun.status}
            </span>
          </div>
          <div className="run-details">
            <div className="detail-item">
              <span>Started:</span>
              <span>{formatDate(currentRun.startedAt)}</span>
            </div>
            {currentRun.finishedAt && (
              <div className="detail-item">
                <span>Finished:</span>
                <span>{formatDate(currentRun.finishedAt)}</span>
              </div>
            )}
            {currentRun.defaultDatasetId && (
              <div className="detail-item">
                <span>Dataset ID:</span>
                <span className="dataset-id">{currentRun.defaultDatasetId}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="actor-error">
          <p>{error}</p>
        </div>
      )}

      <div className="actor-actions">
        <button
          onClick={startActor}
          disabled={loading || polling || !actorId || !apiToken}
          className="btn-run-actor"
        >
          {loading ? 'Starting...' : polling ? 'Running...' : '🚀 Run Actor'}
        </button>
        {polling && (
          <div className="polling-indicator">
            <span className="spinner"></span>
            <span>Monitoring run status...</span>
          </div>
        )}
      </div>
    </div>
  );
}

