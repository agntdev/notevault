import { Link, useNavigate } from "react-router-dom";

import { AuthForm } from "../components/AuthForm";

export function LoginPage() {
  const navigate = useNavigate();
  return (
    <div className="nv-auth-wrap">
      <AuthForm mode="login" onSuccess={() => navigate("/notes")} />
      <p className="nv-muted nv-auth-foot">
        New here? <Link to="/register">Create an account</Link>
      </p>
    </div>
  );
}
