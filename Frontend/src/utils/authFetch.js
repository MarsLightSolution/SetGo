const SERVER = import.meta.env.VITE_SERVER;

// Access tokens last 15 minutes; the refresh cookie lasts 7 days. On a 401, renew the access token
// once from the cookie and retry, so a logged-in user isn't bounced to the login page mid-checkout.
export async function authFetch(path, options = {}, allowRefresh = true) {
  const res = await fetch(`${SERVER}${path}`, {
    ...options,
    credentials: "include",
    headers: { ...options.headers, Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
  });
  if (res.status !== 401 || !allowRefresh) return res;

  const refreshed = await fetch(`${SERVER}/refreshAccessToken`, { method: "POST", credentials: "include" });
  const body = await refreshed.json().catch(() => ({}));
  if (!refreshed.ok || !body.accessToken) return res;
  localStorage.setItem("accessToken", body.accessToken);
  return authFetch(path, options, false);
}
