import type { ShelfBook } from "@do-i-have-this/shared";

/** Module-level store for shelf scan results — survives navigation, cleared after add. */
let pendingShelfBooks: ShelfBook[] = [];

export function setPendingShelfBooks(books: ShelfBook[]) {
  pendingShelfBooks = books.map((b, i) => ({
    ...b,
    localId: b.localId ?? `${Date.now()}-${i}`,
  }));
}

export function getPendingShelfBooks(): ShelfBook[] {
  return pendingShelfBooks;
}

export function clearPendingShelfBooks() {
  pendingShelfBooks = [];
}
