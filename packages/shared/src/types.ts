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

export interface BookCatalogEntry {
  isbn: string;
  title: string;
  author: string;
  cover_url?: string;
  published_year?: number;
  open_library_key?: string;
  description?: string;
  source: "open_library" | "claude";
}

export interface IdentifyRequest {
  /** Base64-encoded image, used when no ISBN was scanned from a barcode. */
  image?: string;
  mimeType?: "image/jpeg" | "image/png" | "image/webp";
  /** ISBN scanned directly from a barcode — skips vision entirely. */
  isbn?: string;
}

export type IdentifySource = "catalog" | "open_library" | "claude";

export interface IdentifyResponse {
  book: BookCatalogEntry | null;
  /** Which tier of the lookup chain produced the result. */
  source: IdentifySource | null;
}
