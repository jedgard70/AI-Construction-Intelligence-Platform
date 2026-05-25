import Head from 'next/head'
import Link from 'next/link'

export default function Home() {
  return (
    <>
      <Head>
        <title>Apex Construtora | Inteligência Artificial para Construção Civil</title>
        <meta name="description" content="Apex Construtora — Gestão de obras com IA, BIM, EVM e conformidade NR." />
      </Head>
      <div style={{
        fontFamily: "'-apple-system', 'Inter', sans-serif",
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
        color: '#ffffff'
      }}>
        <header style={{
          padding: '1.5rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ fontSize: '1.4rem', fontWeight: '800' }}>
            🏗️ Apex Construtora
          </div>
          <Link href="/login" style={{
            padding: '0.6rem 1.4rem',
            background: '#f97316',
            color: '#fff',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '600'
          }}>
            Acessar Plataforma
          </Link>
        </header>

        <main style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '5rem 2rem 4rem'
        }}>
          <div style={{
            padding: '0.4rem 1rem',
            background: 'rgba(249,115,22,0.15)',
            border: '1px solid rgba(249,115,22,0.4)',
            borderRadius: '999px',
            fontSize: '0.78rem',
            color: '#f97316',
            fontWeight: '700',
            marginBottom: '1.5rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em'
          }}>
            Plataforma de IA para Construção Civil
          </div>

          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3.8rem)',
            fontWeight: '800',
            lineHeight: 1.15,
            marginBottom: '1.5rem',
            maxWidth: '760px'
          }}>
            Construa com Inteligência.<br />
            <span style={{ color: '#f97316' }}>Entregue com Excelência.</span>
          </h1>

          <p style={{
            fontSize: '1.1rem',
            color: 'rgba(255,255,255,0.7)',
            maxWidth: '540px',
            lineHeight: 1.75,
            marginBottom: '2.5rem'
          }}>
            Gestão de obras com IA, análise EVM em tempo real,
            conformidade NR automatizada e BIM integrado.
          </p>

          <Link href="/login" style={{
            padding: '1rem 2.2rem',
            background: '#f97316',
            color: '#fff',
            borderRadius: '10px',
            textDecoration: 'none',
            fontWeight: '700',
            fontSize: '1rem'
          }}>
            Acessar a Plataforma →
          </Link>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))',
            gap: '1.25rem',
            marginTop: '5rem',
            width: '100%',
            maxWidth: '840px'
          }}>
            {[
              { icon: '📊', title: 'EVM Analytics', desc: 'CPI, SPI, EAC em tempo real' },
              { icon: '🏗️', title: 'BIM Intelligence', desc: 'Clash detection 3D/4D/5D/6D' },
              { icon: '🛡️', title: 'Conformidade NR', desc: 'NR-6, NR-10, NR-18 e mais' },
              { icon: '🤖', title: 'Multi-Agent AI', desc: '8 especialistas simultâneos' }
            ].map((f, i) => (
              <div key={i} style={{
                padding: '1.4rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                textAlign: 'left'
              }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '0.6rem' }}>{f.icon}</div>
                <div style={{ fontWeight: '700', marginBottom: '0.3rem' }}>{f.title}</div>
                <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)' }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </main>

        <footer style={{
          textAlign: 'center',
          padding: '2rem',
          color: 'rgba(255,255,255,0.35)',
          fontSize: '0.82rem',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          marginTop: '3rem'
        }}>
          © 2026 Apex Construtora · Todos os direitos reservados
        </footer>
      </div>
    </>
  )
              }
