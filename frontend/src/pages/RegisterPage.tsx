import { Link, useNavigate } from "react-router-dom";

import { AuthForm } from "../components/AuthForm";

export function RegisterPage() {
  const navigate = useNavigate();
  return (
    <div className="nv-auth-wrap">
      <AuthForm mode="register" onSuccess={() => navigate("/notes")} />
      <p className="nv-muted nv-auth-foot">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  );
}
