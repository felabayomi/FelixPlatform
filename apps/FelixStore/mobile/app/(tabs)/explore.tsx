import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { fetchProducts, type Product } from '@/services/store-api';

const promiseCards = [
  {
    title: 'Thoughtful variety',
    text: 'A growing mix of essentials, subscriptions, professional services, and digital products.',
  },
  {
    title: 'Customer-first feel',
    text: 'Designed to feel simple, reliable, and premium from the first tap to checkout.',
  },
  {
    title: 'Always evolving',
    text: 'New categories, stronger discovery, and smoother shopping moments are on the way.',
  },
];

const toTitleCase = (value: string) =>
  value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const getCollectionLabel = (product: Product) => {
  if (product.category_name?.trim()) {
    return product.category_name.trim();
  }

  if (product.type?.trim()) {
    return toTitleCase(product.type.trim());
  }

  return 'Featured';
};

export default function TabTwoScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts()
      .then((items) => setProducts(items))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const collectionSummary = useMemo(() => {
    const counts = new Map<string, number>();

    products.forEach((product) => {
      const label = getCollectionLabel(product);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [products]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}>
      <View style={styles.heroCard}>
        <ThemedText style={styles.kicker}>DISCOVER MORE</ThemedText>
        <ThemedText type="title" style={styles.title}>
          Collections worth exploring.
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Find curated categories built around convenience, quality, and modern everyday living.
        </ThemedText>
      </View>

      {loading ? (
        <View style={styles.statusCard}>
          <ActivityIndicator color="#2563EB" />
          <ThemedText>Loading collections...</ThemedText>
        </View>
      ) : null}

      <View style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Trending collections
        </ThemedText>

        {collectionSummary.map(([label, count]) => (
          <View key={label} style={styles.collectionCard}>
            <View style={styles.collectionTextWrap}>
              <ThemedText type="defaultSemiBold" style={styles.collectionName}>
                {label}
              </ThemedText>
              <ThemedText style={styles.collectionMeta}>{count} items ready to explore</ThemedText>
            </View>
            <View style={styles.countBadge}>
              <ThemedText style={styles.countBadgeText}>{count}</ThemedText>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          The Felix promise
        </ThemedText>

        {promiseCards.map((item) => (
          <View key={item.title} style={styles.promiseCard}>
            <ThemedText type="defaultSemiBold" style={styles.promiseTitle}>
              {item.title}
            </ThemedText>
            <ThemedText style={styles.promiseText}>{item.text}</ThemedText>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  heroCard: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 18,
    gap: 10,
  },
  kicker: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  title: {
    color: '#FFFFFF',
    lineHeight: 38,
  },
  subtitle: {
    color: '#CBD5E1',
    fontSize: 15,
    lineHeight: 22,
  },
  statusCard: {
    gap: 10,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: '#0F172A',
  },
  collectionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  collectionTextWrap: {
    flex: 1,
    gap: 4,
  },
  collectionName: {
    color: '#0F172A',
  },
  collectionMeta: {
    color: '#64748B',
    fontSize: 14,
  },
  countBadge: {
    minWidth: 42,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
  },
  countBadgeText: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  promiseCard: {
    gap: 6,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  promiseTitle: {
    color: '#0F172A',
  },
  promiseText: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 21,
  },
});
