import { useState } from 'react';
import Home from './components/Home';
import Navbar from './components/Navbar';
import Cart from './components/cart';



const App = () => {
  const [show, setShow] = useState(true);
  const [cart, setCart] = useState([]);

  const handleClick = (item) => {
    if (cart.indexOf(item) !== -1) return;
    setCart([...cart, item])
  };

  const handleChange = (item, d) => {
    const i = cart.indexOf(item);
    const arr = cart;
    arr[i].amount += d;
  
  if(arr[i].amount === 0) arr[i].amount = 1;
  setCart([...arr]);
  
  };


  return (
    <div>
      <Navbar setShow={setShow} size={cart.length} />
      {show ? ( <Home handleClick={handleClick} /> )
       : ( <Cart cart={cart} handleChange={handleChange} /> )}
    </div>
  );
}

export default App;
