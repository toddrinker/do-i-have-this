export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      books: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          author: string;
          isbn: string | null;
          cover_url: string | null;
          notes: string | null;
          added_at: string;
          open_library_key: string | null;
          description: string | null;
          published_year: number | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          author: string;
          isbn?: string | null;
          cover_url?: string | null;
          notes?: string | null;
          added_at?: string;
          open_library_key?: string | null;
          description?: string | null;
          published_year?: number | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          author?: string;
          isbn?: string | null;
          cover_url?: string | null;
          notes?: string | null;
          added_at?: string;
          open_library_key?: string | null;
          description?: string | null;
          published_year?: number | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
