import request, { SuperTest, Test } from 'supertest';
export declare const agent: SuperTest<Test>;
export declare function getAuthToken(): Promise<string>;
export declare function clearAuthToken(): void;
export declare function authHeaders(): {
    Authorization: string;
};
export declare function authenticatedRequest(): Promise<import("supertest/lib/agent")<request.SuperTestStatic.Test>>;
declare const _default: {
    agent: request.SuperTest<Test>;
    getAuthToken: typeof getAuthToken;
    clearAuthToken: typeof clearAuthToken;
    authHeaders: typeof authHeaders;
    authenticatedRequest: typeof authenticatedRequest;
};
export default _default;
//# sourceMappingURL=helpers.d.ts.map