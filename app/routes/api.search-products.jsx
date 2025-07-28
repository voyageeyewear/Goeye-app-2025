import { json } from "@remix-run/node";

const SHOPIFY_STORE_DOMAIN = "eyejackapp.myshopify.com";
const SHOPIFY_STOREFRONT_TOKEN = "200a3f9f94ebf9dccc9c0b28a982bccc";

export async function loader({ request }) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") || "";
  const limit = url.searchParams.get("limit") || "20";

  if (!query || query.trim().length < 2) {
    return json({ 
      success: false, 
      error: "Search query must be at least 2 characters" 
    }, { status: 400 });
  }

  try {
    return await searchProducts(query.trim(), parseInt(limit));
  } catch (error) {
    console.error("Search API Error:", error);
    return json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

async function searchProducts(searchQuery, limit) {
  // Use Shopify's search functionality with filters
  const query = `
    query searchProducts($query: String!, $first: Int!) {
      search(query: $query, first: $first, types: PRODUCT) {
        edges {
          node {
            ... on Product {
              id
              title
              handle
              description
              vendor
              productType
              tags
              images(first: 1) {
                edges {
                  node {
                    url
                    altText
                  }
                }
              }
              variants(first: 1) {
                edges {
                  node {
                    id
                    title
                    price {
                      amount
                      currencyCode
                    }
                    compareAtPrice {
                      amount
                      currencyCode
                    }
                    availableForSale
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const response = await shopifyStorefrontQuery(query, { 
    query: `title:*${searchQuery}* OR vendor:*${searchQuery}* OR tag:*${searchQuery}* OR product_type:*${searchQuery}*`,
    first: limit 
  });
  
  if (response.errors) {
    throw new Error(response.errors[0].message);
  }

  const products = response.data.search.edges.map(edge => {
    const product = edge.node;
    const firstImage = product.images.edges[0]?.node;
    const firstVariant = product.variants.edges[0]?.node;

    return {
      id: product.id,
      title: product.title,
      handle: product.handle,
      description: product.description?.substring(0, 150) + (product.description?.length > 150 ? '...' : ''),
      vendor: product.vendor,
      productType: product.productType,
      tags: product.tags,
      image: firstImage ? {
        url: firstImage.url,
        altText: firstImage.altText
      } : null,
      variant: firstVariant ? {
        id: firstVariant.id,
        title: firstVariant.title,
        price: firstVariant.price,
        compareAtPrice: firstVariant.compareAtPrice,
        availableForSale: firstVariant.availableForSale,
        onSale: firstVariant.compareAtPrice && 
               parseFloat(firstVariant.compareAtPrice.amount) > parseFloat(firstVariant.price.amount)
      } : null
    };
  });

  return json({
    success: true,
    products,
    totalResults: products.length,
    searchQuery,
    message: `Found ${products.length} products matching "${searchQuery}"`
  });
}

async function shopifyStorefrontQuery(query, variables = {}) {
  console.log(`🔍 Searching Shopify: ${SHOPIFY_STORE_DOMAIN} with query: "${variables.query}"`);
  
  try {
    const response = await fetch(`https://${SHOPIFY_STORE_DOMAIN}/api/2023-10/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        query,
        variables
      })
    });

    console.log(`📡 Shopify Search API Response Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Shopify Search API Error: ${response.status} - ${errorText}`);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Shopify Search Success: Found ${data.data?.search?.edges?.length || 0} results`);
    return data;
    
  } catch (error) {
    console.error(`❌ Search Fetch Error:`, error);
    throw error;
  }
} 