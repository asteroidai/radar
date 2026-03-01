import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { RADAR_CONTEXT } from "./context.js";
import { registerGetContext } from "./tools/get-context.js";
import { registerGetFile } from "./tools/get-file.js";
import { registerSearch } from "./tools/search.js";
import { registerListFiles } from "./tools/list-files.js";
import { registerSubmit } from "./tools/submit.js";
import { registerExplore } from "./tools/explore.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "radar",
    version: "0.1.0",
    instructions: RADAR_CONTEXT,
  });

  server.registerResource(
    "radar://instructions",
    "radar://instructions",
    {
      description:
        "Instructions for how agents should use Radar — check before visiting sites, contribute back after learning.",
      mimeType: "text/plain",
    },
    async () => ({
      contents: [
        {
          uri: "radar://instructions",
          mimeType: "text/plain",
          text: RADAR_CONTEXT,
        },
      ],
    }),
  );

  registerGetContext(server);
  registerGetFile(server);
  registerSearch(server);
  registerListFiles(server);
  registerSubmit(server);
  registerExplore(server);

  return server;
}
