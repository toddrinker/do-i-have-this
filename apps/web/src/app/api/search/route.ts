import { NextRequest, NextResponse } from "next/server";
import type { BookCatalogEntry, SearchResponse } from "@do-i-have-this/shared";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] } satisfies SearchResponse);
  }

  try {
    const encoded = encodeURIComponent(q);
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${encoded}&limit=10&fields=title,author_name,isbn,cover_i,first_publish_year,key`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return NextResponse.json({ results: [] } satisfies SearchResponse);

    const data = await res.json();
    const results: BookCatalogEntry[] = (data.docs ?? [])
      .filter((doc: Record<string, unknown>) => doc.title && doc.author_name)
      .map((doc: Record<string, unknown>) => ({
        isbn: (doc.isbn as string[] | undefined)?.[0] ?? "",
        title: doc.title as string,
        author: (doc.author_name as string[])[0],
        cover_url: doc.cover_i
          ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
          : undefined,
        published_year: doc.first_publish_year as number | undefined,
        open_library_key: doc.key as string | undefined,
        source: "open_library" as const,
      }));

    return NextResponse.json({ results } satisfies SearchResponse);
  } catch {
    return NextResponse.json({ results: [] } satisfies SearchResponse);
  }
}
