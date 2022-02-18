import React, { Component } from 'react';

class Navbar extends Component {
    render() {
        return (
            <div>
                <nav class="navbar navbar-expand-lg navbar-light bg-light">
                    <div class="container">
                        <a class="navbar-brand fw-bold fs-4" href="#">
                            Stayela Store
                        </a>

                        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                            <span class="navbar-toggler-icon"></span>
                        </button>
                        <div class="collapse navbar-collapse" id="navbarSupportedContent">
                            <ul class="navbar-nav mx-auto mb-2 mb-lg-0">
                                <li class="nav-item">
                                    <a class="nav-link active fw-bold" aria-current="page" href="#Home">Home</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link fw-bold" href="#Specials">Specials</a>
                                </li>
                                <li class="nav-item dropdown">
                                    <a class="nav-link dropdown-toggle fw-bold" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                                        Products
                                    </a>
                                    <ul class="dropdown-menu" aria-labelledby="navbarDropdown">
                                        <li><a class="dropdown-item fw-bold" href="#Fruits">Fruits</a></li>
                                        <li><a class="dropdown-item fw-bold" href="#Vegetables">Vegetables</a></li>
                                        <li><hr class="dropdown-divider"/></li>
                                        <li><a class="dropdown-item fw-bold" href="#Snacks">Snacks</a></li>
                                    </ul>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link fw-bold" href="#Services">Services</a>
                                </li>
                            </ul>
               
                        </div>
                    </div>
                </nav>




            </div>

        )

    }
}

export default Navbar;