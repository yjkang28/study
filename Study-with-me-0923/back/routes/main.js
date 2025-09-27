const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Study = require('../models/Study');
const Schedule = require('../models/Schedule');

// 📌 GET /main/:userId → 스터디 목록 + 일정까지 내려주기
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // 1. 가입 스터디 목록
    const studies = await Study.find({ members: userId }).populate('host', 'username');

    // 2. 가입한 스터디들의 _id 배열
    const studyIds = studies.map(s => s._id);

    // 3. 해당 스터디들의 일정
    const schedules = await Schedule.find({ study: { $in: studyIds } })
      .sort({ startDate: 1, startTime: 1 })
      .populate('study', 'title');

    res.json({ studies, schedules });
  } catch (error) {
    console.error('❌ 메인 데이터 조회 실패:', error.message);
    res.status(500).json({ message: '메인 데이터 조회 실패' });
  }
});

module.exports = router;
