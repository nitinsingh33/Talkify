const request = require("supertest");
const { connect, disconnect } = require("./testDb");
const app = require("../app.js");

beforeAll(connect);
afterAll(disconnect);

describe("GET /health", () => {
  it("reports ok with a connected db", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.db).toBe("connected");
    expect(typeof res.body.uptimeSeconds).toBe("number");
  });
});

describe("unmatched routes", () => {
  it("returns a clean JSON 404 instead of Express's HTML page", async () => {
    const res = await request(app).get("/this-route-does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Route not found/);
  });
});

describe("malformed request bodies", () => {
  it("returns a clean 400 for invalid JSON instead of crashing", async () => {
    const res = await request(app)
      .post("/auth/login")
      .set("Content-Type", "application/json")
      .send("{not valid json");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Malformed JSON body");
  });
});
