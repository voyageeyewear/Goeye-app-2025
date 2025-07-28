import 'package:json_annotation/json_annotation.dart';
import 'product.dart';

part 'collection.g.dart';

@JsonSerializable()
class Collection {
  final String id;
  final String title;
  final String description;
  final String handle;
  final ProductImage? image;
  final List<Product> products;

  Collection({
    required this.id,
    required this.title,
    required this.description,
    required this.handle,
    this.image,
    required this.products,
  });

  factory Collection.fromJson(Map<String, dynamic> json) {
    return Collection(
      id: json['id'],
      title: json['title'],
      description: json['description'] ?? '',
      handle: json['handle'],
      image: json['image'] != null ? ProductImage.fromJson(json['image']) : null,
      products: (json['products']['edges'] as List)
          .map((edge) => Product.fromJson(edge['node']))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() => _$CollectionToJson(this);

  // Helper getters
  String get imageUrl => image?.url ?? '';
  int get productCount => products.length;
  
  List<Product> get availableProducts => 
      products.where((product) => product.availableForSale).toList();
}

// Simple collection model for category display
@JsonSerializable()
class SimpleCollection {
  final String id;
  final String title;
  final String handle;
  final String? imageUrl;
  final int productCount;

  SimpleCollection({
    required this.id,
    required this.title,
    required this.handle,
    this.imageUrl,
    required this.productCount,
  });

  factory SimpleCollection.fromJson(Map<String, dynamic> json) => _$SimpleCollectionFromJson(json);
  Map<String, dynamic> toJson() => _$SimpleCollectionToJson(this);

  factory SimpleCollection.fromCollection(Collection collection) {
    return SimpleCollection(
      id: collection.id,
      title: collection.title,
      handle: collection.handle,
      imageUrl: collection.imageUrl,
      productCount: collection.productCount,
    );
  }
} 