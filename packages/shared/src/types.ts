export interface BookIdentification {
  title: string;
  author: string;
  isbn?: string;
  confidence: "high" | "medium" | "low";
}

export interface Book {
  id: string;
  user_id: string;
  title: string;
  author: string;
  isbn?: string;
  cover_url?: string;
  notes?: string;
  added_at: string;
  open_library_key?: string;
  description?: string;
  published_year?: number;
}

export interface IdentifyRequest {
  image: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
}

export interface IdentifyResponse {
  book: BookIdentification | null;
  enriched?: Partial<Book>;
}
