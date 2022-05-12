import React from 'react';
import '../styles/navbar.css';

const Navbar = () => {
    return (
        <nav>
            <div className='nav_container'>
                <span className='store'>
                    Stayela Store
                </span>
                <div className='cart'>
                    <span>
                        <i class='fas fa-cart-plus'></i>
                    </span>
                    <span>0</span>
                </div>


            </div>
        </nav>

    );
}

export default Navbar;