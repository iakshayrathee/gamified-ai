import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Updating Join the Dots beginner questions...\\n');

    // Find the beginner Join the Dots skill (NUM.7)
    const beginnerSkill = await prisma.microSkill.findFirst({
        where: { code: 'NUM.7' }
    });

    if (!beginnerSkill) {
        console.log('❌ Beginner skill (NUM.7) not found');
        return;
    }

    // First, delete all attempts for questions in this skill
    const questionsToDelete = await prisma.question.findMany({
        where: { microSkillId: beginnerSkill.id },
        select: { id: true }
    });

    const questionIds = questionsToDelete.map(q => q.id);

    if (questionIds.length > 0) {
        const deletedAttempts = await prisma.attempt.deleteMany({
            where: { questionId: { in: questionIds } }
        });
        console.log(`  🗑️  Deleted ${deletedAttempts.count} attempts for NUM.7`);
    }

    // Now delete existing questions
    const deleted = await prisma.question.deleteMany({
        where: { microSkillId: beginnerSkill.id }
    });
    console.log(`  🗑️  Deleted ${deleted.count} old questions for NUM.7`);

    // Create 4 new questions with the specific shapes
    const shapes = ['watermelon', 'apple', 'icecream', 'guava'];

    for (const pictureName of shapes) {
        const dotCount = pictureName === 'apple' ? 15 :
            pictureName === 'icecream' ? 15 : 12;

        await prisma.question.create({
            data: {
                microSkillId: beginnerSkill.id,
                difficultyLevel: 1,
                promptText: `Connect the dots from 1 to ${dotCount} to reveal the ${pictureName}!`,
                correctAnswer: Array.from({ length: dotCount }, (_, i) => i + 1).join(','),
                distractors: JSON.parse('[]'),
                assetUrls: JSON.parse(JSON.stringify({
                    pictureName,
                    dotCount,
                })),
            },
        });
    }

    console.log(`  ✅ Created 4 new questions for NUM.7 (watermelon, apple, icecream, guava)`);
    console.log('\\n✨ Beginner level updated successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error updating questions:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
