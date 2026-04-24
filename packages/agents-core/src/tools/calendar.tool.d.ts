export type CalendarProvider = "google" | "ics";
export type CalendarAction = "create_event" | "list_events";
export interface CalendarInput {
    action: CalendarAction;
    endAt?: string;
    provider: CalendarProvider;
    startAt?: string;
    summary?: string;
}
export interface CalendarResult {
    action: CalendarAction;
    eventId: string;
    provider: CalendarProvider;
    raw: string;
}
export declare function callCalendarTool(input: CalendarInput, options?: {
    simulate?: boolean;
}): Promise<CalendarResult>;
