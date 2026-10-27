"use client";

import Link from "next/link";
import { useShopping } from "@/components/recipe-actions";
import { clearDone, clearShopping, toggleShopping, type ShoppingItem } from "@/lib/device-store";

export function ShoppingList() {
  const items = useShopping();
  if (!items.length) {
    return <p className="mt-4 text-muted">Tap &ldquo;Add to list&rdquo; on any recipe to collect its ingredients here.</p>;
  }
  const groups = items.reduce<Record<string, ShoppingItem[]>>((acc, item) => {
    (acc[item.recipeTitle] ??= []).push(item);
    return acc;
  }, {});
  const done = items.filter((i) => i.done).length;

  return (
    <div className="mt-6">
      <p className="text-sm text-muted">{items.length - done} to buy · {done} ticked</p>
      {Object.entries(groups).map(([title, list]) => (
        <section key={title} className="mt-6">
          <h2 className="text-lg font-semibold"><Link href={list[0].href} className="hover:underline">{title}</Link></h2>
          <ul className="mt-2 divide-y divide-line rounded-2xl border border-line">
            {list.map((item) => (
              <li key={item.id}>
                <label className="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-2">
                  <input type="checkbox" checked={item.done} onChange={() => toggleShopping(item.id)} className="h-5 w-5 accent-[var(--accent)]" />
                  <span className={item.done ? "text-muted line-through" : ""}>{item.text}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <div className="mt-6 flex gap-3">
        <button onClick={clearDone} disabled={!done} className="min-h-12 flex-1 rounded-full border border-line font-semibold disabled:opacity-40">Clear ticked</button>
        <button onClick={clearShopping} className="min-h-12 flex-1 rounded-full bg-ink font-semibold text-bg">Clear all</button>
      </div>
    </div>
  );
}
