import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { createOrder, fetchProducts, type Product } from '@/services/store-api';

const spotlightCards = [
  {
    title: 'Curated quality',
    text: 'A handpicked mix of essentials, services, and digital finds that feel worth discovering.',
  },
  {
    title: 'Simple shopping',
    text: 'A cleaner catalog experience built for fast browsing, easier decisions, and repeat visits.',
  },
  {
    title: 'Modern convenience',
    text: 'From lifestyle needs to business tools, everything lives in one polished destination.',
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

  return details.length ? details.join(' • ') : 'Flexible pricing';
};

const shortenText = (value: string, limit = 108) =>
  value.length > limit ? `${value.slice(0, limit).trim()}…` : value;


const getPrimaryActionLabel = (product: Product) => {
  if (product.action_label?.trim()) {
    return product.action_label.trim();
  }

  const searchableText = [
    product.name,
    product.description,
    product.category_name,
    product.type,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (/(app|software|website|platform|saas|build)/.test(searchableText)) {
    return 'Request App Build';
  }

  if (/(consult|strategy|coach|advisor|advisory)/.test(searchableText)) {
    return 'Request Consultation';
  }

  if (/(travel|tour|trip|hotel|flight|visa|vacation)/.test(searchableText)) {
    return 'Request Travel Plan';
  }

  if (/(digital|ebook|template|download|course|subscription)/.test(searchableText)) {
    return 'Request Digital Product';
  }

  if (/(service|repair|support|installation|booking)/.test(searchableText)) {
    return 'Request Service';
  }

  return 'Request Quote';
};

type CartEntry = {
  product: Product;
  quantity: number;
};

export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('All');
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [orderNotes, setOrderNotes] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [failedImageIds, setFailedImageIds] = useState<Record<string, boolean>>({});

  const loadProducts = async () => {
    setFailedImageIds({});
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
    void loadProducts();
  }, []);

  const collections = useMemo(() => {
    const uniqueCollections = Array.from(new Set(products.map(getCollectionLabel)));
    return ['All', ...uniqueCollections.slice(0, 8)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      if (selectedCollection !== 'All' && getCollectionLabel(product) !== selectedCollection) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchableText = [
        product.name,
        product.description,
        getCollectionLabel(product),
        product.type,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [products, search, selectedCollection]);

  const cartItemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  const cartSubtotal = useMemo(
    () =>
      cart.reduce((sum, item) => {
        const amount = Number(item.product.price);
        return sum + (Number.isNaN(amount) ? 0 : amount * item.quantity);
      }, 0),
    [cart],
  );

  const deliveryFee = cart.length ? (deliveryType === 'delivery' ? 7.5 : 0) : 0;
  const orderTotal = cartSubtotal + deliveryFee;

  const addToCart = (product: Product) => {
    setCart((current) => {
      const existingItem = current.find((item) => String(item.product.id) === String(product.id));

      if (existingItem) {
        return current.map((item) =>
          String(item.product.id) === String(product.id)
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [...current, { product, quantity: 1 }];
    });

    setCheckoutMessage('');
    setCheckoutError('');
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart((current) =>
      current
        .map((item) =>
          String(item.product.id) === String(productId)
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((current) => current.filter((item) => String(item.product.id) !== String(productId)));
  };

  const handleCheckout = async () => {
    if (!cart.length) {
      setCheckoutError('Add at least one item to your request list before sending a quote request.');
      setCheckoutMessage('');
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      setCheckoutError('Please enter your name and phone number so the team can respond to your quote request.');
      setCheckoutMessage('');
      return;
    }

    if (deliveryType === 'delivery' && !deliveryAddress.trim()) {
      setCheckoutError('Please provide a delivery address so we can prepare the right quote.');
      setCheckoutMessage('');
      return;
    }

    setSubmittingOrder(true);
    setCheckoutError('');
    setCheckoutMessage('');

    try {
      const order = await createOrder({
        items: cart,
        subtotal: cartSubtotal,
        deliveryFee,
        total: orderTotal,
        deliveryType,
        customerName,
        customerPhone,
        deliveryAddress,
        notes: orderNotes,
      });

      setCheckoutMessage(`Quote request #${order.id} has been sent. The Felix team will review it and contact you shortly.`);
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setDeliveryAddress('');
      setOrderNotes('');
    } catch (err) {
      console.error(err);
      setCheckoutError(err instanceof Error ? err.message : 'Unable to send your quote request right now.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}>
      <View style={styles.heroCard}>
        <View style={styles.brandPill}>
          <ThemedText style={styles.brandPillText}>FELIX STORE</ThemedText>
        </View>

        <ThemedText type="title" style={styles.heroTitle}>
          A premium storefront for everyday wins.
        </ThemedText>

        <ThemedText style={styles.heroSubtitle}>
          Explore essentials, standout services, and digital finds, then send a quote request for tailored pricing and fulfillment.
        </ThemedText>

        <View style={styles.searchRow}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search products, services, or categories"
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
            autoCapitalize="none"
          />
          <Pressable style={styles.refreshButton} onPress={loadProducts}>
            <ThemedText style={styles.refreshButtonText}>Refresh</ThemedText>
          </Pressable>
        </View>

        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>{products.length}+</ThemedText>
            <ThemedText style={styles.statLabel}>Curated picks</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>{Math.max(collections.length - 1, 1)}</ThemedText>
            <ThemedText style={styles.statLabel}>Collections</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>24/7</ThemedText>
            <ThemedText style={styles.statLabel}>Open access</ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Browse collections
        </ThemedText>
        <View style={styles.chipWrap}>
          {collections.map((collection) => {
            const selected = collection === selectedCollection;
            return (
              <Pressable
                key={collection}
                onPress={() => setSelectedCollection(collection)}
                style={[styles.chip, selected ? styles.chipActive : null]}>
                <ThemedText style={[styles.chipText, selected ? styles.chipTextActive : null]}>
                  {collection}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {loading ? (
        <View style={styles.messageCard}>
          <ActivityIndicator color="#2563EB" />
          <ThemedText>Loading the best of Felix Store...</ThemedText>
        </View>
      ) : null}

      {error ? (
        <View style={[styles.messageCard, styles.errorCard]}>
          <ThemedText type="defaultSemiBold" style={styles.errorTitle}>
            We’re having trouble loading the catalog
          </ThemedText>
          <ThemedText>{error}</ThemedText>
          <Pressable style={styles.retryButton} onPress={loadProducts}>
            <ThemedText style={styles.refreshButtonText}>Try again</ThemedText>
          </Pressable>
        </View>
      ) : null}

      {!loading && !error ? (
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Featured now
          </ThemedText>
          <ThemedText style={styles.sectionCaption}>
            {selectedCollection === 'All' ? 'Top picks this week' : selectedCollection}
          </ThemedText>
        </View>
      ) : null}

      {!loading && !error && filteredProducts.length === 0 ? (
        <View style={styles.messageCard}>
          <ThemedText type="defaultSemiBold">No matches yet</ThemedText>
          <ThemedText>Try another search or switch collections to see more of the catalog.</ThemedText>
        </View>
      ) : null}

      {!loading && !error
        ? filteredProducts.map((product) => {
          const cartQuantity =
            cart.find((item) => String(item.product.id) === String(product.id))?.quantity ?? 0;

          return (
            <View key={product.id} style={styles.productCard}>
              {product.image_url && !failedImageIds[String(product.id)] ? (
                <Image
                  source={{ uri: product.image_url }}
                  style={styles.productImage}
                  resizeMode="cover"
                  onError={() => {
                    setFailedImageIds((current) => ({
                      ...current,
                      [String(product.id)]: true,
                    }));
                  }}
                />
              ) : (
                <View style={styles.productImageFallback}>
                  <ThemedText style={styles.productImageFallbackText}>
                    {getCollectionLabel(product)}
                  </ThemedText>
                </View>
              )}

              <View style={styles.productContent}>
                <View style={styles.productMetaRow}>
                  <View style={styles.productTag}>
                    <ThemedText style={styles.productTagText}>{getCollectionLabel(product)}</ThemedText>
                  </View>
                  <ThemedText style={styles.productPrice}>{formatPrice(product.price)}</ThemedText>
                </View>

                <ThemedText type="defaultSemiBold" style={styles.productName}>
                  {product.name}
                </ThemedText>

                <ThemedText style={styles.productDescription}>
                  {shortenText(product.description || 'Useful, reliable, and ready when you are.')}
                </ThemedText>

                <ThemedText style={styles.productFootnote}>{formatPricing(product)}</ThemedText>

                <View style={styles.productActionRow}>
                  <ThemedText style={styles.productActionHint}>
                    {cartQuantity ? `${cartQuantity} in request` : getPrimaryActionLabel(product)}
                  </ThemedText>
                  <Pressable style={styles.addToCartButton} onPress={() => addToCart(product)}>
                    <ThemedText style={styles.addToCartButtonText}>
                      {cartQuantity ? 'Add Another Request' : getPrimaryActionLabel(product)}
                    </ThemedText>
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })
        : null}

      <View style={styles.checkoutCard}>
        <View style={styles.checkoutHeader}>
          <View style={styles.checkoutHeaderText}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Quote request
            </ThemedText>
            <ThemedText style={styles.checkoutCaption}>
              {cartItemCount
                ? `${cartItemCount} item${cartItemCount === 1 ? '' : 's'} in your request list.`
                : 'Add products from the catalog to build a quote request.'}
            </ThemedText>
          </View>
          <View style={styles.totalBadge}>
            <ThemedText style={styles.totalBadgeText}>{formatPrice(orderTotal)}</ThemedText>
          </View>
        </View>

        {cart.length === 0 ? (
          <View style={styles.emptyCartCard}>
            <ThemedText type="defaultSemiBold">Your request list is empty</ThemedText>
            <ThemedText style={styles.emptyCartText}>
              Tap the action button on any product card to add it to your quote request.
            </ThemedText>
          </View>
        ) : (
          <>
            {cart.map((item) => (
              <View key={item.product.id} style={styles.cartRow}>
                <View style={styles.cartInfo}>
                  <ThemedText type="defaultSemiBold" style={styles.cartName}>
                    {item.product.name}
                  </ThemedText>
                  <ThemedText style={styles.cartMeta}>
                    {formatPrice(item.product.price)} • {getCollectionLabel(item.product)}
                  </ThemedText>
                </View>

                <View style={styles.quantityControls}>
                  <Pressable style={styles.qtyButton} onPress={() => updateCartQuantity(String(item.product.id), -1)}>
                    <ThemedText style={styles.qtyButtonText}>−</ThemedText>
                  </Pressable>
                  <ThemedText style={styles.qtyValue}>{item.quantity}</ThemedText>
                  <Pressable style={styles.qtyButton} onPress={() => updateCartQuantity(String(item.product.id), 1)}>
                    <ThemedText style={styles.qtyButtonText}>+</ThemedText>
                  </Pressable>
                </View>

                <Pressable onPress={() => removeFromCart(String(item.product.id))}>
                  <ThemedText style={styles.removeText}>Remove</ThemedText>
                </Pressable>
              </View>
            ))}

            <View style={styles.summaryBlock}>
              <View style={styles.summaryRow}>
                <ThemedText style={styles.summaryLabel}>Subtotal</ThemedText>
                <ThemedText style={styles.summaryValue}>{formatPrice(cartSubtotal)}</ThemedText>
              </View>
              <View style={styles.summaryRow}>
                <ThemedText style={styles.summaryLabel}>Delivery</ThemedText>
                <ThemedText style={styles.summaryValue}>{formatPrice(deliveryFee)}</ThemedText>
              </View>
              <View style={styles.summaryRow}>
                <ThemedText style={styles.summaryTotalLabel}>Reference total</ThemedText>
                <ThemedText style={styles.summaryTotalValue}>{formatPrice(orderTotal)}</ThemedText>
              </View>
            </View>

            <ThemedText style={styles.emptyCartText}>
              Final pricing is confirmed after review. Payment can be handled offline, by invoice, or through a secure payment link.
            </ThemedText>

            <ThemedText type="defaultSemiBold" style={styles.checkoutSubheading}>
              Request details
            </ThemedText>

            <View style={styles.deliverySwitchRow}>
              <Pressable
                style={[styles.deliveryOption, deliveryType === 'delivery' ? styles.deliveryOptionActive : null]}
                onPress={() => setDeliveryType('delivery')}>
                <ThemedText style={[styles.deliveryOptionText, deliveryType === 'delivery' ? styles.deliveryOptionTextActive : null]}>
                  Delivery
                </ThemedText>
              </Pressable>
              <Pressable
                style={[styles.deliveryOption, deliveryType === 'pickup' ? styles.deliveryOptionActive : null]}
                onPress={() => setDeliveryType('pickup')}>
                <ThemedText style={[styles.deliveryOptionText, deliveryType === 'pickup' ? styles.deliveryOptionTextActive : null]}>
                  Pickup
                </ThemedText>
              </Pressable>
            </View>

            <TextInput
              style={styles.checkoutInput}
              placeholder="Full name"
              placeholderTextColor="#94A3B8"
              value={customerName}
              onChangeText={setCustomerName}
            />
            <TextInput
              style={styles.checkoutInput}
              placeholder="Phone number"
              placeholderTextColor="#94A3B8"
              value={customerPhone}
              onChangeText={setCustomerPhone}
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.checkoutInput}
              placeholder={deliveryType === 'delivery' ? 'Delivery address' : 'Pickup note or preferred location'}
              placeholderTextColor="#94A3B8"
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
            />
            <TextInput
              style={[styles.checkoutInput, styles.checkoutNotesInput]}
              placeholder="Quote details (sizes, bundles, custom requests)"
              placeholderTextColor="#94A3B8"
              value={orderNotes}
              onChangeText={setOrderNotes}
              multiline
            />

            {checkoutMessage ? <ThemedText style={styles.successCardText}>{checkoutMessage}</ThemedText> : null}
            {checkoutError ? <ThemedText style={styles.errorTitle}>{checkoutError}</ThemedText> : null}

            <Pressable
              style={[styles.checkoutButton, submittingOrder ? styles.checkoutButtonDisabled : null]}
              onPress={handleCheckout}
              disabled={submittingOrder}>
              <ThemedText style={styles.checkoutButtonText}>
                {submittingOrder ? 'Sending request...' : 'Request Quote'}
              </ThemedText>
            </Pressable>
          </>
        )}
      </View>

      <View style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Why shoppers choose Felix
        </ThemedText>
        <View style={styles.featureGrid}>
          {spotlightCards.map((item) => (
            <View key={item.title} style={styles.featureCard}>
              <ThemedText type="defaultSemiBold" style={styles.featureTitle}>
                {item.title}
              </ThemedText>
              <ThemedText style={styles.featureText}>{item.text}</ThemedText>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.ctaCard}>
        <ThemedText type="subtitle" style={styles.ctaTitle}>
          More premium shopping moments are coming next.
        </ThemedText>
        <ThemedText style={styles.ctaText}>
          Next up: richer category browsing, favorites, a smoother cart flow, and even better product discovery.
        </ThemedText>
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
    gap: 14,
  },
  brandPill: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#1D4ED8',
  },
  brandPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  heroTitle: {
    color: '#FFFFFF',
    lineHeight: 38,
  },
  heroSubtitle: {
    color: '#CBD5E1',
    fontSize: 15,
    lineHeight: 22,
  },
  searchRow: {
    gap: 10,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
  },
  refreshButton: {
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignSelf: 'flex-start',
  },
  retryButton: {
    marginTop: 4,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignSelf: 'flex-start',
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    color: '#0F172A',
  },
  sectionCaption: {
    color: '#64748B',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  chipText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#1D4ED8',
  },
  messageCard: {
    gap: 10,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  errorTitle: {
    color: '#991B1B',
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  productImage: {
    width: '100%',
    height: 190,
    backgroundColor: '#E2E8F0',
  },
  productImageFallback: {
    width: '100%',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 20,
  },
  productImageFallbackText: {
    color: '#1D4ED8',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  productContent: {
    padding: 14,
    gap: 8,
  },
  productMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'center',
  },
  productTag: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#EFF6FF',
  },
  productTagText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '700',
  },
  productPrice: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
  productName: {
    color: '#0F172A',
    fontSize: 18,
    lineHeight: 24,
  },
  productDescription: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 21,
  },
  productFootnote: {
    color: '#64748B',
    fontSize: 13,
  },
  productActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  productActionHint: {
    flex: 1,
    color: '#475569',
    fontSize: 13,
  },
  addToCartButton: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#1D4ED8',
  },
  addToCartButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  checkoutCard: {
    gap: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  checkoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkoutHeaderText: {
    flex: 1,
    gap: 4,
  },
  checkoutCaption: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
  },
  totalBadge: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#DBEAFE',
  },
  totalBadgeText: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  emptyCartCard: {
    gap: 6,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyCartText: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
  },
  cartRow: {
    gap: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cartInfo: {
    gap: 3,
  },
  cartName: {
    color: '#0F172A',
  },
  cartMeta: {
    color: '#64748B',
    fontSize: 13,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qtyButton: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DBEAFE',
  },
  qtyButtonText: {
    color: '#1D4ED8',
    fontSize: 18,
    fontWeight: '700',
  },
  qtyValue: {
    color: '#0F172A',
    fontWeight: '700',
  },
  removeText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '700',
  },
  summaryBlock: {
    gap: 8,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#475569',
  },
  summaryValue: {
    color: '#0F172A',
    fontWeight: '600',
  },
  summaryTotalLabel: {
    color: '#0F172A',
    fontWeight: '700',
  },
  summaryTotalValue: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 16,
  },
  checkoutSubheading: {
    color: '#0F172A',
  },
  deliverySwitchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  deliveryOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
  },
  deliveryOptionActive: {
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  deliveryOptionText: {
    color: '#334155',
    fontWeight: '600',
  },
  deliveryOptionTextActive: {
    color: '#1D4ED8',
  },
  checkoutInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    fontSize: 15,
  },
  checkoutNotesInput: {
    minHeight: 86,
    textAlignVertical: 'top',
  },
  checkoutButton: {
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
  },
  checkoutButtonDisabled: {
    opacity: 0.7,
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  successCardText: {
    color: '#166534',
    backgroundColor: '#DCFCE7',
    padding: 10,
    borderRadius: 10,
  },
  featureGrid: {
    gap: 10,
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  featureTitle: {
    color: '#0F172A',
  },
  featureText: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 21,
  },
  ctaCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  ctaTitle: {
    color: '#0F172A',
  },
  ctaText: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 21,
  },
});
