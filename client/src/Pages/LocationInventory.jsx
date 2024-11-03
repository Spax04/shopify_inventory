import React, { useState, useEffect } from "react";
import { Tabs, Tab, Accordion, Card, Image, Button } from "react-bootstrap";
import axios from "axios";
import { getAllData, addData, updateData, deleteData, getPageInfo, storeInventoryData } from "../db/db";
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from "react-router-dom";

function LocationInventory() {
  const [key, setKey] = useState(""); // active key for tabs
  const [locationData, setLocationData] = useState([]); // store the inventory data per location
  const [currentInventory, setCurrentInventory] = useState([])// loading state
  const [currentLocation, setCurrentLocation] = useState()
  const navigation = useNavigate()

  const shopName = process.env.REACT_APP_TEST_SHOP
  const accessToken = process.env.REACT_APP_TEST_TOKEN

  useEffect(() => {
    console.log(currentLocation);
    if (currentLocation) {

      const myWorker = new Worker(new URL('../utils/inventoryWorker.js', import.meta.url));

      myWorker.onmessage = function (event) {
        console.log('Received result from worker:', event.data);
        setCurrentItems(event.data)
      };

      handleLocationInventory(currentLocation, myWorker)

      return () => {
        console.log("worker has been terminated!");

        myWorker.terminate();
      };
    }
  }, [currentLocation]);
  useEffect(() => {
    // Fetch inventory data from the API
    const getLocations = async () => {

      console.log(shopName);
      console.log(accessToken);
      await axios
        .post("http://127.0.0.1:5000/get-locations/", {
          shopName,
          accessToken
        })
        .then(({ data: response }) => {
          console.log(response);
          console.log(response.locations);
          setLocationData(response.locations);
        })
        .catch((error) => {
          console.error("Error fetching inventory data:", error);
        });
    }
    getLocations()
  }, []);

  const setCurrentItems = async (locationId) => {
    const cachedLocationData = await getAllData(locationId);

    if (cachedLocationData && cachedLocationData.length > 0) {
      console.log("Using cached inventory data from IndexedDB");
      const withoutPageInfo = cachedLocationData.filter((u) => u.id !== "pageInfo");
      setCurrentInventory(withoutPageInfo);
    }
  }

  const handleLocationInventory = async (locationId, currentWorker) => {
    setCurrentInventory([]);

    try {
      const cachedLocationData = await getAllData(locationId);

      if (cachedLocationData && cachedLocationData.length > 0) {
        console.log("Using cached inventory data from IndexedDB");
        const withoutPageInfo = cachedLocationData.filter((u) => u.id !== "pageInfo");
        setCurrentInventory(withoutPageInfo);

        let pageInfo = await getPageInfo(locationId);

        if (!pageInfo || !pageInfo.hasNextPage) {
          console.log("No need to retrieve more data from the backend, hasNextPage is false!");
          return;
        }

        let endCursor = pageInfo.endCursor
        if (currentWorker) {
          console.log("Worker starts!");
          currentWorker.postMessage({ shopName, locationId, accessToken, endCursor });
        }

      } else {
        let endCursor = null;

        if (currentWorker) {
          console.log("Worker starts!");
          currentWorker.postMessage({ shopName, locationId, accessToken, endCursor });
        }

      }

    } catch (error) {
      console.error("Error fetching inventory data:", error);
    }

    console.log("EXIT FROM FUNCTION!!!!");
  };

  const handleRelocateQunatity = (locationId, variant, productName) => {

    console.log(locationId);
    console.log(variant);
    navigation("/change-location-quantity", { state: { locationId, variant, productName } })
  }

  return (
    <div className="container mt-4">
      <h2>Location Inventory</h2>

      <Tabs
        id="location-tabs"
        activeKey={key}
        onSelect={(k) => {
          setKey(k);
          setCurrentLocation(k)
        }}
        className="mb-3"
      >
        {locationData.map((location) => (
          <Tab eventKey={location.id} title={location.name} key={location.id} >



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
                              <Button onClick={() => handleRelocateQunatity(location.id, variant, product.productName)}>Move to other location</Button>
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
            </Accordion>
          </Tab>
        ))}
      </Tabs>
    </div>
  );
}

export default LocationInventory;
