import React, { useEffect, useState } from "react";
import { CalendarDays, Clock, Users, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { EgyptianBorder, PapyrusCard, SundialIcon } from "./egyptian-decorations";
import { getFriends, suggestSchedule, createEvent, type Friend, type Suggestion } from "../lib/mock-api";
import { toast } from "sonner@2.0.3";

export function ScheduleCombine() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriendId, setSelectedFriendId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [duration, setDuration] = useState("60");
  const [timezone, setTimezone] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Suggestion | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingLocation, setMeetingLocation] = useState("");
  const [meetingDescription, setMeetingDescription] = useState("");

  useEffect(() => {
    loadFriends();
    // Set default timezone
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezone(userTimezone);
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDate(tomorrow.toISOString().split("T")[0]);
  }, []);

  async function loadFriends() {
    try {
      const response = await getFriends();
      setFriends(response.friends);
    } catch (error) {
      console.error("Failed to load friends:", error);
    }
  }

  async function handleFindTime() {
    if (!selectedFriendId || !date || !startTime || !endTime) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const response = await suggestSchedule({
        friendId: selectedFriendId,
        date,
        timeWindow: { start: startTime, end: endTime },
        timezone,
        durationMin: parseInt(duration),
        granularityMin: 15,
      });

      setSuggestions(response.suggestions);
      setShowSuggestions(true);

      if (response.suggestions.length === 0) {
        toast.info("No available times found in this window");
      } else {
        toast.success(`Found ${response.suggestions.length} available time slots!`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to find available times");
    } finally {
      setLoading(false);
    }
  }

  function handleSelectSlot(slot: Suggestion) {
    setSelectedSlot(slot);
    setShowConfirmDialog(true);
    // Pre-fill meeting title with friend name
    const friend = friends.find((f) => f.friendId === selectedFriendId);
    if (friend) {
      setMeetingTitle(`Meeting with ${friend.nickname}`);
    }
  }

  async function handleConfirmMeeting() {
    if (!selectedSlot || !meetingTitle) {
      toast.error("Please enter a meeting title");
      return;
    }

    try {
      await createEvent({
        friendId: selectedFriendId,
        title: meetingTitle,
        start: selectedSlot.start,
        end: selectedSlot.end,
        location: meetingLocation,
        description: meetingDescription,
      });

      toast.success("Meeting created and added to both calendars!");
      setShowConfirmDialog(false);
      setShowSuggestions(false);
      setSuggestions([]);
      setSelectedSlot(null);
      setMeetingTitle("");
      setMeetingLocation("");
      setMeetingDescription("");
    } catch (error) {
      toast.error("Failed to create meeting");
    }
  }

  function formatTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  function formatDate(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }

  const selectedFriend = friends.find((f) => f.friendId === selectedFriendId);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B4B5A] to-[#2C6E7E] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <SundialIcon className="w-10 h-10 text-[#D4AF37]" />
            <div>
              <h1 className="text-[#D4AF37] tracking-wide">Find the Perfect Time</h1>
              <p className="text-[#C5A572]">Combine schedules to discover your Kairos</p>
            </div>
          </div>
          <EgyptianBorder className="my-4" />
        </div>

        {/* Main Form */}
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
              {/* Friend Selection */}
              <div className="space-y-2">
                <Label htmlFor="friend" className="text-[#1B4B5A]">
                  Select Friend
                </Label>
                <Select value={selectedFriendId} onValueChange={setSelectedFriendId}>
                  <SelectTrigger className="bg-white border-[#D4AF37]">
                    <SelectValue placeholder="Choose a friend..." />
                  </SelectTrigger>
                  <SelectContent>
                    {friends.map((friend) => (
                      <SelectItem key={friend.friendId} value={friend.friendId}>
                        {friend.nickname} ({friend.friend.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Selection */}
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

              {/* Time Window */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime" className="text-[#1B4B5A]">
                    Start Time
                  </Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="bg-white border-[#D4AF37]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime" className="text-[#1B4B5A]">
                    End Time
                  </Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
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

              {/* Timezone */}
              <div className="space-y-2">
                <Label htmlFor="timezone" className="text-[#1B4B5A]">
                  Timezone
                </Label>
                <Input
                  id="timezone"
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="bg-white border-[#D4AF37]"
                  placeholder="America/New_York"
                />
              </div>

              {/* Submit Button */}
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
          /* Suggestions View */
          <div className="space-y-6">
            {/* Header with friend info */}
            <PapyrusCard>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C5A572] flex items-center justify-center text-[#1B4B5A]">
                      {selectedFriend?.nickname.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-[#1B4B5A]">
                        Meeting with {selectedFriend?.nickname}
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

            {/* Suggestions List */}
            <div>
              <h2 className="text-[#D4AF37] mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Available Time Slots ({suggestions.length})
              </h2>
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <PapyrusCard
                    key={index}
                    className="cursor-pointer hover:shadow-xl transition-shadow"
                    onClick={() => handleSelectSlot(suggestion)}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#C5A572] flex flex-col items-center justify-center text-[#1B4B5A]">
                            <span className="text-xs">Slot</span>
                            <span>{index + 1}</span>
                          </div>
                          <div>
                            <p className="text-[#1B4B5A]">
                              {formatTime(suggestion.start)} - {formatTime(suggestion.end)}
                            </p>
                            <p className="text-[#2C6E7E]">
                              {duration} minute meeting
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[#D4AF37]" />
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

      {/* Confirm Meeting Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-[#F5E6D3] border-2 border-[#D4AF37] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1B4B5A] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#D4AF37]" />
              Confirm Meeting
            </DialogTitle>
            <DialogDescription className="text-[#2C6E7E]">
              {selectedSlot && (
                <>
                  {formatDate(selectedSlot.start)} at {formatTime(selectedSlot.start)} -{" "}
                  {formatTime(selectedSlot.end)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-[#1B4B5A]">
                Meeting Title *
              </Label>
              <Input
                id="title"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                className="bg-white border-[#D4AF37]"
                placeholder="e.g., Coffee catch-up"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location" className="text-[#1B4B5A]">
                Location (optional)
              </Label>
              <Input
                id="location"
                value={meetingLocation}
                onChange={(e) => setMeetingLocation(e.target.value)}
                className="bg-white border-[#D4AF37]"
                placeholder="e.g., Zoom, Cafe, Office"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-[#1B4B5A]">
                Description (optional)
              </Label>
              <Input
                id="description"
                value={meetingDescription}
                onChange={(e) => setMeetingDescription(e.target.value)}
                className="bg-white border-[#D4AF37]"
                placeholder="Add notes or agenda..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              className="border-[#C5A572] text-[#2C6E7E]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmMeeting}
              disabled={!meetingTitle}
              className="bg-[#1B4B5A] hover:bg-[#2C6E7E] text-[#D4AF37] border-2 border-[#D4AF37]"
            >
              Confirm & Add to Calendars
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
