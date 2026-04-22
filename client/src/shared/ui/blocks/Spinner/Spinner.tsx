// shared/ui/components/Spinner/Spinner.tsx
import "./Spinner.scss";

type Props = {
  size?: "sm" | "md" | "lg";
};

export function Spinner({ size = "md" }: Props) {
  return (
    <div className={`spinner spinner_${size}`}>
      <div className="spinner__ring spinner__ring_1" />
      <div className="spinner__ring spinner__ring_2" />
      <div className="spinner__ring spinner__ring_3" />
    </div>
  );
}
