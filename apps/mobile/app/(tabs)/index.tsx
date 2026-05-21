import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function LibraryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.empty}>Your library is empty.</Text>
      <Text style={styles.sub}>Scan a book cover or spine to get started.</Text>
      <Pressable style={styles.scanButton} onPress={() => router.push("/scan")}>
        <Ionicons name="camera-outline" size={22} color="#fafaf9" />
        <Text style={styles.scanButtonText}>Scan a Book</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#fafaf9" },
  empty: { fontSize: 20, fontWeight: "600", color: "#1c1917" },
  sub: { marginTop: 8, fontSize: 15, color: "#78716c", textAlign: "center" },
  scanButton: { marginTop: 32, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#1c1917", paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  scanButtonText: { color: "#fafaf9", fontSize: 16, fontWeight: "600" },
});
