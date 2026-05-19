import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL',
    notation: 'compact', maximumFractionDigits: 1 }).format(v)

const fmtFull = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

interface BudgetItem {
  period: string; cost_labor?: number; cost_materials?: number;
  cost_equipment?: number; cost_third_party?: number
}

export default function OrcamentoBarChart({ data }: { data: BudgetItem[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f7"/>
        <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#8b93a7' }}/>
        <YAxis tickFormatter={v => fmt(Number(v))} tick={{ fontSize: 9, fill: '#8b93a7' }} width={64}/>
        <Tooltip formatter={(v: any) => fmtFull(Number(v))}
          contentStyle={{ fontSize: 11, border: '1px solid #e5e8f0', borderRadius: 8 }}/>
        <Legend iconSize={8} formatter={v => <span style={{ fontSize: 10, color: '#5a6282' }}>{v}</span>}/>
        <Bar dataKey="cost_labor"       name="Mão de obra"    fill="#185FA5" radius={[2,2,0,0]}/>
        <Bar dataKey="cost_materials"   name="Materiais"      fill="#3B6D11" radius={[2,2,0,0]}/>
        <Bar dataKey="cost_equipment"   name="Equipamentos"   fill="#BA7517" radius={[2,2,0,0]}/>
        <Bar dataKey="cost_third_party" name="Subcontratados" fill="#534AB7" radius={[2,2,0,0]}/>
      </BarChart>
    </ResponsiveContainer>
  )
}
