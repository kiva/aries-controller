import { VerificationItem } from './verification.item';

/**
 *  Used between TDC and TRO to build a report (such as a credit report) The report is requested from FSP (FSP
 *  sends a different message) and the TDC/TRO build the report which is then returned to the FSP.
 */
export class TransactionReportRequest<T> {
    /**
     * always "transaction_request", used by basicmessage handlers to identity the message type
     */
    public readonly messageTypeId: string = 'transaction_request';
    /**
     * started, completed
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
     * actual transaction data. transaction format is unique to use case and would most likely
     * match a given credential.
     *
     * When state is completed, will contain array of transactions.  Empty on any other state
     */
    public readonly transactions: T[];
    /**
     * ordered array of all transactions including the report
     * it should match transactions.  Computed by the TDC and is proof
     * transactions is valid
     *
     * When state is completed, will contain array of verifications of excluded items.
     * Empty on any other state
     */
    public readonly included: VerificationItem[];
    /**
     * ordered array of all transactions excluded in the report but
     * are needed to create the completeness checks. Computed by TDC.
     * examples are: transactions that 'expired'
     *
     * When state is completed, will contain array of verifications of excluded items.
     * Empty on any other state
     */
    public readonly excluded: VerificationItem[];

    constructor(data?: Partial<TransactionReportRequest<T>>) {
        Object.assign(this, data);
    }
}
