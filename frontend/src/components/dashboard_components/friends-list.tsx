import React, { useEffect, useMemo, useState } from "react";
import { UserPlus, Trash2, Search, Users } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { EgyptianBorder, PapyrusCard, AnkhIcon } from "./egyptian-decorations";
import { toast } from "sonner";

// ⬇️ Use the real API helpers (you'll need the file friends.api.ts as discussed)
import {
  getFriendsReal,
  addFriendReal,
  removeFriendReal,
  type FriendDTO,
} from "../lib/friends.api";

// A simple UI shape we control regardless of backend fields
type UIFriend = {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  nickname: string; // display name in list
};

export function FriendsList() {
  const [friends, setFriends] = useState<UIFriend[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [newFriendEmail, setNewFriendEmail] = useState("");
  const [addingFriend, setAddingFriend] = useState(false);

  const [deleting, setDeleting] = useState<{ id: string; email: string } | null>(null);

  useEffect(() => {
    void loadFriends();
  }, []);

  async function loadFriends() {
    setLoading(true);
    try {
      const data = await getFriendsReal(); // { friends: FriendDTO[] }
      const list: UIFriend[] = (data?.friends ?? []).map((f: FriendDTO) => {
        const _id = String((f as any)._id ?? "");
        const email = (f as any).email ?? "";
        const firstName = (f as any).firstName ?? undefined;
        const lastName = (f as any).lastName ?? undefined;

        // Choose a pleasant display nickname
        const nickname =
          (firstName && lastName && `${firstName} ${lastName}`) ||
          firstName ||
          email?.split("@")[0] ||
          "Friend";

        return { _id, email, firstName, lastName, nickname };
      });
      setFriends(list);
    } catch (error) {
      console.error("Failed to load friends:", error);
      toast.error("Failed to load friends");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddFriend(e: React.FormEvent) {
    e.preventDefault();
    const email = newFriendEmail.trim();
    if (!email) return;

    setAddingFriend(true);
    try {
      const res = await addFriendReal(email); // { message } or { error }
      if ((res as any)?.error) throw new Error((res as any).error);
      toast.success("Friend added successfully!");
      setNewFriendEmail("");
      await loadFriends();
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to add friend");
    } finally {
      setAddingFriend(false);
    }
  }

  async function handleDeleteFriend(confirm?: boolean) {
    if (!deleting) return;
    if (!confirm) {
      setDeleting(null);
      return;
    }
    try {
      const res = await removeFriendReal(deleting.email); // backend expects friendEmail
      if ((res as any)?.error) throw new Error((res as any).error);
      toast.success("Friend removed");
      await loadFriends();
    } catch (error) {
      toast.error("Failed to remove friend");
    } finally {
      setDeleting(null);
    }
  }

  const filteredFriends = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter((f) => {
      const full = `${f.nickname} ${f.firstName ?? ""} ${f.lastName ?? ""} ${f.email}`.toLowerCase();
      return full.includes(q);
    });
  }, [friends, searchQuery]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B4B5A] to-[#2C6E7E] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-10 h-10 text-[#D4AF37]" />
            <div>
              <h1 className="text-[#D4AF37] tracking-wide">Your Circle</h1>
              <p className="text-[#C5A572]">Manage your companions and connections</p>
            </div>
          </div>
          <EgyptianBorder className="my-4" />
        </div>

        {/* Add Friend Form */}
        <PapyrusCard className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#1B4B5A]">
              <UserPlus className="w-5 h-5" />
              Add New Friend
            </CardTitle>
            <CardDescription className="text-[#2C6E7E]">
              Add friends by their email address (they must have a Cairos account and be verified)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddFriend} className="flex gap-2">
              <Input
                type="email"
                placeholder="friend@gmail.com"
                value={newFriendEmail}
                onChange={(e) => setNewFriendEmail(e.target.value)}
                className="flex-1 bg-white border-[#D4AF37] focus:ring-[#D4AF37]"
              />
              <Button
                type="submit"
                disabled={addingFriend || !newFriendEmail.trim()}
                className="bg-[#1B4B5A] hover:bg-[#2C6E7E] text-[#D4AF37] border-2 border-[#D4AF37]"
              >
                {addingFriend ? "Adding..." : "Add Friend"}
              </Button>
            </form>
          </CardContent>
        </PapyrusCard>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#C5A572]" />
            <Input
              type="text"
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-[#D4AF37] focus:ring-[#D4AF37] text-[#1B4B5A]"
            />
          </div>
        </div>

        {/* Friends List */}
        <div className="space-y-4">
          {loading ? (
            <PapyrusCard>
              <CardContent className="py-8 text-center text-[#2C6E7E]">
                Loading friends...
              </CardContent>
            </PapyrusCard>
          ) : filteredFriends.length === 0 ? (
            <PapyrusCard>
              <CardContent className="py-12 text-center">
                <AnkhIcon className="w-12 h-12 mx-auto mb-4 text-[#D4AF37]" />
                <p className="text-[#2C6E7E] mb-2">
                  {searchQuery ? "No friends match your search" : "No friends yet"}
                </p>
                {!searchQuery && (
                  <p className="text-[#946923]">
                    Add friends by their email address to start finding the perfect time to meet
                  </p>
                )}
              </CardContent>
            </PapyrusCard>
          ) : (
            filteredFriends.map((friend) => {
              const fullName = `${friend.firstName ?? ""} ${friend.lastName ?? ""}`.trim();
              const showFullName = Boolean(fullName) && fullName !== friend.nickname;

              return (
                <PapyrusCard key={friend._id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C5A572] flex items-center justify-center text-[#1B4B5A]">
                          {friend.nickname.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-[#1B4B5A]">{friend.nickname}</h3>
                          {showFullName && (
                            <p className="text-[#2C6E7E]">{fullName}</p>
                          )}
                          <p className="text-[#946923]">{friend.email}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() => setDeleting({ id: friend._id, email: friend.email })}
                        className="text-[#C1440E] hover:text-[#C1440E] hover:bg-red-50"
                      >
                        <p className="text-sm">Delete</p>
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </CardContent>
                </PapyrusCard>
              );
            })
          )}
        </div>

        {/* Summary */}
        {filteredFriends.length > 0 && !searchQuery && (
          <div className="mt-6 text-center text-[#C5A572]">
            {friends.length} {friends.length === 1 ? "friend" : "friends"} in your circle
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent className="bg-[#F5E6D3] border-2 border-[#D4AF37]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1B4B5A]">Remove Friend?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#2C6E7E]">
              Are you sure you want to remove this friend from your circle? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white border-[#C5A572] text-[#2C6E7E]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteFriend(true)}
              className="bg-[#C1440E] hover:bg-[#C1440E]/90 text-white"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
