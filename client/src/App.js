import logo from './logo.svg';
import './App.css';
import LocationInventory from './Pages/LocationInventory/LocationInventory.jsx'
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom'


function App() {
  return (
    <div className="App">
        <BrowserRouter> 
          <Routes>
            <Route path="/" element={<LocationInventory/>}/>
          </Routes>
      </BrowserRouter> 
    </div>
  );
}

export default App;
