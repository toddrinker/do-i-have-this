import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import type { BookIdentification, IdentifyRequest, IdentifyResponse } from "@do-i-have-this/shared";

const anthropic = new Anthropic();

export async function POST(req: NextRequest) {
  const { image, mimeType }: IdentifyRequest = await req.json();

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mimeType, data: image },
          },
          {
            type: "text",
            text: `Look at this image of a book cover or spine. Extract the book title and author name.
Respond with ONLY a JSON object in this exact format (no markdown, no extra text):
{"title":"<title>","author":"<author>","isbn":"<isbn or empty string>","confidence":"high|medium|low"}
If you cannot identify a book, respond with: {"title":"","author":"","isbn":"","confidence":"low"}`,
          },
        ],
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text.trim() : "";

  let identification: BookIdentification;
  try {
    identification = JSON.parse(text);
  } catch {
    return NextResponse.json({ book: null } satisfies IdentifyResponse, { status: 422 });
  }

  if (!identification.title || identification.confidence === "low") {
    return NextResponse.json({ book: null } satisfies IdentifyResponse);
  }

  const enriched = await enrichFromOpenLibrary(identification.title, identification.author);

  return NextResponse.json({ book: identification, enriched } satisfies IdentifyResponse);
}

async function enrichFromOpenLibrary(title: string, author: string) {
  try {
    const query = encodeURIComponent(`${title} ${author}`);
    const res = await fetch(`https://openlibrary.org/search.json?q=${query}&limit=1&fields=title,author_name,isbn,cover_i,first_publish_year,key`);
    if (!res.ok) return undefined;
    const data = await res.json();
    const doc = data.docs?.[0];
    if (!doc) return undefined;
    return {
      title: doc.title,
      author: doc.author_name?.[0],
      isbn: doc.isbn?.[0],
      cover_url: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : undefined,
      published_year: doc.first_publish_year,
      open_library_key: doc.key,
    };
  } catch {
    return undefined;
  }
}
