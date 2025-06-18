export interface DBConfig {
    database: string;
}
export interface QueryOptions {
    where?: Record<string, any>;
    limit?: number;
    offset?: number;
    orderBy?: string;
}
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
export declare class DatabaseError extends Error {
    constructor(message: string);
}
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
export declare class DBClient {
    private db;
    private config;
    constructor(config: DBConfig);
    connect(): Promise<void>;
    private ensureConnected;
    /**
     * 创建数据库表。
     *
     * @param {string} table - 表名。
     * @param {Record<string, string>} columns - 列定义，键为列名，值为列类型。
     * @returns {Promise<Record<string, any>[]>} - 返回一个空数组，表示表创建成功。
     * @throws {DatabaseError} - 如果创建表失败，抛出数据库错误。
     */
    createTable(table: string, columns: Record<string, string>): Promise<Record<string, any>[]>;
    /**
     * 构建SQL查询的WHERE子句和对应的参数。
     *
     * @param where - 一个包含查询条件的对象，键为字段名，值为条件值或条件对象。
     * @returns 一个对象，包含SQL WHERE子句和对应的参数数组。
     */
    private buildWhereClause;
    /**
     * 异步查找数据库表中的记录。
     *
     * @param {string} table - 要查询的数据库表名。
     * @param {QueryOptions} [options] - 查询选项，包括过滤条件、排序、限制和偏移量。
     * @returns {Promise<Record<string, any>[]>} - 返回查询结果的Promise，结果是一个对象数组。
     *
     * @throws {DatabaseError} - 如果查询过程中发生错误，抛出数据库错误。
     */
    find(table: string, options?: QueryOptions): Promise<Record<string, any>[]>;
    /**
     * 查询单条记录
     *
     * @param {string} table - 要查询的表名
     * @param {QueryOptions} [options={}] - 查询选项，包括过滤条件和排序条件
     * @returns {Promise<Record<string, any> | null>} - 返回查询结果，如果没有找到记录则返回null
     *
     * @throws {DatabaseError} - 如果查询过程中发生错误，抛出DatabaseError
     */
    findOne(table: string, options?: QueryOptions): Promise<Record<string, any> | null>;
    /**
     * 创建一条新记录到指定的数据库表中。
     *
     * @param {string} table - 要插入数据的表名。
     * @param {Record<string, any>} data - 要插入的数据，以键值对形式表示。
     * @returns {Promise<string>} - 返回新记录的ID。
     *
     * @throws {DatabaseError} - 如果插入失败或插入后无法找到记录，则抛出数据库错误。
     */
    create(table: string, data: Record<string, any>): Promise<string>;
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
    update(table: string, where: Record<string, any>, data: Record<string, any>): Promise<number>;
    /**
     * 删除指定表中满足条件的记录。
     *
     * @param {string} table - 要删除记录的表名。
     * @param {Record<string, any>} where - 删除条件，键为列名，值为条件值。
     * @returns {Promise<number>} - 返回删除的记录数。
     *
     * @throws {DatabaseError} - 如果删除操作失败或缺少where子句。
     */
    delete(table: string, where: Record<string, any>): Promise<number>;
    /**
     * 关闭数据库连接。
     *
     * 该方法用于异步关闭当前实例所使用的数据库连接。
     * 如果数据库连接存在，则调用数据库的关闭方法，并将数据库引用设置为null。
     *
     * @returns {Promise<void>} 返回一个Promise，表示关闭操作的完成。
     */
    close(): Promise<void>;
}
