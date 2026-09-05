const request = require("supertest");
const { connect, disconnect, clearDatabase } = require("./testDb");
const app = require("../app.js");

beforeAll(connect);
afterEach(clearDatabase);
afterAll(disconnect);

const registerUser = async (name, email, password = "password123") => {
  const res = await request(app).post("/auth/register").send({ name, email, password });
  const me = await request(app).get("/auth/me").set("auth-token", res.body.authtoken);
  return { token: res.body.authtoken, id: me.body._id };
};

describe("Block / unblock", () => {
  it("blocks a user and reports mutual block status", async () => {
    const alice = await registerUser("Alice", "alice@example.com");
    const bob = await registerUser("Bob", "bob@example.com");

    const blockRes = await request(app)
      .post(`/user/block/${bob.id}`)
      .set("auth-token", alice.token);
    expect(blockRes.status).toBe(200);

    const statusFromAlice = await request(app)
      .get(`/user/block-status/${bob.id}`)
      .set("auth-token", alice.token);
    expect(statusFromAlice.body).toEqual({ iBlockedThem: true, theyBlockedMe: false });

    const statusFromBob = await request(app)
      .get(`/user/block-status/${alice.id}`)
      .set("auth-token", bob.token);
    expect(statusFromBob.body).toEqual({ iBlockedThem: false, theyBlockedMe: true });
  });

  it("unblocks a previously blocked user", async () => {
    const alice = await registerUser("Alice", "alice@example.com");
    const bob = await registerUser("Bob", "bob@example.com");

    await request(app).post(`/user/block/${bob.id}`).set("auth-token", alice.token);
    const unblockRes = await request(app)
      .delete(`/user/block/${bob.id}`)
      .set("auth-token", alice.token);
    expect(unblockRes.status).toBe(200);

    const status = await request(app)
      .get(`/user/block-status/${bob.id}`)
      .set("auth-token", alice.token);
    expect(status.body.iBlockedThem).toBe(false);
  });

  it("rejects an invalid user id", async () => {
    const alice = await registerUser("Alice", "alice@example.com");
    const res = await request(app)
      .post("/user/block/not-a-real-id")
      .set("auth-token", alice.token);
    expect(res.status).toBe(400);
  });
});

describe("PUT /user/update", () => {
  it("updates profile fields", async () => {
    const alice = await registerUser("Alice", "alice@example.com");
    const res = await request(app)
      .put("/user/update")
      .set("auth-token", alice.token)
      .send({ name: "Alice Updated", about: "New bio" });
    expect(res.status).toBe(200);

    const me = await request(app).get("/auth/me").set("auth-token", alice.token);
    expect(me.body.name).toBe("Alice Updated");
    expect(me.body.about).toBe("New bio");
  });

  it("requires the current password to set a new one", async () => {
    const alice = await registerUser("Alice", "alice@example.com");
    const res = await request(app)
      .put("/user/update")
      .set("auth-token", alice.token)
      .send({ newpassword: "newpassword123" });
    expect(res.status).toBe(400);
  });

  it("rejects the wrong current password", async () => {
    const alice = await registerUser("Alice", "alice@example.com");
    const res = await request(app)
      .put("/user/update")
      .set("auth-token", alice.token)
      .send({ oldpassword: "wrong-password", newpassword: "newpassword123" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid credentials/i);
  });
});

describe("GET /user/non-friends and /user/all", () => {
  it("excludes users you already share a conversation with from non-friends", async () => {
    const alice = await registerUser("Alice", "alice@example.com");
    const bob = await registerUser("Bob", "bob@example.com");
    const carol = await registerUser("Carol", "carol@example.com");

    await request(app)
      .post("/conversation")
      .set("auth-token", alice.token)
      .send({ members: [alice.id, bob.id] });

    const res = await request(app).get("/user/non-friends").set("auth-token", alice.token);
    expect(res.status).toBe(200);
    const names = res.body.users.map((u) => u.name);
    expect(names).not.toContain("Bob");
    expect(names).toContain("Carol");
  });

  it("/user/all includes existing contacts too", async () => {
    const alice = await registerUser("Alice", "alice@example.com");
    const bob = await registerUser("Bob", "bob@example.com");

    await request(app)
      .post("/conversation")
      .set("auth-token", alice.token)
      .send({ members: [alice.id, bob.id] });

    const res = await request(app).get("/user/all").set("auth-token", alice.token);
    expect(res.status).toBe(200);
    const names = res.body.users.map((u) => u.name);
    expect(names).toContain("Bob");
  });
});
