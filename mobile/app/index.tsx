import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { api, Match } from "../lib/api.js";

export default function HomeScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"matches" | "weekend">("matches");

  // Hämta matcher via React Query
  const {
    data: matches,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["matches"],
    queryFn: () => api.getMatches(),
  });

  // Hämta föreningsprofil
  const { data: clubProfile } = useQuery({
    queryKey: ["clubProfile"],
    queryFn: () => api.getClubProfile(),
  });

  // Hämta AI status (ComfyUI)
  const { data: aiStatus } = useQuery({
    queryKey: ["aiStatus"],
    queryFn: () => api.getAiStatus(),
  });

  const clubName = clubProfile?.clubName || "Pixbo IBK";

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    const day = d.toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short" });
    const time = d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
    return `${day.toUpperCase()} • KL ${time}`;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#38bdf8" />}
    >
      {/* Klubb-header */}
      <View style={styles.clubCard}>
        <View style={styles.clubInfo}>
          {clubProfile?.logoUrl ? (
            <Image source={{ uri: clubProfile.logoUrl }} style={styles.clubLogo} />
          ) : (
            <View style={styles.clubLogoPlaceholder}>
              <Ionicons name="shield" size={28} color="#38bdf8" />
            </View>
          )}
          <View style={styles.clubTextContainer}>
            <Text style={styles.clubLabel}>Aktiv förening</Text>
            <Text style={styles.clubTitle}>{clubName}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.settingsButton} onPress={() => router.push("/club")}>
          <Ionicons name="settings-outline" size={20} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* AI Server Statusindikator */}
      <View style={[styles.statusBadge, aiStatus?.online ? styles.statusOnline : styles.statusOffline]}>
        <Ionicons
          name={aiStatus?.online ? "hardware-chip" : "cloud-offline-outline"}
          size={16}
          color={aiStatus?.online ? "#4ade80" : "#f59e0b"}
        />
        <Text style={[styles.statusText, { color: aiStatus?.online ? "#4ade80" : "#f59e0b" }]}>
          {aiStatus?.online ? "Pinokio ComfyUI Ansluten" : "Lokal HD-grafikmotor aktiv"}
        </Text>
      </View>

      {/* Flikar */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "matches" && styles.activeTab]}
          onPress={() => setActiveTab("matches")}
        >
          <Ionicons
            name="flash-outline"
            size={18}
            color={activeTab === "matches" ? "#ffffff" : "#94a3b8"}
          />
          <Text style={[styles.tabText, activeTab === "matches" && styles.activeTabText]}>
            Kommande Matcher
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "weekend" && styles.activeTab]}
          onPress={() => setActiveTab("weekend")}
        >
          <Ionicons
            name="calendar-outline"
            size={18}
            color={activeTab === "weekend" ? "#ffffff" : "#94a3b8"}
          />
          <Text style={[styles.tabText, activeTab === "weekend" && styles.activeTabText]}>
            Helgens Översikt
          </Text>
        </TouchableOpacity>
      </View>

      {/* Laddningsindikator */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#38bdf8" />
          <Text style={styles.loadingText}>Hämtar matcher från iBIS...</Text>
        </View>
      ) : activeTab === "matches" ? (
        /* Matchlista */
        <View style={styles.matchList}>
          {matches?.map((match) => (
            <View key={match.MatchID} style={styles.matchCard}>
              <View style={styles.matchHeader}>
                <Text style={styles.competitionName}>{match.CompetitionName}</Text>
                <Text style={styles.matchDate}>{formatDate(match.MatchDateTime)}</Text>
              </View>

              <View style={styles.teamsRow}>
                {/* Hemmalag */}
                <View style={styles.teamColumn}>
                  {match.HomeTeamLogotypeUrl ? (
                    <Image source={{ uri: match.HomeTeamLogotypeUrl }} style={styles.teamLogo} />
                  ) : (
                    <View style={styles.teamLogoPlaceholder}>
                      <Text style={styles.teamInitials}>{match.HomeTeamShortName || "HEM"}</Text>
                    </View>
                  )}
                  <Text style={styles.teamName} numberOfLines={1}>
                    {match.HomeTeam}
                  </Text>
                </View>

                {/* VS Badge */}
                <View style={styles.vsContainer}>
                  <Text style={styles.vsText}>VS</Text>
                  <Text style={styles.venueText} numberOfLines={1}>
                    {match.Venue || "Hemmahall"}
                  </Text>
                </View>

                {/* Bortalag */}
                <View style={styles.teamColumn}>
                  {match.AwayTeamLogotypeUrl ? (
                    <Image source={{ uri: match.AwayTeamLogotypeUrl }} style={styles.teamLogo} />
                  ) : (
                    <View style={styles.teamLogoPlaceholder}>
                      <Text style={styles.teamInitials}>{match.AwayTeamShortName || "BOR"}</Text>
                    </View>
                  )}
                  <Text style={styles.teamName} numberOfLines={1}>
                    {match.AwayTeam}
                  </Text>
                </View>
              </View>

              {/* Actionknapp */}
              <TouchableOpacity
                style={styles.createButton}
                onPress={() =>
                  router.push({
                    pathname: "/create",
                    params: { matchId: match.MatchID },
                  })
                }
              >
                <Ionicons name="sparkles" size={18} color="#ffffff" />
                <Text style={styles.createButtonText}>Skapa Matchplansch</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : (
        /* Helgens hemmamatcher sammanställning */
        <View style={styles.weekendCard}>
          <Ionicons name="calendar" size={36} color="#38bdf8" />
          <Text style={styles.weekendTitle}>Helgens Hemmamatcher</Text>
          <Text style={styles.weekendSubtitle}>
            Skapa ett samlat inlägg eller en Instagram-karusell med helgens {matches?.length || 0} hemmamatcher!
          </Text>

          <TouchableOpacity
            style={styles.createButton}
            onPress={() =>
              router.push({
                pathname: "/create",
                params: { mode: "weekend" },
              })
            }
          >
            <Ionicons name="albums-outline" size={18} color="#ffffff" />
            <Text style={styles.createButtonText}>Skapa Helgöversikt</Text>
          </TouchableOpacity>
        </View>
      )}
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
  },
  clubCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#131b2e",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1e293b",
    marginBottom: 12,
  },
  clubInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  clubLogo: {
    width: 44,
    height: 44,
    resizeMode: "contain",
  },
  clubLogoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#1e293b",
    alignItems: "center",
    justifyContent: "center",
  },
  clubTextContainer: {
    gap: 2,
  },
  clubLabel: {
    fontSize: 12,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  clubTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  settingsButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#1e293b",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  statusOnline: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderColor: "rgba(34, 197, 94, 0.2)",
  },
  statusOffline: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderColor: "rgba(245, 158, 11, 0.2)",
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#131b2e",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#2563eb",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94a3b8",
  },
  activeTabText: {
    color: "#ffffff",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 12,
  },
  loadingText: {
    color: "#94a3b8",
    fontSize: 14,
  },
  matchList: {
    gap: 14,
  },
  matchCard: {
    backgroundColor: "#131b2e",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  matchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  competitionName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#38bdf8",
    textTransform: "uppercase",
  },
  matchDate: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
  },
  teamsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  teamColumn: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  teamLogo: {
    width: 52,
    height: 52,
    resizeMode: "contain",
  },
  teamLogoPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#1e293b",
    alignItems: "center",
    justifyContent: "center",
  },
  teamInitials: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 14,
  },
  teamName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
  },
  vsContainer: {
    alignItems: "center",
    paddingHorizontal: 8,
    gap: 4,
  },
  vsText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#ef4444",
  },
  venueText: {
    fontSize: 11,
    color: "#64748b",
    maxWidth: 90,
    textAlign: "center",
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 12,
  },
  createButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  weekendCard: {
    backgroundColor: "#131b2e",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  weekendTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  weekendSubtitle: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 8,
  },
});
