'use client'
import { useState, useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { getSupabase } from '../../lib/supabase'

interface Client {
  id: string
  nome: string
  razao_social: string | null
  tipo: string | null
  segmento: string | null
  status: string | null
  cpf_cnpj: string | null
  email: string | null
  telefone: string | null
  celular: string | null
  cidade: string | null
  estado: string | null
  endereco: string | null
  numero: string | null
  bairro: string | null
  contato_nome: string | null
  contato_email: string | null
  contato_telefone: string | null
  observacoes: string | null
  created_at: string | null
  updated_at: string | null
  created_by: string | null
}

const label = (value: string | null | undefined) => value?.trim() || '—'
const formatDate = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' }) : '—'

function statusLabel(status: string | null | undefined) {
  return ({ ativo:'Ativo', inativo:'Inativo', prospecto:'Prospecto' }[status || ''] ?? label(status))
}

function statusColor(status: string | null | undefined) {
  return ({ ativo:'#3B6D11', inativo:'#5F5E5A', prospecto:'#BA7517' }[status || ''] ?? '#888')
}

function typeLabel(tipo: string | null | undefined) {
  return ({ pessoa_fisica:'Pessoa Física', pessoa_juridica:'Pessoa Jurídica' }[tipo || ''] ?? label(tipo))
}

function Row({ label: rowLabel, value }: { label: string; value: string | null | undefined }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', gap:16,
      padding:'9px 0', borderBottom:'1px solid #f0f2f5', fontSize:13 }}>
      <span style={{ color:'#8b93a7', fontWeight:500 }}>{rowLabel}</span>
      <span style={{ color:'#1a1f36', fontWeight:600, textAlign:'right', wordBreak:'break-word' }}>
        {label(value)}
      </span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ background:'#fff', borderRadius:12, padding:20, border:'1px solid #e5e8f0', marginBottom:16 }}>
      <div style={{ fontSize:13, fontWeight:700, color:'#1a1f36', marginBottom:12 }}>{title}</div>
      {children}
    </div>
  )
}

export default function ClienteView() {
  const router = useRouter()
  const { id } = router.query as { id: string }
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    let cancelled = false

    async function loadClient() {
      setLoading(true)
      setError('')

      const sb = getSupabase()
      if (!sb) {
        if (!cancelled) {
          setClient(null)
          setError('Supabase não configurado')
          setLoading(false)
        }
        return
      }

      try {
        const { data, error: loadError } = await sb
          .from('clients')
          .select('*')
          .eq('id', id)
          .single()

        if (cancelled) return

        if (loadError) {
          setClient(null)
          setError('Erro ao carregar cliente: ' + loadError.message)
          return
        }

        if (!data) {
          setClient(null)
          setError('Cliente não encontrado.')
          return
        }

        setClient(data as Client)
      } catch {
        if (!cancelled) {
          setClient(null)
          setError('Erro inesperado ao carregar cliente.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadClient()

    return () => { cancelled = true }
  }, [id])

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#f4f5f7', display:'flex', alignItems:'center',
      justifyContent:'center', fontFamily:'system-ui' }}>
      <div style={{ color:'#8b93a7', fontSize:14 }}>Carregando cliente...</div>
    </div>
  )

  if (error || !client) return (
    <div style={{ minHeight:'100vh', background:'#f4f5f7', display:'flex', alignItems:'center',
      justifyContent:'center', fontFamily:'system-ui' }}>
      <div style={{ textAlign:'center', color:'#8b93a7' }}>
        <div style={{ fontSize:40, marginBottom:12 }}>🔍</div>
        <div style={{ fontSize:15, fontWeight:600, color:'#1a1f36', marginBottom:8 }}>Cliente não encontrado</div>
        <div style={{ fontSize:13, maxWidth:360 }}>{error || 'Verifique o link do cliente.'}</div>
        <button onClick={() => router.push('/dashboard')}
          style={{ marginTop:16, padding:'8px 20px', background:'#185FA5', color:'#fff',
            border:'none', borderRadius:8, cursor:'pointer', fontSize:13 }}>
          ← Voltar ao dashboard
        </button>
      </div>
    </div>
  )

  const fullAddress = [client.endereco, client.numero, client.bairro].filter(Boolean).join(', ')
  const location = [client.cidade, client.estado].filter(Boolean).join(' / ')

  return (
    <>
      <Head>
        <title>{client.nome} — Cliente</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f4f5f7; font-family: 'Geist', system-ui, sans-serif; }
      `}</style>

      <div style={{ minHeight:'100vh', background:'#f4f5f7' }}>
        <div style={{ background:'#0F4C81', padding:'16px 24px 20px', color:'#fff' }}>
          <div style={{ maxWidth:800, margin:'0 auto' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
              <div style={{ width:36, height:36, borderRadius:9, background:'#f0a500',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>👤</div>
              <div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.6)', fontWeight:600,
                  letterSpacing:'0.08em', textTransform:'uppercase' }}>Atlas Construction Intelligence</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>Detalhe real do cliente — Supabase</div>
              </div>
            </div>
            <div style={{ fontSize:22, fontWeight:700 }}>{client.nome}</div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.7)', marginTop:4, display:'flex', gap:16, flexWrap:'wrap' }}>
              <span>{typeLabel(client.tipo)}</span>
              <span>·</span>
              <span>{label(client.segmento)}</span>
              <span>·</span>
              <span style={{ padding:'2px 10px', borderRadius:20,
                background: statusColor(client.status)+'33', color:'#fff', fontWeight:600 }}>
                {statusLabel(client.status)}
              </span>
            </div>
          </div>
        </div>

        <div style={{ maxWidth:800, margin:'0 auto', padding:'24px 16px' }}>
          <Section title="📋 Identificação">
            <Row label="Nome" value={client.nome} />
            <Row label="Razão social" value={client.razao_social} />
            <Row label="Tipo" value={typeLabel(client.tipo)} />
            <Row label="Segmento" value={client.segmento} />
            <Row label="CPF/CNPJ" value={client.cpf_cnpj} />
            <Row label="Status" value={statusLabel(client.status)} />
          </Section>

          <Section title="☎️ Contato">
            <Row label="E-mail" value={client.email} />
            <Row label="Telefone" value={client.telefone} />
            <Row label="Celular" value={client.celular} />
            <Row label="Contato responsável" value={client.contato_nome} />
            <Row label="E-mail do contato" value={client.contato_email} />
            <Row label="Telefone do contato" value={client.contato_telefone} />
          </Section>

          <Section title="📍 Endereço">
            <Row label="Endereço" value={fullAddress} />
            <Row label="Cidade / UF" value={location} />
          </Section>

          <Section title="📝 Observações">
            <div style={{ fontSize:13, color:'#1a1f36', lineHeight:1.7, whiteSpace:'pre-wrap' }}>
              {label(client.observacoes)}
            </div>
          </Section>

          <Section title="🧾 Metadados">
            <Row label="ID" value={client.id} />
            <Row label="Criado em" value={formatDate(client.created_at)} />
            <Row label="Atualizado em" value={formatDate(client.updated_at)} />
            <Row label="Criado por" value={client.created_by} />
          </Section>
        </div>
      </div>
    </>
  )
}
