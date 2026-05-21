import { NextRequest, NextResponse } from "next/server";
import type { ShelfBook, ShelfScanResponse } from "@do-i-have-this/shared";

const CLAUDE_ENABLED = process.env.CLAUDE_VISION_ENABLED === "true";

interface ClaudeBook {
  title: string;
  author: string;
  isbn?: string;
}

export async function POST(req: NextRequest) {
  if (!CLAUDE_ENABLED) {
    return NextResponse.json({ books: [], claudeEnabled: false } satisfies ShelfScanResponse);
  }

  const { image, mimeType } = await req.json();
  if (!image || !mimeType) {
    return NextResponse.json({ books: [], claudeEnabled: true } satisfies ShelfScanResponse);
  }

  const claudeBooks = await identifyShelfWithClaude(image, mimeType);
  if (!claudeBooks.length) {
    return NextResponse.json({ books: [], claudeEnabled: true } satisfies ShelfScanResponse);
  }

  // Enrich all detected books in parallel via Open Library.
  const books = await Promise.all(
    claudeBooks.map((b, i) => enrichBook(b, i))
  );

  return NextResponse.json({ books, claudeEnabled: true } satisfies ShelfScanResponse);
}

async function identifyShelfWithClaude(
  image: string,
  mimeType: string
): Promise<ClaudeBook[]> {
  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const anthropic = new Anthropic();
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mimeType as "image/jpeg", data: image },
            },
            {
              type: "text",
              text: `Look at this bookshelf image. List every book spine you can read.
Ignore any non-book objects (decorations, figurines, dioramas, etc.).
For each book include the title, author, and ISBN if printed in human-readable text (not barcode).
Respond with ONLY a JSON array — no markdown, no explanation:
[{"title":"<title>","author":"<author>","isbn":"<isbn or empty string>"},...]
If no books are readable, respond with: []`,
            },
          ],
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text.trim() : "[]";
    const parsed: ClaudeBook[] = JSON.parse(text);
    return parsed.filter((b) => b.title?.trim());
  } catch {
    return [];
  }
}

async function enrichBook(book: ClaudeBook, index: number): Promise<ShelfBook> {
  const base: ShelfBook = {
    localId: `${Date.now()}-${index}`,
    title: book.title,
    author: book.author,
    isbn: book.isbn || undefined,
    source: "claude",
  };

  try {
    const q = encodeURIComponent(`${book.title} ${book.author}`);
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${q}&limit=1&fields=title,author_name,isbn,cover_i,first_publish_year,key`
    );
    if (!res.ok) return base;
    const data = await res.json();
    const doc = data.docs?.[0];
    if (!doc) return base;

    return {
      ...base,
      // Prefer Open Library's canonical title/author over Claude's OCR
      title: doc.title ?? base.title,
      author: doc.author_name?.[0] ?? base.author,
      isbn: doc.isbn?.[0] ?? base.isbn,
      cover_url: doc.cover_i
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
        : undefined,
      published_year: doc.first_publish_year,
      open_library_key: doc.key,
      source: "open_library",
    };
  } catch {
    return base;
  }
}
