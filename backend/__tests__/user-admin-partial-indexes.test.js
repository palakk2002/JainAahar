import { jest } from "@jest/globals";
import User from "../app/models/customer.js";
import Admin from "../app/models/admin.js";

describe("User & Admin Partial Indexing and Normalization", () => {
  it("normalizes empty string phone and email to undefined in User pre-validate", async () => {
    const user = new User({
      name: "Empty Strings User",
      email: "   ",
      phone: "   ",
    });

    await user.validate();
    expect(user.email).toBeUndefined();
    expect(user.phone).toBeUndefined();
  });

  it("normalizes valid phone with E164 prefix in User pre-validate", async () => {
    const user = new User({
      name: "Phone User",
      phone: "9111966732",
    });

    await user.validate();
    expect(user.phone).toBe("+919111966732");
    expect(user.email).toBeUndefined();
  });

  it("normalizes valid email in User pre-validate", async () => {
    const user = new User({
      name: "Email User",
      email: "  TestUser@Example.Com  ",
    });

    await user.validate();
    expect(user.email).toBe("testuser@example.com");
    expect(user.phone).toBeUndefined();
  });

  it("normalizes empty admin phone to undefined in Admin pre-validate", async () => {
    const admin = new Admin({
      name: "Admin User",
      email: "admin@test.com",
      phone: "   ",
      password: "password123",
    });

    await admin.validate();
    expect(admin.phone).toBeUndefined();
    expect(admin.email).toBe("admin@test.com");
  });

  it("declares partial unique indexes on User schema", () => {
    const indexes = User.schema.indexes();
    
    // Find email unique index
    const emailIdx = indexes.find(
      (idx) => idx[0] && idx[0].email === 1 && idx[1] && idx[1].unique
    );
    expect(emailIdx).toBeDefined();
    expect(emailIdx[1].partialFilterExpression).toEqual({
      email: { $type: "string", $gt: "" },
    });

    // Find phone unique index
    const phoneIdx = indexes.find(
      (idx) => idx[0] && idx[0].phone === 1 && idx[1] && idx[1].unique
    );
    expect(phoneIdx).toBeDefined();
    expect(phoneIdx[1].partialFilterExpression).toEqual({
      phone: { $type: "string", $gt: "" },
    });
  });

  it("declares partial unique phone index on Admin schema", () => {
    const indexes = Admin.schema.indexes();
    const phoneIdx = indexes.find(
      (idx) => idx[0] && idx[0].phone === 1 && idx[1] && idx[1].unique
    );
    expect(phoneIdx).toBeDefined();
    expect(phoneIdx[1].partialFilterExpression).toEqual({
      phone: { $type: "string", $gt: "" },
    });
  });
});
