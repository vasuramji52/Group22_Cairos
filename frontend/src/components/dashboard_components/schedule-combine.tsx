import { useEffect, useState } from "react";
import { CalendarDays, Clock, Sparkles } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  EgyptianBorder,
  PapyrusCard,
  SundialIcon,
} from "./egyptian-decorations";
import { getFriendsReal, type FriendDTO } from "../lib/friends.api";
import { type Suggestion } from "../lib/mock-api"; 
import { toast } from "sonner";
import { availabilityFirst } from "../lib/api";

function nameOf(f: FriendDTO) {
  const n = `${(f.firstName ?? "").trim()} ${(f.lastName ?? "").trim()}`.trim();
  return n || (f.email ?? "Unknown");
}

export function ScheduleCombine() {
  const [friends, setFriends] = useState<FriendDTO[]>([]);
  const [selectedFriendId, setSelectedFriendId] = useState(""); //if i see the word iso again i will jump off a cliff

  const [date, setDate] = useState("");
  const [duration, setDuration] = useState("60");

  const [workStart, setWorkStart] = useState("09:00");
  const [workEnd, setWorkEnd] = useState("17:00");
  const [timezone, setTimezone] = useState("");

  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  //currently logged in user id from localStorage
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { friends } = await getFriendsReal();
        // normalize _id 
        setFriends(friends.map((f) => ({ ...f, _id: String((f as any)._id) })));
      } catch (e) {
        console.error("Failed to load friends:", e);
      }
    })();

    try {
      //one of these have got to work
      const storedUserString =
        localStorage.getItem("currentUser") ??
        localStorage.getItem("user") ??
        localStorage.getItem("user_data");

      if (!storedUserString) {
        console.warn("No currentUser found in localStorage");
      } else {
        const storedUser = JSON.parse(storedUserString);
        const id =
          storedUser._id ?? storedUser.id ?? storedUser.userId ?? null;

        if (id) {
          setCurrentUserId(String(id));
        } else {
          console.warn(
            "currentUser object found in localStorage but has no id field",
            storedUser
          );
        }
      }
    } catch (err) {
      console.error("Failed to read currentUser from localStorage:", err);
    }

    //mr worldwide 
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    const t = new Date();
    t.setDate(t.getDate() + 1);
    setDate(t.toISOString().split("T")[0]);
  }, []);

  async function handleFindTime() {
    if (!selectedFriendId || !date) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!currentUserId) {
      toast.error("You must be logged in before finding a time.");
      return;
    }

    setLoading(true);

    // full-day window for the API
    const apiStartTime = "00:00";
    const apiEndTime = "23:59";
    const durationMinutes = parseInt(duration, 10) || 30;

    try {
      const userA = currentUserId; // logged-in user
      const userB = selectedFriendId; // friend from dropdown

      const resp: any = await availabilityFirst({
        userA,
        userB,
        date, // yyyy-mm-dd
        startTime: apiStartTime, // HH:mm
        endTime: apiEndTime, // HH:mm
        tz: timezone,
        minutes: durationMinutes,
        workStart, // HH:mm
        workEnd, // HH:mm
      });

      console.log("availabilityFirst resp", resp);

      // If backend says "no slot", show empty UI
      if (resp.ok === false && resp.error === "no_slot") {
        setSuggestions([]);
        setShowSuggestions(true);
        toast.info("No available times found in this window");
        return;
      }

      // any other error string is a real error
      if (resp.error && resp.error !== "no_slot") {
        throw new Error(resp.error);
      }

      // normalize all the possible shapes into one "first slot"
      const first =
        resp.slot ??
        resp.firstSlot ??
        (resp.slotStart && resp.slotEnd
          ? { start: resp.slotStart, end: resp.slotEnd }
          : null) ??
        (Array.isArray(resp.slots) ? resp.slots[0] ?? null : null);

      if (first && first.start && first.end) {
        const slot: Suggestion = { start: first.start, end: first.end };
        setSuggestions([slot]);
        setShowSuggestions(true);
        toast.success("Found an available time!");
      } else {
        setSuggestions([]);
        setShowSuggestions(true);
        toast.info("No available times found in this window");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to find available times");
    } finally {
      setLoading(false);
    }
  }

  function formatTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }

  const selectedFriend = friends.find((f) => f._id === selectedFriendId);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B4B5A] to-[#2C6E7E] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <SundialIcon className="w-10 h-10 text-[#D4AF37]" />
            <div>
              <h1 className="text-[#D4AF37] tracking-wide">
                Find the Perfect Time
              </h1>
              <p className="text-[#C5A572]">
                Combine schedules to discover your Kairos
              </p>
            </div>
          </div>
          <EgyptianBorder className="my-4" />
        </div>

        {/* Form / Results */}
        {!showSuggestions ? (
          <PapyrusCard>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#1B4B5A]">
                <CalendarDays className="w-5 h-5" />
                Schedule Details
              </CardTitle>
              <CardDescription className="text-[#2C6E7E]">
                Select a friend and time window to find available meeting slots
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Friend */}
              <div className="space-y-2">
                <Label htmlFor="friend" className="text-[#1B4B5A]">
                  Select Friend
                </Label>
                <Select
                  value={selectedFriendId}
                  onValueChange={setSelectedFriendId}
                >
                  <SelectTrigger className="bg-white border-[#D4AF37]">
                    <SelectValue placeholder="Choose a friend..." />
                  </SelectTrigger>
                  <SelectContent>
                    {friends.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-[#2C6E7E]">
                        No friends yet
                      </div>
                    ) : (
                      friends.map((f) => (
                        <SelectItem key={f._id} value={f._id}>
                          {nameOf(f)}
                          {f.email ? ` (${f.email})` : ""}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date" className="text-[#1B4B5A]">
                  Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-white border-[#D4AF37]"
                />
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="duration" className="text-[#1B4B5A]">
                  Meeting Duration (minutes)
                </Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger className="bg-white border-[#D4AF37]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Work Hours */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workStart" className="text-[#1B4B5A]">
                    Work Start Time
                  </Label>
                  <Input
                    id="workStart"
                    type="time"
                    value={workStart}
                    onChange={(e) => setWorkStart(e.target.value)}
                    className="bg-white border-[#D4AF37]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workEnd" className="text-[#1B4B5A]">
                    Work End Time
                  </Label>
                  <Input
                    id="workEnd"
                    type="time"
                    value={workEnd}
                    onChange={(e) => setWorkEnd(e.target.value)}
                    className="bg-white border-[#D4AF37]"
                  />
                </div>
              </div>

              {/* Timezone */}
              <div className="space-y-2">
                <Label htmlFor="timezone" className="text-[#1B4B5A]">
                  Timezone
                </Label>
                <Input
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="bg-white border-[#D4AF37]"
                  placeholder="America/New_York"
                />
              </div>

              {/* Submit */}
              <Button
                onClick={handleFindTime}
                disabled={loading || !selectedFriendId}
                className="w-full bg-[#1B4B5A] hover:bg-[#2C6E7E] text-[#D4AF37] border-2 border-[#D4AF37]"
              >
                {loading ? (
                  "Finding perfect moments..."
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Find Available Times
                  </>
                )}
              </Button>
            </CardContent>
          </PapyrusCard>
        ) : (
          <div className="space-y-6">
            <PapyrusCard>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C5A572] flex items-center justify-center text-[#1B4B5A]">
                      {(
                        nameOf((selectedFriend ?? {}) as FriendDTO).charAt(0) ||
                        "?"
                      ).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-[#1B4B5A]">
                        Meeting with{" "}
                        {selectedFriend ? nameOf(selectedFriend) : "Friend"}
                      </h3>
                      <p className="text-[#2C6E7E]">
                        {formatDate(suggestions[0]?.start || date)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowSuggestions(false)}
                    className="border-[#D4AF37] text-[#1B4B5A]"
                  >
                    Change Details
                  </Button>
                </div>
              </CardContent>
            </PapyrusCard>

            <div>
              <h2 className="text-[#D4AF37] mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" /> Available Time Slots (
                {suggestions.length})
              </h2>
              <div className="space-y-3">
                {suggestions.map((s, i) => (
                  <PapyrusCard
                    key={i}
                    className="hover:shadow-xl transition-shadow"
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#C5A572] flex flex-col items-center justify-center text-[#1B4B5A]">
                            <span className="text-xs">Slot</span>
                            <span>{i + 1}</span>
                          </div>
                          <div>
                            <p className="text-[#1B4B5A]">
                              {formatTime(s.start)} - {formatTime(s.end)}
                            </p>
                            <p className="text-[#2C6E7E]">
                              {duration} minute meeting
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </PapyrusCard>
                ))}
              </div>
            </div>

            {suggestions.length === 0 && (
              <PapyrusCard>
                <CardContent className="py-12 text-center">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-[#C5A572]" />
                  <p className="text-[#2C6E7E] mb-2">No available times found</p>
                  <p className="text-[#C5A572]">
                    Try adjusting your time window or selecting a different date
                  </p>
                </CardContent>
              </PapyrusCard>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
