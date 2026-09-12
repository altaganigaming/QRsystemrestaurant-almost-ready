"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/components/cart-provider";

export default function TableCapture() {
  const params = useSearchParams();
  const { setTableCode } = useCart();
  useEffect(() => {
    const code = params.get("table");
    if (code) setTableCode(code.toUpperCase());
  }, [params, setTableCode]);
  return null;
}
