import * as FileSystem from "expo-file-system";
import type { BookIdentification } from "@do-i-have-this/shared";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export async function identifyBook(imageUri: string): Promise<BookIdentification | null> {
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const response = await fetch(`${API_URL}/api/identify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: base64, mimeType: "image/jpeg" }),
  });

  if (!response.ok) return null;
  return response.json();
}
