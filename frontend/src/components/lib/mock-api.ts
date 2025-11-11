// Mock API functions for Cairos app
// Replace these with actual API calls in production

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  timezone: string;
  google: {
    connected: boolean;
  };
}

export interface Friend {
  _id: string;
  friendId: string;
  nickname: string;
  friend: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TimeWindow {
  start: string;
  end: string;
}

export interface Suggestion {
  start: string;
  end: string;
}

export interface ScheduleSuggestResponse {
  timezone: string;
  window: TimeWindow;
  suggestions: Suggestion[];
  message?: string;
}

// Mock current user data
let mockUser: User = {
  _id: "user_123",
  firstName: "Cleopatra",
  lastName: "Smith",
  email: "cleo@cairos.app",
  timezone: "America/New_York",
  google: {
    connected: false,
  },
};

// Mock friends data
let mockFriends: Friend[] = [
  {
    _id: "friend_1",
    friendId: "user_456",
    nickname: "Ramses",
    friend: {
      _id: "user_456",
      firstName: "Ramses",
      lastName: "Johnson",
      email: "ramses@example.com",
    },
    createdAt: "2025-10-20T10:00:00Z",
    updatedAt: "2025-10-20T10:00:00Z",
  },
  {
    _id: "friend_2",
    friendId: "user_789",
    nickname: "Nefertiti",
    friend: {
      _id: "user_789",
      firstName: "Nefertiti",
      lastName: "Williams",
      email: "nefertiti@example.com",
    },
    createdAt: "2025-10-21T14:30:00Z",
    updatedAt: "2025-10-21T14:30:00Z",
  },
  {
    _id: "friend_3",
    friendId: "user_101",
    nickname: "Tutankhamun",
    friend: {
      _id: "user_101",
      firstName: "Tutankhamun",
      lastName: "Davis",
      email: "tut@example.com",
    },
    createdAt: "2025-10-22T09:15:00Z",
    updatedAt: "2025-10-22T09:15:00Z",
  },
];

export async function getMe(): Promise<User> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));
  return { ...mockUser };
}

export async function connectGoogleCalendar(): Promise<{ url: string }> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  // Simulate OAuth flow - in real app this would redirect
  return { url: "/oauth/google/init" };
}

export async function completeGoogleConnection(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 800));
  // Simulate successful connection
  mockUser.google.connected = true;
}

export async function getFriends(search?: string): Promise<{ friends: Friend[]; nextCursor: null }> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  
  let filteredFriends = [...mockFriends];
  
  if (search) {
    const searchLower = search.toLowerCase();
    filteredFriends = filteredFriends.filter(
      (f) =>
        f.nickname.toLowerCase().includes(searchLower) ||
        f.friend.firstName.toLowerCase().includes(searchLower) ||
        f.friend.lastName.toLowerCase().includes(searchLower) ||
        f.friend.email.toLowerCase().includes(searchLower)
    );
  }
  
  return {
    friends: filteredFriends,
    nextCursor: null,
  };
}

export async function addFriend(email: string): Promise<{ message: string }> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  // Simulate validation
  if (email === mockUser.email) {
    throw new Error("Cannot add yourself as a friend");
  }
  
  if (mockFriends.some((f) => f.friend.email === email)) {
    throw new Error("Already friends with this user");
  }
  
  // Create mock friend
  const newFriend: Friend = {
    _id: `friend_${Date.now()}`,
    friendId: `user_${Date.now()}`,
    nickname: email.split("@")[0],
    friend: {
      _id: `user_${Date.now()}`,
      firstName: email.split("@")[0],
      lastName: "User",
      email: email,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  mockFriends.push(newFriend);
  
  return { message: "friend_added" };
}

export async function deleteFriend(id: string): Promise<{ message: string }> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  
  const index = mockFriends.findIndex((f) => f._id === id);
  if (index === -1) {
    throw new Error("Friend not found");
  }
  
  mockFriends.splice(index, 1);
  return { message: "friend_deleted" };
}

export async function suggestSchedule(params: {
  friendId: string;
  date: string;
  timeWindow: TimeWindow;
  timezone: string;
  durationMin: number;
  granularityMin: number;
}): Promise<ScheduleSuggestResponse> {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  // Simulate validation
  if (!mockUser.google.connected) {
    throw new Error("You must connect your Google Calendar first");
  }
  
  const friend = mockFriends.find((f) => f.friendId === params.friendId);
  if (!friend) {
    throw new Error("Friend not found");
  }
  
  // Generate mock suggestions (3-5 time slots)
  const suggestions: Suggestion[] = [];
  const baseDate = params.date;
  
  // Parse start time
  const [startHour, startMin] = params.timeWindow.start.split(":").map(Number);
  
  // Generate some random available slots
  const slots = [
    { hour: startHour, min: startMin },
    { hour: startHour + 2, min: 0 },
    { hour: startHour + 4, min: 30 },
    { hour: startHour + 6, min: 0 },
  ];
  
  slots.forEach((slot) => {
    const startTime = `${baseDate}T${String(slot.hour).padStart(2, "0")}:${String(slot.min).padStart(2, "0")}:00`;
    const endHour = slot.hour + Math.floor(params.durationMin / 60);
    const endMin = slot.min + (params.durationMin % 60);
    const endTime = `${baseDate}T${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}:00`;
    
    suggestions.push({
      start: startTime,
      end: endTime,
    });
  });
  
  return {
    timezone: params.timezone,
    window: params.timeWindow,
    suggestions: suggestions.slice(0, 4), // Return up to 4 suggestions
    message: suggestions.length > 0 ? undefined : "No available times found in this window",
  };
}

export async function createEvent(_params: {
  friendId: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
}): Promise<{ message: string; eventId: string }> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    message: "Meeting created successfully",
    eventId: `event_${Date.now()}`,
  };
}

export async function updateProfile(updates: Partial<User>): Promise<User> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  mockUser = { ...mockUser, ...updates };
  return { ...mockUser };
}

export async function logout(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  // In real app, clear tokens
}
