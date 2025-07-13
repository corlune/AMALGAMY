require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';

// Middleware
app.use(cors());
app.use(express.json());

// --- MongoDB connection ---
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

// --- Schemas & Models ---
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
});
const User = mongoose.model('User', userSchema);

const playerSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  position: { x: Number, y: Number },
  mp: Number, maxMp: Number,
  manaRegenBase: Number, manaRegenRate: Number,
  invisibilityLevel: Boolean, astral: Boolean,
  manaAura: Number, online: Boolean,
  etherealBodyActive: Boolean, astralProjectionActive: Boolean,
});
const Player = mongoose.model('Player', playerSchema);

const projectileSchema = new mongoose.Schema({
  caster: String, target: String, spellName: String,
  startTime: { type: Date, default: Date.now },
  startPos: { x: Number, y: Number }, endPos: { x: Number, y: Number },
  durationMs: Number, damage: Number, done: { type: Boolean, default: false },
});
const Projectile = mongoose.model('Projectile', projectileSchema);

// --- Auth middleware ---
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid token" });
    req.user = decoded;
    next();
  });
}

// --- In-memory chat history ---
const chatHistory = []; // { type, from, to?, text, timestamp }

// --- Chat endpoints ---
app.post('/say', authMiddleware, (req, res) => {
  const { username, message } = req.body;
  if (!message) return res.status(400).json({ message: "Missing message" });
  const entry = { type: "public", from: username, text: message, timestamp: Date.now() };
  chatHistory.push(entry);
  console.log(`💬 ${username}: ${message}`);
  res.json({ message: "Message sent" });
});

app.post('/whisper', authMiddleware, (req, res) => {
  const { fromUsername, toUsername, message } = req.body;
  if (!toUsername || !message) return res.status(400).json({ message: "Missing target or message" });
  const entry = { type: "private", from: fromUsername, to: toUsername, text: message, timestamp: Date.now() };
  chatHistory.push(entry);
  console.log(`🤫 ${fromUsername} whispers to ${toUsername}: ${message}`);
  res.json({ message: "Whisper sent" });
});

app.get('/history', authMiddleware, (req, res) => {
  res.json(chatHistory);
});

// --- Auth endpoints ---
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: "Missing username or password" });
  try {
    if (await User.findOne({ username })) return res.status(409).json({ message: "Username already exists" });
    const passwordHash = await bcrypt.hash(password, 10);
    await new User({ username, passwordHash }).save();
    await new Player({
      username, position: { x: 0, y: 0 },
      mp: 30, maxMp: 100, manaRegenBase: 1, manaRegenRate: 1,
      invisibilityLevel: false, astral: false, manaAura: 0.2,
      online: false, etherealBodyActive: false, astralProjectionActive: false
    }).save();
    res.status(201).json({ message: "Registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: "Missing username or password" });
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: "User not found" });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid password" });
    await Player.findOneAndUpdate({ username }, { online: true });
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post('/logout', async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ message: "Missing username" });
  try {
    await Player.findOneAndUpdate({ username }, { online: false });
    res.json({ message: "Logged out" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- Game endpoints ---
app.get('/players', authMiddleware, async (req, res) => {
  try {
    const players = await Player.find({});
    res.json(players);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post('/castSpell', authMiddleware, async (req, res) => {
  const { username, spellName, manaSpent } = req.body;
  if (!username || !spellName || !manaSpent) return res.status(400).json({ message: "Missing fields" });
  try {
    const p = await Player.findOne({ username });
    if (!p) return res.status(404).json({ message: "Player not found" });
    if (p.mp < manaSpent) return res.status(400).json({ message: "Not enough mana" });
    p.mp -= manaSpent;
    if (spellName === "Ethereal Body") p.etherealBodyActive = true;
    if (spellName === "Astral Projection") p.astralProjectionActive = true;
    if (spellName === "Deactivate Ethereal Body") p.etherealBodyActive = false;
    if (spellName === "Deactivate Astral Projection") p.astralProjectionActive = false;
    await p.save();
    res.json({ message: `Casted ${spellName}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post('/castFireball', authMiddleware, async (req, res) => {
  const { casterUsername, targetUsername } = req.body;
  if (!casterUsername || !targetUsername) return res.status(400).json({ message: "Missing caster or target" });
  try {
    const caster = await Player.findOne({ username: casterUsername });
    const target = await Player.findOne({ username: targetUsername });
    if (!caster || !target) return res.status(404).json({ message: "Caster or target not found" });
    if (caster.mp < 20) return res.status(400).json({ message: "Need at least 20 MP" });
    caster.mp -= 20;
    await caster.save();
    await new Projectile({
      caster: casterUsername, target: targetUsername, spellName: "Fireball",
      startPos: caster.position, endPos: target.position,
      durationMs: 5000, damage: 20
    }).save();
    res.json({ message: "Fireball launched" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get('/projectiles', authMiddleware, async (req, res) => {
  try {
    const projs = await Projectile.find({ done: false });
    res.json(projs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- Timers: Mana regen & resolve projectiles ---
setInterval(async () => {
  try {
    const all = await Player.find({});
    for (let p of all) {
      p.manaRegenRate += p.manaRegenRate * 0.0001;
      const gain = p.manaRegenBase * p.manaRegenRate;
      let bonus = 0;
      if (p.etherealBodyActive && p.astralProjectionActive) {
        const nearby = all.filter(x =>
          x.username !== p.username &&
          Math.hypot(x.position.x - p.position.x, x.position.y - p.position.y) < 100
        ).length;
        bonus = nearby * 0.5;
      }
      p.mp = Math.min(p.mp + gain + bonus, p.maxMp);
      await p.save();
    }
  } catch (e) { console.error(e); }
}, 1000);

setInterval(async () => {
  try {
    const now = Date.now();
    const projs = await Projectile.find({ done: false });
    for (let pr of projs) {
      if (now - pr.startTime.getTime() >= pr.durationMs) {
        const target = await Player.findOne({ username: pr.target });
        if (target) {
          target.mp = Math.max(0, target.mp - pr.damage);
          await target.save();
        }
        pr.done = true;
        await pr.save();
      }
    }
  } catch (e) { console.error(e); }
}, 60000);

// --- Start server ---
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
