# Kirk's Folder

This is Kirk's private mini knowledge base inside the API HUB workspace.

## Purpose
- Personal handbook and planning space.
- Place to collect notes, ideas, and decision drafts.
- Separate from core project source-of-truth docs.

## Access Boundary
- Assistant rule: do not read, index, search, or use files in this folder unless Kirk explicitly asks for work in this folder.
- Exceptions:
  - `transfer-bay/` is the shared handoff space and is in default scope when Kirk asks to process handoff items.
  - `automation-bay/` is the local runtime surface for private file-triggered automations and may be used when Kirk asks to work on those automations.
- All other folders (`notes/`, `ideas/`, `decisions/`, `scratch/`) remain out of default assistant scope.

## Suggested Structure
- `notes/` ongoing thoughts and learning notes
- `ideas/` raw concepts and experiments
- `decisions/` finalized decisions and rationale
- `scratch/` temporary drafts
- `transfer-bay/` shared handoff zone for assistant-ready items
- `automation-bay/` local hot-folder runtime for private automations

## Optional Working Pattern
If you want assistant help on private content, point to the exact file/path and task.

For normal collaboration, drop a file into `transfer-bay/` and tell the assistant to process it.
