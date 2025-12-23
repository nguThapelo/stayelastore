import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import '../styles/checkout.css';

// Load Stripe with your publishable key (get from Stripe Dashboard)
const stripePromise = loadStripe('pk_test_51ShYRJ4WzqdacyuXUvocbWd7Di0A7suGGpl5LXtU5V4e2akkpesk9k32ZrLJ76tbqTt3l4FKghBP31m5FGMBuJxH00e719MusK');

const CheckoutDialog = ({ cart, total, isOpen, onClose }) => {
    const [loading, setLoading] = useState(false);

    const handleCheckout = async () => {
        setLoading(true);

        try {
            // Prepare line items for Stripe
            const lineItems = cart.map(item => ({
                price_data: {
                    currency: 'zar', // South African Rand
                    product_data: {
                        name: item.title,
                        images: [item.img],
                    },
                    unit_amount: Math.round(item.price * 100), // Convert to cents
                },
                quantity: item.amount,
            }));

            // Call your backend to create checkout session
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ lineItems }),
            });

            const session = await response.json();

            const stripe = await stripePromise;
            const { error } = await stripe.redirectToCheckout({
                sessionId: session.id,
            });

            if (error) {
                console.error('Stripe checkout error:', error);
            }
        } catch (error) {
            console.error('Checkout error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="checkout-overlay">
            <div className="checkout-dialog">
                <div className="checkout-header">
                    <h2>Secure Checkout</h2>
                    <button className="close-checkout" onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className="checkout-summary">
                    <h3>Order Summary</h3>
                    {cart.map((item) => (
                        <div key={item.id} className="checkout-item">
                            <div className="item-info">
                                <img src={item.img} alt={item.title} />
                                <div>
                                    <span>{item.title}</span>
                                    <span>Qty: {item.amount}</span>
                                </div>
                            </div>
                            <span>R{(item.amount * item.price).toLocaleString()}</span>
                        </div>
                    ))}

                    <div className="total-divider"></div>
                    <div className="grand-total">
                        <span>Total:</span>
                        <span>R{total.toLocaleString()}</span>
                    </div>
                </div>

                <div className="checkout-security">
                    <i className="fas fa-lock"></i>
                    <span>Secure payment powered by Stripe</span>
                </div>
                <div className="checkout-methods">
                    <i className="fab fa-cc-visa"></i>
                    <i className="fab fa-cc-mastercard"></i>
                    <i className="fab fa-cc-amex"></i>
                </div>
                <button
                    className="checkout-btn"
                    onClick={handleCheckout}
                    disabled={loading || cart.length === 0}
                >
                    {loading ? (
                        <>
                            <i className="fas fa-spinner fa-spin"></i>
                            Processing...
                        </>
                    ) : (
                        'Pay Now →'
                    )}
                </button>


            </div>
        </div>
    );
};

export default CheckoutDialog;
