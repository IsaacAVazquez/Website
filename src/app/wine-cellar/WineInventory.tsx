"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  useLocalStorageString,
  useLocalStoragePersistenceStatus,
} from "@/hooks/useLocalStorageString";
import {
  loadWineInventory,
  parseWineInventory,
  saveWineInventory,
  WINE_INVENTORY_KEY,
  type InventoryBottle,
} from "@/lib/wineInventory";
import { prefixedId } from "@/lib/utils";
import { WINE_TYPES, WINE_TYPE_LABELS } from "@/lib/wineCellar";
import type { WineType } from "@/types/wine";

export function WineInventory({
  onOpen,
}: {
  onOpen: (bottle: InventoryBottle) => void;
}) {
  const raw = useLocalStorageString(WINE_INVENTORY_KEY, "[]");
  const bottles = useMemo(() => parseWineInventory(raw), [raw]);
  const persistence = useLocalStoragePersistenceStatus(WINE_INVENTORY_KEY);
  const [wishlist, setWishlist] = useState(false);
  const [name, setName] = useState("");
  const [producer, setProducer] = useState("");
  const [region, setRegion] = useState("");
  const [vintage, setVintage] = useState("");
  const [type, setType] = useState<WineType>("red");
  const [quantity, setQuantity] = useState("1");
  function update(id: string, fields: Partial<InventoryBottle>) {
    saveWineInventory(
      loadWineInventory().map((bottle) =>
        bottle.id === id ? { ...bottle, ...fields } : bottle,
      ),
    );
  }
  function add(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    saveWineInventory([
      ...loadWineInventory(),
      {
        id: prefixedId("stock"),
        name,
        producer,
        region,
        vintage: vintage ? Number(vintage) : null,
        varietal: "",
        type,
        price: null,
        quantity: wishlist ? 0 : Number(quantity),
        wishlist,
      },
    ]);
    setName("");
    setProducer("");
    setRegion("");
    setVintage("");
    setQuantity("1");
  }
  const visible = bottles.filter((bottle) => bottle.wishlist === wishlist);
  const total = bottles
    .filter((bottle) => !bottle.wishlist)
    .reduce((sum, bottle) => sum + bottle.quantity, 0);
  return (
    <section className="wc-inventory" aria-label="Bottle inventory">
      <h2>On the shelf and on the list</h2>
      <p className="wc-note">
        {total} {total === 1 ? "bottle" : "bottles"} on hand. Choose Open bottle
        to fill in a tasting, then save it to take one off the shelf.
      </p>
      <div className="wc-actions" role="group" aria-label="Inventory view">
        <button
          className="c97-btn-ghost"
          type="button"
          aria-pressed={!wishlist}
          onClick={() => setWishlist(false)}
        >
          Owned bottles
        </button>
        <button
          className="c97-btn-ghost"
          type="button"
          aria-pressed={wishlist}
          onClick={() => setWishlist(true)}
        >
          Wishlist
        </button>
      </div>
      {visible.length === 0 ? (
        <p className="wc-note">
          {wishlist
            ? "No wines on your wishlist yet."
            : "No bottles saved on the shelf yet."}
        </p>
      ) : (
        <ul className="wc-stock-list">
          {visible.map((bottle) => (
            <li key={bottle.id}>
              <div>
                <h3>{bottle.name}</h3>
                <p className="wc-note">
                  {[
                    bottle.producer,
                    bottle.vintage,
                    bottle.region,
                    WINE_TYPE_LABELS[bottle.type],
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <div className="wc-actions">
                {bottle.wishlist ? (
                  <button
                    className="c97-btn-ghost"
                    type="button"
                    onClick={() =>
                      update(bottle.id, { wishlist: false, quantity: 1 })
                    }
                  >
                    Bought a bottle
                  </button>
                ) : (
                  <>
                    <label className="wc-stock-quantity">
                      On hand
                      <input
                        className="c97-field"
                        aria-label={`Quantity of ${bottle.name}`}
                        type="number"
                        min="0"
                        max="999"
                        step="1"
                        value={bottle.quantity}
                        onChange={(e) =>
                          update(bottle.id, {
                            quantity: Number(e.target.value),
                          })
                        }
                      />
                    </label>
                    <button
                      className="c97-btn-ghost"
                      type="button"
                      disabled={bottle.quantity === 0}
                      aria-label={`Open bottle of ${bottle.name}`}
                      onClick={() => onOpen(bottle)}
                    >
                      Open bottle
                    </button>
                  </>
                )}
                <button
                  className="c97-btn-ghost"
                  type="button"
                  aria-label={`Remove ${bottle.name} from inventory`}
                  onClick={() =>
                    saveWineInventory(
                      loadWineInventory().filter(
                        (item) => item.id !== bottle.id,
                      ),
                    )
                  }
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <details className="wc-stock-add">
        <summary>
          Add {wishlist ? "a wine to the wishlist" : "bottles to the shelf"}
        </summary>
        <form className="wc-stock-form" aria-label={wishlist ? "New wishlist wine" : "New bottles"} onSubmit={add}>
          <label>
            Name
            <input
              className="c97-field"
              required
              maxLength={200}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            Producer
            <input
              className="c97-field"
              maxLength={200}
              value={producer}
              onChange={(e) => setProducer(e.target.value)}
            />
          </label>
          <label>
            Region
            <input
              className="c97-field"
              maxLength={200}
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            />
          </label>
          <label>
            Vintage
            <input
              className="c97-field"
              type="number"
              min="1800"
              max="2100"
              value={vintage}
              onChange={(e) => setVintage(e.target.value)}
            />
          </label>
          <label>
            Type
            <select
              className="c97-field"
              value={type}
              onChange={(e) => setType(e.target.value as WineType)}
            >
              {WINE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {WINE_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
          {!wishlist && (
            <label>
              Bottle quantity
              <input
                className="c97-field"
                type="number"
                min="1"
                max="999"
                step="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </label>
          )}
          <button className="c97-btn" type="submit">
            {wishlist ? "Save to wishlist" : "Add to shelf"}
          </button>
        </form>
      </details>
      {persistence === "memory-only" && (
        <p role="status" className="wc-note">
          Inventory changes last only while this tab is open because browser
          storage is unavailable.
        </p>
      )}
    </section>
  );
}
