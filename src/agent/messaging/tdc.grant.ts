
/**
 * For TDC Grant basic messaging between TRO and FSP
 */
export class TdcGrant {
    /**
     * always "grant", used by basicmessage handlers to identity the message type
     */
    public readonly messageTypeId: string = 'grant';
    /**
     * started, completed, accepted, rejected
     */
    public readonly state: string;
    /**
     * unique Id for the message, assigned by TDC
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

    constructor(data?: Partial<TdcGrant>) {
        Object.assign(this, data);
    }
}
