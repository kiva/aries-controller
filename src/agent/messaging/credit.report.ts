/**
 *
 */
export class CreditReport<T> {
    /**
     * always "credit_report", used by basicmessage handlers to identity the message type
     */
    public readonly messageTypeId: string = 'credit_report';
    /**
     * started, completed, rejected
     */
    public readonly state: string;
    /**
     * unique Id for the message, assigned by FSP
     */
    public readonly id: string;
    /**
     * TDC assigned Id for the TRO, public to the FSP
     */
    public readonly tdcTroId: string;
    /**
     * TDC assigned Id for the Fsp, public to the TRO
     */
    public readonly tdcFspId: string;
    /**
     * When state is completed, contains the credit report
     * report data is unique to use case
     */
    public readonly report: T[];

    constructor(data?: Partial<CreditReport<T>>) {
        Object.assign(this, data);
    }
}
