import { useState } from 'react';
import '../styles/items.css';

const Items = ({ item, handleClick }) => {
    const { title, author, price, img } = item;
    const [showModal, setShowModal] = useState(false);

    const handleAddToCart = () => {
        handleClick(item);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
    };

    return (
        <>
            <div className="product-card">
                <div className="product-image">
                    <img src={img} alt={title} />
                    <div className="image-overlay">
                        <button className="add-to-cart-btn" onClick={handleAddToCart}>
                            <i className="fas fa-cart-plus"></i>
                            Add to Cart
                        </button>
                    </div>
                </div>
                
                <div className="product-info">
                    <h3 className="product-title">{title}</h3>
                    <p className="product-author">by {author}</p>
                    <div className="product-price">
                        <span className="price">R {price}</span>
                    </div>
                </div>
            </div>

            {/* Success Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="success-icon">✅</div>
                            <h2>Added to Cart!</h2>
                            <button className="close-btn" onClick={closeModal}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <div className="modal-body">
                            <div className="modal-product-preview">
                                <img src={img} alt={title} className="modal-img" />
                                <div className="modal-product-info">
                                    <h3>{title}</h3>
                                    <p className="modal-author">by {author}</p>
                                    <p className="modal-price">R {price}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="modal-footer">
                            <button className="continue-shopping-btn" onClick={closeModal}>
                                Continue Shopping
                            </button>
                            {/* <button className="view-cart-btn" onClick={() => {
                                closeModal();
                                // Trigger cart view - adjust based on your app structure
                                window.dispatchEvent(new CustomEvent('showCart'));
                            }}>
                                View Cart (R {price})
                            </button> */}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Items;
