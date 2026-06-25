const express = require('express');
const router = express.Router();
const db = require('../config/db');

// @route    GET api/trending
// @desc     Get all trending fake news alerts
// @access   Public
router.get('/', (req, res) => {
  try {
    const trending = db.getTrending();
    res.json(trending);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// @route    POST api/trending/report
// @desc     Report/flag a viral fake news piece
// @access   Public
router.post('/report', (req, res) => {
  const { title, category, url } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Title is required to flag a story' });
  }

  try {
    let trending = db.getTrending();
    
    // Check if it already exists
    let item = trending.find(t => t.title.toLowerCase() === title.toLowerCase());
    if (item) {
      // Increment share/reports count
      let numericShares = parseInt(item.shares.replace('K', '')) || 1;
      item.shares = (numericShares + 1) + 'K';
    } else {
      let domain = 'Social Media Post';
      if (url) {
        try {
          domain = new URL(url).hostname.replace('www.', '');
        } catch (e) {
          domain = url;
        }
      }
      
      const newItem = {
        id: Date.now().toString(),
        title,
        category: category || 'Fake News',
        shares: '1K',
        verification: 'Under review by fact-checking coalition.',
        credibility: Math.floor(Math.random() * 30) + 5,
        date: new Date().toISOString().split('T')[0]
      };
      trending.unshift(newItem);
    }
    
    db.saveTrending(trending);
    res.json({ message: 'Story flagged and logged successfully', trending });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
