import { Navigate } from "react-router-dom";

function AdminRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("userData")); 
  // assume user object contains { role: "admin" }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user.Role !== "admin") {
    return <Navigate to="/" />; // send non-admins to home
  }

  return children;
}

export default AdminRoute;
