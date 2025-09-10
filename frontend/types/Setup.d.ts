export type Setup = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  rules: string[];
  type: string;
  market: string;
  conditions: string;
  created_at: string;
  win_rate?: number;
  avg_return?: number | string;
};