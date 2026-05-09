import fs from 'fs';

let c = fs.readFileSync('src/pages/studio/user/QuestCreate.tsx', 'utf8');

// Wraps platform div in conditional
let platformBlock = `              <div>\r\n                <label className="text-sm text-white/70 mb-2 block">Platform</label>\r\n                <div className="flex items-center w-full p-2 rounded-lg bg-white/5 border border-white/10 text-white/70 text-sm">\r\n                  <span>{newTask.platform || "—"}</span>\r\n                </div>\r\n              </div>`;

let conditionalPlatform = `              {newTask.type !== "Portal Claims" && newTask.type !== "Own a TNS" && newTask.type !== "Give Feedback" && (\r\n${platformBlock}\r\n              )}`;

c = c.replace(platformBlock, conditionalPlatform);

fs.writeFileSync('src/pages/studio/user/QuestCreate.tsx', c);
console.log('Done');
