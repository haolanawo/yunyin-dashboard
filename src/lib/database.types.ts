/**
 * Supabase Database Types
 *
 * 当 Supabase schema 变更后，运行以下命令重新生成此文件：
 *   npx supabase gen types typescript --linked > src/lib/database.types.ts
 *
 * 当前为占位类型 — 替换为实际 schema
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      [table: string]: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
