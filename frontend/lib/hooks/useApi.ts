import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '../api-client';

// Query keys
export const queryKeys = {
    skills: ['skills'] as const,
    skillQuestions: (skillId: string, difficulty?: number) =>
        ['skills', skillId, 'questions', difficulty] as const,
    childProgress: (childId: string) => ['child', childId, 'progress'] as const,
    teacherStudents: (teacherId: string) =>
        ['teacher', teacherId, 'students'] as const,
};

// Skills hooks
export function useSkills() {
    return useQuery({
        queryKey: queryKeys.skills,
        queryFn: async () => {
            const data = await ApiClient.getAllSkills();
            return data;
        },
    });
}

export function useSkillQuestions(skillId: string, difficulty?: number) {
    return useQuery({
        queryKey: queryKeys.skillQuestions(skillId, difficulty),
        queryFn: async () => {
            const data = await ApiClient.getSkillQuestions(skillId, difficulty);
            return data;
        },
        enabled: !!skillId,
    });
}

// Child hooks
export function useChildProgress(childId: string) {
    return useQuery({
        queryKey: queryKeys.childProgress(childId),
        queryFn: async () => {
            const data = await ApiClient.getChildProgress(childId);
            return data;
        },
        enabled: !!childId,
    });
}

// Teacher hooks
export function useTeacherStudents(teacherId: string) {
    return useQuery({
        queryKey: queryKeys.teacherStudents(teacherId),
        queryFn: async () => {
            const data = await ApiClient.getTeacherStudents(teacherId);
            return data;
        },
        enabled: !!teacherId,
    });
}

// Attempt mutation
export function useLogAttempt() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (attemptData: Parameters<typeof ApiClient.logAttempt>[0]) => {
            const data = await ApiClient.logAttempt(attemptData);
            return data;
        },
        onSuccess: (data, variables) => {
            // Invalidate child progress to refetch updated data
            queryClient.invalidateQueries({
                queryKey: queryKeys.childProgress(variables.childId),
            });
        },
    });
}
