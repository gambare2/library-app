import axios from "axios";

const API_URL = "http://192.168.1.5:3000/api"; 
// 👆 replace with your LAN IP / production domain

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});
