import { useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, Image, Alert, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getPendingShelfBooks, clearPendingShelfBooks } from "@/lib/scan-store";
import type { ShelfBook } from "@do-i-have-this/shared";

export default function ShelfReviewScreen() {
  const [books, setBooks] = useState<ShelfBook[]>(() => getPendingShelfBooks());
  const [saving, setSaving] = useState(false);

  function removeBook(localId: string) {
    setBooks((prev) => prev.filter((b) => b.localId !== localId));
  }

  function updateBook(localId: string, field: "title" | "author", value: string) {
    setBooks((prev) =>
      prev.map((b) => (b.localId === localId ? { ...b, [field]: value } : b))
    );
  }

  async function addAll() {
    const valid = books.filter((b) => b.title.trim());
    if (!valid.length) {
      Alert.alert("No books to add", "Remove all books or keep at least one.");
      return;
    }

    setSaving(true);
    try {
      // TODO: save to Supabase user library
      // For now, navigate back with a count so the library tab can refresh.
      clearPendingShelfBooks();
      router.replace({
        pathname: "/(tabs)",
        params: { added: valid.length.toString() },
      });
    } finally {
      setSaving(false);
    }
  }

  if (!books.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No books to review.</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{books.length} book{books.length !== 1 ? "s" : ""} found — review before adding</Text>

      <FlatList
        data={books}
        keyExtractor={(b) => b.localId}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <BookCard
            book={item}
            onRemove={() => removeBook(item.localId)}
            onChangeTitle={(v) => updateBook(item.localId, "title", v)}
            onChangeAuthor={(v) => updateBook(item.localId, "author", v)}
            onSearch={() =>
              router.push({
                pathname: "/book/search",
                params: { replaceLocalId: item.localId },
              })
            }
          />
        )}
      />

      <View style={styles.footer}>
        <Pressable style={styles.addButton} onPress={addAll} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fafaf9" />
          ) : (
            <Text style={styles.addButtonText}>
              Add {books.filter((b) => b.title.trim()).length} Book{books.filter((b) => b.title.trim()).length !== 1 ? "s" : ""} to Library
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function BookCard({
  book,
  onRemove,
  onChangeTitle,
  onChangeAuthor,
  onSearch,
}: {
  book: ShelfBook;
  onRemove: () => void;
  onChangeTitle: (v: string) => void;
  onChangeAuthor: (v: string) => void;
  onSearch: () => void;
}) {
  return (
    <View style={card.container}>
      {book.cover_url ? (
        <Image source={{ uri: book.cover_url }} style={card.cover} />
      ) : (
        <View style={card.coverPlaceholder}>
          <Ionicons name="book-outline" size={24} color="#a8a29e" />
        </View>
      )}

      <View style={card.fields}>
        <TextInput
          style={card.titleInput}
          value={book.title}
          onChangeText={onChangeTitle}
          placeholder="Title"
          placeholderTextColor="#a8a29e"
        />
        <TextInput
          style={card.authorInput}
          value={book.author}
          onChangeText={onChangeAuthor}
          placeholder="Author"
          placeholderTextColor="#a8a29e"
        />
        <Pressable onPress={onSearch}>
          <Text style={card.searchLink}>Search differently</Text>
        </Pressable>
      </View>

      <Pressable style={card.remove} onPress={onRemove} hitSlop={8}>
        <Ionicons name="close-circle" size={22} color="#d6d3d1" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafaf9" },
  header: { fontSize: 14, color: "#78716c", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 16 },
  separator: { height: 1, backgroundColor: "#f5f5f4", marginVertical: 4 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: "#e7e5e4", backgroundColor: "#fafaf9" },
  addButton: { backgroundColor: "#1c1917", padding: 16, borderRadius: 12, alignItems: "center" },
  addButtonText: { color: "#fafaf9", fontSize: 16, fontWeight: "600" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 16, color: "#78716c" },
  link: { fontSize: 15, color: "#1c1917", textDecorationLine: "underline" },
});

const card = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 12 },
  cover: { width: 48, height: 68, borderRadius: 4, backgroundColor: "#e7e5e4" },
  coverPlaceholder: { width: 48, height: 68, borderRadius: 4, backgroundColor: "#f5f5f4", alignItems: "center", justifyContent: "center" },
  fields: { flex: 1, gap: 4 },
  titleInput: { fontSize: 15, fontWeight: "600", color: "#1c1917", borderBottomWidth: 1, borderBottomColor: "#e7e5e4", paddingVertical: 2 },
  authorInput: { fontSize: 14, color: "#57534e", borderBottomWidth: 1, borderBottomColor: "#e7e5e4", paddingVertical: 2 },
  searchLink: { fontSize: 12, color: "#78716c", textDecorationLine: "underline", marginTop: 4 },
  remove: { paddingTop: 2 },
});
