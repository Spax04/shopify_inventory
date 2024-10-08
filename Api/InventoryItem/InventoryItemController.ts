import * as bodyParser from "koa-bodyparser";
import * as axios from "axios";

export const InventoryItemController = (router: any) => {
  router.post("/inventory-item/", bodyParser(), getInventoryItemById);
  router.post("/inventory-items-list/", bodyParser(), getInventoryItemList);
  router.post(
    "/inventory-level/",
    bodyParser(),
    getInventoryItemByInventoryLevel
  );
  router.post("/inventory-properties/", bodyParser(), getInventoryProperties);
  router.post("/activate-inventory-item", bodyParser(), activateInventoryItem);
  router.post(
    "/adjust-inventory-quantities",
    bodyParser(),
    adjustInventoryQuantities
  );
};

//! GET - inventory item by id
export async function getInventoryItemById(ctx: any): Promise<any> {
  const { inventoryItemId, shopName, accessToken } = ctx.request.body;
  const requestUrl = `https://${shopName}/admin/api/2023-01/graphql.json`;

  const headers = {
    "Content-Type": "application/json",
    "X-Shopify-Access-Token": accessToken,
  };

  try {
    const result = await axios.post(
      requestUrl,
      {
        query: `query getInventoryItem($id: ID!) {
          inventoryItem(id: $id) {
            id
            tracked
            sku
          }
        }`,
        variables: {
          id: `gid://shopify/InventoryItem/${inventoryItemId}`,
        },
      },
      { headers }
    );

    console.log(result.data);
    ctx.body = result.data;
  } catch (error) {
    console.error("Error fetching inventory item:", error);
    ctx.status = error.response?.status || 500;
    ctx.body = error.response?.data || {
      error: "An error occurred while fetching inventory item.",
    };
  }
}

//! GET - inventory item list by id
export async function getInventoryItemList(ctx: any): Promise<any> {
  const { quantityOfItems, shopName, accessToken } = ctx.request.body;
  const requestUrl = `https://${shopName}/admin/api/2023-01/graphql.json`;

  const headers = {
    "Content-Type": "application/json",
    "X-Shopify-Access-Token": accessToken,
  };

  try {
    const result = await axios.post(
      requestUrl,
      {
        query: `query inventoryItems {
        inventoryItems(first: ${quantityOfItems}) {
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
    console.error("Error fetching inventory item:", error);
    ctx.status = error.response.status;
    ctx.body = error.response.data;
  }
}

//! GET - inventory item level
export async function getInventoryItemByInventoryLevel(ctx: any): Promise<any> {
  const { locationId, inventoryItemId, shopName, accessToken } =
    ctx.request.body;
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
    inventoryLevel(id: "gid://shopify/InventoryLevel/${locationId}?inventory_item_id=${inventoryItemId}") {
      id
      quantities(names: ["available", "incoming", "committed", "damaged", "on_hand", "quality_control", "reserved", "safety_stock"]) {
        name
        quantity
      }
      item {
        id
        sku
      }
      location {
        id
        name
      }
    }
  }`,
      },
      { headers }
    );

    console.log(result.data);
    ctx.body = result.data;
  } catch (error) {
    console.error("Error fetching inventory item:", error);
    ctx.status = error.response.status;
    ctx.body = error.response.data;
  }
}

//! GET - inventory propeties
export async function getInventoryProperties(ctx: any): Promise<any> {
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
        query: `query inventoryProperties {
    inventoryProperties {
      quantityNames {
        belongsTo
        comprises
        displayName
        isInUse
        name
      }
    }
  }`,
      },
      { headers }
    );

    console.log(result.data);
    ctx.body = result.data;
  } catch (error) {
    console.error("Error fetching inventory item:", error);
    ctx.status = error.response.status;
    ctx.body = error.response.data;
  }
}

export async function activateInventoryItem(ctx: any): Promise<any> {
  const { inventoryItemId, locationId, available, shopName, accessToken } =
    ctx.request.body; // Expecting JSON body with inventoryItemId, locationId, and available

  const requestUrl = `https://${shopName}/admin/api/2023-01/graphql.json`;
  const headers = {
    "Content-Type": "application/json",
    "X-Shopify-Access-Token": accessToken,
  };
  const ACTIVATE_INVENTORY_ITEM_MUTATION = `
  mutation ActivateInventoryItem($inventoryItemId: ID!, $locationId: ID!, $available: Int) {
    inventoryActivate(inventoryItemId: $inventoryItemId, locationId: $locationId, available: $available) {
      inventoryLevel {
        id
        quantities(names: ["available"]) {
          name
          quantity
        }
        item {
          id
        }
        location {
          id
        }
      }
    }
  }
`;
  try {
    const result: any = await axios.post(
      requestUrl,
      {
        query: ACTIVATE_INVENTORY_ITEM_MUTATION,
        variables: {
          inventoryItemId,
          locationId,
          available,
        },
      },
      { headers }
    );

    const inventoryLevelData = result.data.inventoryActivate.inventoryLevel;

    // Log the retrieved inventory level data
    console.log("Activated Inventory Level Data:", inventoryLevelData);

    ctx.body = {
      id: inventoryLevelData.id,
      availableQuantity: inventoryLevelData.quantities[0]?.quantity || 0, // Get available quantity or 0 if not found
      itemId: inventoryLevelData.item.id,
      locationId: inventoryLevelData.location.id,
    };
  } catch (error) {
    console.error("Error activating inventory item:", error);
    ctx.status = error.response?.status || 500; // Handle cases where error.response might be undefined
    ctx.body = error.response?.data || {
      error: "An error occurred while activating the inventory item.",
    };
  }
}

export async function adjustInventoryQuantities(ctx: any): Promise<any> {
  const { reason, name, referenceDocumentUri, changes, shopName, accessToken } =
    ctx.request.body; // Expecting JSON body with adjustment details

  const requestUrl = `https://${shopName}/admin/api/2023-01/graphql.json`;
  const headers = {
    "Content-Type": "application/json",
    "X-Shopify-Access-Token": accessToken,
  };
  const ADJUST_INVENTORY_QUANTITIES_MUTATION = `
  mutation inventoryAdjustQuantities($input: InventoryAdjustQuantitiesInput!) {
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
  }
`;
  try {
    const result: any = await axios.post(
      requestUrl,
      {
        query: ADJUST_INVENTORY_QUANTITIES_MUTATION,
        variables: {
          input: {
            reason,
            name,
            referenceDocumentUri,
            changes,
          },
        },
      },
      { headers }
    );

    const responseData = result.data.data.inventoryAdjustQuantities;

    // Check for user errors
    if (responseData.userErrors.length > 0) {
      ctx.status = 400; // Bad Request
      ctx.body = {
        errors: responseData.userErrors,
      };
      return;
    }

    // Log the inventory adjustment group details
    console.log(
      "Inventory Adjustment Group:",
      responseData.inventoryAdjustmentGroup
    );

    ctx.body = {
      createdAt: responseData.inventoryAdjustmentGroup.createdAt,
      reason: responseData.inventoryAdjustmentGroup.reason,
      referenceDocumentUri:
        responseData.inventoryAdjustmentGroup.referenceDocumentUri,
      changes: responseData.inventoryAdjustmentGroup.changes,
    };
  } catch (error) {
    console.error("Error adjusting inventory quantities:", error);
    ctx.status = error.response?.status || 500; // Handle cases where error.response might be undefined
    ctx.body = error.response?.data || {
      error: "An error occurred while adjusting inventory quantities.",
    };
  }
}
