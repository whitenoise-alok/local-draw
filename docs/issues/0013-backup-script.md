# 0013 — Backup script

## What to build

A `backup.sh` script at the project root that creates a timestamped `mongodump` snapshot of the `local-draw` database. Each run creates a new directory under `./backups/<YYYY-MM-DD_HH-MM-SS>/`. The script prints the backup location when complete and gives a one-liner for restoring with `mongorestore`. The `./backups/` directory is git-ignored.

## Acceptance criteria

- [ ] `./backup.sh` runs without error when MongoDB is running
- [ ] Each run creates a new timestamped subdirectory under `./backups/`
- [ ] The backup contains all canvas documents (verifiable with `mongorestore` into a test database)
- [ ] The script prints the backup path and the restore command on completion
- [ ] Running the script twice produces two separate backup directories (no overwriting)
- [ ] `./backups/` is listed in `.gitignore`
- [ ] The script exits with a non-zero code and a clear error message if `mongod` is not running

## Blocked by

- 0001
