import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import type { HealthResponse } from "@mnemos/types";

const server = Fastify({ logger: true });
await server.register(fastifyCors, { origin: true });

server.get("/api/health", async (): Promise<HealthResponse> => ({
    ok: true,
    ts: new Date().toISOString()
}));

const port = Number(process.env.PORT ?? 4000);
server.listen({ port, host: "0.0.0.0" }).then(() => {
    server.log.info(`API listening on http://localhost:${port}`);
});
