'use client'

import Link from 'next/link'
import { useRouter } from 'next/router'
import { ReactNode, useMemo, useState, useEffect } from 'react'
import { getSupabase } from '../../lib/supabase'

type MenuItem = { label: string; href: string; ownerOnly?: boolean }
type MenuGroup = { section: string; items: MenuItem[] }
type ShellUser = { isOwner: boolean; label: string; detail: string }

const MENU: MenuGroup[] = [
  { section: 'Produção', items: [
    { label: 'Análises', href: '/dashboard' },
    { label: 'Produção EUA', href: '/platform?region=us' },
    { label: 'Produção Europa', href: '/platform?region=eu' },
    { label: 'Produção Brasil', href: '/platform?region=br' },
    { label: 'Projetos', href: '/documentos' },
    { label: 'Obras/Campo', href: '/rdo' },
    { label: 'BIM / 3D / Render', href: '/bim-ops' },
    { label: 'ArchVis', href: '/archvis' },
  ]},
  { section: 'Vendas', items: [
    { label: 'CRM', href: '/vendas' },
    { label: 'Leads', href: '/vendas?view=leads' },
    { label: 'Oportunidades', href: '/vendas?view=oportunidades' },
    { label: 'Propostas', href: '/crm/proposals' },
    { label: 'Serviços', href: '/crm/services' },
  ]},
  { section: 'Juridico / Contratos', items: [
    { label: 'Contratos', href: '/juridico/contratos' },
    { label: 'Permits', href: '/juridico/compliance?area=permits' },
    { label: 'Endossos', href: '/juridico/contratos?tipo=endossos' },
    { label: 'Compliance', href: '/juridico/compliance' },
    { label: 'Assinaturas', href: '/juridico/assinatura' },
    { label: 'Documentos legais', href: '/juridico/due-diligence' },
  ]},
  { section: 'Marketing', items: [
    { label: 'Portfolio', href: '/platform?area=portfolio' },
    { label: 'Conteúdo', href: '/platform?area=content' },
    { label: 'Render/Video', href: '/director-cut' },
    { label: 'DirectCut', href: '/director-cut' },
    { label: 'Design/Web Builder', href: '/platform?area=design' },
    { label: 'Site / Materiais', href: '/platform?area=site' },
    { label: 'Social Media', href: '/platform?area=social' },
  ]},
  { section: 'Diretoria', items: [
    { label: 'Controle Owner', href: '/owner-command', ownerOnly: true },
    { label: 'Dashboard Executivo', href: '/owner-dashboard', ownerOnly: true },
    { label: 'Mission Control', href: '/mission-control', ownerOnly: true },
    { label: 'Indicadores', href: '/platform', ownerOnly: true },
    { label: 'Financeiro Geral', href: '/crm/revenue', ownerOnly: true },
    { label: 'Relatórios', href: '/documentos?scope=executive', ownerOnly: true },
    { label: 'Configurações', href: '/platform?area=settings', ownerOnly: true },
  ]},
]

type Props = { children: ReactNode }

function titleFromPath(pathname: string) {
  if (pathname === '/dashboard') return 'Análises'
  if (pathname === '/owner-dashboard') return 'Dashboard Executivo'
  if (pathname === '/mission-control') return 'Mission Control'
  if (pathname.startsWith('/juridico')) return 'Juridico'
  return 'Apex Platform'
}

async function getShellUser(): Promise<ShellUser> {
  try {
    const sb = getSupabase()
    if (!sb) return { isOwner: false, label: 'Guest', detail: 'Session unavailable' }
    const { data: { session } } = await sb.auth.getSession()
    if (!session?.user) return { isOwner: false, label: 'Guest', detail: 'Not signed in' }
    const email = (session.user.email || '').toLowerCase()
    const fallbackName = session.user.user_metadata?.full_name || email || 'User'
    const ownerEmails = (process.env.NEXT_PUBLIC_OWNER_EMAILS || process.env.NEXT_PUBLIC_APEX_OWNER_EMAILS || 'jedgard70@gmail.com').split(',').map(e => e.trim().toLowerCase())

    const { data: profile } = await sb
      .from('profiles')
      .select('role,is_owner,full_name,email')
      .eq('id', session.user.id)
      .maybeSingle()
    const role = String(profile?.role || '').toLowerCase()
    const isOwner = Boolean(profile?.is_owner === true || role === 'owner' || role === 'admin' || role === 'diretor_executivo' || ownerEmails.includes(email))
    return {
      isOwner,
      label: profile?.full_name || fallbackName,
      detail: isOwner ? 'Owner access' : (role || 'Platform user'),
    }
  } catch {
    return { isOwner: false, label: 'Guest', detail: 'Session check failed' }
  }
}

export default function ApexShell({ children }: Props) {
  const router = useRouter()
  const [isOwner, setIsOwner] = useState(false)
  const [menuReady, setMenuReady] = useState(false)
  const [guidedMenuOpen, setGuidedMenuOpen] = useState(false)
  const [guidedLanguage, setGuidedLanguage] = useState<'en' | 'pt'>('en')
  const [shellUser, setShellUser] = useState<ShellUser>({ isOwner: false, label: 'User', detail: 'Loading' })
  const guidedWelcome = router.pathname === '/dashboard'

  useEffect(() => {
    getShellUser().then(result => {
      setIsOwner(result.isOwner)
      setShellUser(result)
      setMenuReady(true)
    })
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = window.localStorage.getItem('apex-language')
    if (saved === 'en' || saved === 'pt') setGuidedLanguage(saved)
  }, [])

  useEffect(() => {
    setGuidedMenuOpen(false)
  }, [router.pathname])

  function changeGuidedLanguage(nextLanguage: 'en' | 'pt') {
    setGuidedLanguage(nextLanguage)
    if (typeof window === 'undefined') return
    window.localStorage.setItem('apex-language', nextLanguage)
    window.dispatchEvent(new CustomEvent('apex-language-change', { detail: nextLanguage }))
  }

  const title = useMemo(() => titleFromPath(router.pathname), [router.pathname])

  const filteredMenu = useMemo(() => {
    const baseMenu = menuReady ? MENU : MENU.filter(group => group.section !== 'Diretoria')
    return baseMenu.map(group => ({
      ...group,
      items: group.items.filter(item => !item.ownerOnly || isOwner),
    })).filter(group => group.items.length > 0)
  }, [isOwner, menuReady])

  const sidebar = (
    <aside style={{
      borderRight: '1px solid var(--apx-border)',
      background: 'var(--apx-surface)',
      padding: '14px 12px',
      position: guidedWelcome ? 'fixed' : 'sticky',
      top: 0,
      left: 0,
      height: '100vh',
      width: 260,
      overflowY: 'auto',
      zIndex: 50,
      boxShadow: guidedWelcome ? '0 18px 45px rgba(7,26,51,.18)' : 'none',
    }}>
        <div style={{ padding: '4px 8px 14px', borderBottom: '1px solid var(--apx-border)', marginBottom: 10 }}>
          <div style={{ fontSize: 12, color: 'var(--apx-muted)' }}>Apex Workspace</div>
          <div style={{ fontWeight: 700, marginTop: 2 }}>AI Construction Platform</div>
        </div>

        {filteredMenu.map((group) => (
          <div key={group.section} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--apx-muted)', padding: '4px 8px 6px' }}>{group.section}</div>
            <div style={{ display: 'grid', gap: 2 }}>
              {group.items.map((item) => {
                const itemPath = item.href.split('?')[0]
                const active = router.pathname === itemPath || router.pathname.startsWith(itemPath + '/')
                return (
                  <Link key={item.href} href={item.href} style={{ textDecoration: 'none', color: active ? '#fff' : 'var(--apx-text)', background: active ? 'var(--apx-primary)' : 'transparent', border: `1px solid ${active ? 'var(--apx-primary)' : 'transparent'}`, borderRadius: 8, padding: '6px 10px', fontSize: 13, fontWeight: active ? 700 : 500 }}>
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </aside>
  )

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--apx-bg)',
      color: 'var(--apx-text)',
      display: 'grid',
      gridTemplateColumns: guidedWelcome ? '1fr' : '260px 1fr',
      fontFamily: "'Geist', system-ui, sans-serif",
    }}>
      {!guidedWelcome && sidebar}
      {guidedWelcome && guidedMenuOpen && (
        <>
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setGuidedMenuOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 40, border: 'none', background: 'rgba(7,26,51,.28)', cursor: 'pointer' }}
          />
          {sidebar}
        </>
      )}

      <div style={{ minWidth: 0 }}>
        <header style={{ height: guidedWelcome ? 68 : 56, borderBottom: '1px solid var(--apx-border)', background: 'var(--apx-surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: guidedWelcome ? '0 26px' : '0 18px', position: 'sticky', top: 0, zIndex: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {guidedWelcome && (
              <button
                type="button"
                aria-label="Open navigation menu"
                onClick={() => setGuidedMenuOpen(true)}
                style={{
                  width: 38,
                  height: 38,
                  border: '1px solid var(--apx-border)',
                  borderRadius: 8,
                  background: '#ffffff',
                  color: 'var(--apx-text)',
                  fontSize: 22,
                  lineHeight: 1,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                ≡
              </button>
            )}
            <div>
              <div style={{ fontSize: guidedWelcome ? 15 : 11, color: guidedWelcome ? '#071a33' : 'var(--apx-muted)', letterSpacing: guidedWelcome ? '.06em' : '.08em', textTransform: 'uppercase', fontWeight: guidedWelcome ? 900 : 500 }}>APEX GLOBAL AI</div>
              <div style={{ fontWeight: 700, color: 'var(--apx-muted)', fontSize: guidedWelcome ? 12 : 14 }}>{guidedWelcome ? 'Construction Intelligence Platform' : title}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {guidedWelcome ? (
              <>
                <div style={{ display: 'inline-grid', gridTemplateColumns: '1fr 1fr', gap: 4, border: '1px solid var(--apx-border)', borderRadius: 8, padding: 4, background: '#fff' }}>
                  <button type="button" onClick={() => changeGuidedLanguage('en')} style={{ border: 'none', borderRadius: 6, background: guidedLanguage === 'en' ? '#071a33' : 'transparent', color: guidedLanguage === 'en' ? '#fff' : 'var(--apx-muted)', padding: '7px 10px', fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>EN</button>
                  <button type="button" onClick={() => changeGuidedLanguage('pt')} style={{ border: 'none', borderRadius: 6, background: guidedLanguage === 'pt' ? '#071a33' : 'transparent', color: guidedLanguage === 'pt' ? '#fff' : 'var(--apx-muted)', padding: '7px 10px', fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>PT</button>
                </div>
                <div style={{ textAlign: 'right', minWidth: 132 }}>
                  <div style={{ color: '#071a33', fontSize: 13, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>{shellUser.label}</div>
                  <div style={{ color: 'var(--apx-muted)', fontSize: 11 }}>{shellUser.isOwner ? 'Owner' : shellUser.detail}</div>
                </div>
              </>
            ) : (
              <>
                <span style={{ fontSize: 12, color: 'var(--apx-muted)' }}>Profile-ready layout</span>
                <span style={{ background: 'var(--apx-primary-soft)', color: 'var(--apx-primary)', border: '1px solid #bfd6ff', borderRadius: 999, padding: '4px 8px', fontSize: 11, fontWeight: 700 }}>UX-I</span>
              </>
            )}
          </div>
        </header>
        <main style={{ padding: guidedWelcome ? 20 : 16 }}>{children}</main>
      </div>

      <style jsx global>{`
        :root {
          --apx-bg: #f5f7fb;
          --apx-surface: #ffffff;
          --apx-border: #e3e8f2;
          --apx-text: #16213a;
          --apx-muted: #66728a;
          --apx-primary: #185fa5;
          --apx-primary-soft: #eaf2ff;
        }
      `}</style>
    </div>
  )
}
