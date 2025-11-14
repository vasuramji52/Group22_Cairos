// frontend/src/components/lib/friends.api.ts
import { api } from "./api";

export type FriendDTO = {
  _id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  // add fields as needed based on backend response
};

export type FriendsResponse = {
  friends: FriendDTO[];
  sentRequests: FriendDTO[];
  receivedRequests: FriendDTO[];
};

export async function getFriendsReal(): Promise<FriendsResponse> {
  const token = localStorage.getItem("token_data");
  // backend returns: { friends: [...] }
  const res = await api("/api/getfriends", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
}

export async function acceptFriendReal(requesterId: string) {
  const token = localStorage.getItem("token_data");

  const res = await api("/api/acceptfriend", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ requesterId }),
  });

  return res.json();
}

export async function declineFriendReal(requesterId: string) {
  const token = localStorage.getItem("token_data");

  const res = await api("/api/declinefriend", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ requesterId }),
  });

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
