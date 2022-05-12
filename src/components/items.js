import React from 'react';

const Items = ({ item, handleClick }) => {
    const { title, author, price, img } = item;
    return (
        <div className='cards'>
            <div className='image_container'>
                <img src={img} alt='' />
            </div>
            <div className='details'>
                <p>{title}</p>
                <p>{author}</p>
                <p>Price = R {price}</p>
                <button onClick={() => handleClick(item)}>Add to Cart</button>
            </div>
        </div>
    )
}

export default Items