// lib/utils/premium/premium.ts
import toast from "react-hot-toast";

export function isPremium(role?: string | null): boolean {
  return role === "PREMIUM" || role === "ADMIN";
}

export function requirePremium(role?: string | null): boolean {
  if (!isPremium(role)) {
    toast("👑 Эта функция доступна только PREMIUM-пользователям", {
      icon: "👑",
      style: {
        background: "linear-gradient(135deg, #1a1a2e, #16213e)",
        color: "#ffd700",
        border: "1px solid #ffd700",
        borderRadius: "12px",
        fontWeight: 600,
      },
      duration: 3000,
      position: "bottom-right",
    });
    return false;
  }
  return true;
}
