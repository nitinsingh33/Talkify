const request = require("supertest");
const { connect, disconnect, clearDatabase } = require("./testDb");
const app = require("../app.js");
const Message = require("../Models/Message.js");

beforeAll(connect);
afterEach(clearDatabase);
afterAll(disconnect);

const registerUser = async (name, email) => {
  const res = await request(app)
    .post("/auth/register")
    .send({ name, email, password: "password123" });
  const me = await request(app).get("/auth/me").set("auth-token", res.body.authtoken);
  return { token: res.body.authtoken, id: me.body._id };
};

const setupConversation = async () => {
  const alice = await registerUser("Alice", "alice@example.com");
  const bob = await registerUser("Bob", "bob@example.com");
  const conv = await request(app)
    .post("/conversation")
    .set("auth-token", alice.token)
    .send({ members: [alice.id, bob.id] });
  return { alice, bob, conversationId: conv.body._id };
};

const seedMessage = (conversationId, senderId, text = "hello") =>
  Message.create({ conversationId, senderId, text, seenBy: [] });

describe("GET /message/:id", () => {
  it("returns messages for a conversation and marks them seen", async () => {
    const { alice, bob, conversationId } = await setupConversation();
    const msg = await seedMessage(conversationId, alice.id);

    const res = await request(app)
      .get(`/message/${conversationId}`)
      .set("auth-token", bob.token);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]._id).toBe(msg._id.toString());

    const updated = await Message.findById(msg._id);
    expect(updated.seenBy.some((s) => s.user.toString() === bob.id)).toBe(true);
  });

  it("rejects a non-member of the conversation", async () => {
    const { conversationId } = await setupConversation();
    const carol = await registerUser("Carol", "carol@example.com");

    const res = await request(app)
      .get(`/message/${conversationId}`)
      .set("auth-token", carol.token);
    expect(res.status).toBe(403);
  });
});

describe("POST /message/:id/star", () => {
  it("toggles star on and off", async () => {
    const { alice, conversationId } = await setupConversation();
    const msg = await seedMessage(conversationId, alice.id);

    const starRes = await request(app)
      .post(`/message/${msg._id}/star`)
      .set("auth-token", alice.token);
    expect(starRes.status).toBe(200);
    expect(starRes.body.isStarred).toBe(true);

    const unstarRes = await request(app)
      .post(`/message/${msg._id}/star`)
      .set("auth-token", alice.token);
    expect(unstarRes.body.isStarred).toBe(false);
  });
});

describe("DELETE /message/:id", () => {
  it("hides a message for the requester only when scope is 'me'", async () => {
    const { alice, bob, conversationId } = await setupConversation();
    const msg = await seedMessage(conversationId, alice.id);

    const res = await request(app)
      .delete(`/message/${msg._id}`)
      .set("auth-token", alice.token)
      .send({ scope: "me" });
    expect(res.status).toBe(200);

    const updated = await Message.findById(msg._id);
    expect(updated.hiddenFrom.map(String)).toContain(alice.id);
    expect(updated.softDeleted).toBe(false);

    // Bob never hid it — still visible to him
    const bobView = await request(app)
      .get(`/message/${conversationId}`)
      .set("auth-token", bob.token);
    expect(bobView.body).toHaveLength(1);
  });

  it("only lets the sender delete for everyone", async () => {
    const { alice, bob, conversationId } = await setupConversation();
    const msg = await seedMessage(conversationId, alice.id);

    const res = await request(app)
      .delete(`/message/${msg._id}`)
      .set("auth-token", bob.token)
      .send({ scope: "everyone" });
    expect(res.status).toBe(403);
  });

  it("soft-deletes for everyone when the sender requests it", async () => {
    const { alice, conversationId } = await setupConversation();
    const msg = await seedMessage(conversationId, alice.id);

    const res = await request(app)
      .delete(`/message/${msg._id}`)
      .set("auth-token", alice.token)
      .send({ scope: "everyone" });
    expect(res.status).toBe(200);

    const updated = await Message.findById(msg._id);
    expect(updated.softDeleted).toBe(true);
  });

  it("rejects an invalid scope", async () => {
    const { alice, conversationId } = await setupConversation();
    const msg = await seedMessage(conversationId, alice.id);

    const res = await request(app)
      .delete(`/message/${msg._id}`)
      .set("auth-token", alice.token)
      .send({ scope: "not-a-real-scope" });
    expect(res.status).toBe(400);
  });
});

describe("POST /message/clear/:conversationId", () => {
  it("hides every message in the conversation for the requester", async () => {
    const { alice, conversationId } = await setupConversation();
    await seedMessage(conversationId, alice.id, "one");
    await seedMessage(conversationId, alice.id, "two");

    const res = await request(app)
      .post(`/message/clear/${conversationId}`)
      .set("auth-token", alice.token);
    expect(res.status).toBe(200);

    const remaining = await request(app)
      .get(`/message/${conversationId}`)
      .set("auth-token", alice.token);
    expect(remaining.body).toHaveLength(0);
  });
});

describe("DELETE /message/bulk/hide", () => {
  it("hides the given messages for the requester", async () => {
    const { alice, conversationId } = await setupConversation();
    const m1 = await seedMessage(conversationId, alice.id, "one");
    const m2 = await seedMessage(conversationId, alice.id, "two");

    const res = await request(app)
      .delete("/message/bulk/hide")
      .set("auth-token", alice.token)
      .send({ messageIds: [m1._id.toString(), m2._id.toString()] });
    expect(res.status).toBe(200);

    const remaining = await request(app)
      .get(`/message/${conversationId}`)
      .set("auth-token", alice.token);
    expect(remaining.body).toHaveLength(0);
  });

  it("rejects an empty messageIds array", async () => {
    const { alice } = await setupConversation();
    const res = await request(app)
      .delete("/message/bulk/hide")
      .set("auth-token", alice.token)
      .send({ messageIds: [] });
    expect(res.status).toBe(400);
  });
});
