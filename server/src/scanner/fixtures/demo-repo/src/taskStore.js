const tasks = [];

export function addTask(title) {
  tasks.push({ title, done: false });
  return tasks.length - 1;
}

export function listTasks() {
  return [...tasks];
}
