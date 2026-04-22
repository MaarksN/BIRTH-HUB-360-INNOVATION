import { createLogger } from "@birthub/logger";

import { startApiServer } from "./app.js";

const processLogger = createLogger("api-process");

function toProcessErrorPayload(error: unknown): {
  message: string;
  name: string;
  stack?: string;
} {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      ...(error.stack ? { stack: error.stack } : {})
    };
  }

  return {
    message: String(error),
    name: "NonError"
  };
}

process.on("unhandledRejection", (reason) => {
  processLogger.error(
    {
      error: toProcessErrorPayload(reason)
    },
    "Unhandled promise rejection"
  );
  process.exitCode = 1;
});

process.on("uncaughtException", (error) => {
  processLogger.fatal(
    {
      error: toProcessErrorPayload(error)
    },
    "Uncaught exception"
  );
  process.exit(1);
});

startApiServer();
