"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

export default function ProfilePage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("User error:", userError);
        return;
      }

      setUser(user);

      if (user) {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Profile fetch error:", error);
        } else {
          setProfile(data);
        }
      }
    };

    fetchUserAndProfile();
  }, []);

  const addPoint = async () => {
    if (!user || !profile) return;

    const { data, error } = await supabase
      .from("users")
      .update({ points: profile.points + 1 })
      .eq("id", user.id)
      .select();

    if (error) {
      console.error("Update error:", error);
      return;
    }

    if (data && data.length > 0) {
      setProfile(data[0]);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Profile</h1>

      {user ? (
        <div>
          <p>Email: {user.email}</p>
        </div>
      ) : (
        <p>Loading user...</p>
      )}

      {profile ? (
        <div style={{ marginTop: 20 }}>
          <p>Username: {profile.username}</p>
          <p>Points: {profile.points}</p>

          <button onClick={addPoint} style={{ marginTop: 10 }}>
            +1 Point
          </button>
        </div>
      ) : (
        <p>Loading profile...</p>
      )}
    </div>
  );
}
