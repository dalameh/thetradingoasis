import { AreaChart as ReAreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { date: '12/09', pnl: 200 },
  { date: '12/10', pnl: -150 },
  { date: '12/11', pnl: 100 },
];

export default function AreaChart() {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <ReAreaChart data={data}>
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Area type="monotone" dataKey="pnl" stroke="#10B981" fill="#A7F3D0" />
      </ReAreaChart>
    </ResponsiveContainer>
  );
}
