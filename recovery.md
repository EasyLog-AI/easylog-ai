# MariaDB Recovery Plan

This guide provides a step-by-step plan for restoring a MariaDB database from a backup file.

## Route 1 (Recommended)

1. Navigate to https://forge.laravel.com and login with your credentials.
2. Click on the server you want to restore.
3. Click on the "Database" tab.
4. Select the backup file you want to restore.
5. Click on the "Restore" button.
6. Wait for the restore to complete.

## Route 2 (Alternative)

**Important:** Before you begin, ensure you have the `root` password for the server. This is stored in 1Password.
Optionally, but recommended. Configure the server in your ssh config.

---

### Step 1: Download the Database Backup

1.  Navigate to Forge.
2.  Download the latest backup file for the server you intend to restore (e.g., staging or production).

---

### Step 2: Upload Backup to the Remote Server

Use the `scp` (secure copy) command to upload the backup file from your local machine to the server.

Replace the placeholders with your actual file paths and server details.

```bash
scp /path/to/local/backup.sql <user>@<server_address>:/remote/path/on/server/backup.sql
```

**Example:**

```bash
scp './backup.sql' easylog-staging2:/home/forge/'
```

---

### Step 3: Connect to the Server

Connect to the remote server using SSH to execute the restore commands.

```bash
ssh <user>@<server_address>
```

**Example:**

```bash
ssh easylog-staging2
```

Become root user so you don't need a database password. You can find the server root password in 1password.

```bash
sudo su
```

---

### Step 4: Restore the Database

These commands will drop the existing database, create a new empty one, and then import the data from your backup file.

**Warning:** The `DROP DATABASE` command is destructive and will permanently delete the existing database.

1.  Replace `<database_name>` with the name of the database you are restoring, and `/remote/path/on/server/backup.sql` with the path where you uploaded the backup file in Step 2.

```bash
mariadb -e "DROP DATABASE IF EXISTS <database_name>; CREATE DATABASE <database_name>;" && mariadb <database_name> < /remote/path/on/server/backup.sql
```

**Example:**

```bash
mariadb -e "DROP DATABASE IF EXISTS easylog_staging2; CREATE DATABASE easylog_staging2;" && mariadb easylog_staging2 < /home/forge/backup.sql
```

This command does three things:

1.  Connects to MariaDB as the `root` user.
2.  Executes SQL to drop the existing database and create a new one.
3.  If the first part is successful, it imports the content of your `.sql` backup file into the newly created database.

---
