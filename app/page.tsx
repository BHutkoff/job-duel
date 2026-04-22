"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

export default function Dashboard() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [user, setUser] = useState<any>(null);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [usersMap, setUsersMap] = useState<any>({});

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
      if (!user) return;

      // Fetch challenges
      const { data: challengeData, error } = await supabase
        .from("challenges")
        .select("*")
        .or(`creator_id.eq.${user.id},opponent_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Challenge fetch error:", error);
        return;
      }

      setChallenges(challengeData || []);

      // Collect user IDs
      const ids = new Set<string>();
      challengeData?.forEach((c) => {
        ids.add(c.creator_id);
        ids.add(c.opponent_id);
      });

      // Fetch usernames
      const { data: users } = await supabase
        .from("users")
        .select("id, username")
        .in("id", Array.from(ids));

      const map: any = {};
      users?.forEach((u) => (map[u.id] = u.username));
      setUsersMap(map);
    };

    loadData();
  }, []);

  if (!user) return <p>Loading...</p>;

  const activeChallenges = challenges.filter(
    (c) => c.status === "active"
  );

  const completedChallenges = challenges.filter(
    (c) => c.status === "completed"
  );

  const getOpponentName = (c: any) => {
    const opponentId =
      user.id === c.creator_id ? c.opponent_id : c.creator_id;
    return usersMap[opponentId] || "Opponent";
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>🏠 Job Duel Dashboard</h1>

      {/* ACTION BUTTONS */}
      <div style={{ marginBottom: 20 }}>
        <Link href="/challenges/new">
          <button style={{ marginRight: 10 }}>
            Create Challenge
          </button>
        </Link>

        <Link href="/add">
          <button>Add Application</button>
        </Link>
      </div>

      {/* ACTIVE CHALLENGES */}
      <h2>🔥 Active Challenges</h2>

      {activeChallenges.length === 0 && <p>No active challenges</p>}

      {activeChallenges.map((c) => (
        <div
          key={c.id}
          style={{
            border: "1px solid gray",
            padding: 10,
            marginBottom: 10,
          }}
        >
          <p>vs {getOpponentName(c)}</p>
          <p>Status: {c.status}</p>

          <Link href={`/challenges/${c.id}`}>
            <button>View Duel</button>
          </Link>
        </div>
      ))}

      {/* COMPLETED CHALLENGES */}
      <h2>🏁 Completed Challenges</h2>

      {completedChallenges.length === 0 && <p>No completed challenges</p>}

      {completedChallenges.map((c) => (
        <div
          key={c.id}
          style={{
            border: "1px solid gray",
            padding: 10,
            marginBottom: 10,
            opacity: 0.7,
          }}
        >
          <p>vs {getOpponentName(c)}</p>

          <Link href={`/challenges/${c.id}`}>
            <button>View Results</button>
          </Link>
        </div>
      ))}
    </div>
  );
}
