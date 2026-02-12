"use strict";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  Dataset,
  CanvasTablePosition,
  JoinRelationship,
  ColumnConfigPayload,
  ColumnMetadata,
  getDatasets,
  getDataset,
  getCanvasTables,
  addTableToCanvas,
  removeTableFromCanvas,
  getJoins,
  createJoin,
  deleteJoin,
  fetchSchemas,
  fetchTables,
  fetchColumns, // kept for reference if needed
  saveColumnConfig,
  fetchSemanticTypes,
  SemanticType,
  fetchSemanticColumns,
  saveSemanticMappings,
  SemanticColumnMapping,
  SaveMappingPayload,
  updateTablePosition as updateTablePositionApi,
} from "@/lib/semantic-api";

// Selection Types
export type SelectionType = "table" | "column" | "join" | null;
export type SelectedObject = {
  type: SelectionType;
  id: string; // tableId, joinId, or "tableId:columnName"
  data?: any;
};

interface SemanticContextType {
  // --- Datasets ---
  datasets: Dataset[];
  selectedDataset: Dataset | null;
  loadDataset: (id: string) => Promise<void>;

  // --- Metadata Explorer ---
  schemas: string[];
  tables: string[]; // Tables in selected schema
  selectedSchema: string;
  setSelectedSchema: (schema: string) => void;

  // --- Canvas State ---
  canvasTables: CanvasTablePosition[];
  joins: JoinRelationship[];
  refreshCanvas: () => Promise<void>;

  // --- Actions ---
  dropTableOnCanvas: (tableName: string, x: number, y: number) => Promise<void>;
  // Optimistic update for drag
  updateTablePosition: (tableId: string, x: number, y: number) => void;
  removeTable: (tableId: string) => Promise<void>;
  addJoin: (
    leftTable: string,
    leftCol: string,
    rightTable: string,
    rightCol: string,
    joinType: string,
  ) => Promise<void>;
  removeJoin: (joinId: string) => Promise<void>;

  // --- Properties / Selection ---
  selection: SelectedObject | null;
  setSelection: (selection: SelectedObject | null) => void;
  updateColumnConfig: (payload: ColumnConfigPayload) => Promise<void>;
  semanticTypes: SemanticType[];

  // --- Join Creation ---
  // --- Semantic Editor State ---
  selectedTable: string | null;
  columnMappings: SemanticColumnMapping[];
  isLoadingColumns: boolean;
  dirtyMappings: Record<string, string>; // column -> sm_code
  isDirty: boolean;
  updateMapping: (column: string, code: string) => void;
  saveChanges: () => Promise<void>;
  discardChanges: () => void;

  // --- Visual Joins ---
  cachedColumns: Record<string, ColumnMetadata[]>;
  registerTableColumns: (tableName: string, columns: ColumnMetadata[]) => void;
  pendingJoinSource: SelectedObject | null;
  setPendingJoinSource: (source: SelectedObject | null) => void;
  semanticUpdateVersion: number;
}

const SemanticContext = createContext<SemanticContextType | undefined>(
  undefined,
);

export function SemanticProvider({ children }: { children: React.ReactNode }) {
  // --- State ---
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);

  const [schemas, setSchemas] = useState<string[]>([]);
  const [tables, setTables] = useState<string[]>([]);
  const [selectedSchema, setSelectedSchema] = useState<string>("public");

  const [canvasTables, setCanvasTables] = useState<CanvasTablePosition[]>([]);
  const [joins, setJoins] = useState<JoinRelationship[]>([]);

  const [selection, setSelection] = useState<SelectedObject | null>(null);
  const [semanticTypes, setSemanticTypes] = useState<SemanticType[]>([]);

  // --- Semantic Editor State ---
  const [columnMappings, setColumnMappings] = useState<SemanticColumnMapping[]>(
    [],
  );
  const [isLoadingColumns, setIsLoadingColumns] = useState(false);
  const [dirtyMappings, setDirtyMappings] = useState<Record<string, string>>(
    {},
  );
  const [semanticUpdateVersion, setSemanticUpdateVersion] = useState(0);

  const selectedTable =
    selection?.type === "table" ? selection.data.table_name || null : null;
  const isDirty = Object.keys(dirtyMappings).length > 0;

  // --- Load Mappings when Table Selected ---
  useEffect(() => {
    async function loadMappings() {
      if (!selectedTable) {
        setColumnMappings([]);
        setDirtyMappings({});
        return;
      }
      setIsLoadingColumns(true);
      try {
        // Assumption: Table is in the selectedSchema?
        // Canvas tables might not store schema yet, but for now we use selectedSchema or public.
        // If selection.data has schema, better.
        // CanvasTablePosition doesn't have schema.
        // We will use selectedSchema for now.
        const mappings = await fetchSemanticColumns(
          selectedSchema,
          selectedTable,
        );
        setColumnMappings(mappings);
        setDirtyMappings({});
      } catch (e) {
        console.error("Failed to load semantic mappings", e);
        setColumnMappings([]);
      } finally {
        setIsLoadingColumns(false);
      }
    }
    loadMappings();
  }, [selectedTable, selectedSchema]);

  const updateMapping = useCallback((column: string, code: string) => {
    setDirtyMappings((prev) => ({
      ...prev,
      [column]: code,
    }));
  }, []);

  const saveChanges = useCallback(async () => {
    if (!selectedTable) return;
    try {
      const payload: SaveMappingPayload[] = Object.entries(dirtyMappings).map(
        ([col, code]) => ({
          schema: selectedSchema,
          table: selectedTable,
          column: col,
          sm_code: code,
        }),
      );
      await saveSemanticMappings(payload);

      // Refresh mappings
      const mappings = await fetchSemanticColumns(
        selectedSchema,
        selectedTable,
      );
      setColumnMappings(mappings);
      setDirtyMappings({});
      setSemanticUpdateVersion((v) => v + 1);
    } catch (e) {
      console.error("Failed to save mappings", e);
      throw e;
    }
  }, [dirtyMappings, selectedSchema, selectedTable]);

  const discardChanges = useCallback(() => {
    setDirtyMappings({});
  }, []);

  // --- Initial Load ---
  useEffect(() => {
    async function init() {
      try {
        const [dsList, schemaList, types] = await Promise.all([
          getDatasets(),
          fetchSchemas(),
          fetchSemanticTypes(),
        ]);
        setDatasets(dsList);
        setSchemas(schemaList);
        setSemanticTypes(types);

        // Auto-select first dataset if available
        if (dsList.length > 0) {
          loadDataset(dsList[0].id);
        }
        if (schemaList.length > 0) {
          setSelectedSchema(schemaList[0]);
        }
      } catch (e) {
        console.error("Initialization failed", e);
      }
    }
    init();
  }, []);

  // --- Watchers ---
  useEffect(() => {
    async function loadSchemaTables() {
      if (!selectedSchema) return;
      try {
        const t = await fetchTables(selectedSchema);
        setTables(t);
      } catch (e) {
        console.error("Failed to load tables", e);
        setTables([]);
      }
    }
    loadSchemaTables();
  }, [selectedSchema]);

  // --- Actions ---

  const loadDataset = useCallback(async (id: string) => {
    try {
      const ds = await getDataset(id);
      setSelectedDataset(ds);
      // Load canvas content
      const [ct, j] = await Promise.all([getCanvasTables(id), getJoins(id)]);
      setCanvasTables(ct);
      setJoins(j);
    } catch (e) {
      console.error("Failed to load dataset", id, e);
    }
  }, []);

  const refreshCanvas = useCallback(async () => {
    if (!selectedDataset) return;
    try {
      const [ct, j] = await Promise.all([
        getCanvasTables(selectedDataset.id),
        getJoins(selectedDataset.id),
      ]);
      setCanvasTables(ct);
      setJoins(j);
    } catch (e) {
      console.error("Canvas refresh failed", e);
    }
  }, [selectedDataset]);

  const dropTableOnCanvas = useCallback(
    async (tableName: string, x: number, y: number) => {
      if (!selectedDataset) return;
      try {
        const newTable = await addTableToCanvas(selectedDataset.id, {
          table_name: tableName,
          alias: tableName, // Default alias
          position_x: x,
          position_y: y,
        });
        setCanvasTables((prev) => [...prev, newTable]);
      } catch (e) {
        console.error("Drop table failed", e);
      }
    },
    [selectedDataset],
  );

  const updateTablePosition = useCallback(
    async (tableId: string, x: number, y: number) => {
      if (!selectedDataset) return;

      // Optimistic update
      setCanvasTables((prev) =>
        prev.map((t) =>
          t.id === tableId ? { ...t, position_x: x, position_y: y } : t,
        ),
      );

      try {
        await updateTablePositionApi(selectedDataset.id, tableId, x, y);
      } catch (e) {
        console.error("Failed to update table position", e);
        // Optional: Revert state on error?
      }
    },
    [selectedDataset],
  );

  const removeTable = useCallback(
    async (tableId: string) => {
      if (!selectedDataset) return;
      try {
        await removeTableFromCanvas(selectedDataset.id, tableId);
        setCanvasTables((prev) => prev.filter((t) => t.id !== tableId));
        setSelection(null);
      } catch (e) {
        console.error("Remove table failed", e);
      }
    },
    [selectedDataset],
  );

  const addJoin = useCallback(
    async (
      leftTable: string,
      leftCol: string,
      rightTable: string,
      rightCol: string,
      joinType: string,
    ) => {
      if (!selectedDataset) return;
      try {
        const newJoin = await createJoin(selectedDataset.id, {
          left_table: leftTable,
          left_column: leftCol,
          right_table: rightTable,
          right_column: rightCol,
          join_type: joinType,
        });
        setJoins((prev) => [...prev, newJoin]);
      } catch (e) {
        console.error("Create join failed", e);
      }
    },
    [selectedDataset],
  );

  const removeJoin = useCallback(
    async (joinId: string) => {
      if (!selectedDataset) return;

      // 1. Optimistic Update: Remove immediately from UI
      const previousJoins = joins;
      setJoins((prev) => prev.filter((j) => j.id !== joinId));

      try {
        // 2. Call API
        await deleteJoin(selectedDataset.id, joinId);

        // 3. Sync with backend (ensure truth)
        const freshJoins = await getJoins(selectedDataset.id);
        setJoins(freshJoins);
      } catch (e) {
        console.error("Failed to delete join", e);
        // Revert on failure
        setJoins(previousJoins);
        alert("Failed to delete join. Please try again.");
      }
    },
    [selectedDataset, joins],
  );

  const updateColumnConfig = useCallback(
    async (payload: ColumnConfigPayload) => {
      if (!selectedDataset) return;
      try {
        await saveColumnConfig(selectedDataset.id, payload);
      } catch (e) {
        console.error("Save column config failed", e);
      }
    },
    [selectedDataset],
  );

  // --- Visual Joins ---
  const [cachedColumns, setCachedColumns] = useState<
    Record<string, ColumnMetadata[]>
  >({});

  const registerTableColumns = useCallback(
    (tableName: string, columns: ColumnMetadata[]) => {
      setCachedColumns((prev) => {
        // Only update if changed to avoid render loops
        if (JSON.stringify(prev[tableName]) === JSON.stringify(columns)) {
          return prev;
        }
        return { ...prev, [tableName]: columns };
      });
    },
    [],
  );

  // Join Creation State
  const [pendingJoinSource, setPendingJoinSource] =
    useState<SelectedObject | null>(null);

  const value = {
    datasets,
    selectedDataset,
    loadDataset,
    schemas,
    tables,
    selectedSchema,
    setSelectedSchema,
    canvasTables,
    joins,
    refreshCanvas,
    dropTableOnCanvas,
    updateTablePosition,
    removeTable,
    addJoin,
    removeJoin,
    selection,
    setSelection,
    updateColumnConfig,
    semanticTypes,

    // Semantic Editor
    selectedTable,
    columnMappings,
    isLoadingColumns,
    dirtyMappings,
    isDirty,
    updateMapping,
    saveChanges,
    discardChanges,

    pendingJoinSource,
    setPendingJoinSource,
    cachedColumns,
    registerTableColumns,
    semanticUpdateVersion,
  };

  return (
    <SemanticContext.Provider value={value}>
      {children}
    </SemanticContext.Provider>
  );
}

export function useSemantic() {
  const context = useContext(SemanticContext);
  if (context === undefined) {
    throw new Error("useSemantic must be used within a SemanticProvider");
  }
  return context;
}
