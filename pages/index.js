import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/login')
  }, [router])

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#071a33',
      color: '#fff',
      fontFamily: 'system-ui, sans-serif',
      padding: 24,
      textAlign: 'center',
    }}>
      <div>
        <strong>APEX GLOBAL AI</strong>
        <p style={{ marginTop: 8, color: '#c9d1d9' }}>Redirecting to secure platform login...</p>
      </div>
    </main>
  )
}
