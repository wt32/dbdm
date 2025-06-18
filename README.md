# DBDM (Database Data Manager)

[English](README.md) | [简体中文](README.zh-CN.md)

A lightweight and efficient database toolkit for Node.js applications, providing a simple and unified API for database operations.

## Features

- ✨ Simple and intuitive API design
- 🛡️ Built-in SQL injection protection
- 📦 Promise-based async operations
- 🔧 Configurable and extensible
- ✅ Comprehensive test coverage
- 🚀 High performance

## Installation

```bash
npm install dbdm
```

## Quick Start

```javascript
import { DBClient } from 'dbdm';

// Initialize database connection
const db = new DBClient({ database: 'test.db' });
await db.connect();

// Create a new record
const userId = await db.create('users', {
  name: 'Bob',
  email: 'bob@example.com'
});

// Query records
const users = await db.find('users', {
  where: { status: 'active' },
  orderBy: 'created_at DESC',
  limit: 10
});
```

## API Reference

### DBClient

#### Constructor

```javascript
const db = new DBClient(config: DatabaseConfig)
```

#### Methods

- **connect()**: Promise<void>
  - Establishes database connection

- **find(table: string, options?: FindOptions)**: Promise<Array>
  - Retrieves multiple records
  - Options:
    - where: Record<string, any>
    - limit: number
    - offset: number
    - orderBy: string

- **findOne(table: string, options?: FindOptions)**: Promise<object>
  - Retrieves a single record

- **create(table: string, data: Record<string, any>)**: Promise<number>
  - Inserts a new record
  - Returns the ID of created record

- **update(table: string, where: Record<string, any>, data: Record<string, any>)**: Promise<number>
  - Updates existing records
  - Returns number of affected rows

- **delete(table: string, where: Record<string, any>)**: Promise<number>
  - Deletes records
  - Returns number of affected rows

## Advanced Usage

### Complex Queries

```javascript
const activeUsers = await db.find('users', {
  where: {
    status: 'active',
    lastLogin: { gte: '2023-01-01' }
  },
  orderBy: 'created_at DESC',
  limit: 100
});
```

### Error Handling

```javascript
try {
  await db.create('users', { /* ... */ });
} catch (err) {
  if (err.name === 'DatabaseError') {
    console.error('Database operation failed:', err.message);
  }
}
```

## Requirements

- Node.js v14 or higher
- SQLite3

## Development

```bash
# Install dependencies
npm install

# Run tests
npm run test

# Build
npm run build
```

## License

MIT

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.