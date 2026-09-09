import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth";
import AuthPage from "./pages/AuthPage";
import CustomerPage from "./pages/CustomerPage";
import DriverPage from "./pages/DriverPage";
import AdminPage from "./pages/AdminPage";

const Guard = ({ roles, children }) => {
  const { user } = useAuth();
  if (!user?.token) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    const home = user.role === "driver" ? "/driver" : user.role === "admin" ? "/admin" : "/app";
    return <Navigate to={home} replace />;
  }
  return children;
};

export default function App() {
  const { user } = useAuth();
  const home =
    user?.role === "driver" ? "/driver" : user?.role === "admin" ? "/admin" : user ? "/app" : "/login";

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={home} replace /> : <AuthPage mode="login" />} />
      <Route path="/register" element={user ? <Navigate to={home} replace /> : <AuthPage mode="register" />} />
      <Route
        path="/app"
        element={
          <Guard roles={["customer"]}>
            <CustomerPage />
          </Guard>
        }
      />
      <Route
        path="/driver"
        element={
          <Guard roles={["driver"]}>
            <DriverPage />
          </Guard>
        }
      />
      <Route
        path="/admin"
        element={
          <Guard roles={["admin"]}>
            <AdminPage />
          </Guard>
        }
      />
      <Route path="*" element={<Navigate to={home} replace />} />
    </Routes>
  );
}
