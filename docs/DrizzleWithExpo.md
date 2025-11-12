Get Started with Drizzle and Expo

## Install

Install expo-sqlite package (if it has not been done)

```bash
bunx expo install expo-sqlite

bun add drizzle-orm
bun add -D drizzle-kit
```

## Basic file structure

```bash
<project root>
 ├ assets
 ├ drizzle
 ├ db
 │  └ schema.ts
```

## Connect Drizzle ORM to the database

Create a `App.tsx` file in the root directory and initialize the connection:

```tsx
import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';

const expo = SQLite.openDatabaseSync('db.db');

const db = drizzle(expo);
```

## Create a table

Create a schema.ts file in the db directory and declare your table:

```tsx
// db/schema.ts
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const usersTable = sqliteTable("users_table", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  age: int().notNull(),
  email: text().notNull().unique(),
});
```

## Setup Drizzle config file

Drizzle config - a configuration file that is used by Drizzle Kit and contains all the information about your database connection, migration folder and schema files.

Create a `drizzle.config.ts` file in the root of your project and add the following content:

```tsx
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  driver: 'expo',
  schema: './db/schema.ts',
  out: './drizzle',
});
```

## Setup metro config

Create a file metro.config.js in root folder and add this code inside:

```jsx
// metro.config.js

const { getDefaultConfig } = require('expo/metro-config');
/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('sql');
module.exports = config;

```

## Update babel config

```jsx
// babel.config.js
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [["inline-import", { "extensions": [".sql"] }]] // <-- add this
  };
};

```

## Applying changes to the database

With Expo, you would need to generate migrations using the `drizzle-kit generate` command and then apply them at runtime using the `drizzle-orm migrate()` function

Generate migrations:

```bash
bunx drizzle-kit generate
```

## Apply migrations and query your db:

Let’s `App.tsx` file with migrations and queries to create, read, update, and delete users

```tsx
import { Text, View } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { usersTable } from './db/schema';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import migrations from './drizzle/migrations';

const expo = SQLite.openDatabaseSync('db.db');

const db = drizzle(expo);

export default function App() {
  const { success, error } = useMigrations(db, migrations);
  const [items, setItems] = useState<typeof usersTable.$inferSelect[] | null>(null);

  useEffect(() => {
    if (!success) return;

    (async () => {
      await db.delete(usersTable);

      await db.insert(usersTable).values([
        {
            name: 'John',
            age: 30,
            email: 'john@example.com',
        },
      ]);

      const users = await db.select().from(usersTable);
      setItems(users);
    })();
  }, [success]);

  if (error) {
    return (
      <View>
        <Text>Migration error: {error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View>
        <Text>Migration is in progress...</Text>
      </View>
    );
  }

  if (items === null || items.length === 0) {
    return (
      <View>
        <Text>Empty</Text>
      </View>
    );
  }

  return (
    <View
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        justifyContent: 'center',
      }}
    >
      {items.map((item) => (
        <Text key={item.id}>{item.email}</Text>
      ))}
    </View>
  );
}
```

📋 Drizzle ORM + Expo 实践经验总结

✅ 成功的关键因素

1. 正确的配置顺序
    - 先安装依赖：expo-sqlite, drizzle-orm, drizzle-kit, babel-plugin-inline-import
    - 然后配置：drizzle.config.ts, metro.config.js, babel.config.js
    - 最后生成迁移：bunx drizzle-kit generate
2. 迁移文件管理
    - 使用Drizzle自动生成的 migrations.js 文件
    - 不要手动创建 migrations.ts 文件
    - 让Drizzle管理所有迁移相关的文件
3. 错误处理策略
    - 迁移失败时：删除整个 drizzle 目录重新生成
    - SQL语法问题：Drizzle会自动处理SQLite语法
    - 类型安全：使用Zod类型推断

⚠️ 常见陷阱

1. 手动修改迁移文件 - 导致格式错误
2. 使用 jotai-tanstack-query - 过度复杂化，原生Jotai足够
3. 忽略外键顺序 - Drizzle会自动处理
4. 不正确的导入路径 - 使用相对路径导入迁移文件