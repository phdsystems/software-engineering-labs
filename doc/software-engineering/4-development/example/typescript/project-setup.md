# TypeScript Project Setup Guide

**Purpose:** Standard TypeScript project setup for implementing architecture patterns
**Language:** TypeScript 5.x with Node.js
**Build Tool:** npm / yarn / pnpm
**Framework:** Express.js / NestJS / Fastify
**Related:** [Architecture Patterns Guide](../examples-overview.md) | [Examples Index](../examples-overview.md)

---

## TL;DR

**Complete TypeScript project setup** with modern tooling, Express/NestJS frameworks, and best practices. **Quick start**: Install Node.js 18+ + TypeScript → Use npm/yarn → Add Express or NestJS → Configure tsconfig.json → Follow TypeScript conventions. **Key features**: Type safety, interfaces, generics, async/await, decorators (with NestJS), modern ESNext features.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Why TypeScript?](#why-typescript)
3. [Project Initialization](#project-initialization)
4. [Project Structure](#project-structure)
5. [Build Configuration](#build-configuration)
6. [TypeScript-Specific Features](#typescript-specific-features)
7. [Express.js with TypeScript](#expressjs-with-typescript)
8. [NestJS Framework](#nestjs-framework)
9. [Testing with TypeScript](#testing-with-typescript)
10. [Best Practices](#best-practices)

---

## Prerequisites

### Required Software

```bash
# 1. Node.js 18 or later
node -v
# v18.x.x or v20.x.x

# 2. npm (comes with Node.js)
npm -v
# 9.x.x or later

# 3. TypeScript compiler
npx tsc -v
# Version 5.x
```

### Installation

**Ubuntu/Debian:**
```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node -v
npm -v
```

**macOS:**
```bash
brew install node@20

# Or use nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

**Windows:**
```powershell
# Using Chocolatey
choco install nodejs-lts

# Or download installer from nodejs.org
```

---

## Why TypeScript?

### Key Advantages Over JavaScript

✅ **Static Type Safety** - Catch errors at compile time, not runtime
✅ **Enhanced IDE Support** - IntelliSense, autocomplete, refactoring
✅ **Modern JavaScript Features** - ES2022+ features with backward compatibility
✅ **Better Documentation** - Types serve as inline documentation
✅ **Refactoring Confidence** - Rename, move, change with safety
✅ **Interfaces & Generics** - Powerful type system for complex scenarios
✅ **Decorators** - Metadata and annotations (with experimental flag)
✅ **100% JavaScript Interop** - Use any npm package

**Code Comparison:**

**JavaScript:**
```javascript
function createUser(name, email, age) {
  return {
    id: Math.random().toString(),
    name: name,
    email: email,
    age: age,
    createdAt: new Date()
  };
}

// No type safety - errors at runtime
const user = createUser("John", 25, "john@example.com");  // Oops! Wrong order
```

**TypeScript:**
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  createdAt: Date;
}

function createUser(name: string, email: string, age: number): User {
  return {
    id: Math.random().toString(),
    name,
    email,
    age,
    createdAt: new Date()
  };
}

// Type error caught at compile time!
const user = createUser("John", 25, "john@example.com");  // Error: wrong types
```

---

## Project Initialization

### Option 1: Express.js with TypeScript

**Using npm:**
```bash
mkdir my-typescript-project
cd my-typescript-project

npm init -y
npm install express
npm install -D typescript @types/node @types/express ts-node nodemon

# Initialize TypeScript config
npx tsc --init
```

**Using package.json generator:**
```bash
npm init -y
npm pkg set type="module"
npm pkg set scripts.dev="nodemon --exec ts-node src/index.ts"
npm pkg set scripts.build="tsc"
npm pkg set scripts.start="node dist/index.js"
```

### Option 2: NestJS (Recommended for Enterprise)

**CLI Installation:**
```bash
npm install -g @nestjs/cli

# Create new project
nest new my-nest-project

cd my-nest-project
```

**Manual Setup:**
```bash
npm install @nestjs/core @nestjs/common @nestjs/platform-express
npm install -D @nestjs/cli @nestjs/schematics
```

### Option 3: Fastify with TypeScript

```bash
mkdir my-fastify-project
cd my-fastify-project

npm init -y
npm install fastify
npm install -D typescript @types/node ts-node nodemon

npx tsc --init
```

---

## Project Structure

### Express.js Structure

```
my-typescript-project/
├── src/
│   ├── index.ts                        # Application entry point
│   ├── domain/                         # Domain layer
│   │   ├── entities/                   # Domain entities
│   │   │   └── User.ts
│   │   ├── repositories/               # Repository interfaces
│   │   │   └── IUserRepository.ts
│   │   └── services/                   # Domain services
│   │       └── UserService.ts
│   ├── application/                    # Application layer
│   │   ├── usecases/                   # Use cases
│   │   │   └── CreateUserUseCase.ts
│   │   └── dto/                        # Data Transfer Objects
│   │       └── CreateUserDto.ts
│   ├── infrastructure/                 # Infrastructure layer
│   │   ├── persistence/                # Database implementations
│   │   │   └── UserRepository.ts
│   │   ├── web/                        # HTTP controllers
│   │   │   ├── controllers/
│   │   │   │   └── UserController.ts
│   │   │   └── routes/
│   │   │       └── userRoutes.ts
│   │   └── config/                     # Configuration
│   │       └── database.ts
│   └── shared/                         # Shared utilities
│       ├── types/                      # Shared types
│       └── utils/                      # Utility functions
├── tests/
│   ├── unit/
│   └── integration/
├── dist/                               # Compiled JavaScript (gitignored)
├── package.json
├── tsconfig.json
└── .env
```

### NestJS Structure

```
my-nest-project/
├── src/
│   ├── main.ts                         # Application entry point
│   ├── app.module.ts                   # Root module
│   ├── users/                          # Feature module
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   └── dto/
│   │       ├── create-user.dto.ts
│   │       └── update-user.dto.ts
│   ├── common/                         # Shared across modules
│   │   ├── filters/                    # Exception filters
│   │   ├── guards/                     # Auth guards
│   │   ├── interceptors/               # Request/Response interceptors
│   │   └── pipes/                      # Validation pipes
│   └── config/                         # Configuration
│       └── database.config.ts
├── test/
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
├── dist/
├── package.json
├── tsconfig.json
└── nest-cli.json
```

---

## Build Configuration

### tsconfig.json (Express/Fastify)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "allowSyntheticDefaultImports": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
```

### package.json (Express)

```json
{
  "name": "my-typescript-project",
  "version": "1.0.0",
  "type": "commonjs",
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint 'src/**/*.ts'",
    "format": "prettier --write 'src/**/*.ts'"
  },
  "dependencies": {
    "express": "^4.18.2",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.17",
    "@types/node": "^20.5.0",
    "@typescript-eslint/eslint-plugin": "^6.4.1",
    "@typescript-eslint/parser": "^6.4.1",
    "eslint": "^8.47.0",
    "jest": "^29.6.3",
    "nodemon": "^3.0.1",
    "prettier": "^3.0.2",
    "ts-jest": "^29.1.1",
    "ts-node": "^10.9.1",
    "typescript": "^5.1.6"
  }
}
```

---

## TypeScript-Specific Features

### 1. Interfaces and Types

```typescript
// Interface (extensible, for object shapes)
interface User {
  id: string;
  name: string;
  email: string;
  age?: number;  // Optional property
}

// Type alias (for unions, primitives, etc.)
type UserId = string;
type UserRole = 'admin' | 'user' | 'guest';

// Extending interfaces
interface AdminUser extends User {
  permissions: string[];
}

// Intersection types
type Employee = User & {
  employeeId: string;
  department: string;
};
```

### 2. Generics

```typescript
// Generic function
function findById<T extends { id: string }>(items: T[], id: string): T | undefined {
  return items.find(item => item.id === id);
}

// Generic class
class Repository<T> {
  private items: T[] = [];

  add(item: T): void {
    this.items.push(item);
  }

  findAll(): T[] {
    return this.items;
  }
}

// Usage
const userRepo = new Repository<User>();
userRepo.add({ id: '1', name: 'John', email: 'john@example.com' });
```

### 3. Utility Types

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  password: string;
}

// Partial - all properties optional
type PartialUser = Partial<User>;

// Pick - select specific properties
type UserCredentials = Pick<User, 'email' | 'password'>;

// Omit - exclude specific properties
type UserResponse = Omit<User, 'password'>;

// Required - all properties required
type CompleteUser = Required<User>;

// Readonly - immutable properties
type ImmutableUser = Readonly<User>;
```

### 4. Enums

```typescript
// String enum
enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest'
}

// Const enum (optimized, inlined at compile time)
const enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  NOT_FOUND = 404
}

// Usage
function checkRole(role: UserRole): boolean {
  return role === UserRole.ADMIN;
}
```

### 5. Type Guards

```typescript
interface Dog {
  bark(): void;
}

interface Cat {
  meow(): void;
}

// Type guard function
function isDog(animal: Dog | Cat): animal is Dog {
  return (animal as Dog).bark !== undefined;
}

// Usage
function makeSound(animal: Dog | Cat) {
  if (isDog(animal)) {
    animal.bark();  // TypeScript knows this is Dog
  } else {
    animal.meow();  // TypeScript knows this is Cat
  }
}
```

---

## Express.js with TypeScript

### Application Entry Point

```typescript
// src/index.ts
import express, { Application } from 'express';
import { userRoutes } from './infrastructure/web/routes/userRoutes';
import { errorHandler } from './shared/middleware/errorHandler';

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Domain Entity

```typescript
// src/domain/entities/User.ts
export class User {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string,
    public readonly createdAt: Date = new Date()
  ) {}

  static create(name: string, email: string): User {
    return new User(
      crypto.randomUUID(),
      name,
      email
    );
  }

  updateEmail(newEmail: string): User {
    return new User(
      this.id,
      this.name,
      newEmail,
      this.createdAt
    );
  }
}
```

### Repository Interface

```typescript
// src/domain/repositories/IUserRepository.ts
import { User } from '../entities/User';

export interface IUserRepository {
  save(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  delete(id: string): Promise<void>;
}
```

### Repository Implementation

```typescript
// src/infrastructure/persistence/UserRepository.ts
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User } from '../../domain/entities/User';

export class UserRepository implements IUserRepository {
  private users: User[] = [];

  async save(user: User): Promise<User> {
    const existingIndex = this.users.findIndex(u => u.id === user.id);

    if (existingIndex >= 0) {
      this.users[existingIndex] = user;
    } else {
      this.users.push(user);
    }

    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find(u => u.id === id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find(u => u.email === email) || null;
  }

  async findAll(): Promise<User[]> {
    return [...this.users];
  }

  async delete(id: string): Promise<void> {
    this.users = this.users.filter(u => u.id !== id);
  }
}
```

### Controller

```typescript
// src/infrastructure/web/controllers/UserController.ts
import { Request, Response, NextFunction } from 'express';
import { CreateUserUseCase } from '../../../application/usecases/CreateUserUseCase';
import { CreateUserDto } from '../../../application/dto/CreateUserDto';

export class UserController {
  constructor(private createUserUseCase: CreateUserUseCase) {}

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto: CreateUserDto = req.body;
      const user = await this.createUserUseCase.execute(dto);

      res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      // Implementation...
      res.json({ message: 'Get user by ID' });
    } catch (error) {
      next(error);
    }
  }
}
```

### Routes

```typescript
// src/infrastructure/web/routes/userRoutes.ts
import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { CreateUserUseCase } from '../../../application/usecases/CreateUserUseCase';
import { UserRepository } from '../../persistence/UserRepository';

const router = Router();

// Dependency injection (manual)
const userRepository = new UserRepository();
const createUserUseCase = new CreateUserUseCase(userRepository);
const userController = new UserController(createUserUseCase);

router.post('/', (req, res, next) => userController.create(req, res, next));
router.get('/:id', (req, res, next) => userController.getById(req, res, next));

export { router as userRoutes };
```

---

## NestJS Framework

### Module

```typescript
// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService]
})
export class UsersModule {}
```

### Controller (with decorators)

```typescript
// src/users/users.controller.ts
import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
}
```

### Service

```typescript
// src/users/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  private users: User[] = [];

  create(createUserDto: CreateUserDto): User {
    const user: User = {
      id: crypto.randomUUID(),
      ...createUserDto,
      createdAt: new Date()
    };

    this.users.push(user);
    return user;
  }

  findAll(): User[] {
    return this.users;
  }

  findOne(id: string): User {
    const user = this.users.find(u => u.id === id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }
}
```

### DTO with Validation

```typescript
// src/users/dto/create-user.dto.ts
import { IsEmail, IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}
```

---

## Testing with TypeScript

### Unit Test with Jest

```typescript
// tests/unit/UserService.test.ts
import { UserService } from '../../src/domain/services/UserService';
import { IUserRepository } from '../../src/domain/repositories/IUserRepository';
import { User } from '../../src/domain/entities/User';

describe('UserService', () => {
  let userService: UserService;
  let mockRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn()
    };

    userService = new UserService(mockRepository);
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      const name = 'John Doe';
      const email = 'john@example.com';
      const expectedUser = User.create(name, email);

      mockRepository.save.mockResolvedValue(expectedUser);
      mockRepository.findByEmail.mockResolvedValue(null);

      const result = await userService.createUser(name, email);

      expect(result).toEqual(expectedUser);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should throw error when email already exists', async () => {
      const existingUser = User.create('Jane', 'jane@example.com');
      mockRepository.findByEmail.mockResolvedValue(existingUser);

      await expect(
        userService.createUser('John', 'jane@example.com')
      ).rejects.toThrow('User with email already exists');
    });
  });
});
```

### Integration Test (NestJS)

```typescript
// test/users.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('UsersController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/users (POST) - should create user', () => {
    return request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'john@example.com'
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.name).toBe('John Doe');
        expect(res.body.email).toBe('john@example.com');
      });
  });

  it('/users (GET) - should return all users', () => {
    return request(app.getHttpServer())
      .get('/users')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });
});
```

---

## Best Practices

### 1. Use Strict Type Checking

✅ **DO:**
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  }
}
```

### 2. Prefer Interfaces for Object Shapes

✅ **DO:**
```typescript
interface UserData {
  name: string;
  email: string;
}

interface AdminData extends UserData {
  permissions: string[];
}
```

❌ **DON'T:**
```typescript
type UserData = {
  name: string;
  email: string;
};
// Types can't be extended with 'extends'
```

### 3. Use Const Assertions

✅ **DO:**
```typescript
const CONFIG = {
  apiUrl: 'https://api.example.com',
  timeout: 5000
} as const;

// Type: { readonly apiUrl: "https://api.example.com"; readonly timeout: 5000 }
```

### 4. Avoid 'any' Type

❌ **DON'T:**
```typescript
function processData(data: any) {
  return data.value;  // No type safety!
}
```

✅ **DO:**
```typescript
function processData<T extends { value: string }>(data: T): string {
  return data.value;
}

// Or use unknown for truly unknown data
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: string }).value;
  }
  throw new Error('Invalid data');
}
```

### 5. Use Readonly for Immutability

✅ **DO:**
```typescript
interface User {
  readonly id: string;
  readonly name: string;
  email: string;  // Can be changed
}

const users: readonly User[] = []; // Immutable array
```

---

## Quick Start Commands

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Format code
npm run format
```

---

## Next Steps

1. ✅ **Choose your architecture pattern** → [Architecture Patterns Guide](../examples-overview.md)
2. ✅ **Study TypeScript examples** → [TypeScript Examples](../examples-overview.md#-typescript-examples)
3. ✅ **Implement your project** using TypeScript's type system
4. ✅ **Follow TypeScript conventions** from this guide

---

## Related Resources

- **Main Guide:** [Architecture Patterns Guide](../examples-overview.md)
- **Examples Index:** [All Examples](../examples-overview.md)
- **Official TypeScript Docs:** https://www.typescriptlang.org/docs/
- **NestJS Documentation:** https://docs.nestjs.com/

---

*Last Updated: 2025-10-20*
