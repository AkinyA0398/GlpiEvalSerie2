export interface ItemDetails {
    id: number;
    name: string;
    item_type: string;
    status: string;
    location: string;
    manufacturer: string;
    model: string;
    inventory_number: string;
    user_name: string;

    // optional extra fields (best-effort)
    serial: string;
    otherserial: string;
    created_at?: string;
    description?: string;
}

