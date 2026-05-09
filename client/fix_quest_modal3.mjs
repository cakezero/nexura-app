import fs from 'fs';

let c = fs.readFileSync('src/pages/studio/user/QuestCreate.tsx', 'utf8');

// Replace the validation banner
c = c.replace(
  `            {/* Validation */}\r\n            {newTask.validation && (\r\n              <div className="mb-6 flex items-center gap-3 rounded-lg bg-purple-900/50 border border-purple-500/50 px-4 py-3">\r\n                <svg className="w-5 h-5 text-purple-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>\r\n                <div>\r\n                  <p className="text-sm text-purple-300 font-medium">{newTask.validation}</p>\r\n                  <p className="text-xs text-white/50 mt-0.5">{newTask.validation === "Manual Validation" ? "Task completion will be reviewed manually." : "Verification is automatic."}</p>\r\n                </div>\r\n              </div>\r\n            )}`,
  `            {/* Validation */}
            {newTask.validation && (
              <div className={`mb-6 flex items-center gap-3 rounded-lg px-4 py-3 border ${
                newTask.validation === "Manual Validation"
                  ? "bg-amber-900/30 border-amber-500/40"
                  : "bg-purple-900/50 border-purple-500/50"
              }`}>
                <svg className={`w-5 h-5 flex-shrink-0 ${newTask.validation === "Manual Validation" ? "text-amber-400" : "text-purple-400"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <div>
                  <p className={`text-sm font-medium ${newTask.validation === "Manual Validation" ? "text-amber-300" : "text-purple-300"}`}>{newTask.validation}</p>
                  <p className="text-xs text-white/50 mt-0.5">{newTask.validation === "Manual Validation" ? "Task completion will be reviewed manually." : "Verification is automatic."}</p>
                </div>
              </div>
            )}`
);

fs.writeFileSync('src/pages/studio/user/QuestCreate.tsx', c);
console.log('Done');
