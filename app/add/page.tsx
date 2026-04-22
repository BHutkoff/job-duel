"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

export default function AddApplicationPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [user, setUser] = useState<any>(null);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState("");

  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("Applied");

  const POINTS: Record<string, number> = {
    "Applied": 1,
    "Recruiter Response": 5,
    "Interview": 10,
    "Final Round": 25,
    "Offer": 100,
  };

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
      if (!user) return;

      const { data, error } = await supabase
        .from("challenges")
        .select("*")
        .eq("status", "active")
        .or(`creator_id.eq.${user.id},opponent_id.eq.${user.id}`);

      if (error) {
        console.error("Challenge fetch error:", error);
        return;
      }

      setChallenges(data || []);
    };

    loadData();
  }, []);

  const handleSubmit = async () => {
    if (!user || !selectedChallenge) {
      alert("Select a challenge");
      return;
    }

    // 🔒 Fetch challenge to enforce lock
    const { data: challenge, error: challengeError } = await supabase
      .from("challenges")
      .select("end_date, status")
      .eq("id", selectedChallenge)
      .single();

    if (challengeError || !challenge) {
      console.error("Challenge fetch error:", challengeError);
      alert("Could not verify challenge");
      return;
    }

    const now = new Date().getTime();
    const end = new Date(challenge.end_date).getTime();

    if (challenge.status !== "active" || now > end) {
      alert("This challenge is finished. No more submissions allowed.");
      return;
    }

    const pointsToAdd = POINTS[status] ?? 0;

    // 1. Insert application
    const { error: insertError } = await supabase.from("applications").insert([
      {
        user_id: user.id,
        challenge_id: selectedChallenge,
        company_name: company,
        role_title: role,
        status: status,
        applied_date: new Date().toISOString(),
      },
    ]);

    if (insertError) {
      console.error("Insert error:", insertError);
      alert("Error saving application");
      return;
    }

    // 2. Fetch current points safely
    const { data: profile, error: fetchError } = await supabase
      .from("users")
      .select("points")
      .eq("id", user.id)
      .single();

    if (fetchError || !profile) {
      console.error("Fetch error:", fetchError);
      alert("Could not fetch user points");
      return;
    }

    const currentPoints = profile.points ?? 0;

    // 3. Update points
    const { error: updateError } = await supabase
      .from("users")
      .update({ points: currentPoints + pointsToAdd })
      .eq("id", user.id);

    if (updateError) {
      console.error("Update error:", updateError);
      alert("Error updating points");
      return;
    }

    alert(`Application added! +${pointsToAdd} points`);

    // Reset form
    setCompany("");
    setRole("");
    setStatus("Applied");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Add Job Application</h1>

      {/* Challenge Selector */}
      <select
        value={selectedChallenge}
        onChange={(e) => setSelectedChallenge(e.target.value)}
        style={{ display: "block", marginBottom: 10 }}
      >
        <option value="">Select Challenge</option>
        {challenges.map((c) => (
          <option key={c.id} value={c.id}>
            {c.id}
          </option>
        ))}
      </select>

      {/* Inputs */}
      <input
        placeholder="Company Name"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        style={{ display: "block", marginBottom: 10 }}
      />

      <input
        placeholder="Role Title"
        value={role}
        onChange={(e) => setRole(e.target.value)}
        style={{ display: "block", marginBottom: 10 }}
      />

      {/* Status */}
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        style={{ display: "block", marginBottom: 10 }}
      >
        <option>Applied</option>
        <option>Recruiter Response</option>
        <option>Interview</option>
        <option>Final Round</option>
        <option>Offer</option>
      </select>

      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}
