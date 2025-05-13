// src/lib/useSearch.ts
"use client";
import FlexSearch from "flexsearch";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useSearch() {
  const [list, setList] = useState<any[]>([]);
  const [ready, setReady] = useState(false);

  // 1. 拉全部数据一次
  useEffect(() => {
    supabase
      .from("venues")
      .select("*")
      .then(({ data }) => {
        setList(data || []);
        setReady(true);
      });
  }, []);

  // 2. 构建索引（多语言 name）
  const index = useMemo(() => {
    const idx = new FlexSearch.Index({ tokenize: "forward", preset: "match" });
    list.forEach((v, i) => {
      idx.add(i, [v.name_zh, v.name_ja, v.name_ko].join(" "));
    });
    return idx;
  }, [list]);

  // 3. 提供 search 函数
  function search(q: string) {
    if (!q) return list;
    const ids = index.search(q);
    return ids.map((id: number) => list[id]);
  }

  return { ready, search };
}
