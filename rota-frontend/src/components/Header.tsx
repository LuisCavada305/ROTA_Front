import { useEffect, useRef, useState } from "react";
import "../styles/Header.css";
import LogoRota from "../images/LogoRotaHeader.png";
import { Home, GraduationCap, Users, MessageSquare, Search, Menu, X, ChevronDown } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import Avatar from "../components/Avatar";
import { useAuth } from "../hooks/useAuth";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const { user, loading, logout } = useAuth();

  const closeMobile = () => setMobileOpen(false);

  // Fecha menu do usuário ao clicar fora
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

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
          onClick={() => setMobileOpen(v => !v)}
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
              <NavLink to="/foruns" className={({ isActive }) => (isActive ? "active" : undefined)}>
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

          {/* Render condicional: se tem user → mostra menu do usuário. Senão → Entrar/Inscrever-se */}
          {!loading && user ? (
            <div className="user-menu" ref={userMenuRef}>
              <button
                className="user-button"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                onClick={() => setUserMenuOpen(v => !v)}
              >

                <span className="user-name">{user.username}</span>
                <Avatar name={user.username} src={user.profile_pic_url ?? null} />
                <ChevronDown size={16} className="chev" />
              </button>
              {userMenuOpen && (
                <div className="user-dropdown" role="menu">
                  <NavLink to="/painel" onClick={() => setUserMenuOpen(false)} role="menuitem">Painel</NavLink>
                  <NavLink to="/perfil" onClick={() => setUserMenuOpen(false)} role="menuitem">Perfil</NavLink>
                  <NavLink to="/conta"  onClick={() => setUserMenuOpen(false)} role="menuitem">Conta</NavLink>
                  <button type="button" onClick={logout} className="logout-btn" role="menuitem">Sair</button>
                </div>
              )}
            </div>
          ) : (
            <div className="bb-header-buttons">
              <Link to="/login" className="signin-button">Entrar</Link>
              <Link to="/registro" className="signup">Inscrever-se</Link>
            </div>
          )}
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
          <li><NavLink to="/foruns" onClick={closeMobile} className={({isActive})=>isActive?'active':undefined}><MessageSquare size={18}/><span>Fóruns</span></NavLink></li>
        </ul>

        {/* Ações no drawer (mobile): também condicional */}
        <div className="mobile-actions">
          {!loading && user ? (
            <div className="user-block">
              <div className="user-inline">
                <Avatar name={user.username} src={user.profile_pic_url} size={32}/>
                <div className="user-inline-name">{user.username}</div>
              </div>
              <NavLink to="/painel" onClick={closeMobile}>Painel</NavLink>
              <NavLink to="/perfil" onClick={closeMobile}>Perfil</NavLink>
              <NavLink to="/conta"  onClick={closeMobile}>Conta</NavLink>
              <button type="button" onClick={() => { logout(); closeMobile(); }} className="logout-btn">Sair</button>
            </div>
          ) : (
            <>
              <NavLink to="/login" className="signin-button" onClick={closeMobile}>Entrar</NavLink>
              <NavLink to="/registro" className="signup" onClick={closeMobile}>Inscrever-se</NavLink>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
