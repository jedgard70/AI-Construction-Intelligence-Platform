import { useMemo } from 'react'
import type { CSSProperties } from 'react'
import { useRouter } from 'next/router'
import type { Profile } from '../pages/dashboard'

type Action = {
  label: string
  description: string
  href?: string
  onClick?: () => void
  primary?: boolean
}

function ownerEmails() {
  return (process.env.NEXT_PUBLIC_OWNER_EMAILS || process.env.NEXT_PUBLIC_APEX_OWNER_EMAILS || 'jedgard70@gmail.com')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean)
}

function isOwnerProfile(profile: Profile) {
  const role = String(profile.role || '').toLowerCase()
  return Boolean(
    profile.is_owner === true ||
    role === 'owner' ||
    role === 'admin' ||
    role === 'diretor_executivo' ||
    ownerEmails().includes(String(profile.email || '').toLowerCase())
  )
}

function openApexAi() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('apex-copilot-open'))
}

export default function WelcomeAnalysis({ profile }: { profile: Profile }) {
  const router = useRouter()
  const isOwner = useMemo(() => isOwnerProfile(profile), [profile])
  const firstName = profile.full_name?.split(' ')[0] || 'Welcome'

  const actions: Action[] = [
    {
      label: 'Anexar documento/projeto',
      description: 'Enviar arquivo, projeto, foto, PDF, planilha ou documento para iniciar o atendimento.',
      onClick: openApexAi,
      primary: true,
    },
    {
      label: 'Falar com Apex AI',
      description: 'Abrir o copiloto para perguntas, triagem inicial e orientacao de proximo passo.',
      onClick: openApexAi,
    },
    {
      label: 'Iniciar analise',
      description: 'Abrir o fluxo de nova analise para cadastrar objetivo, cliente e projeto.',
      href: '/nova-analise',
    },
    {
      label: 'Continuar atendimento/projeto',
      description: 'Retomar documentos, projetos e entregas existentes pela area operacional.',
      href: '/documentos',
    },
  ]

  return (
    <section style={styles.page}>
      <div style={styles.hero}>
        <div style={styles.heroCopy}>
          <span style={styles.kicker}>Apex Global AI</span>
          <h1 style={styles.title}>Welcome, {firstName}</h1>
          <p style={styles.lead}>Anexe seu arquivo ou fale com a Apex AI para iniciar.</p>
          <p style={styles.body}>
            A primeira tela da plataforma agora concentra atendimento, analises e continuidade de projeto. O dashboard executivo fica separado para usuarios autorizados.
          </p>
        </div>
        <div style={styles.signalPanel} aria-label="Apex analysis entry">
          <div style={styles.signalHeader}>
            <span style={styles.signalDot} />
            <span>Analyses intake ready</span>
          </div>
          <div style={styles.signalGrid}>
            <div style={styles.signalItem}><strong>Files</strong><span>documents, BIM, CAD, media</span></div>
            <div style={styles.signalItem}><strong>AI</strong><span>Apex Copilot entry point</span></div>
            <div style={styles.signalItem}><strong>Flow</strong><span>analysis to project path</span></div>
          </div>
        </div>
      </div>

      <div style={styles.actionsGrid}>
        {actions.map(action => (
          <button
            key={action.label}
            type="button"
            onClick={() => action.href ? router.push(action.href) : action.onClick?.()}
            style={{ ...styles.actionCard, ...(action.primary ? styles.actionCardPrimary : null) }}
          >
            <span style={{ ...styles.actionLabel, ...(action.primary ? styles.actionLabelPrimary : null) }}>{action.label}</span>
            <span style={{ ...styles.actionDescription, ...(action.primary ? styles.actionDescriptionPrimary : null) }}>{action.description}</span>
          </button>
        ))}
      </div>

      <div style={styles.ownerArea}>
        <div>
          <h2 style={styles.ownerTitle}>Executive control</h2>
          <p style={styles.ownerText}>
            Controle Owner e indicadores executivos permanecem disponiveis apenas para Owner/diretoria.
          </p>
        </div>
        {isOwner && (
          <button type="button" onClick={() => router.push('/owner-dashboard')} style={styles.ownerButton}>
            Dashboard Executivo
          </button>
        )}
      </div>
    </section>
  )
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: 'calc(100vh - 88px)',
    background: '#ffffff',
    border: '1px solid #dfe5ee',
    borderRadius: 8,
    padding: 28,
    color: '#071a33',
  },
  hero: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.35fr) minmax(280px, 0.65fr)',
    gap: 22,
    alignItems: 'stretch',
  },
  heroCopy: {
    borderLeft: '5px solid #b20f1d',
    padding: '8px 0 8px 22px',
  },
  kicker: {
    display: 'block',
    color: '#b20f1d',
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: '.08em',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  title: {
    fontSize: 34,
    lineHeight: 1.12,
    margin: 0,
    letterSpacing: 0,
    color: '#071a33',
  },
  lead: {
    margin: '14px 0 0',
    color: '#0d2b52',
    fontSize: 20,
    fontWeight: 700,
    lineHeight: 1.35,
  },
  body: {
    maxWidth: 720,
    margin: '10px 0 0',
    color: '#5f6b7a',
    fontSize: 14,
    lineHeight: 1.65,
  },
  signalPanel: {
    background: '#f7f9fc',
    border: '1px solid #dfe5ee',
    borderRadius: 8,
    padding: 18,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  signalHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: '#071a33',
    fontSize: 13,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '.04em',
  },
  signalDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: '#b20f1d',
    boxShadow: '0 0 0 5px rgba(178,15,29,.10)',
  },
  signalGrid: {
    display: 'grid',
    gap: 10,
  },
  signalItem: {
    background: '#fff',
    border: '1px solid #dfe5ee',
    borderRadius: 8,
    padding: '12px 14px',
    display: 'grid',
    gap: 3,
    color: '#5f6b7a',
    fontSize: 12,
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 14,
    marginTop: 26,
  },
  actionCard: {
    minHeight: 148,
    textAlign: 'left',
    border: '1px solid #dfe5ee',
    borderRadius: 8,
    background: '#ffffff',
    padding: 18,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: 20,
    fontFamily: 'inherit',
    boxShadow: '0 10px 24px rgba(7,26,51,.05)',
  },
  actionCardPrimary: {
    background: '#071a33',
    borderColor: '#071a33',
  },
  actionLabel: {
    color: '#071a33',
    fontWeight: 800,
    fontSize: 15,
    lineHeight: 1.25,
  },
  actionLabelPrimary: {
    color: '#ffffff',
  },
  actionDescription: {
    color: '#5f6b7a',
    fontSize: 12,
    lineHeight: 1.55,
  },
  actionDescriptionPrimary: {
    color: '#d6dde8',
  },
  ownerArea: {
    marginTop: 30,
    borderTop: '1px solid #dfe5ee',
    paddingTop: 22,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  ownerTitle: {
    margin: 0,
    color: '#071a33',
    fontSize: 18,
  },
  ownerText: {
    margin: '6px 0 0',
    color: '#5f6b7a',
    fontSize: 13,
  },
  ownerButton: {
    border: 'none',
    borderRadius: 8,
    background: '#b20f1d',
    color: '#fff',
    padding: '12px 18px',
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  },
}
