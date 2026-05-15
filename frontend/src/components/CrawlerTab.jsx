import React, { useState } from 'react';
import { Search, Activity, AlertCircle, FileText, Globe, Key, Download, ChevronDown, ChevronUp, Settings } from 'lucide-react';

export default function CrawlerTab() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [expandedError, setExpandedError] = useState(null)

  // Auth state
  const [showAuth, setShowAuth] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [auth, setAuth] = useState({
    enabled: false,
    loginUrl: '',
    username: '',
    password: '',
    usernameSelector: '',
    passwordSelector: '',
    submitSelector: ''
  })

  const handleScan = async (e) => {
    e.preventDefault()
    if (!url) return

    setLoading(true)
    setErrorMsg('')
    setResults(null)
    setExpandedError(null)

    try {
      const response = await fetch('http://localhost:3001/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url,
          auth: auth.enabled ? auth : undefined
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to scan website. Make sure the backend is running.')
      }

      const data = await response.json()
      setResults(data)
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadReport = () => {
    if (!results) return;
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(results, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "api_test_report.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

  return (
    <>
      <div className="glass-card">
        <form onSubmit={handleScan}>
          <div className="input-group">
            <input
              type="url"
              placeholder="Enter website URL (e.g., https://example.com)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              disabled={loading}
            />
            <button type="submit" disabled={loading}>
              {loading ? <Activity className="animate-spin" /> : <Search />}
              {loading ? 'Scanning...' : 'Scan Now'}
            </button>
          </div>

          <div className="auth-toggle-container" style={{ marginTop: '1rem' }}>
            <button 
              type="button" 
              className="toggle-btn"
              onClick={() => {
                setShowAuth(!showAuth)
                if (!showAuth) setAuth({...auth, enabled: true})
                else setAuth({...auth, enabled: false})
              }}
              style={{ background: 'transparent', padding: '0', color: 'var(--primary)', fontSize: '0.9rem', gap: '0.2rem' }}
            >
              <Key size={16} />
              {showAuth ? 'Hide Authentication Settings' : 'Requires Login? Add Authentication'}
            </button>
          </div>

          {showAuth && (
            <div className="auth-settings" style={{ marginTop: '1rem', padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                Provide your login details below. The tool is smart enough to find the login boxes automatically!
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <input type="text" placeholder="Login Page URL (e.g., https://site.com/login)" value={auth.loginUrl} onChange={e => setAuth({...auth, loginUrl: e.target.value})} required={showAuth} />
                <input type="text" placeholder="Username / Email" value={auth.username} onChange={e => setAuth({...auth, username: e.target.value})} required={showAuth} />
                <input type="password" placeholder="Password" value={auth.password} onChange={e => setAuth({...auth, password: e.target.value})} required={showAuth} />
              </div>
              
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <button 
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  style={{ background: 'transparent', padding: '0', color: 'var(--text-muted)', fontSize: '0.8rem', gap: '0.2rem', display: 'flex', alignItems: 'center' }}
                >
                  <Settings size={14} />
                  {showAdvanced ? 'Hide Developer Settings' : 'Advanced Developer Settings'}
                </button>

                {showAdvanced && (
                  <div style={{ marginTop: '1rem' }}>
                    <p style={{ marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--error)' }}>
                      Only use these CSS Selectors if the automatic login fails.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                      <input type="text" placeholder="Username CSS Selector" value={auth.usernameSelector} onChange={e => setAuth({...auth, usernameSelector: e.target.value})} />
                      <input type="text" placeholder="Password CSS Selector" value={auth.passwordSelector} onChange={e => setAuth({...auth, passwordSelector: e.target.value})} />
                      <input type="text" placeholder="Submit Button Selector" value={auth.submitSelector} onChange={e => setAuth({...auth, submitSelector: e.target.value})} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </form>
        {errorMsg && <p style={{ color: 'var(--error)', marginTop: '1rem' }}>{errorMsg}</p>}
      </div>

      {loading && (
        <div className="loader-container glass-card">
          <div className="spinner"></div>
          <p>Crawling website & analyzing network requests...</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>This may take up to a minute depending on the site size.</p>
        </div>
      )}

      {results && !loading && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <Globe className="mx-auto mb-2" size={32} color="var(--primary)" style={{ margin: '0 auto 0.5rem' }}/>
              <span className="stat-value">{results.scannedPages}</span>
              <span className="stat-label">Pages Crawled</span>
            </div>
            <div className="stat-card success">
              <Activity className="mx-auto mb-2" size={32} color="var(--success)" style={{ margin: '0 auto 0.5rem' }}/>
              <span className="stat-value">{results.totalApiRequests}</span>
              <span className="stat-label">API Requests Intercepted</span>
            </div>
            <div className={`stat-card ${results.errors.length > 0 ? 'error' : 'success'}`}>
              <AlertCircle className="mx-auto mb-2" size={32} color={results.errors.length > 0 ? 'var(--error)' : 'var(--success)'} style={{ margin: '0 auto 0.5rem' }}/>
              <span className="stat-value">{results.errors.length}</span>
              <span className="stat-label">API Errors Found</span>
            </div>
          </div>

          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem', margin: 0 }}>
                <FileText /> Detailed Error Report
              </h2>
              {results.errors.length > 0 && (
                <button onClick={handleDownloadReport} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                  <Download size={16} /> Export JSON
                </button>
              )}
            </div>
            
            {results.errors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--success)' }}>
                <Activity size={48} style={{ margin: '0 auto 1rem' }} />
                <h3>No API errors detected!</h3>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>All intercepted network requests returned successful status codes.</p>
              </div>
            ) : (
              <div className="table-container">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '15%' }}>Status</th>
                      <th style={{ width: '10%' }}>Method</th>
                      <th style={{ width: '45%' }}>Failed API Endpoint</th>
                      <th style={{ width: '20%' }}>Source Page</th>
                      <th style={{ width: '10%' }}>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.errors.map((error, idx) => (
                      <React.Fragment key={idx}>
                        <tr style={{ borderBottom: expandedError === idx ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                          <td>
                            <span className="badge badge-status">
                              {error.status} {error.statusText}
                            </span>
                          </td>
                          <td>
                            <span className="badge badge-method">{error.method}</span>
                          </td>
                          <td>
                            <div className="truncate" style={{ maxWidth: '350px' }} title={error.apiUrl}>
                              {error.apiUrl}
                            </div>
                          </td>
                          <td>
                            <div className="truncate" style={{ maxWidth: '150px', color: 'var(--text-muted)' }} title={error.pageUrl}>
                              {error.pageUrl}
                            </div>
                          </td>
                          <td>
                            <button 
                              onClick={() => setExpandedError(expandedError === idx ? null : idx)}
                              style={{ background: 'transparent', padding: '0.2rem', minWidth: 'auto', color: 'var(--primary)' }}
                            >
                              {expandedError === idx ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>
                          </td>
                        </tr>
                        {expandedError === idx && (
                          <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                            <td colSpan="5" style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                  <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Request Payload</h4>
                                  <pre style={{ background: '#000', padding: '1rem', borderRadius: '4px', overflowX: 'auto', fontSize: '0.8rem', color: '#a78bfa', maxHeight: '200px', whiteSpace: 'pre-wrap' }}>
                                    {error.requestPayload ? error.requestPayload : 'No Payload Data'}
                                  </pre>
                                </div>
                                <div>
                                  <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Response Body</h4>
                                  <pre style={{ background: '#000', padding: '1rem', borderRadius: '4px', overflowX: 'auto', fontSize: '0.8rem', color: '#fca5a5', maxHeight: '200px', whiteSpace: 'pre-wrap' }}>
                                    {error.responseBody ? error.responseBody : 'No Response Body'}
                                  </pre>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}
