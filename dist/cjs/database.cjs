"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBClient = exports.DatabaseError = void 0;
const sqlite_1 = require("sqlite");
const sqlite3_1 = __importDefault(require("sqlite3"));
const uuid_1 = require("uuid");
/**
 * DatabaseError 类用于表示数据库操作中发生的错误。
 *
 * 该类继承自 Error 类，用于自定义数据库错误，以便在应用程序中更准确地处理和区分不同类型的错误。
 *
 * 核心功能：
 * - 自定义错误类型：通过继承 Error 类并设置错误名称为 'DatabaseError'，使得错误类型更加明确。
 *
 * 使用示例：
 *
 * 构造函数参数：
 * - message: string，表示错误的具体信息。
 *
 * 特殊使用限制或潜在的副作用：
 * - 无特殊使用限制或潜在的副作用。
 */
class DatabaseError extends Error {
    constructor(message) {
        super(message);
        this.name = 'DatabaseError';
    }
}
exports.DatabaseError = DatabaseError;
/**
 * DBClient 类用于管理和操作 SQLite 数据库。
 *
 * 该类提供了连接数据库、创建表、查询、插入、更新和删除数据的功能。
 *
 * 核心功能包括：
 * - 连接到数据库 (`connect`)
 * - 创建表 (`createTable`)
 * - 查询数据 (`find`, `findOne`)
 * - 插入数据 (`create`)
 * - 更新数据 (`update`)
 * - 删除数据 (`delete`)
 * - 关闭数据库连接 (`close`)
 *
 * 使用示例：
 *
 * 构造函数参数：
 * - `config: DBConfig` - 数据库配置对象，包含数据库文件路径等信息。
 *
 * 特殊使用限制或潜在的副作用：
 * - 在调用任何数据库操作方法之前，必须先调用 `connect` 方法连接到数据库。
 * - 如果数据库连接失败或未连接，相关操作将抛出 `DatabaseError` 异常。
 */
class DBClient {
    constructor(config) {
        this.db = null;
        this.config = config;
    }
    async connect() {
        try {
            this.db = await (0, sqlite_1.open)({
                filename: this.config.database,
                driver: sqlite3_1.default.Database
            });
        }
        catch (error) {
            throw new DatabaseError(`Failed to connect to database: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async ensureConnected() {
        if (!this.db) {
            throw new DatabaseError('Database not connected. Call connect() first.');
        }
        return this.db;
    }
    /**
     * 创建数据库表。
     *
     * @param {string} table - 表名。
     * @param {Record<string, string>} columns - 列定义，键为列名，值为列类型。
     * @returns {Promise<Record<string, any>[]>} - 返回一个空数组，表示表创建成功。
     * @throws {DatabaseError} - 如果创建表失败，抛出数据库错误。
     */
    async createTable(table, columns) {
        const db = await this.ensureConnected();
        try {
            // 将列定义转换为SQL语句中的列定义部分
            const columnDefinitions = Object.entries(columns).map(([key, type]) => `${key} ${type}`).join(', ');
            // 执行创建表的SQL语句
            await db.run(`CREATE TABLE IF NOT EXISTS ${table} (${columnDefinitions})`);
            // 返回空数组表示成功
            return [];
        }
        catch (error) {
            // 捕获并抛出数据库错误
            throw new DatabaseError(`Failed to create table: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * 构建SQL查询的WHERE子句和对应的参数。
     *
     * @param where - 一个包含查询条件的对象，键为字段名，值为条件值或条件对象。
     * @returns 一个对象，包含SQL WHERE子句和对应的参数数组。
     */
    buildWhereClause(where) {
        // 用于存储条件表达式的数组
        const conditions = [];
        // 用于存储条件参数的数组
        const params = [];
        // 遍历查询条件对象
        Object.entries(where).forEach(([key, value]) => {
            // 如果值是对象且不为null，处理操作符（如gt, lt等）
            if (typeof value === 'object' && value !== null) {
                // 遍历操作符和对应的值
                Object.entries(value).forEach(([operator, operatorValue]) => {
                    // 根据操作符构建条件表达式并添加到conditions数组，同时将参数添加到params数组
                    switch (operator) {
                        case 'gt':
                            conditions.push(`${key} > ?`);
                            params.push(operatorValue);
                            break;
                        case 'lt':
                            conditions.push(`${key} < ?`);
                            params.push(operatorValue);
                            break;
                        case 'gte':
                            conditions.push(`${key} >= ?`);
                            params.push(operatorValue);
                            break;
                        case 'lte':
                            conditions.push(`${key} <= ?`);
                            params.push(operatorValue);
                            break;
                        case 'ne':
                            conditions.push(`${key} != ?`);
                            params.push(operatorValue);
                            break;
                        // 如果遇到未知操作符，抛出DatabaseError异常
                        default:
                            throw new DatabaseError(`Unknown operator: ${operator}`);
                    }
                });
            }
            // 如果值是数组，处理IN条件
            else if (Array.isArray(value)) {
                conditions.push(`${key} IN (${value.map(() => '?').join(', ')})`);
                params.push(...value);
            }
            // 如果值是其他类型，处理等值条件
            else {
                conditions.push(`${key} = ?`);
                params.push(value);
            }
        });
        // 返回包含WHERE子句和参数数组的对象
        return {
            clause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
            params
        };
    }
    /**
     * 异步查找数据库表中的记录。
     *
     * @param {string} table - 要查询的数据库表名。
     * @param {QueryOptions} [options] - 查询选项，包括过滤条件、排序、限制和偏移量。
     * @returns {Promise<Record<string, any>[]>} - 返回查询结果的Promise，结果是一个对象数组。
     *
     * @throws {DatabaseError} - 如果查询过程中发生错误，抛出数据库错误。
     */
    async find(table, options = {}) {
        // 确保数据库连接已建立
        const db = await this.ensureConnected();
        try {
            // 从选项中解构出过滤条件、限制、偏移量和排序字段
            const { where = {}, limit, offset, orderBy } = options;
            // 构建WHERE子句和相应的参数
            const { clause, params } = this.buildWhereClause(where);
            // 初始化查询语句
            let query = `SELECT * FROM ${table} ${clause}`;
            // 如果有排序字段，添加ORDER BY子句
            if (orderBy) {
                query += ` ORDER BY ${orderBy}`;
            }
            // 如果有限制数量，添加LIMIT子句
            if (typeof limit === 'number') {
                query += ` LIMIT ${limit}`;
            }
            // 如果有偏移量，添加OFFSET子句
            if (typeof offset === 'number') {
                query += ` OFFSET ${offset}`;
            }
            // 执行查询并返回结果
            return await db.all(query, ...params);
        }
        catch (error) {
            // 捕获并抛出数据库错误
            throw new DatabaseError(`Failed to find records: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * 查询单条记录
     *
     * @param {string} table - 要查询的表名
     * @param {QueryOptions} [options={}] - 查询选项，包括过滤条件和排序条件
     * @returns {Promise<Record<string, any> | null>} - 返回查询结果，如果没有找到记录则返回null
     *
     * @throws {DatabaseError} - 如果查询过程中发生错误，抛出DatabaseError
     */
    async findOne(table, options = {}) {
        // 确保数据库连接已建立
        const db = await this.ensureConnected();
        try {
            // 从选项中解构出过滤条件和排序条件，默认过滤条件为空对象
            const { where = {}, orderBy } = options;
            // 构建WHERE子句和参数
            const { clause, params } = this.buildWhereClause(where);
            // 构建查询语句
            let query = `SELECT * FROM ${table} ${clause}`;
            // 如果有排序条件，添加ORDER BY子句
            if (orderBy) {
                query += ` ORDER BY ${orderBy}`;
            }
            // 添加LIMIT 1以限制只返回一条记录
            query += ' LIMIT 1';
            // 执行查询并获取结果
            const result = await db.get(query, ...params);
            // 如果结果为空，返回null
            return result || null;
        }
        catch (error) {
            // 捕获并抛出数据库错误
            throw new DatabaseError(`Failed to find record: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * 创建一条新记录到指定的数据库表中。
     *
     * @param {string} table - 要插入数据的表名。
     * @param {Record<string, any>} data - 要插入的数据，以键值对形式表示。
     * @returns {Promise<string>} - 返回新记录的ID。
     *
     * @throws {DatabaseError} - 如果插入失败或插入后无法找到记录，则抛出数据库错误。
     */
    async create(table, data) {
        // 确保数据库连接已建立
        const db = await this.ensureConnected();
        try {
            // 如果数据中没有ID，则生成一个新的UUID作为ID
            if (!data.id) {
                data.id = (0, uuid_1.v4)();
            }
            // 获取数据中的键和值
            const keys = Object.keys(data);
            const values = Object.values(data);
            // 构建插入SQL查询语句
            const query = `
            INSERT INTO ${table} (${keys.join(', ')})
            VALUES (${keys.map(() => '?').join(', ')})
        `;
            // 执行插入操作
            await db.run(query, ...values);
            // 验证记录是否成功创建
            const created = await this.findOne(table, { where: { id: data.id } });
            if (!created) {
                // 如果插入后无法找到记录，则抛出错误
                throw new DatabaseError('Failed to create record: Record not found after insertion');
            }
            // 返回新记录的ID
            return data.id;
        }
        catch (error) {
            // 捕获并抛出数据库错误
            throw new DatabaseError(`Failed to create record: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * 更新数据库中的记录。
     *
     * @param {string} table - 要更新的数据表的名称。
     * @param {Record<string, any>} where - 更新条件，键为列名，值为条件值。
     * @param {Record<string, any>} data - 要更新的数据，键为列名，值为新值。
     * @returns {Promise<number>} - 返回受影响的行数。
     *
     * @throws {DatabaseError} - 如果更新操作失败，抛出数据库错误。
     */
    async update(table, where, data) {
        // 确保数据库连接已建立
        const db = await this.ensureConnected();
        try {
            // 构建WHERE子句和对应的参数
            const { clause, params: whereParams } = this.buildWhereClause(where);
            // 构建SET子句，将数据中的键值对转换为"key = ?"的形式
            const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
            // 构建完整的SQL更新语句
            const query = `UPDATE ${table} SET ${setClause} ${clause}`;
            // 合并数据参数和条件参数
            const allParams = [...Object.values(data), ...whereParams];
            // 执行更新操作
            const result = await db.run(query, ...allParams);
            // 返回受影响的行数，如果没有受影响的行则返回0
            return result.changes || 0;
        }
        catch (error) {
            // 捕获并抛出数据库错误
            throw new DatabaseError(`Failed to update records: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * 删除指定表中满足条件的记录。
     *
     * @param {string} table - 要删除记录的表名。
     * @param {Record<string, any>} where - 删除条件，键为列名，值为条件值。
     * @returns {Promise<number>} - 返回删除的记录数。
     *
     * @throws {DatabaseError} - 如果删除操作失败或缺少where子句。
     */
    async delete(table, where) {
        // 确保数据库连接已建立
        const db = await this.ensureConnected();
        try {
            // 构建删除条件子句和参数
            const { clause, params } = this.buildWhereClause(where);
            // 如果没有条件子句，抛出错误
            if (!clause) {
                throw new DatabaseError('Delete operation requires where clause');
            }
            // 构建删除SQL查询语句
            const query = `DELETE FROM ${table} ${clause}`;
            // 执行删除操作并获取结果
            const result = await db.run(query, ...params);
            // 返回删除的记录数，如果没有则返回0
            return result.changes || 0;
        }
        catch (error) {
            // 捕获并抛出数据库错误
            throw new DatabaseError(`Failed to delete records: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * 关闭数据库连接。
     *
     * 该方法用于异步关闭当前实例所使用的数据库连接。
     * 如果数据库连接存在，则调用数据库的关闭方法，并将数据库引用设置为null。
     *
     * @returns {Promise<void>} 返回一个Promise，表示关闭操作的完成。
     */
    async close() {
        if (this.db) {
            await this.db.close();
            this.db = null;
        }
    }
}
exports.DBClient = DBClient;
//# sourceMappingURL=database.js.map