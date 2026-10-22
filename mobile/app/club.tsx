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
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, ClubProfile } from "../lib/api";

const POPULAR_CLUBS = [
  { name: "Pixbo IBK", color: "#dc2626", logo: "https://stats.innebandy.se/content/logos/101.png" },
  { name: "IBF Falun", color: "#e11d48", logo: "https://stats.innebandy.se/content/logos/102.png" },
  { name: "Storvreta IBK", color: "#b91c1c", logo: "https://stats.innebandy.se/content/logos/105.png" },
  { name: "Mullsjö AIS", color: "#2563eb", logo: "https://stats.innebandy.se/content/logos/106.png" },
  { name: "Lindome IBK", color: "#16a34a", logo: "https://stats.innebandy.se/content/logos/104.png" },
];

const POPULAR_TEAMS = [
  "Alla lag (Hela föreningen)",
  "Herr A (SSL/Div 1)",
  "Dam A (SSL/Allsvenskan)",
  "Juniorallsvenskan HJ",
  "Juniorallsvenskan DJ",
  "U-lag / Utveckling",
];

export default function ClubProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [clubName, setClubName] = useState<string>("Pixbo IBK");
  const [teamName, setTeamName] = useState<string>("Alla lag (Hela föreningen)");
  const [defaultVenue, setDefaultVenue] = useState<string>("Wallenstam Arena");
  const [primaryColor, setPrimaryColor] = useState<string>("#dc2626");
  const [secondaryColor, setSecondaryColor] = useState<string>("#ffffff");
  const [logoUrl, setLogoUrl] = useState<string | null>("https://stats.innebandy.se/content/logos/101.png");

  // Hämta befintlig profil
  const { data: profile, isLoading } = useQuery({
    queryKey: ["clubProfile"],
    queryFn: () => api.getClubProfile(),
  });

  useEffect(() => {
    if (profile) {
      setClubName(profile.clubName || "Pixbo IBK");
      setTeamName(profile.teamName || "Alla lag (Hela föreningen)");
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
    mutationFn: async (data: ClubProfile) => {
      await AsyncStorage.setItem("mf_onboarded", "true");
      await AsyncStorage.setItem("mf_club", JSON.stringify(data));
      return api.saveClubProfile(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clubProfile"] });
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      Alert.alert("Klart! 🏑", "Dina föreningsinställningar har sparats!");
      router.replace("/");
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
      teamName,
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
      <View style={styles.introBox}>
        <Text style={styles.screenTitle}>Ditt Lag & Förening</Text>
        <Text style={styles.screenSubtitle}>
          Välj förening och ladda upp klubbmärke en gång. Därefter skapas alla matchplanscher automatiskt med rätt loggor och färger!
        </Text>
      </View>

      {/* Steg 1: Välj eller sök Förening */}
      <View style={styles.card}>
        <View style={styles.stepHeader}>
          <View style={styles.stepNumberBadge}>
            <Text style={styles.stepNumber}>1</Text>
          </View>
          <Text style={styles.cardTitle}>Vilken är din förening?</Text>
        </View>

        {/* Snabbval av populära klubbar */}
        <View style={styles.chipRow}>
          {POPULAR_CLUBS.map((c) => (
            <TouchableOpacity
              key={c.name}
              style={[styles.chip, clubName === c.name && styles.activeChip]}
              onPress={() => {
                setClubName(c.name);
                setPrimaryColor(c.color);
                if (c.logo) setLogoUrl(c.logo);
              }}
            >
              <Text style={[styles.chipText, clubName === c.name && styles.activeChipText]}>
                {c.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.input}
          value={clubName}
          onChangeText={setClubName}
          placeholder="Eller skriv föreningens namn här..."
          placeholderTextColor="#64748b"
        />
      </View>

      {/* Steg 2: Välj Lag */}
      <View style={styles.card}>
        <View style={styles.stepHeader}>
          <View style={styles.stepNumberBadge}>
            <Text style={styles.stepNumber}>2</Text>
          </View>
          <Text style={styles.cardTitle}>Vilket lag vill du följa?</Text>
        </View>

        <View style={styles.teamOptionsList}>
          {POPULAR_TEAMS.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.teamOption, teamName === t && styles.activeTeamOption]}
              onPress={() => setTeamName(t)}
            >
              <Ionicons
                name={teamName === t ? "checkmark-circle" : "ellipse-outline"}
                size={20}
                color={teamName === t ? "#38bdf8" : "#64748b"}
              />
              <Text style={[styles.teamOptionText, teamName === t && styles.activeTeamOptionText]}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Steg 3: Klubbens Logotyp */}
      <View style={styles.card}>
        <View style={styles.stepHeader}>
          <View style={styles.stepNumberBadge}>
            <Text style={styles.stepNumber}>3</Text>
          </View>
          <Text style={styles.cardTitle}>Klubbmärke / Logotyp</Text>
        </View>
        <Text style={styles.cardSubtitle}>
          Ladda upp föreningens märke (helst transparent PNG) så sätts det automatiskt på alla bilder.
        </Text>

        <View style={styles.logoRow}>
          {logoUrl ? (
            <Image source={{ uri: logoUrl }} style={styles.logoPreview} />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Ionicons name="shield-outline" size={36} color="#64748b" />
            </View>
          )}

          <TouchableOpacity style={styles.uploadButton} onPress={pickLogo}>
            <Ionicons name="cloud-upload" size={18} color="#ffffff" />
            <Text style={styles.uploadButtonText}>
              {logoUrl ? "Byt klubbmärke" : "Ladda upp klubbmärke"}
            </Text>
          </TouchableOpacity>
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
            <Ionicons name="checkmark-done" size={22} color="#ffffff" />
            <Text style={styles.saveButtonText}>Spara & Fortsätt</Text>
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
  introBox: {
    marginBottom: 4,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 6,
  },
  screenSubtitle: {
    color: "#94a3b8",
    fontSize: 14,
    lineHeight: 20,
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
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stepNumberBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumber: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#94a3b8",
    lineHeight: 18,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
  },
  activeChip: {
    backgroundColor: "#2563eb",
    borderColor: "#38bdf8",
  },
  chipText: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "600",
  },
  activeChipText: {
    color: "#ffffff",
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
  teamOptionsList: {
    gap: 8,
  },
  teamOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#090d16",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  activeTeamOption: {
    borderColor: "#38bdf8",
    backgroundColor: "rgba(56, 189, 248, 0.08)",
  },
  teamOptionText: {
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "600",
  },
  activeTeamOptionText: {
    color: "#ffffff",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 4,
  },
  logoPreview: {
    width: 64,
    height: 64,
    resizeMode: "contain",
  },
  logoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: "#1e293b",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#334155",
    borderStyle: "dashed",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#2563eb",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
  },
  uploadButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#16a34a",
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
