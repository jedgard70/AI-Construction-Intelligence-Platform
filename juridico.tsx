import dynamic from 'next/dynamic'

const JuridicoClient = dynamic(
  () => import('../components/JuridicoClient'),
  { ssr: false, loading: () => (
    <div style={{minHeight:'100vh',background:'#f4f5f7',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <span style={{color:'#185FA5',fontFamily:'monospace',fontSize:'14px'}}>Carregando módulo jurídico...</span>
    </div>
  )}
)

export default function Juridico() {
  return <JuridicoClient />
}
