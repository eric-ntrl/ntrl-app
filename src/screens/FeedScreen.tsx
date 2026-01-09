import React from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import brief from "../data/brief";
import type { Item, Section, Brief } from "../types";

type Props = { navigation: any };

type Row =
  | { type: "section"; section: Section }
  | { type: "item"; item: Item; sectionKey: string };

function flatten(b: Brief): Row[] {
  const rows: Row[] = [];
  for (const s of b.sections) {
    rows.push({ type: "section", section: s });
    for (const it of s.items) rows.push({ type: "item", item: it, sectionKey: s.key });
  }
  return rows;
}

export default function FeedScreen({ navigation }: Props) {
  const rows = flatten(brief);

  return (
    <View style={styles.container}>
      <View style={styles.topbar}>
        <Text style={styles.brand}>NTRL</Text>
        <Pressable onPress={() => navigation.navigate("Transparency")}>
          <Text style={styles.link}>Transparency</Text>
        </Pressable>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(r, idx) => (r.type === "section" ? `s-${r.section.key}` : r.item.id) + "-" + idx}
        renderItem={({ item }) => {
          if (item.type === "section") {
            return (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{item.section.title}</Text>
              </View>
            );
          }

          return (
            <Pressable
              style={styles.card}
              onPress={() => navigation.navigate("ArticleDetail", { item: item.item })}
            >
              <Text style={styles.headline}>{item.item.headline}</Text>
              <Text style={styles.summary}>{item.item.summary}</Text>
              <Text style={styles.meta}>{item.item.source}</Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 48, paddingHorizontal: 16 },
  topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  brand: { fontSize: 18, fontWeight: "700" },
  link: { fontSize: 14, fontWeight: "600" },

  sectionHeader: { marginTop: 14, marginBottom: 8 },
  sectionTitle: { fontSize: 14, fontWeight: "700", opacity: 0.8 },

  card: { paddingVertical: 14, borderBottomWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  headline: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  summary: { fontSize: 14, lineHeight: 20, opacity: 0.9, marginBottom: 8 },
  meta: { fontSize: 12, opacity: 0.7 }
});
