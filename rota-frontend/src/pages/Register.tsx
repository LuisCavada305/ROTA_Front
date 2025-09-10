import "../styles/Login.css";
import Layout from "../components/Layout";
import Logo from "../images/rota-azul-medio.png";
import { NavLink } from "react-router-dom";
import { useState } from "react";
import { http } from "../lib/http";
import axios from "axios";
import CookieError from "../components/CookieErrorPopup";

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name_for_certificate, setNameForCertificate] = useState("");
    const [social_name, setSocialName] = useState("");
    const [username, setUsername] = useState("");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [birthday, setBirthday] = useState("");
    const [agree, setAgree] = useState(false);

    // Função de submit
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErr(null);
        setLoading(true);

        const payload = {
            email: email.trim(),
            password,
            name_for_certificate,
            birthday,
            social_name,
            username
        };

        try {
        const res = await http.post("/auth/login", payload, { withCredentials: true });
        console.log("Login OK:", res.data);
        window.location.href = "/"; // redireciona para a home
        } catch (error) {
        if (axios.isAxiosError(error)) {
            setErr((error.response?.data as any)?.message || "Falha no login");
        } else {
            setErr("Erro inesperado. Tente novamente.");
        }
        } finally {
        setLoading(false);
        }
    };

    return (
        <Layout>
        <div className="login-wrapper">
            <div className="login-card clean">
            <img className="login-logo" src={Logo} alt="ROTA" />

            <CookieError />
            <div className="form-head">
                <h2 className="head-left">Crie sua conta</h2>
                <NavLink className="head-right" to="/login">
                    Já tenho uma conta
                </NavLink>
            </div>

            <form id="tutor-login-form" method="post" onSubmit={handleSubmit}>
                                <div className="form-field">
                                    <input
                                        type="text"
                                        className="form-control with-icon icon-user"
                                        placeholder="Nome social"
                                        name="social_name"
                                        autoComplete="name"
                                        required
                                        value={social_name}
                                        onChange={(e) => setSocialName(e.target.value)}
                                    />
                                </div>

                                <div className="form-field">
                                    <input
                                        type="text"
                                        className="form-control with-icon icon-user"
                                        placeholder="Nome de usuário"
                                        name="username"
                                        autoComplete="username"
                                        required
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>

                                <div className="form-field">
                                    <input
                                        type="email"
                                        className="form-control with-icon icon-user"
                                        placeholder="Endereço de email"
                                        name="log"
                                        autoComplete="username"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>

                                <div className="form-field">
                                    <input
                                        type="text"
                                        className="form-control with-icon icon-user"
                                        placeholder="Nome para certificado"
                                        name="name_for_certificate"
                                        autoComplete="name"
                                        required
                                        value={name_for_certificate}
                                        onChange={(e) => setNameForCertificate(e.target.value)}
                                    />
                                </div>

                                <div className="form-field">
                                    <input
                                        type="date"
                                        className="form-control with-icon icon-lock"
                                        placeholder="Data de nascimento"
                                        name="birthday"
                                        autoComplete="bday"
                                        required
                                        value={birthday}
                                        onChange={(e) => setBirthday(e.target.value)}
                                    />
                                </div>

                                <div className="form-field" style={{ position: "relative" }}>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="form-control with-icon icon-lock"
                                        placeholder="Senha"
                                        name="pwd"
                                        autoComplete="current-password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        style={{ paddingRight: "2.5rem" }}
                                    />
                                    <span
                                        onClick={() => setShowPassword((v) => !v)}
                                        style={{
                                            position: "absolute",
                                            right: "10px",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            cursor: "pointer",
                                            fontSize: "1.2rem",
                                            color: "#888"
                                        }}
                                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                                    >
                                        {showPassword ? "🙈" : "👁️"}
                                    </span>
                                </div>
                
                <div className="login-aux">
                    <label className="form-check">
                        <input
                        id="tutor-login-agmnt-1"
                        type="checkbox"
                        className="form-check-input"
                        name="agree"
                        checked={agree}
                        onChange={(e) => setAgree(e.target.checked)}
                        />
                        <span className="form-check-label">Concordo com o Termos e Serviços</span>
                    </label>
                </div>
            
                {err && <div className="login-error" role="alert" aria-live="polite">{err}</div>}

                <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? "Processando..." : "Criar conta"}
                </button>


                <p className="terms">Termos e Serviços</p>
            </form>
            </div>
        </div>
        </Layout>
    );
}
