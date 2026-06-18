-- 1. Tabla de listados activos/inactivos de venta
CREATE TABLE IF NOT EXISTS marketplace_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_address TEXT NOT NULL REFERENCES player_saves(wallet_address) ON DELETE CASCADE,
    seller_name TEXT NOT NULL,
    type TEXT NOT NULL,          -- 'item' o 'pokemon'
    asset_id TEXT NOT NULL,      -- ID del ítem ('rare_candy') o especie de Pokémon ('pikachu')
    pokemon_data JSONB,          -- Detalles completos del Pokémon (null si es un ítem)
    quantity INTEGER NOT NULL DEFAULT 1,
    price INTEGER NOT NULL CHECK (price > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status ON marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_seller ON marketplace_listings(seller_address);

-- 2. Tabla de historial de transacciones de compra/venta
CREATE TABLE IF NOT EXISTS marketplace_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_address TEXT NOT NULL,
    buyer_name TEXT NOT NULL,
    seller_address TEXT NOT NULL,
    seller_name TEXT NOT NULL,
    type TEXT NOT NULL,
    asset_id TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Habilitar Seguridad de Nivel de Fila (RLS)
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_history ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para el acceso desde el frontend
DROP POLICY IF EXISTS "Permitir lectura de listados activos a todos" ON marketplace_listings;
CREATE POLICY "Permitir lectura de listados activos a todos" ON marketplace_listings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir inserción de listados" ON marketplace_listings;
CREATE POLICY "Permitir inserción de listados" ON marketplace_listings FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir actualizar/retirar sus propios listados" ON marketplace_listings;
CREATE POLICY "Permitir actualizar/retirar sus propios listados" ON marketplace_listings FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Permitir lectura de historial" ON marketplace_history;
CREATE POLICY "Permitir lectura de historial" ON marketplace_history FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir inserción de historial" ON marketplace_history;
CREATE POLICY "Permitir inserción de historial" ON marketplace_history FOR INSERT WITH CHECK (true);

-- 3. Función RPC transaccional segura (Atomic Purchases)
CREATE OR REPLACE FUNCTION purchase_marketplace_listing(
    p_listing_id UUID,
    p_buyer_address TEXT,
    p_buyer_name TEXT
) RETURNS JSONB AS $$
DECLARE
    v_seller_address TEXT;
    v_price INT;
    v_type TEXT;
    v_asset_id TEXT;
    v_quantity INT;
    v_pokemon_data JSONB;
    v_buyer_save JSONB;
    v_seller_save JSONB;
    v_buyer_coins INT;
    v_tax_amount INT;
    v_seller_payout INT;
BEGIN
    -- Obtener y bloquear oferta de forma exclusiva para evitar race conditions
    SELECT seller_address, price, type, asset_id, quantity, pokemon_data
    INTO v_seller_address, v_price, v_type, v_asset_id, v_quantity, v_pokemon_data
    FROM marketplace_listings
    WHERE id = p_listing_id AND status = 'active'
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'listing_not_active');
    END IF;

    -- Validar que el vendedor no sea el mismo comprador
    IF v_seller_address = p_buyer_address THEN
        RETURN jsonb_build_object('success', false, 'error', 'cannot_buy_own_listing');
    END IF;

    -- Obtener datos de guardado del comprador
    SELECT save_data INTO v_buyer_save
    FROM player_saves
    WHERE wallet_address = p_buyer_address;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'buyer_not_found');
    END IF;

    -- Validar saldo del comprador
    v_buyer_coins := COALESCE((v_buyer_save->'economy_data'->>'coins')::INT, 0);
    IF v_buyer_coins < v_price THEN
        RETURN jsonb_build_object('success', false, 'error', 'insufficient_funds');
    END IF;

    -- Obtener datos de guardado del vendedor
    SELECT save_data INTO v_seller_save
    FROM player_saves
    WHERE wallet_address = v_seller_address;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'seller_not_found');
    END IF;

    -- Deducir monedas al comprador
    v_buyer_save = jsonb_set(
        v_buyer_save, 
        ARRAY['economy_data','coins'], 
        to_jsonb(v_buyer_coins - v_price)
    );

    IF v_type = 'item' THEN
        -- Asegurar estructura de inventario del comprador
        IF NOT (v_buyer_save ? 'inventory_data') THEN
            v_buyer_save = jsonb_set(v_buyer_save, ARRAY['inventory_data'], '{}'::jsonb);
        END IF;
        IF NOT (v_buyer_save->'inventory_data' ? 'items') THEN
            v_buyer_save = jsonb_set(v_buyer_save, ARRAY['inventory_data','items'], '{}'::jsonb);
        END IF;
        
        -- Añadir cantidad del ítem comprado
        v_buyer_save = jsonb_set(
            v_buyer_save, 
            ARRAY['inventory_data', 'items', v_asset_id], 
            to_jsonb(COALESCE((v_buyer_save->'inventory_data'->'items'->>v_asset_id)::INT, 0) + v_quantity)
        );
    ELSE
        -- Pokémon: Añadir a la PC del comprador
        IF NOT (v_buyer_save ? 'pc_pokemon') THEN
            v_buyer_save = jsonb_set(v_buyer_save, ARRAY['pc_pokemon'], '[]'::jsonb);
        END IF;
        v_buyer_save = jsonb_set(
            v_buyer_save, 
            ARRAY['pc_pokemon'], 
            (v_buyer_save->'pc_pokemon') || v_pokemon_data
        );
    END IF;

    -- Pagar al vendedor (aplicando comisión del 5% para quemado/impuesto)
    v_tax_amount := floor(v_price * 0.05);
    v_seller_payout := v_price - v_tax_amount;

    v_seller_save = jsonb_set(
        v_seller_save, 
        ARRAY['economy_data','coins'], 
        to_jsonb(COALESCE((v_seller_save->'economy_data'->>'coins')::INT, 0) + v_seller_payout)
    );

    -- Guardar cambios de guardado
    UPDATE player_saves SET save_data = v_buyer_save, updated_at = NOW() WHERE wallet_address = p_buyer_address;
    UPDATE player_saves SET save_data = v_seller_save, updated_at = NOW() WHERE wallet_address = v_seller_address;

    -- Marcar oferta como vendida
    UPDATE marketplace_listings SET status = 'sold' WHERE id = p_listing_id;

    -- Registrar la transacción en el historial
    INSERT INTO marketplace_history (buyer_address, buyer_name, seller_address, seller_name, type, asset_id, quantity, price)
    VALUES (p_buyer_address, p_buyer_name, v_seller_address, COALESCE(v_seller_save->>'name', 'Tamer'), v_type, v_asset_id, v_quantity, v_price);

    -- Insertar sub-entidad en captured_monsters si fue una venta de Pokémon
    IF v_type = 'pokemon' THEN
        INSERT INTO captured_monsters (id_captura, id_jugador, especie_id, nivel, xp, hp_actual, iv_hp, iv_ataque, iv_defensa, iv_velocidad, es_shiny, moves, is_team, team_order, unlocked_slots, held_items)
        VALUES (
            (v_pokemon_data->>'id_captura')::UUID,
            p_buyer_address,
            (v_pokemon_data->>'especie_id')::INT,
            COALESCE((v_pokemon_data->>'level')::INT, 1),
            COALESCE((v_pokemon_data->>'xp')::INT, 0),
            COALESCE((v_pokemon_data->>'hp')::INT, 10),
            COALESCE((v_pokemon_data->'ivs'->>'hp')::INT, 15),
            COALESCE((v_pokemon_data->'ivs'->>'attack')::INT, 15),
            COALESCE((v_pokemon_data->'ivs'->>'defense')::INT, 15),
            COALESCE((v_pokemon_data->'ivs'->>'speed')::INT, 15),
            COALESCE((v_pokemon_data->>'is_shiny')::BOOLEAN, false),
            COALESCE(v_pokemon_data->'moves', '[]'::jsonb),
            false,
            0,
            COALESCE((v_pokemon_data->>'unlocked_slots')::INT, 2),
            COALESCE(v_pokemon_data->'held_items', '[null, null, null, null]'::jsonb)
        )
        ON CONFLICT (id_captura) DO UPDATE
        SET id_jugador = p_buyer_address, is_team = false, team_order = 0;
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;
