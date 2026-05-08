const jwt = require("jsonwebtoken")
const Utilisateur = require("../models/utilisateur")

// Verifies JWT and attaches user to req
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith("Bearer "))
      return res.status(401).json({ error: "No token provided" })

    const token = authHeader.split(" ")[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await Utilisateur.findById(decoded.id).select("-motDePasse")
    if (!user) return res.status(401).json({ error: "User not found" })

    if (user.statusCompte === "bloque")
      return res.status(403).json({ error: "Account is blocked" })

    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" })
  }
}

// Role-based guard — usage: authorize("admin") or authorize("recruteur", "admin")
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return res.status(403).json({ error: "Access denied" })
    next()
  }
}

const ownerOrAdmin = (req, res, next) => {
  const paramId = req.params.idRecruteur || req.params.id
  if (
    req.user.role === 'admin' ||
    req.user._id.toString() === paramId
  ) {
    return next()
  }
  return res.status(403).json({ error: 'Access denied' })
}

module.exports = { authenticate, authorize, ownerOrAdmin }