import { useEffect, useState } from 'react';
import '../styles/cart.css';

const Cart = ({ cart, setCart, handleChange }) => {
    const [price, setPrice] = useState(0);

    const handleRemove = (id) => {
        const arr = cart.filter((item) => item.id !== id);
        setCart(arr);
        handlePrice();
    };

    const handlePrice = () => {
        let amo = 0;
        cart.map((item) => (amo += item.amount * item.price));
        setPrice(amo);
    };

    useEffect(() => {
        handlePrice();
    }, [cart]);

    const handleCheckout = () => {
        // Navigate to checkout page or trigger checkout logic
        console.log('Proceeding to checkout with total:', price);
        // Example: window.location.href = '/checkout';
    };

    if (cart.length === 0) {
        return (
            <div className="empty-cart">
                <h2>Your cart is empty</h2>
                <p>Add some items to get started!</p>
            </div>
        );
    }

    return (
        <div className="cart-container">
            <div className="cart-header">
                <h1>Shopping Cart</h1>
                <span className="cart-count">{cart.length} items</span>
            </div>

            <div className="cart-items">
                {cart.map((item) => (
                    <div className="cart-card" key={item.id}>
                        <div className="cart-image">
                            <img src={item.img} alt={item.title} />
                        </div>
                        
                        <div className="cart-details">
                            <h3>{item.title}</h3>
                            <p className="item-price">R{item.price}</p>
                        </div>

                        <div className="quantity-controls">
                            <button 
                                onClick={() => handleChange(item, -1)}
                                className="qty-btn qty-minus"
                            >
                                -
                            </button>
                            <span className="qty-display">{item.amount}</span>
                            <button 
                                onClick={() => handleChange(item, 1)}
                                className="qty-btn qty-plus"
                            >
                                +
                            </button>
                        </div>

                        <div className="item-total">
                            <span>R{(item.amount * item.price).toLocaleString()}</span>
                            <button 
                                onClick={() => handleRemove(item.id)}
                                className="remove-btn"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="cart-footer">
                <div className="total-section">
                    <span>Total Price</span>
                    <span className="total-price">R{price.toLocaleString()}</span>
                </div>
                <button className="checkout-btn" onClick={handleCheckout}>
                    Proceed to Checkout →
                </button>
            </div>
        </div>
    );
};

export default Cart;
