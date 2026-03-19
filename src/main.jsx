import { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Unknown error' }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontFamily: 'sans-serif', padding: '20px' }}>
          <div style={{ maxWidth: '720px', width: '100%', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
            <h2 style={{ marginTop: 0, color: '#b91c1c' }}>アプリの初期化でエラーが発生しました</h2>
            <p style={{ marginBottom: '8px', color: '#334155' }}>以下のメッセージを共有してください。</p>
            <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              {this.state.message}
            </pre>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
)
