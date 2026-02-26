export interface InfoPagePropsNoMsg {
  type: "loading" | "404";
}

export interface InfoPagePropsWithMsg {
  type: "error";
  errorText?: string;
}

export type InfoPageProps = InfoPagePropsNoMsg | InfoPagePropsWithMsg;
