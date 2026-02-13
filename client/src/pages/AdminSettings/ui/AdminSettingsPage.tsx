import "./AdminSettingsPage.scss";
import { useAuthContext } from "@/shared/store/auth/auth-context";

export const AdminSettingsPage = () => {
  const { user } = useAuthContext();

  return (
    <div style={{ padding: "2rem", fontSize: "1.5rem" }}>
      🔥 АДМИН СТРАНИЦА РАБОТАЕТ!
      <br />
      Role: <strong>{user?.role}</strong>
      <br />
      Login: <strong>{user?.login}</strong>
    </div>
  );
};
