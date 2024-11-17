import * as bodyParser from "koa-bodyparser";
import * as axios from "axios";
import { InventoryItemService } from "./InventoryItemService";


// TODO 1. poduct counter (loading progress)
// TODO 2. each store is db, loading products of current tab (shop)
export const InventoryItemController = (router: any) => {
  router.post("/inventory-item-list/", bodyParser(), getAllInventoryItems);
  //router.post("/items-quantity-pre-location/", bodyParser(), getAllInventoryItemsQuantitiesPreLocation);
  router.post("/add-new-product/", bodyParser(), addNewProduct);
  router.post("/adjust-inventory-quantities/", bodyParser(), adjustInventoryQuantity);
  router.post("/delete-product/", bodyParser(), deleteProduct)
  router.post("/change-location/", bodyParser(), moveInventoryQuantities)
  router.post("/get-locations/", bodyParser(), getAllLocations)
  router.post("/get-all-inventory-items-by-location/", bodyParser(), getAllItemsByLocation)
  router.post("/items-count-pre-location/", bodyParser(), inventoryItemsCountPreLocation)
  router.post("/product-by-location/", bodyParser(), getProductsByLocation)
  router.post("/category-list/",bodyParser(),getCategoryList)
};


//! GET - inventory item level
export async function getAllInventoryItems(ctx: any): Promise<any> {
  const { shopName, accessToken } = ctx.request.body; // Include quantity if needed
  const requestUrl = `https://${shopName}/admin/api/2023-01/graphql.json`;

  const headers = {
    "Content-Type": "application/json",
    "X-Shopify-Access-Token": accessToken,
  };

  try {
    const result = await axios.post(
      requestUrl,
      {
        query: `query {
          inventoryItems(first: 10) {
            edges {
              node {
                id
                tracked
                sku
              }
            }
          }
        }`,
      },
      { headers }
    );

    console.log(result.data);
    ctx.body = result.data;
  } catch (error) {
    console.error("Error fetching inventory items:", error);
    ctx.status = error.response?.status || 500;
    ctx.body = error.response?.data || {
      error: "An error occurred while fetching inventory items.",
    };
  }
}

//* example of input product
// {
//     title: "Eco-Friendly Yoga Mat",
//     handle: "eco-friendly-yoga-mat",
//     descriptionHtml:
//       "<strong>Perfect for your yoga practice!</strong> This mat is made from eco-friendly materials, ensuring a sustainable choice.",
//     vendor: "Green Yoga Co.",
//     productType: "Yoga Accessories",
//     tags: ["yoga", "eco-friendly", "fitness"],
//     metafields: [
//       {
//         namespace: "my_field",
//         key: "liner_material",
//         type: "single_line_text_field",
//         value: "Natural Rubber",
//       },
//       {
//         namespace: "specs",
//         key: "thickness",
//         type: "single_line_text_field",
//         value: "6mm",
//       },
//       {
//         namespace: "care",
//         key: "cleaning_instructions",
//         type: "multi_line_text_field",
//         value: "Wipe with a damp cloth after each use.",
//       },
//     ],
//     status: "ACTIVE",
//     requiresSellingPlan: false,
//     giftCard: false,
//     seo: {
//       title: "Eco-Friendly Yoga Mat - Green Yoga Co.",
//       description:
//         "Shop our Eco-Friendly Yoga Mat, made from sustainable materials. Perfect for yoga enthusiasts!",
//     },
//     productOptions: [
//       {
//         name: "Color",
//         values: ["Green", "Blue", "Purple"],
//       },
//       {
//         name: "Size",
//         values: ["Standard", "Large"],
//       },
//     ],
//     collectionsToJoin: ["gid://shopify/Collection/123456789"],
//     combinedListingRole: "MAIN",
//   };

export async function addNewProduct(ctx: any): Promise<any> {
  const { shopName, accessToken, productInput } = ctx.request.body;
  const requestUrl = `https://${shopName}/admin/api/2024-10/graphql.json`;

  const headers = {
    "Content-Type": "application/json",
    "X-Shopify-Access-Token": accessToken,
  };

  try {
    const result: any = await axios.post(
      requestUrl,
      {
        query: `mutation CreateProductWithOptions($input: ProductInput!) {
          productCreate(input: $input) {
            userErrors {
              field
              message
            }
            product {
              id
              options {
                id
                name
                position
                values
                optionValues {
                  id
                  name
                  hasVariants
                }
              }
              variants(first: 5) {
                nodes {
                  id
                  title
                  selectedOptions {
                    name
                    value
                  }
                }
              }
            }
          }
        }`,
        variables: {
          input: productInput,
        },
      },
      { headers }
    );

    console.log("Response from GraphQL:", result.data); // Log the full response

    const { productCreate } = result.data.data;

    if (productCreate) {
      if (productCreate.userErrors.length > 0) {
        ctx.status = 400; // Bad request
        ctx.body = { errors: productCreate.userErrors };
      } else {
        ctx.body = productCreate.product; // Return the created product
      }
    } else {
      ctx.status = 400;
      ctx.body = { error: "No productCreate response received." };
    }
  } catch (error) {
    console.error("Error creating product:", error);

    if (error.response) {
      console.error("Error response:", error.response.data);
      ctx.status = error.response.status;
      ctx.body = error.response.data;
    } else {
      ctx.status = 500;
      ctx.body = {
        error: "An unexpected error occurred while creating the product.",
      };
    }
  }
}



//* input example
// {
//   "reason": "correction",
//   "name": "available",
//   "changes": [
//     {
//       "delta": -4,
//       "inventoryItemId": "gid://shopify/InventoryItem/8076890636488",
//       "locationId": "gid://shopify/Location/73171501256"
//     }
//   ]
// }

export async function adjustInventoryQuantity(ctx: any): Promise<any> {
  const { shopName, accessToken, inventoryInput } = ctx.request.body;
  const requestUrl = `https://${shopName}/admin/api/2024-10/graphql.json`;

  const headers = {
    "Content-Type": "application/json",
    "X-Shopify-Access-Token": accessToken,
  };

  try {
    const result: any = await axios.post(
      requestUrl,
      {
        query: `mutation inventoryAdjustQuantities($input: InventoryAdjustQuantitiesInput!) {
          inventoryAdjustQuantities(input: $input) {
            userErrors {
              field
              message
            }
            inventoryAdjustmentGroup {
              createdAt
              reason
              referenceDocumentUri
              changes {
                name
                delta
              }
            }
          }
        }`,
        variables: {
          input: inventoryInput,
        },
      },
      { headers }
    );

    console.log("Response from GraphQL:", result.data); // Log the full response

    const { inventoryAdjustQuantities } = result.data.data;

    if (inventoryAdjustQuantities) {
      if (inventoryAdjustQuantities.userErrors.length > 0) {
        ctx.status = 400; // Bad request
        ctx.body = { errors: inventoryAdjustQuantities.userErrors };
      } else {
        ctx.body = inventoryAdjustQuantities.inventoryAdjustmentGroup; // Return the inventory adjustment details
      }
    } else {
      ctx.status = 400;
      ctx.body = { error: "No inventoryAdjustQuantities response received." };
    }
  } catch (error) {
    console.error("Error adjusting inventory:", error);

    if (error.response) {
      console.error("Error response:", error.response.data);
      ctx.status = error.response.status;
      ctx.body = error.response.data;
    } else {
      ctx.status = 500;
      ctx.body = {
        error: "An unexpected error occurred while adjusting the inventory.",
      };
    }
  }
}

export async function deleteProduct(ctx: any): Promise<any> {
  const { shopName, accessToken, productId } = ctx.request.body;
  const requestUrl = `https://${shopName}/admin/api/2024-10/graphql.json`; // Use the latest API version

  const headers = {
    "Content-Type": "application/json",
    "X-Shopify-Access-Token": accessToken,
  };

  try {
    const result: any = await axios.post(
      requestUrl,
      {
        query: `mutation {
          productDelete(input: {id: "${productId}"}) {
            deletedProductId
            userErrors {
              field
              message
            }
          }
        }`,
      },
      { headers }
    );

    console.log("Response from GraphQL:", result.data);  // Log the full response

    // Check if data and productDelete exist in the response
    if (result.data && result.data.data && result.data.data.productDelete) {
      const { productDelete } = result.data.data;

      // Handle potential user errors
      if (productDelete.userErrors.length > 0) {
        ctx.status = 400; // Bad request
        ctx.body = { errors: productDelete.userErrors };
      } else {
        // If successful, return the deleted product ID
        ctx.body = { deletedProductId: productDelete.deletedProductId };
      }
    } else {
      // Handle missing or invalid response structure
      ctx.status = 400;
      ctx.body = { error: "No valid productDelete response received from Shopify." };
    }
  } catch (error) {
    console.error("Error deleting product:", error);

    if (error.response) {
      console.error("Error response from Shopify:", error.response.data);
      ctx.status = error.response.status || 500;
      ctx.body = error.response.data || {
        error: "An error occurred while communicating with Shopify.",
      };
    } else {
      ctx.status = 500;
      ctx.body = {
        error: "An unexpected error occurred while deleting the product.",
      };
    }
  }
}

export async function moveInventoryQuantities(ctx: any): Promise<any> {
  const { shopName, accessToken, inventoryItemId, fromLocationId, toLocationId, quantity } = ctx.request.body;
  const requestUrl = `https://${shopName}/admin/api/2024-10/graphql.json`;

  const headers = {
    "Content-Type": "application/json",
    "X-Shopify-Access-Token": accessToken,
  };

  try {

    const inventoryInput = {
      reason: "movement_updated",
      name: "available",
      changes: [
        {
          delta: -quantity,
          inventoryItemId: inventoryItemId,
          locationId: fromLocationId
        },
        {
          delta: quantity,
          inventoryItemId: inventoryItemId,
          locationId: toLocationId
        },
      ],
    };

    const result: any = await axios.post(
      requestUrl,
      {
        query: `mutation inventoryAdjustQuantities($input: InventoryAdjustQuantitiesInput!) {
          inventoryAdjustQuantities(input: $input) {
            userErrors {
              field
              message
            }
            inventoryAdjustmentGroup {
              createdAt
              reason
              referenceDocumentUri
              changes {
                name
                delta
              }
            }
          }
        }`,
        variables: {
          input: inventoryInput,
        },
      },
      { headers }
    );

    console.log("Response from GraphQL:", result.data);

    const { inventoryAdjustQuantities } = result.data.data;

    if (inventoryAdjustQuantities) {
      if (inventoryAdjustQuantities.userErrors.length > 0) {
        ctx.status = 400;
        ctx.body = { errors: inventoryAdjustQuantities.userErrors };
      } else {
        ctx.body = inventoryAdjustQuantities.inventoryAdjustmentGroup;
      }
    } else {
      ctx.status = 400;
      ctx.body = { error: "No inventoryAdjustQuantities response received." };
    }
  } catch (error) {
    console.error("Error adjusting inventory:", error);

    if (error.response) {
      console.error("Error response:", error.response.data);
      ctx.status = error.response.status;
      ctx.body = error.response.data;
    } else {
      ctx.status = 500;
      ctx.body = {
        error: "An unexpected error occurred while adjusting the inventory.",
      };
    }
  }
}



//* Get all locations
export async function getAllLocations(ctx: any): Promise<any> {
  const { shopName, accessToken } = ctx.request.body;
  const requestUrl = `https://${shopName}/admin/api/2024-10/graphql.json`;

  const headers = {
    "Content-Type": "application/json",
    "X-Shopify-Access-Token": accessToken,
  };


  const query = `
    query {
      locations(first: 250) {
        edges {
          node {
            id
            name
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(requestUrl, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      ctx.status = response.status;
      ctx.body = { error: "Failed to fetch locations from Shopify." };
      return;
    }

    const result = await response.json();

    if (result.errors) {
      ctx.status = 400;
      ctx.body = { errors: result.errors };
      return;
    }

    const locations = result.data.locations.edges.map((edge: any) => edge.node);

    ctx.status = 200;
    ctx.body = { locations };

  } catch (error) {
    console.error("Error fetching locations:", error);
    ctx.status = 500;
    ctx.body = { error: "An unexpected error occurred while fetching locations." };
  }
}


//! Deprecated
export async function getAllItemsByLocation(ctx: any): Promise<any> {
  const { shopName, accessToken, locationId, cursor } = ctx.request.body;
  const requestUrl = `https://${shopName}/admin/api/2024-10/graphql.json`;

  const headers = {
    "Content-Type": "application/json",
    "X-Shopify-Access-Token": accessToken,
  };

  const query = `
    query {
      location(id: "${locationId}") {
        id
        name
        inventoryLevels(first: 3, after: ${cursor ? `"${cursor}"` : null}) {
          edges {
            node {
              id
              location {
                id
                name
              }
              quantities(names: ["available", "incoming", "committed", "damaged", "on_hand", "quality_control", "reserved", "safety_stock"]) {
                name
                quantity
              }
              item {
                id
                variant {
                  id
                  sku
                  selectedOptions {
                    name
                    value
                  }
                  product {
                    id  
                    title
                    images(first: 1) {
                      edges {
                        node {
                          originalSrc
                          altText
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  `;

  try {
    const response = await axios.post(requestUrl, { query }, { headers });

    console.log(response.data);
    if (response.status !== 200) {
      ctx.status = response.status;
      ctx.body = { error: "Failed to fetch inventory levels from Shopify." };
      return;
    }

    const result: any = response.data;

    if (result.errors) {
      ctx.status = 400;
      ctx.body = { errors: result.errors };
      return;
    }

    const inventoryLevels = result.data.location.inventoryLevels.edges.map((edge: { node: any; }) => edge.node);
    const pageInfo = result.data.location.inventoryLevels.pageInfo;

    const organizedData = await new InventoryItemService().organizeInventoryFromLocationData(inventoryLevels)
    ctx.status = 200;
    ctx.body = { organizedData, pageInfo };
  } catch (error) {
    console.error("Error fetching inventory levels:", error);
    ctx.status = 500;
    ctx.body = { error: "An unexpected error occurred while fetching inventory levels." };
  }
}



export async function inventoryItemsCountPreLocation(ctx: any): Promise<any> {
  const { shopName, accessToken, locationId } = ctx.request.body;
  const requestUrl = `https://${shopName}/admin/api/2024-10/graphql.json`;

  const headers = {
    "Content-Type": "application/json",
    "X-Shopify-Access-Token": accessToken,
  };

  let count = 0;
  let cursor = null;
  let hasNextPage = true;

  try {
    while (hasNextPage) {
      const query = `
        query {
          location(id: "gid://shopify/Location/${locationId}") {
            id
            name
            inventoryLevels(first: 250, after: ${cursor ? `"${cursor}"` : null}) {
              edges {
                node {
                  id
                  location {
                    id
                    name
                  }
                  quantities(names: ["available"]) {
                    name
                    quantity
                  }
                }
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }
      `;

      const response : any = await axios.post(requestUrl, { query }, { headers });

      if (response.status !== 200 || response.data.errors) {
        console.error("Error response:", response.data.errors || response.status);
        ctx.status = response.status;
        ctx.body = { error: "Failed to fetch inventory levels from Shopify." };
        return;
      }

      const inventoryLevels = response.data.data.location.inventoryLevels;
      const edges = inventoryLevels.edges;

      // Add the count of items on this page
      count += edges.length;

      // Update pagination details
      hasNextPage = inventoryLevels.pageInfo.hasNextPage;
      cursor = inventoryLevels.pageInfo.endCursor;
    }

    ctx.status = 200;
    ctx.body = { inventoryItemsCount: count };
  } catch (error) {
    console.error("Error fetching inventory levels:", error.message, error.response?.data);
    ctx.status = 500;
    ctx.body = { error: "An unexpected error occurred while fetching inventory levels." };
  }
}


export async function getProductsByLocation(ctx: any): Promise<any> {
  const { shopName, accessToken, locationId } = ctx.request.body;
  const requestUrl = `https://${shopName}/admin/api/2024-10/graphql.json`;

  const headers = {
    "Content-Type": "application/json",
    "X-Shopify-Access-Token": accessToken,
  };
  let cursor = null;
    const query = `
    query {
    products(first: 10, after: null, query:"location_id:${locationId}") {
      edges {
      cursor
        node {
          id
          title
          category{
            id
            name
            fullName
          }
          hasOnlyDefaultVariant
          hasOutOfStockVariants
          productType
          tags
          vendor
          variantsCount{
            count
          }
          variants (first: 250, after: null){
            edges {
            
              node {
                id
                displayName
                inventoryQuantity
                price
                title
                inventoryItem{
                  id
                  unitCost{
                    amount
                    currencyCode
                  }

                }
              }
              
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  `;

  try {
    const response = await axios.post(requestUrl, { query }, { headers });

    console.log(response.data);
    if (response.status !== 200) {
      ctx.status = response.status;
      ctx.body = { error: "Failed to fetch inventory levels from Shopify." };
      return;
    }

    let result: any = response.data;

    if (result.errors) {
      ctx.status = 400;
      ctx.body = { errors: result.errors };
      return;
    }


    ctx.status = 200;
    ctx.body = result;
  } catch (error) {
    console.error("Error fetching inventory levels:", error);
    ctx.status = 500;
    ctx.body = { error: "An unexpected error occurred while fetching inventory levels." };
  }
}



export async function getCategoryList(ctx: any): Promise<any> {
  const { shopName, accessToken } = ctx.request.body;
  const requestUrl = `https://${shopName}/admin/api/2024-10/graphql.json`;

  const headers = {
    "Content-Type": "application/json",
    "X-Shopify-Access-Token": accessToken,
  };
  let cursor = null;
 
  const query = `
  query {
    taxonomy {
      categories(first: 250, after: null) {
        edges {
          node {
            id
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;
  
  try {
    const response = await axios.post(requestUrl, { query }, { headers });

    console.log(response.data);
    if (response.status !== 200) {
      ctx.status = response.status;
      ctx.body = { error: "Failed to fetch inventory levels from Shopify." };
      return;
    }

    let result: any = response.data;

    if (result.errors) {
      ctx.status = 400;
      ctx.body = { errors: result.errors };
      return;
    }


    ctx.status = 200;
    ctx.body = result;
  } catch (error) {
    console.error("Error fetching inventory levels:", error);
    ctx.status = 500;
    ctx.body = { error: "An unexpected error occurred while fetching inventory levels." };
  }
}





