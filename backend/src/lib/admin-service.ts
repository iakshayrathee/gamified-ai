import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AdminStats {
    totalUsers: number;
    usersByRole: {
        children: number;
        educators: number;
        parents: number;
        schoolViewers: number;
        centerHeads: number;
        admins: number;
    };
    totalDomains: number;
    totalSkills: number;
    totalQuestions: number;
    questionsByStatus: {
        approved: number;
        pending: number;
        rejected: number;
    };
    recentUploads: Array<{
        id: string;
        fileName: string;
        uploadedAt: Date;
        status: string;
        extractedQuestions: number;
    }>;
}

export async function getAdminStats(): Promise<AdminStats> {
    try {
        // Get total users count
        const totalUsers = await prisma.user.count();

        // Get users by role (only CHILD, TEACHER, ADMIN exist in schema)
        const children = await prisma.user.count({ where: { role: 'CHILD' } });
        const educators = await prisma.user.count({ where: { role: 'TEACHER' } });
        const admins = await prisma.user.count({ where: { role: 'ADMIN' } });

        // Get domain and skill counts
        const totalDomains = await prisma.skillDomain.count();
        const totalSkills = await prisma.microSkill.count();

        // Get question counts
        const totalQuestions = await prisma.question.count();

        // Get questions by review status
        const approved = await prisma.extractedQuestion.count({
            where: { reviewStatus: 'APPROVED' }
        });
        const pending = await prisma.extractedQuestion.count({
            where: { reviewStatus: 'PENDING' }
        });
        const rejected = await prisma.extractedQuestion.count({
            where: { reviewStatus: 'REJECTED' }
        });

        // Get recent uploads (last 5)
        const recentDocuments = await prisma.uploadedDocument.findMany({
            take: 5,
            orderBy: { uploadedAt: 'desc' },
            select: {
                id: true,
                fileName: true,
                uploadedAt: true,
                status: true,
                extractedQuestions: true
            }
        });

        const recentUploads = recentDocuments.map(doc => ({
            id: doc.id,
            fileName: doc.fileName,
            uploadedAt: doc.uploadedAt,
            status: doc.status,
            extractedQuestions: doc.extractedQuestions
        }));

        return {
            totalUsers,
            usersByRole: {
                children,
                educators,
                parents: 0, // Not in current schema
                schoolViewers: 0, // Not in current schema
                centerHeads: 0, // Not in current schema
                admins
            },
            totalDomains,
            totalSkills,
            totalQuestions,
            questionsByStatus: {
                approved,
                pending,
                rejected
            },
            recentUploads
        };
    } catch (error) {
        console.error('Error getting admin stats:', error);
        throw error;
    }
}

export async function createDomain(data: {
    name: string;
    code: string;
    description: string;
}) {
    try {
        // Check if domain with same code already exists
        const existing = await prisma.skillDomain.findUnique({
            where: { code: data.code }
        });

        if (existing) {
            throw new Error('Domain with this code already exists');
        }

        // Get the highest order number and add 1
        const highestOrder = await prisma.skillDomain.findFirst({
            orderBy: { order: 'desc' },
            select: { order: true }
        });

        const nextOrder = (highestOrder?.order ?? -1) + 1;

        const domain = await prisma.skillDomain.create({
            data: {
                name: data.name,
                code: data.code,
                description: data.description,
                order: nextOrder
            },
            include: {
                microSkills: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                }
            }
        });

        return domain;
    } catch (error) {
        console.error('Error creating domain:', error);
        throw error;
    }
}
