export type Trilha = {
  id: string;
  name: string;
  thumbnail_url: string;
  author?: string;
  rating?: number;          // 0..5
  botaoLabel?: string;      // opcional
};