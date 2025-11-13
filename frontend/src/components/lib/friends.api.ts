// frontend/src/components/lib/friends.api.ts
import { api } from "./api";

export type FriendDTO = {
  _id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  // add fields as needed based on backend response
};

export async function getFriendsReal(): Promise<{ friends: FriendDTO[] }> {
  const res = await api("/api/getfriends");
  // backend returns: { friends: [...] }
  return res.json();
}

export async function addFriendReal(friendEmail: string): Promise<{ message: string }> {
  const res = await api("/api/addfriend", {
    method: "POST",
    body: JSON.stringify({ friendEmail }),
  });
  return res.json();
}

export async function removeFriendReal(friendEmail: string): Promise<{ message: string }> {
  const res = await api("/api/removefriend", {
    method: "POST",
    body: JSON.stringify({ friendEmail }),
  });
  return res.json();
}
