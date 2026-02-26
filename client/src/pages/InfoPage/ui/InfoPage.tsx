import "./InfoPage.scss";
import type { InfoPageProps } from "../models/types";

export function InfoPage(props: InfoPageProps) {
  return (
    <>
      <div className="info-content">
        {props.type !== "error"
          ? props.type
          : `${props.type}: Причина ошибки: ${props.errorText}`}
      </div>
    </>
  );
}
