import axios from "axios";
import { storeInventoryData, getPageInfo } from "../db/db";

onmessage = async function (event) {
    console.log('Received message from the main thread:', event.data);

    const shopName = event.data.shopName
    const locationId = event.data.locationId
    const accessToken = event.data.accessToken
    let cursor = event.data.endCursor

    let pageInfo = await getPageInfo(locationId);

    let hasNextPage;
    if (!pageInfo) {
        hasNextPage = true;
    } else {
        hasNextPage = pageInfo.hasNextPage;
    }


    while (hasNextPage) {

        const { data: response } = await axios.post(
            "http://127.0.0.1:5000/get-all-inventory-items-by-location/",
            {
                shopName,
                accessToken,
                locationId,
                cursor,
            }
        );

        console.log("CURSOR: ");
        console.log(response.pageInfo);
        console.log("HAS NEXT PAGE: " + response.pageInfo.hasNextPage);

        hasNextPage = response.pageInfo.hasNextPage
        cursor = response.pageInfo.endCursor
        await storeInventoryData(locationId, response);


        postMessage(locationId);
    }

};