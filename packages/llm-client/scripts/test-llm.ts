// 
import { GeminiClient } from "../src/index.js";

function writeStdout(message: string): void {
  process.stdout.write(`${message}\n`);
}

function writeStderr(message: string): void {
  process.stderr.write(`${message}\n`);
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    writeStderr("Skipping Gemini test: GEMINI_API_KEY not found.");
    return;
  }

  writeStdout("Testing Gemini Client...");
  const client = new GeminiClient(apiKey);
  try {
    const response = await client.generateContent("Hello, are you working?");
    writeStdout(`Response: ${typeof response === "string" ? response : JSON.stringify(response)}`);
  } catch (error) {
    writeStderr(
      `Test failed: ${error instanceof Error ? error.stack ?? error.message : String(error)}`
    );
    process.exit(1);
  }
}

main();
