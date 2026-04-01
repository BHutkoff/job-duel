"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

export default function AddApplicationPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [user, setUser] = useState<any>(null);

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
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
    };

    getUser();
  }, []);

  const handleSubmit = async () => {
    if (!user) {
      alert("You must be logged in");
      return;
    }

    const pointsToAdd = POINTS[status] || 0;

    // 1. Insert application
    const { error: insertError } = await supabase.from("applications").insert([
      {
        user_id: user.id,
        challenge_id: null,
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

    // 2. Get current user points
    const { data: profile, error: fetchError } = await supabase
      .from("users")
      .select("points")
      .eq("id", user.id)
      .single();

    if (fetchError) {
      console.error("Fetch error:", fetchError);
      return;
    }

    // 3. Update points
    const { error: updateError } = await supabase
      .from("users")
      .update({ points: profile.points + pointsToAdd })
      .eq("id", user.id);

    if (updateError) {
      console.error("Update error:", updateError);
    }

    alert(`Application added! +${pointsToAdd} points`);

    setCompany("");
    setRole("");
    setStatus("Applied");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Add Job Application</h1>

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
