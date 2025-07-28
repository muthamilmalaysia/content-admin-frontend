'use client';

import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Define a type for our history items for better type-safety
interface ContentPair {
  branch: string;
  facebookPost: string;
  tweet: string;
}

interface HistoryJob {
  id: string;
  createdAt: string;
  sourceUrl: string;
  stance: 'PRO' | 'ANTI';
  contentPairs: ContentPair[];
}

export default function AdminDashboard() {
  const [url, setUrl] = useState<string>('');
  const [stance, setStance] = useState<'PRO' | 'ANTI'>('PRO');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryJob[]>([]);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!API_URL) {
      setError("API URL is not configured. Please set NEXT_PUBLIC_API_URL in environment variables.");
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/history`);
      if (!response.ok) throw new Error('Failed to fetch history.');
      const data: HistoryJob[] = await response.json();
      setHistory(data);
    } catch (err) {
      setError('Could not load generation history. The backend may be unavailable.');
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`${API_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, stance }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'An unknown error occurred.');
      }

      setSuccessMessage('Content generated successfully! Refreshing history...');
      setUrl('');
      await fetchHistory();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  };

  const toggleItem = (id: string) => {
    setExpandedItem(expandedItem === id ? null : id);
  };

  return (
    <main>
      <Head>
        <title>Admin - Content Generation</title>
      </Head>
      <div className="container">
        <h1>Content Generation Engine</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="url">News Article URL</label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              placeholder="https://example.com/news/article"
            />
          </div>
          <div className="form-group">
            <label htmlFor="stance">Political Stance</label>
            <select id="stance" value={stance} onChange={(e) => setStance(e.target.value as 'PRO' | 'ANTI')}>
              <option value="PRO">PRO - Supportive of Datuk Seri Anwar Ibrahim</option>
              <option value="ANTI">ANTI - Critical of Perikatan Nasional</option>
            </select>
          </div>
          <button type="submit" disabled={isLoading || !API_URL}>
            {isLoading ? 'Generating...' : 'Generate Content'}
          </button>
        </form>

        {error && <div className="message error">{error}</div>}
        {successMessage && <div className="message success">{successMessage}</div>}

        <h2 style={{ marginTop: '3rem' }}>Generation History</h2>
        <div>
          {history.length > 0 ? history.map((item: HistoryJob) => (
            <div key={item.id} className="history-item">
              <div className="history-item-header" onClick={() => toggleItem(item.id)}>
                <span style={{ wordBreak: 'break-all' }}><strong>URL:</strong> {item.sourceUrl}</span>
                <span style={{ whiteSpace: 'nowrap', marginLeft: '1rem' }}><strong>Stance:</strong> {item.stance} | {new Date(item.createdAt).toLocaleString()}</span>
              </div>
              {expandedItem === item.id && (
                <div className="history-item-details">
                  {item.contentPairs.map((pair: ContentPair) => (
                     <div key={pair.branch} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)'}}>
                        <h4>{pair.branch}</h4>
                        <p><strong>Facebook:</strong> {pair.facebookPost}</p>
                        <p><strong>Tweet:</strong> {pair.tweet}</p>
                     </div>
                  ))}
                </div>
              )}
            </div>
          )) : <p>No history found.</p>}
        </div>
      </div>
    </main>
  );
}
