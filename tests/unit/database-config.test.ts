import { describe, it, expect } from "vitest";
import { databaseTarget } from "../../src/lib/database-config";

describe("deployment database configuration", () => {
  it("recognizes Atlas and a database-qualified SRV URL", () => {
    expect(
      databaseTarget(
        "mongodb+srv://app:encoded%40password@cluster.mongodb.net/civicbridge?retryWrites=true&w=majority",
      ),
    ).toEqual({ kind: "Atlas", database: "civicbridge" });
  });
  it("keeps local replica sets available", () => {
    expect(
      databaseTarget("mongodb://127.0.0.1:27018/civicbridge?replicaSet=civicbridge-rs"),
    ).toEqual({ kind: "MongoDB", database: "civicbridge" });
  });
  it("rejects missing configuration, incorrect protocols, and missing database names", () => {
    for (const value of [
      undefined,
      "",
      "not a URL",
      "postgresql://host/civicbridge",
      "mongodb+srv://user:pass@cluster.mongodb.net/",
    ]) {
      expect(() => databaseTarget(value)).toThrow();
    }
  });
  it("requires database credentials for Atlas", () => {
    expect(() => databaseTarget("mongodb+srv://cluster.mongodb.net/civicbridge")).toThrow(
      "database username and password",
    );
  });
  it("rejects unfilled templates and encoded placeholders without exposing credentials", () => {
    for (const value of [
      "mongodb+srv://user:<db_password>@cluster.mongodb.net/civicbridge",
      "mongodb+srv://user:%3Cdb_password%3E@cluster.mongodb.net/civicbridge",
    ]) {
      expect(() => databaseTarget(value)).toThrow("placeholders");
    }
    const secret = "do-not-print-this-password";
    try {
      databaseTarget(`mongodb+srv://user:${secret}@cluster.mongodb.net/`);
      throw new Error("Expected invalid configuration to fail");
    } catch (error) {
      expect((error as Error).message).not.toContain(secret);
    }
  });
  it("rejects malformed percent encoding with a safe error", () => {
    expect(() =>
      databaseTarget("mongodb+srv://user:bad%ZZ@cluster.mongodb.net/civicbridge"),
    ).toThrow("invalid percent encoding");
  });
});
