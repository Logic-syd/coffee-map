// src/lib/useSearch.ts
"use client";
import FlexSearch from "flexsearch";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

// 定义场馆类型
interface Venue {
  id: string;
  name_zh: string;
  name_ja?: string;
  name_ko?: string;
  [key: string]: unknown;
}

export function useSearch() {
  const [list, setList] = useState<Venue[]>([]);
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
      idx.add(i, [v.name_zh, v.name_ja, v.name_ko].filter(Boolean).join(" "));
    });
    return idx;
  }, [list]);

  // 3. 提供 search 函数
  function search(q: string) {
    if (!q) return list;
    const ids = index.search(q);
    // 将返回的ID转换为number类型，因为我们在索引时使用的是数组索引
    return ids.map((id) => list[Number(id)]).filter(Boolean);
  }

  return { ready, search };
}
