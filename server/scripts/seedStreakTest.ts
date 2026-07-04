import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import "dotenv/config";

const DB_URI = process.env.DB_URI as string;
const JWT_SECRET = process.env.JWT_SECRET as string;

const TEST_ADDRESS = "0x3365b738b84b56510347748788e52e68b8643e3a";

async function main() {
  await mongoose.connect(DB_URI);
  console.log("Connected to:", mongoose.connection.name);

  const userSchema = new mongoose.Schema({}, { strict: false, collection: "users" });
  const User = mongoose.model("User", userSchema);

  // Clean up stale XP history from previous test runs
  const xpLogSchema = new mongoose.Schema({}, { strict: false, collection: "xplogs" });
  const XpLog = mongoose.model("XpLog", xpLogSchema);
  const xpDel = await XpLog.deleteMany({ address: { $regex: "^" + TEST_ADDRESS.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", $options: "i" } });
  console.log(`   🧹 Cleaned ${xpDel.deletedCount} xpLog entries`);

  // Clean up daily sign-in history
  const existingUser = await User.findOne({ address: { $regex: "^" + TEST_ADDRESS + "$", $options: "i" } });
  if (existingUser) {
    const dailySignInSchema = new mongoose.Schema({}, { strict: false, collection: "dailysignins" });
    const DailySignIn = mongoose.model("DailySignIn", dailySignInSchema);
    const dsDel = await DailySignIn.deleteMany({ user: existingUser._id.toString() });
    console.log(`   🧹 Cleaned ${dsDel.deletedCount} dailySignIn entries`);
  }

  const userSchema = new mongoose.Schema({}, { strict: false, collection: "users" });
  const User = mongoose.model("User", userSchema);

  // Upsert the test user
  const u = await User.findOneAndUpdate(
    { address: TEST_ADDRESS },
    {
      $set: {
        username: "test-milestones-w2",
        address: TEST_ADDRESS,
        email: "test-milestones-w2@nexura.test",
        streak: 90,
        longestStreak: 90,
        dayCount: 0,
        totalCheckIns: 90,
        lastSignInDate: new Date().toISOString().split("T")[0],
        checkInDates: Array.from({ length: 90 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (90 - i));
          return d.toISOString().split("T")[0];
        }),
        dateJoined: new Date(Date.now() - 90 * 86400000).toISOString().split("T")[0],
        xp: 0,
        referral: { code: "TESTALL90", users: 0, xp: 0 },
        status: "Active",
        isApproved: true,
      },
    },
    { upsert: true, new: true }
  );

  console.log("\n✅ Test user seeded:");
  console.log(`   ID:       ${u._id}`);
  console.log(`   Address:  ${u.address}`);
  console.log(`   Streak:   ${u.streak}`);
  console.log(`   DayCount: ${u.dayCount}`);
  console.log(`   XP:       ${u.xp}`);
  console.log();

  const token = jwt.sign({ id: u._id.toString() }, JWT_SECRET, { expiresIn: "7d" });

  console.log("═══════════════════════════════════════════");
  console.log("  JWT Token:");
  console.log(`  ${token}`);
  console.log("═══════════════════════════════════════════");
  console.log();
  console.log("Claim flow (6 milestones available):");
  console.log("  1st claim → 7-day  → +500 XP");
  console.log("  2nd claim → 15-day → +1,000 XP");
  console.log("  3rd claim → 30-day → +2,500 XP");
  console.log("  4th claim → 45-day → +5,000 XP");
  console.log("  5th claim → 60-day → +10,000 XP");
  console.log("  6th claim → 90-day → +20,000 XP");
  console.log("  7th claim → rejected (all claimed)");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
