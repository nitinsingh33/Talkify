const request = require("supertest");
const { connect, disconnect, clearDatabase } = require("./testDb");
const app = require("../app.js");

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

describe("POST /conversation (1:1)", () => {
  it("creates a conversation between two users", async () => {
    const alice = await registerUser("Alice", "alice@example.com");
    const bob = await registerUser("Bob", "bob@example.com");

    const res = await request(app)
      .post("/conversation")
      .set("auth-token", alice.token)
      .send({ members: [alice.id, bob.id] });

    expect(res.status).toBe(200);
    expect(res.body.isGroup).toBeFalsy();
    // 1:1 responses exclude the requester from the members array
    expect(res.body.members.some((m) => m._id === bob.id)).toBe(true);
    expect(res.body.members.some((m) => m._id === alice.id)).toBe(false);
  });

  it("reuses an existing conversation instead of creating a duplicate", async () => {
    const alice = await registerUser("Alice", "alice@example.com");
    const bob = await registerUser("Bob", "bob@example.com");

    const first = await request(app)
      .post("/conversation")
      .set("auth-token", alice.token)
      .send({ members: [alice.id, bob.id] });
    const second = await request(app)
      .post("/conversation")
      .set("auth-token", alice.token)
      .send({ members: [alice.id, bob.id] });

    expect(second.body._id).toBe(first.body._id);
  });
});

describe("POST /conversation/group", () => {
  it("creates a group and makes the creator an admin", async () => {
    const alice = await registerUser("Alice", "alice@example.com");
    const bob = await registerUser("Bob", "bob@example.com");
    const carol = await registerUser("Carol", "carol@example.com");

    const res = await request(app)
      .post("/conversation/group")
      .set("auth-token", alice.token)
      .send({ name: "Weekend Trip", members: [bob.id, carol.id] });

    expect(res.status).toBe(201);
    expect(res.body.isGroup).toBe(true);
    expect(res.body.groupName).toBe("Weekend Trip");
    expect(res.body.groupAdmins).toContain(alice.id);
    expect(res.body.members).toHaveLength(3);
  });

  it("rejects a missing group name", async () => {
    const alice = await registerUser("Alice", "alice@example.com");
    const bob = await registerUser("Bob", "bob@example.com");
    const carol = await registerUser("Carol", "carol@example.com");

    const res = await request(app)
      .post("/conversation/group")
      .set("auth-token", alice.token)
      .send({ members: [bob.id, carol.id] });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/name is required/i);
  });

  it("rejects fewer than 2 other members", async () => {
    const alice = await registerUser("Alice", "alice@example.com");
    const bob = await registerUser("Bob", "bob@example.com");

    const res = await request(app)
      .post("/conversation/group")
      .set("auth-token", alice.token)
      .send({ name: "Too Small", members: [bob.id] });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/at least 2 other members/i);
  });
});

describe("Group membership management", () => {
  const setupGroup = async () => {
    const alice = await registerUser("Alice", "alice@example.com");
    const bob = await registerUser("Bob", "bob@example.com");
    const carol = await registerUser("Carol", "carol@example.com");
    const group = await request(app)
      .post("/conversation/group")
      .set("auth-token", alice.token)
      .send({ name: "Team", members: [bob.id, carol.id] });
    return { alice, bob, carol, groupId: group.body._id };
  };

  it("lets an admin remove a member", async () => {
    const { alice, bob, groupId } = await setupGroup();
    const res = await request(app)
      .delete(`/conversation/${groupId}/members/${bob.id}`)
      .set("auth-token", alice.token);
    expect(res.status).toBe(200);
  });

  it("rejects a non-admin trying to remove a member", async () => {
    const { bob, carol, groupId } = await setupGroup();
    const res = await request(app)
      .delete(`/conversation/${groupId}/members/${carol.id}`)
      .set("auth-token", bob.token);
    expect(res.status).toBe(403);
  });

  it("rejects removing the group creator", async () => {
    const { alice, groupId } = await setupGroup();
    const res = await request(app)
      .delete(`/conversation/${groupId}/members/${alice.id}`)
      .set("auth-token", alice.token);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/cannot remove the group creator/i);
  });

  it("lets any member leave the group", async () => {
    const { bob, groupId } = await setupGroup();
    const res = await request(app)
      .post(`/conversation/${groupId}/leave`)
      .set("auth-token", bob.token);
    expect(res.status).toBe(200);
  });
});
