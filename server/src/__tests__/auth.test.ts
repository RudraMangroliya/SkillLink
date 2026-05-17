import request from "supertest";
import { app } from "../index";
import { User } from "../models/User";
import mongoose from "mongoose";

describe("Auth Endpoints", () => {
  const testUser = {
    name: "Test User",
    email: "testuser@example.com",
    password: "password123",
    role: "student"
  };

  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send(testUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty("_id");
      expect(response.body.email).toBe(testUser.email);
    });

    it("should not register a user with an existing email", async () => {
      // First registration
      await request(app).post("/api/auth/register").send(testUser);

      // Second registration with same email
      const response = await request(app)
        .post("/api/auth/register")
        .send(testUser);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("User already exists");
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      await request(app).post("/api/auth/register").send(testUser);
    });

    it("should login successfully with correct credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
      expect(response.body.email).toBe(testUser.email);
    });

    it("should not login with incorrect password", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: "wrongpassword"
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid email or password");
    });
  });
});
