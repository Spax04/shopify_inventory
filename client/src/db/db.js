// src/indexedDB.js
import { openDB } from 'idb';


// Initialize the IndexedDB
export const initDB = async (storeName) => {
    const dbName = 'locations';

    const db = await openDB(dbName);

    if (!db.objectStoreNames.contains(storeName)) {
        console.log(`Object store ${storeName} not found, upgrading database to create it.`);

        db.close();

        const upgradedDB = await openDB(dbName, db.version + 1, {
            upgrade(upgradeDB) {
                if (!upgradeDB.objectStoreNames.contains(storeName)) {
                    upgradeDB.createObjectStore(storeName, {
                        keyPath: 'id',
                        autoIncrement: true,
                    });
                }
            }
        });

        return upgradedDB;
    }

    return db;
};

export const getAllData = async (storaName) => {
    const db = await initDB(storaName);
    return await db.getAll(storaName);
};

export const deleteData = async (storaName, id) => {
    const db = await initDB(storaName);
    await db.delete(storaName, id);
};

export const updateData = async (storaName, id, updatedData) => {
    const db = await initDB(storaName);
    await db.put(storaName, { id, ...updatedData });
};


export const getPageInfo = async (storaName) => {
    const db = await initDB(storaName);
    return await db.get(storaName, "pageInfo")
};

export const storeInventoryData = async (locationId, data) => {
    const db = await initDB(locationId);

    const inventoryItems = data.organizedData.inventoryItems;
    for (const [inventoryId, inventoryItem] of Object.entries(inventoryItems)) {
        const existingItem = await db.get(locationId, inventoryItem.productId);

        if (!existingItem) {
            await db.put(locationId, { id: inventoryId, ...inventoryItem });
            console.log("New data was stored into index db");
        } else {
            const updatedVariants = [...existingItem.productVariants, ...inventoryItem.productVariants];
            await db.put(locationId, { id: inventoryId, ...existingItem, productVariants: updatedVariants });
            console.log("Poduct data was updated at indexed db (added variant)");
        }
    }

    await db.put(locationId, { id: "pageInfo", ...data.pageInfo });
};