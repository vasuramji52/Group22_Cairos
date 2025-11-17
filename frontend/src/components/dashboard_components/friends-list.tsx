// import React, { useEffect, useMemo, useState } from "react";
// import { UserPlus, Trash2, Search, Users } from "lucide-react";
// import { Button } from "../ui/button";
// import { Input } from "../ui/input";
// import { CardContent } from "../ui/card";
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "../ui/alert-dialog";
// import { EgyptianBorder, PapyrusCard, AnkhIcon } from "./egyptian-decorations";
// import { toast } from "sonner";

// import {
//   getFriendsReal,
//   addFriendReal,
//   removeFriendReal,
//   acceptFriendReal,
//   declineFriendReal,
// } from "../lib/friends.api";

// type UIFriend = {
//   _id: string;
//   email: string;
//   firstName?: string;
//   lastName?: string;
//   nickname: string;
// };

// type FriendsListProps = {
//   onPendingChange?: (count: number) => void;
// };

// export function FriendsList({ onPendingChange }: FriendsListProps) {
//   const [friends, setFriends] = useState<UIFriend[]>([]);
//   const [incoming, setIncoming] = useState<UIFriend[]>([]); // receivedRequests
//   const [_outgoing, setOutgoing] = useState<UIFriend[]>([]); // sentRequests

//   const [loading, setLoading] = useState(true);

//   const [searchQuery, setSearchQuery] = useState("");
//   const [newFriendEmail, setNewFriendEmail] = useState("");
//   const [addingFriend, setAddingFriend] = useState(false);

//   const [deleting, setDeleting] = useState<{ id: string; email: string } | null>(
//     null
//   );

//   // modal state
//   const [pendingOpen, setPendingOpen] = useState(false);
//   const [addOpen, setAddOpen] = useState(false);

//   useEffect(() => {
//     void loadFriends();
//   }, []);

//   async function loadFriends() {
//     setLoading(true);
//     try {
//       const data = await getFriendsReal(); // { friends, sentRequests, receivedRequests }

//       const mapToUI = (arr: any[]) =>
//         arr.map((f: any) => ({
//           _id: typeof f._id === "object" ? f._id.toString() : String(f._id),
//           email: f.email,
//           firstName: f.firstName,
//           lastName: f.lastName,
//           nickname:
//             f.firstName && f.lastName
//               ? `${f.firstName} ${f.lastName}`
//               : f.email?.split("@")[0] || "Friend",
//         }));

//       setFriends(mapToUI(data.friends ?? []));
//       setIncoming(mapToUI(data.receivedRequests ?? []));
//       onPendingChange?.(data.receivedRequests?.length || 0);
//       setOutgoing(mapToUI(data.sentRequests ?? []));
//     } catch (e) {
//       toast.error("Failed to load friends");
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function handleAccept(requesterId: string) {
//     try {
//       const res = await acceptFriendReal(requesterId);
//       if (res.error) throw new Error(res.error);
//       toast.success("Friend request accepted!");
//       await loadFriends();
//     } catch (e: any) {
//       toast.error(e.message ?? "Failed to accept request");
//     }
//   }

//   async function handleDecline(requesterId: string) {
//     try {
//       const res = await declineFriendReal(requesterId);
//       if (res.error) throw new Error(res.error);
//       toast.success("Friend request declined");
//       await loadFriends();
//     } catch (e: any) {
//       toast.error(e.message ?? "Failed to decline request");
//     }
//   }

//   async function handleAddFriend(e: React.FormEvent) {
//     e.preventDefault();
//     const email = newFriendEmail.trim();
//     if (!email) return;

//     setAddingFriend(true);
//     try {
//       const res = await addFriendReal(email);
//       if ((res as any)?.error) throw new Error((res as any).error);
//       toast.success("Friend request sent successfully!");
//       setNewFriendEmail("");
//       await loadFriends();
//       // close modal after successful add
//       setAddOpen(false);
//     } catch (error: any) {
//       toast.error(error?.message ?? "Failed to add friend");
//     } finally {
//       setAddingFriend(false);
//     }
//   }

//   async function handleDeleteFriend(confirm?: boolean) {
//     if (!deleting) return;
//     if (!confirm) {
//       setDeleting(null);
//       return;
//     }
//     try {
//       const res = await removeFriendReal(deleting.email);
//       if ((res as any)?.error) throw new Error((res as any).error);
//       toast.success("Friend removed");
//       await loadFriends();
//     } catch (error) {
//       toast.error("Failed to remove friend");
//     } finally {
//       setDeleting(null);
//     }
//   }

//   const filteredFriends = useMemo(() => {
//     const q = searchQuery.trim().toLowerCase();
//     if (!q) return friends;
//     return friends.filter((f) => {
//       const full = `${f.nickname} ${f.firstName ?? ""} ${
//         f.lastName ?? ""
//       } ${f.email}`.toLowerCase();
//       return full.includes(q);
//     });
//   }, [friends, searchQuery]);

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-[#1B4B5A] to-[#2C6E7E] p-6">
//       <div className="max-w-4xl mx-auto">
//         {/* Header with actions on the right */}
//         <div className="mb-6">
//           <div className="flex items-center justify-between mb-4">
//             <div className="flex items-center gap-3">
//               <Users className="w-10 h-10 text-[#D4AF37]" />
//               <div>
//                 <h1 className="text-[#D4AF37] tracking-wide">Your Circle</h1>
//                 <p className="text-[#C5A572]">
//                   Manage your companions and connections
//                 </p>
//               </div>
//             </div>

//             <div className="flex items-center gap-3">
//               <Button
//                 className="bg-[#1B4B5A] hover:bg-[#2C6E7E] text-[#D4AF37] border-2 border-[#D4AF37] px-4 py-2 rounded-lg flex items-center gap-2"
//                 onClick={() => setPendingOpen(true)}
//               >
//                 <Users className="w-4 h-4" />
//                 <span>Pending requests</span>
//                 {incoming.length > 0 && (
//                   <span className="ml-1 rounded-full bg-[#C1440E] text-white text-xs px-2 py-0.5">
//                     {incoming.length}
//                   </span>
//                 )}
//               </Button>

//               <Button
//                 className="bg-[#1B4B5A] hover:bg-[#2C6E7E] text-[#D4AF37] border-2 border-[#D4AF37] px-4 py-2 rounded-lg flex items-center gap-2"
//                 onClick={() => setAddOpen(true)}
//               >
//                 <UserPlus className="w-4 h-4" />
//                 <span>Add friend</span>
//               </Button>
//             </div>
//           </div>

//           <EgyptianBorder className="my-4" />
//         </div>

//         {/* Search bar */}
//         <div className="mb-6">
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#C5A572]" />
//             <Input
//               type="text"
//               placeholder="Search friends..."
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               className="pl-10 bg-white border-[#D4AF37] focus:ring-[#D4AF37] text-[#1B4B5A]"
//             />
//           </div>
//         </div>

//         {/* Friends List */}
//         <div className="space-y-4">
//           {loading ? (
//             <PapyrusCard>
//               <CardContent className="py-8 text-center text-[#2C6E7E]">
//                 Loading friends...
//               </CardContent>
//             </PapyrusCard>
//           ) : filteredFriends.length === 0 ? (
//             <PapyrusCard>
//               <CardContent className="py-12 text-center">
//                 <AnkhIcon className="w-12 h-12 mx-auto mb-4 text-[#D4AF37]" />
//                 <p className="text-[#2C6E7E] mb-2">
//                   {searchQuery ? "No friends match your search" : "No friends yet"}
//                 </p>
//                 {!searchQuery && (
//                   <p className="text-[#946923]">
//                     Add friends by their email address to start finding the
//                     perfect time to meet
//                   </p>
//                 )}
//               </CardContent>
//             </PapyrusCard>
//           ) : (
//             filteredFriends.map((friend) => {
//               const fullName = `${friend.firstName ?? ""} ${
//                 friend.lastName ?? ""
//               }`.trim();
//               const showFullName =
//                 Boolean(fullName) && fullName !== friend.nickname;

//               return (
//                 <PapyrusCard key={friend._id}>
//                   <CardContent className="py-4">
//                     <div className="flex items-center justify-between">
//                       <div className="flex items-center gap-4">
//                         <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C5A572] flex items-center justify-center text-[#1B4B5A]">
//                           {friend.nickname.charAt(0).toUpperCase()}
//                         </div>
//                         <div>
//                           <h3 className="text-[#1B4B5A]">{friend.nickname}</h3>
//                           {showFullName && (
//                             <p className="text-[#2C6E7E]">{fullName}</p>
//                           )}
//                           <p className="text-[#946923]">{friend.email}</p>
//                         </div>
//                       </div>
//                       <Button
//                         variant="ghost"
//                         onClick={() =>
//                           setDeleting({ id: friend._id, email: friend.email })
//                         }
//                         className="flex items-center text-[#C1440E] hover:text-[#C1440E] hover:bg-red-50"
//                       >
//                         <p className="text-sm">Delete</p>
//                         <Trash2 className="w-5 h-5" />
//                       </Button>
//                     </div>
//                   </CardContent>
//                 </PapyrusCard>
//               );
//             })
//           )}
//         </div>

//         {/* Summary */}
//         {filteredFriends.length > 0 && !searchQuery && (
//           <div className="mt-6 text-center text-[#C5A572]">
//             {friends.length} {friends.length === 1 ? "friend" : "friends"} in
//             your circle
//           </div>
//         )}
//       </div>

//       {/* Pending Requests Modal */}
//       <AlertDialog open={pendingOpen} onOpenChange={setPendingOpen}>
//         <AlertDialogContent className="bg-transparent border-none shadow-none p-0">
//           <PapyrusCard className="border-2 border-[#D4AF37] max-w-lg w-full mx-auto">
//             <div className="p-6">
//               <AlertDialogHeader>
//                 <AlertDialogTitle className="text-[#1B4B5A] flex items-center gap-2">
//                   <Users className="w-5 h-5" />
//                   Pending Requests
//                 </AlertDialogTitle>
//                 <AlertDialogDescription className="text-[#2C6E7E]">
//                   Accept or decline pending friend requests.
//                 </AlertDialogDescription>
//               </AlertDialogHeader>

//               <div className="space-y-2 max-h-72 overflow-y-auto mt-2">
//                 {loading ? (
//                   <p className="text-[#2C6E7E]">Loading...</p>
//                 ) : incoming.length === 0 ? (
//                   <p className="text-[#2C6E7E]">No pending requests</p>
//                 ) : (
//                   incoming.map((req) => (
//                     <div
//                       key={req._id}
//                       className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#FFFDF5] shadow-sm"
//                     >
//                       <div className="flex flex-col">
//                         <p className="font-semibold text-[#1B4B5A]">
//                           {req.nickname}
//                         </p>
//                         <p className="text-sm text-[#946923]">{req.email}</p>
//                       </div>
//                       <div className="flex gap-2">
//                         <Button
//                           className="px-3 py-1 bg-[#1B4B5A] hover:bg-[#2C6E7E] text-[#D4AF37] border-2 border-[#D4AF37] rounded-lg"
//                           onClick={() => handleAccept(req._id)}
//                         >
//                           Accept
//                         </Button>
//                         <Button
//                           className="px-3 py-1 bg-[#1B4B5A] hover:bg-[#2C6E7E] text-[#D4AF37] border-2 border-[#D4AF37] rounded-lg"
//                           onClick={() => handleDecline(req._id)}
//                         >
//                           Decline
//                         </Button>
//                       </div>
//                     </div>
//                   ))
//                 )}
//               </div>

//               <AlertDialogFooter className="mt-4">
//                 <AlertDialogAction className="bg-[#1B4B5A] hover:bg-[#2C6E7E] text-[#D4AF37] border border-[#D4AF37]">
//                   Close
//                 </AlertDialogAction>
//               </AlertDialogFooter>
//             </div>
//           </PapyrusCard>
//         </AlertDialogContent>
//       </AlertDialog>

//       {/* Add Friend Modal */}
//       <AlertDialog
//         open={addOpen}
//         onOpenChange={(open) => {
//           setAddOpen(open);
//           if (!open) setNewFriendEmail("");
//         }}
//       >
//         <AlertDialogContent className="bg-transparent border-none shadow-none p-0">
//           <PapyrusCard className="border-2 border-[#D4AF37] max-w-lg w-full mx-auto">
//             <div className="p-6">
//               <AlertDialogHeader>
//                 <AlertDialogTitle className="text-[#1B4B5A] flex items-center gap-2">
//                   <UserPlus className="w-5 h-5" />
//                   Add New Friend
//                 </AlertDialogTitle>
//                 <AlertDialogDescription className="text-[#2C6E7E]">
//                   Add friends by their email address (they must have a Cairos
//                   account and be verified).
//                 </AlertDialogDescription>
//               </AlertDialogHeader>

//               <form onSubmit={handleAddFriend} className="mt-4 space-y-4">
//                 <Input
//                   type="email"
//                   placeholder="friend@gmail.com"
//                   value={newFriendEmail}
//                   onChange={(e) => setNewFriendEmail(e.target.value)}
//                   className="bg-white border-[#D4AF37] focus:ring-[#D4AF37] text-[#1B4B5A]"
//                 />
//                 <AlertDialogFooter>
//                   <AlertDialogCancel className="bg-white border-[#C5A572] text-[#2C6E7E]">
//                     Cancel
//                   </AlertDialogCancel>
//                   <Button
//                     type="submit"
//                     disabled={addingFriend || !newFriendEmail.trim()}
//                     className="bg-[#1B4B5A] hover:bg-[#2C6E7E] text-[#D4AF37] border-2 border-[#D4AF37]"
//                   >
//                     {addingFriend ? "Adding..." : "Add Friend"}
//                   </Button>
//                 </AlertDialogFooter>
//               </form>
//             </div>
//           </PapyrusCard>
//         </AlertDialogContent>
//       </AlertDialog>

//       {/* Delete Confirmation Dialog */}
//       <AlertDialog
//         open={!!deleting}
//         onOpenChange={(open) => !open && setDeleting(null)}
//       >
//         <AlertDialogContent className="bg-[#F5E6D3] border-2 border-[#D4AF37]">
//           <AlertDialogHeader>
//             <AlertDialogTitle className="text-[#1B4B5A]">
//               Remove Friend?
//             </AlertDialogTitle>
//             <AlertDialogDescription className="text-[#2C6E7E]">
//               Are you sure you want to remove this friend from your circle?
//               This action cannot be undone.
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel className="bg-white border-[#C5A572] text-[#2C6E7E]">
//               Cancel
//             </AlertDialogCancel>
//             <AlertDialogAction
//               onClick={() => handleDeleteFriend(true)}
//               className="bg-[#C1440E] hover:bg-[#C1440E]/90 text-white"
//             >
//               Remove
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>
//     </div>
//   );
// }

import React, { useEffect, useMemo, useState } from "react";
import { UserPlus, Trash2, Search, Users } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { CardContent } from "../ui/card";
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

import {
  getFriendsReal,
  addFriendReal,
  removeFriendReal,
  acceptFriendReal,
  declineFriendReal,
} from "../lib/friends.api";

type UIFriend = {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  nickname: string;
};

type FriendsListProps = {
  onPendingChange?: (count: number) => void;
};

export function FriendsList({ onPendingChange }: FriendsListProps) {
  const [friends, setFriends] = useState<UIFriend[]>([]);
  const [incoming, setIncoming] = useState<UIFriend[]>([]);
  const [_outgoing, setOutgoing] = useState<UIFriend[]>([]);

  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [newFriendEmail, setNewFriendEmail] = useState("");
  const [addingFriend, setAddingFriend] = useState(false);

  const [deleting, setDeleting] = useState<{ id: string; email: string } | null>(
    null
  );

  const [pendingOpen, setPendingOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    void loadFriends();
  }, []);

  async function loadFriends() {
    setLoading(true);
    try {
      const data = await getFriendsReal();

      const mapToUI = (arr: any[]) =>
        arr.map((f: any) => ({
          _id: typeof f._id === "object" ? f._id.toString() : String(f._id),
          email: f.email,
          firstName: f.firstName,
          lastName: f.lastName,
          nickname:
            f.firstName && f.lastName
              ? `${f.firstName} ${f.lastName}`
              : f.email?.split("@")[0] || "Friend",
        }));

      setFriends(mapToUI(data.friends ?? []));
      setIncoming(mapToUI(data.receivedRequests ?? []));
      onPendingChange?.(data.receivedRequests?.length || 0);
      setOutgoing(mapToUI(data.sentRequests ?? []));
    } catch (e) {
      toast.error("Failed to load friends");
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(requesterId: string) {
    try {
      const res = await acceptFriendReal(requesterId);
      if (res.error) throw new Error(res.error);
      toast.success("Friend request accepted!");
      await loadFriends();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to accept request");
    }
  }

  async function handleDecline(requesterId: string) {
    try {
      const res = await declineFriendReal(requesterId);
      if (res.error) throw new Error(res.error);
      toast.success("Friend request declined");
      await loadFriends();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to decline request");
    }
  }

  async function handleAddFriend(e: React.FormEvent) {
    e.preventDefault();
    const email = newFriendEmail.trim();
    if (!email) return;

    setAddingFriend(true);
    try {
      const res = await addFriendReal(email);
      if ((res as any)?.error) throw new Error((res as any).error);
      toast.success("Friend request sent successfully!");
      setNewFriendEmail("");
      await loadFriends();
      setAddOpen(false);
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
      const res = await removeFriendReal(deleting.email);
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
      const full = `${f.nickname} ${f.firstName ?? ""} ${
        f.lastName ?? ""
      } ${f.email}`.toLowerCase();
      return full.includes(q);
    });
  }, [friends, searchQuery]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B4B5A] to-[#2C6E7E] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header with actions on the right */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Users className="w-10 h-10 text-[#D4AF37]" />
              <div>
                <h1 className="text-[#D4AF37] tracking-wide">Your Circle</h1>
                <p className="text-[#C5A572]">
                  Manage your companions and connections
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                className="bg-[#1B4B5A] hover:bg-[#2C6E7E] text-[#D4AF37] border-2 border-[#D4AF37] px-4 py-2 rounded-lg flex items-center gap-2"
                onClick={() => setPendingOpen(true)}
              >
                <Users className="w-4 h-4" />
                <span>Pending requests</span>
                {incoming.length > 0 && (
                  <span className="ml-1 rounded-full bg-[#C1440E] text-white text-xs px-2 py-0.5">
                    {incoming.length}
                  </span>
                )}
              </Button>

              <Button
                className="bg-[#1B4B5A] hover:bg-[#2C6E7E] text-[#D4AF37] border-2 border-[#D4AF37] px-4 py-2 rounded-lg flex items-center gap-2"
                onClick={() => setAddOpen(true)}
              >
                <UserPlus className="w-4 h-4" />
                <span>Add friend</span>
              </Button>
            </div>
          </div>

          <EgyptianBorder className="my-4" />
        </div>

        {/* Search bar */}
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
                    Add friends by their email address to start finding the
                    perfect time to meet
                  </p>
                )}
              </CardContent>
            </PapyrusCard>
          ) : (
            filteredFriends.map((friend) => {
              const fullName = `${friend.firstName ?? ""} ${
                friend.lastName ?? ""
              }`.trim();
              const showFullName =
                Boolean(fullName) && fullName !== friend.nickname;

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
                        onClick={() =>
                          setDeleting({ id: friend._id, email: friend.email })
                        }
                        className="flex items-center text-[#C1440E] hover:text-[#C1440E] hover:bg-red-50"
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
            {friends.length} {friends.length === 1 ? "friend" : "friends"} in
            your circle
          </div>
        )}
      </div>

      {/* Pending Requests Modal */}
      <AlertDialog open={pendingOpen} onOpenChange={setPendingOpen}>
        <AlertDialogContent className="bg-transparent border-none shadow-none p-0">
          <PapyrusCard className="border-2 border-[#D4AF37] max-w-lg w-full mx-auto">
            <div className="p-6">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-[#1B4B5A] flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Pending Requests
                </AlertDialogTitle>
                <AlertDialogDescription className="text-[#2C6E7E]">
                  Accept or decline pending friend requests.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="space-y-2 max-h-72 overflow-y-auto mt-2 mb-6">
                {loading ? (
                  <p className="text-[#2C6E7E]">Loading...</p>
                ) : incoming.length === 0 ? (
                  <p className="text-[#2C6E7E]">No pending requests</p>
                ) : (
                  incoming.map((req) => (
                    <div
                      key={req._id}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-[#D4AF37]/40 bg-[#FAF4E6] shadow-sm"
                    >
                      <div className="flex flex-col">
                        <p className="font-semibold text-[#1B4B5A]">
                          {req.nickname}
                        </p>
                        <p className="text-sm text-[#946923]">{req.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          className="px-3 py-1 bg-[#1B4B5A] hover:bg-[#2C6E7E] text-[#D4AF37] border-2 border-[#D4AF37] rounded-lg"
                          onClick={() => handleAccept(req._id)}
                        >
                          Accept
                        </Button>
                        <Button
                          className="px-3 py-1 bg-[#1B4B5A] hover:bg-[#2C6E7E] text-[#D4AF37] border-2 border-[#D4AF37] rounded-lg"
                          onClick={() => handleDecline(req._id)}
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <AlertDialogFooter className="mt-4">
                <AlertDialogAction className="bg-[#1B4B5A] hover:bg-[#2C6E7E] text-[#D4AF37] border border-[#D4AF37]">
                  Close
                </AlertDialogAction>
              </AlertDialogFooter>
            </div>
          </PapyrusCard>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Friend Modal */}
      <AlertDialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) setNewFriendEmail("");
        }}
      >
        <AlertDialogContent className="bg-transparent border-none shadow-none p-0">
          <PapyrusCard className="border-2 border-[#D4AF37] max-w-lg w-full mx-auto">
            <div className="p-6">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-[#1B4B5A] flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Add New Friend
                </AlertDialogTitle>
                <AlertDialogDescription className="text-[#2C6E7E]">
                  Add friends by their email address (they must have a Cairos
                  account and be verified).
                </AlertDialogDescription>
              </AlertDialogHeader>

              <form onSubmit={handleAddFriend} className="mt-4 space-y-4">
                <Input
                  type="email"
                  placeholder="friend@gmail.com"
                  value={newFriendEmail}
                  onChange={(e) => setNewFriendEmail(e.target.value)}
                  className="bg-white border-[#D4AF37] focus:ring-[#D4AF37] text-[#1B4B5A]"
                />
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-white border-[#C5A572] text-[#2C6E7E]">
                    Cancel
                  </AlertDialogCancel>
                  <Button
                    type="submit"
                    disabled={addingFriend || !newFriendEmail.trim()}
                    className="bg-[#1B4B5A] hover:bg-[#2C6E7E] text-[#D4AF37] border-2 border-[#D4AF37]"
                  >
                    {addingFriend ? "Adding..." : "Add Friend"}
                  </Button>
                </AlertDialogFooter>
              </form>
            </div>
          </PapyrusCard>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent className="bg-[#F5E6D3] border-2 border-[#D4AF37]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1B4B5A]">
              Remove Friend?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#2C6E7E]">
              Are you sure you want to remove this friend from your circle?
              This action cannot be undone.
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
