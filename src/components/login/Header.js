import React from 'react';
import logo from '../../image/Pintumex.png';

function Header({ onLoginClick }) {
  return (
    <header className="container">
      <a href="#" className="logo">
        <img src={logo} alt="Pintumex Logo" />
      </a>
      <ul>
        <li><a href="">inicio</a></li>
        <li><a href="">nosotros</a></li>
        <li><a href="">servicios</a></li>
        <li><a href="">contacto</a></li>
        <li><a onClick={onLoginClick} className="login" href="#">Sing up</a></li>
      </ul>
    </header>
  );
}

export default Header;