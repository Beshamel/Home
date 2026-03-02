import axios from "axios"

export const API_BASE_URL = import.meta.env.PROD
  ? "http://localhost:8080"
  : "http://localhost:8081"

const queryClient = axios.create({
  baseURL: API_BASE_URL,
})

export default queryClient
