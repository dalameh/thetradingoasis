import React, { ReactNode } from 'react';

interface CardProps {
  title: string;
  children: ReactNode;
}

const Card: React.FC<CardProps> = ({ title, children }) => {
  return (
    <div className="bg-white rounded-xl shadow p-5 flex flex-col">
      <h3 className="text-gray-500 text-sm font-medium mb-2">{title}</h3>
      {children}
    </div>
  );
};

export default Card;
