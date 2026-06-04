import { useRouter } from 'next/router'

interface SafeEntryHomeProps {
  email: string
  fullName: string | null
}

export default function SafeEntryHome({ email, fullName }: SafeEntryHomeProps) {
  const router = useRouter()
  const name = fullName ? fullName.split(' ')[0] : email.split('@')[0]

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
      color: '#ffffff',
      fontFamily: "'-apple-system', 'Inter', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{ maxWidth: '640px', textAlign: 'center' }}>
        <div style={{ fontSize: '3.2rem', marginBottom: '1.5rem' }}>🏗️</div>

        <h1 style={{
          fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
          fontWeight: '800',
          lineHeight: 1.2,
          marginBottom: '1rem',
        }}>
          Bem-vindo à Apex Global AI, {name}!
        </h1>

        <p style={{
          fontSize: '1.05rem',
          color: 'rgba(255,255,255,0.8)',
          lineHeight: 1.7,
          marginBottom: '3rem',
        }}>
          Estamos prontos para ajudar você com gestão inteligente de projetos,
          análise de documentos, renders e muito mais.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.2rem',
          marginTop: '2.5rem',
        }}>
          <button
            onClick={() => router.push('/?tab=services')}
            style={{
              padding: '1.2rem 1.8rem',
              background: '#f97316',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.95rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#ea580c')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#f97316')}
          >
            📋 Iniciar Atendimento
          </button>

          <button
            onClick={() => {
              const fileInput = document.createElement('input')
              fileInput.type = 'file'
              fileInput.accept = '.pdf,.jpg,.png,.dwg,.dxf,.ifc'
              fileInput.onchange = () => {
                // Placeholder para upload
                alert('Upload em desenvolvimento. Use "Falar com Apex AI" para iniciar.')
              }
              fileInput.click()
            }}
            style={{
              padding: '1.2rem 1.8rem',
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: '1.5px solid rgba(255,255,255,0.2)',
              borderRadius: '10px',
              fontSize: '0.95rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
          >
            📎 Anexar Documento
          </button>

          <button
            onClick={() => {
              // Scroll para Apex AI Copilot (já está na página)
              const copilot = document.querySelector('[title="Apex AI Copilot"]')
              copilot?.scrollIntoView({ behavior: 'smooth' })
            }}
            style={{
              padding: '1.2rem 1.8rem',
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: '1.5px solid rgba(255,255,255,0.2)',
              borderRadius: '10px',
              fontSize: '0.95rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
          >
            🤖 Falar com Apex AI
          </button>
        </div>

        <div style={{
          marginTop: '4rem',
          padding: '1.5rem',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '10px',
          fontSize: '0.9rem',
          color: 'rgba(255,255,255,0.6)',
          lineHeight: 1.6,
        }}>
          <p>
            💡 <strong>Dica:</strong> Use o Apex AI para anexar qualquer documento
            (projeto, RG, nota fiscal, contrato) e deixe a IA classificar e rotear
            para o departamento correto.
          </p>
        </div>

        <div style={{
          marginTop: '2.5rem',
          fontSize: '0.82rem',
          color: 'rgba(255,255,255,0.4)',
        }}>
          <p>Email: {email}</p>
        </div>
      </div>
    </div>
  )
}
