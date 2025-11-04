import React, { useEffect, useState } from "react";
import { UserPlus, Trash2, Search, Users } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { EgyptianBorder, PapyrusCard, AnkhIcon } from "./egyptian-decorations";
import { getFriends, addFriend, deleteFriend, type Friend } from "../lib/mock-api";
import { toast } from "sonner@2.0.3";

export function FriendsList() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [newFriendEmail, setNewFriendEmail] = useState("");
  const [addingFriend, setAddingFriend] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadFriends();
  }, [searchQuery]);

  async function loadFriends() {
    try {
      const response = await getFriends(searchQuery);
      setFriends(response.friends);
    } catch (error) {
      console.error("Failed to load friends:", error);
      toast.error("Failed to load friends");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddFriend(e: React.FormEvent) {
    e.preventDefault();
    if (!newFriendEmail.trim()) return;

    setAddingFriend(true);
    try {
      await addFriend(newFriendEmail.trim());
      toast.success("Friend added successfully!");
      setNewFriendEmail("");
      await loadFriends();
    } catch (error: any) {
      toast.error(error.message || "Failed to add friend");
    } finally {
      setAddingFriend(false);
    }
  }

  async function handleDeleteFriend(id: string) {
    try {
      await deleteFriend(id);
      toast.success("Friend removed");
      await loadFriends();
      setDeletingId(null);
    } catch (error) {
      toast.error("Failed to remove friend");
    }
  }

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
              Add friends by their email address (they must have a Cairos account)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddFriend} className="flex gap-2">
              <Input
                type="email"
                placeholder="friend@example.com"
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
              className="pl-10 bg-[#F5E6D3] border-[#D4AF37] focus:ring-[#D4AF37] text-[#1B4B5A]"
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
          ) : friends.length === 0 ? (
            <PapyrusCard>
              <CardContent className="py-12 text-center">
                <AnkhIcon className="w-12 h-12 mx-auto mb-4 text-[#D4AF37]" />
                <p className="text-[#2C6E7E] mb-2">
                  {searchQuery ? "No friends match your search" : "No friends yet"}
                </p>
                {!searchQuery && (
                  <p className="text-[#C5A572]">
                    Add friends by their email address to start finding the perfect time to meet
                  </p>
                )}
              </CardContent>
            </PapyrusCard>
          ) : (
            friends.map((friend) => (
              <PapyrusCard key={friend._id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C5A572] flex items-center justify-center text-[#1B4B5A]">
                        {friend.nickname.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-[#1B4B5A]">{friend.nickname}</h3>
                        <p className="text-[#2C6E7E]">
                          {friend.friend.firstName} {friend.friend.lastName}
                        </p>
                        <p className="text-[#C5A572]">{friend.friend.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingId(friend._id)}
                      className="text-[#C1440E] hover:text-[#C1440E] hover:bg-red-50"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </CardContent>
              </PapyrusCard>
            ))
          )}
        </div>

        {/* Summary */}
        {friends.length > 0 && !searchQuery && (
          <div className="mt-6 text-center text-[#C5A572]">
            {friends.length} {friends.length === 1 ? "friend" : "friends"} in your circle
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
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
              onClick={() => deletingId && handleDeleteFriend(deletingId)}
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
