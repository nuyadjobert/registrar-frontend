export interface Term {
  id: number;
  name: string;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TermPayload {
  name: string;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean;
}