import dynamic from 'next/dynamic'

const LoginClient = dynamic(() => import('../components/LoginClient'), {
  ssr: false,
  loading: () => (
    <div style={{ background: '#0a0d12', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#f0a500', fontFamily: 'monospace', fontSize: '14px', letterSpacing: '2px' }}>CARREGANDO...</span>
    </div>
  ),
})

export function getServerSideProps() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (!supabaseUrl) {
    return { redirect: { destination: '/dashboard.html', permanent: false } }
  }
  return { props: {} }
}

export default function Login() {
  return <LoginClient />
}
