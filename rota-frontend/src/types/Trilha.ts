export type Trilha = {
  id: string;
  name: string;
  thumbnail_url: string;
  author?: string;
  review?: number;          // 0..5
  botaoLabel?: string;      // opcional
  requirements?: string[];  
  targetAudience?: string[]; 
  includedItems?: string[];
};