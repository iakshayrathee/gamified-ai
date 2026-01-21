import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Updating Join the Dots questions...\\n');

    // Find the Join the Dots skills
    const joinDotsSkills = await prisma.microSkill.findMany({
        where: {
            code: {
                in: ['NUM.7', 'NUM.8', 'NUM.9']
            }
        }
    });

    if (joinDotsSkills.length === 0) {
        console.log('❌ No Join the Dots skills found');
        return;
    }

    // Delete existing questions for these skills
    for (const skill of joinDotsSkills) {
        const deleted = await prisma.question.deleteMany({
            where: { microSkillId: skill.id }
        });
        console.log(`  🗑️  Deleted ${deleted.count} questions for ${skill.code}`);
    }

    // Recreate questions with new shape data
    let totalQuestions = 0;

    for (let skillIndex = 0; skillIndex < 3; skillIndex++) {
        const skill = joinDotsSkills[skillIndex];
        const questionsPerSkill = 20;

        // Picture themes for each level - matching predefined shapes
        const pictures = skillIndex === 0
            ? ['smiley', 'popsicle'] // Beginner: 10 dots each
            : skillIndex === 1
                ? ['face', 'penguin'] // Intermediate: 26 dots
                : ['face', 'penguin']; // Expert: 26 dots

        for (let q = 0; q < questionsPerSkill; q++) {
            const pictureName = pictures[q % pictures.length];
            const dotCount = skillIndex === 0 ? 10 : 26;

            await prisma.question.create({
                data: {
                    microSkillId: skill.id,
                    difficultyLevel: 1,
                    promptText: `Connect the dots from 1 to ${dotCount} to reveal the picture!`,
                    correctAnswer: Array.from({ length: dotCount }, (_, i) => i + 1).join(','),
                    distractors: JSON.parse('[]'),
                    assetUrls: JSON.parse(JSON.stringify({
                        pictureName,
                        dotCount,
                    })),
                },
            });
            totalQuestions++;
        }
        console.log(`  ✅ Created ${questionsPerSkill} questions for ${skill.code}`);
    }

    console.log(`\\n✨ Updated ${totalQuestions} Join the Dots questions successfully!`);
}

main()
    .catch((e) => {
        console.error('❌ Error updating questions:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
