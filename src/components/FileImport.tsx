import React, { useState } from 'react';
import { importAll } from '../services/api';

export const FileImport: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleImport = async () => {
    if (files.length === 0) {
      setError('Please select at least one file.');
      return;
    }

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await importAll(files, null);
      setMessage(`Success: ${response.message} (Total Inserted: ${response.count})`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred during file import.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px 0', borderRadius: '8px' }}>
      <h2>File Import</h2>
      <p>Select a file to import into the local database.</p>
      <input type="file" accept=".csv" multiple onChange={handleFileChange} style={{ marginBottom: '10px', display: 'block' }} />
      <button onClick={handleImport} disabled={files.length === 0 || loading} style={{ padding: '10px 20px', backgroundColor: '#5bc0de', color: 'white', border: 'none', borderRadius: '4px', cursor: files.length > 0 ? 'pointer' : 'not-allowed' }}>
        {loading ? 'Importing...' : `Import ${files.length} File${files.length !== 1 ? 's' : ''}`}
      </button>
      {message && <p style={{ color: 'green', marginTop: '10px' }}>{message}</p>}
      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
    </div>
  );
};
