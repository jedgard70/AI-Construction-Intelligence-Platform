import dynamic from 'next/dynamic'

const LoginClient = dynamic(() => import('../components/LoginClient'), {
  ssr: false,
  loading: () => (
    <div style={{ minHeight: '100dvh', background: '#071a33', display: 'flex',
      alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#c9d1d9', fontFamily: 'system-ui', fontSize: '14px',
        letterSpacing: 0 }}>Loading...</span>
    </div>
  ),
})

export default function Login() {
  return <LoginClient />
}
