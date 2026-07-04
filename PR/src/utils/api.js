const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getToken = () => localStorage.getItem("token");

const request = async (endpoint, options = {}) => {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null);

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && (data.message || data.error)) ||
      "Request failed";
    throw new Error(message);
  }

  return data;
};

export const api = {
  get: async (endpoint) => request(endpoint, { method: "GET" }),
  post: async (endpoint, body) => request(endpoint, { method: "POST", body: JSON.stringify(body) }),
  put: async (endpoint, body) => request(endpoint, { method: "PUT", body: JSON.stringify(body) }),
  delete: async (endpoint) => request(endpoint, { method: "DELETE" }),
};
