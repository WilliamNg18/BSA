import { fileURLToPath } from "node:url";
import { checklistConfig } from "./checklist-config";
import { liveSettings } from "./settings";

export default checklistConfig(liveSettings(process.env, fileURLToPath(new URL("../../../", import.meta.url))));
