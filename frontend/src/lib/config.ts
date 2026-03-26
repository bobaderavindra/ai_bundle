export const config = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:8088/api",
  stockWsUrl: (import.meta.env.VITE_STOCK_WS_URL as string) || ""
};
