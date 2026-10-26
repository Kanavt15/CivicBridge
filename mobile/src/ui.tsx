import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { useState, type ReactNode } from "react";
import { Check, ChevronDown, Languages, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useI18n } from "./providers";
import { locales, localeNames } from "../../src/lib/i18n/messages";
export const colors = {
  ink: "#171717",
  text: "#333333",
  muted: "#737373",
  border: "#e5e5e5",
  canvas: "#f7f7f7",
  card: "#ffffff",
  soft: "#f0f0f0",
};
export function T({ children, style }: { children: ReactNode; style?: any }) {
  const { t } = useI18n();
  return (
    <Text style={[ui.text, style]}>{typeof children === "string" ? t(children) : children}</Text>
  );
}
export function Button({
  title,
  onPress,
  secondary = false,
  busy = false,
  disabled = false,
  icon,
  style,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  busy?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  style?: ViewStyle;
}) {
  const { t } = useI18n();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t(title)}
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        ui.button,
        secondary && ui.secondary,
        { opacity: disabled || busy ? 0.45 : pressed ? 0.7 : 1 },
        style,
      ]}
    >
      {busy ? <ActivityIndicator color={secondary ? colors.ink : colors.card} /> : icon}
      <T style={[ui.buttonText, secondary && { color: colors.ink }]}>{title}</T>
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const { t } = useI18n();
  return (
    <View style={ui.field}>
      <T style={ui.label}>{label}</T>
      <TextInput
        {...props}
        accessibilityLabel={t(label)}
        placeholder={props.placeholder ? t(props.placeholder) : undefined}
        placeholderTextColor={colors.muted}
        style={[ui.input, props.multiline && ui.textarea, props.style]}
      />
    </View>
  );
}
export function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly { value: string; label: string; raw?: boolean }[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  return (
    <View style={ui.field}>
      <T style={ui.label}>{label}</T>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t(label)}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(true)}
        style={[ui.input, ui.select]}
      >
        <Text style={[ui.text, { flex: 1 }]}>
          {options.find((o) => o.value === value)?.raw
            ? options.find((o) => o.value === value)?.label
            : t(options.find((o) => o.value === value)?.label ?? "Choose an option")}
        </Text>
        <ChevronDown size={18} color={colors.muted} />
      </Pressable>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={ui.modalBackdrop}>
          <View
            style={[ui.sheet, { paddingBottom: Math.max(20, insets.bottom) }]}
            accessibilityViewIsModal
          >
            <View style={ui.row}>
              <T style={ui.sectionTitle}>{label}</T>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("Close")}
                onPress={() => setOpen(false)}
                hitSlop={12}
              >
                <X size={23} />
              </Pressable>
            </View>
            <ScrollView>
              {options.map((option) => (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: value === option.value }}
                  onPress={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  style={ui.option}
                >
                  <Text style={[ui.text, { flex: 1 }]}>
                    {option.raw ? option.label : t(option.label)}
                  </Text>
                  {option.value === value && <Check size={18} />}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
export function LanguagePicker() {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("Choose language")}
        onPress={() => setOpen(true)}
        style={ui.languageButton}
      >
        <Languages size={17} color={colors.muted} />
        <T style={{ fontSize: 12 }}>{localeNames[locale]}</T>
      </Pressable>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={ui.modalBackdrop}>
          <View
            style={[ui.sheet, { paddingBottom: Math.max(24, insets.bottom) }]}
            accessibilityViewIsModal
          >
            <View style={ui.row}>
              <T style={ui.sectionTitle}>Choose language</T>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("Close")}
                onPress={() => setOpen(false)}
                hitSlop={12}
              >
                <X size={23} />
              </Pressable>
            </View>
            {locales.map((l) => (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: l === locale }}
                key={l}
                style={ui.option}
                onPress={() => {
                  setLocale(l);
                  setOpen(false);
                }}
              >
                <Text style={[ui.text, { flex: 1 }]}>{localeNames[l]}</Text>
                {l === locale && <Check size={18} />}
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </>
  );
}
export function Loading() {
  return (
    <View style={ui.empty}>
      <ActivityIndicator color={colors.ink} size="large" />
      <T>Loading…</T>
    </View>
  );
}
export function ErrorView({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <View style={ui.empty} accessibilityRole="alert">
      <T style={ui.muted}>{message}</T>
      {retry && <Button title="Try again" secondary onPress={retry} />}
    </View>
  );
}
export function Empty({
  title = "Nothing here yet",
  description = "Try another search or clear the filters.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <View style={ui.empty}>
      <T style={ui.sectionTitle}>{title}</T>
      <T style={ui.muted}>{description}</T>
    </View>
  );
}
export function Screen({
  children,
  refreshControl,
}: {
  children: ReactNode;
  refreshControl?: React.ReactElement;
}) {
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={ui.screen}
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  );
}
const statuses: Record<string, string> = {
  OPEN: "Open for solutions",
  REPORTED: "Reported",
  UNDER_REVIEW: "Under review",
  COLLABORATION: "Collaboration",
  PILOT: "Pilot implementation",
  RESOLVED: "Resolved",
  REJECTED: "Rejected",
  SUBMITTED: "Submitted",
  SHORTLISTED: "Shortlisted",
  APPROVED: "Approved",
  COMPLETED: "Completed",
};
export function Status({ value }: { value: string }) {
  return (
    <View style={ui.badge}>
      <T style={ui.badgeText}>{statuses[value] ?? value}</T>
    </View>
  );
}
export const ui = StyleSheet.create({
  screen: {
    padding: 20,
    paddingBottom: 40,
    gap: 20,
    maxWidth: 800,
    width: "100%",
    alignSelf: "center",
  },
  text: { color: colors.text, fontSize: 15, lineHeight: 23 },
  title: {
    color: colors.ink,
    fontSize: 30,
    lineHeight: 39,
    fontWeight: "700",
    letterSpacing: -0.8,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600",
    letterSpacing: -0.4,
  },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 22 },
  label: { fontWeight: "600", fontSize: 14, color: colors.ink, marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 20,
    gap: 12,
  },
  button: {
    backgroundColor: colors.ink,
    borderRadius: 10,
    paddingHorizontal: 17,
    paddingVertical: 14,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  secondary: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
  buttonText: {
    color: colors.card,
    fontWeight: "600",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    flexShrink: 1,
  },
  field: { marginBottom: 17 },
  input: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 9,
    backgroundColor: colors.card,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.ink,
    minHeight: 48,
  },
  textarea: { minHeight: 130, textAlignVertical: "top", lineHeight: 25 },
  select: { flexDirection: "row", alignItems: "center", gap: 10 },
  empty: { padding: 28, alignItems: "center", gap: 15 },
  badge: {
    backgroundColor: colors.soft,
    borderRadius: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: "flex-start",
  },
  badgeText: { color: colors.text, fontSize: 11, lineHeight: 18 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border, marginVertical: 6 },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "#00000066" },
  sheet: {
    maxHeight: "85%",
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 15,
  },
  option: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  languageButton: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 7,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 7,
  },
  chips: { flexDirection: "row", gap: 8, alignItems: "center" },
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    minHeight: 40,
    justifyContent: "center",
  },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  small: { fontSize: 12, lineHeight: 19, color: colors.muted },
});
