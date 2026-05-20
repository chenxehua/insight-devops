// 通用工具单元测试
import { describe, it, expect } from 'vitest';
import { parsePagination, paginate, success, error, formatDate, generateUUID, formatFileSize, removeEmpty, deepClone } from '../../app/lib/utils/common';
describe('通用工具测试', () => {
    describe('parsePagination', () => {
        it('应该正确解析分页参数', () => {
            const result = parsePagination({ page: '2', pageSize: '20' });
            expect(result.page).toBe(2);
            expect(result.pageSize).toBe(20);
        });
        it('应该使用默认值', () => {
            const result = parsePagination({});
            expect(result.page).toBe(1);
            expect(result.pageSize).toBe(20);
        });
        it('应该限制最大页大小', () => {
            const result = parsePagination({ pageSize: '200' });
            expect(result.pageSize).toBe(100);
        });
        it('应该限制最小页码', () => {
            const result = parsePagination({ page: '-1' });
            expect(result.page).toBe(1);
        });
    });
    describe('paginate', () => {
        it('应该正确计算分页结果', () => {
            const data = [{ id: 1 }, { id: 2 }];
            const result = paginate(data, 100, { page: 2, pageSize: 20 });
            expect(result.list).toEqual(data);
            expect(result.total).toBe(100);
            expect(result.page).toBe(2);
            expect(result.pageSize).toBe(20);
            expect(result.totalPages).toBe(5);
        });
    });
    describe('success & error', () => {
        it('应该生成成功响应', () => {
            const result = success({ id: 1 }, '操作成功');
            expect(result.code).toBe(200);
            expect(result.message).toBe('操作成功');
            expect(result.data).toEqual({ id: 1 });
        });
        it('应该生成错误响应', () => {
            const result = error(404, '资源不存在');
            expect(result.code).toBe(404);
            expect(result.message).toBe('资源不存在');
        });
    });
    describe('formatDate', () => {
        it('应该正确格式化日期', () => {
            const date = new Date('2024-01-15T10:30:45');
            const result = formatDate(date, 'YYYY-MM-DD HH:mm:ss');
            expect(result).toBe('2024-01-15 10:30:45');
        });
        it('应该处理字符串日期', () => {
            const result = formatDate('2024-01-15T10:30:45', 'YYYY-MM-DD');
            expect(result).toBe('2024-01-15');
        });
    });
    describe('generateUUID', () => {
        it('应该生成有效的UUID', () => {
            const uuid = generateUUID();
            expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        });
        it('每次应该生成不同的UUID', () => {
            const uuid1 = generateUUID();
            const uuid2 = generateUUID();
            expect(uuid1).not.toBe(uuid2);
        });
    });
    describe('formatFileSize', () => {
        it('应该正确格式化文件大小', () => {
            expect(formatFileSize(0)).toBe('0 B');
            expect(formatFileSize(1024)).toBe('1.00 KB');
            expect(formatFileSize(1048576)).toBe('1.00 MB');
            expect(formatFileSize(1073741824)).toBe('1.00 GB');
        });
    });
    describe('removeEmpty', () => {
        it('应该移除空值', () => {
            const obj = { a: 1, b: null, c: undefined, d: '' };
            const result = removeEmpty(obj);
            expect(result).toEqual({ a: 1 });
        });
        it('应该保留有意义的值', () => {
            const obj = { a: 0, b: false, c: '' };
            const result = removeEmpty(obj);
            expect(result).toEqual({ a: 0 });
        });
    });
    describe('deepClone', () => {
        it('应该深拷贝对象', () => {
            const obj = { a: 1, b: { c: 2 } };
            const clone = deepClone(obj);
            expect(clone).toEqual(obj);
            expect(clone).not.toBe(obj);
            expect(clone.b).not.toBe(obj.b);
        });
    });
});
//# sourceMappingURL=common.test.js.map