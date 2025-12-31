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
export declare function getAdminStats(): Promise<AdminStats>;
export declare function createDomain(data: {
    name: string;
    code: string;
    description: string;
}): Promise<{
    microSkills: {
        name: string;
        id: string;
        code: string;
    }[];
} & {
    name: string;
    id: string;
    createdAt: Date;
    description: string | null;
    updatedAt: Date;
    code: string;
    order: number;
}>;
//# sourceMappingURL=admin-service.d.ts.map