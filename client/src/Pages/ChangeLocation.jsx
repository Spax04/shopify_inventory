import React, { useEffect, useState } from 'react'
import { Form, Button, Dropdown, Container } from 'react-bootstrap'
import axios from 'axios'
import { useNavigate, useLocation } from 'react-router-dom';


function ChangeLocation() {

  const [locationData, setLocationData] = useState([]); // store the inventory data per location
  const navigation = useNavigate()
  const location = useLocation()
  const shopName = process.env.REACT_APP_TEST_SHOP
  const accessToken = process.env.REACT_APP_TEST_TOKEN

  const [currentLocation, setCurrentLocation] = useState()
  const [transferLocation, setTransferLocation] = useState()
  const [quantity, setQuantity] = useState()

  useEffect(() => {
    console.log(location.state.locationId)
    setCurrentLocation(location.state.locationId)
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
        })
        .catch((error) => {
          console.error("Error fetching inventory data:", error);
        });
    }
    getLocations()
  }, [locationData.length])


  const returnToMainPage = () => {
    navigation('/')
  }

  const handleTransferQuantity = async (event) => {
    event.preventDefault();
    const currentProduct = location.state.variant
    console.log(currentProduct);


    await axios.post("http://127.0.0.1:5000/change-location/",
      {
        shopName,
        accessToken,
        inventoryItemId: currentProduct.inventoryItemId,
        fromLocationId: currentLocation,
        toLocationId: transferLocation,
        quantity: Number(quantity)
      })
      .then(() => {

      }).catch((e) => {
        console.log(e);
      })
  }

  const handleTransferLocation = (locationId) => {
    console.log(locationId);
    setTransferLocation(locationId)
  }
  return (

    <Container>
      <Button onClick={returnToMainPage}>Back</Button>
      <h2>{location.state.productName}</h2>
      <div className="mb-3">
        <h6>Variant overview</h6>
        <div className="row">
          {location.state.variant.variants.map((option, optionIndex) => (
            <div className="col-md-4" key={optionIndex}>
              <strong>{option.name}:</strong> {option.value}
            </div>
          ))}
        </div>
        <div className="row mt-2">
          {location.state.variant.quantities.map((quantity, quantityIndex) => (
            <div className="col-md-3" key={quantityIndex}>
              <strong>{quantity.name}:</strong> {quantity.quantity}
            </div>
          ))}
        </div>
      </div>
      <Form>
        <Form.Group className="mb-3" controlId="formBasicEmail">
          <Form.Label>How many transfare?</Form.Label>
          <Form.Control type="text" placeholder="Quantity" onChange={(e) => setQuantity(e.currentTarget.value)} />
          <Form.Text className="text-muted">
            Enter quantity you want to transfare
          </Form.Text>
        </Form.Group>

        <Form.Group className="mb-3" controlId="formBasicPassword">
          <Form.Label>Locations</Form.Label>
          <Form.Select aria-label="Default select example" onChange={(e) => handleTransferLocation(e.currentTarget.value)}>
            <option>Choose transfer location</option>
            {locationData.map((location) => {
              if (location.id === currentLocation) {
                return
              }
              return (<option key={location.id} value={location.id}>{location.name}</option>)
            })}
          </Form.Select>
        </Form.Group>
        <Form.Group className="mb-3" controlId="formBasicCheckbox">
          <Form.Check type="checkbox" label="Check me out" />
        </Form.Group>
        <Button variant="primary" type="submit" onClick={(e) => handleTransferQuantity(e)}>
          Submit
        </Button>
      </Form>
    </Container>
  )
}

export default ChangeLocation