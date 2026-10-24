const tasks = [];

export function addTask(title) {
  tasks.push({ title, done: false });
  return tasks.length - 1;
}

export function completeTask(index) {
  if (tasks[index]) {
    tasks[index].done = true;
  }
}

export function listTasks() {
  return [...tasks];
}
