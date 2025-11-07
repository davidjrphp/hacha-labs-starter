import { Navigate } from "react-router-dom";
export default function Protected({children}){
  const authed = document.cookie.includes('PHPSESSID'); // naive dev-only
  return authed ? children : <Navigate to="/login" replace/>;
}
