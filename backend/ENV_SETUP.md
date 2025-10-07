# Environment Setup Guide for Pathway Planner Backend

This guide explains how to set up the `.env` file, configure local and remote MySQL databases, and use Prisma commands to manage and view your data.

---

## 1. .env Configuration

Create a `.env` file in the **backend** directory.  
Copy and paste the following contents:

```bash
# Environment variables declared in this file are automatically made available to Prisma.
# See: https://pris.ly/d/prisma-schema#accessing-environment-variables-from-the-schema

PORT=3000
NODE_ENV=development

# -----------------------------
# DATABASE CONNECTION OPTIONS
# -----------------------------

# (A) Local MySQL (for offline dev)
# Uncomment if using a local MySQL database:
# DATABASE_URL="mysql://app:app@localhost:3306/pathway_planner"

# (B) Remote MySQL (shared team database on TiDB Cloud)
DATABASE_URL="mysql://47auhREGvhCFxHm.root:JTl08GPvb00TlMhy@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/test?sslaccept=strict"
```

⚠️ **Important Notes**

- Never commit `.env` to GitHub — it contains credentials.
- `?sslaccept=strict` is **required** for TiDB Cloud SSL connection.
- `PORT` and `NODE_ENV` control local server settings.

---

## 2. Understanding the DATABASE_URL

`DATABASE_URL` tells Prisma which database to connect to.

**Format:**

```
mysql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME?sslaccept=strict
```

Example (TiDB Cloud shared database):

```
mysql://47auhREGvhCFxHm.root:JTl08GPvb00TlMhy@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/test?sslaccept=strict
```

Example (local development):

```
mysql://app:app@localhost:3306/pathway_planner
```

---

## 3. Setting Up a Local Database (Optional)

If you want your own local dev environment instead of using the shared online one:

1. Open **MySQL Workbench** or CLI.
2. Run:
   ```sql
   CREATE DATABASE pathway_planner CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
   ```
3. In `.env`, use:
   ```bash
   DATABASE_URL="mysql://root:yourpassword@localhost:3306/pathway_planner"
   ```
4. Import the schema:

   ```bash
   mysql -u root -p pathway_planner < backend/sql/pathway_planner.sql
   ```

   or run

   ```bash
   npx prisma db push
   ```

5. Verify with:
   ```bash
   npx prisma db pull
   npx prisma generate
   ```

---

## 4. Using the Shared Remote Database

The shared **TiDB Cloud** instance allows everyone to work on the same live schema.

1. Copy the remote `DATABASE_URL` (already in `.env`).
2. Run:
   ```bash
   npx prisma db pull
   npx prisma generate
   ```
3. This syncs your local Prisma models with the live database.

---

## 5. Prisma Commands Overview

| Command                                          | Purpose                                                                                           |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `npx prisma db pull`                             | **Reads** tables from the database and updates `schema.prisma`.                                   |
| `npx prisma db push`                             | **Writes** your `schema.prisma` models to the database.                                           |
| `npx prisma migrate dev --name <migration_name>` | Creates a migration file for new model changes.                                                   |
| `npx prisma migrate deploy`                      | Applies existing migrations to your database.                                                     |
| `npx prisma generate`                            | Generates the Prisma Client code used by the backend to query the database.                       |
| `npx prisma studio`                              | Opens an interactive GUI at [http://localhost:5555](http://localhost:5555) to view and edit data. |

---

## 6. Viewing and Managing Data with Prisma Studio

Prisma Studio lets you visually manage your data in the browser.

```bash
npx prisma studio
```

- Opens at **http://localhost:5555**
- You can **add, edit, delete**, and **browse** entries for all tables.
- Changes made here instantly reflect in your database (local or remote).

---

## 7. Prisma Models and Backend Usage

- The **model names** in `prisma/schema.prisma` correspond to the tables in MySQL.

  - Example:
    ```prisma
    model Patient {
      id        Int     @id @default(autoincrement())
      full_name String
      ...
    }
    ```
    → Used in backend as `prisma.patient.findMany()` or `prisma.patient.create()`

- The `@@map("table_name")` property tells Prisma the **actual table name** in MySQL if it differs from the model name.

- These models become the foundation of your **backend queries** via Prisma Client.

---

## 8. Example Development Workflow

1. Clone the project.
2. Create `.env` using the example above.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Connect Prisma:
   ```bash
   npx prisma db pull
   npx prisma generate
   ```
5. Open Prisma Studio:
   ```bash
   npx prisma studio
   ```
6. Run the backend server:
   ```bash
   npm run dev
   ```
7. Test routes that use Prisma Client — the data is pulled from your connected database.

---

## Summary

| Environment     | Connection                                                                                                            | Use Case                                       |
| --------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Local           | `mysql://app:app@localhost:3306/pathway_planner`                                                                      | Offline or private development                 |
| Remote (Shared) | `mysql://47auhREGvhCFxHm.root:JTl08GPvb00TlMhy@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/test?sslaccept=strict` | Shared team database for testing and live data |

---

### Quick Reference

| Command                                                     | Description                  |
| ----------------------------------------------------------- | ---------------------------- |
| `npx prisma db pull`                                        | Sync schema from DB → Prisma |
| `npx prisma db push`                                        | Push schema from Prisma → DB |
| `npx prisma generate`                                       | Generate Prisma Client       |
| `npx prisma studio`                                         | View/edit data in browser    |
| `mysql -u root -p pathway_planner < backend/sql/schema.sql` | Import SQL into local MySQL  |

---

### Security Tip

Never upload `.env` to GitHub.  
Add it to `.gitignore` and share it privately with teammates.

---

**Now you’re ready to build, migrate, and query your Pathway Planner database! 🚀**
