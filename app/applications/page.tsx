"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

export default function ApplicationsPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [user, setUser] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);

  const POINTS: Record<string, number> = {
    Applied: 1,
    "Recruiter Response": 5,
    Interview: 10,
    "Final Round": 25,
    Offer: 100,
  };

  const STATUSES = Object.keys(POINTS);

  const loadApplications = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user);
    if (!user) return;

    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .eq("user_id", user.id)
      .order("applied_date", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setApplications(data || []);
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const updateStatus = async (app: any, newStatus: string) => {
    const oldStatus = app.status;

    const oldPoints = POINTS[oldStatus] ?? 0;
    const newPoints = POINTS[newStatus] ?? 0;
    const delta = newPoints - oldPoints;

    // 1. Update application
    const { error } = await supabase
      .from("applications")
      .update({ status: newStatus })
      .eq("id", app.id);

    if (error) {
      console.error(error);
      return;
    }

    // 2. Log event
    await supabase.from("application_events").insert([
      {
        application_id: app.id,
        user_id: user.id,
        challenge_id: app.challenge_id,
        event_type: "STATUS_CHANGE",
        from_status: oldStatus,
        to_status: newStatus,
      },
    ]);

    // 3. Update points
    const { data: profile } = await supabase
      .from("users")
      .select("points")
      .eq("id", user.id)
      .single();

    const currentPoints = profile?.points ?? 0;

    await supabase
      .from("users")
      .update({ points: currentPoints + delta })
      .eq("id", user.id);

    loadApplications();
  };

  const deleteApplication = async (app: any) => {
    const points = POINTS[app.status] ?? 0;

    await supabase.from("applications").delete().eq("id", app.id);

    const { data: profile } = await supabase
      .from("users")
      .select("points")
      .eq("id", user.id)
      .single();

    const currentPoints = profile?.points ?? 0;

    await supabase
      .from("users")
      .update({ points: currentPoints - points })
      .eq("id", user.id);

    loadApplications();
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>📄 My Applications</h1>

      {applications.length === 0 && <p>No applications yet</p>}

      {applications.map((app) => (
        <div
          key={app.id}
          style={{ border: "1px solid #ccc", padding: 10, marginBottom: 10 }}
        >
          <p>
            <strong>{app.company_name}</strong> – {app.role_title}
          </p>

          <select
            value={app.status}
            onChange={(e) => updateStatus(app, e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>

          <p>
            Applied:{" "}
            {new Date(app.applied_date).toLocaleDateString()}
          </p>

          <button onClick={() => deleteApplication(app)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
