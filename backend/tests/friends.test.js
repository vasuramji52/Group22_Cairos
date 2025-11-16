const request = require("supertest");
const express = require("express");
const { ObjectId } = require("mongodb");

jest.mock("mongodb");
jest.mock("../auth.middleware", () => ({
  requireAuth: (req, res, next) => {
    req.userId = "64a000000000000000000001"; // simulate authenticated user
    next();
  },
}));

let app;
let usersColl;

beforeEach(() => {
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

  // require your friends.js and attach to app
  require("../friends").setApp(app, client);
});


// ------------------------------------------------------------
// 1) TEST ADD FRIEND (REQUEST VERSION)
// ------------------------------------------------------------
describe("POST /api/addfriend", () => {
  it("sends a friend request successfully", async () => {
    const userId = new ObjectId("64a000000000000000000001");
    const friendId = new ObjectId("64a000000000000000000002");

    // Mock DB lookups
    usersColl.findOne
      .mockResolvedValueOnce({
        _id: userId,
        email: "me@example.com",
        isVerified: true,
        google: { connected: true },
        friends: [],
        sentRequests: [],
        receivedRequests: []
      })
      .mockResolvedValueOnce({
        _id: friendId,
        email: "f@example.com",
        isVerified: true,
        google: { connected: true },
        friends: [],
        sentRequests: [],
        receivedRequests: []
      });

    usersColl.updateOne.mockResolvedValue({});

    const res = await request(app)
      .post("/api/addfriend")
      .send({ friendEmail: "f@example.com" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: "Friend request sent successfully",
    });

    expect(usersColl.updateOne).toHaveBeenCalledTimes(2);
  });
});


// ------------------------------------------------------------
// 2) TEST GET FRIENDS (EMPTY SECTIONS)
// ------------------------------------------------------------
describe("GET /api/getfriends", () => {
  it("returns empty arrays for no friends and no requests", async () => {
    const userId = new ObjectId("64a000000000000000000001");

    usersColl.findOne.mockResolvedValue({
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

  // ------------------------------------------------------------
  // 3) TEST GET FRIENDS (HAS FRIENDS)
  // ------------------------------------------------------------
  it("returns friends, sent requests, and received requests", async () => {
    const userId = new ObjectId("64a000000000000000000001");
    const friendId = new ObjectId("64a000000000000000000002");

    const friendDoc = {
      _id: friendId,
      email: "f@example.com",
    };

    usersColl.findOne.mockResolvedValue({
      _id: userId,
      friends: [friendId],
      sentRequests: [],
      receivedRequests: [],
    });

    usersColl.find.mockImplementation(({ _id }) => {
      if (_id.$in && _id.$in.includes(friendId)) {
        return { toArray: jest.fn().mockResolvedValue([friendDoc]) };
      }
      return { toArray: jest.fn().mockResolvedValue([]) };
    });

    const res = await request(app).get("/api/getfriends");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      friends: [{
        _id: friendId.toString(),   // REQUIRED FIX
        email: "f@example.com",
      }],
      sentRequests: [],
      receivedRequests: [],
    });
  });
});
