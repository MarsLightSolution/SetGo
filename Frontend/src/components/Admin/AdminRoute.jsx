import { Navigate } from "react-router-dom";

function AdminRoute({ children }) {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("userData"));
  } catch {
    user = null; // corrupt/missing value -> treat as logged out
  }
  // The API returns the lowercase `role` field (User schema: user | seller | admin).
  // This used to check `Role`, which no longer exists, so every admin was redirected home.

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/" />; // send non-admins to home
  }

  return children;
}

export default AdminRoute;
