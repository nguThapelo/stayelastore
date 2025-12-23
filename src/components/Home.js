import '../styles/Home.css';
import Items from './items';
import products from './products';

const Home = ({ handleClick }) => {
    return (
        <section className="home-section">
            {/* <div className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">Discover Stayela Store</h1>
                    <p className="hero-subtitle">
                        Premium products at unbeatable prices. 
                        Shop now and elevate your style!
                    </p>
                </div>
            </div> */}

            <div className="products-section">
                <div className="section-header">
                    {/* <h2 className="section-title">Featured Products</h2> */}
                    <p className="section-subtitle">{products.length} items available</p>
                </div>

                <div className="products-grid">
                    {products.map(item => (
                        <Items key={item.id} item={item} handleClick={handleClick} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Home;
