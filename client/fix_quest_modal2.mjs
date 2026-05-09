import fs from 'fs';

let c = fs.readFileSync('src/pages/studio/user/QuestCreate.tsx', 'utf8');

// Update the onChange handler to clear platform for non-twitter tasks
c = c.replace(
  `setNewTask({\r\n                      ...newTask,\r\n                      type,\r\n                      platform: isTwitter ? "Twitter" : "Other",\r\n                      validation: validationLabel,\r\n                    });`,
  `setNewTask({\r\n                      ...newTask,\r\n                      type,\r\n                      platform: isTwitter ? "Twitter" : "",\r\n                      validation: validationLabel,\r\n                    });`
);

fs.writeFileSync('src/pages/studio/user/QuestCreate.tsx', c);
console.log('Done');
