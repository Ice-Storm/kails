import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import Promise from 'bluebird'
import jwt from 'jsonwebtoken'
import config from '../../config'

const User = new mongoose.Schema({
  type: { type: String, default: 'User' },
  name: { type: String },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
})

User.pre('save', async function preSave (next) {
  try {
    const salt = await Promise.promisify(bcrypt.genSalt)(10)
    const hash = await Promise.promisify(bcrypt.hash)(this.password, salt)
    this.password = hash
    next(null)
  } catch(err) {
    next(err)
  }
})

User.methods.validatePassword = async function validatePassword (password) {
  try {
    return await Promise.promisify(bcrypt.compare)(password, this.password)
  } catch (err) {
    next(err)
  }
}

User.methods.generateToken = function generateToken () {
  return jwt.sign({ id: this.id }, config.token)
}

export default mongoose.model('user', User)
