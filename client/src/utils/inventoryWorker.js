import axios from "axios";
import { storeInventoryData } from "../db/db";

onmessage = async function (event) {
    console.log('Received message from the main thread:', event.data);

    const shopName = event.data.shopName
    const locationId = event.data.locationId
    const accessToken = event.data.accessToken
    const cursor = event.data.cursor
    // Perform some computation
    const { data: response } = await axios.post(
        "http://127.0.0.1:5000/get-all-inventory-items-by-location/",
        {
            shopName,
            accessToken,
            locationId,
            cursor,
        }
    );

    console.log("HAS NEXT PAGE: " + response.pageInfo.hasNextPage);

    await storeInventoryData(locationId, response);

    const result = {
        hasNextPage: response.pageInfo.hasNextPage,
        cursor: response.pageInfo.cursor
    }
    // Send the result back to the main thread
    postMessage(result);
};