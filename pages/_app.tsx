import type { AppProps } from 'next/app'
import { Component, ReactNode, ErrorInfo } from 'react'
import { SpeedInsights } from '@vercel/speed-insights/next'

interface EBState { hasError: boolean; message: string }

class ErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, message: '' }
  }
  static getDerivedStateFromError(err: Error): EBState {
    return { hasError: true, message: err.message }
  }
  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error('[Atlas] Unhandled error:', err, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', background: '#0a0d12',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif', padding: 24,
        }}>
          <div style={{ maxWidth: 480, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
            <div style={{ color: '#f0a500', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              Algo deu errado
            </div>
            <div style={{ color: '#6b7a99', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
              {this.state.message || 'Erro inesperado na plataforma.'}
            </div>
            <button
              onClick={() => { this.setState({ hasError: false, message: '' }); window.location.href = '/dashboard' }}
              style={{ padding: '10px 24px', background: '#f0a500', color: '#0a0d12',
                border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              ← Voltar ao dashboard
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{ marginLeft: 12, padding: '10px 24px', background: 'transparent', color: '#6b7a99',
                border: '1px solid #1e2535', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
              Recarregar
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <Component {...pageProps} />
      <SpeedInsights />
    </ErrorBoundary>
  )
}
