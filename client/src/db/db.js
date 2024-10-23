// src/indexedDB.js
import { openDB } from 'idb';

let dbVersion = 1;
// Initialize the IndexedDB
export const initDB = async (storeName) => {
    const dbName = 'locations';

    // Open the database
    const db = await openDB(dbName, dbVersion);

    // Check if the store exists
    if (!db.objectStoreNames.contains(storeName)) {
        console.log(`Object store ${storeName} not found, upgrading database to create it.`);

        // Close the current database connection
        db.close();

        // Upgrade the version to create the new object store
        dbVersion++;

        // Open the database with the new version and create the store in the upgrade callback
        const upgradedDB = await openDB(dbName, dbVersion, {
            upgrade(upgradeDB) {
                if (!upgradeDB.objectStoreNames.contains(storeName)) {
                    upgradeDB.createObjectStore(storeName, {
                        keyPath: 'id',
                        autoIncrement: true, // Using autoIncrement for simplicity, adjust as needed
                    });
                }
            }
        });

        return upgradedDB;
    }

    return db;
};
// Function to get all data from the database
export const getAllData = async (storaName) => {
    const db = await initDB(storaName);
    return await db.getAll(storaName);
};

// Function to delete data from the database
export const deleteData = async (storaName, id) => {
    const db = await initDB(storaName);
    await db.delete(storaName, id);
};

// Function to update data in the database
export const updateData = async (storaName, id, updatedData) => {
    const db = await initDB(storaName);
    await db.put(storaName, { id, ...updatedData });
};


export const getPageInfo = async (storaName) => {
    const db = await initDB(storaName);
    await db.get(storaName, "pageInfo")
};

export const storeInventoryData = async (locationId, data) => {
    const db = await initDB(locationId);  // Use locationId as store name

    // Store each inventory item with its ID as key
    const inventoryItems = data.organizedData.inventoryItems;
    for (const [inventoryId, inventoryItem] of Object.entries(inventoryItems)) {
        await db.put(locationId, { id: inventoryId, ...inventoryItem });
    }

    // Store pageInfo separately with a key "pageInfo"
    await db.put(locationId, { id: "pageInfo", ...data.pageInfo });
};