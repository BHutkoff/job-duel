"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

export default function NewChallengePage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [user, setUser] = useState<any>(null);
  const [opponentEmail, setOpponentEmail] = useState("");

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
    };

    getUser();
  }, []);

  const handleCreateChallenge = async () => {
    if (!user) {
      alert("You must be logged in");
      return;
    }

    // 1. Find opponent by email
    const { data: opponent, error } = await supabase
      .from("users")
      .select("id")
      .eq("email", opponentEmail)
      .single();

    if (error || !opponent) {
      alert("Opponent not found");
      return;
    }

    // 2. Create challenge
    const { error: insertError } = await supabase.from("challenges").insert([
      {
        creator_id: user.id,
        opponent_id: opponent.id,
        status: "pending",
        start_date: new Date().toISOString(),
      },
    ]);

    if (insertError) {
      console.error(insertError);
      alert("Error creating challenge");
      return;
    }

    alert("Challenge sent!");
    setOpponentEmail("");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Create Challenge</h1>

      <input
        placeholder="Opponent Email"
        value={opponentEmail}
        onChange={(e) => setOpponentEmail(e.target.value)}
        style={{ display: "block", marginBottom: 10 }}
      />

      <button onClick={handleCreateChallenge}>
        Send Challenge
      </button>
    </div>
  );
}
