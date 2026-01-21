import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🗑️  Clearing all attempts from database...\\n');

    const result = await prisma.attempt.deleteMany({});

    console.log(`✅ Deleted ${result.count} attempts successfully!\\n`);
}

main()
    .catch((e) => {
        console.error('❌ Error clearing attempts:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
