import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          business_name: businessName,
        },
      },
    });

    if (error) {
      setLoading(false);
      alert(error.message);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/bootstrap-company`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          fullName,
          businessName,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        console.error("Bootstrap company failed:", data);
        alert(data?.error || "Failed to create company");
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error("Bootstrap company failed:", err);
      alert("Failed to create company");
      setLoading(false);
      return;
    }

    setLoading(false);
    alert("Signup successful. Please log in.");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center">
        <div className="w-full max-w-md rounded-[28px] border border-gray-300 bg-white p-8 shadow-sm">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
              Create your account
            </h1>
            <p className="mt-3 text-gray-500">
              Start your free trial with UrbanFlow
            </p>
          </div>

          <form onSubmit={handleSignup} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800">
                Full Name
              </label>
              <input
                type="text"
                placeholder="John Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800">
                Business Name
              </label>
              <input
                type="text"
                placeholder="UrbanCare Cleaning"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800">
                Password
              </label>
              <input
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                minLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-blue-600 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating..." : "Start Free Trial"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:underline"
            >
              Log in
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-gray-400">
            By signing up, you agree to our Terms and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}