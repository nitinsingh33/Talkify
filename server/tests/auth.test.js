const request = require("supertest");
const { connect, disconnect, clearDatabase } = require("./testDb");
const app = require("../app.js");

beforeAll(connect);
afterEach(clearDatabase);
afterAll(disconnect);

const validUser = {
  name: "Test User",
  email: "testuser@example.com",
  password: "password123",
};

describe("POST /auth/register", () => {
  it("creates an account and returns a JWT", async () => {
    const res = await request(app).post("/auth/register").send(validUser);
    expect(res.status).toBe(200);
    expect(typeof res.body.authtoken).toBe("string");
  });

  it("rejects missing fields", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "nobody@example.com" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/fill all the fields/i);
  });

  it("rejects a duplicate email", async () => {
    await request(app).post("/auth/register").send(validUser);
    const res = await request(app).post("/auth/register").send(validUser);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already exists/i);
  });
});

describe("POST /auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/auth/register").send(validUser);
  });

  it("logs in with the correct password", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: validUser.email, password: validUser.password });
    expect(res.status).toBe(200);
    expect(typeof res.body.authtoken).toBe("string");
    expect(res.body.user.email).toBe(validUser.email);
  });

  it("rejects an incorrect password", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: validUser.email, password: "wrong-password" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid credentials/i);
  });

  it("rejects an unknown email", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "nobody@example.com", password: "whatever" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid credentials/i);
  });
});

describe("GET /auth/me", () => {
  it("rejects requests with no token", async () => {
    const res = await request(app).get("/auth/me");
    expect(res.status).toBe(401);
  });

  it("rejects an invalid token", async () => {
    const res = await request(app).get("/auth/me").set("auth-token", "not-a-real-token");
    expect(res.status).toBe(401);
  });

  it("returns the authenticated user's profile for a valid token", async () => {
    const registerRes = await request(app).post("/auth/register").send(validUser);
    const res = await request(app)
      .get("/auth/me")
      .set("auth-token", registerRes.body.authtoken);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(validUser.email);
    expect(res.body.password).toBeUndefined();
  });
});
