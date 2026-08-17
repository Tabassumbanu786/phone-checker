import { useState, type FormEvent } from 'react';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

type CheckStatus = 'idle' | 'loading' | 'exists' | 'available' | 'error';

interface CheckResponse {
  exists: boolean;
  normalized: string;
  message: string;
}

interface ErrorResponse {
  error: string;
}

function App() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [status, setStatus] = useState<CheckStatus>('idle');
  const [resultMessage, setResultMessage] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setResultMessage('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/phone/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });

      const data: CheckResponse | ErrorResponse = await res.json();

      if (!res.ok) {
        setStatus('error');
        setResultMessage((data as ErrorResponse).error || 'Something went wrong.');
        return;
      }

      const success = data as CheckResponse;
      setStatus(success.exists ? 'exists' : 'available');
      setResultMessage(success.message);
    } catch {
      setStatus('error');
      setResultMessage('Could not reach the server. Please try again.');
    }
  }

  return (
    <div className="page">
      <div className="card">
        <h1>Phone Number Availability</h1>
        <p className="subtitle">Enter a phone number to check whether it's already on file.</p>

        <form onSubmit={handleSubmit}>
          <input
            type="tel"
            placeholder="e.g. (415) 555-2671"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            aria-label="Phone number"
          />
          <button type="submit" disabled={status === 'loading' || phoneNumber.trim().length === 0}>
            {status === 'loading' ? 'Checking...' : 'Check'}
          </button>
        </form>

        {resultMessage && (
          <div
            className={`result result-${status}`}
            role="status"
          >
            {resultMessage}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
