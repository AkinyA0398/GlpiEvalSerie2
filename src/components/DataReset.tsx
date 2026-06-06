import React, { useState } from 'react';
import { resetData } from '../services/api';

export const DataReset: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      return;
    }

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await resetData();
      setMessage(response.message);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred during reset.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px 0', borderRadius: '8px' }}>
      <h2>Data Reset</h2>
      <p>Click the button below to reinitialize the local database.</p>
      <button onClick={handleReset} disabled={loading} style={{ padding: '10px 20px', backgroundColor: '#d9534f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
        {loading ? 'Resetting...' : 'Reset Data'}
      </button>
      {message && <p style={{ color: 'green', marginTop: '10px' }}>{message}</p>}
      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
    </div>
  );
};
