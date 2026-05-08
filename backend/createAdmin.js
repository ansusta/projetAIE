require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const connectDB = require('./config/db')
const Utilisateur = require('./models/utilisateur')

const createAdmin = async () => {
  await connectDB()

  const existing = await Utilisateur.findOne({ email: 'admin@admin.com' })
  if (existing) {
    console.log('Admin already exists')
    process.exit(0)
  }

  const hashedPassword = await bcrypt.hash('Admin123!', 10)

  await Utilisateur.create({
    email: 'admin@admin.com',
    motDePasse: hashedPassword,
    role: 'admin',
    nom: 'Admin',
    prenom: 'Super',
    statusCompte: 'actif'
  })

  console.log('Admin created successfully')
  process.exit(0)
}

createAdmin().catch(err => {
  console.error(err)
  process.exit(1)
})