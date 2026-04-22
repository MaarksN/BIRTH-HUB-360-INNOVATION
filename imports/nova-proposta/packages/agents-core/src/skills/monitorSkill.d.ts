import { z } from "zod";
export declare const monitorInputSchema: z.ZodObject<{
    kpiName: z.ZodString;
    points: z.ZodArray<z.ZodObject<{
        timestamp: z.ZodString;
        value: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const monitorOutputSchema: z.ZodObject<{
    anomalies: z.ZodArray<z.ZodObject<{
        severity: z.ZodEnum<{
            high: "high";
            low: "low";
            medium: "medium";
        }>;
        timestamp: z.ZodString;
        value: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type MonitorInput = z.infer<typeof monitorInputSchema>;
export type MonitorOutput = z.infer<typeof monitorOutputSchema>;
export declare function runMonitorSkill(input: MonitorInput): Promise<MonitorOutput>;
export declare const monitorSkillTemplate: {
    id: string;
    inputSchema: z.ZodObject<{
        kpiName: z.ZodString;
        points: z.ZodArray<z.ZodObject<{
            timestamp: z.ZodString;
            value: z.ZodNumber;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    outputSchema: z.ZodObject<{
        anomalies: z.ZodArray<z.ZodObject<{
            severity: z.ZodEnum<{
                high: "high";
                low: "low";
                medium: "medium";
            }>;
            timestamp: z.ZodString;
            value: z.ZodNumber;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    run: typeof runMonitorSkill;
};
