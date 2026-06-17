# Guía de Integración con World App (Worldcoin MiniKit JS)

Esta guía documenta los pasos necesarios para integrar de forma exitosa cualquier aplicación web (en este caso desarrollada en React/Next.js) con **World App** mediante el SDK oficial de **MiniKit**.

Aquí se detalla la configuración en el portal de desarrolladores de Worldcoin, la instalación de dependencias, la lógica de inicialización en el frontend, la autenticación nativa por firma de billetera (SIWE), la persistencia de datos del usuario utilizando la dirección de su billetera en una base de datos (Supabase) y la función nativa para compartir contenido.

---

## Índice
1. [Instalación del SDK](#1-instalación-del-sdk)
2. [Configuración en Worldcoin Developer Portal](#2-configuración-en-worldcoin-developer-portal)
3. [Inicialización del SDK (Bootstrap Component)](#3-inicialización-del-sdk-bootstrap-component)
4. [Detección y Carga Segura de MiniKit](#4-detección-y-carga-segura-de-minikit)
5. [Autenticación Nativa de Billetera (SIWE - Sign In With Ethereum)](#5-autenticación-nativa-de-billetera-siwe---sign-in-with-ethereum)
6. [Diseño de la Base de Datos para Persistencia](#6-diseño-de-la-base-de-dos-para-persistencia)
7. [Compartir Contenido de Forma Nativa](#7-compartir-contenido-de-forma-nativa)
8. [Pruebas Locales y Depuración](#8-pruebas-locales-y-depuración)

---

## 1. Instalación del SDK

Para comenzar, instala el SDK oficial de MiniKit en tu nuevo proyecto web.

```bash
npm install @worldcoin/minikit-js
```

---

## 2. Configuración en Worldcoin Developer Portal

Para permitir que World App cargue tu aplicación dentro de su iframe nativo y valide las solicitudes del SDK, debes registrar tu proyecto:

1. Ve al [Developer Portal de Worldcoin](https://developer.worldcoin.org/).
2. Crea un nuevo proyecto.
3. Dirígete a la sección **Mini App**:
   * Obtén tu **App ID** (tiene un formato similar a `app_6a783c64810d430744512e4207e07fce`).
   * Configura la URL de tu aplicación (para producción y entorno de pruebas).
   * Define los URIs de redirección autorizados si planeas implementar flujos OAuth o validaciones web.

---

## 3. Inicialización del SDK (Bootstrap Component)

El SDK de MiniKit debe instalarse en el cliente una sola vez al cargar la aplicación. Como Next.js utiliza Server-Side Rendering (SSR) de forma predeterminada, debes asegurarte de que MiniKit solo se inicialice en el navegador (`window !== 'undefined'`).

### A. Crear el componente de inicialización
Crea un archivo llamado `components/MiniKitBootstrap.tsx`:

```tsx
"use client";

import { useEffect, useState } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';

export default function MiniKitBootstrap({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (typeof window !== 'undefined') {
            try {
                // IMPORTANTE: Reemplaza con tu App ID obtenido del Developer Portal
                MiniKit.install('app_6a783c64810d430744512e4207e07fce');
                console.log("MiniKit instalado exitosamente!");
            } catch (err) {
                console.error("Error al instalar MiniKit:", err);
            }
        }
    }, []);

    if (!mounted) {
        return null;
    }

    return <>{children}</>;
}
```

### B. Registrar el Bootstrap en el Root Layout
Envuelve la aplicación dentro del componente en tu archivo principal de diseño (por ejemplo, `app/layout.tsx`):

```tsx
import MiniKitBootstrap from "../components/MiniKitBootstrap";

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es">
            <body>
                <MiniKitBootstrap>
                    {children}
                </MiniKitBootstrap>
            </body>
        </html>
    );
}
```

---

## 4. Detección y Carga Segura de MiniKit

Para evitar errores en navegadores web tradicionales (fuera de World App), comprueba si MiniKit está realmente instalado antes de ejecutar cualquier acción interactiva:

```typescript
import { useState, useEffect } from 'react';

const [isMiniKitInstalled, setIsMiniKitInstalled] = useState(false);

useEffect(() => {
    const checkMiniKit = async () => {
        try {
            // Importación dinámica para evitar fallos de SSR
            const { MiniKit } = await import('@worldcoin/minikit-js');
            if (MiniKit.isInstalled()) {
                setIsMiniKitInstalled(true);
            }
        } catch (err) {
            console.log("MiniKit no está disponible:", err);
        }
    };
    checkMiniKit();
}, []);
```

---

## 5. Autenticación Nativa de Billetera (SIWE - Sign In With Ethereum)

World App permite autenticar al usuario pidiéndole que firme un mensaje con la dirección de su billetera sin necesidad de introducir contraseñas. Esto se realiza usando Sign-In With Ethereum (SIWE) a través de `MiniKit.walletAuth`.

### Implementación del Login en el Frontend

```typescript
const handleWorldAppLogin = async () => {
    try {
        const { MiniKit } = await import('@worldcoin/minikit-js');
        
        if (!MiniKit.isInstalled()) {
            alert("MiniKit no está instalado. Asegúrate de abrir la app dentro de la World App.");
            return;
        }

        // Generar un nonce aleatorio para evitar ataques de replay
        const nonce = Math.random().toString(36).substring(2, 15);

        // Solicitar firma/autenticación de billetera a World App
        const result = await MiniKit.walletAuth({
            nonce: nonce,
            statement: "Inicia sesión en mi aplicación",
            expirationTime: new Date(Date.now() + 1000 * 60 * 60 * 24), // Validez de 24 horas
        });

        // Verificar si el usuario canceló la operación
        if (result.executedWith === "fallback") {
            console.warn("La firma de la billetera fue cancelada por el usuario.");
            return;
        }

        if (result.data && result.data.address) {
            const walletAddress = result.data.address;
            console.log("¡Autenticación exitosa! Dirección de billetera:", walletAddress);
            
            // Enviar la dirección a tu backend para iniciar sesión o registrar al usuario
            await authenticateUserInDatabase(walletAddress);
        } else {
            console.error("No se pudo obtener la dirección de billetera de la respuesta.");
        }
    } catch (err) {
        console.error("Error durante el login con World App:", err);
    }
};
```

---

## 6. Diseño de la Base de Datos para Persistencia

Para guardar el progreso de los usuarios de forma segura y asociarlos a su billetera World Chain, puedes estructurar tu base de datos relacional (por ejemplo, Supabase/PostgreSQL) de la siguiente manera.

### Esquema SQL Replicable

```sql
-- 1. Tabla de partidas del jugador
CREATE TABLE player_saves (
    wallet_address TEXT PRIMARY KEY,                       -- Dirección de billetera (formato hexadecimal) obtenido de MiniKit
    save_data JSONB NOT NULL,                              -- Objeto JSON con el estado de inventario, dinero, coordenadas, etc.
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar Row Level Security (RLS) si se usa Supabase
ALTER TABLE player_saves ENABLE ROW LEVEL SECURITY;

-- 2. Tabla para elementos específicos con alta frecuencia de consulta (ej. Pokémon capturados, ítems especiales, coleccionables)
CREATE TABLE captured_monsters (
    id_captura UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- ID único para cada entidad
    id_jugador TEXT REFERENCES player_saves(wallet_address) ON DELETE CASCADE, -- Clave foránea al wallet
    especie_id INTEGER NOT NULL,                           -- ID de especie/objeto
    nivel INTEGER NOT NULL DEFAULT 1,
    xp INTEGER NOT NULL DEFAULT 0,
    hp_actual INTEGER NOT NULL,
    iv_hp INTEGER NOT NULL,
    iv_ataque INTEGER NOT NULL,
    iv_defensa INTEGER NOT NULL,
    iv_velocidad INTEGER NOT NULL,
    es_shiny BOOLEAN NOT NULL DEFAULT false,
    moves JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_team BOOLEAN NOT NULL DEFAULT false,
    team_order INTEGER NOT NULL DEFAULT 0,
    unlocked_slots INTEGER NOT NULL DEFAULT 2,
    held_items JSONB NOT NULL DEFAULT '[null, null, null, null]'::jsonb
);

ALTER TABLE captured_monsters ENABLE ROW LEVEL SECURITY;
```

### Flujo de Login y Registro en el Servidor (TypeScript/Supabase)

```typescript
import { createClient } from '@supabase/supabase-base-js';

const supabase = createClient('TU_SUPABASE_URL', 'TU_SUPABASE_ANON_KEY');

const authenticateUserInDatabase = async (address: string) => {
    // Buscar si ya existe una partida guardada con ese wallet
    const { data, error } = await supabase
        .from('player_saves')
        .select('wallet_address, save_data')
        .ilike('wallet_address', address)
        .maybeSingle();

    if (data && data.save_data) {
        // Cargar partida existente
        console.log("Partida cargada para:", data.wallet_address);
        // Guardar dirección de sesión en el almacenamiento local
        localStorage.setItem('pixel_tamer_active_wallet', data.wallet_address);
        return data.save_data;
    } else {
        // El usuario es nuevo, inicializar registro con datos por defecto
        const defaultSave = {
            name: `Tamer-${address.slice(0, 6)}`,
            time: 0,
            player_coordinates: [100, 100],
            economy_data: { coins: 500, level: 1 }
        };

        const { error: insertError } = await supabase
            .from('player_saves')
            .upsert({
                wallet_address: address,
                save_data: defaultSave
            }, { onConflict: 'wallet_address' });

        if (insertError) {
            throw new Error("Error al inicializar la base de datos para el usuario.");
        }

        localStorage.setItem('pixel_tamer_active_wallet', address);
        return defaultSave;
    }
};
```

---

## 7. Compartir Contenido de Forma Nativa

Puedes hacer uso de la interfaz nativa de World App para compartir un enlace o texto de invitación. Esto es muy útil para mecánicas virales, referidos o simplemente compartir capturas del juego:

```typescript
const handleShareContent = async (message: string, shareUrl: string) => {
    try {
        const { MiniKit } = await import('@worldcoin/minikit-js');
        if (MiniKit.isInstalled()) {
            await MiniKit.share({
                text: message,    // Mensaje que verá el receptor (ej. "¡Mira mi nuevo récord en Pixel Tamer!")
                url: shareUrl     // Enlace a tu aplicación web
            });
            console.log("Compartido exitosamente en World App");
        } else {
            console.warn("MiniKit no está disponible para compartir.");
        }
    } catch (err) {
        console.error("Error al compartir en World App:", err);
    }
};
```

---

## 8. Pruebas Locales y Depuración

1. **Uso de HTTPS (Requerido):** World App requiere que todas las mini apps carguen sobre conexiones HTTPS seguras. Si realizas pruebas locales en `http://localhost:3000`, debes exponer tu servidor local de forma segura utilizando herramientas como:
   * **ngrok:** `ngrok http 3000`
   * **localtunnel:** `lt --port 3000`
2. **Developer Portal Simulator:**
   * Abre la configuración de tu aplicación en el Developer Portal de Worldcoin.
   * Introduce la URL HTTPS generada en el paso anterior.
   * Utiliza el botón **Test in Simulator** para abrir tu aplicación dentro del entorno simulado de World App, lo que te permitirá depurar los eventos de `walletAuth` y `share` utilizando la consola del navegador.
3. **Control de Errores de Mixed Content:** Asegúrate de que todas las APIs externas que tu frontend consulte utilicen HTTPS; de lo contrario, el navegador bloqueará las solicitudes por políticas de seguridad de contenido mixto al correr dentro de World App.
