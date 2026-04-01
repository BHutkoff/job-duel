"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signUp = async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    console.log("AUTH DATA:", data);
    console.log("AUTH ERROR:", error);

    // Insert into your public users table
    if (data.user) {
      const { error: insertError } = await supabase.from("users").insert([
        {
          id: data.user.id,
          email: data.user.email,
          username: email,
          points: 0,
        },
      ]);

      console.log("INSERT ERROR:", insertError);
    }

    alert(error ? error.message : "Sign up successful!");
  };

  const signIn = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log("SIGN IN DATA:", data);
    console.log("SIGN IN ERROR:", error);

    alert(error ? error.message : "Signed in successfully!");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Auth</h1>

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ display: "block", marginBottom: 10 }}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: "block", marginBottom: 10 }}
      />

      <button onClick={signUp} style={{ marginRight: 10 }}>
        Sign Up
      </button>

      <button onClick={signIn}>Sign In</button>
    </div>
  );
}
