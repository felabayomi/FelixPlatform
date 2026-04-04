import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { Collapsible } from '@/components/ui/collapsible';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';
import { API_BASE_URL, fetchProducts } from '@/services/store-api';

export default function TabTwoScreen() {
  const [productCount, setProductCount] = useState<number | null>(null);

  useEffect(() => {
    fetchProducts()
      .then((items) => setProductCount(items.length))
      .catch(() => setProductCount(null));
  }, []);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#DBEAFE', dark: '#1E293B' }}
      headerImage={
        <IconSymbol
          size={300}
          color="#2563EB"
          name="shippingbox.fill"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type="title"
          style={{
            fontFamily: Fonts.rounded,
          }}>
          Release &amp; API Info
        </ThemedText>
      </ThemedView>

      <ThemedText>This tab keeps the app aligned with your EAS build and App Store update path.</ThemedText>

      <Collapsible title="Version 3.0.0 release info">
        <ThemedText>Bundle ID: <ThemedText type="defaultSemiBold">com.felixstore.us</ThemedText></ThemedText>
        <ThemedText>SKU: <ThemedText type="defaultSemiBold">com.felixstore.us</ThemedText></ThemedText>
        <ThemedText>Apple App ID: <ThemedText type="defaultSemiBold">1567050617</ThemedText></ThemedText>
      </Collapsible>

      <Collapsible title="Products API connection">
        <ThemedText>Current base URL: <ThemedText type="defaultSemiBold">{API_BASE_URL}</ThemedText></ThemedText>
        <ThemedText>
          Live product count: <ThemedText type="defaultSemiBold">{productCount ?? 'Unavailable until the API responds'}</ThemedText>
        </ThemedText>
      </Collapsible>

      <Collapsible title="EAS build note">
        <ThemedText>
          For simulator testing, the app can use localhost. For real EAS device builds, point
          <ThemedText type="defaultSemiBold"> EXPO_PUBLIC_API_URL </ThemedText>
          to your Railway or Render backend before submitting updates.
        </ThemedText>
      </Collapsible>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    bottom: -70,
    left: -25,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
