// ============================================================
// Writing Rules Hooks
// ============================================================

'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

export interface WritingRule {
  rule_id: number;
  category: string;
  rule_text: string;
  evidence_level: string;
  shap_score: number | null;
  chi_square_p: number | null;
  is_active: boolean;
  sort_order: number;
}

export function useWritingRules() {
  return useQuery({
    queryKey: ['writing-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('writing_rules')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as WritingRule[];
    },
    staleTime: 10 * 60 * 1000,
  });
}
