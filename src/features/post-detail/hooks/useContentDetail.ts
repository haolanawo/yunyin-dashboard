// ============================================================
// Post Detail Hooks
// ============================================================

'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

export interface ContentDetail {
  content_id: string;
  title: string | null;
  platform: string;
  account_name: string | null;
  publish_date: string | null;
  content_type: string | null;
  url: string | null;
  text: string | null;
  // structural labels
  hook_type: string | null;
  narrative_mode: string | null;
  emotional_valence: string | null;
  dominant_arg_style: string | null;
  persona: string | null;
  segment_types: string[] | null;
  conclusion_type: string | null;
  has_conclusion: boolean | null;
  has_promotion: boolean | null;
  promotion_position: string | null;
  text_length: number | null;
  data_count: number | null;
  mentions_price: boolean | null;
  mentions_free: boolean | null;
  ai_score: number | null;
  topic_types: string[] | null;
  tool_families: string[] | null;
}

export function useContentDetail(contentId: string) {
  return useQuery({
    queryKey: ['content-detail', contentId],
    queryFn: async () => {
      // Fetch content
      const { data: content, error: contError } = await supabase
        .from('contents')
        .select('*')
        .eq('content_id', contentId)
        .single();
      if (contError) throw contError;
      if (!content) throw new Error('内容未找到');

      // Fetch account name
      let accountName = '未知';
      if (content.account_id) {
        const { data: acc } = await supabase
          .from('zhihu_accounts')
          .select('account_name')
          .eq('account_id', content.account_id)
          .single();
        if (acc) accountName = acc.account_name ?? '未知';
      }

      // Fetch structural labels
      const { data: labels } = await supabase
        .from('structural_labels')
        .select('*')
        .eq('content_id', contentId)
        .maybeSingle();

      return {
        content_id: content.content_id,
        title: content.title,
        platform: content.platform ?? 'zhihu',
        account_name: accountName,
        publish_date: content.publish_date,
        content_type: content.content_type,
        url: content.url,
        text: content.text,
        hook_type: labels?.hook_type ?? null,
        narrative_mode: labels?.narrative_mode ?? null,
        emotional_valence: labels?.emotional_valence ?? null,
        dominant_arg_style: labels?.dominant_arg_style ?? null,
        persona: labels?.persona ?? null,
        segment_types: labels?.segment_types ?? null,
        conclusion_type: labels?.conclusion_type ?? null,
        has_conclusion: labels?.has_conclusion ?? null,
        has_promotion: labels?.has_promotion ?? null,
        promotion_position: labels?.promotion_position ?? null,
        text_length: labels?.text_length ?? null,
        data_count: labels?.data_count ?? null,
        mentions_price: labels?.mentions_price ?? null,
        mentions_free: labels?.mentions_free ?? null,
        ai_score: labels?.ai_score !== null && labels?.ai_score !== undefined
          ? Number(labels.ai_score) : null,
        topic_types: labels?.topic_types ?? null,
        tool_families: labels?.tool_families ?? null,
      } as ContentDetail;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!contentId,
  });
}

export interface ContentMetric {
  snapshot_date: string;
  votes: number;
  comments: number;
}

export function useContentMetrics(contentId: string) {
  return useQuery({
    queryKey: ['content-metrics', contentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('metrics_daily')
        .select('snapshot_date, votes, comments')
        .eq('content_id', contentId)
        .order('snapshot_date', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row): ContentMetric => ({
        snapshot_date: row.snapshot_date,
        votes: row.votes ?? 0,
        comments: row.comments ?? 0,
      }));
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!contentId,
  });
}
