/**
 * Sent by TDC to the TRO for the TRO record verification handlers.  The TRO should already
 * have this data in the form of a credential.
 */
export class CreditTransaction<T> {
    /**
     * always "credit_transaction", used by basicmessage handlers to identity the message type
     */
    public readonly messageTypeId: string = 'credit_transaction';
    /**
     * started, completed, accepted, rejected
     */
    public readonly state: string;
    /**
     * unique Id for the message, assigned by TDC
     */
    public readonly id: string;
    /**
     * id of the credential used to put the transaction on the ledger
     */
    public readonly credentialId: string;
    /**
     * transaction data, specific to use case
     */
    public readonly transaction: T;

    constructor(data?: Partial<CreditTransaction<T>>) {
        Object.assign(this, data);
    }
}
