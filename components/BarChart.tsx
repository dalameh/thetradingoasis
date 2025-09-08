import { BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { date: '12/09', pnl: 200 },
  { date: '12/10', pnl: -150 },
  { date: '12/11', pnl: 50 },
];

export default function BarChart() {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <ReBarChart data={data}>
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="pnl" fill="#3B82F6" />
      </ReBarChart>
    </ResponsiveContainer>
  );
}
