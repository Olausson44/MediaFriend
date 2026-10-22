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
import Ionicons from "@expo/vector-icons/Ionicons";
import { api, Match } from "../lib/api";

export default function HomeScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"matches" | "weekend">("matches");

  // Hämta matcher
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

  const clubName = clubProfile?.clubName || "Pixbo IBK";
  const teamName = clubProfile?.teamName || "Herr A";
  const clubLogo = clubProfile?.logoUrl || "https://stats.innebandy.se/content/logos/101.png";

  const nextMatch = matches?.[0];
  const upcomingMatches = matches?.slice(1) || [];

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
      {/* Ren toppbar: Klubb & Lag */}
      <View style={styles.topBar}>
        <View style={styles.clubHeader}>
          {clubLogo ? (
            <Image source={{ uri: clubLogo }} style={styles.clubLogo} />
          ) : (
            <View style={styles.clubLogoFallback}>
              <Ionicons name="shield" size={24} color="#38bdf8" />
            </View>
          )}
          <View>
            <Text style={styles.clubNameText}>{clubName}</Text>
            <Text style={styles.teamNameText}>{teamName}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.settingsIconBtn} onPress={() => router.push("/club")}>
          <Ionicons name="options-outline" size={20} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* Flikar: Nästa match vs Helgens översikt */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "matches" && styles.activeTabButton]}
          onPress={() => setActiveTab("matches")}
        >
          <Text style={[styles.tabButtonText, activeTab === "matches" && styles.activeTabButtonText]}>
            Kommande Matcher
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === "weekend" && styles.activeTabButton]}
          onPress={() => setActiveTab("weekend")}
        >
          <Text style={[styles.tabButtonText, activeTab === "weekend" && styles.activeTabButtonText]}>
            Helgens Översikt
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#38bdf8" />
        </View>
      ) : activeTab === "matches" ? (
        <View style={styles.matchesContainer}>
          {/* NÄSTA MATCH - HERO KORT */}
          {nextMatch && (
            <View style={styles.heroMatchCard}>
              <View style={styles.heroBadgeRow}>
                <Text style={styles.nextMatchTag}>NÄSTA HEMMAMATCH</Text>
                <Text style={styles.heroDate}>{formatDate(nextMatch.MatchDateTime)}</Text>
              </View>

              <View style={styles.heroTeamsRow}>
                {/* Hemmalag */}
                <View style={styles.heroTeamCol}>
                  {nextMatch.HomeTeamLogotypeUrl || clubLogo ? (
                    <Image
                      source={{ uri: nextMatch.HomeTeamLogotypeUrl || clubLogo }}
                      style={styles.heroTeamLogo}
                    />
                  ) : (
                    <View style={styles.heroLogoPlaceholder}>
                      <Text style={styles.heroTeamInitials}>HEM</Text>
                    </View>
                  )}
                  <Text style={styles.heroTeamName} numberOfLines={1}>
                    {nextMatch.HomeTeam}
                  </Text>
                </View>

                {/* VS */}
                <View style={styles.heroVsCol}>
                  <Text style={styles.heroVsText}>VS</Text>
                  <Text style={styles.heroVenueText} numberOfLines={1}>
                    {nextMatch.Venue || "Hemmahall"}
                  </Text>
                </View>

                {/* Bortalag */}
                <View style={styles.heroTeamCol}>
                  {nextMatch.AwayTeamLogotypeUrl ? (
                    <Image source={{ uri: nextMatch.AwayTeamLogotypeUrl }} style={styles.heroTeamLogo} />
                  ) : (
                    <View style={styles.heroLogoPlaceholder}>
                      <Text style={styles.heroTeamInitials}>BOR</Text>
                    </View>
                  )}
                  <Text style={styles.heroTeamName} numberOfLines={1}>
                    {nextMatch.AwayTeam}
                  </Text>
                </View>
              </View>

              {/* Stor tydlig action-knapp */}
              <TouchableOpacity
                style={styles.heroActionBtn}
                onPress={() =>
                  router.push({
                    pathname: "/create",
                    params: { matchId: nextMatch.MatchID },
                  })
                }
              >
                <Ionicons name="sparkles" size={20} color="#ffffff" />
                <Text style={styles.heroActionBtnText}>Skapa Matchplansch</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* FLER MATCHER */}
          {upcomingMatches.length > 0 && (
            <View style={styles.moreMatchesSection}>
              <Text style={styles.sectionHeaderTitle}>Kommande matcher</Text>

              {upcomingMatches.map((m) => (
                <TouchableOpacity
                  key={m.MatchID}
                  style={styles.compactMatchCard}
                  onPress={() =>
                    router.push({
                      pathname: "/create",
                      params: { matchId: m.MatchID },
                    })
                  }
                >
                  <View style={styles.compactInfo}>
                    <Text style={styles.compactDate}>{formatDate(m.MatchDateTime)}</Text>
                    <Text style={styles.compactMatchup}>
                      {m.HomeTeam} <Text style={{ color: "#ef4444" }}>vs</Text> {m.AwayTeam}
                    </Text>
                    <Text style={styles.compactVenue}>{m.Venue || "Hemmahall"}</Text>
                  </View>

                  <View style={styles.compactArrowBtn}>
                    <Ionicons name="arrow-forward" size={18} color="#38bdf8" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      ) : (
        /* HELGENS ÖVERSIKT */
        <View style={styles.weekendBox}>
          <Ionicons name="calendar-outline" size={40} color="#38bdf8" />
          <Text style={styles.weekendTitle}>Helgens Matcher</Text>
          <Text style={styles.weekendDesc}>
            Skapa ett samlat inlägg för helgens alla {matches?.length || 0} hemmamatcher i hallen!
          </Text>

          <TouchableOpacity
            style={styles.heroActionBtn}
            onPress={() =>
              router.push({
                pathname: "/create",
                params: { mode: "weekend" },
              })
            }
          >
            <Ionicons name="images-outline" size={20} color="#ffffff" />
            <Text style={styles.heroActionBtnText}>Skapa Helgöversikt</Text>
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
    gap: 16,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  clubHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  clubLogo: {
    width: 44,
    height: 44,
    resizeMode: "contain",
  },
  clubLogoFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#131b2e",
    alignItems: "center",
    justifyContent: "center",
  },
  clubNameText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.3,
  },
  teamNameText: {
    fontSize: 13,
    color: "#38bdf8",
    fontWeight: "600",
  },
  settingsIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#131b2e",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#131b2e",
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: "#2563eb",
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#94a3b8",
  },
  activeTabButtonText: {
    color: "#ffffff",
  },
  loadingBox: {
    paddingVertical: 50,
    alignItems: "center",
  },
  matchesContainer: {
    gap: 16,
  },
  heroMatchCard: {
    backgroundColor: "#131b2e",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: "#1e293b",
    gap: 16,
  },
  heroBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  nextMatchTag: {
    fontSize: 11,
    fontWeight: "800",
    color: "#38bdf8",
    letterSpacing: 1,
  },
  heroDate: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94a3b8",
  },
  heroTeamsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  heroTeamCol: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  heroTeamLogo: {
    width: 58,
    height: 58,
    resizeMode: "contain",
  },
  heroLogoPlaceholder: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#1e293b",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTeamInitials: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 14,
  },
  heroTeamName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
  },
  heroVsCol: {
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
  },
  heroVsText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#ef4444",
  },
  heroVenueText: {
    fontSize: 11,
    color: "#64748b",
    maxWidth: 90,
    textAlign: "center",
  },
  heroActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 14,
  },
  heroActionBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  moreMatchesSection: {
    gap: 10,
    marginTop: 4,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  compactMatchCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#131b2e",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  compactInfo: {
    gap: 4,
    flex: 1,
  },
  compactDate: {
    fontSize: 11,
    fontWeight: "700",
    color: "#38bdf8",
  },
  compactMatchup: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  compactVenue: {
    fontSize: 12,
    color: "#64748b",
  },
  compactArrowBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#1e293b",
  },
  weekendBox: {
    backgroundColor: "#131b2e",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
    marginTop: 8,
  },
  weekendTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ffffff",
  },
  weekendDesc: {
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 4,
  },
});
