/**
 * Topics are strings that match acapy webhook values for topic parameters
 * These values must match what comes from acapy
 */
export class Topics {
    public static BASIC_MESSAGES = 'basicmessages';
    public static CONNECTIONS = 'connections';
    public static ISSUE_CREDENTIAL = 'issue_credential';
    public static ISSUE_CRED_REV = 'issuer_cred_rev';
    public static PRESENT_PROOF = 'present_proof';
    public static PROBLEM_REPORT = 'problem_report';
    public static REVOCATION_REGISTRY = 'revocation_registry';
}
