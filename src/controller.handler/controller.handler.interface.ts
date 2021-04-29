export interface IControllerHandler {

    loadValues(): Promise<any>;

    handleAgentId(): string;
}