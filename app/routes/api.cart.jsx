import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export async function action({ request }) {
  const { admin } = await authenticate.private.app(request);
  const method = request.method;

  switch (method) {
    case "POST":
      return await createCart(admin);
    default:
      return json({ error: "Method not allowed" }, { status: 405 });
  }
}

export async function loader({ request, params }) {
  const { admin } = await authenticate.private.app(request);
  const cartId = params.cartId;

  if (cartId) {
    return await getCart(admin, cartId);
  }

  return json({ error: "Cart ID required" }, { status: 400 });
}

async function createCart(admin) {
  try {
    const response = await admin.graphql(`
      mutation cartCreate($input: CartInput!) {
        cartCreate(input: $input) {
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
        input: {}
      }
    });

    const result = await response.json();
    
    if (result.data.cartCreate.userErrors.length > 0) {
      return json({ 
        error: result.data.cartCreate.userErrors[0].message 
      }, { status: 400 });
    }

    return json(formatCart(result.data.cartCreate.cart));
  } catch (error) {
    console.error("Error creating cart:", error);
    return json({ error: "Failed to create cart" }, { status: 500 });
  }
}

async function getCart(admin, cartId) {
  try {
    const response = await admin.graphql(`
      query getCart($id: ID!) {
        cart(id: $id) {
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
      }
    `, {
      variables: {
        id: cartId
      }
    });

    const result = await response.json();
    
    if (!result.data.cart) {
      return json({ error: "Cart not found" }, { status: 404 });
    }

    return json(formatCart(result.data.cart));
  } catch (error) {
    console.error("Error fetching cart:", error);
    return json({ error: "Failed to fetch cart" }, { status: 500 });
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