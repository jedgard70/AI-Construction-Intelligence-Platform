import dynamic from 'next/dynamic'

const ResetPasswordClient = dynamic(
  () => import('../components/ResetPasswordClient'),
  { ssr: false, loading: () => (
    <div style={{ minHeight:'100vh', background:'#0a0d12', display:'flex',
      alignItems:'center', justifyContent:'center' }}>
      <span style={{ color:'#f0a500', fontFamily:'monospace', fontSize:14,
        letterSpacing:2 }}>CARREGANDO...</span>
    </div>
  )}
)

export default function ResetPasswordPage() {
  return <ResetPasswordClient />
}
