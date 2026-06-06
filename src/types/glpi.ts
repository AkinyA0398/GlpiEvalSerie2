// ── Entités GLPI génériques ────────────────────────────────────────────────

export interface GlpiEntity {
    id: number;
    name: string;
}

export interface GlpiResponse {
    id: number;
}

// ── CSV Asset (Feuille 1) ──────────────────────────────────────────────────

export interface CsvAsset {
    Name: string;
    Status: string;
    Location: string;
    Manufacturer: string;
    Item_Type: string;
    Model: string;
    Inventory_Number: string;
    User: string;
}

// ── CSV Ticket (Feuille 2) ─────────────────────────────────────────────────

export interface CsvTicket {
    Ref_Ticket: string;
    Date: string;
    Heure: string;
    Type: string;
    Titre: string;
    Description: string;
    Status: string;
    Priority: string;
    Items: string; // JSON stringified array
}

// ── CSV Coût (Feuille 3) ───────────────────────────────────────────────────

export interface CsvCost {
    Num_Ticket: string;
    Cost_Type: string;
    Amount: string;
    Description: string;
}

// ── Mapping des endpoints GLPI ─────────────────────────────────────────────

export const GLPI_ENTITIES = {
    LOCATION: "Location",
    MANUFACTURER: "Manufacturer",
    USER: "User",
    COMPUTER_MODEL: "ComputerModel",
    MONITOR_MODEL: "MonitorModel",
    COMPUTER: "Computer",
    MONITOR: "Monitor",
    TICKET: "Ticket",
    DOCUMENT: "Document",
    DOCUMENT_ITEM: "Document_Item",
} as const;

// ── Refs retournées par prepareAsset ───────────────────────────────────────

export interface AssetRefs {
    locationId: number;
    manufacturerId: number;
    modelId: number;
    userId: number | null;
}

// ── Item normalisé (renvoyé par le backend vers le front) ──────────────────

export interface Item {
    id: number;
    name: string;
    status: string;
    location: string;
    manufacturer: string;
    item_type: string;
    model: string;
    inventory_number: string;
    user_name: string;
}

// ── Ticket normalisé ──────────────────────────────────────────────────────

export interface Ticket {
    id: number;
    ref_ticket: string;
    ticket_date: string;
    ticket_time: string;
    ticket_type: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    created_at: string;
    items: string[];
    costs?: TicketCost[];
}

export interface TicketCost {
    id: number;
    cost_type: string;
    amount: number;
    description: string;
}

// ── Stats Dashboard ───────────────────────────────────────────────────────

export interface DashboardStats {
    items: {
        total: number;
        byType: { label: string; count: number }[];
        byStatus: { label: string; count: number }[];
    };
    tickets: {
        total: number;
        byType: { label: string; count: number }[];
        byStatus: { label: string; count: number }[];
        byPriority: { label: string; count: number }[];
    };
}

// ── Import result ─────────────────────────────────────────────────────────

export interface ImportResult {
    file: string;
    type: 'items' | 'tickets' | 'costs' | 'images' | 'unknown';
    count: number;
    skipped?: number;
}

export interface ImportResponse {
    message: string;
    results: ImportResult[];
}
