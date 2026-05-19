import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL',
    notation: 'compact', maximumFractionDigits: 1 }).format(v)

const fmtFull = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

interface BudgetItem {
  period: string; pv: number; ev: number; ac: number;
  cost_labor?: number; cost_materials?: number; cost_equipment?: number; cost_third_party?: number
}

export default function OrcamentoCurvaSChart({ data }: { data: BudgetItem[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="gPV2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#185FA5" stopOpacity={0.12}/>
            <stop offset="95%" stopColor="#185FA5" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="gEV2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B6D11" stopOpacity={0.2}/>
            <stop offset="95%" stopColor="#3B6D11" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="gAC2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#A32D2D" stopOpacity={0.15}/>
            <stop offset="95%" stopColor="#A32D2D" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f7"/>
        <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#8b93a7' }}/>
        <YAxis tickFormatter={v => fmt(Number(v))} tick={{ fontSize: 10, fill: '#8b93a7' }} width={72}/>
        <Tooltip formatter={(v: any) => fmtFull(Number(v))}
          contentStyle={{ fontSize: 12, border: '1px solid #e5e8f0', borderRadius: 8 }}/>
        <Legend iconSize={8} formatter={v => <span style={{ fontSize: 11, color: '#5a6282' }}>{v}</span>}/>
        <ReferenceLine x="Mai" stroke="#BA7517" strokeDasharray="4 2"
          label={{ value: 'Hoje', fill: '#BA7517', fontSize: 10 }}/>
        <Area type="monotone" dataKey="pv" name="Previsto (PV)"
          stroke="#185FA5" fill="url(#gPV2)" strokeWidth={2} dot={false} connectNulls/>
        <Area type="monotone" dataKey="ev" name="Agregado (EV)"
          stroke="#3B6D11" fill="url(#gEV2)" strokeWidth={2.5} dot={false} connectNulls/>
        <Area type="monotone" dataKey="ac" name="Realizado (AC)"
          stroke="#A32D2D" fill="url(#gAC2)" strokeWidth={2} strokeDasharray="5 3" dot={false} connectNulls/>
      </AreaChart>
    </ResponsiveContainer>
  )
}
