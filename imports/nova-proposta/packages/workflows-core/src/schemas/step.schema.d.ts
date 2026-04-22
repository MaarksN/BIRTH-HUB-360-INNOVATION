import { z } from "zod";
export declare const stepSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    config: z.ZodObject<{
        method: z.ZodDefault<z.ZodEnum<{
            POST: "POST";
        }>>;
        path: z.ZodString;
    }, z.core.$strict>;
    isTrigger: z.ZodDefault<z.ZodLiteral<true>>;
    key: z.ZodString;
    name: z.ZodString;
    type: z.ZodLiteral<"TRIGGER_WEBHOOK">;
}, z.core.$strict>, z.ZodObject<{
    config: z.ZodObject<{
        cron: z.ZodString;
        timezone: z.ZodDefault<z.ZodString>;
    }, z.core.$strict>;
    isTrigger: z.ZodDefault<z.ZodLiteral<true>>;
    key: z.ZodString;
    name: z.ZodString;
    type: z.ZodLiteral<"TRIGGER_CRON">;
}, z.core.$strict>, z.ZodObject<{
    config: z.ZodObject<{
        topic: z.ZodString;
    }, z.core.$strict>;
    isTrigger: z.ZodDefault<z.ZodLiteral<true>>;
    key: z.ZodString;
    name: z.ZodString;
    type: z.ZodLiteral<"TRIGGER_EVENT">;
}, z.core.$strict>, z.ZodObject<{
    config: z.ZodObject<{
        duration_ms: z.ZodNumber;
    }, z.core.$strict>;
    key: z.ZodString;
    name: z.ZodString;
    type: z.ZodLiteral<"DELAY">;
}, z.core.$strict>, z.ZodObject<{
    config: z.ZodObject<{
        auth: z.ZodOptional<z.ZodObject<{
            bearer: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>>;
        body: z.ZodOptional<z.ZodUnknown>;
        headers: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
        method: z.ZodDefault<z.ZodEnum<{
            GET: "GET";
            PATCH: "PATCH";
            POST: "POST";
            DELETE: "DELETE";
            PUT: "PUT";
        }>>;
        timeout_ms: z.ZodDefault<z.ZodNumber>;
        url: z.ZodString;
        webhookSecret: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>;
    key: z.ZodString;
    name: z.ZodString;
    type: z.ZodLiteral<"HTTP_REQUEST">;
}, z.core.$strict>, z.ZodObject<{
    config: z.ZodObject<{
        operator: z.ZodEnum<{
            "!=": "!=";
            "<": "<";
            "<=": "<=";
            "==": "==";
            ">": ">";
            ">=": ">=";
        }>;
        path: z.ZodString;
        value: z.ZodUnion<readonly [z.ZodBoolean, z.ZodNumber, z.ZodString]>;
    }, z.core.$strict>;
    key: z.ZodString;
    name: z.ZodString;
    type: z.ZodLiteral<"CONDITION">;
}, z.core.$strict>, z.ZodObject<{
    config: z.ZodObject<{
        timeout_ms: z.ZodDefault<z.ZodNumber>;
        source: z.ZodString;
    }, z.core.$strict>;
    key: z.ZodString;
    name: z.ZodString;
    type: z.ZodLiteral<"CODE">;
}, z.core.$strict>, z.ZodObject<{
    config: z.ZodObject<{
        filter: z.ZodOptional<z.ZodString>;
        map: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        reduce: z.ZodOptional<z.ZodString>;
        sourcePath: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>;
    key: z.ZodString;
    name: z.ZodString;
    type: z.ZodLiteral<"TRANSFORMER">;
}, z.core.$strict>, z.ZodObject<{
    config: z.ZodObject<{
        channel: z.ZodEnum<{
            email: "email";
            inapp: "inapp";
        }>;
        message: z.ZodString;
        batchKey: z.ZodOptional<z.ZodString>;
        batchWindowMs: z.ZodDefault<z.ZodNumber>;
        to: z.ZodString;
    }, z.core.$strict>;
    key: z.ZodString;
    name: z.ZodString;
    type: z.ZodLiteral<"SEND_NOTIFICATION">;
}, z.core.$strict>, z.ZodObject<{
    config: z.ZodObject<{
        agentId: z.ZodString;
        input: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        onError: z.ZodDefault<z.ZodEnum<{
            stop: "stop";
            continue: "continue";
        }>>;
    }, z.core.$strict>;
    key: z.ZodString;
    name: z.ZodString;
    type: z.ZodLiteral<"AGENT_EXECUTE">;
}, z.core.$strict>, z.ZodObject<{
    config: z.ZodObject<{
        context: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        correlationId: z.ZodOptional<z.ZodString>;
        sourceAgentId: z.ZodString;
        summary: z.ZodString;
        targetAgentId: z.ZodString;
        threadId: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>;
    key: z.ZodString;
    name: z.ZodString;
    type: z.ZodLiteral<"AGENT_HANDOFF">;
}, z.core.$strict>, z.ZodObject<{
    config: z.ZodObject<{
        connectorAccountId: z.ZodOptional<z.ZodString>;
        objectType: z.ZodEnum<{
            company: "company";
            contact: "contact";
            deal: "deal";
        }>;
        operation: z.ZodDefault<z.ZodEnum<{
            upsert: "upsert";
        }>>;
        payload: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        provider: z.ZodDefault<z.ZodEnum<{
            hubspot: "hubspot";
            salesforce: "salesforce";
            pipedrive: "pipedrive";
        }>>;
        scope: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>;
    key: z.ZodString;
    name: z.ZodString;
    type: z.ZodLiteral<"CRM_UPSERT">;
}, z.core.$strict>, z.ZodObject<{
    config: z.ZodObject<{
        connectorAccountId: z.ZodOptional<z.ZodString>;
        message: z.ZodString;
        template: z.ZodOptional<z.ZodString>;
        threadId: z.ZodOptional<z.ZodString>;
        to: z.ZodString;
    }, z.core.$strict>;
    key: z.ZodString;
    name: z.ZodString;
    type: z.ZodLiteral<"WHATSAPP_SEND">;
}, z.core.$strict>, z.ZodObject<{
    config: z.ZodObject<{
        attendees: z.ZodDefault<z.ZodArray<z.ZodString>>;
        calendarId: z.ZodOptional<z.ZodString>;
        connectorAccountId: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        end: z.ZodString;
        start: z.ZodString;
        title: z.ZodString;
    }, z.core.$strict>;
    key: z.ZodString;
    name: z.ZodString;
    type: z.ZodLiteral<"GOOGLE_EVENT">;
}, z.core.$strict>, z.ZodObject<{
    config: z.ZodObject<{
        attendees: z.ZodDefault<z.ZodArray<z.ZodString>>;
        calendarId: z.ZodOptional<z.ZodString>;
        connectorAccountId: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        end: z.ZodString;
        start: z.ZodString;
        title: z.ZodString;
    }, z.core.$strict>;
    key: z.ZodString;
    name: z.ZodString;
    type: z.ZodLiteral<"MS_EVENT">;
}, z.core.$strict>, z.ZodObject<{
    config: z.ZodObject<{
        fields: z.ZodArray<z.ZodString>;
        text: z.ZodString;
    }, z.core.$strict>;
    key: z.ZodString;
    name: z.ZodString;
    type: z.ZodLiteral<"AI_TEXT_EXTRACT">;
}, z.core.$strict>], "type">;
export declare const workflowCanvasSchema: z.ZodObject<{
    steps: z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        config: z.ZodObject<{
            method: z.ZodDefault<z.ZodEnum<{
                POST: "POST";
            }>>;
            path: z.ZodString;
        }, z.core.$strict>;
        isTrigger: z.ZodDefault<z.ZodLiteral<true>>;
        key: z.ZodString;
        name: z.ZodString;
        type: z.ZodLiteral<"TRIGGER_WEBHOOK">;
    }, z.core.$strict>, z.ZodObject<{
        config: z.ZodObject<{
            cron: z.ZodString;
            timezone: z.ZodDefault<z.ZodString>;
        }, z.core.$strict>;
        isTrigger: z.ZodDefault<z.ZodLiteral<true>>;
        key: z.ZodString;
        name: z.ZodString;
        type: z.ZodLiteral<"TRIGGER_CRON">;
    }, z.core.$strict>, z.ZodObject<{
        config: z.ZodObject<{
            topic: z.ZodString;
        }, z.core.$strict>;
        isTrigger: z.ZodDefault<z.ZodLiteral<true>>;
        key: z.ZodString;
        name: z.ZodString;
        type: z.ZodLiteral<"TRIGGER_EVENT">;
    }, z.core.$strict>, z.ZodObject<{
        config: z.ZodObject<{
            duration_ms: z.ZodNumber;
        }, z.core.$strict>;
        key: z.ZodString;
        name: z.ZodString;
        type: z.ZodLiteral<"DELAY">;
    }, z.core.$strict>, z.ZodObject<{
        config: z.ZodObject<{
            auth: z.ZodOptional<z.ZodObject<{
                bearer: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>>;
            body: z.ZodOptional<z.ZodUnknown>;
            headers: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
            method: z.ZodDefault<z.ZodEnum<{
                GET: "GET";
                PATCH: "PATCH";
                POST: "POST";
                DELETE: "DELETE";
                PUT: "PUT";
            }>>;
            timeout_ms: z.ZodDefault<z.ZodNumber>;
            url: z.ZodString;
            webhookSecret: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>;
        key: z.ZodString;
        name: z.ZodString;
        type: z.ZodLiteral<"HTTP_REQUEST">;
    }, z.core.$strict>, z.ZodObject<{
        config: z.ZodObject<{
            operator: z.ZodEnum<{
                "!=": "!=";
                "<": "<";
                "<=": "<=";
                "==": "==";
                ">": ">";
                ">=": ">=";
            }>;
            path: z.ZodString;
            value: z.ZodUnion<readonly [z.ZodBoolean, z.ZodNumber, z.ZodString]>;
        }, z.core.$strict>;
        key: z.ZodString;
        name: z.ZodString;
        type: z.ZodLiteral<"CONDITION">;
    }, z.core.$strict>, z.ZodObject<{
        config: z.ZodObject<{
            timeout_ms: z.ZodDefault<z.ZodNumber>;
            source: z.ZodString;
        }, z.core.$strict>;
        key: z.ZodString;
        name: z.ZodString;
        type: z.ZodLiteral<"CODE">;
    }, z.core.$strict>, z.ZodObject<{
        config: z.ZodObject<{
            filter: z.ZodOptional<z.ZodString>;
            map: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            reduce: z.ZodOptional<z.ZodString>;
            sourcePath: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>;
        key: z.ZodString;
        name: z.ZodString;
        type: z.ZodLiteral<"TRANSFORMER">;
    }, z.core.$strict>, z.ZodObject<{
        config: z.ZodObject<{
            channel: z.ZodEnum<{
                email: "email";
                inapp: "inapp";
            }>;
            message: z.ZodString;
            batchKey: z.ZodOptional<z.ZodString>;
            batchWindowMs: z.ZodDefault<z.ZodNumber>;
            to: z.ZodString;
        }, z.core.$strict>;
        key: z.ZodString;
        name: z.ZodString;
        type: z.ZodLiteral<"SEND_NOTIFICATION">;
    }, z.core.$strict>, z.ZodObject<{
        config: z.ZodObject<{
            agentId: z.ZodString;
            input: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            onError: z.ZodDefault<z.ZodEnum<{
                stop: "stop";
                continue: "continue";
            }>>;
        }, z.core.$strict>;
        key: z.ZodString;
        name: z.ZodString;
        type: z.ZodLiteral<"AGENT_EXECUTE">;
    }, z.core.$strict>, z.ZodObject<{
        config: z.ZodObject<{
            context: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            correlationId: z.ZodOptional<z.ZodString>;
            sourceAgentId: z.ZodString;
            summary: z.ZodString;
            targetAgentId: z.ZodString;
            threadId: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>;
        key: z.ZodString;
        name: z.ZodString;
        type: z.ZodLiteral<"AGENT_HANDOFF">;
    }, z.core.$strict>, z.ZodObject<{
        config: z.ZodObject<{
            connectorAccountId: z.ZodOptional<z.ZodString>;
            objectType: z.ZodEnum<{
                company: "company";
                contact: "contact";
                deal: "deal";
            }>;
            operation: z.ZodDefault<z.ZodEnum<{
                upsert: "upsert";
            }>>;
            payload: z.ZodRecord<z.ZodString, z.ZodUnknown>;
            provider: z.ZodDefault<z.ZodEnum<{
                hubspot: "hubspot";
                salesforce: "salesforce";
                pipedrive: "pipedrive";
            }>>;
            scope: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>;
        key: z.ZodString;
        name: z.ZodString;
        type: z.ZodLiteral<"CRM_UPSERT">;
    }, z.core.$strict>, z.ZodObject<{
        config: z.ZodObject<{
            connectorAccountId: z.ZodOptional<z.ZodString>;
            message: z.ZodString;
            template: z.ZodOptional<z.ZodString>;
            threadId: z.ZodOptional<z.ZodString>;
            to: z.ZodString;
        }, z.core.$strict>;
        key: z.ZodString;
        name: z.ZodString;
        type: z.ZodLiteral<"WHATSAPP_SEND">;
    }, z.core.$strict>, z.ZodObject<{
        config: z.ZodObject<{
            attendees: z.ZodDefault<z.ZodArray<z.ZodString>>;
            calendarId: z.ZodOptional<z.ZodString>;
            connectorAccountId: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
            end: z.ZodString;
            start: z.ZodString;
            title: z.ZodString;
        }, z.core.$strict>;
        key: z.ZodString;
        name: z.ZodString;
        type: z.ZodLiteral<"GOOGLE_EVENT">;
    }, z.core.$strict>, z.ZodObject<{
        config: z.ZodObject<{
            attendees: z.ZodDefault<z.ZodArray<z.ZodString>>;
            calendarId: z.ZodOptional<z.ZodString>;
            connectorAccountId: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
            end: z.ZodString;
            start: z.ZodString;
            title: z.ZodString;
        }, z.core.$strict>;
        key: z.ZodString;
        name: z.ZodString;
        type: z.ZodLiteral<"MS_EVENT">;
    }, z.core.$strict>, z.ZodObject<{
        config: z.ZodObject<{
            fields: z.ZodArray<z.ZodString>;
            text: z.ZodString;
        }, z.core.$strict>;
        key: z.ZodString;
        name: z.ZodString;
        type: z.ZodLiteral<"AI_TEXT_EXTRACT">;
    }, z.core.$strict>], "type">>;
    transitions: z.ZodDefault<z.ZodArray<z.ZodObject<{
        route: z.ZodDefault<z.ZodEnum<{
            ALWAYS: "ALWAYS";
            IF_TRUE: "IF_TRUE";
            IF_FALSE: "IF_FALSE";
            ON_SUCCESS: "ON_SUCCESS";
            ON_FAILURE: "ON_FAILURE";
            FALLBACK: "FALLBACK";
        }>>;
        source: z.ZodString;
        target: z.ZodString;
    }, z.core.$strict>>>;
}, z.core.$strict>;
export type StepDefinition = z.infer<typeof stepSchema>;
export type WorkflowCanvas = z.infer<typeof workflowCanvasSchema>;
