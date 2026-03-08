import 'dotenv/config';
import { db } from './server/db';
import { users } from './shared/schema';

async function main() {
    console.log("Fetching users...");
    try {
        const allUsers = await db.select().from(users);
        console.log(`Total users found: ${allUsers.length}`);
        console.log(JSON.stringify(allUsers.map(u => ({
            id: u.id,
            username: u.username,
            profileCompleted: u.profileCompleted,
            headline: u.headline,
            role: u.role,
            company: u.company
        })), null, 2));
    } catch (err) {
        console.error("Database query failed:", err);
    } finally {
        process.exit(0);
    }
}

main();
