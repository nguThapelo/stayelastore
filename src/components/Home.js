import React from 'react';
import products from './products';
import Items from './items';
import '../styles/Home.css';

const Home = ({handleClick}) => {

  return (
    <section>
      {products.map((item) => (
        <Items key={item.id} item={item} handleClick={handleClick} />
      ))}
    </section>
  )
}

export default Home;