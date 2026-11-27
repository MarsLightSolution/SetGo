// Every request to our own server (VITE_SERVER) carries the login: the refresh cookie
// (credentials) and, when the call doesn't set one, `Authorization: Bearer <accessToken>`.
// On a 401 the access token is renewed once from the cookie and the request retried.
// The secured /api/v2 routes take the user from that login, never from ids in the request.
// Requests to other hosts are left untouched.
import axios from "axios";
import axiosInstance from "../Hooks/axiosInstance";

const SERVER = (import.meta.env.VITE_SERVER || "").replace(/\/$/, "");
const REFRESH_PATH = "/refreshAccessToken";
const SKIP_PATHS = ["/login", "/signup", REFRESH_PATH];

const isOurServer = (url) => !!SERVER && typeof url === "string" && url.startsWith(SERVER);
const isSkipped = (url) => SKIP_PATHS.some((p) => url.startsWith(`${SERVER}${p}`));
const storedToken = () => {
  try {
    const t = localStorage.getItem("accessToken");
    return t && t !== "undefined" && t !== "null" ? t.replace(/^Bearer\s+/i, "") : null;
  } catch {
    return null;
  }
};

const nativeFetch = typeof window !== "undefined" ? window.fetch.bind(window) : null;

// One refresh at a time: the server rotates refresh tokens, so parallel refreshes would race.
let refreshing = null;
export function refreshAccessToken() {
  if (!refreshing) {
    refreshing = nativeFetch(`${SERVER}${REFRESH_PATH}`, { method: "POST", credentials: "include" })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok || !body.accessToken) return null;
        const token = String(body.accessToken).replace(/^Bearer\s+/i, "");
        localStorage.setItem("accessToken", token);
        return token;
      })
      .catch(() => null)
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

// ---- fetch ----
const hasAuthHeader = (headers) => {
  if (!headers) return false;
  if (headers instanceof Headers) return headers.has("Authorization");
  return Object.keys(headers).some((k) => k.toLowerCase() === "authorization");
};

// init with credentials and, if `force` or the caller set none, our Authorization header.
const withLogin = (init, token, force) => {
  const headers = new Headers(init.headers || {});
  if (token && (force || !hasAuthHeader(init.headers))) headers.set("Authorization", `Bearer ${token}`);
  return { ...init, headers, credentials: init.credentials || "include" };
};

function installFetch() {
  if (!nativeFetch || window.fetch.__serverAuth) return;
  const wrapped = async (input, init = {}) => {
    if (typeof input !== "string" || !isOurServer(input) || isSkipped(input)) return nativeFetch(input, init);
    const res = await nativeFetch(input, withLogin(init, storedToken(), false));
    if (res.status !== 401) return res;
    const token = await refreshAccessToken();
    return token ? nativeFetch(input, withLogin(init, token, true)) : res;
  };
  wrapped.__serverAuth = true;
  window.fetch = wrapped;
}

// ---- axios ----
const fullUrl = (config) =>
  config.baseURL && !/^https?:/i.test(config.url || "") ? `${config.baseURL}${config.url || ""}` : config.url;

function installAxios(instance) {
  instance.interceptors.request.use((config) => {
    const url = fullUrl(config);
    if (!isOurServer(url) || isSkipped(url)) return config;
    config.withCredentials = true;
    const token = storedToken();
    const current = config.headers?.Authorization || config.headers?.authorization;
    if (token && !current) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  instance.interceptors.response.use(undefined, async (error) => {
    const config = error.config;
    const url = config && fullUrl(config);
    if (error.response?.status !== 401 || !config || config.__retried || !isOurServer(url) || isSkipped(url)) {
      throw error;
    }
    const token = await refreshAccessToken();
    if (!token) throw error;
    config.__retried = true;
    config.headers.Authorization = `Bearer ${token}`;
    return instance(config);
  });
}

let installed = false;
export function installServerAuth() {
  if (installed) return;
  installed = true;
  installFetch();
  installAxios(axios);
  installAxios(axiosInstance);
}

// ---- socket.io ----
// `auth` callback for io(): read on every (re)connect, so it always sends the current token.
export const socketAuth = (cb) => {
  const token = storedToken();
  cb(token ? { token: `Bearer ${token}` } : {});
};

// The server rejects a handshake with an expired token: renew it once and reconnect.
export const reconnectAfterTokenRefresh = (socket) => {
  let tried = false;
  socket.on("connect", () => {
    tried = false;
  });
  socket.on("connect_error", async (err) => {
    if (tried || !/token|authentication/i.test(err?.message || "")) return;
    tried = true;
    if (await refreshAccessToken()) socket.connect();
  });
  return socket;
};
