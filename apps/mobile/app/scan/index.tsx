import { useState } from "react";
import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator, Alert } from "react-native";
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { identify } from "@/lib/identify";
import { setPendingShelfBooks } from "@/lib/scan-store";
import type { ShelfScanResponse } from "@do-i-have-this/shared";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

type Mode = "barcode" | "photo-preview";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<Mode>("barcode");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(false);

  // --- Single book: barcode ---
  async function handleBarcode({ data }: BarcodeScanningResult) {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);
    try {
      const book = await identify({ isbn: data });
      if (book) {
        router.replace({
          pathname: "/book/confirm",
          params: {
            title: book.title,
            author: book.author,
            isbn: book.isbn ?? "",
            cover_url: book.cover_url ?? "",
            published_year: book.published_year?.toString() ?? "",
            open_library_key: book.open_library_key ?? "",
            source: book.source,
          },
        });
      } else {
        Alert.alert(
          "Not found",
          "That ISBN isn't in our catalog yet. Try photographing the cover instead.",
          [
            { text: "Take Photo", onPress: () => setScanned(false) },
            { text: "Enter Manually", onPress: () => router.push("/book/confirm") },
            { text: "Cancel", onPress: () => setScanned(false), style: "cancel" },
          ]
        );
      }
    } finally {
      setLoading(false);
    }
  }

  // --- Single book: photo ---
  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setMode("photo-preview");
    }
  }

  async function identifyFromPhoto() {
    if (!image) return;
    setLoading(true);
    try {
      const book = await identify({ imageUri: image });
      if (book) {
        router.replace({
          pathname: "/book/confirm",
          params: {
            title: book.title,
            author: book.author,
            isbn: book.isbn ?? "",
            cover_url: book.cover_url ?? "",
            published_year: book.published_year?.toString() ?? "",
            open_library_key: book.open_library_key ?? "",
            source: book.source,
          },
        });
      } else {
        Alert.alert(
          "Not identified",
          "Cover scanning isn't available yet, or couldn't find this book. You can search for it or enter it manually.",
          [
            { text: "Search", onPress: () => router.replace("/book/search") },
            { text: "Enter Manually", onPress: () => router.replace("/book/confirm") },
            { text: "Cancel", onPress: () => { setImage(null); setMode("barcode"); }, style: "cancel" },
          ]
        );
      }
    } finally {
      setLoading(false);
    }
  }

  // --- Shelf scan ---
  async function scanShelf() {
    const result = await ImagePicker.launchCameraAsync({ quality: 0.85, base64: true });
    if (result.canceled || !result.assets[0].base64) return;

    setLoading(true);
    try {
      const base64 = result.assets[0].base64 ??
        await FileSystem.readAsStringAsync(result.assets[0].uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

      const res = await fetch(`${API_URL}/api/identify-shelf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mimeType: "image/jpeg" }),
      });

      const data: ShelfScanResponse = await res.json();

      if (!data.claudeEnabled) {
        Alert.alert(
          "Shelf scanning not available yet",
          "This feature requires the Claude API. Add your API key when you're ready — barcode scanning works now.",
          [{ text: "OK" }]
        );
        return;
      }

      if (!data.books.length) {
        Alert.alert("No books found", "Couldn't identify any books in that photo. Try a clearer, well-lit shot of the spines.");
        return;
      }

      setPendingShelfBooks(data.books);
      router.push("/scan/review");
    } finally {
      setLoading(false);
    }
  }

  // --- Permission gate ---
  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permText}>Camera access is needed to scan barcodes.</Text>
        <Pressable style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.primaryText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  // --- Photo preview ---
  if (mode === "photo-preview" && image) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: image }} style={styles.preview} resizeMode="cover" />
        <View style={styles.footer}>
          <Pressable style={styles.secondaryButton} onPress={() => { setImage(null); setMode("barcode"); }}>
            <Text style={styles.secondaryText}>Back</Text>
          </Pressable>
          <Pressable style={styles.primaryButton} onPress={identifyFromPhoto} disabled={loading}>
            {loading ? <ActivityIndicator color="#fafaf9" /> : <Text style={styles.primaryText}>Identify Cover</Text>}
          </Pressable>
        </View>
      </View>
    );
  }

  // --- Barcode scanner (default) ---
  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "isbn13"] }}
        onBarcodeScanned={handleBarcode}
      >
        <View style={styles.overlay}>
          <View style={styles.scanFrame} />
          <Text style={styles.hint}>Point at the barcode on the back cover</Text>
        </View>
      </CameraView>

      {loading && (
        <View style={styles.loadingBanner}>
          <ActivityIndicator color="#fafaf9" size="small" />
          <Text style={styles.loadingText}>Looking up book…</Text>
        </View>
      )}

      <View style={styles.footer}>
        <Pressable style={styles.footerButton} onPress={pickPhoto} disabled={loading}>
          <Ionicons name="image-outline" size={18} color="#1c1917" />
          <Text style={styles.footerButtonText}>Single Cover Photo</Text>
        </Pressable>
        <Pressable style={styles.footerButton} onPress={scanShelf} disabled={loading}>
          <Ionicons name="library-outline" size={18} color="#1c1917" />
          <Text style={styles.footerButtonText}>Scan Whole Shelf</Text>
        </Pressable>
        <Pressable style={styles.footerButton} onPress={() => router.push("/book/search")} disabled={loading}>
          <Ionicons name="search-outline" size={18} color="#1c1917" />
          <Text style={styles.footerButtonText}>Search / Enter Manually</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafaf9" },
  camera: { flex: 1 },
  overlay: { flex: 1, alignItems: "center", justifyContent: "center", gap: 20 },
  scanFrame: { width: 240, height: 100, borderWidth: 2, borderColor: "#fff", borderRadius: 12 },
  hint: { color: "#fff", fontSize: 14, textShadowColor: "rgba(0,0,0,0.8)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  loadingBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#1c1917", padding: 12, justifyContent: "center" },
  loadingText: { color: "#fafaf9", fontSize: 14 },
  preview: { flex: 1 },
  footer: { gap: 8, padding: 16, backgroundColor: "#fafaf9" },
  footerButton: { flexDirection: "row", alignItems: "center", gap: 8, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: "#e7e5e4", justifyContent: "center" },
  footerButtonText: { fontSize: 15, color: "#1c1917" },
  primaryButton: { flex: 1, backgroundColor: "#1c1917", padding: 16, borderRadius: 12, alignItems: "center" },
  primaryText: { color: "#fafaf9", fontSize: 16, fontWeight: "600" },
  secondaryButton: { flex: 1, backgroundColor: "#e7e5e4", padding: 16, borderRadius: 12, alignItems: "center" },
  secondaryText: { color: "#1c1917", fontSize: 16, fontWeight: "600" },
  permText: { fontSize: 16, color: "#57534e", textAlign: "center", marginBottom: 16, paddingHorizontal: 32 },
});
