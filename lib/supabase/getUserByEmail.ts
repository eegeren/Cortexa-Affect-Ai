"use server";

import type { SupabaseClient } from "@supabase/supabase-js";

const PAGE_SIZE = 200;

export async function getUserByEmail(
  client: SupabaseClient,
  email: string
) {
  let page = 1;
  const target = email.trim().toLowerCase();

  while (true) {
    const { data, error } = await client.auth.admin.listUsers({
      page,
      perPage: PAGE_SIZE,
    });

    if (error) {
      throw error;
    }

    const users = data?.users ?? [];
    const match = users.find((u) => u.email?.toLowerCase() === target);
    if (match) {
      return match;
    }

    if (users.length < PAGE_SIZE) {
      return null;
    }
    page += 1;
  }
}
