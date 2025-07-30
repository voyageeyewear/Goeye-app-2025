import { json } from "@remix-run/node";

const SHOPIFY_STOREFRONT_ACCESS_TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const SHOPIFY_STORE_DOMAIN = "eyejackapp.myshopify.com";
const STOREFRONT_API_URL = `https://${SHOPIFY_STORE_DOMAIN}/api/2023-04/graphql.json`;

export async function loader({ request }) {
  const url = new URL(request.url);
  const customerAccessToken = url.searchParams.get('customerAccessToken');
  
  if (!customerAccessToken) {
    return json({ success: false, error: 'Customer access token required' }, { status: 400 });
  }

  try {
    const orders = await fetchCustomerOrders(customerAccessToken);
    return json({ success: true, orders });
  } catch (error) {
    console.error('❌ Error fetching customer orders:', error);
    return json({ success: false, error: error.message }, { status: 500 });
  }
}

async function fetchCustomerOrders(customerAccessToken) {
  const query = `
    query getCustomerOrders($customerAccessToken: String!) {
      customer(customerAccessToken: $customerAccessToken) {
        id
        orders(first: 20, sortKey: PROCESSED_AT, reverse: true) {
          edges {
            node {
              id
              orderNumber
              processedAt
              totalPriceV2 {
                amount
                currencyCode
              }
              fulfillmentStatus
              financialStatus
              lineItems(first: 5) {
                edges {
                  node {
                    title
                    quantity
                    variant {
                      id
                      title
                      image {
                        url
                        altText
                      }
                      priceV2 {
                        amount
                        currencyCode
                      }
                    }
                  }
                }
              }
              shippingAddress {
                firstName
                lastName
                address1
                city
                province
                zip
                country
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch(STOREFRONT_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_ACCESS_TOKEN,
    },
    body: JSON.stringify({
      query,
      variables: { customerAccessToken }
    })
  });

  const data = await response.json();
  
  if (data.errors) {
    throw new Error(`Shopify API error: ${data.errors[0].message}`);
  }

  if (!data.data?.customer) {
    throw new Error('Customer not found or invalid access token');
  }

  return data.data.customer.orders.edges.map(edge => edge.node);
} 