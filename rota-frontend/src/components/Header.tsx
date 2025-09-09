import { useState } from "react";
import "../styles/Header.css";
import LogoRota from "../images/LogoRotaHeader.png";
import { Home, GraduationCap, Users, MessageSquare, Search, Menu, X } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <header id="masthead" className="site-header">
      <div className="site-header-container">

        {/* Logo */}
        <div id="site-logo" className="site-branding">
          <Link to="/" rel="home" onClick={closeMobile}>
            <img
              fetchPriority="high"
              width={180}
              src={LogoRota}
              className="bb-logo"
              alt="Logo Projeto Rota"
              decoding="async"
            />
          </Link>
        </div>

        {/* Botão hambúrguer – só mobile */}
        <button
          type="button"
          className="mobile-toggle"
          aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Navegação (desktop) */}
        <nav id="site-navigation" className="main-navigation desktop-nav">
          <ul className="primary-menu">
            <li className="menu-item">
              <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : undefined)}>
                <Home size={18} />
                <span>Home</span>
              </NavLink>
            </li>
            <li className="menu-item current-menu-item">
              <NavLink to="/trilhas" className={({ isActive }) => (isActive ? "active" : undefined)}>
                <GraduationCap size={18} />
                <span>Trilhas</span>
              </NavLink>
            </li>
            <li className="menu-item">
              <NavLink to="/membros" className={({ isActive }) => (isActive ? "active" : undefined)}>
                <Users size={18} />
                <span>Membros Enactus</span>
              </NavLink>
            </li>
            <li className="menu-item">
              <NavLink to="/forum" className={({ isActive }) => (isActive ? "active" : undefined)}>
                <MessageSquare size={18} />
                <span>Fóruns</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* Ações (desktop) */}
        <div className="header-aside desktop-actions">
          <button type="button" className="header-search-link" aria-label="Procurar">
            <Search size={18} />
          </button>
          <span className="search-separator"></span>
          <div className="bb-header-buttons">
            <Link to="/login" className="signin-button">Entrar</Link>
            <Link to="/registro" className="signup">Inscrever-se</Link>
          </div>
        </div>
      </div>

      {/* Overlay do mobile */}
<div className={`mobile-overlay ${mobileOpen ? "open" : ""}`} onClick={closeMobile}></div>

{/* Menu lateral mobile */}
<nav className={`mobile-nav-drawer ${mobileOpen ? "open" : ""}`} aria-hidden={!mobileOpen}>
  <button type="button" className="close-btn" onClick={closeMobile}>
    <X size={22} />
  </button>
  <ul className="mobile-menu">
  <li><NavLink to="/" end onClick={closeMobile} className={({isActive})=>isActive?'active':undefined}><Home size={18}/><span>Home</span></NavLink></li>
  <li><NavLink to="/trilhas" onClick={closeMobile} className={({isActive})=>isActive?'active':undefined}><GraduationCap size={18}/><span>Trilhas</span></NavLink></li>
  <li><NavLink to="/membros" onClick={closeMobile} className={({isActive})=>isActive?'active':undefined}><Users size={18}/><span>Membros Enactus</span></NavLink></li>
  <li><NavLink to="/forum" onClick={closeMobile} className={({isActive})=>isActive?'active':undefined}><MessageSquare size={18}/><span>Fóruns</span></NavLink></li>
</ul>

  <div className="mobile-actions">
    <NavLink to="/login" className="signin-button" onClick={closeMobile}>Entrar</NavLink>
    <NavLink to="/registro" className="signup" onClick={closeMobile}>Inscrever-se</NavLink>
  </div>
</nav>

    </header>
  );
}
