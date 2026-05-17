import request from "supertest";
import { app } from "../index";
import { Job } from "../models/Job";

describe("Jobs Endpoints", () => {
  let token: string;
  let userId: string;

  beforeEach(async () => {
    // Register a test recruiter user to get a token
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test Recruiter",
        email: "recruiter@example.com",
        password: "password123",
        role: "recruiter"
      });
    token = res.body.token;
    userId = res.body._id;
  });

  const testJob = {
    title: "Software Engineer",
    company: "Tech Corp",
    location: "Remote",
    type: "Full-time",
    description: "Build awesome software",
    requirements: ["React", "Node.js"],
    salary: "$100k - $150k"
  };

  describe("POST /api/jobs", () => {
    it("should create a new job when authenticated as recruiter", async () => {
      const response = await request(app)
        .post("/api/jobs")
        .set("Authorization", `Bearer ${token}`)
        .send(testJob);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("_id");
      expect(response.body.title).toBe(testJob.title);
      expect(response.body.recruiter.toString()).toBe(userId);
    });

    it("should fail to create a job without authentication", async () => {
      const response = await request(app)
        .post("/api/jobs")
        .send(testJob);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Not authorized, no token");
    });
  });

  describe("GET /api/jobs", () => {
    it("should fetch all jobs successfully", async () => {
      // Create a job first
      await request(app)
        .post("/api/jobs")
        .set("Authorization", `Bearer ${token}`)
        .send(testJob);

      // Fetch jobs
      const response = await request(app)
        .get("/api/jobs");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].title).toBe(testJob.title);
    });
  });
});
