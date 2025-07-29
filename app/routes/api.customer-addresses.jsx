import { json } from "@remix-run/node";

const SHOPIFY_STOREFRONT_ACCESS_TOKEN = "200a3f9f94ebf9dccc9c0b28a982bccc";
const SHOPIFY_STORE_DOMAIN = "eyejackapp.myshopify.com";
const STOREFRONT_API_URL = `https://${SHOPIFY_STORE_DOMAIN}/api/2023-04/graphql.json`;

export async function loader({ request }) {
  const url = new URL(request.url);
  const customerAccessToken = url.searchParams.get('customerAccessToken');
  
  if (!customerAccessToken) {
    return json({ success: false, error: 'Customer access token required' }, { status: 400 });
  }

  try {
    const addresses = await fetchCustomerAddresses(customerAccessToken);
    return json({ success: true, addresses });
  } catch (error) {
    console.error('❌ Error fetching customer addresses:', error);
    return json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function action({ request }) {
  const formData = await request.formData();
  const action = formData.get('action');
  const customerAccessToken = formData.get('customerAccessToken');
  
  if (!customerAccessToken) {
    return json({ success: false, error: 'Customer access token required' }, { status: 400 });
  }

  try {
    switch (action) {
      case 'create':
        const newAddress = {
          address1: formData.get('address1'),
          address2: formData.get('address2'),
          city: formData.get('city'),
          company: formData.get('company'),
          country: formData.get('country'),
          firstName: formData.get('firstName'),
          lastName: formData.get('lastName'),
          phone: formData.get('phone'),
          province: formData.get('province'),
          zip: formData.get('zip')
        };
        const createdAddress = await createCustomerAddress(customerAccessToken, newAddress);
        return json({ success: true, address: createdAddress });
        
      case 'update':
        const addressId = formData.get('addressId');
        const updatedAddress = {
          address1: formData.get('address1'),
          address2: formData.get('address2'),
          city: formData.get('city'),
          company: formData.get('company'),
          country: formData.get('country'),
          firstName: formData.get('firstName'),
          lastName: formData.get('lastName'),
          phone: formData.get('phone'),
          province: formData.get('province'),
          zip: formData.get('zip')
        };
        const updated = await updateCustomerAddress(customerAccessToken, addressId, updatedAddress);
        return json({ success: true, address: updated });
        
      case 'delete':
        const deleteAddressId = formData.get('addressId');
        await deleteCustomerAddress(customerAccessToken, deleteAddressId);
        return json({ success: true });
        
      case 'setDefault':
        const defaultAddressId = formData.get('addressId');
        await setDefaultAddress(customerAccessToken, defaultAddressId);
        return json({ success: true });
        
      default:
        return json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('❌ Error with customer address action:', error);
    return json({ success: false, error: error.message }, { status: 500 });
  }
}

async function fetchCustomerAddresses(customerAccessToken) {
  const query = `
    query getCustomerAddresses($customerAccessToken: String!) {
      customer(customerAccessToken: $customerAccessToken) {
        id
        defaultAddress {
          id
        }
        addresses(first: 20) {
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

  const customer = data.data.customer;
  const defaultAddressId = customer.defaultAddress?.id;
  
  return customer.addresses.edges.map(edge => ({
    ...edge.node,
    isDefault: edge.node.id === defaultAddressId
  }));
}

async function createCustomerAddress(customerAccessToken, addressInput) {
  const mutation = `
    mutation customerAddressCreate($customerAccessToken: String!, $address: MailingAddressInput!) {
      customerAddressCreate(customerAccessToken: $customerAccessToken, address: $address) {
        customerAddress {
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
        userErrors {
          field
          message
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
      query: mutation,
      variables: { customerAccessToken, address: addressInput }
    })
  });

  const data = await response.json();
  
  if (data.errors) {
    throw new Error(`Shopify API error: ${data.errors[0].message}`);
  }

  if (data.data.customerAddressCreate.userErrors.length > 0) {
    throw new Error(data.data.customerAddressCreate.userErrors[0].message);
  }

  return data.data.customerAddressCreate.customerAddress;
}

async function updateCustomerAddress(customerAccessToken, addressId, addressInput) {
  const mutation = `
    mutation customerAddressUpdate($customerAccessToken: String!, $id: ID!, $address: MailingAddressInput!) {
      customerAddressUpdate(customerAccessToken: $customerAccessToken, id: $id, address: $address) {
        customerAddress {
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
        userErrors {
          field
          message
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
      query: mutation,
      variables: { customerAccessToken, id: addressId, address: addressInput }
    })
  });

  const data = await response.json();
  
  if (data.errors) {
    throw new Error(`Shopify API error: ${data.errors[0].message}`);
  }

  if (data.data.customerAddressUpdate.userErrors.length > 0) {
    throw new Error(data.data.customerAddressUpdate.userErrors[0].message);
  }

  return data.data.customerAddressUpdate.customerAddress;
}

async function deleteCustomerAddress(customerAccessToken, addressId) {
  const mutation = `
    mutation customerAddressDelete($customerAccessToken: String!, $id: ID!) {
      customerAddressDelete(customerAccessToken: $customerAccessToken, id: $id) {
        deletedCustomerAddressId
        userErrors {
          field
          message
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
      query: mutation,
      variables: { customerAccessToken, id: addressId }
    })
  });

  const data = await response.json();
  
  if (data.errors) {
    throw new Error(`Shopify API error: ${data.errors[0].message}`);
  }

  if (data.data.customerAddressDelete.userErrors.length > 0) {
    throw new Error(data.data.customerAddressDelete.userErrors[0].message);
  }

  return data.data.customerAddressDelete.deletedCustomerAddressId;
}

async function setDefaultAddress(customerAccessToken, addressId) {
  const mutation = `
    mutation customerDefaultAddressUpdate($customerAccessToken: String!, $addressId: ID!) {
      customerDefaultAddressUpdate(customerAccessToken: $customerAccessToken, addressId: $addressId) {
        customer {
          id
        }
        userErrors {
          field
          message
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
      query: mutation,
      variables: { customerAccessToken, addressId }
    })
  });

  const data = await response.json();
  
  if (data.errors) {
    throw new Error(`Shopify API error: ${data.errors[0].message}`);
  }

  if (data.data.customerDefaultAddressUpdate.userErrors.length > 0) {
    throw new Error(data.data.customerDefaultAddressUpdate.userErrors[0].message);
  }

  return true;
} 