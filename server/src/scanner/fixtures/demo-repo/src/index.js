import { addTask, listTasks } from "./taskStore.js";

const apiKey = process.env.API_KEY;
const port = process.env.PORT || 3000;

function main() {
  if (!apiKey) {
    console.error("Missing API_KEY environment variable.");
    process.exit(1);
  }

  addTask("Write onboarding docs");
  addTask("Add a test suite");

  console.log(`Demo task CLI ready on port ${port}.`);
  console.log(listTasks());
}

main();
