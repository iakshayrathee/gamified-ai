import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Updating all numeracy questions to difficulty level 1...\\n');

    // Update all numeracy questions to difficultyLevel 1
    const result = await prisma.question.updateMany({
        where: {
            microSkill: {
                code: {
                    startsWith: 'NUM.'
                }
            }
        },
        data: {
            difficultyLevel: 1
        }
    });

    console.log(`✅ Updated ${result.count} questions to difficulty level 1!\\n`);
}

main()
    .catch((e) => {
        console.error('❌ Error updating questions:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
