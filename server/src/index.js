import { createApp } from "./app.js";
import { getConfig } from "./services/config.js";

const config = getConfig();
const app = createApp();

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`RepoMedic AI server listening on http://localhost:${config.port}`);
});
