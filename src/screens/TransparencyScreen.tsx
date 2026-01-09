import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function TransparencyScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transparency</Text>

      <Text style={styles.p}>
        NTRL removes the triggers, hype, and manipulation from information so you can understand what matters without
        being sold to, provoked, or otherwise worked up for someone else’s agenda.
      </Text>

      <Text style={styles.h}>What this is</Text>
      <Text style={styles.p}>A reading layer: shortened, de-triggered, and structured summaries.</Text>

      <Text style={styles.h}>What this is not</Text>
      <Text style={styles.p}>A truth engine. NTRL can be wrong. It flags uncertainty instead of guessing.</Text>

      <Text style={styles.h}>How it works (Phase 1)</Text>
      <Text style={styles.p}>Sources → extract → summarize → remove manipulative phrasing → store + show what changed.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 28, paddingHorizontal: 16 },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 14 },
  h: { marginTop: 18, fontSize: 13, fontWeight: "800", opacity: 0.9, textTransform: "uppercase" },
  p: { marginTop: 8, fontSize: 15, lineHeight: 22, opacity: 0.95 }
});
