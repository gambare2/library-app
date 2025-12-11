import { auth } from "./FirebaseConfig";

export async function apiFetch(url: string, options: any = {}) {
  const user = auth.currentUser;

  if (!user) throw new Error("User not logged in");

  const token = await user.getIdToken(true);

  return fetch(url, {
    ...options,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
}
