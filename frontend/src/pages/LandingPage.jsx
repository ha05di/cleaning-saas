import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
      {/* Top Nav */}
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-lg font-bold text-white shadow-sm">
              U
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight">UrbanFlow</div>
              <div className="text-xs text-slate-500">Cleaning business software</div>
            </div>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              How it works
            </a>
            <a href="#why-us" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Why UrbanFlow
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Log in
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Start free trial
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(99,102,241,0.10),_transparent_28%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-20 md:grid-cols-2 md:py-28">
          <div className="relative">
            <div className="mb-5 inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
              Built for cleaning teams, maid services, and home service operators
            </div>

            <h1 className="max-w-2xl text-5xl font-bold leading-[1.05] tracking-tight text-slate-900 md:text-6xl">
              Run your cleaning business
              <span className="block text-blue-600">without the chaos</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              UrbanFlow helps you manage customers, jobs, cleaners, and schedules
              from one clean, simple dashboard — so you spend less time chasing
              updates and more time growing your business.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={() => navigate("/signup")}
                className="rounded-2xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Start Free Trial
              </button>

              <button
                onClick={() => navigate("/login")}
                className="rounded-2xl border border-slate-300 bg-white px-6 py-3.5 text-base font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                Watch Demo
              </button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-slate-500">
              <div>14-day free trial</div>
              <div className="h-1 w-1 rounded-full bg-slate-300" />
              <div>No credit card required</div>
              <div className="h-1 w-1 rounded-full bg-slate-300" />
              <div>Made for real operators</div>
            </div>
          </div>

          {/* SaaS Preview Card */}
          <div className="relative">
            <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Today’s Operations</p>
                    <h3 className="text-2xl font-bold text-slate-900">UrbanFlow Dashboard</h3>
                  </div>
                  <div className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                    Live
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <StatCard title="Jobs Today" value="28" sub="+12% this week" />
                  <StatCard title="Available Staff" value="7" sub="2 teams idle now" />
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="font-semibold text-slate-900">Upcoming Schedule</h4>
                    <span className="text-sm text-slate-500">Auto-assigned</span>
                  </div>

                  <ScheduleRow time="09:00 AM" job="Airbnb Turnover - Los Angeles" badge="Team A" />
                  <ScheduleRow time="11:30 AM" job="Deep Cleaning - Sydney CBD" badge="Team B" />
                  <ScheduleRow time="02:00 PM" job="Move-Out Cleaning - Melbourne" badge="Team C" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm font-medium text-slate-500">
              Designed for teams that want less admin, fewer missed jobs, and smoother daily operations.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <span className="rounded-full bg-slate-100 px-3 py-1.5">Scheduling</span>
              <span className="rounded-full bg-slate-100 px-3 py-1.5">Customer CRM</span>
              <span className="rounded-full bg-slate-100 px-3 py-1.5">Cleaner Dispatch</span>
              <span className="rounded-full bg-slate-100 px-3 py-1.5">Team Management</span>
            </div>
          </div>
        </div>
      </section>

      {/* Why / Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-12 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
            Why UrbanFlow
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
            The simpler way to run your cleaning business
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Built for owners who are tired of spreadsheets, endless messages,
            and messy scheduling.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <FeatureCard
            title="Smart scheduling"
            desc="Keep bookings organized, avoid clashes, and see your day at a glance."
          />
          <FeatureCard
            title="Cleaner management"
            desc="Track team availability, assign jobs quickly, and manage multiple crews."
          />
          <FeatureCard
            title="Customer CRM"
            desc="Store contact details, service notes, addresses, and job history in one place."
          />
          <FeatureCard
            title="Job tracking"
            desc="Follow every booking from pending to assigned to completed without confusion."
          />
          <FeatureCard
            title="Better communication"
            desc="Keep your office team and field staff aligned with fewer back-and-forth messages."
          />
          <FeatureCard
            title="Built to grow"
            desc="Start simple now, then scale your cleaners, customers, and operations over time."
          />
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
              How it works
            </p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
              You’re just a few steps away from a calmer operation
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <StepCard
              number="01"
              title="Create your account"
              desc="Sign up and set up your cleaning business in minutes."
            />
            <StepCard
              number="02"
              title="Add your team and customers"
              desc="Bring your cleaners, customers, and jobs into one workspace."
            />
            <StepCard
              number="03"
              title="Start managing work"
              desc="Schedule jobs, assign cleaners, and run your day with less stress."
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-[#f7f8fc] py-24">
        <div className="mx-auto max-w-7xl px-6">

          <div className="mb-16 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
              Pricing
            </p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
              Simple pricing that scales with your business
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Start small, grow fast. No hidden fees.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">

            {/* Starter */}
            <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Starter</h3>
              <p className="mt-2 text-sm text-slate-500">
                Perfect for new cleaning businesses
              </p>

              <div className="mt-6 text-4xl font-bold">$9.9<span className="text-lg font-medium text-slate-500"> / month</span></div>

              <button
                onClick={() => navigate("/signup")}
                className="mt-6 w-full rounded-xl border border-slate-300 py-3 font-semibold text-slate-800 hover:bg-slate-50"
              >
                Try free for 14 days
              </button>

              <ul className="mt-6 space-y-3 text-sm text-slate-600">
                <li>✔ Up to 40 jobs per month</li>
                <li>✔ Basic scheduling</li>
                <li>✔ Customer management</li>
                <li>✔ Team assignment</li>
              </ul>
            </div>

            {/* Pro (重点推荐) */}
            <div className="relative rounded-[28px] border-2 border-blue-600 bg-white p-8 shadow-xl">

              <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1 text-xs font-semibold text-white">
                MOST POPULAR
              </div>

              <h3 className="text-lg font-semibold text-slate-900">Pro</h3>
              <p className="mt-2 text-sm text-slate-500">
                Ideal for growing teams
              </p>

              <div className="mt-6 text-4xl font-bold">$19<span className="text-lg font-medium text-slate-500"> / month</span></div>

              <button
                onClick={() => navigate("/signup")}
                className="mt-6 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Try free for 14 days
              </button>

              <ul className="mt-6 space-y-3 text-sm text-slate-600">
                <li>✔ Unlimited jobs</li>
                <li>✔ Smart scheduling</li>
                <li>✔ Cleaner tracking</li>
                <li>✔ Priority support</li>
              </ul>
            </div>

            {/* Pro Max */}
            <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Pro Max</h3>
              <p className="mt-2 text-sm text-slate-500">
                For scaling businesses
              </p>

              <div className="mt-6 text-4xl font-bold">$59<span className="text-lg font-medium text-slate-500"> / month</span></div>

              <button
                onClick={() => navigate("/signup")}
                className="mt-6 w-full rounded-xl bg-slate-900 py-3 font-semibold text-white hover:bg-black"
              >
                Try free for 14 days
              </button>

              <ul className="mt-6 space-y-3 text-sm text-slate-600">
                <li>✔ Everything in Pro</li>
                <li>✔ Advanced automation</li>
                <li>✔ Reports & analytics</li>
                <li>✔ Multi-team support</li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* Soft CTA */}
      <section id="why-us" className="mx-auto max-w-7xl px-6 py-20">
        <div className="rounded-[32px] border border-slate-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-10 shadow-sm md:p-14">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
              Made for cleaning business owners
            </p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
              Spend less time managing the mess behind the scenes
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              UrbanFlow gives you a cleaner, calmer way to manage bookings,
              staff, and customers — without overcomplicating your workflow.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                onClick={() => navigate("/signup")}
                className="rounded-2xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white transition hover:bg-blue-700"
              >
                Start free trial
              </button>
              <button
                onClick={() => navigate("/login")}
                className="rounded-2xl border border-slate-300 bg-white px-6 py-3.5 text-base font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                Log in
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <div>© 2026 UrbanFlow. All rights reserved.</div>
          <div className="flex items-center gap-5">
            <a href="/login" className="hover:text-slate-800">Login</a>
            <a href="/signup" className="hover:text-slate-800">Free Trial</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ title, value, sub }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="mt-2 text-4xl font-bold tracking-tight text-slate-900">{value}</div>
      <div className="mt-2 text-sm text-emerald-600">{sub}</div>
    </div>
  );
}

function ScheduleRow({ time, job, badge }) {
  return (
    <div className="mt-3 flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
      <div>
        <div className="text-sm text-slate-500">{time}</div>
        <div className="mt-1 font-medium text-slate-900">{job}</div>
      </div>
      <div className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
        {badge}
      </div>
    </div>
  );
}

function FeatureCard({ title, desc }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-lg font-bold text-blue-600">
        ✦
      </div>
      <h3 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h3>
      <p className="mt-3 leading-7 text-slate-600">{desc}</p>
    </div>
  );
}

function StepCard({ number, title, desc }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-[#f8fafc] p-8">
      <div className="text-sm font-semibold tracking-[0.2em] text-blue-600">{number}</div>
      <h3 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">{title}</h3>
      <p className="mt-3 leading-7 text-slate-600">{desc}</p>
    </div>
  );
}