// Directive D086B – Graph UX Cleanup Task Runner
// ---------------------------------------------
// This utility manages Sprint 1 progress tracking for the Graph Prototype UX Simplification (D086A)
// It reads/writes a JSON checklist file to track dx's tasks and completion state.

import fs from 'fs';
import path from 'path';

const taskFile = path.resolve('./scripts/tasks/uxclean.json');

function readTasks() {
  if (!fs.existsSync(taskFile)) {
    console.error('❌ Task file not found. Run npm run task:init to create uxclean.json');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(taskFile, 'utf8'));
}

function saveTasks(data) {
  fs.writeFileSync(taskFile, JSON.stringify(data, null, 2));
}

function listTasks(data) {
  console.log(`\n[ ${data.sprint} ]\nBranch: ${data.branch}\nOwner: ${data.owner}\n`);
  data.tasks.forEach((t) => {
    console.log(`${t.status === 'done' ? '✔' : '☐'} ${t.description}`);
  });
}

function markComplete(data) {
  data.tasks.forEach((t) => (t.status = 'done'));
  data.completed = true;
  console.log('\n✅ All Sprint 1 tasks marked as complete!');
  saveTasks(data);
}

function updateTask(id) {
  const data = readTasks();
  const task = data.tasks.find((t) => t.id === id);
  if (!task) {
    console.error(`❌ Task with id "${id}" not found.`);
    process.exit(1);
  }
  task.status = 'done';
  console.log(`\n✔ Task completed: ${task.description}`);
  saveTasks(data);
}

function main() {
  const args = process.argv.slice(2);
  const data = readTasks();

  if (args.includes('--complete')) {
    markComplete(data);
  } else if (args.includes('--list')) {
    listTasks(data);
  } else if (args.includes('--task')) {
    const id = args[args.indexOf('--task') + 1];
    updateTask(id);
  } else {
    listTasks(data);
  }
}

main();

// Usage Examples:
// ---------------
// npm run task:uxclean --list        → View Sprint 1 progress
// npm run task:uxclean --task fonts  → Mark specific task as done
// npm run task:uxclean --complete    → Mark all tasks complete
