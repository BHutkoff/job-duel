"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useParams } from "next/navigation";

export default function ChallengePage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const params = useParams();
  const challengeId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [challenge, setChallenge] = useState<any>(null);
  const [scores, setScores] = useState<any>({});
  const [usersMap, setUsersMap] = useState<any>({});
  const [events, setEvents] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState<string>("");

  const POINTS: Record<string, number> = {
    Applied: 1,
    "Recruiter Response": 5,
    Interview: 10,
    "Final Round": 25,
    Offer: 100,
  };

  // -----------------------------
  // LOAD ALL DATA
  // -----------------------------
  const loadData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user);
    if (!user) return;

    // Challenge
    const { data: challengeData, error: challengeError } =
      await supabase
        .from("challenges")
        .select("*")
        .eq("id", challengeId)
        .single();

    if (challengeError) {
      console.error("Challenge error:", challengeError);
      return;
    }

    setChallenge(challengeData);

    // Users
    const { data: users } = await supabase
      .from("users")
      .select("id, username")
      .in("id", [
        challengeData.creator_id,
        challengeData.opponent_id,
      ]);

    const map: any = {};
    users?.forEach((u) => (map[u.id] = u.username));
    setUsersMap(map);

    // Applications → scores
    const { data: apps } = await supabase
      .from("applications")
      .select("*")
      .eq("challenge_id", challengeId);

    const scoreMap: any = {};

    (apps || []).forEach((app) => {
      const points = POINTS[app.status] ?? 0;
      scoreMap[app.user_id] =
        (scoreMap[app.user_id] || 0) + points;
    });

    setScores(scoreMap);

    // Events feed
    const { data: ev, error: evError } = await supabase
      .from("application_events")
      .select("*")
      .eq("challenge_id", challengeId)
      .order("created_at", { ascending: false });

    if (evError) {
      console.error("Events error:", evError);
    }

    setEvents(ev || []);
  };

  // -----------------------------
  // INITIAL LOAD + REALTIME
  // -----------------------------
  useEffect(() => {
    loadData();

    const channel = supabase
      .channel("realtime-events")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "application_events",
          filter: `challenge_id=eq.${challengeId}`,
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [challengeId]);

  // -----------------------------
  // TIMER LOGIC
  // -----------------------------
  useEffect(() => {
    if (!challenge?.end_date) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(challenge.end_date).getTime();

      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("Challenge ended");
        clearInterval(interval);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft(
        `${days}d ${hours}h ${minutes}m ${seconds}s`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [challenge]);

  if (!challenge || !user) return <p>Loading...</p>;

  const userId = user.id;

  const opponentId =
    userId === challenge.creator_id
      ? challenge.opponent_id
      : challenge.creator_id;

  const userScore = scores[userId] ?? 0;
  const opponentScore = scores[opponentId] ?? 0;

  const total = userScore + opponentScore || 1;

  return (
    <div style={{ padding: 20 }}>
      <h1>⚔️ Job Duel</h1>

      <h2>
        {usersMap[userId]} vs {usersMap[opponentId]}
      </h2>

      {/* TIMER */}
      <h3>⏳ Time Remaining</h3>
      <p
        style={{
          fontSize: 18,
          fontWeight: "bold",
          color:
            challenge?.end_date &&
            new Date(challenge.end_date).getTime() -
              new Date().getTime() <
              1000 * 60 * 60 * 24
              ? "red"
              : "black",
        }}
      >
        {timeLeft || "Loading timer..."}
      </p>

      {/* SCORE */}
      <h3>
        {userScore} vs {opponentScore}
      </h3>

      <div style={{ display: "flex", height: 20 }}>
        <div
          style={{
            width: `${(userScore / total) * 100}%`,
            background: "green",
          }}
        />
        <div
          style={{
            width: `${(opponentScore / total) * 100}%`,
            background: "red",
          }}
        />
      </div>

      <hr style={{ margin: "20px 0" }} />

      {/* ACTIVITY FEED */}
      <h3>📡 Activity Feed</h3>

      {events.length === 0 && (
        <p style={{ opacity: 0.6 }}>No activity yet</p>
      )}

      {events.map((e) => (
        <div key={e.id} style={{ marginBottom: 8 }}>
          <strong>{usersMap[e.user_id]}</strong> moved from{" "}
          {e.from_status} → {e.to_status}
        </div>
      ))}
    </div>
  );
}
