// import { useTheme } from "@/shared/hooks/useTheme";
import { Header } from "@/shared/ui";

export function HomePage() {
  // const { theme, toggleTheme } = useTheme();

  return (
    <>
      <div className="wrapper">
        <Header />
        <main className="content"></main>
      </div>
    </>
  );
}
