export type PostType =
  | "novidade"
  | "bugfix"
  | "melhoria"
  | "seguranca"
  | "alerta";

export interface IPost {
  id: number;
  title: string;
  type: PostType;
  version: string;
  date: string;
  content: string;
}

export type CreatePostInput = Omit<IPost, "id">;
