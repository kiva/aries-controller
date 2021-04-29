export declare const CALLER = 'CALLER';

export interface ICaller {

    spinUpAgent(): Promise<any>;

    callAgent(method: any, route: string, params?: any, data?: any): Promise<any>;
}
