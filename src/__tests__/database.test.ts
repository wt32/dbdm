import { DBClient, DatabaseError } from '../database';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_DB = path.join(__dirname, 'test.sqlite');

describe('DBClient', () => {
  let db: DBClient;

  beforeEach(async () => {
    // Remove test database if it exists
    if (fs.existsSync(TEST_DB)) {
      fs.unlinkSync(TEST_DB);
    }

    db = new DBClient({ database: TEST_DB });
    await db.connect();

    // Create test table using sqlite directly
    const sqlite = await open({
      filename: TEST_DB,
      driver: sqlite3.Database
    });

    await sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        age INTEGER
      )
    `);

    await sqlite.close();
  });

  afterEach(async () => {
    // Close the database connection first
    await db.close();

    // Clean up test database
    if (fs.existsSync(TEST_DB)) {
      fs.unlinkSync(TEST_DB);
    }
  });

  describe('create', () => {
    it('should create a new record', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      const id = await db.create('users', userData);
      expect(id).toBeTruthy();

      const user = await db.findOne('users', { where: { id } });
      expect(user).toMatchObject({
        ...userData,
        id: expect.any(String)
      });
    });

    it('should throw error for duplicate unique value', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      await db.create('users', userData);
      await expect(db.create('users', userData)).rejects.toThrow();
    });
  });

  describe('find', () => {
    beforeEach(async () => {
      await db.create('users', { name: 'John Doe', email: 'john@example.com', age: 30 });
      await db.create('users', { name: 'Jane Doe', email: 'jane@example.com', age: 25 });
      await db.create('users', { name: 'Bob Smith', email: 'bob@example.com', age: 35 });
    });

    it('should find all records', async () => {
      const users = await db.find('users');
      expect(users).toHaveLength(3);
    });

    it('should find records with where clause', async () => {
      const users = await db.find('users', {
        where: { age: { gt: 28 } }
      });
      expect(users).toHaveLength(2);
      expect(users.every(user => user.age > 28)).toBe(true);
    });

    it('should support ordering', async () => {
      const users = await db.find('users', {
        orderBy: 'age DESC'
      });
      expect(users[0].age).toBe(35);
      expect(users[2].age).toBe(25);
    });

    it('should support pagination', async () => {
      const users = await db.find('users', {
        limit: 2,
        offset: 1
      });
      expect(users).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('should find a single record', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      const id = await db.create('users', userData);
      const user = await db.findOne('users', {
        where: { id }
      });

      expect(user).toBeTruthy();
      expect(user).toMatchObject({
        ...userData,
        id: expect.any(String)
      });
    });

    it('should return null when no record found', async () => {
      const user = await db.findOne('users', {
        where: { id: 'non-existent' }
      });
      expect(user).toBeNull();
    });
  });

  describe('update', () => {
    it('should update matching records', async () => {
      const id = await db.create('users', {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      });

      const affected = await db.update(
        'users',
        { id },
        { age: 31 }
      );

      expect(affected).toBe(1);

      const user = await db.findOne('users', { where: { id } });
      expect(user?.age).toBe(31);
    });

    it('should return 0 when no records match', async () => {
      const affected = await db.update(
        'users',
        { id: 'non-existent' },
        { age: 31 }
      );
      expect(affected).toBe(0);
    });
  });

  describe('delete', () => {
    it('should delete matching records', async () => {
      const id = await db.create('users', {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      });

      const affected = await db.delete('users', { id });
      expect(affected).toBe(1);

      const user = await db.findOne('users', { where: { id } });
      expect(user).toBeNull();
    });

    it('should return 0 when no records match', async () => {
      const affected = await db.delete('users', { id: 'non-existent' });
      expect(affected).toBe(0);
    });
  });
});