import { getPayload } from 'payload';
import config from '@payload-config';
import { config as loadEnv } from 'dotenv';

loadEnv();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: pnpm admin:promote <email>');
    process.exit(1);
  }

  const payload = await getPayload({ config });

  const found = await payload.find({
    collection: 'members',
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  });

  if (found.docs.length === 0) {
    console.error(`No member found with email: ${email}`);
    process.exit(1);
  }

  const member = found.docs[0];
  const currentRoles = (member.roles ?? []) as string[];

  if (currentRoles.includes('admin')) {
    console.log(`${email} is already an admin (roles: ${currentRoles.join(', ')}). No-op.`);
    process.exit(0);
  }

  const nextRoles = Array.from(new Set([...currentRoles, 'admin']));

  await payload.update({
    collection: 'members',
    id: member.id,
    data: { roles: nextRoles as ('admin' | 'instructor' | 'learner')[] },
    overrideAccess: true,
  });

  console.log(`✓ Promoted ${email} to admin. Roles: ${nextRoles.join(', ')}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
