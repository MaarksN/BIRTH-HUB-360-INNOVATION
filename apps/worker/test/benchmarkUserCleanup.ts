import { cleanupSuspendedUsers } from "../src/jobs/userCleanup.js";
import { performance } from "perf_hooks";

async function runBenchmark() {
  // Generate a large number of dummy users
  const dummyUsers = Array.from({ length: 1000 }, (_, i) => ({
    id: `user_${i}`,
    status: "SUSPENDED"
  }));

  const prismaMock = {
    user: {
      findMany: () => Promise.resolve(dummyUsers),
      update: async () => {
        // simulate some async I/O delay
        await new Promise(resolve => setTimeout(resolve, 1));
        return {};
      }
    },
    $transaction: async (queries: Array<Promise<unknown>>) => {
      // Simulate transaction bulk execution
      await new Promise(resolve => setTimeout(resolve, 10));
      for (const q of queries) {
        await q;
      }
      return [];
    }
  };

  const start = performance.now();
  await cleanupSuspendedUsers(prismaMock as unknown as Parameters<typeof cleanupSuspendedUsers>[0], new Date());
  const end = performance.now();

  console.log(`Time taken: ${(end - start).toFixed(2)} ms`);
}

void void runBenchmark();

