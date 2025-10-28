export type Member = {
  id: number;
  full_name: string;
  role: string | null;
  bio: string | null;
  order_index: number;
  photo_path?: string | null;
  photo_url: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type MembersResponse = {
  total: number;
  members: Member[];
};
