import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
// import Register from "./pages/Register";
// import Trails from "./pages/Trails";
// import Members from "./pages/Members";
// import Forum from "./pages/Forum";
// import Trail from "./pages/Trail";



export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        {/* 
        <Route path="/membros" element={<Members />} />
        <Route path="/registro" element={<Register />} />
        <Route path="/trilhas" element={<Trails />} />
        <Route path="/forum" element={<Forum />} />
        <Route path="/trilha/:id" element={<Trail />} /> */}
      </Routes>
    </>
  );
}
