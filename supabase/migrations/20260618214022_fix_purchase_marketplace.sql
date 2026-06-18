-- Fix casting of moves from jsonb to text[] in purchase_marketplace_listing function
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
    SELECT seller_address, price, type, asset_id, quantity, pokemon_data
    INTO v_seller_address, v_price, v_type, v_asset_id, v_quantity, v_pokemon_data
    FROM marketplace_listings
    WHERE id = p_listing_id AND status = 'active'
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'listing_not_active');
    END IF;

    IF v_seller_address = p_buyer_address THEN
        RETURN jsonb_build_object('success', false, 'error', 'cannot_buy_own_listing');
    END IF;

    SELECT save_data INTO v_buyer_save FROM player_saves WHERE wallet_address = p_buyer_address;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'buyer_not_found');
    END IF;

    v_buyer_coins := COALESCE((v_buyer_save->'economy_data'->>'coins')::INT, 0);
    IF v_buyer_coins < v_price THEN
        RETURN jsonb_build_object('success', false, 'error', 'insufficient_funds');
    END IF;

    SELECT save_data INTO v_seller_save FROM player_saves WHERE wallet_address = v_seller_address;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'seller_not_found');
    END IF;

    -- Deducir monedas al comprador
    v_buyer_save = jsonb_set(
        v_buyer_save, 
        ARRAY['economy_data','coins'], 
        to_jsonb(v_buyer_coins - v_price)
    );

    -- Pokémon: Añadir a la PC del comprador
    IF NOT (v_buyer_save ? 'pc_pokemon') THEN
        v_buyer_save = jsonb_set(v_buyer_save, ARRAY['pc_pokemon'], '[]'::jsonb);
    END IF;
    v_buyer_save = jsonb_set(
        v_buyer_save, 
        ARRAY['pc_pokemon'], 
        (v_buyer_save->'pc_pokemon') || v_pokemon_data
    );

    -- Pagar al vendedor (aplicando comisión del 5%)
    v_tax_amount := floor(v_price * 0.05);
    v_seller_payout := v_price - v_tax_amount;

    v_seller_save = jsonb_set(
        v_seller_save, 
        ARRAY['economy_data','coins'], 
        to_jsonb(COALESCE((v_seller_save->'economy_data'->>'coins')::INT, 0) + v_seller_payout)
    );

    UPDATE player_saves SET save_data = v_buyer_save, updated_at = NOW() WHERE wallet_address = p_buyer_address;
    UPDATE player_saves SET save_data = v_seller_save, updated_at = NOW() WHERE wallet_address = v_seller_address;

    UPDATE marketplace_listings SET status = 'sold' WHERE id = p_listing_id;

    INSERT INTO marketplace_history (buyer_address, buyer_name, seller_address, seller_name, type, asset_id, quantity, price)
    VALUES (p_buyer_address, p_buyer_name, v_seller_address, COALESCE(v_seller_save->>'name', 'Tamer'), v_type, v_asset_id, v_quantity, v_price);

    INSERT INTO captured_monsters (id_captura, id_jugador, especie_id, nivel, xp, hp_actual, iv_hp, iv_ataque, iv_defensa, iv_velocidad, es_shiny, moves, is_team, team_order, unlocked_slots, held_items)
    VALUES (
        COALESCE((v_pokemon_data->>'id_captura')::UUID, gen_random_uuid()),
        p_buyer_address,
        COALESCE(
            (v_pokemon_data->>'especie_id')::INT,
            (SELECT id FROM pokemon_species WHERE name = LOWER(v_pokemon_data->>'id')),
            (SELECT id FROM pokemon_species WHERE name = LOWER(v_asset_id)),
            25
        ),
        COALESCE((v_pokemon_data->>'level')::INT, 1),
        COALESCE((v_pokemon_data->>'xp')::INT, 0),
        COALESCE((v_pokemon_data->>'hp')::INT, 10),
        COALESCE((v_pokemon_data->'ivs'->>'hp')::INT, 15),
        COALESCE((v_pokemon_data->'ivs'->>'attack')::INT, 15),
        COALESCE((v_pokemon_data->'ivs'->>'defense')::INT, 15),
        COALESCE((v_pokemon_data->'ivs'->>'speed')::INT, 15),
        COALESCE((v_pokemon_data->>'is_shiny')::BOOLEAN, false),
        ARRAY(SELECT jsonb_array_elements_text(COALESCE(v_pokemon_data->'moves', '[]'::jsonb))),
        false,
        0,
        COALESCE((v_pokemon_data->>'unlocked_slots')::INT, 2),
        COALESCE(v_pokemon_data->'held_items', '[null, null, null, null]'::jsonb)
    )
    ON CONFLICT (id_captura) DO UPDATE
    SET id_jugador = p_buyer_address, is_team = false, team_order = 0;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;