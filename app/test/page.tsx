"use client";

import { createClient } from "@supabase/supabase-js";

export default function TestPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const testConnection = async () => {
    const { data, error } = await supabase.from("users").select("*");

    console.log("DATA:", data);
    console.log("ERROR:", error);
  };

  return (
    <div>
      <h1>Supabase Test</h1>

      <button
        onClick={testConnection}
        style={{
          display: "inline-block",
          padding: "12px 20px",
          marginTop: "10px",
          backgroundColor: "#0070f3",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "16px",
        }}
      >
        Test Connection
      </button>
    </div>
  );
}
