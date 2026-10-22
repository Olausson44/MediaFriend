import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { api, Match, PosterTheme } from "../lib/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function CreatePosterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const matchId = params.matchId ? parseInt(params.matchId as string, 10) : undefined;

  // Enkelt vs Avancerat läge
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Inställningar
  const [format, setFormat] = useState<"feed" | "story">("feed");
  const [selectedThemeId, setSelectedThemeId] = useState<string>("epic-smoke");
  const [playerImage, setPlayerImage] = useState<string | null>(null);
  const [customText, setCustomText] = useState<string>("");
  const [generatedCaption, setGeneratedCaption] = useState<string>("");
  const [isSharing, setIsSharing] = useState<boolean>(false);

  // Hämta matcher
  const { data: matches } = useQuery({
    queryKey: ["matches"],
    queryFn: () => api.getMatches(),
  });

  // Hämta klubbprofil (med sparad logga & färger)
  const { data: clubProfile } = useQuery({
    queryKey: ["clubProfile"],
    queryFn: () => api.getClubProfile(),
  });

  const currentMatch = matches?.find((m) => m.MatchID === matchId) || matches?.[0];

  // Hämta teman
  const { data: themes } = useQuery({
    queryKey: ["themes"],
    queryFn: () => api.getThemes(),
  });

  const selectedTheme = themes?.find((t) => t.id === selectedThemeId) || themes?.[0];

  // Uppdatera caption
  useEffect(() => {
    if (currentMatch) {
      api
        .generateCaption({
          homeTeam: currentMatch.HomeTeam,
          awayTeam: currentMatch.AwayTeam,
          matchDateTime: currentMatch.MatchDateTime,
          venue: currentMatch.Venue,
          customText,
          ticketUrl: currentMatch.TicketUrl,
        })
        .then(setGeneratedCaption);
    }
  }, [currentMatch, customText]);

  // Välj bild ur galleri
  const pickPlayerImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Behörighet krävs", "Appen behöver åtkomst till dina foton.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setPlayerImage(result.assets[0].uri);
    }
  };

  // Ta foto direkt med kameran
  const takePlayerPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Behörighet krävs", "Appen behöver åtkomst till kameran.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setPlayerImage(result.assets[0].uri);
    }
  };

  // Kopiera caption till urklipp
  const copyCaption = async () => {
    await Clipboard.setStringAsync(generatedCaption);
    Alert.alert("Kopierat! 📋", "Instagram-text och hashtags har kopierats!");
  };

  // Dela till Instagram
  const shareToInstagram = async () => {
    setIsSharing(true);
    // Kopiera texten automatiskt så användaren bara behöver klistra in
    await Clipboard.setStringAsync(generatedCaption);

    setTimeout(async () => {
      setIsSharing(false);
      if (await Sharing.isAvailableAsync()) {
        if (playerImage) {
          Sharing.shareAsync(playerImage);
        } else {
          Alert.alert("Kopierat!", "Matchtexten är kopierad till urklipp. Välj en spelarbild för att dela bilden också!");
        }
      } else {
        Alert.alert("Kopierat!", "Texten är kopierad till urklipp.");
      }
    }, 400);
  };

  const previewWidth = Math.min(SCREEN_WIDTH - 32, 380);
  const previewHeight = format === "feed" ? (previewWidth * 5) / 4 : (previewWidth * 16) / 9;

  const homeLogo = clubProfile?.logoUrl || currentMatch?.HomeTeamLogotypeUrl;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Kompakt Match-Header */}
      <View style={styles.matchHeaderCard}>
        <View style={styles.matchHeaderInfo}>
          <Text style={styles.matchSubtitle}>
            {currentMatch?.CompetitionName || "Svensk Innebandy"} •{" "}
            {currentMatch?.MatchDateTime
              ? new Date(currentMatch.MatchDateTime).toLocaleDateString("sv-SE", {
                  weekday: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Lördag 16:00"}
          </Text>
          <Text style={styles.matchTitle}>
            {currentMatch?.HomeTeam} vs {currentMatch?.AwayTeam}
          </Text>
        </View>

        <TouchableOpacity style={styles.changeMatchBtn} onPress={() => router.back()}>
          <Text style={styles.changeMatchText}>Byt</Text>
        </TouchableOpacity>
      </View>

      {/* STEG 1 I SIMPLE MODE: VÄLJ SPELARBILD OM INTE REDAN VALD */}
      {!playerImage ? (
        <View style={styles.simpleUploadBox}>
          <Text style={styles.uploadPromptTitle}>Lägg till spelare på bilden</Text>
          <Text style={styles.uploadPromptSubtitle}>
            Välj en bild från galleriet eller knäpp ett foto direkt i hallen.
          </Text>

          <View style={styles.uploadActionsRow}>
            <TouchableOpacity style={styles.simplePickBtn} onPress={pickPlayerImage}>
              <Ionicons name="images" size={20} color="#ffffff" />
              <Text style={styles.simplePickBtnText}>Välj foto</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.simpleCameraBtn} onPress={takePlayerPhoto}>
              <Ionicons name="camera" size={20} color="#38bdf8" />
              <Text style={styles.simpleCameraBtnText}>Ta foto</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.imageSelectedRow}>
          <Text style={styles.imageSelectedText}>Spelarbild vald</Text>
          <TouchableOpacity style={styles.changeImageBtn} onPress={pickPlayerImage}>
            <Ionicons name="swap-horizontal" size={16} color="#38bdf8" />
            <Text style={styles.changeImageBtnText}>Byt bild</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* PLANSCH-FÖRHANDSGRANSKNING (Fokus) */}
      <View style={[styles.posterCanvas, { width: previewWidth, height: previewHeight }]}>
        <LinearGradient
          colors={(selectedTheme?.primaryGradient as any) || ["#090d16", "#1e293b"]}
          style={StyleSheet.absoluteFill}
        />

        {/* Topp: Serie & Matchdag */}
        <View style={styles.canvasHeader}>
          <Text style={styles.canvasCompetition}>{currentMatch?.CompetitionName || "Svensk Innebandy"}</Text>
          <Text style={styles.canvasMatchDay}>🔥 MATCHDAG 🔥</Text>
        </View>

        {/* Mitten: Spelare */}
        <View style={styles.canvasPlayerArea}>
          {playerImage ? (
            <Image source={{ uri: playerImage }} style={styles.canvasPlayerImage} />
          ) : (
            <TouchableOpacity style={styles.canvasPlaceholderClick} onPress={pickPlayerImage}>
              <Ionicons name="person-circle-outline" size={74} color="rgba(255,255,255,0.25)" />
              <Text style={styles.canvasPlaceholderText}>Tryck här för att välja spelare</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Botten: Lag, Loggor & Tid */}
        <View style={styles.canvasFooter}>
          <View style={styles.canvasTeamsRow}>
            {/* Hemmalag */}
            <View style={styles.canvasTeamItem}>
              {homeLogo && <Image source={{ uri: homeLogo }} style={styles.canvasLogo} />}
              <Text style={styles.canvasTeamName} numberOfLines={1}>
                {currentMatch?.HomeTeam || "Hemmalag"}
              </Text>
            </View>

            <View style={styles.canvasVs}>
              <Text style={styles.canvasVsText}>VS</Text>
            </View>

            {/* Bortalag */}
            <View style={styles.canvasTeamItem}>
              {currentMatch?.AwayTeamLogotypeUrl && (
                <Image source={{ uri: currentMatch.AwayTeamLogotypeUrl }} style={styles.canvasLogo} />
              )}
              <Text style={styles.canvasTeamName} numberOfLines={1}>
                {currentMatch?.AwayTeam || "Bortalag"}
              </Text>
            </View>
          </View>

          {/* Plats & Klockslag */}
          <View style={styles.canvasInfoBox}>
            <Text style={styles.canvasTime}>
              {currentMatch?.MatchDateTime
                ? new Date(currentMatch.MatchDateTime).toLocaleTimeString("sv-SE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "16:00"}{" "}
              • {currentMatch?.Venue || "Wallenstam Arena"}
            </Text>
            {customText ? <Text style={styles.canvasCustomText}>{customText}</Text> : null}
          </View>
        </View>
      </View>

      {/* SNABBA PUBLICERINGSKNAPPAR (Simple Mode) */}
      <View style={styles.mainActions}>
        <TouchableOpacity style={styles.shareMainBtn} onPress={shareToInstagram} disabled={isSharing}>
          {isSharing ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Ionicons name="logo-instagram" size={22} color="#ffffff" />
              <Text style={styles.shareMainBtnText}>Dela till Instagram</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.copyTextBtn} onPress={copyCaption}>
          <Ionicons name="copy-outline" size={18} color="#38bdf8" />
          <Text style={styles.copyTextBtnText}>Kopiera Text</Text>
        </TouchableOpacity>
      </View>

      {/* UTFÄLLBART AVANCERAT LÄGE */}
      <View style={styles.advancedSection}>
        <TouchableOpacity
          style={styles.advancedToggleBtn}
          onPress={() => setShowAdvanced(!showAdvanced)}
        >
          <View style={styles.advancedToggleLeft}>
            <Ionicons name="options" size={18} color="#94a3b8" />
            <Text style={styles.advancedToggleTitle}>Fler inställningar / Avancerat</Text>
          </View>
          <Ionicons
            name={showAdvanced ? "chevron-up" : "chevron-down"}
            size={18}
            color="#94a3b8"
          />
        </TouchableOpacity>

        {showAdvanced && (
          <View style={styles.advancedContent}>
            {/* Format: Feed vs Story */}
            <Text style={styles.advancedLabel}>Bildformat</Text>
            <View style={styles.formatPills}>
              <TouchableOpacity
                style={[styles.formatPill, format === "feed" && styles.activePill]}
                onPress={() => setFormat("feed")}
              >
                <Text style={[styles.pillText, format === "feed" && styles.activePillText]}>
                  Feed Post (4:5)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.formatPill, format === "story" && styles.activePill]}
                onPress={() => setFormat("story")}
              >
                <Text style={[styles.pillText, format === "story" && styles.activePillText]}>
                  Story (9:16)
                </Text>
              </TouchableOpacity>
            </View>

            {/* AI Bakgrundstema */}
            <Text style={styles.advancedLabel}>Bakgrundstema</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.themeRow}>
              {themes?.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.themeChip, selectedThemeId === t.id && styles.activeThemeChip]}
                  onPress={() => setSelectedThemeId(t.id)}
                >
                  <View style={[styles.themeDot, { backgroundColor: t.accentColor }]} />
                  <Text style={[styles.themeChipText, selectedThemeId === t.id && styles.activeThemeChipText]}>
                    {t.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Egen text */}
            <Text style={styles.advancedLabel}>Egen extra text på bilden</Text>
            <TextInput
              style={styles.advancedInput}
              value={customText}
              onChangeText={setCustomText}
              placeholder="T.ex. Fri entré för alla under 16 år!"
              placeholderTextColor="#64748b"
            />

            {/* Caption Förhandsvisning */}
            <Text style={styles.advancedLabel}>Instagram-text (Caption)</Text>
            <TextInput
              style={[styles.advancedInput, styles.captionInput]}
              value={generatedCaption}
              onChangeText={setGeneratedCaption}
              multiline
            />
          </View>
        )}
      </View>
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
    paddingBottom: 50,
    gap: 16,
    alignItems: "center",
  },
  matchHeaderCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#131b2e",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  matchHeaderInfo: {
    gap: 2,
    flex: 1,
  },
  matchSubtitle: {
    fontSize: 11,
    color: "#38bdf8",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  matchTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#ffffff",
  },
  changeMatchBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#1e293b",
    borderRadius: 8,
  },
  changeMatchText: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "600",
  },
  simpleUploadBox: {
    width: "100%",
    backgroundColor: "#131b2e",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#1e293b",
    alignItems: "center",
    gap: 10,
  },
  uploadPromptTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  uploadPromptSubtitle: {
    color: "#94a3b8",
    fontSize: 12,
    textAlign: "center",
  },
  uploadActionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
    width: "100%",
  },
  simplePickBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 10,
  },
  simplePickBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
  simpleCameraBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#38bdf8",
    paddingVertical: 12,
    borderRadius: 10,
  },
  simpleCameraBtnText: {
    color: "#38bdf8",
    fontWeight: "700",
    fontSize: 14,
  },
  imageSelectedRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#131b2e",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  imageSelectedText: {
    color: "#4ade80",
    fontSize: 13,
    fontWeight: "700",
  },
  changeImageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  changeImageBtnText: {
    color: "#38bdf8",
    fontSize: 13,
    fontWeight: "600",
  },
  posterCanvas: {
    borderRadius: 18,
    overflow: "hidden",
    justifyContent: "space-between",
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  canvasHeader: {
    alignItems: "center",
    gap: 3,
  },
  canvasCompetition: {
    color: "#38bdf8",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  canvasMatchDay: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 2,
  },
  canvasPlayerArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  canvasPlayerImage: {
    width: "70%",
    height: "82%",
    resizeMode: "contain",
  },
  canvasPlaceholderClick: {
    alignItems: "center",
    gap: 6,
  },
  canvasPlaceholderText: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 12,
  },
  canvasFooter: {
    backgroundColor: "rgba(9, 13, 22, 0.85)",
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  canvasTeamsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  canvasTeamItem: {
    alignItems: "center",
    flex: 1,
    gap: 4,
  },
  canvasLogo: {
    width: 36,
    height: 36,
    resizeMode: "contain",
  },
  canvasTeamName: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 12,
    textAlign: "center",
  },
  canvasVs: {
    paddingHorizontal: 8,
  },
  canvasVsText: {
    color: "#ef4444",
    fontWeight: "900",
    fontSize: 13,
  },
  canvasInfoBox: {
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    paddingTop: 6,
    gap: 2,
  },
  canvasTime: {
    color: "#38bdf8",
    fontWeight: "700",
    fontSize: 12,
  },
  canvasCustomText: {
    color: "#facc15",
    fontWeight: "600",
    fontSize: 11,
    textAlign: "center",
  },
  mainActions: {
    width: "100%",
    gap: 10,
  },
  shareMainBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 14,
  },
  shareMainBtnText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 16,
  },
  copyTextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#131b2e",
    borderWidth: 1,
    borderColor: "#1e293b",
    paddingVertical: 12,
    borderRadius: 12,
  },
  copyTextBtnText: {
    color: "#38bdf8",
    fontWeight: "600",
    fontSize: 14,
  },
  advancedSection: {
    width: "100%",
    backgroundColor: "#131b2e",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1e293b",
    overflow: "hidden",
  },
  advancedToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  advancedToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  advancedToggleTitle: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "700",
  },
  advancedContent: {
    padding: 14,
    paddingTop: 0,
    gap: 12,
  },
  advancedLabel: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  formatPills: {
    flexDirection: "row",
    gap: 8,
  },
  formatPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "#090d16",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  activePill: {
    borderColor: "#38bdf8",
    backgroundColor: "rgba(56, 189, 248, 0.1)",
  },
  pillText: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "600",
  },
  activePillText: {
    color: "#ffffff",
  },
  themeRow: {
    gap: 8,
    paddingVertical: 2,
  },
  themeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#090d16",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  activeThemeChip: {
    borderColor: "#38bdf8",
    backgroundColor: "rgba(56, 189, 248, 0.1)",
  },
  themeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  themeChipText: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "600",
  },
  activeThemeChipText: {
    color: "#ffffff",
  },
  advancedInput: {
    backgroundColor: "#090d16",
    borderRadius: 8,
    padding: 10,
    color: "#ffffff",
    fontSize: 13,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  captionInput: {
    height: 70,
    textAlignVertical: "top",
    fontSize: 11,
    color: "#94a3b8",
  },
});
