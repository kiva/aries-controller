
export class ImplementationModule {

    static register(modulePath: string, moduleName: string): Promise<any> {
        if (!modulePath || !moduleName) {
            return null;
        }
        const moduleClass = require(modulePath);
        const module = moduleClass[moduleName];
        return module;
    }
}
