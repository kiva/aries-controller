
export class VerificationItem {
    /**
     * Transaction id assigned by TDC when the transaction is created
     */
    public readonly id: string;
    /**
     * hash of the previous transaction. when this is the first transaction,
     * it is empty
     */
    public readonly previousHash: string;
    /**
     * hash of transaction as computed during the create transaction processing
     */
    public readonly hash: string;
    /**
     * verifiable hash of this VerificationItem
     */
    public readonly reHash: string;
}
