import { PrismaClient, GameTemplate } from '@prisma/client';

const prisma = new PrismaClient();

// Shape data with image URLs (using placeholder URLs - replace with actual hosted images)
const shapes = [
    { name: 'circle', color: 'blue', imageUrl: 'https://dummyimage.com/300x300/4a90e2/ffffff&text=Circle' },
    { name: 'square', color: 'red', imageUrl: 'https://dummyimage.com/300x300/ff6b6b/ffffff&text=Square' },
    { name: 'triangle', color: 'green', imageUrl: 'https://dummyimage.com/300x300/50c878/ffffff&text=Triangle' },
    { name: 'rectangle', color: 'yellow', imageUrl: 'https://dummyimage.com/300x300/ffd700/ffffff&text=Rectangle' },
    { name: 'pentagon', color: 'purple', imageUrl: 'https://dummyimage.com/300x300/9b59b6/ffffff&text=Pentagon' },
    { name: 'hexagon', color: 'orange', imageUrl: 'https://dummyimage.com/300x300/ff8c42/ffffff&text=Hexagon' },
    { name: 'star', color: 'gold', imageUrl: 'https://dummyimage.com/300x300/ffd700/ffffff&text=Star' },
    { name: 'heart', color: 'pink', imageUrl: 'https://dummyimage.com/300x300/ff69b4/ffffff&text=Heart' },
    { name: 'diamond', color: 'cyan', imageUrl: 'https://dummyimage.com/300x300/00bcd4/ffffff&text=Diamond' },
    { name: 'oval', color: 'magenta', imageUrl: 'https://dummyimage.com/300x300/e91e63/ffffff&text=Oval' },
];

// Helper function to shuffle array
const shuffle = <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

// Helper function to get random items from array
const getRandomItems = <T>(array: T[], count: number): T[] => {
    return shuffle(array).slice(0, count);
};

async function main() {
    console.log('🎨 Starting Shapes Domain seed...\n');

    try {
        // Delete existing Shapes data
        console.log('🗑️  Deleting existing Shapes data...');
        const existingDomain = await prisma.skillDomain.findFirst({
            where: { code: 'SHAPES' }
        });

        if (existingDomain) {
            // Delete attempts first (due to foreign key constraints)
            await prisma.attempt.deleteMany({
                where: {
                    question: {
                        microSkill: {
                            domainId: existingDomain.id
                        }
                    }
                }
            });

            // Delete skill progress
            await prisma.skillProgress.deleteMany({
                where: {
                    microSkill: {
                        domainId: existingDomain.id
                    }
                }
            });

            // Delete questions
            await prisma.question.deleteMany({
                where: {
                    microSkill: {
                        domainId: existingDomain.id
                    }
                }
            });

            // Delete micro skills
            await prisma.microSkill.deleteMany({
                where: { domainId: existingDomain.id }
            });

            // Delete domain
            await prisma.skillDomain.delete({
                where: { id: existingDomain.id }
            });
        }
        console.log('  ✅ Deleted existing Shapes data\n');

        // Create Shapes domain
        console.log('📚 Creating Shapes domain...');
        const domain = await prisma.skillDomain.create({
            data: {
                name: 'Shapes Recognition',
                code: 'SHAPES',
                description: 'Visual discrimination, pattern recognition, and counting skills',
                order: 101,
            },
        });
        console.log(`  ✅ Domain created: ${domain.name} (${domain.code}) - Order: ${domain.order}\n`);

        // Create 4 micro skills
        console.log('🎯 Creating 4 micro skills...');

        const skills = [];

        // Skill 1: Match the Shapes
        const skill1 = await prisma.microSkill.create({
            data: {
                name: 'Match the Shapes',
                code: 'SHAPES.1',
                domainId: domain.id,
                gameTemplate: GameTemplate.TAP_SELECT,
            },
        });
        skills.push(skill1);
        console.log(`  ✅ ${skill1.code}: ${skill1.name}`);

        // Skill 2: Match Shapes with Names (Line Drawing)
        const skill2 = await prisma.microSkill.create({
            data: {
                name: 'Match Shapes with Names',
                code: 'SHAPES.2',
                domainId: domain.id,
                gameTemplate: GameTemplate.PUZZLE_JOIN,
            },
        });
        skills.push(skill2);
        console.log(`  ✅ ${skill2.code}: ${skill2.name}`);

        // Skill 3: Find the Odd One Out
        const skill3 = await prisma.microSkill.create({
            data: {
                name: 'Find the Odd One Out',
                code: 'SHAPES.3',
                domainId: domain.id,
                gameTemplate: GameTemplate.ODD_ONE_OUT,
            },
        });
        skills.push(skill3);
        console.log(`  ✅ ${skill3.code}: ${skill3.name}`);

        // Skill 4: Count the Stars
        const skill4 = await prisma.microSkill.create({
            data: {
                name: 'Count the Stars',
                code: 'SHAPES.4',
                domainId: domain.id,
                gameTemplate: GameTemplate.TAP_SELECT,
            },
        });
        skills.push(skill4);
        console.log(`  ✅ ${skill4.code}: ${skill4.name}\n`);

        // Create questions for all skills
        console.log('❓ Creating questions for all skills...\n');
        let questionCount = 0;

        // ============================================
        // SKILL 1: Match the Shapes (20 questions)
        // ============================================
        console.log('  Skill 1: Match the Shapes (TAP_SELECT)');
        for (let i = 0; i < 20; i++) {
            const targetShape = shapes[i % shapes.length];
            const otherShapes = shapes.filter(s => s.name !== targetShape.name);
            const distractors = getRandomItems(otherShapes, 3);

            const allOptions = shuffle([targetShape, ...distractors]);

            await prisma.question.create({
                data: {
                    microSkillId: skill1.id,
                    difficultyLevel: i < 7 ? 1 : i < 14 ? 2 : 3,
                    promptText: `Find the matching shape`,
                    correctAnswer: targetShape.name,
                    distractors: JSON.stringify(distractors.map(d => d.name)),
                    hasConfusingDistractors: false,
                    assetUrls: JSON.stringify({
                        targetShape: {
                            name: targetShape.name,
                            imageUrl: targetShape.imageUrl
                        },
                        options: allOptions.map((shape, idx) => ({
                            id: String(idx),
                            name: shape.name,
                            imageUrl: shape.imageUrl
                        }))
                    })
                }
            });
            questionCount++;
        }
        console.log(`    ✅ Created 20 questions\n`);

        // ============================================
        // SKILL 2: Match Shapes with Names (20 questions)
        // ============================================
        console.log('  Skill 2: Match Shapes with Names (PUZZLE_JOIN)');
        for (let i = 0; i < 20; i++) {
            // Select 4 shapes for this question
            const selectedShapes = getRandomItems(shapes, 4);

            // Create left items (shapes with images)
            const leftItems = selectedShapes.map((shape, idx) => ({
                id: `left-${idx}`,
                content: shape.name,
                imageUrl: shape.imageUrl,
                matchId: `right-${idx}` // Correct match
            }));

            // Create right items (shape names, shuffled)
            const shuffledIndices = shuffle([0, 1, 2, 3]);
            const rightItems = shuffledIndices.map((originalIdx, newIdx) => ({
                id: `right-${originalIdx}`,
                content: selectedShapes[originalIdx].name,
                text: selectedShapes[originalIdx].name
            }));

            await prisma.question.create({
                data: {
                    microSkillId: skill2.id,
                    difficultyLevel: i < 7 ? 1 : i < 14 ? 2 : 3,
                    promptText: `Draw lines to match each shape with its name`,
                    correctAnswer: JSON.stringify(leftItems.map(l => ({ left: l.id, right: l.matchId }))),
                    distractors: JSON.stringify([]),
                    hasConfusingDistractors: false,
                    assetUrls: JSON.stringify({
                        leftItems,
                        rightItems
                    })
                }
            });
            questionCount++;
        }
        console.log(`    ✅ Created 20 questions\n`);

        // ============================================
        // SKILL 3: Find the Odd One Out (20 questions)
        // ============================================
        console.log('  Skill 3: Find the Odd One Out (ODD_ONE_OUT)');
        for (let i = 0; i < 20; i++) {
            const baseShape = shapes[i % shapes.length];
            const oddShape = shapes[(i + 1) % shapes.length];

            // Create 4 options: 3 same, 1 different
            const items = [
                { id: '0', content: baseShape.name, imageUrl: baseShape.imageUrl, isOdd: false },
                { id: '1', content: oddShape.name, imageUrl: oddShape.imageUrl, isOdd: true },
                { id: '2', content: baseShape.name, imageUrl: baseShape.imageUrl, isOdd: false },
                { id: '3', content: baseShape.name, imageUrl: baseShape.imageUrl, isOdd: false },
            ];

            const shuffledItems = shuffle(items);
            const correctAnswerId = shuffledItems.find(item => item.isOdd)!.id;

            await prisma.question.create({
                data: {
                    microSkillId: skill3.id,
                    difficultyLevel: i < 7 ? 1 : i < 14 ? 2 : 3,
                    promptText: `Which one is different?`,
                    correctAnswer: correctAnswerId,
                    distractors: JSON.stringify([]),
                    hasConfusingDistractors: false,
                    assetUrls: JSON.stringify({
                        items: shuffledItems
                    })
                }
            });
            questionCount++;
        }
        console.log(`    ✅ Created 20 questions\n`);

        // ============================================
        // SKILL 4: Count the Stars (20 questions)
        // ============================================
        console.log('  Skill 4: Count the Stars (TAP_SELECT)');
        for (let i = 0; i < 20; i++) {
            const starCount = (i % 10) + 1; // 1-10 stars

            // Generate distractors (nearby numbers)
            const distractors = [];
            const possibleDistractors = [
                starCount - 2,
                starCount - 1,
                starCount + 1,
                starCount + 2
            ].filter(n => n > 0 && n <= 10 && n !== starCount);

            while (distractors.length < 3 && possibleDistractors.length > 0) {
                const idx = Math.floor(Math.random() * possibleDistractors.length);
                distractors.push(possibleDistractors[idx]);
                possibleDistractors.splice(idx, 1);
            }

            await prisma.question.create({
                data: {
                    microSkillId: skill4.id,
                    difficultyLevel: starCount <= 3 ? 1 : starCount <= 7 ? 2 : 3,
                    promptText: `How many stars do you see?`,
                    correctAnswer: String(starCount),
                    distractors: JSON.stringify(distractors.map(String)),
                    hasConfusingDistractors: false,
                    assetUrls: JSON.stringify({
                        imageUrl: `https://dummyimage.com/400x300/ffffff/ffd700&text=${starCount}+Stars`,
                        starCount: starCount
                    })
                }
            });
            questionCount++;
        }
        console.log(`    ✅ Created 20 questions\n`);

        console.log('📋 SHAPES SEED SUMMARY');
        console.log('=====================================');
        console.log(`Domain: ${domain.name} (${domain.code})`);
        console.log(`Micro-Skills: ${skills.length}`);
        console.log(`Questions: ${questionCount} total`);
        console.log('');
        console.log('Skill Breakdown:');
        console.log('  - SHAPES.1: Match the Shapes (20 questions)');
        console.log('  - SHAPES.2: Match Shapes with Names (20 questions)');
        console.log('  - SHAPES.3: Find the Odd One Out (20 questions)');
        console.log('  - SHAPES.4: Count the Stars (20 questions)');
        console.log('=====================================\n');

        console.log('✨ Shapes domain seeding completed successfully!\n');
    } catch (error) {
        console.error('❌ Error during seeding:', error);
        throw error;
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

console.log('✨ Database seeded with Shapes domain!');
