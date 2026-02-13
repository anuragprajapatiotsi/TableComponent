# Technical Design: Semantic Modeler Properties Panel (Role-Based)

## 1. Overview

This document outlines the design for the **Properties Panel** with a role-based configuration workflow. Users first select a **Role** (Dimension or Indicator), then select a specific **Definition** loaded dynamically from the backend.

## 2. User Workflow

1.  **Select Column**: User clicks a column in the Semantic Canvas.
2.  **Select Role**:
    - Radio Buttons: `Dimension` | `Indicator`
    - Selection triggers a fetch for available definitions.
3.  **Select Definition**:
    - Dropdown populated by `GET /semantic-modeling/column-types?type={Role}`.
    - Options grouped by category (e.g., "Time", "Geography").
4.  **Edit Display Name**: Input field for the user-friendly name.
5.  **Save**: Persist configuration via `POST /datasets/{id}/columns`.

## 3. API Integration

### 3.1 Fetch Definitions

- **Endpoint**: `GET /semantic-modeling/column-types`
- **Query Params**: `type=Dimension` or `type=Indicator`
- **Response Structure**:
  ```json
  {
    "Time": [
      { "id": "CalendarYear", "name": "Calendar Year" },
      { "id": "CalendarMonth", "name": "Calendar Month" }
    ],
    "Geography": [{ "id": "City", "name": "City" }]
  }
  ```
  _Note: If the API returns a flat list, the frontend will need to group it, or if it returns a grouped map, we use it directly._

### 3.2 Save Configuration

- **Endpoint**: `POST /datasets/{dataset_id}/columns`
- **Payload**:
  ```typescript
  type ColumnConfigPayload = {
    table_name: string;
    column_name: string;
    display_name: string;
    role: "Dimension" | "Indicator";
    definition_id: string; // e.g. "CalendarYear"
  };
  ```

## 4. Components

### 4.1 PropertiesPanel.tsx

- **State**:
  - `role`: "Dimension" | "Indicator" | null
  - `definitionId`: string | null
  - `displayName`: string
  - `availableDefinitions`: Record<string, Definition[]> (Grouped)
  - `isLoadingDefinitions`: boolean
- **Effects**:
  - On `selection` change: Reset state or load existing config.
  - On `role` change: Fetch definitions via API.

## 5. Implementation Plan

1.  **API Client**: Add `fetchSemanticColumnTypes` in `lib/semantic-api.ts`.
2.  **UI Construction**:
    - Use `RadioGroup` for Role.
    - Use `Select` (with `SelectGroup` and `SelectLabel`) for Definitions.
    - Use `Input` for Display Name.
3.  **Loading Logic**: Ensure pre-selection works when reopening a configured column.
