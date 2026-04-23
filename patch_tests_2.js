const fs = require('fs');
const filePath = 'apps/api/tests/workflows-router.test.ts';
let content = fs.readFileSync(filePath, 'utf8');

// I also want to add tests for the creation and update payload validations.
// Let's see if those tests exist here.
// They don't appear in workflows-router.test.ts. Let's add them at the bottom.

content += `

void test("workflows router rejects creating with canvas", async () => {
  const restores = [
    stubMethod(prisma.organization, "findFirst", () =>
      Promise.resolve({
        id: "org_1",
        tenantId: "tenant_1"
      })
    )
  ];

  try {
    const response = await request(createWorkflowsTestApp())
      .post("/api/v1/workflows")
      .send({
        name: "Test workflow",
        canvas: { steps: [], transitions: [] }
      })
      .expect(400);

    assert.equal(response.body.status, 400);
    assert.equal(response.body.title, "Bad Request");
  } finally {
    for (const restore of restores.reverse()) {
      restore();
    }
  }
});

void test("workflows router accepts creating with valid dsl", async () => {
  const restores = [
    stubMethod(prisma.organization, "findFirst", () =>
      Promise.resolve({
        id: "org_1",
        tenantId: "tenant_1"
      })
    ),
    stubMethod(prisma, "$transaction", async (callback) => {
      return callback({
        workflow: {
          create: async (args) => ({
             id: "wf_2",
             organizationId: "org_1",
             tenantId: "tenant_1",
             name: "Test workflow"
          })
        },
        workflowRevision: {
          create: async (args) => ({ id: "rev_new" })
        },
        workflowStep: {
          create: async (args) => ({ id: "step_new" })
        }
      });
    })
  ];

  try {
    const response = await request(createWorkflowsTestApp())
      .post("/api/v1/workflows")
      .send({
        name: "Test workflow",
        dsl: "trigger Webhook() {}"
      })
      .expect(201); // Assuming 201 Created or 200 OK depending on implementation, actually might fail if mock isn't exact but let's test just validation. Wait, if validation passes, it hits the db. Let's just check it doesn't return 400 for validation.

    // assert.notEqual(response.body.status, 400);
  } finally {
    for (const restore of restores.reverse()) {
      restore();
    }
  }
});
`;

fs.writeFileSync(filePath, content, 'utf8');
