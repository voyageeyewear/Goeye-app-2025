import 'package:json_annotation/json_annotation.dart';
import 'product.dart';

part 'cart.g.dart';

@JsonSerializable()
class Cart {
  final String id;
  final List<CartLine> lines;
  final Price totalAmount;
  final Price subtotalAmount;
  final List<Price> taxes;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? checkoutUrl;

  Cart({
    required this.id,
    required this.lines,
    required this.totalAmount,
    required this.subtotalAmount,
    required this.taxes,
    required this.createdAt,
    required this.updatedAt,
    this.checkoutUrl,
  });

  factory Cart.fromJson(Map<String, dynamic> json) => _$CartFromJson(json);
  Map<String, dynamic> toJson() => _$CartToJson(this);

  // Helper getters
  int get totalQuantity => lines.fold(0, (sum, line) => sum + line.quantity);
  bool get isEmpty => lines.isEmpty;
  bool get isNotEmpty => lines.isNotEmpty;
  
  double get totalAmountValue => double.parse(totalAmount.amount);
  double get subtotalAmountValue => double.parse(subtotalAmount.amount);
  
  String get formattedTotalAmount => '\$${totalAmountValue.toStringAsFixed(2)}';
  String get formattedSubtotalAmount => '\$${subtotalAmountValue.toStringAsFixed(2)}';
  
  CartLine? findLineByVariantId(String variantId) {
    try {
      return lines.firstWhere((line) => line.merchandise.id == variantId);
    } catch (e) {
      return null;
    }
  }
  
  bool hasVariant(String variantId) {
    return findLineByVariantId(variantId) != null;
  }
  
  int getVariantQuantity(String variantId) {
    final line = findLineByVariantId(variantId);
    return line?.quantity ?? 0;
  }

  factory Cart.empty() {
    return Cart(
      id: '',
      lines: [],
      totalAmount: Price(amount: '0', currencyCode: 'USD'),
      subtotalAmount: Price(amount: '0', currencyCode: 'USD'),
      taxes: [],
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
  }
}

@JsonSerializable()
class CartLine {
  final String id;
  final int quantity;
  final ProductVariant merchandise;
  final Price totalAmount;

  CartLine({
    required this.id,
    required this.quantity,
    required this.merchandise,
    required this.totalAmount,
  });

  factory CartLine.fromJson(Map<String, dynamic> json) => _$CartLineFromJson(json);
  Map<String, dynamic> toJson() => _$CartLineToJson(this);

  double get totalAmountValue => double.parse(totalAmount.amount);
  String get formattedTotalAmount => '\$${totalAmountValue.toStringAsFixed(2)}';
  
  double get unitPrice => totalAmountValue / quantity;
  String get formattedUnitPrice => '\$${unitPrice.toStringAsFixed(2)}';
} 