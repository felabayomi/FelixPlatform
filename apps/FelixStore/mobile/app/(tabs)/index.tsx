import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { API_BASE_URL, fetchProducts, type Product } from '@/services/store-api';

const formatPrice = (value: Product['price']) => {
  if (value === null || value === undefined || value === '') {
    return 'Price on request';
  }

  const amount = Number(value);
  return Number.isNaN(amount) ? String(value) : `$${amount.toFixed(2)}`;
};

const formatPricing = (product: Product) => {
  const details: string[] = [];

  if (product.price_type) {
    details.push(product.price_type.replace(/_/g, ' '));
  }

  if (product.unit) {
    details.push(product.unit);
  }

  if (product.subscription_interval) {
    details.push(product.subscription_interval);
  }

  return details.length ? details.join(' • ') : 'fixed';
};

export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProducts = async () => {
    setLoading(true);
    setError('');

    try {
      const items = await fetchProducts();
      setProducts(items);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Unable to load products right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const featuredProducts = useMemo(() => products.slice(0, 8), [products]);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#E0F2FE', dark: '#0F172A' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Felix Store</ThemedText>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Live products API</ThemedText>
        <ThemedText>Version `3.0.0` is now wired to `{API_BASE_URL}/products`.</ThemedText>
        <Pressable style={styles.refreshButton} onPress={loadProducts}>
          <ThemedText style={styles.refreshButtonText}>Refresh products</ThemedText>
        </Pressable>
      </ThemedView>

      {loading ? (
        <ThemedView style={styles.card}>
          <ThemedText>Loading Felix Store products...</ThemedText>
        </ThemedView>
      ) : null}

      {error ? (
        <ThemedView style={styles.card}>
          <ThemedText type="defaultSemiBold">Connection note</ThemedText>
          <ThemedText>{error}</ThemedText>
          <ThemedText>
            For EAS device builds, set `EXPO_PUBLIC_API_URL` to your Railway or Render backend URL.
          </ThemedText>
        </ThemedView>
      ) : null}

      {!loading && !error ? (
        <ThemedView style={styles.card}>
          <ThemedText type="subtitle">Catalog preview</ThemedText>
          <ThemedText>{products.length} active products loaded from the backend.</ThemedText>
        </ThemedView>
      ) : null}

      {featuredProducts.map((product) => (
        <ThemedView key={product.id} style={styles.productCard}>
          {product.image_url ? (
            <Image source={{ uri: product.image_url }} style={styles.productImage} contentFit="cover" />
          ) : null}
          <ThemedText type="subtitle">{product.name}</ThemedText>
          <ThemedText>{product.description || 'No description available yet.'}</ThemedText>
          <ThemedText type="defaultSemiBold">{formatPrice(product.price)}</ThemedText>
          <ThemedText>{formatPricing(product)}</ThemedText>
        </ThemedView>
      ))}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    marginBottom: 8,
  },
  card: {
    gap: 8,
    marginBottom: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
  },
  productCard: {
    gap: 8,
    marginBottom: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
  },
  productImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  refreshButton: {
    marginTop: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignSelf: 'flex-start',
  },
  refreshButtonText: {
    color: '#FFFFFF',
  },
  headerImage: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
