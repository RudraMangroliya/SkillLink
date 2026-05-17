import request from "supertest";
import { app } from "../index";
import { Profile } from "../models/Profile";
import { Job } from "../models/Job";
import axios from "axios";

// Mock axios completely
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("Recommendations Endpoints", () => {
  let token: string;
  let userId: string;
  let mockJobId: string;

  beforeEach(async () => {
    // 1. Register a user
    const userRes = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        role: "recruiter"
      });
    token = userRes.body.token;
    userId = userRes.body._id;

    // 2. Create a profile for the user
    await Profile.create({
      user: userId,
      headline: "Aspiring Developer",
      bio: "Learning to code",
      skills: ["JavaScript", "React"]
    });

    // 3. Create a mock job in the database
    const jobRes = await request(app)
      .post("/api/jobs")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Frontend Developer",
        company: "Tech Co",
        location: "Remote",
        type: "Full-time",
        description: "React job",
        requirements: ["JavaScript", "React"],
        salary: "$100k"
      });
    
    mockJobId = jobRes.body._id;
  });

  describe("GET /api/recommendations/jobs", () => {
    it("should fetch recommended jobs by communicating with AI service", async () => {
      // Mock the AI service response
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          recommendations: [
            {
              id: mockJobId,
              similarity_score: 0.85
            }
          ]
        }
      });

      const response = await request(app)
        .get("/api/recommendations/jobs")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(1);
      expect(response.body[0]._id).toBe(mockJobId);
      
      // Verify axios was called with correct URL
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      const urlCall = mockedAxios.post.mock.calls[0][0];
      expect(urlCall).toContain("/recommend");
    });

    it("should fail if user has no profile", async () => {
      // Create user without profile
      const userRes = await request(app)
        .post("/api/auth/register")
        .send({
          name: "No Profile User",
          email: "noprofile@example.com",
          password: "password123",
          role: "student"
        });
      
      const response = await request(app)
        .get("/api/recommendations/jobs")
        .set("Authorization", `Bearer ${userRes.body.token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Profile not found to base recommendations on");
    });
  });

  describe("POST /api/recommendations/smart-reply", () => {
    it("should return smart reply suggestions", async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          suggestions: ["Yes, I am available.", "Could we do another time?"]
        }
      });

      const response = await request(app)
        .post("/api/recommendations/smart-reply")
        .set("Authorization", `Bearer ${token}`)
        .send({ message: "Can we schedule an interview?" });

      expect(response.status).toBe(200);
      expect(response.body.suggestions).toBeDefined();
      expect(response.body.suggestions.length).toBe(2);
      expect(response.body.suggestions[0]).toBe("Yes, I am available.");
    });
  });
});
