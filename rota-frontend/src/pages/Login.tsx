import "../styles/Login.css";
import Layout from "../components/Layout";
import Logo from "../images/rota-azul-medio.png";

export default function Login() {
return (
<Layout>
<div className="login-wrapper">
  <div className="login-card clean"> {/* 'clean' remove borda/sombra */}
    <img className="login-logo" src={Logo} alt="ROTA" />

    <div className="form-head">
      <h2 className="head-left">Entrar</h2>
      <a className="head-right" href="https://projetorota.com.br/cadastro-de-alunos/?redirect_to=https://projetorota.com.br/curso/trilha-de-sustentabilidade/quizzes/questionario-5/">
        Crie a sua conta aqui
      </a>
    </div>

    <form id="tutor-login-form" method="post">
      {/* ... seus <input type="hidden" .../> permanecem iguais ... */}

      <div className="form-field">
        <input
          type="email"
          className="form-control with-icon icon-user"
          placeholder="Endereço de email"
          name="log"
          autoComplete="username"
          required
        />
      </div>

      <div className="form-field">
        <input
          type="password"
          className="form-control with-icon icon-lock"
          placeholder="Senha"
          name="pwd"
          autoComplete="current-password"
          required
        />
      </div>

      <div className="login-error" role="alert" aria-live="polite" />

      <div className="login-aux">
        <label className="form-check">
          <input id="tutor-login-agmnt-1" type="checkbox" className="form-check-input" name="rememberme" value="forever" />
          <span className="form-check-label">Lembrar-me</span>
        </label>

        <a href="https://projetorota.com.br/wp-login.php?action=lostpassword" className="aux-link">
          Esqueceu sua senha?
        </a>
      </div>

      <button type="submit" className="btn btn-primary btn-block">Acessar</button>

      <p className="terms">Termos e Serviços</p>
    </form>
  </div>
</div>

</Layout>
);
}