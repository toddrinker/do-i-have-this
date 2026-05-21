import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type {
  BookCatalogEntry,
  IdentifyRequest,
  IdentifyResponse,
  IdentifySource,
} from "@do-i-have-this/shared";
import type { Database } from "@do-i-have-this/shared";

// Set CLAUDE_VISION_ENABLED=true in .env.local when you have API credits.
const CLAUDE_ENABLED = process.env.CLAUDE_VISION_ENABLED === "true";

export async function POST(req: NextRequest) {
  const body: IdentifyRequest = await req.json();

  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  // Tier 1: ISBN barcode scan → catalog lookup (free, instant)
  if (body.isbn) {
    const cached = await lookupCatalogByIsbn(supabase, body.isbn);
    if (cached) return respond(cached, "catalog");
  }

  // Tier 2: ISBN → Open Library (free)
  if (body.isbn) {
    const entry = await lookupOpenLibraryByIsbn(body.isbn);
    if (entry) {
      await saveToCatalog(supabase, entry);
      return respond(entry, "open_library");
    }
  }

  // Tier 3: Image → Claude vision (requires CLAUDE_VISION_ENABLED=true + ANTHROPIC_API_KEY)
  if (body.image && body.mimeType) {
    if (!CLAUDE_ENABLED) {
      // Claude is not yet enabled — return nothing rather than error so the
      // mobile app can fall back to a manual search prompt.
      return respond(null, null);
    }

    const identified = await identifyWithClaude(body.image, body.mimeType);
    if (!identified) return respond(null, null);

    // Try to enrich the Claude result via Open Library before returning.
    const enriched = identified.isbn
      ? await lookupOpenLibraryByIsbn(identified.isbn)
      : await lookupOpenLibraryByTitle(identified.title, identified.author);

    const entry: BookCatalogEntry = enriched ?? {
      isbn: identified.isbn ?? "",
      title: identified.title,
      author: identified.author,
      source: "claude",
    };

    if (entry.isbn) await saveToCatalog(supabase, entry);
    return respond(entry, "claude");
  }

  return respond(null, null);
}

function respond(book: BookCatalogEntry | null, source: IdentifySource | null) {
  return NextResponse.json({ book, source } satisfies IdentifyResponse);
}

// --- Supabase catalog helpers ---

async function lookupCatalogByIsbn(supabase: ReturnType<typeof createServerClient<Database>>, isbn: string) {
  const { data } = await supabase
    .from("book_catalog")
    .select("*")
    .eq("isbn", isbn)
    .maybeSingle();
  return data ?? null;
}

async function saveToCatalog(supabase: ReturnType<typeof createServerClient<Database>>, entry: BookCatalogEntry) {
  if (!entry.isbn) return;
  await supabase.from("book_catalog").upsert(entry, { onConflict: "isbn", ignoreDuplicates: true });
}

// --- Open Library helpers ---

async function lookupOpenLibraryByIsbn(isbn: string): Promise<BookCatalogEntry | null> {
  try {
    const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`);
    if (!res.ok) return null;
    const data = await res.json();
    const book = data[`ISBN:${isbn}`];
    if (!book) return null;
    return {
      isbn,
      title: book.title,
      author: book.authors?.[0]?.name ?? "",
      cover_url: book.cover?.large ?? book.cover?.medium,
      published_year: book.publish_date ? parseInt(book.publish_date) : undefined,
      open_library_key: book.key,
      description: typeof book.notes === "string" ? book.notes : undefined,
      source: "open_library",
    };
  } catch {
    return null;
  }
}

async function lookupOpenLibraryByTitle(title: string, author: string): Promise<BookCatalogEntry | null> {
  try {
    const q = encodeURIComponent(`${title} ${author}`);
    const res = await fetch(`https://openlibrary.org/search.json?q=${q}&limit=1&fields=title,author_name,isbn,cover_i,first_publish_year,key`);
    if (!res.ok) return null;
    const data = await res.json();
    const doc = data.docs?.[0];
    if (!doc) return null;
    return {
      isbn: doc.isbn?.[0] ?? "",
      title: doc.title,
      author: doc.author_name?.[0] ?? author,
      cover_url: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : undefined,
      published_year: doc.first_publish_year,
      open_library_key: doc.key,
      source: "open_library",
    };
  } catch {
    return null;
  }
}

// --- Claude vision (only called when CLAUDE_VISION_ENABLED=true) ---

async function identifyWithClaude(
  image: string,
  mimeType: "image/jpeg" | "image/png" | "image/webp"
): Promise<{ title: string; author: string; isbn?: string } | null> {
  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const anthropic = new Anthropic();
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mimeType, data: image } },
            {
              type: "text",
              text: `Look at this book cover or spine. Extract the title, author, and ISBN if visible.
Respond with ONLY a JSON object — no markdown, no extra text:
{"title":"<title>","author":"<author>","isbn":"<isbn or empty string>"}
If you cannot identify a book, respond with: {"title":"","author":"","isbn":""}`,
            },
          ],
        },
      ],
    });
    const text = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    const parsed = JSON.parse(text);
    if (!parsed.title) return null;
    return { title: parsed.title, author: parsed.author, isbn: parsed.isbn || undefined };
  } catch {
    return null;
  }
}
