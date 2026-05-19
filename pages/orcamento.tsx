import dynamic from 'next/dynamic'

const OrcamentoClient = dynamic(() => import('../components/OrcamentoClient'), {
  ssr: false,
  loading: () => (
    <div style={{ minHeight:'100vh', background:'#0a0d12', display:'flex',
      alignItems:'center', justifyContent:'center' }}>
      <span style={{ color:'#f0a500', fontFamily:'monospace', fontSize:14, letterSpacing:2 }}>
        CARREGANDO...
      </span>
    </div>
  ),
})

export default function OrcamentoPage() {
  return <OrcamentoClient profile={null} />
}
