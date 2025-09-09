import "../styles/Login.css";
import Layout from "../components/Layout";
export default function Login() {
return (
<Layout>
<div className="login-wrapper">
<div className="login-card">
<h1 className="login-title">Olá, bem-vindo de volta!</h1>


{/* Observação: os campos hidden abaixo reproduzem o fluxo do TutorLMS/WP. */}
<form id="tutor-login-form" method="post">
<input type="hidden" id="_tutor_nonce" name="_tutor_nonce" value="fe80c61999" />
<input type="hidden" name="_wp_http_referer" value="/curso/trilha-de-sustentabilidade/quizzes/questionario-5/" />
<input type="hidden" name="tutor_action" value="tutor_user_login" />
<input type="hidden" name="redirect_to" value="https://projetorota.com.br/curso/trilha-de-sustentabilidade/quizzes/questionario-5/" />
<input type="hidden" name="timezone" value="America/Sao_Paulo" />


<div className="form-field">
<input
type="text"
className="form-control"
placeholder="Usuário ou endereço de e-mail"
name="log"
autoComplete="username"
required
/>
</div>


<div className="form-field">
<input
type="password"
className="form-control"
placeholder="Senha"
name="pwd"
autoComplete="current-password"
required
/>
</div>


<div className="login-error" role="alert" aria-live="polite" />


<div className="login-aux">
<label className="form-check" htmlFor="tutor-login-agmnt-1">
<input id="tutor-login-agmnt-1" type="checkbox" className="form-check-input" name="rememberme" value="forever" />
<span className="form-check-label">Manter logado</span>
</label>


<a href="https://projetorota.com.br/painel/retrieve-password" className="btn btn-ghost">
Forgot Password?
</a>
</div>


<button type="submit" className="btn btn-primary btn-block">Entrar</button>


<p className="signup">
<span>Ainda não tem uma conta?&nbsp;</span>
<a
href="https://projetorota.com.br/cadastro-de-alunos/?redirect_to=https://projetorota.com.br/curso/trilha-de-sustentabilidade/quizzes/questionario-5/"
className="btn btn-link"
>
Registrar agora
</a>
</p>


<p className="lost-password">
<a href="https://projetorota.com.br/wp-login.php?action=lostpassword">Esqueceu sua senha?</a>
</p>
</form>
</div>
</div>
</Layout>
);
}