import * as bodyParser from "koa-bodyparser";
import * as axios from "axios";

export const InventoryItemController = (router: any) => {
  router.post("/products-items-list/", bodyParser(), getAllProducts);
  router.post("/inventory-item-list/", bodyParser(), getAllInventoryItems);
  router.post(
    "/items-quantity-pre-location/",
    bodyParser(),
    getAllInventoryItemsQuantities
  );
  router.post("/add-new-product/", bodyParser(), addNewProduct);
  router.post(
    "/adjust-inventory-quantities",
    bodyParser(),
    adjustInventoryQuantities
  );
};

//* GET - inventory item by id
//! In graphql cnnot gat at all, only specific number of items
export async function getAllProducts(ctx: any): Promise<any> {
  const { shopName, accessToken } = ctx.request.body;
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
          products(first: 10, after: "eyJsYXN0X2lkIjoyMDk5NTY0MiwibGFzdF92YWx1ZSI6IjIwOTk1NjQyIn0=") {
            edges {
              node {
                id
                title
                handle
              }
              cursor
            }
            pageInfo {
              hasNextPage
            }
          }
        }`,
      },
      { headers }
    );

    console.log(result.data);
    ctx.body = result.data;
  } catch (error) {
    console.error("Error fetching products:", error);
    ctx.status = error.response?.status || 500;
    ctx.body = error.response?.data || {
      error: "An error occurred while fetching products.",
    };
  }
}


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


export async function getAllInventoryItemsQuantities(ctx: any): Promise<any> {
  const { shopName, accessToken } = ctx.request.body; // Only shop name and access token needed
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
          inventoryItems(first: 100) {
            edges {
              node {
                id
                inventoryLevels(first: 10) {
                  edges {
                    node {
                      available
                      location {
                        id
                        name
                      }
                    }
                  }
                }
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
    console.error("Error fetching inventory items quantities:", error);
    ctx.status = error.response?.status || 500;
    ctx.body = error.response?.data || {
      error: "An error occurred while fetching inventory item quantities.",
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
    const result  : any = await axios.post(
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




export async function adjustInventoryQuantity(ctx: any): Promise<any> {
  const { shopName, accessToken, inventoryInput } = ctx.request.body; // Get shopName, accessToken, and inventoryInput
  const requestUrl = `https://${shopName}/admin/api/2024-10/graphql.json`;

  const headers = {
    "Content-Type": "application/json",
    "X-Shopify-Access-Token": accessToken,
  };

  try {
    const result = await axios.post(
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
          input: inventoryInput, // Use the inventory input defined above
        },
      },
      { headers }
    );

    console.log(result.data); // Log the full response for debugging
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
    console.error("Error adjusting inventory quantity:", error);

    if (error.response) {
      console.error("Error response:", error.response.data);
      ctx.status = error.response.status;
      ctx.body = error.response.data;
    } else {
      ctx.status = 500;
      ctx.body = {
        error:
          "An unexpected error occurred while adjusting the inventory quantity.",
      };
    }
  }
}
