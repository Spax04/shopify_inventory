interface InventoryItem {
  productName: string;
  productId: string;
  imageURLs: (string | null)[];
  productVariants: {
    variants: {
      name: string;
      value: string;
    }[];
    inventoryItemId: string
    productVarianId: string;
    sku: string;
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
        id: string;
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
      const productId = item.variant.product.id;
      const productVarianId = item.variant.id

      // Set location metadata
      locationData.locationName = location.name;
      locationData.locationId = location.id;

      // If this inventory item is not already in the map, initialize it
      if (!locationData.inventoryItems[productId]) {
        locationData.inventoryItems[productId] = {
          productName,
          productId,
          imageURLs: item.variant.product.images.edges.map((img) => img.node.originalSrc),
          productVariants: []
        };
      }

      // Add selected options (variants) and quantities to the productVariants array
      const selectedOptions = {
        variants: item.variant.selectedOptions,
        inventoryItemId,
        productVarianId,
        sku,
        quantities: level.quantities
      };

      locationData.inventoryItems[productId].productVariants.push(selectedOptions);
    });

    return locationData;
  };

  countItmesInLocation = (response: any) => {

    console.log(response.location);
    const inventoryLevels : InventoryLevel[] = response.location.inventoryLevels.edges

    let totalCount = 0;

    inventoryLevels.forEach((node) => totalCount += node.quantities[0].available)
    
    return totalCount
  }
}

