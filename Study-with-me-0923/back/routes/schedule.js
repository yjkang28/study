const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');

// 📌 일정 등록
router.post('/', scheduleController.createSchedule);

// 📌 특정 스터디 일정 조회
router.get('/study/:studyId', scheduleController.getStudySchedules);

// 📌 메인페이지 전체 일정 조회
router.get('/user/:userId', scheduleController.getUserSchedules);

// 📌 일정 참여 신청
router.post('/join', scheduleController.joinSchedule);

// 📌 일정 참여 취소
router.post('/leave', scheduleController.leaveSchedule);

// 📌 내가 개최한 일정 조회
router.get('/creator/:userId', scheduleController.getSchedulesByCreator);

// 📌 단일 일정 조회 (참여자 + canCheck 포함)
router.get('/:scheduleId', scheduleController.getScheduleById);

module.exports = router;
