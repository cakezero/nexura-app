/** Create one project-hub admin + one user-hub admin via the real OTP flow (OTP read from
 * Mongo), against the STAGING backend the UI uses. Writes creds to nexura-next/qa-studio-creds.json. */
import { writeFileSync } from 'node:fs';
import mongoose from 'mongoose';
const API = 'https://staging-api.nexura.intuition.box/api';
const SUF = Date.now().toString(16);

async function call(method, path, body) {
  const r = await fetch(`${API}${path}`, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  let d = null; try { d = await r.json(); } catch {}
  return { status: r.status, data: d };
}

async function makeStudio(page, label) {
  const email = `qa-${label}-${SUF}@nexura-qa.test`;
  const password = 'QaTest1234!';
  const name = `QA ${label} ${SUF}`;
  await call('POST', `/hub-auth/validate-email?email=${encodeURIComponent(email)}&page=${page}`);
  await new Promise(r => setTimeout(r, 800));
  const doc = await mongoose.connection.db.collection('otps').findOne({ email: email.toLowerCase() }, { sort: { _id: -1 } });
  const code = doc?.code;
  const c = await call('POST', '/auth/confirm-hub-email-validation', { email, code });
  const signupPath = page === 'user' ? '/user-hub/sign-up' : '/hub/sign-up';
  const su = await call('POST', signupPath, { name, email, password, hubName: name, projectName: name });
  console.log(`${label}: otp=${!!code} confirm=${c.status} signup=${su.status} msg=${su.data?.message || su.data?.error}`);
  return { email, password, name, signupStatus: su.status };
}

async function main() {
  await mongoose.connect(process.env.DB_URI, { family: 4 });
  const project = await makeStudio('project', 'project');
  const user = await makeStudio('user', 'userhub');
  const creds = { project, user, createdAt: SUF };
  writeFileSync('C:/Users/orion/Desktop/nawa/nexura-next/qa-studio-creds.json', JSON.stringify(creds, null, 2));
  console.log('creds written ->', JSON.stringify(creds));
  await mongoose.disconnect();
}
main().catch(e => { console.error('FATAL', e); process.exit(1); });
