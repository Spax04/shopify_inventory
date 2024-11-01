import logo from './logo.svg';
import './App.css';
import LocationInventory from './Pages/LocationInventory.jsx'
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom'
import ChangeLocation from './Pages/ChangeLocation.jsx';


function App() {
  return (
    <div className="App">
        <BrowserRouter> 
          <Routes>
          <Route path="/" element={<LocationInventory />} />
          <Route path="/change-location-quantity" element={<ChangeLocation/>}/>

          </Routes>
      </BrowserRouter> 
    </div>
  );
}

export default App;
