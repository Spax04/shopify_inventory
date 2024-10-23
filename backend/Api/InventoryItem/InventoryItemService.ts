interface InventoryItem {
  productName: string;
  productId: string;
  item: string;
  sku: string;
  imageURLs: (string | null)[];
  productVariants: {
    variants: {
      name: string;
      value: string;
    }[];
    quantities: Quantity[];
  }[];
}

interface LocationData {
  locationName: string;
  locationId: string;
  inventoryItems: {
    [inventoryItemId: string]: InventoryItem;
  };
}

type InventoryLevel = {
  item: {
    id: string;
    variant: {
      id: string;
      product: {
        title: string;
        images: {
          edges: {
            node: {
              originalSrc: string | null;
            };
          }[];
        };
      };
      sku: string;
      selectedOptions: {
        name: string;
        value: string;
      }[];
    };
  };
  location: {
    name: string;
    id: string;
  };
  quantities: Quantity[];
};

type Quantity = {
  available: number;
  reserved: number;
};
export class InventoryItemService {


  organizeInventoryFromLocationData = (inventoryLevels: InventoryLevel[]): LocationData => {
    const locationData: LocationData = {
      locationName: '',
      locationId: '',
      inventoryItems: {}
    };
  
    inventoryLevels.forEach((level) => {
      const { item, location } = level;
      const productName = item.variant.product.title;
      const sku = item.variant.sku;
      const inventoryItemId = item.id;  // This will be the key as per the interface
      const productId = item.variant.id;
  
      // Set location metadata
      locationData.locationName = location.name;
      locationData.locationId = location.id;
  
      // If this inventory item is not already in the map, initialize it
      if (!locationData.inventoryItems[inventoryItemId]) {
        locationData.inventoryItems[inventoryItemId] = {
          productName,
          productId,
          item: productName,
          sku,
          imageURLs: item.variant.product.images.edges.map((img) => img.node.originalSrc),
          productVariants: []
        };
      }
  
      // Add selected options (variants) and quantities to the productVariants array
      const selectedOptions = {
        variants: item.variant.selectedOptions,
        quantities: level.quantities
      };
  
      locationData.inventoryItems[inventoryItemId].productVariants.push(selectedOptions);
    });
  
    return locationData;
  };
}

