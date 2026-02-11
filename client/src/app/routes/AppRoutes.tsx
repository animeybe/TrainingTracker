import { Routes, Route } from "react-router-dom";
import { HomePage } from "@/pages/Home";
import { LoginPage } from "@/pages/Auth/Login";
import { RegisterPage } from "@/pages/Auth/Registration";
import { AppLayout } from "..";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registration" element={<RegisterPage />} />
        <Route path="/" element={<HomePage />} />
      </Route>
    </Routes>
  );
};
