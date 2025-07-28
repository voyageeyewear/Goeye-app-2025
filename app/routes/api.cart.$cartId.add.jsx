import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export async function action({ request, params }) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const { admin } = await authenticate.private.app(request);
  const cartId = params.cartId;
  const body = await request.json();
  const { variantId, quantity } = body;

  if (!variantId || !quantity) {
    return json({ 
      error: "variantId and quantity are required" 
    }, { status: 400 });
  }

  try {
    const response = await admin.graphql(`
      mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
        cartLinesAdd(cartId: $cartId, lines: $lines) {
          cart {
            id
            createdAt
            updatedAt
            lines(first: 250) {
              edges {
                node {
                  id
                  quantity
                  merchandise {
                    ... on ProductVariant {
                      id
                      title
                      price {
                        amount
                        currencyCode
                      }
                      product {
                        id
                        title
                        handle
                        images(first: 1) {
                          edges {
                            node {
                              url
                              altText
                            }
                          }
                        }
                      }
                    }
                  }
                  estimatedCost {
                    totalAmount {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
            estimatedCost {
              totalAmount {
                amount
                currencyCode
              }
              subtotalAmount {
                amount
                currencyCode
              }
              totalTaxAmount {
                amount
                currencyCode
              }
            }
            checkoutUrl
          }
          userErrors {
            field
            message
          }
        }
      }
    `, {
      variables: {
        cartId: `gid://shopify/Cart/${cartId}`,
        lines: [{
          merchandiseId: variantId,
          quantity: parseInt(quantity)
        }]
      }
    });

    const result = await response.json();
    
    if (result.data.cartLinesAdd.userErrors.length > 0) {
      return json({ 
        error: result.data.cartLinesAdd.userErrors[0].message 
      }, { status: 400 });
    }

    return json(formatCart(result.data.cartLinesAdd.cart));
  } catch (error) {
    console.error("Error adding to cart:", error);
    return json({ error: "Failed to add to cart" }, { status: 500 });
  }
}

function formatCart(cart) {
  const lines = cart.lines.edges.map(edge => ({
    id: edge.node.id,
    quantity: edge.node.quantity,
    merchandise: {
      id: edge.node.merchandise.id,
      title: edge.node.merchandise.title,
      price: edge.node.merchandise.price,
      product: edge.node.merchandise.product
    },
    totalAmount: edge.node.estimatedCost.totalAmount
  }));

  const taxes = cart.estimatedCost.totalTaxAmount ? [cart.estimatedCost.totalTaxAmount] : [];

  return {
    id: cart.id,
    lines,
    totalAmount: cart.estimatedCost.totalAmount,
    subtotalAmount: cart.estimatedCost.subtotalAmount,
    taxes,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
    checkoutUrl: cart.checkoutUrl
  };
} 