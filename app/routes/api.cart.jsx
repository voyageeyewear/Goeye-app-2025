import { json } from "@remix-run/node";

const SHOPIFY_STOREFRONT_ACCESS_TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || 'eyejackapp.myshopify.com';

// Loader for getting cart details
export async function loader({ request }) {
    const url = new URL(request.url);
    const cartId = url.searchParams.get('cartId');

    if (!cartId) {
        return json({ success: false, error: 'Cart ID is required' }, { status: 400 });
    }

    try {
        const cart = await getCart(cartId);
        
        return json({ 
            success: true, 
            cart: cart
        });
    } catch (error) {
        console.error('❌ Error fetching cart:', error);
        return json({ 
            success: false, 
            error: error.message || 'Failed to fetch cart'
        }, { status: 500 });
    }
}

// Action for creating/updating carts
export async function action({ request }) {
    const formData = await request.formData();
    const action = formData.get('action');

    try {
        switch (action) {
            case 'create':
                return await createCart(formData);
            case 'update':
                return await updateCart(formData);
            default:
                return json({ success: false, error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('❌ Error in cart action:', error);
        return json({ 
            success: false, 
            error: error.message || 'Cart operation failed'
        }, { status: 500 });
    }
}

// Create a new cart
async function createCart(formData) {
    const variantId = formData.get('variantId');
    const quantity = parseInt(formData.get('quantity') || '1');

    if (!variantId) {
        throw new Error('Variant ID is required');
    }

    const mutation = `
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
    `;

    const response = await fetch(`https://${SHOPIFY_STORE_DOMAIN}/api/2023-10/graphql.json`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_ACCESS_TOKEN,
        },
        body: JSON.stringify({
            query: mutation,
            variables: { 
                input: {
                    lines: [{
                        merchandiseId: variantId,
                        quantity: quantity
                    }]
                }
            }
        })
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('❌ Shopify API HTTP error:', response.status, response.statusText);
        console.error('❌ Response data:', data);
        throw new Error(`Shopify API error: ${data.errors?.[0]?.message || 'Unknown error'}`);
    }

    if (data.data?.cartCreate?.userErrors?.length > 0) {
        console.error('❌ Cart create user errors:', data.data.cartCreate.userErrors);
        throw new Error(data.data.cartCreate.userErrors[0].message);
    }

    const cart = data.data?.cartCreate?.cart;
    if (!cart) {
        console.error('❌ No cart in response');
        console.error('❌ Full response:', data);
        throw new Error('Failed to create cart');
    }

    console.log('✅ Cart created:', cart.id);

    return json({ 
        success: true, 
        cart: formatCart(cart),
        message: 'Cart created successfully'
    });
}

// Update existing cart (add/remove items, update quantities)
async function updateCart(formData) {
    const cartId = formData.get('cartId') || formData.get('draftOrderId');
    const variantId = formData.get('variantId');
    const quantity = parseInt(formData.get('quantity') || '1');
    const updateAction = formData.get('updateAction');

    if (!cartId) {
        throw new Error('Cart ID is required');
    }

    let mutation;
    let variables;

    if (updateAction === 'add') {
        mutation = `
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
        `;
        variables = {
            cartId: cartId,
            lines: [{
                merchandiseId: variantId,
                quantity: quantity
            }]
        };
    } else if (updateAction === 'remove') {
        // First get current cart to find line IDs
        const currentCart = await getCart(cartId);
        const lineToRemove = currentCart.lines.find(line => 
            line.merchandise.id === variantId
        );
        
        if (!lineToRemove) {
            throw new Error('Item not found in cart');
        }

        mutation = `
            mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
                cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
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
        `;
        variables = {
            cartId: cartId,
            lineIds: [lineToRemove.id]
        };
    } else if (updateAction === 'update_quantity') {
        // First get current cart to find line IDs
        const currentCart = await getCart(cartId);
        const lineToUpdate = currentCart.lines.find(line => 
            line.merchandise.id === variantId
        );
        
        if (!lineToUpdate) {
            throw new Error('Item not found in cart');
        }

        mutation = `
            mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
                cartLinesUpdate(cartId: $cartId, lines: $lines) {
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
        `;
        variables = {
            cartId: cartId,
            lines: [{
                id: lineToUpdate.id,
                quantity: quantity
            }]
        };
    } else {
        throw new Error('Invalid update action');
    }

    const response = await fetch(`https://${SHOPIFY_STORE_DOMAIN}/api/2023-10/graphql.json`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_ACCESS_TOKEN,
        },
        body: JSON.stringify({
            query: mutation,
            variables: variables
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(`Shopify API error: ${data.errors?.[0]?.message || 'Unknown error'}`);
    }

    const operationData = data.data?.cartLinesAdd || data.data?.cartLinesRemove || data.data?.cartLinesUpdate;
    if (operationData?.userErrors?.length > 0) {
        throw new Error(operationData.userErrors[0].message);
    }

    const cart = operationData?.cart;
    if (!cart) {
        throw new Error('Failed to update cart');
    }

    console.log('✅ Cart updated:', cart.id);

    return json({ 
        success: true, 
        cart: formatCart(cart),
        message: 'Cart updated successfully'
    });
}

// Get cart details
async function getCart(cartId) {
    const query = `
        query getCart($cartId: ID!) {
            cart(id: $cartId) {
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
    `;

    const response = await fetch(`https://${SHOPIFY_STORE_DOMAIN}/api/2023-10/graphql.json`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_ACCESS_TOKEN,
        },
        body: JSON.stringify({
            query: query,
            variables: { cartId: cartId }
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(`Shopify API error: ${data.errors?.[0]?.message || 'Unknown error'}`);
    }

    const cart = data.data?.cart;
    if (!cart) {
        throw new Error('Cart not found');
    }

    return formatCart(cart);
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