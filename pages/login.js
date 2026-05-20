import dynamic from 'next/dynamic'

const LoginClient = dynamic(() => import('../components/LoginClient'), {
  ssr: false,
  loading: () => (
    <div style={{ minHeight: '100dvh', background: '#f4f2ee', display: 'flex',
      alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#BA7517', fontFamily: 'system-ui', fontSize: '14px',
        letterSpacing: '2px' }}>CARREGANDO...</span>
    </div>
  ),
})

export default function Login() {
  return <LoginClient />
}
