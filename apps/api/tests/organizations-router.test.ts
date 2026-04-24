import assert from "node:assert/strict";
import test from "node:test";

import { Role } from "@birthub/database";
import request from "supertest";

import { createOrganizationsRouter } from "../src/modules/organizations/router.js";
import { createAuthenticatedApiTestApp } from "./http-test-helpers.js";

void test("organization member role updates reject tenant-level SUPER_ADMIN escalation", async () => {
  const app = createAuthenticatedApiTestApp({
    contextOverrides: {
      role: Role.OWNER
    },
    router: createOrganizationsRouter()
  });

  const response = await request(app)
    .patch("/orgs/org_1/members/member_1")
    .send({
      role: Role.SUPER_ADMIN
    })
    .expect(400);

  assert.equal(response.body.title, "Bad Request");
});
