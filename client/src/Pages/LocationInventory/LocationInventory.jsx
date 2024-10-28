import React, { useState, useEffect } from "react";
import { Tabs, Tab, Accordion, Card, Image } from "react-bootstrap";
import axios from "axios";
import { getAllData, addData, updateData, deleteData, getPageInfo, storeInventoryData } from "../../db/db";
import 'bootstrap/dist/css/bootstrap.min.css';

function LocationInventory() {
  const [key, setKey] = useState(""); // active key for tabs
  const [locationData, setLocationData] = useState([]); // store the inventory data per location
  const [loading, setLoading] = useState(true);
  const [currentInventory, setCurrentInventory] = useState([])// loading state

  const shopName = process.env.REACT_APP_TEST_SHOP
  const accessToken = process.env.REACT_APP_TEST_TOKEN

  useEffect(() => {
    // Fetch inventory data from the API
    axios
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
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }




  const handleLocationInventory = async (locationId) => {
    setLoading(true);

    try {

      console.log(locationId);
      const cachedLocationData = await getAllData(locationId);

      if (cachedLocationData && cachedLocationData.length > 0) {
        console.log("Using cached inventory data from IndexedDB");
        const withoudPageInfo = cachedLocationData.filter((u)=> u.id !== "pageInfo")
        setCurrentInventory(withoudPageInfo);
        setLoading(false);

        console.log(cachedLocationData);
        let pageInfo = await getPageInfo(locationId);

        if (!pageInfo || !pageInfo.hasNextPage) {
          return;
        }

        while (pageInfo.hasNextPage) {
          const { data: response } = await axios.post(
            "http://127.0.0.1:5000/get-all-inventory-items-by-location/",
            {
              shopName,
              accessToken,
              locationId,
            }
          );

          console.log(response);
          await storeInventoryData(locationId, response);

          pageInfo = response.pageInfo.hasNextPage;
        }
      } else {

        let hasNextPage = true;


        while (hasNextPage) {

          const { data: response } = await axios.post(
            "http://127.0.0.1:5000/get-all-inventory-items-by-location/",
            {
              shopName,
              accessToken,
              locationId,
            }
          );

          console.log(response);
          hasNextPage = response.pageInfo.hasNextPage

          console.log(response);
          await storeInventoryData(locationId, response);

          setCurrentInventory(response.organizedData.inventoryItems);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching inventory data:", error);
      setLoading(false);
    }
  };



  return (
    <div className="container mt-4">
      <h2>Location Inventory</h2>

      <Tabs
        id="location-tabs"
        activeKey={key}
        onSelect={(k) => {
          setKey(k); // Set the active tab key
          handleLocationInventory(k); // Fetch inventory for the selected location
        }}
        className="mb-3"
      >
        {locationData.map((location) => (
          <Tab eventKey={location.id} title={location.name} key={location.id} >
            <Accordion>
              {currentInventory.map((product) => {
                return (
                  <Card key={product.productId}>
                    <Accordion.Item eventKey={product.productId}>
                      <Accordion.Header>
                        <h5>{product.productName}</h5>
                      </Accordion.Header>
                      <Accordion.Body>

                        <div className="row mb-3">
                          <div className="col-md-3">
                            {/* <Image src={product.imageURLs[0]} alt={product.productName} fluid /> */}
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
                              <hr />
                            </div>
                          ))
                        ) : (
                          <div>No variants available</div>
                        )}
                      </Accordion.Body>
                    </Accordion.Item>
                  </Card>
                );
              })}
            </Accordion>
          </Tab>
        ))}
      </Tabs>
    </div>
  );
}

export default LocationInventory;
