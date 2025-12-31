import { PrismaClient, UserRole, GameTemplate } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting comprehensive database seed...\n');

    // ============================================
    // 1. CREATE USERS
    // ============================================
    console.log('👥 Creating users...');

    const admin = await prisma.user.create({
        data: {
            name: 'Admin User',
            email: 'admin@literacy.com',
            passwordHash: await bcrypt.hash('admin123', 10),
            role: UserRole.ADMIN,
        },
    });

    const teacher1 = await prisma.user.create({
        data: {
            name: 'Ms. Sarah Johnson',
            email: 'sarah.johnson@teacher.com',
            passwordHash: await bcrypt.hash('teacher123', 10),
            role: UserRole.TEACHER,
        },
    });

    const teacher2 = await prisma.user.create({
        data: {
            name: 'Mr. David Chen',
            email: 'david.chen@teacher.com',
            passwordHash: await bcrypt.hash('teacher123', 10),
            role: UserRole.TEACHER,
        },
    });

    const studentPassword = await bcrypt.hash('student123', 10);
    const students = await Promise.all([
        prisma.user.create({ data: { name: 'Emma Johnson', email: 'emma.johnson@student.com', passwordHash: studentPassword, role: UserRole.CHILD, teacherId: teacher1.id } }),
        prisma.user.create({ data: { name: 'Liam Smith', email: 'liam.smith@student.com', passwordHash: studentPassword, role: UserRole.CHILD, teacherId: teacher1.id } }),
        prisma.user.create({ data: { name: 'Olivia Brown', email: 'olivia.brown@student.com', passwordHash: studentPassword, role: UserRole.CHILD, teacherId: teacher1.id } }),
        prisma.user.create({ data: { name: 'Noah Davis', email: 'noah.davis@student.com', passwordHash: studentPassword, role: UserRole.CHILD, teacherId: teacher1.id } }),
        prisma.user.create({ data: { name: 'Ava Wilson', email: 'ava.wilson@student.com', passwordHash: studentPassword, role: UserRole.CHILD, teacherId: teacher1.id } }),
        prisma.user.create({ data: { name: 'Sophia Martinez', email: 'sophia.martinez@student.com', passwordHash: studentPassword, role: UserRole.CHILD, teacherId: teacher2.id } }),
        prisma.user.create({ data: { name: 'Jackson Lee', email: 'jackson.lee@student.com', passwordHash: studentPassword, role: UserRole.CHILD, teacherId: teacher2.id } }),
        prisma.user.create({ data: { name: 'Isabella Garcia', email: 'isabella.garcia@student.com', passwordHash: studentPassword, role: UserRole.CHILD, teacherId: teacher2.id } }),
    ]);
    console.log('  ✅ Users: 1 Admin, 2 Teachers, 8 Students\n');

    // ============================================
    // 2. CREATE SKILL DOMAINS (12 domains)
    // ============================================
    console.log('📚 Creating 12 skill domains...');

    const domains = await Promise.all([
        prisma.skillDomain.create({ data: { code: 'A', name: 'Letter Identification', description: 'Recognizing uppercase and lowercase letters', order: 1 } }),
        prisma.skillDomain.create({ data: { code: 'B', name: 'Lowercase/Uppercase Matching', description: 'Matching lowercase to uppercase letters', order: 2 } }),
        prisma.skillDomain.create({ data: { code: 'C', name: 'Word Recognition', description: 'Recognizing common words', order: 3 } }),
        prisma.skillDomain.create({ data: { code: 'D', name: 'Rhyming', description: 'Identifying rhyming words', order: 4 } }),
        prisma.skillDomain.create({ data: { code: 'E', name: 'Blending & Segmenting', description: 'Blending sounds and segmenting words', order: 5 } }),
        prisma.skillDomain.create({ data: { code: 'F', name: 'Beginning/Ending Sounds', description: 'Identifying initial and final sounds', order: 6 } }),
        prisma.skillDomain.create({ data: { code: 'G', name: 'Letter-Sound Associations Uppercase', description: 'Associating uppercase letters with sounds', order: 7 } }),
        prisma.skillDomain.create({ data: { code: 'H', name: 'Letter-Sound Associations Lowercase', description: 'Associating lowercase letters with sounds', order: 8 } }),
        prisma.skillDomain.create({ data: { code: 'I', name: 'Short Vowels CVC', description: 'Consonant-Vowel-Consonant words', order: 9 } }),
        prisma.skillDomain.create({ data: { code: 'N', name: 'Sight Words', description: 'High-frequency sight words', order: 10 } }),
        prisma.skillDomain.create({ data: { code: 'O', name: 'Reading Strategies', description: 'Comprehension and decoding strategies', order: 11 } }),
        prisma.skillDomain.create({ data: { code: 'R', name: 'Vocabulary', description: 'Word meanings and usage', order: 12 } }),
    ]);
    console.log('  ✅ Domains: 12 created\n');

    // ============================================
    // 3. CREATE 100+ MICRO SKILLS
    // ============================================
    console.log('🎯 Creating 100+ micro skills...');

    const skills: any[] = [];

    // A: Letter Identification (A.1-A.6)
    for (let i = 1; i <= 6; i++) {
        skills.push(await prisma.microSkill.create({
            data: {
                code: `A.${i}`,
                name: `Letter Identification ${i}`,
                domainId: domains[0].id,
                gameTemplate: GameTemplate.TAP_SELECT,
                prerequisiteSkills: i > 1 ? JSON.parse(`["A.${i - 1}"]`) : JSON.parse('[]'),
                nextSkills: i < 6 ? JSON.parse(`["A.${i + 1}"]`) : JSON.parse('["B.1"]'),
                masteryCriteria: JSON.parse('{"accuracyThreshold":80,"timeThreshold":4,"confusionErrorThreshold":20}'),
            },
        }));
    }

    // B: Lowercase/Uppercase Matching (B.1-B.8)
    for (let i = 1; i <= 8; i++) {
        skills.push(await prisma.microSkill.create({
            data: {
                code: `B.${i}`,
                name: `Lowercase/Uppercase Matching ${i}`,
                domainId: domains[1].id,
                gameTemplate: GameTemplate.DRAG_DROP,
                prerequisiteSkills: i === 1 ? JSON.parse('["A.6"]') : JSON.parse(`["B.${i - 1}"]`),
                nextSkills: i < 8 ? JSON.parse(`["B.${i + 1}"]`) : JSON.parse('["C.1"]'),
                masteryCriteria: JSON.parse('{"accuracyThreshold":80,"timeThreshold":5,"confusionErrorThreshold":20}'),
            },
        }));
    }

    // C: Word Recognition (C.1-C.3)
    for (let i = 1; i <= 3; i++) {
        skills.push(await prisma.microSkill.create({
            data: {
                code: `C.${i}`,
                name: `Word Recognition ${i}`,
                domainId: domains[2].id,
                gameTemplate: GameTemplate.TAP_SELECT,
                prerequisiteSkills: i === 1 ? JSON.parse('["B.8"]') : JSON.parse(`["C.${i - 1}"]`),
                nextSkills: i < 3 ? JSON.parse(`["C.${i + 1}"]`) : JSON.parse('["D.1"]'),
                masteryCriteria: JSON.parse('{"accuracyThreshold":75,"timeThreshold":6,"confusionErrorThreshold":25}'),
            },
        }));
    }

    // D: Rhyming (D.1-D.3)
    for (let i = 1; i <= 3; i++) {
        skills.push(await prisma.microSkill.create({
            data: {
                code: `D.${i}`,
                name: `Rhyming ${i}`,
                domainId: domains[3].id,
                gameTemplate: GameTemplate.AUDIO_TO_LETTER,
                prerequisiteSkills: i === 1 ? JSON.parse('["C.3"]') : JSON.parse(`["D.${i - 1}"]`),
                nextSkills: i < 3 ? JSON.parse(`["D.${i + 1}"]`) : JSON.parse('["E.1"]'),
                masteryCriteria: JSON.parse('{"accuracyThreshold":75,"timeThreshold":5,"confusionErrorThreshold":25}'),
            },
        }));
    }

    // E: Blending & Segmenting (E.1-E.4)
    for (let i = 1; i <= 4; i++) {
        skills.push(await prisma.microSkill.create({
            data: {
                code: `E.${i}`,
                name: `Blending & Segmenting ${i}`,
                domainId: domains[4].id,
                gameTemplate: GameTemplate.SEQUENCING,
                prerequisiteSkills: i === 1 ? JSON.parse('["D.3"]') : JSON.parse(`["E.${i - 1}"]`),
                nextSkills: i < 4 ? JSON.parse(`["E.${i + 1}"]`) : JSON.parse('["F.1"]'),
                masteryCriteria: JSON.parse('{"accuracyThreshold":70,"timeThreshold":7,"confusionErrorThreshold":30}'),
            },
        }));
    }

    // F: Beginning/Ending Sounds (F.1-F.3)
    for (let i = 1; i <= 3; i++) {
        skills.push(await prisma.microSkill.create({
            data: {
                code: `F.${i}`,
                name: `Beginning/Ending Sounds ${i}`,
                domainId: domains[5].id,
                gameTemplate: GameTemplate.AUDIO_TO_LETTER,
                prerequisiteSkills: i === 1 ? JSON.parse('["E.4"]') : JSON.parse(`["F.${i - 1}"]`),
                nextSkills: i < 3 ? JSON.parse(`["F.${i + 1}"]`) : JSON.parse('["G.1"]'),
                masteryCriteria: JSON.parse('{"accuracyThreshold":75,"timeThreshold":5,"confusionErrorThreshold":25}'),
            },
        }));
    }

    // G: Letter-Sound Associations Uppercase (G.1-G.4)
    for (let i = 1; i <= 4; i++) {
        skills.push(await prisma.microSkill.create({
            data: {
                code: `G.${i}`,
                name: `Letter-Sound Uppercase ${i}`,
                domainId: domains[6].id,
                gameTemplate: GameTemplate.AUDIO_TO_LETTER,
                prerequisiteSkills: i === 1 ? JSON.parse('["F.3"]') : JSON.parse(`["G.${i - 1}"]`),
                nextSkills: i < 4 ? JSON.parse(`["G.${i + 1}"]`) : JSON.parse('["H.1"]'),
                masteryCriteria: JSON.parse('{"accuracyThreshold":80,"timeThreshold":4,"confusionErrorThreshold":20}'),
            },
        }));
    }

    // H: Letter-Sound Associations Lowercase (H.1-H.5)
    for (let i = 1; i <= 5; i++) {
        skills.push(await prisma.microSkill.create({
            data: {
                code: `H.${i}`,
                name: `Letter-Sound Lowercase ${i}`,
                domainId: domains[7].id,
                gameTemplate: GameTemplate.AUDIO_TO_LETTER,
                prerequisiteSkills: i === 1 ? JSON.parse('["G.4"]') : JSON.parse(`["H.${i - 1}"]`),
                nextSkills: i < 5 ? JSON.parse(`["H.${i + 1}"]`) : JSON.parse('["I.1"]'),
                masteryCriteria: JSON.parse('{"accuracyThreshold":80,"timeThreshold":4,"confusionErrorThreshold":20}'),
            },
        }));
    }

    // I-M: Short Vowels CVC (20 skills total, 4 per vowel)
    const vowels = ['I', 'J', 'K', 'L', 'M'];
    const vowelNames = ['Short A', 'Short E', 'Short I', 'Short O', 'Short U'];
    for (let v = 0; v < 5; v++) {
        for (let i = 1; i <= 4; i++) {
            const code = `${vowels[v]}.${i}`;
            const prevCode = i === 1 ? (v === 0 ? 'H.5' : `${vowels[v - 1]}.4`) : `${vowels[v]}.${i - 1}`;
            const nextCode = i < 4 ? `${vowels[v]}.${i + 1}` : (v < 4 ? `${vowels[v + 1]}.1` : 'N.1');

            skills.push(await prisma.microSkill.create({
                data: {
                    code,
                    name: `${vowelNames[v]} CVC Words ${i}`,
                    domainId: domains[8].id,
                    gameTemplate: GameTemplate.PICTURE_TO_WORD,
                    prerequisiteSkills: JSON.parse(`["${prevCode}"]`),
                    nextSkills: JSON.parse(`["${nextCode}"]`),
                    masteryCriteria: JSON.parse('{"accuracyThreshold":75,"timeThreshold":6,"confusionErrorThreshold":25}'),
                },
            }));
        }
    }

    // N: Sight Words (N.1-N.15)
    for (let i = 1; i <= 15; i++) {
        skills.push(await prisma.microSkill.create({
            data: {
                code: `N.${i}`,
                name: `Sight Words Set ${i}`,
                domainId: domains[9].id,
                gameTemplate: GameTemplate.MEMORY_CARD,
                prerequisiteSkills: i === 1 ? JSON.parse('["M.4"]') : JSON.parse(`["N.${i - 1}"]`),
                nextSkills: i < 15 ? JSON.parse(`["N.${i + 1}"]`) : JSON.parse('["O.1"]'),
                masteryCriteria: JSON.parse('{"accuracyThreshold":85,"timeThreshold":5,"confusionErrorThreshold":15}'),
            },
        }));
    }

    // O-Q: Reading Strategies (15 skills total, 5 per letter)
    const strategyLetters = ['O', 'P', 'Q'];
    const strategyNames = ['Decoding Strategies', 'Comprehension Strategies', 'Fluency Strategies'];
    for (let s = 0; s < 3; s++) {
        for (let i = 1; i <= 5; i++) {
            const code = `${strategyLetters[s]}.${i}`;
            const prevCode = i === 1 ? (s === 0 ? 'N.15' : `${strategyLetters[s - 1]}.5`) : `${strategyLetters[s]}.${i - 1}`;
            const nextCode = i < 5 ? `${strategyLetters[s]}.${i + 1}` : (s < 2 ? `${strategyLetters[s + 1]}.1` : 'R.1');

            skills.push(await prisma.microSkill.create({
                data: {
                    code,
                    name: `${strategyNames[s]} ${i}`,
                    domainId: domains[10].id,
                    gameTemplate: GameTemplate.FIND_THE_WORD,
                    prerequisiteSkills: JSON.parse(`["${prevCode}"]`),
                    nextSkills: JSON.parse(`["${nextCode}"]`),
                    masteryCriteria: JSON.parse('{"accuracyThreshold":70,"timeThreshold":8,"confusionErrorThreshold":30}'),
                },
            }));
        }
    }

    // R-X: Vocabulary (35 skills total, 5 per letter)
    const vocabLetters = ['R', 'S', 'T', 'U', 'V', 'W', 'X'];
    for (let v = 0; v < 7; v++) {
        for (let i = 1; i <= 5; i++) {
            const code = `${vocabLetters[v]}.${i}`;
            const prevCode = i === 1 ? (v === 0 ? 'Q.5' : `${vocabLetters[v - 1]}.5`) : `${vocabLetters[v]}.${i - 1}`;
            const nextCode = i < 5 ? `${vocabLetters[v]}.${i + 1}` : (v < 6 ? `${vocabLetters[v + 1]}.1` : '');

            skills.push(await prisma.microSkill.create({
                data: {
                    code,
                    name: `Vocabulary Theme ${v + 1} - Set ${i}`,
                    domainId: domains[11].id,
                    gameTemplate: GameTemplate.PICTURE_TO_WORD,
                    prerequisiteSkills: JSON.parse(`["${prevCode}"]`),
                    nextSkills: nextCode ? JSON.parse(`["${nextCode}"]`) : JSON.parse('[]'),
                    masteryCriteria: JSON.parse('{"accuracyThreshold":75,"timeThreshold":6,"confusionErrorThreshold":25}'),
                },
            }));
        }
    }

    console.log(`  ✅ Micro Skills: ${skills.length} created\n`);

    // ============================================
    // 4. CREATE SAMPLE QUESTIONS (10-20 per skill for first 5 skills)
    // ============================================
    console.log('❓ Creating sample questions for first 5 skills...');

    let questionCount = 0;
    for (let s = 0; s < 5 && s < skills.length; s++) {
        const skill = skills[s];
        const questionsPerSkill = 15;

        for (let q = 0; q < questionsPerSkill; q++) {
            const difficulty = q < 5 ? 1 : (q < 10 ? 2 : 3);
            const distractorCount = difficulty === 1 ? 2 : (difficulty === 2 ? 3 : 4);

            await prisma.question.create({
                data: {
                    microSkillId: skill.id,
                    difficultyLevel: difficulty,
                    promptText: `Question ${q + 1} for ${skill.name}`,
                    promptAudioUrl: `/assets/audio/${skill.code}_q${q + 1}.mp3`,
                    correctAnswer: `Answer${q + 1}`,
                    distractors: JSON.parse(`["Dist1","Dist2"${distractorCount > 2 ? ',"Dist3"' : ''}${distractorCount > 3 ? ',"Dist4"' : ''}]`),
                    hasConfusingDistractors: difficulty === 3,
                    assetUrls: JSON.parse(`{"options":["/assets/images/${skill.code}_${q + 1}.png"]}`),
                },
            });
            questionCount++;
        }
    }
    console.log(`  ✅ Questions: ${questionCount} created\n`);

    // ============================================
    // SUMMARY
    // ============================================
    console.log('📋 SEED SUMMARY');
    console.log('=====================================');
    console.log('Users:');
    console.log('  - 1 Admin (admin@literacy.com / admin123)');
    console.log('  - 2 Teachers (password: teacher123)');
    console.log('  - 8 Students (password: student123)');
    console.log('');
    console.log('Content:');
    console.log('  - 12 Skill Domains');
    console.log(`  - ${skills.length} Micro Skills`);
    console.log(`  - ${questionCount} Sample Questions`);
    console.log('');
    console.log('Skill Breakdown:');
    console.log('  - A: Letter Identification (6 skills)');
    console.log('  - B: Lowercase/Uppercase Matching (8 skills)');
    console.log('  - C: Word Recognition (3 skills)');
    console.log('  - D: Rhyming (3 skills)');
    console.log('  - E: Blending & Segmenting (4 skills)');
    console.log('  - F: Beginning/Ending Sounds (3 skills)');
    console.log('  - G: Letter-Sound Uppercase (4 skills)');
    console.log('  - H: Letter-Sound Lowercase (5 skills)');
    console.log('  - I-M: Short Vowels CVC (20 skills)');
    console.log('  - N: Sight Words (15 skills)');
    console.log('  - O-Q: Reading Strategies (15 skills)');
    console.log('  - R-X: Vocabulary (35 skills)');
    console.log('=====================================\n');
    console.log('✨ Database seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
