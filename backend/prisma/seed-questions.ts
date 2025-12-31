import { PrismaClient, GameTemplate } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanAndSeedDatabase() {
    console.log('🧹 Cleaning database...\n');

    try {
        // Delete all existing data (in correct order due to foreign keys)
        console.log('Deleting existing data...');
        await prisma.attempt.deleteMany({});
        console.log('  ✅ Deleted all attempts');

        await prisma.skillProgress.deleteMany({});
        console.log('  ✅ Deleted all skill progress');

        await prisma.quizReview.deleteMany({});
        console.log('  ✅ Deleted all quiz reviews');

        await prisma.session.deleteMany({});
        console.log('  ✅ Deleted all sessions');

        await prisma.achievement.deleteMany({});
        console.log('  ✅ Deleted all achievements');

        await prisma.question.deleteMany({});
        console.log('  ✅ Deleted all questions');

        console.log('\n🌱 Seeding realistic questions for ALL skills...\n');

        // Get ALL skills with their game templates
        const skills = await prisma.microSkill.findMany({
            orderBy: { code: 'asc' }
        });

        if (skills.length === 0) {
            console.log('❌ No skills found. Please seed skills first.');
            return;
        }

        console.log(`📊 Found ${skills.length} skills to seed\n`);

        let totalCreated = 0;

        for (const skill of skills) {
            console.log(`📚 ${skill.name} (${skill.code}) - Template: ${skill.gameTemplate}`);

            // Create 10 questions for each difficulty level (1, 2, 3)
            for (let difficulty = 1; difficulty <= 3; difficulty++) {
                for (let i = 1; i <= 10; i++) {
                    const questionData = generateQuestionByTemplate(
                        skill.code,
                        skill.name,
                        skill.gameTemplate,
                        difficulty,
                        i
                    );

                    await prisma.question.create({
                        data: {
                            microSkillId: skill.id,
                            difficultyLevel: difficulty,
                            promptText: questionData.promptText,
                            correctAnswer: questionData.correctAnswer,
                            distractors: questionData.distractors,
                            hasConfusingDistractors: difficulty >= 2,
                            assetUrls: questionData.assetUrls || {},
                        },
                    });

                    totalCreated++;
                }
            }
            console.log(`  ✅ Created 30 questions (10 per difficulty level)`);
        }

        console.log(`\n🎉 Successfully created ${totalCreated} realistic questions!`);
        console.log(`📊 Distribution: ${skills.length} skills × 3 difficulty levels × 10 questions = ${totalCreated} total`);

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Type for question data
interface QuestionData {
    promptText: string;
    correctAnswer: string;
    distractors: string[];
    assetUrls?: Record<string, string>;
}

// Generate question based on game template
function generateQuestionByTemplate(
    skillCode: string,
    skillName: string,
    gameTemplate: GameTemplate,
    difficulty: number,
    questionNum: number
): QuestionData {
    const difficultyLabel = ['Easy', 'Medium', 'Hard'][difficulty - 1];

    // Determine skill category
    const isPhonics = skillCode.startsWith('A.');
    const isCVC = skillCode.includes('CVC') || skillCode.startsWith('C.');
    const isSightWord = skillCode.includes('SIGHT') || skillCode.startsWith('S.');
    const isBlending = skillCode.startsWith('B.');
    const isReading = skillCode.startsWith('R.');

    switch (gameTemplate) {
        case 'TAP_SELECT':
            return generateTapSelectQuestion(skillCode, difficulty, questionNum, isPhonics, isCVC, isSightWord);

        case 'DRAG_DROP':
            return generateDragDropQuestion(skillCode, difficulty, questionNum, isPhonics, isCVC);

        case 'AUDIO_TO_LETTER':
            return generateAudioToLetterQuestion(skillCode, difficulty, questionNum, isPhonics);

        case 'MEMORY_CARD':
            return generateMemoryCardQuestion(skillCode, difficulty, questionNum, isPhonics, isCVC);

        case 'SORTING':
            return generateSortingQuestion(skillCode, difficulty, questionNum, isPhonics, isCVC);

        case 'PICTURE_TO_WORD':
            return generatePictureToWordQuestion(skillCode, difficulty, questionNum, isCVC, isSightWord);

        case 'PUZZLE_JOIN':
            return generatePuzzleJoinQuestion(skillCode, difficulty, questionNum, isCVC);

        case 'FIND_THE_WORD':
            return generateFindTheWordQuestion(skillCode, difficulty, questionNum, isSightWord, isCVC);

        case 'SEQUENCING':
            return generateSequencingQuestion(skillCode, difficulty, questionNum, isReading, isCVC);

        case 'ODD_ONE_OUT':
            return generateOddOneOutQuestion(skillCode, difficulty, questionNum, isPhonics, isCVC);

        default:
            return generateTapSelectQuestion(skillCode, difficulty, questionNum, isPhonics, isCVC, isSightWord);
    }
}

// TAP_SELECT: Multiple choice with tap to select
function generateTapSelectQuestion(skillCode: string, difficulty: number, questionNum: number, isPhonics: boolean, isCVC: boolean, isSightWord: boolean) {
    if (isPhonics) {
        const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'm', 'n', 'p', 'q'];
        const correctAnswer = letters[(questionNum - 1) % letters.length];

        const confusingPairs: Record<string, string[]> = {
            'b': ['d', 'p', 'q'], 'd': ['b', 'p', 'q'], 'p': ['b', 'd', 'q'], 'q': ['b', 'd', 'p'],
            'm': ['n', 'w'], 'n': ['m', 'h'], 'a': ['e', 'o'], 'e': ['a', 'i']
        };

        const distractors = difficulty >= 2 && confusingPairs[correctAnswer]
            ? confusingPairs[correctAnswer].slice(0, 3)
            : letters.filter(l => l !== correctAnswer).slice(0, 3);

        return {
            promptText: `Which letter is "${correctAnswer.toUpperCase()}"?`,
            correctAnswer,
            distractors,
        };
    } else if (isCVC) {
        const cvcWords = ['cat', 'dog', 'bat', 'pig', 'sun', 'bed', 'top', 'run', 'hat', 'pen'];
        const correctAnswer = cvcWords[(questionNum - 1) % cvcWords.length];
        const distractors = cvcWords.filter(w => w !== correctAnswer).slice(0, 3);

        return {
            promptText: `Select the word: "${correctAnswer}"`,
            correctAnswer,
            distractors,
        };
    } else if (isSightWord) {
        const sightWords = ['the', 'and', 'you', 'can', 'see', 'we', 'go', 'to', 'is', 'it'];
        const correctAnswer = sightWords[(questionNum - 1) % sightWords.length];
        const distractors = sightWords.filter(w => w !== correctAnswer).slice(0, 3);

        return {
            promptText: `Find the word: "${correctAnswer}"`,
            correctAnswer,
            distractors,
        };
    }

    return {
        promptText: `Select the correct answer`,
        correctAnswer: 'answer',
        distractors: ['option1', 'option2', 'option3'],
    };
}

// DRAG_DROP: Drag items to correct positions
function generateDragDropQuestion(skillCode: string, difficulty: number, questionNum: number, isPhonics: boolean, isCVC: boolean) {
    if (isPhonics) {
        const vowels = ['a', 'e', 'i', 'o', 'u'];
        const consonants = ['b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p'];
        const correctAnswer = questionNum % 2 === 0 ? vowels[(questionNum - 1) % vowels.length] : consonants[(questionNum - 1) % consonants.length];

        return {
            promptText: `Drag the letter "${correctAnswer}" to the correct box`,
            correctAnswer,
            distractors: [vowels[0], vowels[1], consonants[0]].filter(l => l !== correctAnswer).slice(0, 3),
        };
    } else if (isCVC) {
        const words = ['cat', 'dog', 'sun', 'bat', 'run'];
        const correctAnswer = words[(questionNum - 1) % words.length];

        return {
            promptText: `Drag the letters to spell: "${correctAnswer}"`,
            correctAnswer,
            distractors: correctAnswer.split(''),
        };
    }

    return {
        promptText: 'Drag to match',
        correctAnswer: 'match',
        distractors: ['item1', 'item2', 'item3'],
    };
}

// AUDIO_TO_LETTER: Listen and select letter
function generateAudioToLetterQuestion(skillCode: string, difficulty: number, questionNum: number, isPhonics: boolean) {
    const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    const correctAnswer = letters[(questionNum - 1) % letters.length];

    const confusingPairs: Record<string, string[]> = {
        'b': ['d', 'p'], 'd': ['b', 't'], 'p': ['b', 'q'], 'm': ['n'], 'n': ['m']
    };

    const distractors = difficulty >= 2 && confusingPairs[correctAnswer]
        ? confusingPairs[correctAnswer].concat(letters.filter(l => l !== correctAnswer && !confusingPairs[correctAnswer]?.includes(l))).slice(0, 3)
        : letters.filter(l => l !== correctAnswer).slice(0, 3);

    return {
        promptText: `Listen and select the letter you hear: /${correctAnswer}/`,
        correctAnswer,
        distractors,
        assetUrls: { audio: `/audio/letters/${correctAnswer}.mp3` },
    };
}

// MEMORY_CARD: Match pairs
function generateMemoryCardQuestion(skillCode: string, difficulty: number, questionNum: number, isPhonics: boolean, isCVC: boolean) {
    if (isPhonics) {
        const pairs = [
            ['A', 'a'], ['B', 'b'], ['C', 'c'], ['D', 'd'], ['E', 'e']
        ];
        const pair = pairs[(questionNum - 1) % pairs.length];

        return {
            promptText: `Match uppercase and lowercase letters`,
            correctAnswer: pair.join(','),
            distractors: pairs.flat().filter(l => !pair.includes(l)).slice(0, 6),
        };
    } else if (isCVC) {
        const pairs = [
            ['cat', '🐱'], ['dog', '🐕'], ['sun', '☀️'], ['bat', '🦇'], ['pen', '🖊️']
        ];
        const pair = pairs[(questionNum - 1) % pairs.length];

        return {
            promptText: `Match the word with its picture`,
            correctAnswer: pair[0],
            distractors: pairs.map(p => p[0]).filter(w => w !== pair[0]).slice(0, 3),
        };
    }

    return {
        promptText: 'Match the pairs',
        correctAnswer: 'pair1',
        distractors: ['item1', 'item2', 'item3'],
    };
}

// SORTING: Sort items into categories
function generateSortingQuestion(skillCode: string, difficulty: number, questionNum: number, isPhonics: boolean, isCVC: boolean) {
    if (isPhonics) {
        const vowels = ['a', 'e', 'i', 'o', 'u'];
        const consonants = ['b', 'c', 'd', 'f', 'g'];

        return {
            promptText: `Sort letters into vowels and consonants`,
            correctAnswer: 'vowels:' + vowels.join(',') + '|consonants:' + consonants.join(','),
            distractors: [...vowels, ...consonants],
        };
    } else if (isCVC) {
        const animals = ['cat', 'dog', 'bat'];
        const objects = ['sun', 'pen', 'cup'];

        return {
            promptText: `Sort words into animals and objects`,
            correctAnswer: 'animals:' + animals.join(',') + '|objects:' + objects.join(','),
            distractors: [...animals, ...objects],
        };
    }

    return {
        promptText: 'Sort into categories',
        correctAnswer: 'category1',
        distractors: ['item1', 'item2', 'item3'],
    };
}

// PICTURE_TO_WORD: Match picture to word
function generatePictureToWordQuestion(skillCode: string, difficulty: number, questionNum: number, isCVC: boolean, isSightWord: boolean) {
    if (isCVC) {
        const words = [
            { word: 'cat', emoji: '🐱' },
            { word: 'dog', emoji: '🐕' },
            { word: 'sun', emoji: '☀️' },
            { word: 'bat', emoji: '🦇' },
            { word: 'pen', emoji: '🖊️' }
        ];
        const item = words[(questionNum - 1) % words.length];
        const distractors = words.filter(w => w.word !== item.word).map(w => w.word).slice(0, 3);

        return {
            promptText: `What word matches this picture? ${item.emoji}`,
            correctAnswer: item.word,
            distractors,
        };
    }

    return {
        promptText: 'Match the picture',
        correctAnswer: 'word',
        distractors: ['option1', 'option2', 'option3'],
    };
}

// PUZZLE_JOIN: Join word parts
function generatePuzzleJoinQuestion(skillCode: string, difficulty: number, questionNum: number, isCVC: boolean) {
    const words = [
        { word: 'cat', onset: 'c', rime: 'at' },
        { word: 'dog', onset: 'd', rime: 'og' },
        { word: 'sun', onset: 's', rime: 'un' },
        { word: 'bat', onset: 'b', rime: 'at' },
        { word: 'run', onset: 'r', rime: 'un' }
    ];
    const item = words[(questionNum - 1) % words.length];

    return {
        promptText: `Join the parts to make a word: "${item.onset}" + "${item.rime}"`,
        correctAnswer: item.word,
        distractors: words.filter(w => w.word !== item.word).map(w => w.word).slice(0, 3),
    };
}

// FIND_THE_WORD: Find word in sentence
function generateFindTheWordQuestion(skillCode: string, difficulty: number, questionNum: number, isSightWord: boolean, isCVC: boolean) {
    const sentences = [
        { sentence: 'The cat is big', target: 'cat' },
        { sentence: 'I can see you', target: 'see' },
        { sentence: 'We go to school', target: 'go' },
        { sentence: 'The dog can run', target: 'run' },
        { sentence: 'You and I play', target: 'and' }
    ];
    const item = sentences[(questionNum - 1) % sentences.length];

    return {
        promptText: `Find the word "${item.target}" in the sentence`,
        correctAnswer: item.target,
        distractors: item.sentence.split(' ').filter(w => w.toLowerCase() !== item.target).slice(0, 3),
    };
}

// SEQUENCING: Put items in order
function generateSequencingQuestion(skillCode: string, difficulty: number, questionNum: number, isReading: boolean, isCVC: boolean) {
    const sequences = [
        { items: ['c', 'a', 't'], correct: 'cat' },
        { items: ['d', 'o', 'g'], correct: 'dog' },
        { items: ['s', 'u', 'n'], correct: 'sun' },
        { items: ['b', 'a', 't'], correct: 'bat' },
        { items: ['r', 'u', 'n'], correct: 'run' }
    ];
    const item = sequences[(questionNum - 1) % sequences.length];

    return {
        promptText: `Put the letters in order to spell a word`,
        correctAnswer: item.correct,
        distractors: item.items,
    };
}

// ODD_ONE_OUT: Find the different item
function generateOddOneOutQuestion(skillCode: string, difficulty: number, questionNum: number, isPhonics: boolean, isCVC: boolean) {
    if (isPhonics) {
        const sets = [
            { items: ['a', 'e', 'i', 'b'], odd: 'b', reason: 'consonant among vowels' },
            { items: ['b', 'd', 'p', 'a'], odd: 'a', reason: 'vowel among consonants' },
            { items: ['m', 'n', 'w', 'e'], odd: 'e', reason: 'vowel among consonants' }
        ];
        const set = sets[(questionNum - 1) % sets.length];

        return {
            promptText: `Which one is different?`,
            correctAnswer: set.odd,
            distractors: set.items.filter(i => i !== set.odd),
        };
    } else if (isCVC) {
        const sets = [
            { items: ['cat', 'dog', 'bat', 'sun'], odd: 'sun', reason: 'different vowel sound' },
            { items: ['run', 'fun', 'sun', 'cat'], odd: 'cat', reason: 'different ending' }
        ];
        const set = sets[(questionNum - 1) % sets.length];

        return {
            promptText: `Which word doesn't belong?`,
            correctAnswer: set.odd,
            distractors: set.items.filter(i => i !== set.odd),
        };
    }

    return {
        promptText: 'Find the odd one out',
        correctAnswer: 'different',
        distractors: ['same1', 'same2', 'same3'],
    };
}

// Run the function
cleanAndSeedDatabase()
    .then(() => {
        console.log('\n✨ Database cleaned and seeded with realistic questions!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Operation failed:', error);
        process.exit(1);
    });
