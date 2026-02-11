const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 9001;

// Serve all game folders as static files
app.use(express.static(__dirname));
app.use(express.json());

// CORS — allow games served from file:// or other ports
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'GET, POST');
    next();
});

// --- Tetris Leaderboard API ---
const TETRIS_LB_FILE = path.join(__dirname, 'data', 'tetris-leaderboard.json');
const TETRIS_LB_MAX = 10;
const TETRIS_LB_SEED = [{ name: 'EL PADRE', score: 80776, level: 11, lines: 103, combo: 4, date: '2026-02-09' }];

function readTetrisLeaderboard() {
    try {
        if (!fs.existsSync(TETRIS_LB_FILE)) {
            fs.mkdirSync(path.dirname(TETRIS_LB_FILE), { recursive: true });
            fs.writeFileSync(TETRIS_LB_FILE, JSON.stringify(TETRIS_LB_SEED, null, 2));
            return [...TETRIS_LB_SEED];
        }
        const data = JSON.parse(fs.readFileSync(TETRIS_LB_FILE, 'utf8'));
        return Array.isArray(data) ? data : [...TETRIS_LB_SEED];
    } catch (e) {
        return [...TETRIS_LB_SEED];
    }
}

function writeTetrisLeaderboard(lb) {
    fs.mkdirSync(path.dirname(TETRIS_LB_FILE), { recursive: true });
    fs.writeFileSync(TETRIS_LB_FILE, JSON.stringify(lb, null, 2));
}

app.get('/api/tetris-leaderboard', (req, res) => {
    const lb = readTetrisLeaderboard();
    res.json({ success: true, leaderboard: lb });
});

app.post('/api/tetris-leaderboard', (req, res) => {
    const { score, level, lines, combo, name } = req.body;
    if (typeof score !== 'number' || score <= 0) {
        return res.status(400).json({ success: false, error: 'Invalid score' });
    }
    const entry = {
        name: (typeof name === 'string' && name.trim()) ? name.trim().substring(0, 16) : '???',
        score: Math.floor(score),
        level: Math.floor(level || 1),
        lines: Math.floor(lines || 0),
        combo: Math.floor(combo || 0),
        date: new Date().toISOString().slice(0, 10)
    };
    const lb = readTetrisLeaderboard();
    lb.push(entry);
    lb.sort((a, b) => b.score - a.score);
    while (lb.length > TETRIS_LB_MAX) lb.pop();
    writeTetrisLeaderboard(lb);
    const rank = lb.findIndex(e => e === entry);
    res.json({ success: true, rank, leaderboard: lb });
});

app.listen(PORT, () => {
    console.log(`\n  Sala Game Server running on http://localhost:${PORT}\n`);
    console.log(`  Games:`);
    console.log(`    El Padre's Tetris  -> http://localhost:${PORT}/el-padre/`);
    console.log(`    Cash's Games       -> http://localhost:${PORT}/cash/`);
    console.log(`    Heather's Games    -> http://localhost:${PORT}/heather/`);
    console.log(`    Austyn's Games     -> http://localhost:${PORT}/austyn/`);
    console.log(`    Arliss's Games     -> http://localhost:${PORT}/arliss/`);
    console.log('');
});
