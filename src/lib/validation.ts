import { z } from "zod";
import { categories } from "./domain";
const text = (min: number, max: number) => z.string().trim().min(min).max(max);
export const registerSchema = z
  .object({
    name: text(2, 80),
    email: z
      .email()
      .max(254)
      .transform((s) => s.toLowerCase()),
    password: z
      .string()
      .min(12)
      .max(128)
      .regex(/[A-Z]/, "Include an uppercase letter")
      .regex(/[a-z]/, "Include a lowercase letter")
      .regex(/[0-9]/, "Include a number"),
    role: z.enum(["CITIZEN", "RESEARCHER", "INSTITUTION", "INDUSTRY"]),
    organizationName: text(2, 150).optional(),
    city: text(2, 80).optional(),
  })
  .superRefine((v, c) => {
    if (["INSTITUTION", "INDUSTRY"].includes(v.role) && (!v.organizationName || !v.city))
      c.addIssue({
        code: "custom",
        message: "Organization name and city are required",
        path: ["organizationName"],
      });
  });
export const problemSchema = z.object({
  title: text(12, 160),
  description: text(40, 12000),
  category: z.enum(categories),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  state: text(2, 80),
  city: text(2, 80),
  area: text(2, 150),
  latitude: z.number().min(6).max(38),
  longitude: z.number().min(68).max(98),
  population: z.number().int().min(1).max(100000000),
  imageIds: z.array(z.string()).max(4).default([]),
});
export const proposalSchema = z.object({
  title: text(10, 160),
  problemId: z.string().min(1),
  approach: text(40, 16000),
  techStack: text(3, 1000),
  impact: text(20, 5000),
  feasibility: text(20, 5000),
  resources: text(10, 3000),
  teamId: z.string().optional(),
  imageIds: z.array(z.string()).max(3).default([]),
});
export const commentSchema = z.object({ body: text(3, 3000) });
export const teamSchema = z.object({ name: text(3, 100), description: text(20, 2000) });
export const supportSchema = z.object({
  type: z.enum(["MENTORSHIP", "RESOURCES", "FUNDING_INTEREST", "EXPERTISE"]),
  description: text(20, 3000),
});
export const profileSchema = z.object({
  name: text(2, 80),
  bio: z.string().trim().max(2000),
  skills: z.array(text(1, 50)).max(20),
  interests: z.array(z.enum(categories)).max(10),
});
