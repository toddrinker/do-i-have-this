import { useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, Image, ScrollView, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function ConfirmBookScreen() {
  const params = useLocalSearchParams<{
    title?: string;
    author?: string;
    isbn?: string;
    cover_url?: string;
    published_year?: string;
    open_library_key?: string;
    source?: string;
  }>();

  const [title, setTitle] = useState(params.title ?? "");
  const [author, setAuthor] = useState(params.author ?? "");
  const [isbn, setIsbn] = useState(params.isbn ?? "");
  const [saving, setSaving] = useState(false);

  const isManual = !params.title;
  const coverUrl = params.cover_url || null;

  async function save() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      // TODO: save to Supabase user library
      router.replace("/(tabs)");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Cover */}
      <View style={styles.coverRow}>
        {coverUrl ? (
          <Image source={{ uri: coverUrl }} style={styles.cover} />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Ionicons name="book-outline" size={40} color="#a8a29e" />
          </View>
        )}
        {params.source && !isManual && (
          <View style={styles.sourceBadge}>
            <Text style={styles.sourceText}>
              {params.source === "catalog" ? "From catalog" :
               params.source === "open_library" ? "From Open Library" :
               "Identified by Claude"}
            </Text>
          </View>
        )}
      </View>

      {/* Fields */}
      <View style={styles.fields}>
        <Field label="Title" value={title} onChangeText={setTitle} placeholder="Book title" autoFocus={isManual} />
        <Field label="Author" value={author} onChangeText={setAuthor} placeholder="Author name" />
        <Field label="ISBN" value={isbn} onChangeText={setIsbn} placeholder="Optional" keyboardType="numeric" />
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          style={styles.addButton}
          onPress={save}
          disabled={saving || !title.trim()}
        >
          {saving ? (
            <ActivityIndicator color="#fafaf9" />
          ) : (
            <Text style={styles.addButtonText}>Add to Library</Text>
          )}
        </Pressable>

        <Pressable
          style={styles.searchButton}
          onPress={() => router.push({ pathname: "/book/search", params: { replaceConfirm: "true" } })}
        >
          <Ionicons name="search-outline" size={16} color="#57534e" />
          <Text style={styles.searchButtonText}>Search for a different edition</Text>
        </Pressable>
      </View>

      {/* Discard */}
      <Pressable style={styles.discard} onPress={() => router.back()}>
        <Text style={styles.discardText}>Discard</Text>
      </Pressable>
    </ScrollView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  autoFocus = false,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric";
  autoFocus?: boolean;
}) {
  return (
    <View style={field.container}>
      <Text style={field.label}>{label}</Text>
      <TextInput
        style={field.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#a8a29e"
        keyboardType={keyboardType}
        autoFocus={autoFocus}
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#fafaf9" },
  container: { padding: 24, gap: 24 },
  coverRow: { alignItems: "center", gap: 8 },
  cover: { width: 100, height: 140, borderRadius: 6 },
  coverPlaceholder: { width: 100, height: 140, borderRadius: 6, backgroundColor: "#f5f5f4", alignItems: "center", justifyContent: "center" },
  sourceBadge: { backgroundColor: "#f5f5f4", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  sourceText: { fontSize: 12, color: "#78716c" },
  fields: { gap: 16 },
  actions: { gap: 12 },
  addButton: { backgroundColor: "#1c1917", padding: 16, borderRadius: 12, alignItems: "center" },
  addButtonText: { color: "#fafaf9", fontSize: 16, fontWeight: "600" },
  searchButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: "#e7e5e4" },
  searchButtonText: { fontSize: 15, color: "#57534e" },
  discard: { alignItems: "center", paddingVertical: 8 },
  discardText: { fontSize: 14, color: "#a8a29e" },
});

const field = StyleSheet.create({
  container: { gap: 4 },
  label: { fontSize: 12, fontWeight: "600", color: "#78716c", textTransform: "uppercase", letterSpacing: 0.5 },
  input: { fontSize: 16, color: "#1c1917", borderWidth: 1, borderColor: "#e7e5e4", borderRadius: 10, padding: 12, backgroundColor: "#fff" },
});
