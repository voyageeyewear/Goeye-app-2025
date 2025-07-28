import 'package:json_annotation/json_annotation.dart';

part 'product.g.dart';

@JsonSerializable()
class Product {
  final String id;
  final String title;
  final String description;
  final String handle;
  final String vendor;
  final String productType;
  final List<String> tags;
  final DateTime createdAt;
  final DateTime updatedAt;
  final bool availableForSale;
  final List<ProductImage> images;
  final List<ProductVariant> variants;
  final PriceRange priceRange;
  final PriceRange? compareAtPriceRange;

  Product({
    required this.id,
    required this.title,
    required this.description,
    required this.handle,
    required this.vendor,
    required this.productType,
    required this.tags,
    required this.createdAt,
    required this.updatedAt,
    required this.availableForSale,
    required this.images,
    required this.variants,
    required this.priceRange,
    this.compareAtPriceRange,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'],
      title: json['title'],
      description: json['description'] ?? '',
      handle: json['handle'],
      vendor: json['vendor'] ?? '',
      productType: json['productType'] ?? '',
      tags: List<String>.from(json['tags'] ?? []),
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
      availableForSale: json['availableForSale'] ?? false,
      images: (json['images']['edges'] as List)
          .map((edge) => ProductImage.fromJson(edge['node']))
          .toList(),
      variants: (json['variants']['edges'] as List)
          .map((edge) => ProductVariant.fromJson(edge['node']))
          .toList(),
      priceRange: PriceRange.fromJson(json['priceRange']),
      compareAtPriceRange: json['compareAtPriceRange'] != null
          ? PriceRange.fromJson(json['compareAtPriceRange'])
          : null,
    );
  }

  Map<String, dynamic> toJson() => _$ProductToJson(this);

  // Helper getters
  String get primaryImageUrl => images.isNotEmpty ? images.first.url : '';
  ProductVariant get defaultVariant => variants.isNotEmpty ? variants.first : ProductVariant.empty();
  bool get isOnSale => compareAtPriceRange != null;
  
  double get minPrice => double.parse(priceRange.minVariantPrice.amount);
  double get maxPrice => double.parse(priceRange.maxVariantPrice.amount);
  
  String get formattedPrice {
    if (minPrice == maxPrice) {
      return '\$${minPrice.toStringAsFixed(2)}';
    }
    return '\$${minPrice.toStringAsFixed(2)} - \$${maxPrice.toStringAsFixed(2)}';
  }
  
  String? get formattedCompareAtPrice {
    if (compareAtPriceRange == null) return null;
    final minComparePrice = double.parse(compareAtPriceRange!.minVariantPrice.amount);
    final maxComparePrice = double.parse(compareAtPriceRange!.maxVariantPrice.amount);
    
    if (minComparePrice == maxComparePrice) {
      return '\$${minComparePrice.toStringAsFixed(2)}';
    }
    return '\$${minComparePrice.toStringAsFixed(2)} - \$${maxComparePrice.toStringAsFixed(2)}';
  }
}

@JsonSerializable()
class ProductImage {
  final String id;
  final String url;
  final String? altText;
  final int? width;
  final int? height;

  ProductImage({
    required this.id,
    required this.url,
    this.altText,
    this.width,
    this.height,
  });

  factory ProductImage.fromJson(Map<String, dynamic> json) => _$ProductImageFromJson(json);
  Map<String, dynamic> toJson() => _$ProductImageToJson(this);
}

@JsonSerializable()
class ProductVariant {
  final String id;
  final String title;
  final Price price;
  final Price? compareAtPrice;
  final bool availableForSale;
  final int? quantityAvailable;
  final List<SelectedOption> selectedOptions;
  final ProductImage? image;

  ProductVariant({
    required this.id,
    required this.title,
    required this.price,
    this.compareAtPrice,
    required this.availableForSale,
    this.quantityAvailable,
    required this.selectedOptions,
    this.image,
  });

  factory ProductVariant.fromJson(Map<String, dynamic> json) {
    return ProductVariant(
      id: json['id'],
      title: json['title'],
      price: Price.fromJson(json['price']),
      compareAtPrice: json['compareAtPrice'] != null
          ? Price.fromJson(json['compareAtPrice'])
          : null,
      availableForSale: json['availableForSale'] ?? false,
      quantityAvailable: json['quantityAvailable'],
      selectedOptions: (json['selectedOptions'] as List)
          .map((option) => SelectedOption.fromJson(option))
          .toList(),
      image: json['image'] != null ? ProductImage.fromJson(json['image']) : null,
    );
  }

  Map<String, dynamic> toJson() => _$ProductVariantToJson(this);

  factory ProductVariant.empty() {
    return ProductVariant(
      id: '',
      title: '',
      price: Price(amount: '0', currencyCode: 'USD'),
      availableForSale: false,
      selectedOptions: [],
    );
  }

  double get priceAmount => double.parse(price.amount);
  double? get compareAtPriceAmount => compareAtPrice != null ? double.parse(compareAtPrice!.amount) : null;
  
  String get formattedPrice => '\$${priceAmount.toStringAsFixed(2)}';
  String? get formattedCompareAtPrice => compareAtPriceAmount != null ? '\$${compareAtPriceAmount!.toStringAsFixed(2)}' : null;
  
  bool get isOnSale => compareAtPrice != null && compareAtPriceAmount! > priceAmount;
}

@JsonSerializable()
class Price {
  final String amount;
  final String currencyCode;

  Price({
    required this.amount,
    required this.currencyCode,
  });

  factory Price.fromJson(Map<String, dynamic> json) => _$PriceFromJson(json);
  Map<String, dynamic> toJson() => _$PriceToJson(this);
}

@JsonSerializable()
class PriceRange {
  final Price minVariantPrice;
  final Price maxVariantPrice;

  PriceRange({
    required this.minVariantPrice,
    required this.maxVariantPrice,
  });

  factory PriceRange.fromJson(Map<String, dynamic> json) => _$PriceRangeFromJson(json);
  Map<String, dynamic> toJson() => _$PriceRangeToJson(this);
}

@JsonSerializable()
class SelectedOption {
  final String name;
  final String value;

  SelectedOption({
    required this.name,
    required this.value,
  });

  factory SelectedOption.fromJson(Map<String, dynamic> json) => _$SelectedOptionFromJson(json);
  Map<String, dynamic> toJson() => _$SelectedOptionToJson(this);
} 