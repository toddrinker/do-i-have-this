import { useState } from "react";
import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { identifyBook } from "@/lib/identify";

export default function ScanScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  }

  async function takePhoto() {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  }

  async function identify() {
    if (!image) return;
    setLoading(true);
    try {
      const book = await identifyBook(image);
      if (book) {
        router.replace({ pathname: "/book/[id]", params: { id: "new", ...book } });
      } else {
        Alert.alert("Not found", "Couldn't identify a book in that image. Try a clearer photo of the cover or spine.");
      }
    } catch {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      {image ? (
        <>
          <Image source={{ uri: image }} style={styles.preview} />
          <View style={styles.actions}>
            <Pressable style={styles.secondaryButton} onPress={() => setImage(null)}>
              <Text style={styles.secondaryText}>Retake</Text>
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={identify} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fafaf9" />
              ) : (
                <Text style={styles.primaryText}>Identify Book</Text>
              )}
            </Pressable>
          </View>
        </>
      ) : (
        <View style={styles.options}>
          <Pressable style={styles.optionCard} onPress={takePhoto}>
            <Ionicons name="camera" size={36} color="#1c1917" />
            <Text style={styles.optionTitle}>Take Photo</Text>
            <Text style={styles.optionSub}>Point at a cover or spine</Text>
          </Pressable>
          <Pressable style={styles.optionCard} onPress={pickImage}>
            <Ionicons name="images" size={36} color="#1c1917" />
            <Text style={styles.optionTitle}>Choose Photo</Text>
            <Text style={styles.optionSub}>Pick from your camera roll</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafaf9", padding: 24 },
  preview: { flex: 1, borderRadius: 16, resizeMode: "cover" },
  actions: { flexDirection: "row", gap: 12, marginTop: 16 },
  primaryButton: { flex: 1, backgroundColor: "#1c1917", padding: 16, borderRadius: 12, alignItems: "center" },
  primaryText: { color: "#fafaf9", fontSize: 16, fontWeight: "600" },
  secondaryButton: { flex: 1, backgroundColor: "#e7e5e4", padding: 16, borderRadius: 12, alignItems: "center" },
  secondaryText: { color: "#1c1917", fontSize: 16, fontWeight: "600" },
  options: { flex: 1, gap: 16, justifyContent: "center" },
  optionCard: { backgroundColor: "#fff", borderRadius: 16, padding: 32, alignItems: "center", gap: 8, borderWidth: 1, borderColor: "#e7e5e4" },
  optionTitle: { fontSize: 18, fontWeight: "600", color: "#1c1917" },
  optionSub: { fontSize: 14, color: "#78716c" },
});
