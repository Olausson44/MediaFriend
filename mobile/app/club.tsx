import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { api, ClubProfile } from "../lib/api.js";

const PRESET_COLORS = [
  { name: "Röd", hex: "#dc2626" },
  { name: "Blå", hex: "#2563eb" },
  { name: "Svart", hex: "#0f172a" },
  { name: "Gul/Guld", hex: "#eab308" },
  { name: "Grön", hex: "#16a34a" },
  { name: "Vit", hex: "#f8fafc" },
];

export default function ClubProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [clubName, setClubName] = useState<string>("Pixbo IBK");
  const [defaultVenue, setDefaultVenue] = useState<string>("Wallenstam Arena");
  const [primaryColor, setPrimaryColor] = useState<string>("#dc2626");
  const [secondaryColor, setSecondaryColor] = useState<string>("#ffffff");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Ladda befintlig profil
  const { data: profile, isLoading } = useQuery({
    queryKey: ["clubProfile"],
    queryFn: () => api.getClubProfile(),
  });

  useEffect(() => {
    if (profile) {
      setClubName(profile.clubName || "Pixbo IBK");
      setDefaultVenue(profile.defaultVenue || "Wallenstam Arena");
      setPrimaryColor(profile.primaryColor || "#dc2626");
      setSecondaryColor(profile.secondaryColor || "#ffffff");
      setLogoUrl(profile.logoUrl || null);
    }
  }, [profile]);

  // Välj logotyp från kamerarullen
  const pickLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Behörighet krävs", "Tillåt appen att läsa bilder för att välja logotyp.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setLogoUrl(result.assets[0].uri);
    }
  };

  // Spara profil via React Query mutation
  const saveMutation = useMutation({
    mutationFn: (data: ClubProfile) => api.saveClubProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clubProfile"] });
      Alert.alert("Sparat!", "Föreningens profil och logotyp har sparats.");
      router.back();
    },
    onError: () => {
      Alert.alert("Fel", "Kunde inte spara profilen.");
    },
  });

  const handleSave = () => {
    if (!clubName.trim()) {
      Alert.alert("Obligatoriskt fält", "Ange föreningens namn.");
      return;
    }

    saveMutation.mutate({
      clubName,
      defaultVenue,
      primaryColor,
      secondaryColor,
      logoUrl: logoUrl || undefined,
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenSubtitle}>
        Ställ in din förening. Inställningarna används automatiskt som standard på alla matchplanscher.
      </Text>

      {/* Klubbens Logotyp */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Officiellt Klubb- och Föreningsmärke</Text>
        <Text style={styles.cardSubtitle}>
          Ladda upp en högupplöst transparent PNG för bästa resultat på planscherna.
        </Text>

        <View style={styles.logoRow}>
          {logoUrl ? (
            <Image source={{ uri: logoUrl }} style={styles.logoPreview} />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Ionicons name="shield-outline" size={36} color="#64748b" />
            </View>
          )}

          <View style={styles.logoButtons}>
            <TouchableOpacity style={styles.uploadButton} onPress={pickLogo}>
              <Ionicons name="cloud-upload-outline" size={18} color="#ffffff" />
              <Text style={styles.uploadButtonText}>
                {logoUrl ? "Byt logotyp" : "Ladda upp logga"}
              </Text>
            </TouchableOpacity>

            {logoUrl && (
              <TouchableOpacity style={styles.removeButton} onPress={() => setLogoUrl(null)}>
                <Text style={styles.removeButtonText}>Ta bort</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Grunduppgifter */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Föreningsuppgifter</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Föreningens namn</Text>
          <TextInput
            style={styles.input}
            value={clubName}
            onChangeText={setClubName}
            placeholder="T.ex. Pixbo IBK, IBF Falun"
            placeholderTextColor="#64748b"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Standardarena / Hemmahall</Text>
          <TextInput
            style={styles.input}
            value={defaultVenue}
            onChangeText={setDefaultVenue}
            placeholder="T.ex. Wallenstam Arena, Guide Arena"
            placeholderTextColor="#64748b"
          />
        </View>
      </View>

      {/* Klubbens Färger */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Primär Klubbfärg</Text>
        <Text style={styles.cardSubtitle}>Används för bakgrundstoner och ljuseffekter</Text>

        <View style={styles.colorPresetsRow}>
          {PRESET_COLORS.map((c) => (
            <TouchableOpacity
              key={c.hex}
              style={[
                styles.colorCircle,
                { backgroundColor: c.hex },
                primaryColor === c.hex && styles.activeColorCircle,
              ]}
              onPress={() => setPrimaryColor(c.hex)}
            />
          ))}
        </View>
      </View>

      {/* Spara-knapp */}
      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSave}
        disabled={saveMutation.isPending}
      >
        {saveMutation.isPending ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
            <Text style={styles.saveButtonText}>Spara Föreningsprofil</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090d16",
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  screenSubtitle: {
    color: "#94a3b8",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#090d16",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#131b2e",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1e293b",
    gap: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#64748b",
    lineHeight: 16,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 6,
  },
  logoPreview: {
    width: 64,
    height: 64,
    resizeMode: "contain",
  },
  logoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: "#1e293b",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#334155",
    borderStyle: "dashed",
  },
  logoButtons: {
    gap: 8,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#2563eb",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  uploadButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 13,
  },
  removeButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
  },
  removeButtonText: {
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "600",
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#090d16",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#ffffff",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  colorPresetsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  colorCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: "transparent",
  },
  activeColorCircle: {
    borderColor: "#38bdf8",
    transform: [{ scale: 1.15 }],
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#16a34a",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
