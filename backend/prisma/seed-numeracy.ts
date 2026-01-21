import { PrismaClient, GameTemplate } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔢 Starting Numeracy Game System seed...\\n');

    // ============================================
    // 1. CREATE NUMERACY DOMAIN
    // ============================================
    console.log('📚 Creating Numeracy domain...');

    const numeracyDomain = await prisma.skillDomain.upsert({
        where: { code: 'NUM' },
        update: {},
        create: {
            code: 'NUM',
            name: 'Numeracy',
            description: 'Serial Numbers & Sequencing (1-100) - Number sense, sequencing, working memory, and visual-spatial skills',
            order: 100, // High order to avoid conflicts
        },
    });
    console.log('  ✅ Domain created/found: Numeracy (NUM)\\n');

    // ============================================
    // 2. CREATE 9 MICRO SKILLS (3 games × 3 levels)
    // ============================================
    console.log('🎯 Creating 9 micro skills...');

    const skills = [];

    // Game 1: Number Line Builder (3 levels)
    skills.push(await prisma.microSkill.create({
        data: {
            code: 'NUM.1',
            name: 'Number Line Builder - Beginner (1-10)',
            domainId: numeracyDomain.id,
            gameTemplate: GameTemplate.NUMBER_LINE_BUILDER,
            prerequisiteSkills: JSON.parse('[]'),
            nextSkills: JSON.parse('["NUM.2"]'),
            masteryCriteria: JSON.parse('{"accuracyThreshold": 80, "timeThreshold": 5, "confusionErrorThreshold": 20}'),
        },
    }));

    skills.push(await prisma.microSkill.create({
        data: {
            code: 'NUM.2',
            name: 'Number Line Builder - Intermediate (1-50)',
            domainId: numeracyDomain.id,
            gameTemplate: GameTemplate.NUMBER_LINE_BUILDER,
            prerequisiteSkills: JSON.parse('["NUM.1"]'),
            nextSkills: JSON.parse('["NUM.3"]'),
            masteryCriteria: JSON.parse('{"accuracyThreshold": 80, "timeThreshold": 6, "confusionErrorThreshold": 20}'),
        },
    }));

    skills.push(await prisma.microSkill.create({
        data: {
            code: 'NUM.3',
            name: 'Number Line Builder - Expert (1-100)',
            domainId: numeracyDomain.id,
            gameTemplate: GameTemplate.NUMBER_LINE_BUILDER,
            prerequisiteSkills: JSON.parse('["NUM.2"]'),
            nextSkills: JSON.parse('["NUM.4"]'),
            masteryCriteria: JSON.parse('{"accuracyThreshold": 85, "timeThreshold": 8, "confusionErrorThreshold": 15}'),
        },
    }));

    // Game 2: Fill Missing Numbers (3 levels)
    skills.push(await prisma.microSkill.create({
        data: {
            code: 'NUM.4',
            name: 'Fill Missing Numbers - Beginner (1-10)',
            domainId: numeracyDomain.id,
            gameTemplate: GameTemplate.FILL_MISSING_NUMBERS,
            prerequisiteSkills: JSON.parse('["NUM.3"]'),
            nextSkills: JSON.parse('["NUM.5"]'),
            masteryCriteria: JSON.parse('{"accuracyThreshold": 80, "timeThreshold": 5, "confusionErrorThreshold": 20}'),
        },
    }));

    skills.push(await prisma.microSkill.create({
        data: {
            code: 'NUM.5',
            name: 'Fill Missing Numbers - Intermediate (1-50)',
            domainId: numeracyDomain.id,
            gameTemplate: GameTemplate.FILL_MISSING_NUMBERS,
            prerequisiteSkills: JSON.parse('["NUM.4"]'),
            nextSkills: JSON.parse('["NUM.6"]'),
            masteryCriteria: JSON.parse('{"accuracyThreshold": 80, "timeThreshold": 6, "confusionErrorThreshold": 20}'),
        },
    }));

    skills.push(await prisma.microSkill.create({
        data: {
            code: 'NUM.6',
            name: 'Fill Missing Numbers - Expert (1-100)',
            domainId: numeracyDomain.id,
            gameTemplate: GameTemplate.FILL_MISSING_NUMBERS,
            prerequisiteSkills: JSON.parse('["NUM.5"]'),
            nextSkills: JSON.parse('["NUM.7"]'),
            masteryCriteria: JSON.parse('{"accuracyThreshold": 85, "timeThreshold": 8, "confusionErrorThreshold": 15}'),
        },
    }));

    // Game 3: Join the Dots (3 levels)
    skills.push(await prisma.microSkill.create({
        data: {
            code: 'NUM.7',
            name: 'Join the Dots - Beginner (1-10)',
            domainId: numeracyDomain.id,
            gameTemplate: GameTemplate.JOIN_THE_DOTS,
            prerequisiteSkills: JSON.parse('["NUM.6"]'),
            nextSkills: JSON.parse('["NUM.8"]'),
            masteryCriteria: JSON.parse('{"accuracyThreshold": 80, "timeThreshold": 5, "confusionErrorThreshold": 20}'),
        },
    }));

    skills.push(await prisma.microSkill.create({
        data: {
            code: 'NUM.8',
            name: 'Join the Dots - Intermediate (1-50)',
            domainId: numeracyDomain.id,
            gameTemplate: GameTemplate.JOIN_THE_DOTS,
            prerequisiteSkills: JSON.parse('["NUM.7"]'),
            nextSkills: JSON.parse('["NUM.9"]'),
            masteryCriteria: JSON.parse('{"accuracyThreshold": 80, "timeThreshold": 7, "confusionErrorThreshold": 20}'),
        },
    }));

    skills.push(await prisma.microSkill.create({
        data: {
            code: 'NUM.9',
            name: 'Join the Dots - Expert (1-100)',
            domainId: numeracyDomain.id,
            gameTemplate: GameTemplate.JOIN_THE_DOTS,
            prerequisiteSkills: JSON.parse('["NUM.8"]'),
            nextSkills: JSON.parse('[]'),
            masteryCriteria: JSON.parse('{"accuracyThreshold": 85, "timeThreshold": 10, "confusionErrorThreshold": 15}'),
        },
    }));

    console.log('  ✅ Created 9 micro skills\\n');

    // ============================================
    // 3. GENERATE QUESTIONS FOR ALL SKILLS
    // ============================================
    console.log('❓ Generating questions...');

    let totalQuestions = 0;

    // Helper function to generate a random number in range
    const randomInRange = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

    // Helper function to shuffle array
    const shuffle = (array: any[]) => array.sort(() => Math.random() - 0.5);

    // NUM.1-3: Number Line Builder Questions
    for (let skillIndex = 0; skillIndex < 3; skillIndex++) {
        const skill = skills[skillIndex];
        const maxNumber = skillIndex === 0 ? 10 : skillIndex === 1 ? 50 : 100;
        const questionsPerSkill = 25;

        for (let q = 0; q < questionsPerSkill; q++) {
            const startNum = randomInRange(1, maxNumber - 5);
            const sequenceLength = skillIndex === 0 ? 5 : skillIndex === 1 ? 7 : 10;
            const missingCount = skillIndex === 0 ? 2 : skillIndex === 1 ? 3 : 4;

            // Generate sequence
            const sequence = Array.from({ length: sequenceLength }, (_, i) => startNum + i);

            // Randomly select positions to hide
            const hiddenPositions = shuffle(Array.from({ length: sequenceLength }, (_, i) => i))
                .slice(0, missingCount)
                .sort((a, b) => a - b);

            const correctAnswer = hiddenPositions.map(pos => sequence[pos]).join(',');

            await prisma.question.create({
                data: {
                    microSkillId: skill.id,
                    difficultyLevel: 1,
                    promptText: 'Fill in the missing numbers in order',
                    correctAnswer,
                    distractors: JSON.parse('[]'),
                    assetUrls: JSON.parse(JSON.stringify({
                        sequence,
                        hiddenPositions,
                        startNumber: startNum,
                        sequenceLength,
                    })),
                },
            });
            totalQuestions++;
        }
    }

    // NUM.4-6: Fill Missing Numbers Questions
    for (let skillIndex = 0; skillIndex < 3; skillIndex++) {
        const skill = skills[skillIndex + 3];
        const maxNumber = skillIndex === 0 ? 10 : skillIndex === 1 ? 50 : 100;
        const questionsPerSkill = 25;

        for (let q = 0; q < questionsPerSkill; q++) {
            const startNum = randomInRange(1, maxNumber - 8);
            const sequenceLength = skillIndex === 0 ? 8 : skillIndex === 1 ? 10 : 15;
            const gapCount = skillIndex === 0 ? 1 : skillIndex === 1 ? 2 : 3;

            // Generate sequence
            const sequence = Array.from({ length: sequenceLength }, (_, i) => startNum + i);

            // Randomly select gap positions (not first or last)
            const gapPositions = shuffle(Array.from({ length: sequenceLength - 2 }, (_, i) => i + 1))
                .slice(0, gapCount)
                .sort((a, b) => a - b);

            const correctAnswer = gapPositions.map(pos => sequence[pos]).join(',');

            // Generate distractors (wrong numbers)
            const distractors: number[] = [];
            for (let i = 0; i < 4; i++) {
                let distractor: number;
                do {
                    distractor = randomInRange(Math.max(1, startNum - 5), startNum + sequenceLength + 5);
                } while (sequence.includes(distractor) || distractors.includes(distractor));
                distractors.push(distractor);
            }

            await prisma.question.create({
                data: {
                    microSkillId: skill.id,
                    difficultyLevel: 1,
                    promptText: 'Find and fill the missing numbers',
                    correctAnswer,
                    distractors: JSON.parse(JSON.stringify(distractors)),
                    assetUrls: JSON.parse(JSON.stringify({
                        sequence,
                        gapPositions,
                        availableNumbers: shuffle([...gapPositions.map(pos => sequence[pos]), ...distractors]),
                    })),
                },
            });
            totalQuestions++;
        }
    }

    // NUM.7-9: Join the Dots Questions
    for (let skillIndex = 0; skillIndex < 3; skillIndex++) {
        const skill = skills[skillIndex + 6];
        const questionsPerSkill = 20;

        // Picture themes for each level - matching predefined shapes
        const pictures = skillIndex === 0
            ? ['smiley', 'popsicle'] // Beginner: 10 dots each
            : skillIndex === 1
                ? ['face', 'penguin'] // Intermediate: 26-36 dots
                : ['face', 'penguin']; // Expert: same as intermediate

        for (let q = 0; q < questionsPerSkill; q++) {
            const pictureName = pictures[q % pictures.length];
            const dotCount = skillIndex === 0 ? 10 : 26;

            await prisma.question.create({
                data: {
                    microSkillId: skill.id,
                    difficultyLevel: skillIndex + 1,
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
    }

    console.log(`  ✅ Generated ${totalQuestions} questions\\n`);

    // ============================================
    // SUMMARY
    // ============================================
    console.log('📋 NUMERACY SEED SUMMARY');
    console.log('=====================================');
    console.log('Domain:');
    console.log('  - Numeracy (NUM) - Serial Numbers & Sequencing');
    console.log('');
    console.log('Skills:');
    console.log('  - NUM.1: Number Line Builder - Beginner (1-10)');
    console.log('  - NUM.2: Number Line Builder - Intermediate (1-50)');
    console.log('  - NUM.3: Number Line Builder - Expert (1-100)');
    console.log('  - NUM.4: Fill Missing Numbers - Beginner (1-10)');
    console.log('  - NUM.5: Fill Missing Numbers - Intermediate (1-50)');
    console.log('  - NUM.6: Fill Missing Numbers - Expert (1-100)');
    console.log('  - NUM.7: Join the Dots - Beginner (1-10)');
    console.log('  - NUM.8: Join the Dots - Intermediate (1-50)');
    console.log('  - NUM.9: Join the Dots - Expert (1-100)');
    console.log('');
    console.log(`Questions: ${totalQuestions} total`);
    console.log('  - Number Line Builder: 75 questions');
    console.log('  - Fill Missing Numbers: 75 questions');
    console.log('  - Join the Dots: 60 questions');
    console.log('=====================================\\n');
    console.log('✨ Numeracy game system seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding numeracy games:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
