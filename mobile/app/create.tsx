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
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { api, Match, PosterTheme } from "../lib/api.js";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function CreatePosterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const matchId = params.matchId ? parseInt(params.matchId as string, 10) : undefined;
  const isWeekendMode = params.mode === "weekend";

  // Tillstånd
  const [format, setFormat] = useState<"feed" | "story">("feed");
  const [selectedThemeId, setSelectedThemeId] = useState<string>("epic-smoke");
  const [playerImage, setPlayerImage] = useState<string | null>(null);
  const [customText, setCustomText] = useState<string>("Fri entré för alla under 16 år! 🍿");
  const [generatedCaption, setGeneratedCaption] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Hämta matcher
  const { data: matches } = useQuery({
    queryKey: ["matches"],
    queryFn: () => api.getMatches(),
  });

  // Hitta vald match eller ta första
  const currentMatch = matches?.find((m) => m.MatchID === matchId) || matches?.[0];

  // Hämta teman
  const { data: themes } = useQuery({
    queryKey: ["themes"],
    queryFn: () => api.getThemes(),
  });

  const selectedTheme = themes?.find((t) => t.id === selectedThemeId) || themes?.[0];

  // Uppdatera caption när text eller match ändras
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

  // Välj bild på spelare från kamerarullen
  const pickPlayerImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Behörighet krävs", "Appen behöver åtkomst till dina bilder för att välja spelare.");
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

  // Ta foto med kameran direkt
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
    Alert.alert("Kopierat!", "Instagram-caption och hashtags har kopierats till urklipp.");
  };

  // Dela till Instagram
  const shareToInstagram = async () => {
    setIsGenerating(true);
    setTimeout(async () => {
      setIsGenerating(false);
      // Kopiera texten automatiskt
      await Clipboard.setStringAsync(generatedCaption);

      if (await Sharing.isAvailableAsync()) {
        Alert.alert(
          "Klar för Instagram! 📸",
          "Caption har kopierats till urklipp. Välj Instagram i delningsmenyn för att publicera!",
          [
            {
              text: "Öppna delningsmeny",
              onPress: () => {
                // Om vi har en spelarbild, dela den som mockup
                if (playerImage) {
                  Sharing.shareAsync(playerImage);
                } else {
                  Alert.alert("Tips", "Lägg till en spelarbild för att dela bilden direkt.");
                }
              },
            },
          ]
        );
      } else {
        Alert.alert("Klart!", "Texten har kopierats.");
      }
    }, 800);
  };

  const previewWidth = SCREEN_WIDTH - 32;
  const previewHeight = format === "feed" ? (previewWidth * 5) / 4 : (previewWidth * 16) / 9;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Formatväljare */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>1. Välj Format</Text>
      </View>
      <View style={styles.formatRow}>
        <TouchableOpacity
          style={[styles.formatCard, format === "feed" && styles.activeFormatCard]}
          onPress={() => setFormat("feed")}
        >
          <Ionicons name="images-outline" size={24} color={format === "feed" ? "#38bdf8" : "#94a3b8"} />
          <Text style={[styles.formatTitle, format === "feed" && styles.activeFormatTitle]}>
            Feed Post (4:5)
          </Text>
          <Text style={styles.formatSubtitle}>1080 x 1350 px</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.formatCard, format === "story" && styles.activeFormatCard]}
          onPress={() => setFormat("story")}
        >
          <Ionicons name="phone-portrait-outline" size={24} color={format === "story" ? "#38bdf8" : "#94a3b8"} />
          <Text style={[styles.formatTitle, format === "story" && styles.activeFormatTitle]}>
            Instagram Story (9:16)
          </Text>
          <Text style={styles.formatSubtitle}>1080 x 1920 px</Text>
        </TouchableOpacity>
      </View>

      {/* Spelarbild & Friläggning */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>2. Spelarbild (Klipps ut automatiskt)</Text>
      </View>
      <View style={styles.playerImageSection}>
        {playerImage ? (
          <View style={styles.playerPreviewContainer}>
            <Image source={{ uri: playerImage }} style={styles.playerPreviewImage} />
            <TouchableOpacity style={styles.removeImageButton} onPress={() => setPlayerImage(null)}>
              <Ionicons name="close-circle" size={24} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.imagePickerButtons}>
            <TouchableOpacity style={styles.pickerButton} onPress={pickPlayerImage}>
              <Ionicons name="image-outline" size={22} color="#38bdf8" />
              <Text style={styles.pickerButtonText}>Välj ur Galleri</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.pickerButton} onPress={takePlayerPhoto}>
              <Ionicons name="camera-outline" size={22} color="#38bdf8" />
              <Text style={styles.pickerButtonText}>Ta Foto Nu</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Tema & Bakgrundsstil */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>3. AI-Tema & Bakgrundsstil</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.themeList}>
        {themes?.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.themeCard, selectedThemeId === t.id && styles.activeThemeCard]}
            onPress={() => setSelectedThemeId(t.id)}
          >
            <View style={[styles.themeColorIndicator, { backgroundColor: t.accentColor }]} />
            <Text style={[styles.themeName, selectedThemeId === t.id && styles.activeThemeName]}>
              {t.name}
            </Text>
            <Text style={styles.themeDesc} numberOfLines={2}>
              {t.description}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Egen text */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>4. Egen Text & Utrop</Text>
      </View>
      <TextInput
        style={styles.textInput}
        placeholder="T.ex. Fri entré för alla under 16 år! Kiosken är öppen!"
        placeholderTextColor="#64748b"
        value={customText}
        onChangeText={setCustomText}
        multiline
      />

      {/* Live Förhandsgranskning */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>5. Förhandsgranskning</Text>
      </View>

      <View style={[styles.posterCanvas, { width: previewWidth, height: previewHeight }]}>
        {/* Bakgrundsgradient */}
        <LinearGradient
          colors={(selectedTheme?.primaryGradient as any) || ["#090d16", "#1e293b"]}
          style={StyleSheet.absoluteFill}
        />

        {/* Serie & Omgång */}
        <View style={styles.canvasHeader}>
          <Text style={styles.canvasCompetition}>{currentMatch?.CompetitionName || "Svensk Innebandy"}</Text>
          <Text style={styles.canvasMatchDay}>🔥 MATCHDAG 🔥</Text>
        </View>

        {/* Spelargrafik i mitten */}
        <View style={styles.canvasPlayerArea}>
          {playerImage ? (
            <Image source={{ uri: playerImage }} style={styles.canvasPlayerImage} />
          ) : (
            <View style={styles.canvasPlayerPlaceholder}>
              <Ionicons name="person" size={80} color="rgba(255,255,255,0.15)" />
              <Text style={styles.canvasPlayerHint}>Klicka ovan för att lägga till spelare</Text>
            </View>
          )}
        </View>

        {/* Botten: Matchinfo, Loggor & Typografi */}
        <View style={styles.canvasFooter}>
          <View style={styles.canvasTeamsRow}>
            {/* Hemmalag */}
            <View style={styles.canvasTeamItem}>
              {currentMatch?.HomeTeamLogotypeUrl && (
                <Image source={{ uri: currentMatch.HomeTeamLogotypeUrl }} style={styles.canvasLogo} />
              )}
              <Text style={styles.canvasTeamName}>{currentMatch?.HomeTeam || "Hemmalag"}</Text>
            </View>

            <View style={styles.canvasVs}>
              <Text style={styles.canvasVsText}>VS</Text>
            </View>

            {/* Bortalag */}
            <View style={styles.canvasTeamItem}>
              {currentMatch?.AwayTeamLogotypeUrl && (
                <Image source={{ uri: currentMatch.AwayTeamLogotypeUrl }} style={styles.canvasLogo} />
              )}
              <Text style={styles.canvasTeamName}>{currentMatch?.AwayTeam || "Bortalag"}</Text>
            </View>
          </View>

          {/* Datum, Tid & Hall */}
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

      {/* Instagram Caption Förhandsgranskning */}
      <View style={styles.captionCard}>
        <View style={styles.captionHeader}>
          <Ionicons name="logo-instagram" size={18} color="#e1306c" />
          <Text style={styles.captionTitle}>Färdig Instagram-text</Text>
          <TouchableOpacity onPress={copyCaption} style={styles.copyIconBtn}>
            <Ionicons name="copy-outline" size={16} color="#38bdf8" />
            <Text style={styles.copyIconText}>Kopiera</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.captionContent} numberOfLines={4}>
          {generatedCaption}
        </Text>
      </View>

      {/* Publicera & Dela Knappar */}
      <View style={styles.actionButtonsRow}>
        <TouchableOpacity style={styles.shareButton} onPress={shareToInstagram} disabled={isGenerating}>
          {isGenerating ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Ionicons name="share-social" size={20} color="#ffffff" />
              <Text style={styles.shareButtonText}>Dela till Instagram</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.copyButton} onPress={copyCaption}>
          <Ionicons name="copy-outline" size={20} color="#38bdf8" />
          <Text style={styles.copyButtonText}>Kopiera Text</Text>
        </TouchableOpacity>
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
  },
  sectionHeader: {
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#e2e8f0",
  },
  formatRow: {
    flexDirection: "row",
    gap: 12,
  },
  formatCard: {
    flex: 1,
    backgroundColor: "#131b2e",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#1e293b",
    gap: 4,
  },
  activeFormatCard: {
    borderColor: "#38bdf8",
    backgroundColor: "rgba(56, 189, 248, 0.08)",
  },
  formatTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#94a3b8",
  },
  activeFormatTitle: {
    color: "#ffffff",
  },
  formatSubtitle: {
    fontSize: 11,
    color: "#64748b",
  },
  playerImageSection: {
    backgroundColor: "#131b2e",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  imagePickerButtons: {
    flexDirection: "row",
    gap: 12,
  },
  pickerButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#1e293b",
    paddingVertical: 14,
    borderRadius: 10,
  },
  pickerButtonText: {
    color: "#38bdf8",
    fontWeight: "600",
    fontSize: 14,
  },
  playerPreviewContainer: {
    alignItems: "center",
    position: "relative",
  },
  playerPreviewImage: {
    width: 140,
    height: 140,
    borderRadius: 12,
  },
  removeImageButton: {
    position: "absolute",
    top: -6,
    right: SCREEN_WIDTH / 2 - 80,
  },
  themeList: {
    gap: 12,
    paddingVertical: 4,
  },
  themeCard: {
    width: 160,
    backgroundColor: "#131b2e",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: "#1e293b",
    gap: 4,
  },
  activeThemeCard: {
    borderColor: "#38bdf8",
    backgroundColor: "rgba(56, 189, 248, 0.08)",
  },
  themeColorIndicator: {
    width: 24,
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
  },
  themeName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#94a3b8",
  },
  activeThemeName: {
    color: "#ffffff",
  },
  themeDesc: {
    fontSize: 11,
    color: "#64748b",
    lineHeight: 14,
  },
  textInput: {
    backgroundColor: "#131b2e",
    borderRadius: 12,
    padding: 14,
    color: "#ffffff",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  posterCanvas: {
    borderRadius: 18,
    overflow: "hidden",
    alignSelf: "center",
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
    gap: 4,
  },
  canvasCompetition: {
    color: "#38bdf8",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  canvasMatchDay: {
    color: "#ffffff",
    fontSize: 18,
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
    height: "80%",
    resizeMode: "contain",
  },
  canvasPlayerPlaceholder: {
    alignItems: "center",
    gap: 8,
  },
  canvasPlayerHint: {
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
    fontSize: 13,
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
  captionCard: {
    backgroundColor: "#131b2e",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1e293b",
    marginTop: 18,
    gap: 8,
  },
  captionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  captionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
    flex: 1,
    marginLeft: 6,
  },
  copyIconBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  copyIconText: {
    fontSize: 12,
    color: "#38bdf8",
    fontWeight: "600",
  },
  captionContent: {
    color: "#94a3b8",
    fontSize: 12,
    lineHeight: 18,
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  shareButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 12,
  },
  shareButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 15,
  },
  copyButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#1e293b",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#38bdf8",
  },
  copyButtonText: {
    color: "#38bdf8",
    fontWeight: "600",
    fontSize: 14,
  },
});
