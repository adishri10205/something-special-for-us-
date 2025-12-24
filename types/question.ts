export interface Question {
    id: string;
    question: string;
    askedBy: string;
    askedByName: string;
    askedAt: string;
    answer?: string;
    answeredBy?: string;
    answeredByName?: string;
    answeredAt?: string;
    status: 'unanswered' | 'answered';
}
