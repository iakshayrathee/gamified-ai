import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const shapes = {
    // Corrected hex codes and ensured valid SVG structure
    circle: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0NCIgZmlsbD0iI0ZFMjg0OCIgLz48L3N2Zz4=', // Vibrant Pink/Red
    square: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB4PSIxMCIgeT0iMTAiIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgcng9IjgiIGZpbGw9IiNGQTU0MUMiIC8+PC9zdmc+', // Vibrant Orange
    triangle: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNTAgOCBMMiA5MiBMOTggOTIgWiIgZmlsbD0iI0ZBRFMyOSIgLz48L3N2Zz4=', // Vibrant Yellow
    oval: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZWxsaXBzZSBjeD0iNTAiIGN5PSI1MCIgcng9IjQ1IiByeT0iMzAiIGZpbGw9IiM1MkM0MUEiIC8+PC9zdmc+', // Vibrant Green
    rectangle: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB4PSI1IiB5PSIzMCIgd2lkdGg9IjkwIiBoZWlnaHQ9IjQwIiByeD0iNSIgZmlsbD0iIzE4OTBGRiIgLz48L3N2Zz4=', // Vibrant Blue
    star: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNTAgNSBMNjEgNDAgTDk4IDQwIEw2OSA2MCBMODAgOTUgTDUwIDc1IEwyMCA5NSBMMzEgNjAgTDIgNDAgTDM5IDQwIFoiIGZpbGw9IiM3MjJFRDEiIC8+PC9zdmc+', // Vibrant Purple
    diamond: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNTAgNSBMOTUgNTAgTDUwIDk1IEw1IDUwIFoiIGZpbGw9IiNFQjJGN0YiIC8+PC9zdmc+', // Vibrant Magenta
    heart: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNTAgMzAgQzUwIDIwIDM1IDIwIDM1IDMwIEMzNSA0NSA1MCA2NSA1MCA4NSBDNTAgNjUgNjUgNDUgNjUgMzAgQzY1IDIwIDUwIDIwIDUwIDMwIFoiIGZpbGw9IiNGNTIyMkQiIC8+PC9zdmc+' // Vibrant Red
};

async function seedWorksheets() {
    console.log('Cleaning up and seeding Worksheet questions...');

    const ws1 = await prisma.microSkill.findFirst({ where: { code: 'WS.1' } });
    const ws2 = await prisma.microSkill.findFirst({ where: { code: 'WS.2' } });

    if (!ws1 || !ws2) return;

    await prisma.attempt.deleteMany({ where: { microSkillId: { in: [ws1.id, ws2.id] } } });
    await prisma.wordMastery.deleteMany({ where: { microSkillId: { in: [ws1.id, ws2.id] } } });
    await prisma.skillProgress.deleteMany({ where: { microSkillId: { in: [ws1.id, ws2.id] } } });
    await prisma.question.deleteMany({ where: { microSkillId: { in: [ws1.id, ws2.id] } } });

    // WS.1 Q1: Shape to Shape
    await prisma.question.create({
        data: {
            microSkillId: ws1.id,
            difficultyLevel: 1,
            promptText: "1) Match the shapes with their matching shapes",
            correctAnswer: "MATCH_ALL",
            assetUrls: {
                gameTemplate: 'SHAPE_MATCHING',
                pairs: [
                    { id: '1', left: { type: 'image', value: shapes.circle }, right: { type: 'image', value: shapes.circle } },
                    { id: '2', left: { type: 'image', value: shapes.square }, right: { type: 'image', value: shapes.square } },
                    { id: '3', left: { type: 'image', value: shapes.triangle }, right: { type: 'image', value: shapes.triangle } },
                    { id: '4', left: { type: 'image', value: shapes.rectangle }, right: { type: 'image', value: shapes.rectangle } },
                    { id: '5', left: { type: 'image', value: shapes.star }, right: { type: 'image', value: shapes.star } }
                ]
            }
        }
    });

    // WS.1 Q2: Shape to Text
    await prisma.question.create({
        data: {
            microSkillId: ws1.id,
            difficultyLevel: 1,
            promptText: "2) Match the shapes with their names",
            correctAnswer: "MATCH_ALL",
            assetUrls: {
                gameTemplate: 'SHAPE_MATCHING',
                pairs: [
                    { id: '1', left: { type: 'image', value: shapes.triangle }, right: { type: 'text', value: 'Triangle' } },
                    { id: '2', left: { type: 'image', value: shapes.rectangle }, right: { type: 'text', value: 'Rectangle' } },
                    { id: '3', left: { type: 'image', value: shapes.circle }, right: { type: 'text', value: 'Circle' } },
                    { id: '4', left: { type: 'image', value: shapes.star }, right: { type: 'text', value: 'Star' } },
                    { id: '5', left: { type: 'image', value: shapes.square }, right: { type: 'text', value: 'Square' } },
                    { id: '6', left: { type: 'image', value: shapes.oval }, right: { type: 'text', value: 'Oval' } }
                ]
            }
        }
    });

    // WS.1 Q3: Odd One Out
    await prisma.question.create({
        data: {
            microSkillId: ws1.id,
            difficultyLevel: 1,
            promptText: "3) Find the odd one out",
            correctAnswer: "ODD_ONE_OUT",
            assetUrls: {
                gameTemplate: 'ODD_ONE_OUT_WORKSHEET',
                rows: [
                    {
                        items: [
                            { id: 'r1i1', value: shapes.triangle, isOdd: false },
                            { id: 'r1i2', value: shapes.triangle, isOdd: false },
                            { id: 'r1i3', value: shapes.triangle, isOdd: false },
                            { id: 'r1i4', value: shapes.star, isOdd: true }
                        ]
                    },
                    {
                        items: [
                            { id: 'r2i1', value: shapes.oval, isOdd: true },
                            { id: 'r2i2', value: shapes.heart, isOdd: false },
                            { id: 'r2i3', value: shapes.heart, isOdd: false },
                            { id: 'r2i4', value: shapes.heart, isOdd: false }
                        ]
                    },
                    {
                        items: [
                            { id: 'r3i1', value: shapes.diamond, isOdd: false },
                            { id: 'r3i2', value: shapes.star, isOdd: true },
                            { id: 'r3i3', value: shapes.diamond, isOdd: false },
                            { id: 'r3i4', value: shapes.diamond, isOdd: false }
                        ]
                    },
                    {
                        items: [
                            { id: 'r4i1', value: shapes.oval, isOdd: false },
                            { id: 'r4i2', value: shapes.oval, isOdd: false },
                            { id: 'r4i3', value: shapes.triangle, isOdd: true },
                            { id: 'r4i4', value: shapes.oval, isOdd: false }
                        ]
                    }
                ]
            }
        }
    });

    // WS.2: Who Am I?
    const whoAmIQuestions = [
        { prompt: "I am round and have no corners. Who am I?", correct: "Circle", distractors: ["Square", "Triangle", "Rectangle", "Star"] },
        { prompt: "I have four equal sides and four corners. Who am I?", correct: "Square", distractors: ["Circle", "Triangle", "Rectangle", "Star"] },
        { prompt: "I have three sides and three corners. Who am I?", correct: "Triangle", distractors: ["Circle", "Square", "Rectangle", "Star"] },
        { prompt: "I have four sides and four corners. Who am I?", correct: "Rectangle", distractors: ["Circle", "Square", "Triangle", "Star"] },
        { prompt: "I have five points. Who am I?", correct: "Star", distractors: ["Circle", "Square", "Triangle", "Rectangle"] }
    ];

    for (const q of whoAmIQuestions) {
        await prisma.question.create({
            data: {
                microSkillId: ws2.id,
                difficultyLevel: 1,
                promptText: q.prompt,
                correctAnswer: q.correct,
                distractors: q.distractors,
                assetUrls: { gameTemplate: 'TEXT_INPUT' }
            }
        });
    }

    console.log('Worksheet questions seeded successfully!');
}

seedWorksheets()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
