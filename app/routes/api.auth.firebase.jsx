import { json } from "@remix-run/node";

// Shopify Storefront API configuration
const SHOPIFY_STOREFRONT_ACCESS_TOKEN = process.env.PUBLIC_STOREFRONT_ACCESS_TOKEN || '200a3f9f94ebf9dccc9c0b28a982bccc';
const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || 'eyejackapp.myshopify.com';

const STOREFRONT_API_URL = `https://${SHOPIFY_STORE_DOMAIN}/api/2024-01/graphql.json`;

export async function action({ request }) {
  const { firebaseUser, action: authAction } = await request.json();
  
  try {
    console.log('🔥 Firebase Auth Action:', authAction, 'User:', firebaseUser?.uid);
    
    switch (authAction) {
      case 'createOrLoginCustomer':
        return await createOrLoginShopifyCustomer(firebaseUser);
      case 'getCustomerInfo':
        return await getCustomerInfo(firebaseUser.shopifyCustomerToken);
      default:
        return json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('❌ Firebase Auth Error:', error);
    return json({ success: false, error: error.message }, { status: 500 });
  }
}

async function createOrLoginShopifyCustomer(firebaseUser) {
  try {
    // Try to generate access token for existing customer first
    console.log('🔍 Checking for existing customer with email:', firebaseUser.email);
    
    try {
      const accessToken = await generateCustomerAccessToken(
        firebaseUser.email, 
        firebaseUser.uid // Use Firebase UID as password for consistency
      );
      
      if (accessToken) {
        console.log('✅ Found existing Shopify customer, access token generated');
        return json({
          success: true,
          customer: { email: firebaseUser.email }, // Minimal customer data
          customerAccessToken: accessToken,
          isNewCustomer: false
        });
      }
    } catch (tokenError) {
      console.log('🔍 No existing customer found, will create new one');
    }
    
    // Create new customer if access token generation failed
    console.log('🆕 Creating new Shopify customer');
    
    try {
      const newCustomer = await createShopifyCustomer(firebaseUser);
      
      if (newCustomer) {
        // Generate customer access token for new customer
        const accessToken = await generateCustomerAccessToken(
          firebaseUser.email,
          firebaseUser.uid
        );
        
        return json({
          success: true,
          customer: newCustomer,
          customerAccessToken: accessToken,
          isNewCustomer: true
        });
      }
    } catch (createError) {
      // If customer creation fails due to existing email, try to login
      if (createError.message.includes('Email has already been taken')) {
        console.log('✅ Customer already exists, attempting to generate access token');
        
        try {
          const accessToken = await generateCustomerAccessToken(
            firebaseUser.email,
            firebaseUser.uid
          );
          
          return json({
            success: true,
            customer: { email: firebaseUser.email },
            customerAccessToken: accessToken,
            isNewCustomer: false
          });
        } catch (tokenError) {
          console.error('❌ Failed to generate access token for existing customer:', tokenError);
          throw new Error('Customer exists but login failed. Please check your credentials.');
        }
      } else {
        throw createError;
      }
    }
    
    throw new Error('Failed to create or login customer');
    
  } catch (error) {
    console.error('❌ Error in createOrLoginShopifyCustomer:', error);
    return json({ success: false, error: error.message }, { status: 500 });
  }
}

// Note: findCustomerByEmail function removed as Storefront API doesn't support customer queries
// We now use a try-first approach with access token generation

async function createShopifyCustomer(firebaseUser) {
  const mutation = `
    mutation customerCreate($input: CustomerCreateInput!) {
      customerCreate(input: $input) {
        customer {
          id
          email
          firstName
          lastName
          phone
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  
  const customerInput = {
    email: firebaseUser.email,
    firstName: firebaseUser.displayName?.split(' ')[0] || 'User',
    lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
    phone: firebaseUser.phoneNumber || null,
    password: firebaseUser.uid, // Use Firebase UID as password
    acceptsMarketing: true
  };
  
  try {
    const response = await fetch(STOREFRONT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_ACCESS_TOKEN,
      },
      body: JSON.stringify({
        query: mutation,
        variables: { input: customerInput }
      })
    });
    
    const data = await response.json();
    console.log('📊 Create customer response:', data);
    
    if (data.data?.customerCreate?.customer) {
      return data.data.customerCreate.customer;
    }
    
    if (data.data?.customerCreate?.userErrors?.length > 0) {
      throw new Error(`Customer creation failed: ${data.data.customerCreate.userErrors[0].message}`);
    }
    
    throw new Error('Unknown error creating customer');
    
  } catch (error) {
    console.error('❌ Error creating customer:', error);
    throw error;
  }
}

async function generateCustomerAccessToken(email, password) {
  const mutation = `
    mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
      customerAccessTokenCreate(input: $input) {
        customerAccessToken {
          accessToken
          expiresAt
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  
  try {
    console.log('🔑 Attempting to generate access token for:', email);
    
    const response = await fetch(STOREFRONT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_ACCESS_TOKEN,
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          input: {
            email: email,
            password: password
          }
        }
      })
    });
    
    const data = await response.json();
    console.log('🔑 Access token response:', JSON.stringify(data, null, 2));
    
    if (data.data?.customerAccessTokenCreate?.customerAccessToken) {
      console.log('✅ Access token generated successfully');
      return data.data.customerAccessTokenCreate.customerAccessToken;
    }
    
    if (data.data?.customerAccessTokenCreate?.userErrors?.length > 0) {
      const errorMessage = data.data.customerAccessTokenCreate.userErrors[0].message;
      console.log('❌ Token generation error:', errorMessage);
      throw new Error(`Token generation failed: ${errorMessage}`);
    }
    
    console.log('❌ No access token in response');
    throw new Error('Failed to generate access token');
    
  } catch (error) {
    console.error('❌ Error generating access token:', error);
    throw error;
  }
}

async function getCustomerInfo(customerAccessToken) {
  const query = `
    query getCustomer($customerAccessToken: String!) {
      customer(customerAccessToken: $customerAccessToken) {
        id
        email
        firstName
        lastName
        phone
        createdAt
        updatedAt
        addresses(first: 5) {
          edges {
            node {
              id
              address1
              address2
              city
              company
              country
              firstName
              lastName
              phone
              province
              zip
            }
          }
        }
        orders(first: 10) {
          edges {
            node {
              id
              orderNumber
              totalPrice {
                amount
                currencyCode
              }
              processedAt
            }
          }
        }
      }
    }
  `;
  
  try {
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
    
    if (data.data?.customer) {
      return json({
        success: true,
        customer: data.data.customer
      });
    }
    
    return json({ success: false, error: 'Customer not found' }, { status: 404 });
    
  } catch (error) {
    console.error('❌ Error getting customer info:', error);
    return json({ success: false, error: error.message }, { status: 500 });
  }
} 