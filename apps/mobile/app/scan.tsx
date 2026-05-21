import { useState, useRef } from "react";
import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator, Alert } from "react-native";
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { identify } from "@/lib/identify";

type Mode = "barcode" | "photo-preview";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<Mode>("barcode");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(false);

  async function handleBarcode({ data }: BarcodeScanningResult) {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);
    try {
      const book = await identify({ isbn: data });
      if (book) {
        router.replace({ pathname: "/book/[id]", params: { id: "new", ...book } });
      } else {
        Alert.alert(
          "Not found",
          "That ISBN isn't in the catalog yet. Try photographing the cover to identify it.",
          [
            { text: "Take Photo", onPress: () => { setScanned(false); setMode("barcode"); } },
            { text: "Cancel", onPress: () => setScanned(false), style: "cancel" },
          ]
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
    setMode("photo-preview");
  }

  async function identifyFromPhoto() {
    if (!image) return;
    setLoading(true);
    try {
      const book = await identify({ imageUri: image });
      if (book) {
        router.replace({ pathname: "/book/[id]", params: { id: "new", ...book } });
      } else {
        Alert.alert(
          "Not found",
          "Couldn't identify a book from that photo. The cover identification feature will be available soon, or try scanning the barcode.",
          [{ text: "OK", onPress: () => { setImage(null); setMode("barcode"); } }]
        );
      }
    } finally {
      setLoading(false);
    }
  }

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

  if (mode === "photo-preview" && image) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: image }} style={styles.preview} />
        <View style={styles.actions}>
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
        <Pressable style={styles.footerButton} onPress={pickImage}>
          <Ionicons name="images-outline" size={20} color="#1c1917" />
          <Text style={styles.footerButtonText}>Use Cover Photo Instead</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafaf9" },
  camera: { flex: 1 },
  overlay: { flex: 1, alignItems: "center", justifyContent: "center", gap: 20 },
  scanFrame: { width: 240, height: 120, borderWidth: 2, borderColor: "#fff", borderRadius: 12, backgroundColor: "transparent" },
  hint: { color: "#fff", fontSize: 14, textShadowColor: "rgba(0,0,0,0.8)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  loadingBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#1c1917", padding: 12, justifyContent: "center" },
  loadingText: { color: "#fafaf9", fontSize: 14 },
  footer: { padding: 24, backgroundColor: "#fafaf9" },
  footerButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: "#e7e5e4" },
  footerButtonText: { fontSize: 15, color: "#1c1917" },
  preview: { flex: 1, resizeMode: "cover" },
  actions: { flexDirection: "row", gap: 12, padding: 24, backgroundColor: "#fafaf9" },
  primaryButton: { flex: 1, backgroundColor: "#1c1917", padding: 16, borderRadius: 12, alignItems: "center" },
  primaryText: { color: "#fafaf9", fontSize: 16, fontWeight: "600" },
  secondaryButton: { flex: 1, backgroundColor: "#e7e5e4", padding: 16, borderRadius: 12, alignItems: "center" },
  secondaryText: { color: "#1c1917", fontSize: 16, fontWeight: "600" },
  permText: { fontSize: 16, color: "#57534e", textAlign: "center", marginBottom: 16, paddingHorizontal: 32 },
});
