"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

export default function ChallengesPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [user, setUser] = useState<any>(null);
  const [challenges, setChallenges] = useState<any[]>([]);

  useEffect(() => {
    const getUserAndChallenges = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);

      if (!user) return;

      const { data } = await supabase
        .from("challenges")
        .select("*")
        .or(`creator_id.eq.${user.id},opponent_id.eq.${user.id}`);

      setChallenges(data || []);
    };

    getUserAndChallenges();
  }, []);

  const acceptChallenge = async (id: string) => {
    const { error } = await supabase
      .from("challenges")
      .update({ status: "active" })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Error accepting challenge");
      return;
    }

    alert("Challenge accepted!");
    location.reload();
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Your Challenges</h1>

      {challenges.map((c) => (
        <div key={c.id} style={{ marginBottom: 10 }}>
          <p>Status: {c.status}</p>

          {c.status === "pending" && user.id === c.opponent_id && (
            <button onClick={() => acceptChallenge(c.id)}>
              Accept Challenge
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
