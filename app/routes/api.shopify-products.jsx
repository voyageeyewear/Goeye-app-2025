import { json } from "@remix-run/node";

const SHOPIFY_STORE_DOMAIN = "eyejackapp.myshopify.com";
const SHOPIFY_STOREFRONT_TOKEN = "200a3f9f94ebf9dccc9c0b28a982bccc";

export async function loader({ request }) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type") || "products";
  const limit = url.searchParams.get("limit") || "10";

  try {
    if (type === "products") {
      return await fetchProducts(limit);
    } else if (type === "collections") {
      return await fetchCollections(limit);
    }
    
    return json({ error: "Invalid type parameter" }, { status: 400 });
  } catch (error) {
    console.error("Shopify API Error:", error);
    return json({ error: error.message }, { status: 500 });
  }
}

async function fetchProducts(limit) {
  const query = `
    query getProducts($first: Int!) {
      products(first: $first) {
        edges {
          node {
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
  `;

  const response = await shopifyStorefrontQuery(query, { first: parseInt(limit) });
  
  if (response.errors) {
    throw new Error(response.errors[0].message);
  }

  const products = response.data.products.edges.map(({ node }) => {
    const variant = node.variants.edges[0]?.node;
    const image = node.images.edges[0]?.node;
    
    return {
      id: node.id,
      title: node.title,
      handle: node.handle,
      description: node.description,
      vendor: node.vendor,
      productType: node.productType,
      tags: node.tags,
      image: image ? {
        url: image.url,
        altText: image.altText
      } : null,
      variant: variant ? {
        id: variant.id,
        title: variant.title,
        price: variant.price,
        compareAtPrice: variant.compareAtPrice,
        availableForSale: variant.availableForSale,
        onSale: variant.compareAtPrice && 
                parseFloat(variant.compareAtPrice.amount) > parseFloat(variant.price.amount)
      } : null
    };
  });

  return json({
    success: true,
    products,
    count: products.length
  });
}

async function fetchCollections(limit) {
  const query = `
    query getCollections($first: Int!) {
      collections(first: $first) {
        edges {
          node {
            id
            title
            handle
            description
            image {
              url
              altText
            }
            products(first: 1) {
              edges {
                node {
                  id
                }
              }
            }
          }
        }
      }
    }
  `;

  const response = await shopifyStorefrontQuery(query, { first: parseInt(limit) });
  
  if (response.errors) {
    throw new Error(response.errors[0].message);
  }

  const collections = response.data.collections.edges.map(({ node }) => ({
    id: node.id,
    title: node.title,
    handle: node.handle,
    description: node.description,
    image: node.image ? {
      url: node.image.url,
      altText: node.image.altText
    } : null,
    productCount: node.products.edges.length
  }));

  return json({
    success: true,
    collections,
    count: collections.length
  });
}

async function shopifyStorefrontQuery(query, variables = {}) {
  console.log(`🔍 Querying Shopify: ${SHOPIFY_STORE_DOMAIN}`);
  
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

    console.log(`📡 Shopify API Response Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Shopify API Error: ${response.status} - ${errorText}`);
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ Shopify API Success: ${JSON.stringify(data).substring(0, 200)}...`);
    return data;
    
  } catch (error) {
    console.error(`❌ Fetch Error:`, error);
    throw error;
  }
} 