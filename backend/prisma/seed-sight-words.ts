import { PrismaClient, GameTemplate } from '@prisma/client';

const prisma = new PrismaClient();

// Dolch Sight Words - All 80 words
const dolchWords = [
    // List 1 (20 words)
    'the', 'to', 'and', 'he', 'a', 'I', 'you', 'it', 'of', 'in',
    'was', 'said', 'his', 'that', 'she', 'for', 'on', 'they', 'but', 'had',
    // List 2 (20 words)
    'at', 'him', 'with', 'up', 'all', 'look', 'is', 'her', 'there', 'some',
    'out', 'as', 'be', 'have', 'go', 'we', 'am', 'then', 'little', 'down',
    // List 3 (20 words)
    'do', 'can', 'could', 'when', 'did', 'what', 'so', 'see', 'not', 'were',
    'get', 'them', 'like', 'one', 'this', 'my', 'would', 'me', 'will', 'yes',
    // List 4 (20 words)
    'big', 'went', 'are', 'come', 'if', 'now', 'long', 'no', 'came', 'ask',
    'very', 'an', 'over', 'your', 'its', 'ride', 'into', 'just', 'blue', 'red'
];

// Picture URLs for Meaning stage (using dummyimage.com with color-coded backgrounds)
const pictureUrls: Record<string, string> = {
    // List 1 - Blue background (#4a90e2)
    'the': 'https://dummyimage.com/300x300/4a90e2/ffffff&text=the',
    'to': 'https://dummyimage.com/300x300/4a90e2/ffffff&text=to',
    'and': 'https://dummyimage.com/300x300/4a90e2/ffffff&text=and',
    'he': 'https://dummyimage.com/300x300/4a90e2/ffffff&text=he',
    'a': 'https://dummyimage.com/300x300/4a90e2/ffffff&text=a',
    'I': 'https://dummyimage.com/300x300/4a90e2/ffffff&text=I',
    'you': 'https://dummyimage.com/300x300/4a90e2/ffffff&text=you',
    'it': 'https://dummyimage.com/300x300/4a90e2/ffffff&text=it',
    'of': 'https://dummyimage.com/300x300/4a90e2/ffffff&text=of',
    'in': 'https://dummyimage.com/300x300/4a90e2/ffffff&text=in',
    'was': 'https://dummyimage.com/300x300/4a90e2/ffffff&text=was',
    'said': 'https://dummyimage.com/300x300/4a90e2/ffffff&text=said',
    'his': 'https://dummyimage.com/300x300/4a90e2/ffffff&text=his',
    'that': 'https://dummyimage.com/300x300/4a90e2/ffffff&text=that',
    'she': 'https://dummyimage.com/300x300/4a90e2/ffffff&text=she',
    'for': 'https://dummyimage.com/300x300/4a90e2/ffffff&text=for',
    'on': 'https://dummyimage.com/300x300/4a90e2/ffffff&text=on',
    'they': 'https://dummyimage.com/300x300/4a90e2/ffffff&text=they',
    'but': 'https://dummyimage.com/300x300/4a90e2/ffffff&text=but',
    'had': 'https://dummyimage.com/300x300/4a90e2/ffffff&text=had',
    // List 2 - Green background (#50c878)
    'at': 'https://dummyimage.com/300x300/50c878/ffffff&text=at',
    'him': 'https://dummyimage.com/300x300/50c878/ffffff&text=him',
    'with': 'https://dummyimage.com/300x300/50c878/ffffff&text=with',
    'up': 'https://dummyimage.com/300x300/50c878/ffffff&text=up',
    'all': 'https://dummyimage.com/300x300/50c878/ffffff&text=all',
    'look': 'https://dummyimage.com/300x300/50c878/ffffff&text=look',
    'is': 'https://dummyimage.com/300x300/50c878/ffffff&text=is',
    'her': 'https://dummyimage.com/300x300/50c878/ffffff&text=her',
    'there': 'https://dummyimage.com/300x300/50c878/ffffff&text=there',
    'some': 'https://dummyimage.com/300x300/50c878/ffffff&text=some',
    'out': 'https://dummyimage.com/300x300/50c878/ffffff&text=out',
    'as': 'https://dummyimage.com/300x300/50c878/ffffff&text=as',
    'be': 'https://dummyimage.com/300x300/50c878/ffffff&text=be',
    'have': 'https://dummyimage.com/300x300/50c878/ffffff&text=have',
    'go': 'https://dummyimage.com/300x300/50c878/ffffff&text=go',
    'we': 'https://dummyimage.com/300x300/50c878/ffffff&text=we',
    'am': 'https://dummyimage.com/300x300/50c878/ffffff&text=am',
    'then': 'https://dummyimage.com/300x300/50c878/ffffff&text=then',
    'little': 'https://dummyimage.com/300x300/50c878/ffffff&text=little',
    'down': 'https://dummyimage.com/300x300/50c878/ffffff&text=down',
    // List 3 - Red background (#ff6b6b)
    'do': 'https://dummyimage.com/300x300/ff6b6b/ffffff&text=do',
    'can': 'https://dummyimage.com/300x300/ff6b6b/ffffff&text=can',
    'could': 'https://dummyimage.com/300x300/ff6b6b/ffffff&text=could',
    'when': 'https://dummyimage.com/300x300/ff6b6b/ffffff&text=when',
    'did': 'https://dummyimage.com/300x300/ff6b6b/ffffff&text=did',
    'what': 'https://dummyimage.com/300x300/ff6b6b/ffffff&text=what',
    'so': 'https://dummyimage.com/300x300/ff6b6b/ffffff&text=so',
    'see': 'https://dummyimage.com/300x300/ff6b6b/ffffff&text=see',
    'not': 'https://dummyimage.com/300x300/ff6b6b/ffffff&text=not',
    'were': 'https://dummyimage.com/300x300/ff6b6b/ffffff&text=were',
    'get': 'https://dummyimage.com/300x300/ff6b6b/ffffff&text=get',
    'them': 'https://dummyimage.com/300x300/ff6b6b/ffffff&text=them',
    'like': 'https://dummyimage.com/300x300/ff6b6b/ffffff&text=like',
    'one': 'https://dummyimage.com/300x300/ff6b6b/ffffff&text=one',
    'this': 'https://dummyimage.com/300x300/ff6b6b/ffffff&text=this',
    'my': 'https://dummyimage.com/300x300/ff6b6b/ffffff&text=my',
    'would': 'https://dummyimage.com/300x300/ff6b6b/ffffff&text=would',
    'me': 'https://dummyimage.com/300x300/ff6b6b/ffffff&text=me',
    'will': 'https://dummyimage.com/300x300/ff6b6b/ffffff&text=will',
    'yes': 'https://dummyimage.com/300x300/ff6b6b/ffffff&text=yes',
    // List 4 - Orange background (#ffa500)
    'big': 'https://dummyimage.com/300x300/ffa500/ffffff&text=big',
    'went': 'https://dummyimage.com/300x300/ffa500/ffffff&text=went',
    'are': 'https://dummyimage.com/300x300/ffa500/ffffff&text=are',
    'come': 'https://dummyimage.com/300x300/ffa500/ffffff&text=come',
    'if': 'https://dummyimage.com/300x300/ffa500/ffffff&text=if',
    'now': 'https://dummyimage.com/300x300/ffa500/ffffff&text=now',
    'long': 'https://dummyimage.com/300x300/ffa500/ffffff&text=long',
    'no': 'https://dummyimage.com/300x300/ffa500/ffffff&text=no',
    'came': 'https://dummyimage.com/300x300/ffa500/ffffff&text=came',
    'ask': 'https://dummyimage.com/300x300/ffa500/ffffff&text=ask',
    'very': 'https://dummyimage.com/300x300/ffa500/ffffff&text=very',
    'an': 'https://dummyimage.com/300x300/ffa500/ffffff&text=an',
    'over': 'https://dummyimage.com/300x300/ffa500/ffffff&text=over',
    'your': 'https://dummyimage.com/300x300/ffa500/ffffff&text=your',
    'its': 'https://dummyimage.com/300x300/ffa500/ffffff&text=its',
    'ride': 'https://dummyimage.com/300x300/ffa500/ffffff&text=ride',
    'into': 'https://dummyimage.com/300x300/ffa500/ffffff&text=into',
    'just': 'https://dummyimage.com/300x300/ffa500/ffffff&text=just',
    // Special colors
    'blue': 'https://dummyimage.com/300x300/0000ff/ffffff&text=blue',
    'red': 'https://dummyimage.com/300x300/ff0000/ffffff&text=red',
};

// Helper function to generate simple sentences with the word
function generateSentence(word: string): string {
    const sentences: Record<string, string> = {
        'the': 'I see ___ cat.',
        'to': 'I want ___ go.',
        'and': 'You ___ I play.',
        'he': '___ is my friend.',
        'a': 'I have ___ ball.',
        'I': '___ like to read.',
        'you': 'Can ___ help me?',
        'it': 'Look at ___!',
        'of': 'A cup ___ water.',
        'in': 'The cat is ___ the box.',
        'was': 'She ___ happy.',
        'said': 'Mom ___ hello.',
        'his': 'That is ___ book.',
        'that': 'I know ___ you can do it.',
        'she': '___ is very kind.',
        'for': 'This is ___ you.',
        'on': 'The book is ___ the table.',
        'they': '___ are playing.',
        'but': 'I want to, ___ I can\'t.',
        'had': 'She ___ a good time.',
        'at': 'Look ___ me!',
        'him': 'Give it to ___.',
        'with': 'Come ___ me.',
        'up': 'Look ___!',
        'all': 'We ___ went home.',
        'look': '___ at the sky!',
        'is': 'This ___ fun!',
        'her': 'I gave ___ a gift.',
        'there': 'Put it over ___.',
        'some': 'I want ___ candy.',
        'out': 'Let\'s go ___.',
        'as': 'Run ___ fast as you can.',
        'be': 'I want to ___ a doctor.',
        'have': 'I ___ a pet.',
        'go': 'Let\'s ___ play!',
        'we': '___ are friends.',
        'am': 'I ___ happy.',
        'then': 'First this, ___ that.',
        'little': 'A ___ bird.',
        'down': 'Sit ___.',
        'do': 'What should I ___?',
        'can': '___ you help me?',
        'could': '___ you pass the salt?',
        'when': '___ will you come?',
        'did': '___ you see that?',
        'what': '___ is your name?',
        'so': 'I am ___ happy!',
        'see': 'I ___ a rainbow.',
        'not': 'I am ___ tired.',
        'were': 'They ___ at school.',
        'get': 'Let\'s ___ ice cream!',
        'them': 'Give ___ the ball.',
        'like': 'I ___ pizza.',
        'one': 'I have ___ apple.',
        'this': '___ is my book.',
        'my': 'This is ___ toy.',
        'would': '___ you like some?',
        'me': 'Come with ___.',
        'will': 'I ___ help you.',
        'yes': '___, I can do it!',
        'big': 'That is a ___ house.',
        'went': 'We ___ to the park.',
        'are': 'You ___ my friend.',
        'come': '___ here please.',
        'if': '___ you try, you can do it.',
        'now': 'Let\'s go ___!',
        'long': 'That is a ___ rope.',
        'no': '___, thank you.',
        'came': 'She ___ to visit.',
        'ask': 'Can I ___ a question?',
        'very': 'I am ___ happy.',
        'an': 'I saw ___ elephant.',
        'over': 'Jump ___ the log.',
        'your': 'Is this ___ book?',
        'its': 'The dog wagged ___ tail.',
        'ride': 'Let\'s ___ bikes!',
        'into': 'Walk ___ the room.',
        'just': 'I ___ finished.',
        'blue': 'The sky is ___.',
        'red': 'The apple is ___.',
    };
    return sentences[word] || `Find the word: ${word}`;
}

async function main() {
    console.log('🌱 Seeding Reading Foundation Domain...\n\n');

    try {
        // Delete existing Reading Foundation data
        console.log('🗑️  Deleting existing Reading Foundation data...');
        const existingDomain = await prisma.skillDomain.findFirst({
            where: { code: 'RF' }
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

            // Delete WordMastery records (due to foreign key constraints)
            await prisma.wordMastery.deleteMany({
                where: {
                    microSkill: {
                        domainId: existingDomain.id
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
        console.log('  ✅ Deleted existing Reading Foundation data\n');

        // Create Reading Foundation domain
        console.log('📚 Creating Reading Foundation domain...');
        const domain = await prisma.skillDomain.create({
            data: {
                name: 'Reading Foundation',
                code: 'RF',
                order: 15,
            },
        });
        console.log(`  ✅ Domain created: ${domain.name} (${domain.code}) - Order: ${domain.order}\n`);

        // Create 5 unified micro-skills (one for each stage)
        console.log('🎯 Creating 5 unified micro-skills for all 80 Dolch words...');
        const stageNames = ['Recognition', 'Meaning', 'Recall', 'Reading', 'Spelling'];
        const stageDescriptions = [
            'Recognize sight words instantly',
            'Match words to their meanings',
            'Recall words from audio',
            'Find words in sentences',
            'Spell words correctly'
        ];

        const skills = [];
        for (let i = 0; i < 5; i++) {
            const skill = await prisma.microSkill.create({
                data: {
                    name: `${stageNames[i]} - All Dolch Words`,
                    code: `RF.ALL.${i + 1}`,
                    domainId: domain.id,
                    gameTemplate: i === 0 ? GameTemplate.TAP_SELECT :
                        i === 1 ? GameTemplate.PICTURE_TO_WORD :
                            i === 2 ? GameTemplate.AUDIO_TO_LETTER :
                                i === 3 ? GameTemplate.FIND_THE_WORD :
                                    GameTemplate.SEQUENCING,
                },
            });
            skills.push(skill);
            console.log(`  ✅ ${skill.code}: ${skill.name}`);
        }
        console.log('');

        // Create questions for all skills
        console.log('❓ Creating questions for all skills...\n');
        let questionCount = 0;

        // Recognition - 80 questions with progressive flashcard display
        console.log('  Stage 1: Recognition (Progressive Flashcard Display)');
        for (let wordIndex = 0; wordIndex < dolchWords.length; wordIndex++) {
            const word = dolchWords[wordIndex];
            // Progressive options: 2, 4, 6, 8, 10, ..., up to all 80 words
            const numOptions = Math.min((wordIndex + 1) * 2, dolchWords.length);
            const wordsToShow = dolchWords.slice(0, numOptions);

            const distractors = wordsToShow
                .filter(w => w !== word)
                .sort(() => Math.random() - 0.5)
                .slice(0, Math.min(3, wordsToShow.length - 1));

            await prisma.question.create({
                data: {
                    microSkillId: skills[0].id,
                    difficultyLevel: wordIndex < 27 ? 1 : wordIndex < 54 ? 2 : 3,
                    promptText: `Find the word: "${word}"`,
                    correctAnswer: word,
                    distractors: JSON.stringify(distractors),
                    hasConfusingDistractors: false,
                    assetUrls: JSON.stringify({
                        cumulativeWords: wordsToShow,
                        wordIndex: wordIndex,
                        totalWords: dolchWords.length,
                        displayMode: 'flashcard'
                    })
                }
            });
            questionCount++;
        }
        console.log(`  ✅ Created ${dolchWords.length} recognition questions with progressive flashcards`);

        // Meaning - 80 questions
        console.log('  Stage 2: Meaning (Picture to Word)');
        for (let wordIndex = 0; wordIndex < dolchWords.length; wordIndex++) {
            const word = dolchWords[wordIndex];
            const otherWords = dolchWords.filter(w => w !== word);
            const distractors = otherWords.sort(() => Math.random() - 0.5).slice(0, 3);

            // Create options array with proper structure: {id, word, imageUrl}
            const allOptions = [word, ...distractors];
            const optionsWithImages = allOptions.map((w, idx) => ({
                id: String(idx),
                word: w,
                imageUrl: pictureUrls[w] || '/assets/images/sight-words/placeholder.jpg'
            }));

            await prisma.question.create({
                data: {
                    microSkillId: skills[1].id,
                    difficultyLevel: wordIndex < 27 ? 1 : wordIndex < 54 ? 2 : 3,
                    promptText: `Which word matches this picture?`,
                    correctAnswer: word,
                    distractors: JSON.stringify(distractors),
                    hasConfusingDistractors: false,
                    assetUrls: JSON.stringify({
                        imageUrl: pictureUrls[word] || '/assets/images/sight-words/placeholder.jpg',
                        options: optionsWithImages
                    })
                }
            });
            questionCount++;
        }
        console.log(`  ✅ Created ${dolchWords.length} meaning questions`);

        // Recall - 80 questions
        console.log('  Stage 3: Recall (Audio to Word)');
        for (let wordIndex = 0; wordIndex < dolchWords.length; wordIndex++) {
            const word = dolchWords[wordIndex];
            const otherWords = dolchWords.filter(w => w !== word);
            const distractors = otherWords.sort(() => Math.random() - 0.5).slice(0, 3);

            await prisma.question.create({
                data: {
                    microSkillId: skills[2].id,
                    difficultyLevel: wordIndex < 27 ? 1 : wordIndex < 54 ? 2 : 3,
                    promptText: `Listen and select the word you hear: "${word}"`,
                    correctAnswer: word,
                    distractors: JSON.stringify(distractors),
                    hasConfusingDistractors: false,
                    assetUrls: JSON.stringify({
                        audio: `/assets/audio/sight-words/${word}.mp3`
                    })
                }
            });
            questionCount++;
        }
        console.log(`  ✅ Created ${dolchWords.length} recall questions`);

        // Reading - 80 questions
        console.log('  Stage 4: Reading (Find the Word)');
        for (let wordIndex = 0; wordIndex < dolchWords.length; wordIndex++) {
            const word = dolchWords[wordIndex];
            const sentence = generateSentence(word);
            const otherWords = dolchWords.filter(w => w !== word);
            const distractors = otherWords.sort(() => Math.random() - 0.5).slice(0, 3);

            await prisma.question.create({
                data: {
                    microSkillId: skills[3].id,
                    difficultyLevel: wordIndex < 27 ? 1 : wordIndex < 54 ? 2 : 3,
                    promptText: sentence,
                    correctAnswer: word,
                    distractors: JSON.stringify(distractors),
                    hasConfusingDistractors: false,
                    assetUrls: JSON.stringify({})
                }
            });
            questionCount++;
        }
        console.log(`  ✅ Created ${dolchWords.length} reading questions`);

        // Spelling - 80 questions
        console.log('  Stage 5: Spelling (Sequencing)');
        for (let wordIndex = 0; wordIndex < dolchWords.length; wordIndex++) {
            const word = dolchWords[wordIndex];
            const jumbledLetters = word.split('').sort(() => Math.random() - 0.5);

            await prisma.question.create({
                data: {
                    microSkillId: skills[4].id,
                    difficultyLevel: wordIndex < 27 ? 1 : wordIndex < 54 ? 2 : 3,
                    promptText: `Arrange the letters to spell the word`,
                    correctAnswer: word,
                    distractors: JSON.stringify(jumbledLetters),
                    hasConfusingDistractors: false,
                    assetUrls: JSON.stringify({
                        hint: word[0]
                    })
                }
            });
            questionCount++;
        }
        console.log(`  ✅ Created ${dolchWords.length} spelling questions\n`);

        console.log('📋 SEED SUMMARY');
        console.log('=====================================');
        console.log(`Domain: ${domain.name} (${domain.code})`);
        console.log(`Micro-Skills: ${skills.length} (5 unified stages)`);
        console.log(`Questions: ${questionCount} (80 per skill)`);
        console.log('');
        console.log('Skill Breakdown:');
        console.log('  - Recognition: All 80 words with progressive flashcard display');
        console.log('  - Meaning: All 80 words with picture matching');
        console.log('  - Recall: All 80 words with audio recognition');
        console.log('  - Reading: All 80 words in sentences');
        console.log('  - Spelling: All 80 words with letter sequencing');
        console.log('=====================================\n');

        console.log('✨ Reading Foundation seeding completed successfully!\n');
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

console.log('✨ Database seeded with Reading Foundation!');
