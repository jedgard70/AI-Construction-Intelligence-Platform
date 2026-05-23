import dynamic from 'next/dynamic'

const ForgotPasswordClient = dynamic(
  () => import('../components/ForgotPasswordClient'),
  { ssr: false, loading: () => (
    <div style={{ minHeight:'100vh', background:'#0a0d12', display:'flex',
      alignItems:'center', justifyContent:'center' }}>
      <span style={{ color:'#f0a500', fontFamily:'monospace', fontSize:14,
        letterSpacing:2 }}>CARREGANDO...</span>
    </div>
  )}
)

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />
}
