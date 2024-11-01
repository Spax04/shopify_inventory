import React, { useState, useEffect } from "react";
import { Tabs, Tab, Accordion, Card, Image, Button } from "react-bootstrap";
import axios from "axios";
import { getAllData, addData, updateData, deleteData, getPageInfo, storeInventoryData } from "../db/db";
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from "react-router-dom";

function LocationInventory() {
  const [key, setKey] = useState(""); // active key for tabs
  const [locationData, setLocationData] = useState([]); // store the inventory data per location
  const [loading, setLoading] = useState(true);
  const [currentInventory, setCurrentInventory] = useState([])// loading state
  const [tabChanged, setTabChanged] = useState(false)
  const shopName = ''
  const accessToken = ''
  const navigation = useNavigate()
  useEffect(() => {
    // Fetch inventory data from the API
    const getLocations = async () => {

      await axios
        .post("http://127.0.0.1:5000/get-locations/", {
          shopName,
          accessToken
        })
        .then(({ data: response }) => {
          console.log(response);
          console.log(response.locations);
          setLocationData(response.locations);
          setLoading(false); // Set loading to false
        })
        .catch((error) => {
          console.error("Error fetching inventory data:", error);
          setLoading(false);
        });
    }
    getLocations()
  }, []);
  // useEffect(() => {
  //   if (currentInventory.length > 0) {
  //     console.log("Updated currentInventory:", currentInventory);
  //   }
  // }, [currentInventory]);


  const handleLocationInventory = async (locationId) => {
    setCurrentInventory([]);  // Reset current inventory on each location change
    setLoading(true);
    try {
      const cachedLocationData = await getAllData(locationId);

      if (cachedLocationData && cachedLocationData.length > 0) {
        console.log("Using cached inventory data from IndexedDB");
        const withoutPageInfo = cachedLocationData.filter((u) => u.id !== "pageInfo");
        setCurrentInventory(withoutPageInfo);
        setLoading(false);

        let pageInfo = await getPageInfo(locationId);

        if (!pageInfo || !pageInfo.hasNextPage) {
          console.log("No need to retrieve more data from the backend, hasNextPage is false!");
          return;
        }

        let hasNextPage = pageInfo.hasNextPage;
        let cursor = pageInfo.endCursor;


        while (hasNextPage) {
          console.log("Trying to fetch more products from the backend.");
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
          hasNextPage = response.pageInfo.hasNextPage;
          cursor = response.pageInfo.endCursor;


        }
        const updatedData = await getAllData(locationId);
        setCurrentInventory(updatedData);  // Update currentInventory once outside the loop
      } else {
        // No cached data, fetch from API
        let hasNextPage = true;
        let cursor = null;


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

          console.log("HAS NEXT PAGE: " + response.pageInfo.hasNextPage);
          hasNextPage = response.pageInfo.hasNextPage;
          cursor = response.pageInfo.endCursor;

          await storeInventoryData(locationId, response);


        }
        const updatedData = await getAllData(locationId);
        setCurrentInventory(updatedData);  // Update currentInventory once outside the loop
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching inventory data:", error);
      setLoading(false);
    }
  };



  const handleTabChanged = () => {
    setTabChanged(true)
  }

  const handleRelocateQunatity = (locationId, productVariant) => {

    navigation("/change-location-quantity")
  }



  return (
    <div className="container mt-4">
      <h2>Location Inventory</h2>

      <Tabs
        id="location-tabs"
        activeKey={key}
        onSelect={(k) => {
          setKey(k); // Set the active tab key
          handleLocationInventory(k);
          handleTabChanged();// Fetch inventory for the selected location
        }}
        className="mb-3"
      >
        {locationData.map((location) => (
          <Tab eventKey={location.id} title={location.name} key={location.id} >
            {loading ?
              (<div>Loading...</div>) : (

                <Accordion>
                  {Array.isArray(currentInventory) && currentInventory.length > 0 ? (
                    currentInventory.map((product) => (
                      <Card key={product.productId}>
                        <Accordion.Item eventKey={product.productId}>
                          <Accordion.Header>
                            <h5>{product.productName}</h5>
                          </Accordion.Header>
                          <Accordion.Body>
                            <div className="row mb-3">
                              <div className="col-md-3">
                                {product.imageURLs ? (<Image src={product.imageURLs[0]} alt={product.productName} fluid />) : (<></>)}

                              </div>
                              <div className="col-md-9">
                                <h5>{product.productName}</h5>
                              </div>
                            </div>

                            <h6>Variants:</h6>
                            {Array.isArray(product.productVariants) && product.productVariants.length > 0 ? (
                              product.productVariants.map((variant, variantIndex) => (
                                <div key={variantIndex} className="mb-3">
                                  <h6>Variant {variantIndex + 1}</h6>
                                  <div className="row">
                                    {variant.variants.map((option, optionIndex) => (
                                      <div className="col-md-4" key={optionIndex}>
                                        <strong>{option.name}:</strong> {option.value}
                                      </div>
                                    ))}
                                  </div>
                                  <div className="row mt-2">
                                    {variant.quantities.map((quantity, quantityIndex) => (
                                      <div className="col-md-3" key={quantityIndex}>
                                        <strong>{quantity.name}:</strong> {quantity.quantity}
                                      </div>
                                    ))}
                                  </div>
                                  <Button onClick={() => handleRelocateQunatity(location.id, variant)}>Move to other location</Button>
                                  <hr />

                                </div>
                              ))
                            ) : (
                              <div>No variants available</div>
                            )}
                          </Accordion.Body>
                        </Accordion.Item>
                      </Card>
                    ))
                  ) : (
                    <div>No inventory available for this location.</div>
                  )}
                </Accordion>)}
          </Tab>
        ))}
      </Tabs>
    </div>
  );
}

export default LocationInventory;
