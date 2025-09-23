import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AuthGate from "./components/AuthGate";
import Trails from "./pages/Trails";
import CourseDetails from "./pages/TrailDetails";
// import Members from "./pages/Members";
// import Forum from "./pages/Forum";
import Trail from "./pages/Trail";



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
        {/* 
        <Route path="/membros" element={<Members />} />
        
        
        <Route path="/forum" element={<Forum />} />
         */}
      </Routes>
    </>
  );
}
