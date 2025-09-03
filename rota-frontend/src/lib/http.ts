import axios from "axios";

export const http = axios.create({
  baseURL: import.meta.env.API_BASE_URL,
  withCredentials: true, // <- envia e recebe cookies
});