import pokeballs from '../../public/assets/items/pokeballs.json';
import potions from '../../public/assets/items/potions.json';
import boosts from '../../public/assets/items/boosts.json';
import materials from '../../public/assets/items/materials.json';

export interface InventorySaveData {
    items?: Record<string, number>;
}

export class Inventory {
    public items: Record<string, number> = {};
    private itemCatalog: Record<string, any> = {};

    constructor(saveData?: InventorySaveData) {
        this.loadCatalogs();
        if (saveData) {
            this.items = saveData.items ?? {};
        } else {
            this.items = {};
        }
    }

    private loadCatalogs(): void {
        this.itemCatalog = {
            ...(pokeballs as Record<string, any>),
            ...(potions as Record<string, any>),
            ...(boosts as Record<string, any>),
            ...(materials as Record<string, any>),
        };
    }

    public addItem(itemId: string, quantity: number = 1): number {
        const current = this.items[itemId] ?? 0;
        this.items[itemId] = current + quantity;
        return this.items[itemId];
    }

    public removeItem(itemId: string, quantity: number = 1): boolean {
        const current = this.items[itemId] ?? 0;
        if (current >= quantity) {
            this.items[itemId] = current - quantity;
            if (this.items[itemId] === 0) {
                delete this.items[itemId];
            }
            return true;
        }
        return false;
    }

    public hasItem(itemId: string, quantity: number = 1): boolean {
        return (this.items[itemId] ?? 0) >= quantity;
    }

    public getQuantity(itemId: string): number {
        return this.items[itemId] ?? 0;
    }

    public getItemInfo(itemId: string): any {
        return this.itemCatalog[itemId] || {};
    }

    public getAllItems(): any[] {
        const result: any[] = [];
        for (const [itemId, quantity] of Object.entries(this.items)) {
            const info = this.getItemInfo(itemId);
            result.push({
                id: itemId,
                quantity,
                ...info
            });
        }
        return result;
    }

    public toSaveData(): InventorySaveData {
        return {
            items: { ...this.items }
        };
    }
}
