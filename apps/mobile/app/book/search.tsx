import { useState, useCallback } from "react";
import { View, Text, StyleSheet, TextInput, FlatList, Pressable, Image, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { BookCatalogEntry, SearchResponse } from "@do-i-have-this/shared";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export default function BookSearchScreen() {
  const params = useLocalSearchParams<{ replaceLocalId?: string; replaceConfirm?: string }>();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookCatalogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(q)}`);
      const data: SearchResponse = await res.json();
      setResults(data.results);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function selectBook(book: BookCatalogEntry) {
    const bookParams = {
      title: book.title,
      author: book.author,
      isbn: book.isbn ?? "",
      cover_url: book.cover_url ?? "",
      published_year: book.published_year?.toString() ?? "",
      open_library_key: book.open_library_key ?? "",
      source: book.source,
    };

    if (params.replaceConfirm) {
      // Coming from confirm screen — replace it with updated data
      router.replace({ pathname: "/book/confirm", params: bookParams });
    } else if (params.replaceLocalId) {
      // Coming from shelf review — go back, review screen will re-read store
      // For now, navigate to confirm so user can finalize this specific book
      router.replace({ pathname: "/book/confirm", params: bookParams });
    } else {
      router.replace({ pathname: "/book/confirm", params: bookParams });
    }
  }

  function enterManually() {
    router.replace("/book/confirm");
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Title, author, or ISBN…"
          placeholderTextColor="#a8a29e"
          returnKeyType="search"
          autoFocus
          onSubmitEditing={() => search(query)}
          autoCorrect={false}
        />
        <Pressable style={styles.searchButton} onPress={() => search(query)} disabled={loading}>
          {loading ? <ActivityIndicator size="small" color="#fafaf9" /> : <Ionicons name="search" size={18} color="#fafaf9" />}
        </Pressable>
      </View>

      {!searched && (
        <View style={styles.hint}>
          <Text style={styles.hintText}>Search Open Library — over 20 million books.</Text>
          <Pressable style={styles.manualButton} onPress={enterManually}>
            <Text style={styles.manualText}>Enter details manually instead</Text>
          </Pressable>
        </View>
      )}

      {searched && !loading && results.length === 0 && (
        <View style={styles.hint}>
          <Text style={styles.hintText}>No results found.</Text>
          <Pressable style={styles.manualButton} onPress={enterManually}>
            <Text style={styles.manualText}>Enter details manually</Text>
          </Pressable>
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={(item, i) => item.isbn || `${item.title}-${i}`}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => <ResultRow book={item} onSelect={() => selectBook(item)} />}
      />
    </View>
  );
}

function ResultRow({ book, onSelect }: { book: BookCatalogEntry; onSelect: () => void }) {
  return (
    <Pressable style={row.container} onPress={onSelect}>
      {book.cover_url ? (
        <Image source={{ uri: book.cover_url }} style={row.cover} />
      ) : (
        <View style={row.coverPlaceholder}>
          <Ionicons name="book-outline" size={20} color="#a8a29e" />
        </View>
      )}
      <View style={row.text}>
        <Text style={row.title} numberOfLines={2}>{book.title}</Text>
        <Text style={row.author} numberOfLines={1}>{book.author}</Text>
        {book.published_year ? <Text style={row.year}>{book.published_year}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color="#d6d3d1" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafaf9" },
  searchRow: { flexDirection: "row", gap: 8, padding: 16 },
  input: { flex: 1, fontSize: 16, color: "#1c1917", borderWidth: 1, borderColor: "#e7e5e4", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#fff" },
  searchButton: { backgroundColor: "#1c1917", width: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  hint: { alignItems: "center", paddingTop: 40, gap: 16 },
  hintText: { fontSize: 15, color: "#78716c" },
  manualButton: { borderWidth: 1, borderColor: "#e7e5e4", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  manualText: { fontSize: 14, color: "#57534e" },
});

const row = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f5f5f4" },
  cover: { width: 40, height: 56, borderRadius: 3, backgroundColor: "#e7e5e4" },
  coverPlaceholder: { width: 40, height: 56, borderRadius: 3, backgroundColor: "#f5f5f4", alignItems: "center", justifyContent: "center" },
  text: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontWeight: "600", color: "#1c1917" },
  author: { fontSize: 13, color: "#57534e" },
  year: { fontSize: 12, color: "#a8a29e" },
});
