import '../styles/navbar.css';

const Navbar = ({ setShow, size }) => {
    return (
        <nav className="navbar">
            <div className="nav-container">
                <div className="nav-brand" onClick={() => setShow(true)}>
                    <span className="brand-icon">🛍️</span>
                    <span className="brand-name">Stayela Store</span>
                </div>
                
                <div className="nav-actions">
                    <div className="cart-icon" onClick={() => setShow(false)}>
                        <i className="fas fa-shopping-cart"></i>
                        {size > 0 && (
                            <span className="cart-badge">{size}</span>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
