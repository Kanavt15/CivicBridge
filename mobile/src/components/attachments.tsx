import { useState } from "react";
import { Image, Pressable, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { Camera, ImagePlus, X } from "lucide-react-native";
import { api } from "../lib/api";
import { Button, colors, T, ui } from "../ui";
import { useI18n } from "../providers";
export type Attachment = { id: string; name: string; uri: string };
export function Attachments({
  value,
  onChange,
  onBusy,
  limit = 4,
}: {
  value: Attachment[];
  onChange: (v: Attachment[]) => void;
  onBusy: (v: boolean) => void;
  limit?: number;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { t } = useI18n();
  async function pick(camera: boolean) {
    if (busy || value.length >= limit) return;
    setError("");
    setBusy(true);
    onBusy(true);
    try {
      if (camera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted)
          throw new Error("Camera permission was not granted. Choose a photo from your gallery.");
      }
      const result = camera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
      if (result.canceled) return;
      const original = result.assets[0];
      // Convert HEIC and other camera formats to the server's verified JPEG type.
      const context = ImageManipulator.manipulate(original.uri);
      if (Math.max(original.width, original.height) > 1800)
        context.resize(original.width >= original.height ? { width: 1800 } : { height: 1800 });
      const rendered = await context.renderAsync();
      const photo = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
      const form = new FormData();
      form.append("file", {
        uri: photo.uri,
        name: `civicbridge-${Date.now()}.jpg`,
        type: "image/jpeg",
      } as unknown as Blob);
      const uploaded = await api<{ id: string; name: string }>("/api/uploads", {
        method: "POST",
        body: form,
      });
      onChange([...value, { ...uploaded, uri: photo.uri }]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      onBusy(false);
    }
  }
  return (
    <View style={{ gap: 12 }}>
      <T style={ui.sectionTitle}>Photos</T>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Button
          title="Take a photo"
          secondary
          busy={busy}
          disabled={value.length >= limit}
          onPress={() => pick(true)}
          icon={<Camera size={17} />}
          style={{ flex: 1 }}
        />
        <Button
          title="Choose a photo"
          secondary
          disabled={busy || value.length >= limit}
          onPress={() => pick(false)}
          icon={<ImagePlus size={17} />}
          style={{ flex: 1 }}
        />
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {value.map((file) => (
          <View key={file.id}>
            <Image
              source={{ uri: file.uri }}
              style={{ width: 86, height: 86, borderRadius: 9 }}
              accessibilityLabel={file.name}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("Remove photo")}
              disabled={busy}
              onPress={() => onChange(value.filter((f) => f.id !== file.id))}
              style={{
                position: "absolute",
                top: -5,
                right: -5,
                borderRadius: 20,
                backgroundColor: colors.card,
                padding: 5,
                borderColor: colors.border,
                borderWidth: 1,
              }}
            >
              <X size={16} />
            </Pressable>
          </View>
        ))}
      </View>
      <T style={ui.small}>JPEG, PNG or WebP · up to 5 MB each</T>
      {error !== "" && (
        <View accessibilityRole="alert">
          <T>{error}</T>
        </View>
      )}
    </View>
  );
}
