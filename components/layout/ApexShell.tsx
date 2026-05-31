import Link from 'next/link'
import { useRouter } from 'next/router'
import { ReactNode, useMemo } from 'react'

const MENU = [
  { section: 'Visao Geral', items: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Mission Control', href: '/mission-control' },
    { label: 'Platform Map', href: '/platform' },
  ]},
  { section: 'Comercial', items: [
    { label: 'Vendas', href: '/vendas' },
    { label: 'Investimentos', href: '/investimentos' },
  ]},
  { section: 'Projetos', items: [
    { label: 'Nova Analise', href: '/nova-analise' },
    { label: 'Documentos', href: '/documentos' },
    { label: 'Orcamento', href: '/orcamento' },
    { label: 'RDO', href: '/rdo' },
    { label: 'Qualidade', href: '/qualidade' },
  ]},
  { section: 'Operacao BIM', items: [
    { label: 'BIM OPS', href: '/bim-ops' },
    { label: 'BIM 3D', href: '/bim-3d' },
    { label: 'Plantas', href: '/plantas' },
    { label: 'ArchVis', href: '/archvis' },
    { label: 'Director Cut', href: '/director-cut' },
  ]},
  { section: 'Juridico', items: [
    { label: 'Juridico', href: '/juridico' },
    { label: 'Contratos', href: '/juridico/contratos' },
    { label: 'Assinatura', href: '/juridico/assinatura' },
    { label: 'Compliance', href: '/juridico/compliance' },
    { label: 'Due Diligence', href: '/juridico/due-diligence' },
  ]},
]

type Props = { children: ReactNode }

function titleFromPath(pathname: string) {
  if (pathname === '/dashboard') return 'Dashboard'
  if (pathname === '/mission-control') return 'Mission Control'
  if (pathname.startsWith('/juridico')) return 'Juridico'
  return 'Apex Platform'
}

export default function ApexShell({ children }: Props) {
  const router = useRouter()
  const title = useMemo(() => titleFromPath(router.pathname), [router.pathname])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--apx-bg)', color: 'var(--apx-text)', display: 'grid', gridTemplateColumns: '260px 1fr', fontFamily: "'Geist', system-ui, sans-serif" }}>
      <aside style={{ borderRight: '1px solid var(--apx-border)', background: 'var(--apx-surface)', padding: '14px 12px', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
        <div style={{ padding: '4px 8px 14px', borderBottom: '1px solid var(--apx-border)', marginBottom: 10 }}>
          <div style={{ fontSize: 12, color: 'var(--apx-muted)' }}>Apex Workspace</div>
          <div style={{ fontWeight: 700, marginTop: 2 }}>AI Construction Platform</div>
        </div>

        {MENU.map((group) => (
          <div key={group.section} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--apx-muted)', padding: '6px 8px' }}>{group.section}</div>
            <div style={{ display: 'grid', gap: 4 }}>
              {group.items.map((item) => {
                const active = router.pathname === item.href || router.pathname.startsWith(item.href + '/')
                return (
                  <Link key={item.href} href={item.href} style={{ textDecoration: 'none', color: active ? '#fff' : 'var(--apx-text)', background: active ? 'var(--apx-primary)' : 'transparent', border: `1px solid ${active ? 'var(--apx-primary)' : 'transparent'}`, borderRadius: 8, padding: '8px 10px', fontSize: 13, fontWeight: active ? 700 : 500 }}>
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </aside>

      <div style={{ minWidth: 0 }}>
        <header style={{ height: 56, borderBottom: '1px solid var(--apx-border)', background: 'var(--apx-surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', position: 'sticky', top: 0, zIndex: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--apx-muted)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Apex Global</div>
            <div style={{ fontWeight: 700 }}>{title}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--apx-muted)' }}>Profile-ready layout</span>
            <span style={{ background: 'var(--apx-primary-soft)', color: 'var(--apx-primary)', border: '1px solid #bfd6ff', borderRadius: 999, padding: '4px 8px', fontSize: 11, fontWeight: 700 }}>UX-I</span>
          </div>
        </header>
        <main style={{ padding: 16 }}>{children}</main>
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
