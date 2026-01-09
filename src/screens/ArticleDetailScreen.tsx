import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from "react-native";
import type { Item } from "../types";

export default function ArticleDetailScreen({ route }: any) {
  const item: Item = route.params.item;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.headline}>{item.headline}</Text>
      <Text style={styles.meta}>{item.source}</Text>

      <Section title="What happened" body={item.detail.what_happened} />
      <Section title="Why it matters" body={item.detail.why_it_matters} />

      <ListSection title="Known" items={item.detail.known} />
      <ListSection title="Uncertain" items={item.detail.uncertain} />

      {item.detail.removed?.length ? (
        <ListSection title="Removed / reduced" items={item.detail.removed} subtle />
      ) : null}

      <Pressable style={styles.button} onPress={() => Linking.openURL(item.url)}>
        <Text style={styles.buttonText}>Open source</Text>
      </Pressable>
    </ScrollView>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.block}>
      <Text style={styles.h}>{title}</Text>
      <Text style={styles.p}>{body}</Text>
    </View>
  );
}

function ListSection({ title, items, subtle }: { title: string; items: string[]; subtle?: boolean }) {
  return (
    <View style={styles.block}>
      <Text style={[styles.h, subtle ? { opacity: 0.8 } : null]}>{title}</Text>
      {items.map((t, i) => (
        <Text key={i} style={[styles.li, subtle ? { opacity: 0.8 } : null]}>
          • {t}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 16, paddingHorizontal: 16 },
  headline: { fontSize: 20, fontWeight: "800", marginBottom: 8 },
  meta: { fontSize: 12, opacity: 0.7, marginBottom: 12 },

  block: { marginTop: 16 },
  h: { fontSize: 13, fontWeight: "800", marginBottom: 6, opacity: 0.9, textTransform: "uppercase" },
  p: { fontSize: 15, lineHeight: 22, opacity: 0.95 },
  li: { fontSize: 15, lineHeight: 22, opacity: 0.95 },

  button: { marginTop: 22, paddingVertical: 12, borderWidth: 1, borderRadius: 12, alignItems: "center" },
  buttonText: { fontSize: 14, fontWeight: "700" }
});
