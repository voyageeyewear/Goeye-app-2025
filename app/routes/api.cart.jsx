import { json } from "@remix-run/node";

const SHOPIFY_STOREFRONT_ACCESS_TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || 'eyejackapp.myshopify.com';
const SHOPIFY_ADMIN_ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

// Loader for getting draft order details
export async function loader({ request }) {
    const url = new URL(request.url);
    const draftOrderId = url.searchParams.get('draftOrderId');
    const customerAccessToken = url.searchParams.get('customerAccessToken');

    if (!draftOrderId) {
        return json({ success: false, error: 'Draft order ID is required' }, { status: 400 });
    }

    try {
        const draftOrder = await getDraftOrder(draftOrderId);
        
        return json({ 
            success: true, 
            draftOrder: draftOrder
        });
    } catch (error) {
        console.error('❌ Error fetching draft order:', error);
        return json({ 
            success: false, 
            error: error.message || 'Failed to fetch draft order'
        }, { status: 500 });
    }
}

// Action for creating/updating draft orders
export async function action({ request }) {
    const formData = await request.formData();
    const action = formData.get('action');
    const customerAccessToken = formData.get('customerAccessToken');

    try {
        switch (action) {
            case 'create':
                return await createDraftOrder(formData);
            case 'update':
                return await updateDraftOrder(formData);
            case 'complete':
                return await completeDraftOrder(formData);
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

// Create a new draft order
async function createDraftOrder(formData) {
    const productId = formData.get('productId');
    const variantId = formData.get('variantId');
    const quantity = parseInt(formData.get('quantity') || '1');
    const customerEmail = formData.get('customerEmail');
    const customerAccessToken = formData.get('customerAccessToken');

    if (!productId || !variantId) {
        throw new Error('Product ID and Variant ID are required');
    }

    // Get customer info if logged in
    let customerId = null;
    if (customerAccessToken) {
        try {
            const customerInfo = await getCustomerInfo(customerAccessToken);
            customerId = customerInfo.id;
        } catch (error) {
            console.warn('Could not get customer info:', error.message);
        }
    }

    const draftOrderInput = {
        lineItems: [
            {
                variantId: variantId,
                quantity: quantity
            }
        ],
        useCustomerDefaultAddress: customerId ? true : false
    };

    if (customerId) {
        draftOrderInput.customerId = customerId;
    } else if (customerEmail) {
        draftOrderInput.email = customerEmail;
    } else {
        // For guest users, use a default email that can be updated later
        draftOrderInput.email = 'guest@eyejackapp.com';
    }

    const mutation = `
        mutation draftOrderCreate($input: DraftOrderInput!) {
            draftOrderCreate(input: $input) {
                draftOrder {
                    id
                    name
                    email
                    phone
                    totalPrice
                    subtotalPrice
                    totalTax
                    currencyCode
                    createdAt
                    updatedAt
                    status
                    lineItems(first: 250) {
                        edges {
                            node {
                                id
                                title
                                quantity
                                originalUnitPrice
                                discountedUnitPrice
                                totalDiscount
                                variant {
                                    id
                                    title
                                    price
                                    image {
                                        url
                                        altText
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
                        }
                    }
                    customer {
                        id
                        email
                        firstName
                        lastName
                    }
                    shippingAddress {
                        firstName
                        lastName
                        address1
                        address2
                        city
                        province
                        country
                        zip
                    }
                }
                userErrors {
                    field
                    message
                }
            }
        }
    `;

    const response = await fetch(`https://${SHOPIFY_STORE_DOMAIN}/admin/api/2023-10/graphql.json`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': SHOPIFY_ADMIN_ACCESS_TOKEN,
        },
        body: JSON.stringify({
            query: mutation,
            variables: { input: draftOrderInput }
        })
    });

    const data = await response.json();
    
    console.log('🔍 Draft order input:', JSON.stringify(draftOrderInput, null, 2));
    console.log('🔍 Shopify create draft order response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
        console.error('❌ Shopify API HTTP error:', response.status, response.statusText);
        console.error('❌ Response data:', data);
        throw new Error(`Shopify API error: ${data.errors?.[0]?.message || 'Unknown error'}`);
    }

    if (data.data?.draftOrderCreate?.userErrors?.length > 0) {
        console.error('❌ Draft order create user errors:', data.data.draftOrderCreate.userErrors);
        throw new Error(data.data.draftOrderCreate.userErrors[0].message);
    }

    const draftOrder = data.data?.draftOrderCreate?.draftOrder;
    if (!draftOrder) {
        console.error('❌ No draft order in response');
        console.error('❌ Full response:', data);
        throw new Error('Failed to create draft order');
    }

    console.log('✅ Draft order created:', draftOrder.id);

    return json({ 
        success: true, 
        draftOrder: draftOrder,
        message: 'Product added to cart successfully'
    });
}

// Update existing draft order (add/remove items, update quantities)
async function updateDraftOrder(formData) {
    const draftOrderId = formData.get('draftOrderId');
    const productId = formData.get('productId');
    const variantId = formData.get('variantId');
    const quantity = parseInt(formData.get('quantity') || '1');
    const action = formData.get('updateAction'); // 'add', 'remove', 'update_quantity'

    if (!draftOrderId) {
        throw new Error('Draft Order ID is required');
    }

    // First, get the current draft order
    const currentDraftOrder = await getDraftOrder(draftOrderId);
    
    // Prepare line items based on the action
    let lineItems = currentDraftOrder.lineItems.edges.map(edge => ({
        variantId: edge.node.variant.id,
        quantity: edge.node.quantity
    }));

    switch (action) {
        case 'add':
            // Find if product already exists
            const existingIndex = lineItems.findIndex(item => item.variantId === variantId);
            if (existingIndex >= 0) {
                lineItems[existingIndex].quantity += quantity;
            } else {
                lineItems.push({ variantId, quantity });
            }
            break;

        case 'remove':
            lineItems = lineItems.filter(item => item.variantId !== variantId);
            break;

        case 'update_quantity':
            const updateIndex = lineItems.findIndex(item => item.variantId === variantId);
            if (updateIndex >= 0) {
                if (quantity > 0) {
                    lineItems[updateIndex].quantity = quantity;
                } else {
                    lineItems.splice(updateIndex, 1);
                }
            }
            break;

        default:
            throw new Error('Invalid update action');
    }

    // Check if cart will be empty after the operation
    if (lineItems.length === 0) {
        // Delete the entire draft order instead of updating with 0 items
        await deleteDraftOrder(draftOrderId);
        
        return json({ 
            success: true, 
            draftOrder: null,
            message: 'Cart cleared successfully'
        });
    }

    const mutation = `
        mutation draftOrderUpdate($id: ID!, $input: DraftOrderInput!) {
            draftOrderUpdate(id: $id, input: $input) {
                draftOrder {
                    id
                    name
                    email
                    phone
                    totalPrice
                    subtotalPrice
                    totalTax
                    currencyCode
            createdAt
            updatedAt
                    status
                    lineItems(first: 250) {
              edges {
                node {
                  id
                                title
                  quantity
                                originalUnitPrice
                                discountedUnitPrice
                                totalDiscount
                                variant {
                      id
                      title
                                    price
                                    image {
                                        url
                                        altText
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
                        }
                    }
                    customer {
                        id
                        email
                        firstName
                        lastName
                    }
                }
                userErrors {
                    field
                    message
                }
            }
        }
    `;

    const response = await fetch(`https://${SHOPIFY_STORE_DOMAIN}/admin/api/2023-10/graphql.json`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': SHOPIFY_ADMIN_ACCESS_TOKEN,
        },
        body: JSON.stringify({
            query: mutation,
            variables: { 
                id: draftOrderId,
                input: { lineItems }
            }
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(`Shopify API error: ${data.errors?.[0]?.message || 'Unknown error'}`);
    }

    if (data.data?.draftOrderUpdate?.userErrors?.length > 0) {
        throw new Error(data.data.draftOrderUpdate.userErrors[0].message);
    }

    const draftOrder = data.data?.draftOrderUpdate?.draftOrder;
    if (!draftOrder) {
        throw new Error('Failed to update draft order');
    }

    console.log('✅ Draft order updated:', draftOrder.id);

    return json({ 
        success: true, 
        draftOrder: draftOrder,
        message: 'Cart updated successfully'
    });
}

// Complete draft order (convert to order)
async function completeDraftOrder(formData) {
    const draftOrderId = formData.get('draftOrderId');
    const paymentPending = formData.get('paymentPending') === 'true';

    if (!draftOrderId) {
        throw new Error('Draft Order ID is required');
    }

    console.log('🔄 Attempting to complete draft order:', draftOrderId);
    
    // First, let's get the current draft order to see its state
    try {
        const currentDraftOrder = await getDraftOrder(draftOrderId);
        console.log('📋 Current draft order state:', JSON.stringify(currentDraftOrder, null, 2));
        
        // Check if draft order already has required fields
        if (!currentDraftOrder.email) {
            console.warn('⚠️ Draft order missing email, updating...');
            // Try to update with a default email first
            await updateDraftOrderWithEmail(draftOrderId, 'guest@eyejackapp.com');
        }
    } catch (error) {
        console.error('❌ Error getting draft order before completion:', error.message);
        // Continue with completion attempt anyway
    }

    const mutation = `
        mutation draftOrderComplete($id: ID!, $paymentPending: Boolean) {
            draftOrderComplete(id: $id, paymentPending: $paymentPending) {
                draftOrder {
                    id
                    status
                    order {
                        id
                        name
                        email
                        totalPriceSet {
                            shopMoney {
                amount
                currencyCode
              }
            }
                        processedAt
                        createdAt
                        updatedAt
                    }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await fetch(`https://${SHOPIFY_STORE_DOMAIN}/admin/api/2023-10/graphql.json`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': SHOPIFY_ADMIN_ACCESS_TOKEN,
        },
        body: JSON.stringify({
            query: mutation,
      variables: {
                id: draftOrderId,
                paymentPending: paymentPending
            }
        })
    });

    const data = await response.json();
    
    console.log('🔍 Shopify complete draft order response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
        console.error('❌ Shopify API HTTP error:', response.status, response.statusText);
        console.error('❌ Response data:', data);
        throw new Error(`Shopify API error: ${data.errors?.[0]?.message || 'Unknown error'}`);
    }

    if (data.data?.draftOrderComplete?.userErrors?.length > 0) {
        console.error('❌ Shopify user errors:', data.data.draftOrderComplete.userErrors);
        throw new Error(data.data.draftOrderComplete.userErrors[0].message);
    }

    const result = data.data?.draftOrderComplete;
    if (!result) {
        console.error('❌ No result from draftOrderComplete');
        console.error('❌ Full response:', data);
        throw new Error('Failed to complete draft order');
    }

    console.log('✅ Draft order completed:', result.draftOrder.id);
    console.log('✅ Order created:', result.draftOrder.order?.id);

    // Extract order info for better frontend handling
    const order = result.draftOrder.order;
    const orderInfo = {
        ...order,
        // Add a backward-compatible totalPrice field
        totalPrice: order?.totalPriceSet?.shopMoney?.amount || '0.00',
        currencyCode: order?.totalPriceSet?.shopMoney?.currencyCode || 'INR'
    };

      return json({ 
        success: true, 
        draftOrder: result.draftOrder,
        order: orderInfo,
        message: 'Order placed successfully'
    });
}

// Helper function to update draft order with email
async function updateDraftOrderWithEmail(draftOrderId, email) {
    const mutation = `
        mutation draftOrderUpdate($id: ID!, $input: DraftOrderInput!) {
            draftOrderUpdate(id: $id, input: $input) {
                draftOrder {
                    id
                    email
                }
                userErrors {
                    field
                    message
                }
            }
        }
    `;

    const response = await fetch(`https://${SHOPIFY_STORE_DOMAIN}/admin/api/2023-10/graphql.json`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': SHOPIFY_ADMIN_ACCESS_TOKEN,
        },
        body: JSON.stringify({
            query: mutation,
            variables: { 
                id: draftOrderId,
                input: { email: email }
            }
        })
    });

    const data = await response.json();
    
    if (!response.ok || data.data?.draftOrderUpdate?.userErrors?.length > 0) {
        const error = data.data?.draftOrderUpdate?.userErrors?.[0]?.message || 'Failed to update email';
        console.warn('⚠️ Could not update draft order email:', error);
        return false;
    }
    
    console.log('✅ Updated draft order email:', email);
    return true;
}

// Get draft order details
async function getDraftOrder(draftOrderId) {
    const query = `
        query getDraftOrder($id: ID!) {
            draftOrder(id: $id) {
                id
                name
                email
                phone
                totalPrice
                subtotalPrice
                totalTax
                currencyCode
          createdAt
          updatedAt
                status
                lineItems(first: 250) {
            edges {
              node {
                id
                            title
                quantity
                            originalUnitPrice
                            discountedUnitPrice
                            totalDiscount
                            variant {
                    id
                    title
                                price
                                image {
                                    url
                                    altText
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
                    }
                }
                customer {
                    id
                    email
                    firstName
                    lastName
                }
                shippingAddress {
                    firstName
                    lastName
                    address1
                    address2
                    city
                    province
                    country
                    zip
                }
            }
        }
    `;

    const response = await fetch(`https://${SHOPIFY_STORE_DOMAIN}/admin/api/2023-10/graphql.json`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': SHOPIFY_ADMIN_ACCESS_TOKEN,
        },
        body: JSON.stringify({
            query: query,
            variables: { id: draftOrderId }
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(`Shopify API error: ${data.errors?.[0]?.message || 'Unknown error'}`);
    }

    const draftOrder = data.data?.draftOrder;
    if (!draftOrder) {
        throw new Error('Draft order not found');
    }

    return draftOrder;
}

// Delete draft order
async function deleteDraftOrder(draftOrderId) {
    const mutation = `
        mutation draftOrderDelete($input: DraftOrderDeleteInput!) {
            draftOrderDelete(input: $input) {
                deletedId
                userErrors {
                    field
                    message
                }
            }
        }
    `;

    const response = await fetch(`https://${SHOPIFY_STORE_DOMAIN}/admin/api/2023-10/graphql.json`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': SHOPIFY_ADMIN_ACCESS_TOKEN,
        },
        body: JSON.stringify({
            query: mutation,
            variables: { 
                input: { id: draftOrderId }
            }
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(`Shopify API error: ${data.errors?.[0]?.message || 'Unknown error'}`);
    }

    if (data.data?.draftOrderDelete?.userErrors?.length > 0) {
        throw new Error(data.data.draftOrderDelete.userErrors[0].message);
    }

    console.log('✅ Draft order deleted:', draftOrderId);
    return true;
}

// Get customer info using Storefront API
async function getCustomerInfo(customerAccessToken) {
    const query = `
        query getCustomer($customerAccessToken: String!) {
            customer(customerAccessToken: $customerAccessToken) {
                id
                email
                firstName
                lastName
                phone
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
            variables: { customerAccessToken }
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(`Storefront API error: ${data.errors?.[0]?.message || 'Unknown error'}`);
    }

    const customer = data.data?.customer;
    if (!customer) {
        throw new Error('Customer not found');
    }

    return customer;
} 