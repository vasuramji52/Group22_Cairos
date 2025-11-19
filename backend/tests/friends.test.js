// backend/tests/friends.test.js
const request = require("supertest");
const express = require("express");
const { ObjectId } = require("mongodb");

jest.mock("mongodb");

// Make requireAuth a jest.fn so we can change behavior in specific tests
jest.mock("../auth.middleware", () => ({
  requireAuth: jest.fn((req, res, next) => {
    req.userId = "64a000000000000000000001"; // default: simulate authenticated user
    next();
  }),
}));

const { requireAuth } = require("../auth.middleware");

let app;
let usersColl;

beforeEach(() => {
  // reset default auth behavior + call history
  requireAuth.mockClear();
  requireAuth.mockImplementation((req, res, next) => {
    req.userId = "64a000000000000000000001";
    next();
  });

  app = express();
  app.use(express.json());

  usersColl = {
    findOne: jest.fn(),
    find: jest.fn().mockReturnValue({ toArray: jest.fn() }),
    updateOne: jest.fn(),
  };

  const client = {
    db: () => ({
      collection: () => usersColl,
    }),
  };

  require("../friends").setApp(app, client);
});

//
// GET /api/getfriends
//
describe("GET /api/getfriends", () => {
  it("returns 400 if userId not found", async () => {
    // For this test, build a fresh app where requireAuth does NOT set userId
    requireAuth.mockImplementation((req, res, next) => {
      req.userId = null;
      next();
    });

    const localApp = express();
    localApp.use(express.json());

    const localUsersColl = {
      findOne: jest.fn(),
      find: jest.fn().mockReturnValue({ toArray: jest.fn() }),
      updateOne: jest.fn(),
    };

    const client = {
      db: () => ({
        collection: () => localUsersColl,
      }),
    };

    require("../friends").setApp(localApp, client);

    const res = await request(localApp).get("/api/getfriends");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "User not found" });
  });

  it("returns 404 if user not found", async () => {
    usersColl.findOne.mockResolvedValueOnce(null);
    const res = await request(app).get("/api/getfriends");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "User not found" });
  });

  it("returns empty arrays for no friends and no requests", async () => {
    const userId = new ObjectId("64a000000000000000000001");
    usersColl.findOne.mockResolvedValueOnce({
      _id: userId,
      email: "me@example.com",
      friends: [],
      sentRequests: [],
      receivedRequests: [],
    });
    usersColl.find.mockReturnValue({
      toArray: jest.fn().mockResolvedValue([]),
    });
    const res = await request(app).get("/api/getfriends");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      friends: [],
      sentRequests: [],
      receivedRequests: [],
    });
  });

  it("returns friends, sent requests, and received requests", async () => {
    const userId = new ObjectId("64a000000000000000000001");
    const friendId = new ObjectId("64a000000000000000000002");
    const sentId = new ObjectId("64a000000000000000000003");
    const receivedId = new ObjectId("64a000000000000000000004");
    usersColl.findOne.mockResolvedValueOnce({
      _id: userId,
      friends: [friendId],
      sentRequests: [sentId],
      receivedRequests: [receivedId],
    });
    usersColl.find.mockImplementation(({ _id }) => {
      if (_id.$in && _id.$in.includes(friendId)) {
        return {
          toArray: jest
            .fn()
            .mockResolvedValue([{ _id: friendId, email: "f@example.com" }]),
        };
      }
      if (_id.$in && _id.$in.includes(sentId)) {
        return {
          toArray: jest
            .fn()
            .mockResolvedValue([{ _id: sentId, email: "sent@example.com" }]),
        };
      }
      if (_id.$in && _id.$in.includes(receivedId)) {
        return {
          toArray: jest
            .fn()
            .mockResolvedValue([{ _id: receivedId, email: "received@example.com" }]),
        };
      }
      return { toArray: jest.fn().mockResolvedValue([]) };
    });
    const res = await request(app).get("/api/getfriends");
    expect(res.status).toBe(200);
    expect(res.body.friends[0]._id).toBe(friendId.toString());
    expect(res.body.sentRequests[0]._id).toBe(sentId.toString());
    expect(res.body.receivedRequests[0]._id).toBe(receivedId.toString());
  });

  // NEW: cover catch block 199–201
  it("returns 500 if there is an error retrieving friends list", async () => {
    usersColl.findOne.mockRejectedValueOnce(new Error("DB failure"));
    const res = await request(app).get("/api/getfriends");
    expect(res.status).toBe(500);
    expect(res.body.error).toContain("DB failure");
  });
});

//
// POST /api/addfriend
//
describe("POST /api/addfriend", () => {
  it("returns 400 if missing fields", async () => {
    const res = await request(app).post("/api/addfriend").send({});
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "Missing userId or friendEmail field.",
    });
  });

  it("returns 400 if user or friend not found", async () => {
    usersColl.findOne.mockResolvedValueOnce(null);
    const res = await request(app)
      .post("/api/addfriend")
      .send({ friendEmail: "f@example.com" });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "User not found" });
  });

  it("returns 403 if friend not verified or not connected", async () => {
    usersColl.findOne
      .mockResolvedValueOnce({
        _id: new ObjectId("64a000000000000000000001"),
        friends: [],
        sentRequests: [],
        receivedRequests: [],
      })
      .mockResolvedValueOnce({
        _id: new ObjectId("64a000000000000000000002"),
        email: "f@example.com",
        isVerified: false,
        google: {},
      });
    const res = await request(app)
      .post("/api/addfriend")
      .send({ friendEmail: "f@example.com" });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      error:
        "Cannot add this friend - user not verified or connected with Google.",
    });
  });

  it("returns 400 if already friends", async () => {
    const friendId = new ObjectId("64a000000000000000000002");
    usersColl.findOne
      .mockResolvedValueOnce({
        _id: new ObjectId("64a000000000000000000001"),
        friends: [friendId],
        sentRequests: [],
        receivedRequests: [],
      })
      .mockResolvedValueOnce({
        _id: friendId,
        email: "f@example.com",
        isVerified: true,
        google: { connected: true },
      });
    const res = await request(app)
      .post("/api/addfriend")
      .send({ friendEmail: "f@example.com" });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "User is already your friend." });
  });

  it("returns 400 if request already sent", async () => {
    const friendId = new ObjectId("64a000000000000000000002");
    usersColl.findOne
      .mockResolvedValueOnce({
        _id: new ObjectId("64a000000000000000000001"),
        friends: [],
        sentRequests: [friendId],
        receivedRequests: [],
      })
      .mockResolvedValueOnce({
        _id: friendId,
        email: "f@example.com",
        isVerified: true,
        google: { connected: true },
      });
    const res = await request(app)
      .post("/api/addfriend")
      .send({ friendEmail: "f@example.com" });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Friend request already sent." });
  });

  it("sends a friend request successfully", async () => {
    const userId = new ObjectId("64a000000000000000000001");
    const friendId = new ObjectId("64a000000000000000000002");
    usersColl.findOne
      .mockResolvedValueOnce({
        _id: userId,
        email: "me@example.com",
        isVerified: true,
        google: { connected: true },
        friends: [],
        sentRequests: [],
        receivedRequests: [],
      })
      .mockResolvedValueOnce({
        _id: friendId,
        email: "f@example.com",
        isVerified: true,
        google: { connected: true },
        friends: [],
        sentRequests: [],
        receivedRequests: [],
      });
    usersColl.updateOne.mockResolvedValue({});
    const res = await request(app)
      .post("/api/addfriend")
      .send({ friendEmail: "f@example.com" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Friend request sent successfully" });
    expect(usersColl.updateOne).toHaveBeenCalledTimes(2);
  });

  // NEW: cover catch block 62–64
  it("returns 500 if there is an error sending friend request", async () => {
    usersColl.findOne.mockRejectedValueOnce(new Error("DB error addfriend"));
    const res = await request(app)
      .post("/api/addfriend")
      .send({ friendEmail: "f@example.com" });
    expect(res.status).toBe(500);
    expect(res.body.error).toContain("DB error addfriend");
  });
});

//
// POST /api/acceptfriend
//
describe("POST /api/acceptfriend", () => {
  it("returns 404 if user or requester not found", async () => {
    usersColl.findOne.mockResolvedValueOnce(null);
    const res = await request(app)
      .post("/api/acceptfriend")
      .send({ requesterId: new ObjectId("64a000000000000000000002") });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "User not found." });
  });

  it("accepts friend request and updates both users", async () => {
    const userId = new ObjectId("64a000000000000000000001");
    const requesterId = new ObjectId("64a000000000000000000002");
    usersColl.findOne
      .mockResolvedValueOnce({ _id: userId, receivedRequests: [requesterId] })
      .mockResolvedValueOnce({ _id: requesterId, sentRequests: [userId] });
    usersColl.updateOne.mockResolvedValue({});
    const res = await request(app)
      .post("/api/acceptfriend")
      .send({ requesterId });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Friend request accepted." });
    expect(usersColl.updateOne).toHaveBeenCalledTimes(2);
  });

  // NEW: cover catch block 99–100
  it("returns 500 if there is an error accepting friend", async () => {
    const userId = new ObjectId("64a000000000000000000001");
    const requesterId = new ObjectId("64a000000000000000000002");
    usersColl.findOne
      .mockResolvedValueOnce({ _id: userId, receivedRequests: [requesterId] })
      .mockResolvedValueOnce({ _id: requesterId, sentRequests: [userId] });

    usersColl.updateOne.mockRejectedValueOnce(
      new Error("DB error acceptfriend"),
    );

    const res = await request(app)
      .post("/api/acceptfriend")
      .send({ requesterId });
    expect(res.status).toBe(500);
    expect(res.body.error).toContain("DB error acceptfriend");
  });
});

//
// POST /api/declinefriend
//
describe("POST /api/declinefriend", () => {
  it("declines friend request and updates both users", async () => {
    const requesterId = new ObjectId("64a000000000000000000002");
    usersColl.updateOne.mockResolvedValue({});
    const res = await request(app)
      .post("/api/declinefriend")
      .send({ requesterId });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Friend request declined." });
    expect(usersColl.updateOne).toHaveBeenCalledTimes(2);
  });
});

//
// POST /api/removefriend
//
describe("POST /api/removefriend", () => {
  it("returns 400 if missing fields", async () => {
    const res = await request(app).post("/api/removefriend").send({});
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "Missing userId or friendId field.",
    });
  });

  it("returns 400 if user or friend not found", async () => {
    usersColl.findOne.mockResolvedValueOnce(null);
    const res = await request(app)
      .post("/api/removefriend")
      .send({ friendEmail: "f@example.com" });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "User not found" });
  });

  it("removes friend successfully", async () => {
    const userId = new ObjectId("64a000000000000000000001");
    const friendId = new ObjectId("64a000000000000000000002");
    usersColl.findOne
      .mockResolvedValueOnce({ _id: userId })
      .mockResolvedValueOnce({ _id: friendId, email: "f@example.com" });
    usersColl.updateOne.mockResolvedValue({});
    const res = await request(app)
      .post("/api/removefriend")
      .send({ friendEmail: "f@example.com" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Friend removed successfully" });
    expect(usersColl.updateOne).toHaveBeenCalledTimes(2);
  });

  // NEW: cover catch block 154–156
  it("returns 500 if there is an error removing friend", async () => {
    const userId = new ObjectId("64a000000000000000000001");
    const friendId = new ObjectId("64a000000000000000000002");
    usersColl.findOne
      .mockResolvedValueOnce({ _id: userId })
      .mockResolvedValueOnce({ _id: friendId, email: "f@example.com" });

    usersColl.updateOne.mockRejectedValueOnce(
      new Error("DB error removefriend"),
    );

    const res = await request(app)
      .post("/api/removefriend")
      .send({ friendEmail: "f@example.com" });
    expect(res.status).toBe(500);
    expect(res.body.error).toContain("DB error removefriend");
  });
});
