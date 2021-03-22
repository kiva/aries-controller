/**
 *  Used between TDC and TRO to build a credit report when requested from FSP (FSP
 *  sends a different message).
 */
export class TransactionRequest<T> {
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
     * When state is completed, will contain array of transactions
     * transaction format is unique to use case
     */
    public readonly transactions: Array<T>;
}
