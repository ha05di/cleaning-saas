export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      
      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl md:text-6xl font-bold leading-tight">
          UrbanFlow
        </h1>

        <h2 className="mt-4 text-2xl md:text-3xl text-gray-600">
          Automate Your Service Business
        </h2>

        <p className="mt-6 text-lg text-gray-500 max-w-2xl mx-auto">
          All-in-one software for cleaning, Airbnb, and home service teams.
          Manage bookings, staff, and customers — all in one place.
        </p>

        <div className="mt-8 flex justify-center gap-4">
          <a
            href="/signup"
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700"
          >
            Start Free Trial
          </a>

          <a
            href="#features"
            className="border border-gray-300 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100"
          >
            See Features
          </a>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-8">

          {[
            {
              title: "Smart Scheduling",
              desc: "Organize jobs and avoid conflicts easily.",
            },
            {
              title: "Customer Management",
              desc: "Track clients, history, and notes in one place.",
            },
            {
              title: "Team Assignment",
              desc: "Assign jobs to available staff instantly.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white p-6 rounded-2xl shadow-sm border"
            >
              <h3 className="text-xl font-semibold">{f.title}</h3>
              <p className="mt-2 text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 text-center">
        <h2 className="text-3xl font-bold">How it works</h2>

        <div className="mt-10 flex flex-col md:flex-row justify-center gap-10">
          {["Sign up", "Add your team", "Start managing jobs"].map((step, i) => (
            <div key={step}>
              <div className="text-4xl font-bold text-blue-600">{i + 1}</div>
              <p className="mt-2 text-gray-600">{step}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section className="bg-gray-50 py-20 text-center">
        <h2 className="text-3xl font-bold">Simple Pricing</h2>

        <div className="mt-10 bg-white max-w-md mx-auto p-8 rounded-2xl shadow border">
          <h3 className="text-xl font-semibold">3-Day Free Trial</h3>

          <p className="mt-4 text-4xl font-bold">
            $29<span className="text-lg text-gray-500">/month</span>
          </p>

          <ul className="mt-6 text-gray-500 space-y-2">
            <li>✔ Booking system</li>
            <li>✔ Scheduling</li>
            <li>✔ Team management</li>
          </ul>

          <a
            href="/signup"
            className="block mt-6 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700"
          >
            Start Free Trial
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 text-center text-gray-400 text-sm">
        © 2026 UrbanFlow. All rights reserved.
      </footer>
    </div>
  );
}