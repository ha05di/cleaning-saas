const supabase = require("../lib/supabase");

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    console.log("AUTH HEADER:", authHeader);

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing token" });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    console.log("AUTH TOKEN:", token);

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    console.log("AUTH USER:", user);
    console.log("AUTH ERROR:", error);

    if (error || !user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth error:", err);
    res.status(500).json({ error: "Auth failed" });
  }
}

module.exports = requireAuth;