export type SemanticType = {
  code: string;
  label: string;
  filterType: "contains" | "number" | "range" | "boolean";
};

export type SemanticColumnMapping = {
  column: string;
  databaseType: string;
  semanticType: string;
  filterType: string;
  source: "database" | "semantic";
};

export type SaveMappingPayload = {
  schema: string;
  table: string;
  column: string;
  sm_code: string; // The semantic type code (e.g., 'DIM_024')
};

const BASE_URL = "http://localhost:8000";

/**
 * Fetch available semantic types for the dropdown.
 */
export async function fetchSemanticTypes(): Promise<SemanticType[]> {
  const response = await fetch(`${BASE_URL}/semantic/types`);
  if (!response.ok) {
    throw new Error("Failed to fetch semantic types");
  }
  return response.json();
}

/**
 * Fetch semantic mappings for a specific table.
 * Used by Semantic Editor and Data Tab.
 */
export async function fetchSemanticColumns(
  schema: string,
  table: string,
): Promise<SemanticColumnMapping[]> {
  const response = await fetch(
    `${BASE_URL}/semantic/columns?schema=${schema}&table=${table}`,
  );
  if (!response.ok) {
    throw new Error("Failed to fetch semantic columns");
  }
  return response.json();
}

/**
 * Bulk save semantic mappings.
 * Called when user clicks "Apply Changes".
 */
export async function saveSemanticMappings(
  mappings: SaveMappingPayload[],
): Promise<{
  status: string;
  updated: number;
  inserted: number;
  message: string;
}> {
  const response = await fetch(`${BASE_URL}/semantic/mapping/bulk`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mappings }),
  });

  if (!response.ok) {
    throw new Error("Failed to save semantic mappings");
  }
  return response.json();
}

/**
 * Delete a semantic mapping (reset to database default).
 */
export async function deleteSemanticMapping(
  schema: string,
  table: string,
  column: string,
): Promise<{ status: string; message: string }> {
  const response = await fetch(`${BASE_URL}/semantic/mapping`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ schema, table, column }),
  });

  if (!response.ok) {
    throw new Error("Failed to delete semantic mapping");
  }
  return response.json();
}

// --- 1. Dataset APIs ---

export type Dataset = {
  id: string;
  name: string;
  description?: string;
  created_by?: string;
  created_at?: string;
};

export async function createDataset(payload: {
  name: string;
  description?: string;
  created_by: string;
}): Promise<Dataset> {
  const response = await fetch(`${BASE_URL}/datasets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Failed to create dataset");
  return response.json();
}

export async function getDatasets(): Promise<Dataset[]> {
  const response = await fetch(`${BASE_URL}/datasets`);
  if (!response.ok) throw new Error("Failed to fetch datasets");
  return response.json();
}

export async function getDataset(id: string): Promise<Dataset> {
  const response = await fetch(`${BASE_URL}/datasets/${id}`);
  if (!response.ok) throw new Error("Failed to fetch dataset");
  return response.json();
}

export async function deleteDataset(id: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/datasets/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete dataset");
}

// --- 2. Schema Explorer APIs ---

export type SchemaName = string;
export type TableName = string;
export type ColumnMetadata = {
  name: string;
  type: string;
};

export async function fetchSchemas(): Promise<SchemaName[]> {
  const response = await fetch(`${BASE_URL}/metadata/schemas`);
  if (!response.ok) {
    console.warn("Using fallback schemas due to API error");
    return ["public"];
  }
  return response.json();
}

export async function fetchTables(schema: string): Promise<TableName[]> {
  const response = await fetch(`${BASE_URL}/metadata/schemas/${schema}/tables`);
  if (!response.ok) {
    throw new Error(`Failed to fetch tables for schema: ${schema}`);
  }
  return response.json();
}

export async function fetchColumns(
  schema: string,
  table: string,
): Promise<ColumnMetadata[]> {
  const response = await fetch(
    `${BASE_URL}/metadata/schemas/${schema}/columns?table=${table}`,
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch columns for table: ${table}`);
  }
  return response.json();
}

// --- 3. Canvas Table Placement ---

export async function updateTablePosition(
  datasetId: string,
  tableId: string,
  x: number,
  y: number,
): Promise<void> {
  const response = await fetch(
    `${BASE_URL}/datasets/${datasetId}/tables/${tableId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ position_x: x, position_y: y }),
    },
  );
  if (!response.ok) throw new Error("Failed to update table position");
}

export type CanvasTablePosition = {
  id: string;
  table_name: string;
  schema_name?: string;
  alias: string;
  position_x: number;
  position_y: number;
};

export async function addTableToCanvas(
  datasetId: string,
  payload: {
    table_name: string;
    schema_name?: string;
    alias: string;
    position_x: number;
    position_y: number;
  },
): Promise<CanvasTablePosition> {
  const response = await fetch(`${BASE_URL}/datasets/${datasetId}/tables`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to add table to canvas", response.status, errorText);
    throw new Error(
      `Failed to add table to canvas: ${response.status} ${errorText}`,
    );
  }
  return response.json();
}

export async function getCanvasTables(
  datasetId: string,
): Promise<CanvasTablePosition[]> {
  const response = await fetch(`${BASE_URL}/datasets/${datasetId}/tables`);
  if (!response.ok) throw new Error("Failed to fetch canvas tables");
  return response.json();
}

export async function removeTableFromCanvas(
  datasetId: string,
  tableId: string,
): Promise<void> {
  const response = await fetch(
    `${BASE_URL}/datasets/${datasetId}/tables/${tableId}`,
    {
      method: "DELETE",
    },
  );
  if (!response.ok) throw new Error("Failed to remove table from canvas");
}

// --- 4. Join Relationships ---

export type JoinRelationship = {
  id: string;
  left_dataset_table_id: string;
  left_column: string;
  right_dataset_table_id: string;
  right_column: string;
  join_type: "left" | "right" | "inner" | "full";
  // Legacy or display names if returned
  left_table?: string;
  right_table?: string;
};

export async function createJoin(
  datasetId: string,
  payload: {
    left_dataset_table_id: string;
    left_column: string;
    right_dataset_table_id: string;
    right_column: string;
    join_type: string;
  },
): Promise<JoinRelationship> {
  const response = await fetch(`${BASE_URL}/datasets/${datasetId}/joins`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Failed to create join");
  return response.json();
}

export async function getJoins(datasetId: string): Promise<JoinRelationship[]> {
  const response = await fetch(`${BASE_URL}/datasets/${datasetId}/joins`);
  if (!response.ok) throw new Error("Failed to fetch joins");
  return response.json();
}

export async function deleteJoin(
  datasetId: string,
  joinId: string,
): Promise<void> {
  const response = await fetch(
    `${BASE_URL}/datasets/${datasetId}/joins/${joinId}`,
    {
      method: "DELETE",
    },
  );
  if (!response.ok) throw new Error("Failed to delete join");
}

// --- 5. Column Semantic Properties ---

// --- 5. Column Semantic Properties ---

export type ColumnConfigPayload = {
  table_name: string;
  column_name: string;
  display_name: string;
  role: "Dimension" | "Indicator";
  definition_id: string; // The ID from the master table (e.g. "CalendarYear")
};

export async function saveColumnConfig(
  datasetId: string,
  payload: ColumnConfigPayload,
): Promise<void> {
  const response = await fetch(`${BASE_URL}/datasets/${datasetId}/columns`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Failed to save column config");
}

export async function getColumnConfigs(
  datasetId: string,
): Promise<ColumnConfigPayload[]> {
  const response = await fetch(`${BASE_URL}/datasets/${datasetId}/columns`);
  if (!response.ok) throw new Error("Failed to fetch column configs");
  return response.json();
}

// --- 6. Semantic Modeling Master Data ---

export type SemanticDefinition = {
  id: string;
  name: string;
  description?: string;
};

// Response is a map of Category -> Definitions
export type GroupedSemanticDefinitions = Record<string, SemanticDefinition[]>;

export async function fetchSemanticColumnTypes(
  type: "Dimension" | "Indicator",
): Promise<GroupedSemanticDefinitions> {
  try {
    const queryType = type === "Indicator" ? "Indicators" : type;
    const response = await fetch(
      `${BASE_URL}/semantic-modeling/column-types?type=${queryType}`,
    );
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.warn("API unavailable, using mock data for semantic types", e);
  }

  // Fallback / Mock Data
  if (type === "Dimension") {
    return {
      Time: [
        { id: "CalendarYear", name: "Calendar Year" },
        { id: "CalendarQuarter", name: "Calendar Quarter" },
        { id: "CalendarMonth", name: "Calendar Month" },
        { id: "CalendarDate", name: "Calendar Date" },
      ],
      Geography: [
        { id: "Country", name: "Country" },
        { id: "State", name: "State" },
        { id: "City", name: "City" },
        { id: "PostalCode", name: "Postal Code" },
      ],
      Product: [
        { id: "Category", name: "Category" },
        { id: "SubCategory", name: "Sub Category" },
        { id: "ProductName", name: "Product Name" },
      ],
    };
  } else {
    return {
      Sales: [
        { id: "Revenue", name: "Revenue" },
        { id: "Cost", name: "Cost" },
        { id: "Profit", name: "Profit" },
      ],
      Quantity: [
        { id: "UnitsSold", name: "Units Sold" },
        { id: "Returns", name: "Returns" },
      ],
      Ratio: [
        { id: "Margin", name: "Margin %" },
        { id: "YoYGrowth", name: "YoY Growth %" },
      ],
    };
  }
}
