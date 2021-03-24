/**
 * Topics are strings that match acapy webhook values for topic parameters
 * These values must match what comes from acapy
 */
export class Topics {
    public static BASIC_MESSAGES: string = 'basicmessages';
    public static CONNECTIONS: string = 'connections';
    public static ISSUE_CREDENTIAL: string = 'issue_credential';
    public static ISSUE_CRED_REV: string = 'issuer_cred_rev';
    public static PRESENT_PROOF: string = 'present_proof';
    public static PROBLEM_REPORT: string = 'problem_report';
    public static REVOCATION_REGISTRY: string = 'revocation_registry';
}
