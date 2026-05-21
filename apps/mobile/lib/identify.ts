import * as FileSystem from "expo-file-system";
import type { BookCatalogEntry, IdentifyResponse } from "@do-i-have-this/shared";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

type IdentifyOptions =
  | { isbn: string; imageUri?: never }
  | { imageUri: string; isbn?: never };

export async function identify(options: IdentifyOptions): Promise<BookCatalogEntry | null> {
  const body: Record<string, string> = {};

  if (options.isbn) {
    body.isbn = options.isbn;
  } else {
    const base64 = await FileSystem.readAsStringAsync(options.imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    body.image = base64;
    body.mimeType = "image/jpeg";
  }

  const response = await fetch(`${API_URL}/api/identify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) return null;
  const data: IdentifyResponse = await response.json();
  return data.book;
}
