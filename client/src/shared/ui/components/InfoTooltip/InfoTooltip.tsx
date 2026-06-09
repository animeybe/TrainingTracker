import "./InfoTooltip.scss";

interface InfoTooltipProps {
  message: string;
}

export function InfoTooltip({ message }: InfoTooltipProps) {
  return (
    <span className="info-tooltip" tabIndex={0} role="tooltip">
      <span className="info-tooltip__icon">ⓘ</span>
      <span className="info-tooltip__popup">{message}</span>
    </span>
  );
}
