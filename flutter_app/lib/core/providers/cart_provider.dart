import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/cart.dart';
import '../services/api_service.dart';

// Cart state notifier
class CartNotifier extends StateNotifier<AsyncValue<Cart>> {
  CartNotifier() : super(const AsyncValue.loading()) {
    _loadCart();
  }

  String? _cartId;

  // Load cart from local storage or create new one
  Future<void> _loadCart() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _cartId = prefs.getString('cart_id');
      
      if (_cartId != null) {
        // Try to load existing cart
        final cart = await ApiService.getCart(_cartId!);
        state = AsyncValue.data(cart);
      } else {
        // Create new cart
        await _createNewCart();
      }
    } catch (e) {
      // If loading fails, create new cart
      await _createNewCart();
    }
  }

  Future<void> _createNewCart() async {
    try {
      final cart = await ApiService.createCart();
      _cartId = cart.id;
      
      // Save cart ID to local storage
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('cart_id', _cartId!);
      
      state = AsyncValue.data(cart);
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
    }
  }

  // Add item to cart
  Future<void> addToCart(String variantId, int quantity) async {
    try {
      state = const AsyncValue.loading();
      
      if (_cartId == null) {
        // Create cart by adding first item
        await _createCartWithFirstItem(variantId, quantity);
      } else {
        // Add to existing cart
        final updatedCart = await ApiService.addToCart(_cartId!, '', variantId, quantity);
        state = AsyncValue.data(updatedCart);
      }
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
    }
  }

  // Create cart with first item
  Future<void> _createCartWithFirstItem(String variantId, int quantity) async {
    try {
      // Add first item (this will create the cart)
      final cart = await ApiService.addToCart('', '', variantId, quantity);
      _cartId = cart.id;
      
      // Save cart ID to local storage
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('cart_id', _cartId!);
      
      state = AsyncValue.data(cart);
    } catch (e) {
      throw e;
    }
  }

  // Update cart item quantity
  Future<void> updateCartItem(String variantId, int quantity) async {
    if (_cartId == null) return;

    try {
      state = const AsyncValue.loading();
      final updatedCart = await ApiService.updateCartItem(_cartId!, variantId, quantity);
      state = AsyncValue.data(updatedCart);
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
    }
  }

  // Remove item from cart
  Future<void> removeFromCart(String variantId) async {
    if (_cartId == null) return;

    try {
      state = const AsyncValue.loading();
      final updatedCart = await ApiService.removeFromCart(_cartId!, variantId);
      state = AsyncValue.data(updatedCart);
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
    }
  }

  // Clear cart
  Future<void> clearCart() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('cart_id');
    _cartId = null;
    await _createNewCart();
  }

  // Get current cart
  Cart? get currentCart {
    return state.when(
      data: (cart) => cart,
      loading: () => null,
      error: (_, __) => null,
    );
  }

  // Get total quantity in cart
  int get totalQuantity {
    return currentCart?.totalQuantity ?? 0;
  }

  // Check if variant is in cart
  bool hasVariant(String variantId) {
    return currentCart?.hasVariant(variantId) ?? false;
  }

  // Get quantity of specific variant in cart
  int getVariantQuantity(String variantId) {
    return currentCart?.getVariantQuantity(variantId) ?? 0;
  }
}

// Cart provider
final cartProvider = StateNotifierProvider<CartNotifier, AsyncValue<Cart>>((ref) {
  return CartNotifier();
});

// Convenience providers
final cartTotalQuantityProvider = Provider<int>((ref) {
  return ref.watch(cartProvider.notifier).totalQuantity;
});

final cartIsLoadingProvider = Provider<bool>((ref) {
  return ref.watch(cartProvider).isLoading;
}); 