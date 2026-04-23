
// 
import { createServer } from "node:http";

import { createLogger } from "@birthub/logger";
import express from "express";
import { createClient } from "redis";
import { validateRequest } from "twilio/lib/webhooks/webhooks";
import { WebSocketServer } from "ws";

export type VoiceEngineEnv = {
  DEEPGRAM_API_KEY: string;
  ELEVENLABS_API_KEY: string;
  NODE_ENV: "development" | "production" | "test";
  PORT: number;
  REDIS_URL: string;
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
};

export type WebSocketFrameType = "transcript.chunk" | "tts";

export interface TranscriptChunkFrame {
  type: "transcript.chunk";
  callId: string;
  confidence: number;
  transcript: string;
}

export interface TtsFrame {
  type: "tts";
  text: string;
}

export type WebSocketFrame = TranscriptChunkFrame | TtsFrame;

export interface CallSession {
  callId: string;
  optedOut: boolean;
  ttsActive: boolean;
}

type RedisClientLike = {
  connect: () => Promise<void>;
  disconnect?: () => void;
  isOpen: boolean;
  quit?: () => Promise<void>;
  xAdd: (
    stream: string,
    id: string,
    fields: Record<string, string>
  ) => Promise<unknown>;
};

type LoggerLike = {
  error: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
};

type DeepgramFactory = (apiKey: string) => unknown;

function decodeSocketPayload(raw: unknown): string {
  if (typeof raw === "string") {
    return raw;
  }

  if (Buffer.isBuffer(raw)) {
    return raw.toString("utf8");
  }

  if (raw instanceof ArrayBuffer) {
    return Buffer.from(raw).toString("utf8");
  }

  if (Array.isArray(raw)) {
    return Buffer.concat(raw.filter((chunk) => Buffer.isBuffer(chunk))).toString("utf8");
  }

  throw new Error("Unsupported websocket payload");
}

export function readVoiceEngineEnv(env: NodeJS.ProcessEnv = process.env): VoiceEngineEnv {
  const requiredKeys = [
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "DEEPGRAM_API_KEY",
    "ELEVENLABS_API_KEY",
    "REDIS_URL"
  ] as const;

  const values = Object.fromEntries(
    requiredKeys.map((key) => {
      const value = env[key]?.trim();
      if (!value) {
        throw new Error(`Missing required env: ${key}`);
      }

      return [key, value];
    })
  ) as Omit<VoiceEngineEnv, "NODE_ENV" | "PORT">;

  const port = Number(env.PORT ?? "3012");
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`Invalid PORT value: ${env.PORT ?? ""}`);
  }

  const nodeEnv = env.NODE_ENV ?? "development";
  if (!["development", "production", "test"].includes(nodeEnv)) {
    throw new Error(`Invalid NODE_ENV value: ${nodeEnv}`);
  }

  return {
    ...values,
    NODE_ENV: nodeEnv as VoiceEngineEnv["NODE_ENV"],
    PORT: port
  };
}

export function createVoiceEngineRuntime(options: {
  deepgramFactory?: DeepgramFactory;
  env?: NodeJS.ProcessEnv;
  logger?: LoggerLike;
  redisClient?: RedisClientLike;
} = {}) {
  const env = readVoiceEngineEnv(options.env);
  const logger = options.logger ?? createLogger("voice-engine");
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server, path: "/ws/calls" });
  const redis =
    options.redisClient ??
    (createClient({
      url: env.REDIS_URL
    }) as unknown as RedisClientLike);
  const deepgram = (options.deepgramFactory ?? ((apiKey: string) => ({ apiKey })))(env.DEEPGRAM_API_KEY);

  async function publish(event: string, payload: Record<string, unknown>): Promise<void> {
    await redis.xAdd("voice_events", "*", {
      event,
      payload: JSON.stringify(payload),
      timestamp: new Date().toISOString()
    });
  }

  function shouldClarify(sttConfidence: number): boolean {
    return sttConfidence < 0.7;
  }

  function buildRequestUrl(request: express.Request): string {
    const host = request.get("host") ?? "";
    const protocol = request.protocol || "http";
    return `${protocol}://${host}${request.originalUrl}`;
  }

  function isValidTwilioRequest(request: express.Request): boolean {
    const signature = request.get("X-Twilio-Signature");
    if (!signature) {
      return false;
    }

    return validateRequest(env.TWILIO_AUTH_TOKEN, signature, buildRequestUrl(request), request.body ?? {});
  }

  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  app.post("/twilio/inbound", async (req, res) => {
    if (!isValidTwilioRequest(req)) {
      logger.error({ path: req.originalUrl }, "Rejected inbound Twilio webhook: invalid signature");
      return res.status(403).json({ error: "invalid twilio signature" });
    }

    const callId = String(req.body.CallSid || crypto.randomUUID());
    const optedOut = Boolean(req.body.optOut);
    await publish("call.started", { callId, optedOut });
    if (optedOut) {
      return res
        .type("text/xml")
        .send("<Response><Say>You have opted out of call recording.</Say></Response>");
    }
    return res.type("text/xml").send("<Response><Say>Connected to AI voice engine.</Say></Response>");
  });


  wss.on("connection", (socket, request) => {
    // Determine boundary/authentication or mock it if needed
    const authHeader = request.headers["authorization"];
    if (authHeader !== `Bearer ${env.TWILIO_AUTH_TOKEN}` && env.NODE_ENV !== "test") {
      logger.error("Unauthorized websocket connection attempt");
      socket.close(1008, "Unauthorized");
      return;
    }

    let session: CallSession = {
      callId: "unknown",
      optedOut: false,
      ttsActive: false,
    };

    socket.on("message", async (raw) => {
      const start = Date.now();
      let frame: WebSocketFrame;
      try {
        frame = JSON.parse(decodeSocketPayload(raw)) as WebSocketFrame;
      } catch (error) {
        logger.error({ error }, "Failed to parse websocket payload");
        return;
      }

      if (frame.type !== "transcript.chunk") {
        return;
      }

      session.callId = frame.callId;

            const chunkPayload: Record<string, unknown> = {
        type: frame.type,
        callId: frame.callId,
        confidence: frame.confidence,
        transcript: frame.transcript
      };
      await publish("transcript.chunk", chunkPayload);
      if (session.ttsActive) {
        session.ttsActive = false;
        await publish("response.interrupted", { callId: frame.callId });
      }

      if (shouldClarify(frame.confidence)) {
        const ttsMessage: TtsFrame = { type: "tts", text: "Desculpe, pode repetir com mais clareza?" };
        socket.send(JSON.stringify(ttsMessage));
        await publish("response.generated", { callId: frame.callId, fallback: true });
        return;
      }

      const llmOutput = `Entendi: ${frame.transcript}. Proximo passo recomendado enviado.`;
      session.ttsActive = true;
      const ttsMessage: TtsFrame = { type: "tts", text: llmOutput };
      socket.send(JSON.stringify(ttsMessage));
      await publish("response.generated", { callId: frame.callId, latencyMs: Date.now() - start });
      session.ttsActive = false;
    });

    socket.on("close", async () => {
      logger.info({ callId: session.callId }, "Websocket connection closed");
      await publish("call.ended", { reason: "socket_closed", callId: session.callId });
    });

    socket.on("error", (error) => {
      logger.error({ error, callId: session.callId }, "Websocket error");
    });
  });

  app.get("/health", async (_req, res) => {
    res.json({ deepgram: Boolean(deepgram), redis: redis.isOpen, status: "ok" });
  });

  async function start(): Promise<number> {
    if (!redis.isOpen) {
      await redis.connect();
    }

    await new Promise<void>((resolve) => {
      server.listen(env.PORT, () => resolve());
    });

    const address = server.address();
    const port = typeof address === "object" && address ? address.port : env.PORT;
    logger.info({ port }, "voice-engine listening");
    return port;
  }

  async function stop(): Promise<void> {
    await new Promise<void>((resolve) => {
      wss.close(() => resolve());
    });
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });

    if (redis.isOpen) {
      if (typeof redis.quit === "function") {
        await redis.quit();
      } else if (typeof redis.disconnect === "function") {
        redis.disconnect();
      }
    }
  }

  return {
    app,
    publish,
    server,
    start,
    stop
  };
}

const bootstrapNodeEnv = process.env.NODE_ENV ?? "development";
const bootstrapAutostartDisabled = process.env.BIRTHUB_DISABLE_VOICE_ENGINE_AUTOSTART ?? "0";

if (bootstrapNodeEnv !== "test" && bootstrapAutostartDisabled !== "1") {
  const runtime = createVoiceEngineRuntime();
  runtime.start().catch((error) => {
    const logger = createLogger("voice-engine");
    logger.error({ error }, "voice-engine bootstrap failed");
    process.exit(1);
  });
}
