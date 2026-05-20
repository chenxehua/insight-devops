import request from 'supertest';
import app from '../../app/server';
// 创建 supertest agent
export const agent = request(app);
// 认证 token
let authToken;
// 获取认证 token
export async function getAuthToken() {
    if (authToken)
        return authToken;
    const response = await agent
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'admin123' })
        .expect(200);
    authToken = response.body.data.token;
    return authToken;
}
// 清除认证 token
export function clearAuthToken() {
    authToken = '';
}
// 辅助函数：创建认证头部
export function authHeaders() {
    return {
        Authorization: `Bearer ${authToken}`,
    };
}
// 辅助函数：带认证的请求
export async function authenticatedRequest() {
    const token = await getAuthToken();
    return request(app).set('Authorization', `Bearer ${token}`);
}
export default { agent, getAuthToken, clearAuthToken, authHeaders, authenticatedRequest };
//# sourceMappingURL=helpers.js.map