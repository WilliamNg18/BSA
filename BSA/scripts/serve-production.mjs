import { fileURLToPath } from "node:url";
import { startStaticServer } from "./static-server.mjs";

// The same server is shipped as dist/server.mjs for App Service.
process.env.PLAYWRIGHT_PORT ??= "4183";
await startStaticServer(fileURLToPath(new URL("../dist/", import.meta.url)));
