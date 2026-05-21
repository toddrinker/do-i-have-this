import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, router } from "expo-router";

export default function BookDetailScreen() {
  const { title, author, isbn } = useLocalSearchParams<{ title: string; author: string; isbn: string }>();

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{title ?? "Unknown Title"}</Text>
        <Text style={styles.author}>{author ?? "Unknown Author"}</Text>
        {isbn ? <Text style={styles.isbn}>ISBN: {isbn}</Text> : null}
      </View>
      <Pressable style={styles.addButton} onPress={() => router.back()}>
        <Text style={styles.addText}>Add to Library</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#fafaf9" },
  container: { padding: 24, gap: 16 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 24, borderWidth: 1, borderColor: "#e7e5e4" },
  title: { fontSize: 22, fontWeight: "700", color: "#1c1917" },
  author: { marginTop: 4, fontSize: 16, color: "#57534e" },
  isbn: { marginTop: 8, fontSize: 13, color: "#a8a29e" },
  addButton: { backgroundColor: "#1c1917", padding: 16, borderRadius: 12, alignItems: "center" },
  addText: { color: "#fafaf9", fontSize: 16, fontWeight: "600" },
});
