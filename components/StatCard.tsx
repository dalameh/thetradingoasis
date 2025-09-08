import React from 'react';
import Card from './Card';

interface StatCardProps {
  title: string;
  value: string | number;
  subText?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subText }) => (
  <Card title={title}>
    <p className="text-2xl font-semibold text-gray-900">{value}</p>
    {subText && <p className="text-sm text-gray-400 mt-1">{subText}</p>}
  </Card>
);

export default StatCard;
