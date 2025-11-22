import { Outlet } from "react-router-dom";
import NavbarX from "./Navbar.jsx";
import Footer from "./Footer.jsx";

export default function PublicShell({ theme, setTheme }) {
  return (
    <>
      <NavbarX theme={theme} setTheme={setTheme} />
      <Outlet />
      <Footer />
    </>
  );
}
