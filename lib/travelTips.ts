// lib/travelTips.ts
// Content lives in the Supabase `travel_tips` table (see
// docs/architecture/travel-tips-backend.md), edited via the authenticated
// /admin/travel-tips page. Writes are live immediately since this is a static
// export with no server (see next.config.ts), so both the admin page and
// the public site fetch directly from Supabase in the browser.
import { supabase } from "./supabaseClient";

export type TipItem = { label: string; detail: string };
export type TipCategory = { title: string; items: TipItem[] };
export type TripTips = { slug: string; title: string; categories: TipCategory[] };

export async function getTravelTips(): Promise<TripTips[]> {
  const { data, error } = await supabase
    .from("travel_tips")
    .select("slug, title, categories")
    .order("title", { ascending: true });

  if (error) throw error;
  return (data ?? []) as TripTips[];
}
