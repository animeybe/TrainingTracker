import { Header, Footer } from "@/shared/ui";
import { Outlet } from "react-router-dom";
import "./AppLayout.scss";

export const AppLayout = () => {
  return (
    <div className="app-layout">
      <Header />
      <main className="app-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
