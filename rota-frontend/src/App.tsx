import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AuthGate from "./components/AuthGate";
import Trails from "./pages/Trails";
import CourseDetails from "./pages/TrailDetails";
// import Members from "./pages/Members";
import Forum from "./pages/Forum";
import Trail from "./pages/Trail";
import Certificate from "./pages/Certificate";
import UserPanel from "./pages/UserPanel";
import Profile from "./pages/Profile";



export default function App() {
  return (
    <>
      <AuthGate />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />
        <Route path="/trilhas" element={<Trails />} />
        <Route path="/trail-details/:id" element={<CourseDetails />} />
        <Route path="/trilha/:trailId/aula/:itemId" element={<Trail />} />
        <Route path="/certificados" element={<Certificate />} />
        <Route path="/foruns/*" element={<Forum />} />
        <Route path="/painel" element={<UserPanel />} />
        <Route path="/perfil" element={<Profile />} />
        {/* <Route path="/membros" element={<Members />} /> */}
      </Routes>
    </>
  );
}
