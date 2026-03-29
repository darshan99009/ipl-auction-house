-- ============================================================
-- IPL AUCTION HOUSE — SEED DATA
-- 120+ IPL 2025 players across all tiers
-- Run AFTER schema.sql
-- ============================================================

INSERT INTO players (name, role, bowler_type, nationality, status, stock_tier, base_price, country, ipl_team, batting_style, age) VALUES

-- ============================================================
-- ICON TIER (₹2 Cr base)
-- ============================================================
('Virat Kohli',        'Batter',      NULL,     'Indian',   'Capped', 'Icon',     2.00, 'India',       'RCB', 'Right-hand bat', 36),
('Rohit Sharma',       'Batter',      NULL,     'Indian',   'Capped', 'Icon',     2.00, 'India',       'MI',  'Right-hand bat', 37),
('MS Dhoni',           'WK-Batter',   NULL,     'Indian',   'Capped', 'Icon',     2.00, 'India',       'CSK', 'Right-hand bat', 43),
('Jasprit Bumrah',     'Bowler',      'Fast',   'Indian',   'Capped', 'Icon',     2.00, 'India',       'MI',  'Right-arm fast', 30),

-- ============================================================
-- PLATINUM TIER — Overseas (₹2 Cr base)
-- ============================================================
('Pat Cummins',        'All-Rounder', 'Fast',   'Overseas', 'Capped', 'Platinum', 2.00, 'Australia',   'SRH', 'Right-arm fast', 31),
('Mitchell Starc',     'Bowler',      'Fast',   'Overseas', 'Capped', 'Platinum', 2.00, 'Australia',   'KKR', 'Left-arm fast',  34),
('Jos Buttler',        'WK-Batter',   NULL,     'Overseas', 'Capped', 'Platinum', 2.00, 'England',     'RR',  'Right-hand bat', 33),
('Andre Russell',      'All-Rounder', 'Fast',   'Overseas', 'Capped', 'Platinum', 2.00, 'West Indies', 'KKR', 'Right-hand bat', 36),
('Rashid Khan',        'Bowler',      'Spin',   'Overseas', 'Capped', 'Platinum', 2.00, 'Afghanistan', 'GT',  'Right-arm leg',  26),
('Sunil Narine',       'All-Rounder', 'Spin',   'Overseas', 'Capped', 'Platinum', 2.00, 'West Indies', 'KKR', 'Right-arm off',  35),
('David Warner',       'Batter',      NULL,     'Overseas', 'Capped', 'Platinum', 2.00, 'Australia',   'DC',  'Left-hand bat',  37),
('Faf du Plessis',     'Batter',      NULL,     'Overseas', 'Capped', 'Platinum', 2.00, 'South Africa','RCB', 'Right-hand bat', 39),
('Kagiso Rabada',      'Bowler',      'Fast',   'Overseas', 'Capped', 'Platinum', 2.00, 'South Africa','PBKS','Right-arm fast', 29),
('Nicholas Pooran',    'WK-Batter',   NULL,     'Overseas', 'Capped', 'Platinum', 2.00, 'West Indies', 'LSG', 'Left-hand bat',  28),

-- ============================================================
-- GOLD TIER — WK-Batters (₹1.5 Cr base)
-- ============================================================
('KL Rahul',           'WK-Batter',   NULL,     'Indian',   'Capped', 'Gold',     1.50, 'India',       'LSG', 'Right-hand bat', 32),
('Quinton de Kock',    'WK-Batter',   NULL,     'Overseas', 'Capped', 'Gold',     1.50, 'South Africa','LSG', 'Left-hand bat',  31),
('Ishan Kishan',       'WK-Batter',   NULL,     'Indian',   'Capped', 'Gold',     1.50, 'India',       'MI',  'Left-hand bat',  25),
('Sanju Samson',       'WK-Batter',   NULL,     'Indian',   'Capped', 'Gold',     1.50, 'India',       'RR',  'Right-hand bat', 29),
('Rishabh Pant',       'WK-Batter',   NULL,     'Indian',   'Capped', 'Gold',     1.50, 'India',       'DC',  'Left-hand bat',  26),
('Phil Salt',          'WK-Batter',   NULL,     'Overseas', 'Capped', 'Gold',     1.50, 'England',     'KKR', 'Right-hand bat', 27),

-- GOLD — Batters (₹1.5 Cr base)
('Shubman Gill',       'Batter',      NULL,     'Indian',   'Capped', 'Gold',     1.50, 'India',       'GT',  'Right-hand bat', 24),
('Shreyas Iyer',       'Batter',      NULL,     'Indian',   'Capped', 'Gold',     1.50, 'India',       'KKR', 'Right-hand bat', 29),
('Ruturaj Gaikwad',    'Batter',      NULL,     'Indian',   'Capped', 'Gold',     1.50, 'India',       'CSK', 'Right-hand bat', 27),
('Yashasvi Jaiswal',   'Batter',      NULL,     'Indian',   'Capped', 'Gold',     1.50, 'India',       'RR',  'Left-hand bat',  22),
('Travis Head',        'Batter',      NULL,     'Overseas', 'Capped', 'Gold',     1.50, 'Australia',   'SRH', 'Left-hand bat',  30),
('Jake Fraser-McGurk', 'Batter',      NULL,     'Overseas', 'Capped', 'Gold',     1.50, 'Australia',   'DC',  'Right-hand bat', 22),
('Jonny Bairstow',     'WK-Batter',   NULL,     'Overseas', 'Capped', 'Gold',     1.50, 'England',     'PBKS','Right-hand bat', 34),
('Abhishek Sharma',    'Batter',      'Spin',   'Indian',   'Capped', 'Gold',     1.50, 'India',       'SRH', 'Left-hand bat',  24),
('Tilak Varma',        'Batter',      NULL,     'Indian',   'Capped', 'Gold',     1.50, 'India',       'MI',  'Left-hand bat',  22),
('Rinku Singh',        'Batter',      NULL,     'Indian',   'Capped', 'Gold',     1.50, 'India',       'KKR', 'Left-hand bat',  26),

-- GOLD — All-Rounders (₹1.5 Cr base)
('Hardik Pandya',      'All-Rounder', 'Fast',   'Indian',   'Capped', 'Gold',     1.50, 'India',       'MI',  'Right-hand bat', 30),
('Ravindra Jadeja',    'All-Rounder', 'Spin',   'Indian',   'Capped', 'Gold',     1.50, 'India',       'CSK', 'Left-hand bat',  35),
('Axar Patel',         'All-Rounder', 'Spin',   'Indian',   'Capped', 'Gold',     1.50, 'India',       'DC',  'Left-hand bat',  30),
('Washington Sundar',  'All-Rounder', 'Spin',   'Indian',   'Capped', 'Gold',     1.50, 'India',       'SRH', 'Right-hand bat', 24),
('Venkatesh Iyer',     'All-Rounder', 'Medium', 'Indian',   'Capped', 'Gold',     1.50, 'India',       'KKR', 'Left-hand bat',  29),
('Liam Livingstone',   'All-Rounder', 'Spin',   'Overseas', 'Capped', 'Gold',     1.50, 'England',     'PBKS','Right-hand bat', 31),
('Mitchell Marsh',     'All-Rounder', 'Fast',   'Overseas', 'Capped', 'Gold',     1.50, 'Australia',   'DC',  'Right-hand bat', 32),
('Glenn Maxwell',      'All-Rounder', 'Spin',   'Overseas', 'Capped', 'Gold',     1.50, 'Australia',   'RCB', 'Right-hand bat', 35),
('Marcus Stoinis',     'All-Rounder', 'Fast',   'Overseas', 'Capped', 'Gold',     1.50, 'Australia',   'LSG', 'Right-hand bat', 34),
('David Miller',       'Batter',      NULL,     'Overseas', 'Capped', 'Gold',     1.50, 'South Africa','GT',  'Left-hand bat',  35),

-- GOLD — Fast Bowlers (₹1.5 Cr base)
('Mohammed Shami',     'Bowler',      'Fast',   'Indian',   'Capped', 'Gold',     1.50, 'India',       'GT',  'Right-arm fast', 33),
('Trent Boult',        'Bowler',      'Fast',   'Overseas', 'Capped', 'Gold',     1.50, 'New Zealand', 'RR',  'Left-arm fast',  34),
('Lockie Ferguson',    'Bowler',      'Fast',   'Overseas', 'Capped', 'Gold',     1.50, 'New Zealand', 'GT',  'Right-arm fast', 32),
('Josh Hazlewood',     'Bowler',      'Fast',   'Overseas', 'Capped', 'Gold',     1.50, 'Australia',   'RCB', 'Right-arm fast', 33),
('Harshal Patel',      'Bowler',      'Fast',   'Indian',   'Capped', 'Gold',     1.50, 'India',       'PBKS','Right-arm fast', 33),
('T Natarajan',        'Bowler',      'Fast',   'Indian',   'Capped', 'Gold',     1.50, 'India',       'SRH', 'Left-arm fast',  32),
('Alzarri Joseph',     'Bowler',      'Fast',   'Overseas', 'Capped', 'Gold',     1.50, 'West Indies', 'MI',  'Right-arm fast', 27),
('Arshdeep Singh',     'Bowler',      'Fast',   'Indian',   'Capped', 'Gold',     1.50, 'India',       'PBKS','Left-arm fast',  25),

-- GOLD — Spinners (₹1.5 Cr base)
('Yuzvendra Chahal',   'Bowler',      'Spin',   'Indian',   'Capped', 'Gold',     1.50, 'India',       'RR',  'Right-arm leg',  33),
('Kuldeep Yadav',      'Bowler',      'Spin',   'Indian',   'Capped', 'Gold',     1.50, 'India',       'DC',  'Left-arm wrist', 29),
('Ravichandran Ashwin','Bowler',      'Spin',   'Indian',   'Capped', 'Gold',     1.50, 'India',       'CSK', 'Right-arm off',  37),
('Adam Zampa',         'Bowler',      'Spin',   'Overseas', 'Capped', 'Gold',     1.50, 'Australia',   'RR',  'Right-arm leg',  32),
('Wanindu Hasaranga',  'All-Rounder', 'Spin',   'Overseas', 'Capped', 'Gold',     1.50, 'Sri Lanka',   'RCB', 'Right-arm leg',  26),

-- ============================================================
-- SILVER TIER — Capped Indians (₹1 Cr base)
-- ============================================================
('Suryakumar Yadav',   'Batter',      NULL,     'Indian',   'Capped', 'Silver',   1.00, 'India',       'MI',  'Right-hand bat', 33),
('Deepak Chahar',      'Bowler',      'Fast',   'Indian',   'Capped', 'Silver',   1.00, 'India',       'CSK', 'Right-arm fast', 31),
('Shardul Thakur',     'All-Rounder', 'Fast',   'Indian',   'Capped', 'Silver',   1.00, 'India',       'KKR', 'Right-arm fast', 32),
('Manish Pandey',      'Batter',      NULL,     'Indian',   'Capped', 'Silver',   1.00, 'India',       NULL,  'Right-hand bat', 34),
('Shivam Dube',        'All-Rounder', 'Fast',   'Indian',   'Capped', 'Silver',   1.00, 'India',       'CSK', 'Left-hand bat',  30),
('Deepak Hooda',       'All-Rounder', 'Spin',   'Indian',   'Capped', 'Silver',   1.00, 'India',       'LSG', 'Right-hand bat', 28),
('Nitish Kumar Reddy', 'All-Rounder', 'Fast',   'Indian',   'Capped', 'Silver',   1.00, 'India',       'SRH', 'Right-hand bat', 21),
('Sai Sudharsan',      'Batter',      NULL,     'Indian',   'Capped', 'Silver',   1.00, 'India',       'GT',  'Left-hand bat',  22),
('Tristan Stubbs',     'WK-Batter',   NULL,     'Overseas', 'Capped', 'Silver',   1.00, 'South Africa','MI',  'Right-hand bat', 23),
('Rahul Tewatia',      'All-Rounder', 'Spin',   'Indian',   'Capped', 'Silver',   1.00, 'India',       'GT',  'Left-hand bat',  31),
('Avesh Khan',         'Bowler',      'Fast',   'Indian',   'Capped', 'Silver',   1.00, 'India',       'LSG', 'Right-arm fast', 27),
('Ravi Bishnoi',       'Bowler',      'Spin',   'Indian',   'Capped', 'Silver',   1.00, 'India',       'LSG', 'Right-arm leg',  23),
('Mayank Yadav',       'Bowler',      'Fast',   'Indian',   'Capped', 'Silver',   1.00, 'India',       'LSG', 'Right-arm fast', 22),
('Akash Deep',         'Bowler',      'Fast',   'Indian',   'Capped', 'Silver',   1.00, 'India',       'RCB', 'Right-arm fast', 27),
('Naman Dhir',         'All-Rounder', 'Spin',   'Indian',   'Capped', 'Silver',   1.00, 'India',       'MI',  'Right-hand bat', 23),
('Shashank Singh',     'Batter',      NULL,     'Indian',   'Capped', 'Silver',   1.00, 'India',       'PBKS','Right-hand bat', 30),
('Harpreet Brar',      'All-Rounder', 'Spin',   'Indian',   'Capped', 'Silver',   1.00, 'India',       'PBKS','Left-arm spin',  27),
('Mohit Sharma',       'Bowler',      'Fast',   'Indian',   'Capped', 'Silver',   1.00, 'India',       'GT',  'Right-arm fast', 34),
('Prasidh Krishna',    'Bowler',      'Fast',   'Indian',   'Capped', 'Silver',   1.00, 'India',       'RR',  'Right-arm fast', 27),
('Sandeep Sharma',     'Bowler',      'Fast',   'Indian',   'Capped', 'Silver',   1.00, 'India',       'RR',  'Right-arm fast', 31),
('Shahrukh Khan',      'Batter',      NULL,     'Indian',   'Capped', 'Silver',   1.00, 'India',       'PBKS','Right-hand bat', 28),
('Mukesh Kumar',       'Bowler',      'Fast',   'Indian',   'Capped', 'Silver',   1.00, 'India',       'DC',  'Right-arm fast', 30),
('Priyam Garg',        'Batter',      NULL,     'Indian',   'Capped', 'Silver',   1.00, 'India',       'SRH', 'Right-hand bat', 24),

-- ============================================================
-- BRONZE TIER — Uncapped Indians (₹0.20–0.50 Cr base)
-- ============================================================
('Riyan Parag',        'Batter',      'Spin',   'Indian',   'Uncapped','Bronze',  0.50, 'India',       'RR',  'Right-hand bat', 22),
('Dhruv Jurel',        'WK-Batter',   NULL,     'Indian',   'Uncapped','Bronze',  0.50, 'India',       'RR',  'Right-hand bat', 23),
('Rajat Patidar',      'Batter',      NULL,     'Indian',   'Uncapped','Bronze',  0.50, 'India',       'RCB', 'Right-hand bat', 30),
('Devdutt Padikkal',   'Batter',      NULL,     'Indian',   'Uncapped','Bronze',  0.50, 'India',       'RR',  'Left-hand bat',  24),
('Prabhsimran Singh',  'WK-Batter',   NULL,     'Indian',   'Uncapped','Bronze',  0.50, 'India',       'PBKS','Right-hand bat', 23),
('Yash Dayal',         'Bowler',      'Fast',   'Indian',   'Uncapped','Bronze',  0.30, 'India',       'GT',  'Left-arm fast',  26),
('Nandre Burger',      'Bowler',      'Fast',   'Overseas', 'Uncapped','Bronze',  0.50, 'South Africa',NULL,  'Left-arm fast',  25),
('Rahul Chahar',       'Bowler',      'Spin',   'Indian',   'Uncapped','Bronze',  0.30, 'India',       'MI',  'Right-arm leg',  27),
('Ayush Badoni',       'Batter',      NULL,     'Indian',   'Uncapped','Bronze',  0.20, 'India',       'LSG', 'Right-hand bat', 24),
('Suyash Sharma',      'Bowler',      'Spin',   'Indian',   'Uncapped','Bronze',  0.20, 'India',       'KKR', 'Right-arm leg',  21),
('Rony Talukdar',      'Batter',      NULL,     'Indian',   'Uncapped','Bronze',  0.20, 'India',       'KKR', 'Right-hand bat', 29),
('Vishnu Vinod',       'WK-Batter',   NULL,     'Indian',   'Uncapped','Bronze',  0.20, 'India',       NULL,  'Right-hand bat', 30),
('Manav Suthar',       'Bowler',      'Spin',   'Indian',   'Uncapped','Bronze',  0.20, 'India',       NULL,  'Left-arm spin',  22),
('Aryan Juyal',        'WK-Batter',   NULL,     'Indian',   'Uncapped','Bronze',  0.20, 'India',       NULL,  'Right-hand bat', 22),
('Pukhraj Mann',       'Bowler',      'Spin',   'Indian',   'Uncapped','Bronze',  0.20, 'India',       NULL,  'Left-arm spin',  21),
('Harsh Dubey',        'Bowler',      'Spin',   'Indian',   'Uncapped','Bronze',  0.20, 'India',       NULL,  'Right-arm off',  23),
('Akash Singh',        'Bowler',      'Fast',   'Indian',   'Uncapped','Bronze',  0.20, 'India',       'RR',  'Left-arm fast',  24),
('Yash Thakur',        'Bowler',      'Fast',   'Indian',   'Uncapped','Bronze',  0.20, 'India',       NULL,  'Right-arm fast', 22),
('Avanish Aravelly',   'WK-Batter',   NULL,     'Indian',   'Uncapped','Bronze',  0.20, 'India',       NULL,  'Right-hand bat', 24),
('Shaik Rasheed',      'Batter',      NULL,     'Indian',   'Uncapped','Bronze',  0.20, 'India',       NULL,  'Right-hand bat', 22),

-- ============================================================
-- OVERSEAS UNCAPPED (₹0.50 Cr base)
-- ============================================================
('Romario Shepherd',   'All-Rounder', 'Fast',   'Overseas', 'Uncapped','Bronze',  0.50, 'West Indies', 'LSG', 'Right-arm fast', 28),
('Rahmanullah Gurbaz', 'WK-Batter',   NULL,     'Overseas', 'Uncapped','Bronze',  0.50, 'Afghanistan', 'KKR', 'Right-hand bat', 22),
('Azmatullah Omarzai', 'All-Rounder', 'Fast',   'Overseas', 'Uncapped','Bronze',  0.50, 'Afghanistan', NULL,  'Right-arm fast', 22),
('Mohd Nabi',          'All-Rounder', 'Spin',   'Overseas', 'Uncapped','Bronze',  0.50, 'Afghanistan', NULL,  'Right-arm off',  39),
('Ibrahim Zadran',     'Batter',      NULL,     'Overseas', 'Uncapped','Bronze',  0.50, 'Afghanistan', NULL,  'Right-hand bat', 22),
('Ryan Rickelton',     'WK-Batter',   NULL,     'Overseas', 'Uncapped','Bronze',  0.50, 'South Africa',NULL,  'Left-hand bat',  26),
('Will Jacks',         'All-Rounder', 'Spin',   'Overseas', 'Uncapped','Bronze',  0.50, 'England',     'RCB', 'Right-arm off',  25),
('Tim David',          'Batter',      NULL,     'Overseas', 'Uncapped','Bronze',  0.50, 'Singapore',   'MI',  'Right-hand bat', 28),
('Finn Allen',         'WK-Batter',   NULL,     'Overseas', 'Uncapped','Bronze',  0.50, 'New Zealand', NULL,  'Right-hand bat', 25),
('Devon Conway',       'WK-Batter',   NULL,     'Overseas', 'Uncapped','Bronze',  0.50, 'New Zealand', 'CSK', 'Left-hand bat',  32),
('Rachin Ravindra',    'All-Rounder', 'Spin',   'Overseas', 'Uncapped','Bronze',  0.50, 'New Zealand', 'CSK', 'Left-hand bat',  24),
('Matthew Short',      'All-Rounder', 'Spin',   'Overseas', 'Uncapped','Bronze',  0.50, 'Australia',   NULL,  'Right-hand bat', 27),
('Spencer Johnson',    'Bowler',      'Fast',   'Overseas', 'Uncapped','Bronze',  0.50, 'Australia',   NULL,  'Left-arm fast',  27),
('Nuwan Thushara',     'Bowler',      'Fast',   'Overseas', 'Uncapped','Bronze',  0.50, 'Sri Lanka',   'MI',  'Right-arm fast', 28),
('Maheesh Theekshana', 'Bowler',      'Spin',   'Overseas', 'Uncapped','Bronze',  0.50, 'Sri Lanka',   'CSK', 'Right-arm off',  24),
('Gerald Coetzee',     'Bowler',      'Fast',   'Overseas', 'Uncapped','Bronze',  0.50, 'South Africa','MI',  'Right-arm fast', 24),
('Anrich Nortje',      'Bowler',      'Fast',   'Overseas', 'Capped',  'Silver',  1.00, 'South Africa','DC',  'Right-arm fast', 30),
('Akeal Hosein',       'Bowler',      'Spin',   'Overseas', 'Uncapped','Bronze',  0.50, 'West Indies', NULL,  'Left-arm spin',  27),
('Shimron Hetmyer',    'Batter',      NULL,     'Overseas', 'Capped',  'Silver',  1.00, 'West Indies', 'RR',  'Left-hand bat',  27),
('Kyle Mayers',        'All-Rounder', 'Fast',   'Overseas', 'Uncapped','Bronze',  0.50, 'West Indies', NULL,  'Left-hand bat',  31);

-- ============================================================
-- VERIFY COUNT
-- ============================================================
SELECT
  stock_tier,
  nationality,
  COUNT(*) as player_count,
  ROUND(AVG(base_price),2) as avg_base_price
FROM players
GROUP BY stock_tier, nationality
ORDER BY
  CASE stock_tier
    WHEN 'Icon'     THEN 1
    WHEN 'Platinum' THEN 2
    WHEN 'Gold'     THEN 3
    WHEN 'Silver'   THEN 4
    WHEN 'Bronze'   THEN 5
  END, nationality;
