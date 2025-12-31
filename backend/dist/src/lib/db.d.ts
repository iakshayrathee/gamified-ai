import { PrismaClient } from '@prisma/client';
declare const getPrismaClient: () => PrismaClient<{
    log: ("info" | "query" | "warn" | "error")[];
}, "info" | "query" | "warn" | "error", import("@prisma/client/runtime/client").DefaultArgs>;
export default getPrismaClient;
//# sourceMappingURL=db.d.ts.map