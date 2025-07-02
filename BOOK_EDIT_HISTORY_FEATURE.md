# Book Edit History Feature

## Overview

The Book Edit History feature allows authors to track changes made to their books over time, restore previous versions, and save important snapshots with descriptions. This feature helps prevent accidental data loss and enables authors to maintain a record of their work.

## Features

- **Automatic History Tracking**: Every time a book is saved, the system automatically creates a new history entry
- **Named Snapshots**: Authors can save important versions with custom names and descriptions
- **Version Restoration**: Previous versions can be restored with a single click
- **History Browser**: A dedicated panel for browsing through the book's edit history

## Technical Implementation

### Database Schema

- Added `edit_history` JSONB column to the `books` table
- Created database trigger `trigger_update_book_edit_history` that captures changes to book content
- Implemented functions for managing history:
  - `create_or_update_book_edit_history()`: Tracks changes automatically
  - `save_book_edit_snapshot()`: Saves named snapshots
  - `get_book_edit_history()`: Retrieves history data

### Frontend Components

- `EditHistoryPanel.tsx`: UI component for browsing and managing history entries
- Added history button to the BookEditor toolbar
- Implemented snapshot saving dialog

### Security

- Row-Level Security (RLS) policies ensure authors can only manage history for their own books
- Super admins have access to all books' edit histories

## How to Use

### Viewing Edit History

1. Open a book in the editor
2. Click the "История" (History) button in the toolbar
3. The history panel will open on the right side of the screen
4. Browse through the list of previous versions

### Saving a Named Snapshot

1. Make changes to your book
2. Click "Save" to save the book
3. Open the history panel
4. Click "Save current version" button
5. Enter a name and optional description
6. Click "Save"

### Restoring a Previous Version

1. Open the history panel
2. Find the version you want to restore
3. Click the dropdown arrow to expand the entry
4. Click the "Restore" button
5. The book will be restored to that version
6. Save the book to preserve the restoration

## Limitations

- History is limited to the last 50 versions per book
- Restored versions don't include canvas settings, only elements
- Very large books with extensive history may have slower save operations

## Future Improvements

- Visual diff tool to see what changed between versions
- Ability to export/import versions
- Scheduled automatic snapshots
- Collaboration history tracking with user attribution 
