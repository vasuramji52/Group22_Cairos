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
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
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
  const [selectedFriendId, setSelectedFriendId] = useState("");

  // date range instead of single date
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [duration, setDuration] = useState("60");

  const [workStart, setWorkStart] = useState("09:00");
  const [workEnd, setWorkEnd] = useState("17:00");
  const [timezone, setTimezone] = useState("");

  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [ meetingTitle, setMeetingTitle ] = useState("");

  // how many slots & gap between them
  const MAX_SLOTS = 4;
  const GAP_MINUTES = 0; // next slot must be at least 30 min after previous

  function addMinutes(date: Date, minutes: number) {
    return new Date(date.getTime() + minutes * 60_000);
  }

  function extractFirstSlot(resp: any): Suggestion | null {
    const first =
      resp.slot ??
      resp.firstSlot ??
      (resp.slotStart && resp.slotEnd
        ? { start: resp.slotStart, end: resp.slotEnd }
        : null) ??
      (Array.isArray(resp.slots) ? resp.slots[0] ?? null : null);

    if (!first || !first.start || !first.end) return null;
    return { start: first.start, end: first.end };
  }

  async function findSequentialSlots(
    userA: string,
    userB: string,
    startDateStr: string,
    endDateStr: string,
    minutes: number,
    tz: string,
    workStart: string,
    workEnd: string
  ): Promise<Suggestion[]> {
    const apiStartTime = "00:00";
    const apiEndTime = "23:59";

    let currentStart = new Date(`${startDateStr}T${apiStartTime}:00`);
    const windowEnd = new Date(`${endDateStr}T${apiEndTime}:00`);

    const results: Suggestion[] = [];

    while (results.length < MAX_SLOTS && currentStart < windowEnd) {
      const resp = await availabilityFirst({
        userA,
        userB,
        start: currentStart.toISOString(),
        end: windowEnd.toISOString(),
        tz,
        minutes,
        workStart,
        workEnd,
      });

      if (resp.error === "no_slot") {
        break;
      }

      const slot = extractFirstSlot(resp);
      if (!slot) break;

      results.push(slot);

      // move start to just after this slot plus the gap
      currentStart = addMinutes(new Date(slot.end), GAP_MINUTES);
    }

    return results;
  }

  useEffect(() => {
    (async () => {
      try {
        const { friends } = await getFriendsReal();
        setFriends(friends.map((f) => ({ ...f, _id: String((f as any)._id) })));
      } catch (e) {
        console.error("Failed to load friends:", e);
      }
    })();

    try {
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

    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);

    // Default: start = tomorrow, end = 3 days after that
    const t = new Date();
    t.setDate(t.getDate() + 1);
    const startStr = t.toISOString().split("T")[0];

    const t2 = new Date(t);
    t2.setDate(t2.getDate() + 3);
    const endStr = t2.toISOString().split("T")[0];

    setStartDate(startStr);
    setEndDate(endStr);
  }, []);

  async function handleFindTime() {
    if (!selectedFriendId || !startDate || !endDate || !meetingTitle) {
      toast.error("Please fill in all fields");
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      toast.error("End date must be on or after the start date.");
      return;
    }

    if (!currentUserId) {
      toast.error("You must be logged in before finding a time.");
      return;
    }

    setLoading(true);
    const durationMinutes = parseInt(duration, 10) || 30;

    try {
      const userA = currentUserId;
      const userB = selectedFriendId;

      const slots = await findSequentialSlots(
        userA,
        userB,
        startDate,
        endDate,
        durationMinutes,
        timezone,
        workStart,
        workEnd
      );

      if (slots.length === 0) {
        setSuggestions([]);
        setShowSuggestions(true);
        toast.info("No available times found in this window");
      } else {
        setSuggestions(slots);
        setShowSuggestions(true);
        toast.success(
          `Found ${slots.length} available time${slots.length > 1 ? "s" : ""}!`
        );
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
  const firstSuggestion = suggestions[0];

  const durationLabel =
    duration === "30"
      ? "30 minute meeting"
      : duration === "60"
      ? "1 hour meeting"
      : duration === "90"
      ? "1.5 hour meeting"
      : duration === "120"
      ? "2 hour meeting"
      : `${duration} minute meeting`;

  const meetingDate =
    firstSuggestion?.start ??
    (startDate ? new Date(startDate).toISOString() : "");

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

        {/* Form */}
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
            {/*Meeting Title*/}
            <div className="space-y-2">
              <Label htmlFor="meetingTitle" className="text-[#1B4B5A]">
                Meeting Title
              </Label>
              <Input
                id="meetingTitle"
                placeholder="E.g., Project Discussion"
                className="bg-white border-[#D4AF37]"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
              />
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-[#1B4B5A]">
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-white border-[#D4AF37]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-[#1B4B5A]">
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-white border-[#D4AF37]"
                />
              </div>
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
      </div>

      {/* Results Modal */}
      <AlertDialog open={showSuggestions} onOpenChange={setShowSuggestions}>
        <AlertDialogContent className="bg-transparent border-none shadow-none p-0">
          <PapyrusCard className="border-2 border-[#D4AF37] max-w-xl w-full mx-auto">
            <div className="p-6 pb-8">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-[#1B4B5A] flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Meeting Details
                </AlertDialogTitle>
                <AlertDialogDescription className="text-[#2C6E7E] mb-2">
                  Here&apos;s the best times we found based on both schedules.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="mt-4 space-y-4">
                {suggestions.length > 0 ? (
                  <>
                    {/* Who / date / duration */}
                    <PapyrusCard>
                      <CardContent className="py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C5A572] flex items-center justify-center text-[#1B4B5A]">
                            {(
                              nameOf((selectedFriend ?? {}) as FriendDTO).charAt(0) ||
                              "?"
                            ).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-[#1B4B5A]">
                              {" "} {meetingTitle} with {" "}
                              {selectedFriend ? nameOf(selectedFriend) : "Friend"}
                            </h3>
                            {/*<p className="text-[#2C6E7E]">
                              {meetingDate ? formatDate(meetingDate) : "Date not set"}
                            </p> */}
                            <p className="text-[#946923]">{durationLabel}</p>
                          </div>
                        </div>
                      </CardContent>
                    </PapyrusCard>

                    {/* Slots list */}
                    <div>
                      <h2 className="text-[#D4AF37] mb-3 flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Available Time Slot{suggestions.length > 1 ? "s" : ""} (
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
                                      {formatTime(s.start)} – {formatTime(s.end)}
                                    </p>
                                    <p className="text-[#2C6E7E]">
                                    {formatDate(s.start)}
                                   </p> 
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </PapyrusCard>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <PapyrusCard>
                    <CardContent className="py-8 text-center">
                      <Clock className="w-10 h-10 mx-auto mb-3 text-[#C5A572]" />
                      <p className="text-[#2C6E7E] mb-1">
                        No available times found
                      </p>
                      <p className="text-[#C5A572] text-sm">
                        Try adjusting your work hours, duration, or choosing a
                        different date.
                      </p>
                    </CardContent>
                  </PapyrusCard>
                )}
              </div>

              <AlertDialogFooter className="mt-6">
                <AlertDialogCancel className="bg-[#1B4B5A] hover:bg-[#2C6E7E] hover:text-[#D4AF37] text-[#D4AF37] border border-[#D4AF37]">
                  Close
                </AlertDialogCancel>
              </AlertDialogFooter>
            </div>
          </PapyrusCard>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
