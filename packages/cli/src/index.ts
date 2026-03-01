import { Command } from "commander";
import { registerContext } from "./commands/context.js";
import { registerRead } from "./commands/read.js";
import { registerList } from "./commands/list.js";
import { registerSearch } from "./commands/search.js";
import { registerSubmit } from "./commands/submit.js";
import { registerExplore } from "./commands/explore.js";
import { registerDownload } from "./commands/download.js";

const program = new Command();

program
  .name("radar-cli")
  .description(
    "Radar CLI — query and contribute to the shared knowledge base for web agents",
  )
  .version("0.1.0");

registerContext(program);
registerRead(program);
registerList(program);
registerSearch(program);
registerSubmit(program);
registerExplore(program);
registerDownload(program);

program.parse();
