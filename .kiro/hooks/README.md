# Agent Hooks Configuration

This directory contains agent hook configurations for the ShadowCache project. Agent hooks allow automated actions to be triggered by various events in the IDE.

## Available Hooks

### 1. Auto-generate tests for SDK changes
**File:** `auto-test-generation.json`

**Trigger:** When any TypeScript file in the SDK packages is saved (excluding test files)

**Action:** Sends a message to the agent reminding to review if new tests are needed

**Purpose:** Ensures that all SDK changes are accompanied by appropriate test coverage (Requirements 12.1)

**Status:** ✅ Enabled by default

### 2. Auto-generate documentation from spec updates
**File:** `auto-doc-generation.json`

**Trigger:** When any specification document in `.kiro/specs/` is saved

**Action:** Sends a message to the agent to update relevant documentation files

**Purpose:** Keeps API documentation synchronized with specification changes (Requirements 12.2)

**Status:** ✅ Enabled by default

### 3. Verify .kiro directory is committed
**File:** `verify-kiro-committed.json`

**Trigger:** When a message is sent to the agent

**Action:** Runs a git command to check if .kiro is tracked, warns if not

**Purpose:** Ensures specification files are included in version control (Requirements 12.3)

**Status:** ⚠️ Disabled by default (enable when needed)

## How to Use

### Viewing Hooks
1. Open the Explorer view in Kiro
2. Look for the "Agent Hooks" section
3. View all configured hooks and their status

### Enabling/Disabling Hooks
1. Open the Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
2. Search for "Open Kiro Hook UI"
3. Toggle hooks on/off as needed

Alternatively, edit the `enabled` field in the JSON files directly.

### Creating New Hooks
1. Use the Command Palette: "Open Kiro Hook UI"
2. Or create a new JSON file in this directory following the schema below

## Hook Configuration Schema

```json
{
  "name": "Hook display name",
  "description": "What this hook does",
  "trigger": {
    "type": "file-save | agent-message-sent | agent-execution-complete | session-created",
    "pattern": "optional glob pattern for file triggers",
    "exclude": "optional glob pattern to exclude files"
  },
  "action": {
    "type": "agent-message | shell-command",
    "message": "Message to send to agent (for agent-message type)",
    "command": "Shell command to execute (for shell-command type)",
    "onError": {
      "type": "agent-message",
      "message": "Message to send if command fails"
    }
  },
  "enabled": true,
  "notes": "Optional notes about the hook"
}
```

## Trigger Types

- **file-save**: Triggered when a file matching the pattern is saved
- **agent-message-sent**: Triggered when a message is sent to the agent
- **agent-execution-complete**: Triggered when an agent execution finishes
- **session-created**: Triggered on first message send in a new session

## Action Types

- **agent-message**: Sends a message to the agent with context
- **shell-command**: Executes a shell command (with optional error handling)

## Variables

The following variables can be used in messages:
- `{{filePath}}`: Path to the file that triggered the hook (for file-save triggers)

## Best Practices

1. **Keep hooks focused**: Each hook should have a single, clear purpose
2. **Use descriptive names**: Make it easy to understand what each hook does
3. **Document thoroughly**: Include descriptions and notes
4. **Test carefully**: Ensure hooks don't create infinite loops or excessive noise
5. **Consider performance**: Avoid heavy operations on frequently triggered events
6. **Enable selectively**: Not all hooks need to be active all the time

## Troubleshooting

### Hook not triggering
- Check that `enabled` is set to `true`
- Verify the trigger pattern matches your files
- Check the Kiro output panel for errors

### Too many notifications
- Adjust the trigger pattern to be more specific
- Consider disabling hooks temporarily during bulk operations
- Use the `exclude` pattern to filter out unwanted triggers

### Shell commands failing
- Ensure commands are compatible with your shell (cmd on Windows)
- Use absolute paths or ensure working directory is correct
- Add error handling with `onError` configuration

## Related Requirements

- **Requirement 12.1**: Automated test generation for SDK changes
- **Requirement 12.2**: API documentation regeneration from specs
- **Requirement 12.3**: Verification of .kiro directory in version control

## Future Enhancements

Potential additional hooks to consider:
- Code style validation on file save
- Bundle size checking before commits
- Automatic changelog generation
- Security scanning for sensitive data in cache rules
