import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Switch,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { BACKEND_URL } from '@env';
import { useFocusEffect } from '@react-navigation/native';

export default function StudyIntroScreen({ route, navigation }) {
  const { study: initialStudy, userId } = route.params || {};
  const [study, setStudy] = useState(initialStudy || {});
  const [comments, setComments] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [comment, setComment] = useState('');
  const [isSecret, setIsSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rankInfo, setRankInfo] = useState(null);
  const [applied, setApplied] = useState(false);
  const [joinMessage, setJoinMessage] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);

  // ⭐ 별점 표시
  const renderStars = (rating) => (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={18}
          color="#FFD700"
          style={{ marginHorizontal: 1 }}
        />
      ))}
    </View>
  );

  // 데이터 불러오기
  const fetchData = async () => {
    try {
      const resStudy = await axios.get(`${BACKEND_URL}/studies/${study._id}`);
      setStudy(resStudy.data);

      const resComments = await axios.get(
        `${BACKEND_URL}/comments/${study._id}?viewerId=${userId}`
      );
      setComments(resComments.data);

      const resReviews = await axios.get(
        `${BACKEND_URL}/reviews/${study._id}?userId=${userId}`
      );
      setAvgRating(resReviews.data.average);
      setReviewCount(resReviews.data.count);

      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      try {
        const resRank = await axios.get(
          `${BACKEND_URL}/attendance/study/${study._id}/global-rank?month=${month}`
        );
        setRankInfo(resRank.data);
      } catch (_) {
        setRankInfo(null);
      }
    } catch (err) {
      console.error('❌ 스터디 상세 불러오기 실패:', err.message);
    }
  };

  useEffect(() => {
    if (study?._id) fetchData();
  }, [study?._id, userId]);

  useFocusEffect(
    React.useCallback(() => {
      if (study?._id) fetchData();
    }, [study?._id, userId])
  );

  // 가입 신청 실행
  const handleJoin = async () => {
    if (!joinMessage.trim()) {
      Alert.alert('알림', '가입 신청 메시지를 입력하세요.');
      return;
    }
    try {
      setLoading(true);
      await axios.post(`${BACKEND_URL}/applications/${study._id}/apply`, {
        userId,
        message: joinMessage,
      });
      setApplied(true);
      Alert.alert('가입 신청 완료', '승인 대기 중입니다.');
      setShowJoinModal(false);
      setJoinMessage('');
    } catch (err) {
      const msg = err.response?.data?.message || '다시 시도해주세요.';
      if (msg.includes('이미 신청')) {
        setApplied(true);
        Alert.alert('알림', '이미 가입 신청이 접수되어 승인 대기 중입니다.');
      } else {
        Alert.alert('가입 실패', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // 댓글 작성
  const handleAddComment = async () => {
    if (!comment.trim()) return;
    try {
      const res = await axios.post(`${BACKEND_URL}/comments/${study._id}`, {
        userId,
        content: comment,
        isSecret,
      });
      setComments([res.data, ...comments]);
      setComment('');
      setIsSecret(false);
    } catch (err) {
      console.error('❌ 댓글 작성 실패:', err.message);
      Alert.alert('댓글 작성 실패', '다시 시도해주세요.');
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId) => {
    try {
      await axios.delete(`${BACKEND_URL}/comments/${commentId}`, { data: { userId } });
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      Alert.alert('삭제 완료', '댓글이 삭제되었습니다.');
    } catch (err) {
      Alert.alert('댓글 삭제 실패', '삭제 권한이 없거나 오류가 발생했습니다.');
    }
  };

  const isHost = String(study?.host?._id) === String(userId);
  const isMember = (study?.members || []).some((m) => String(m._id) === String(userId));
  const isFull = study?.capacity > 0 && (study?.members?.length || 0) >= study.capacity;

  // ✅ 호스트는 비활성화되지 않도록
  const joinDisabled = loading || (!isHost && (isMember || isFull || applied));

  const joinLabel = isHost
    ? '가입 관리'
    : isMember
    ? '이미 가입됨'
    : isFull
    ? '정원 마감'
    : applied
    ? '가입중'
    : '가입 신청';

  const onPressJoin = () => {
    if (isHost) {
      navigation.navigate('ApplicationManageScreen', { studyId: study._id, userId });
      return;
    }
    setShowJoinModal(true);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* 상단 헤더 카드: 제목 + 리더명 + 태그 + 메타 */}
      <View style={styles.headerCard}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{study?.title || '스터디 이름'}</Text>
        </View>
        <View style={styles.leaderRow}>
          <Ionicons name="person-circle" size={18} color="#0A2540" />
          <Text style={styles.leaderName}>{study?.host?.username || '스터디장'}</Text>
        </View>
        {/* 메타 */}
        <View style={styles.metaRow}>
          <Text style={styles.infoText}>인원 {study?.members?.length || 0} / {study?.capacity || '00'}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.infoText}>개설일 {study?.createdAt?.slice(0, 10) || '20##/##/##'}</Text>
        </View>
        

        {/* 태그 */}
        <View style={styles.tagRow}>
          <Text style={styles.tag}>{study?.duration || '자유'}</Text>
          <Text style={styles.tag}>{study?.category || '카테고리'}</Text>
          {!!study?.subCategory && <Text style={styles.tag}>{study.subCategory}</Text>}
          {!!study?.gender_rule && <Text style={styles.tag}>{study.gender_rule}</Text>}
        </View>

  
      </View>


      {/* 소개 카드 */}
      <View style={styles.descCard}>
        <Text style={styles.descTitle}>소개글</Text>
        <Text style={styles.description}>
          {study?.description || '스터디 설명이 없습니다.'}
        </Text>
      </View>

      {/* 출석률 */}
      {rankInfo && (
        <View style={styles.rankBox}>
          <Text style={styles.rankText}>
            이번달 출석률 : {rankInfo.출석률}% ({rankInfo.rank}위)
          </Text>
        </View>
      )}

      {/* 리뷰 (카드) */}
      <TouchableOpacity
        style={styles.ratingCard}
        onPress={() => navigation.navigate('ReviewScreen', { studyId: study._id, userId })}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.ratingLabel}>스터디 평점</Text>
          {renderStars(avgRating)}
          <Text style={styles.ratingMeta}> ({avgRating} / {reviewCount}개)</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#6B7280" />
      </TouchableOpacity>

      {/* 댓글 (최신 3개 + 전체 보기) */}
      <Text style={styles.sectionTitle}>댓글</Text>
      <View style={styles.commentList}>
        {comments.slice(0, 3).map((c) => (
          <View key={c._id} style={styles.commentCard}>
            <View style={styles.commentLeft}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(c.user.username || 'U').slice(0, 1).toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.commentBody}>
              <View style={styles.commentHeader}>
                <Text style={styles.commentUser}>{c.user.username}</Text>
                {(String(c.user._id) === String(userId) || isHost) && (
                  <TouchableOpacity onPress={() => handleDeleteComment(c._id)}>
                    <Ionicons name="trash" size={16} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.commentText}>{c.content}</Text>
            </View>
          </View>
        ))}
        {comments.length > 3 && (
          <TouchableOpacity
            style={styles.moreCommentsBtn}
            onPress={() => navigation.navigate('CommentScreen', { studyId: study._id, userId })}
          >
            <Text style={styles.moreCommentsText}>전체 댓글 보기</Text>
            <Ionicons name="chevron-forward" size={14} color="#2563EB" />
          </TouchableOpacity>
        )}
      </View>

      {/* 댓글 컴포저 카드 */}
      <View style={styles.commentCardBox}>
        {/* 상단: 비밀 토글 */}
        <View style={styles.secretRowTop}>
          <Text style={styles.secretTopLabel}>비밀</Text>
          <Switch
            value={isSecret}
            onValueChange={setIsSecret}
            ios_backgroundColor="#E5E7EB"
            trackColor={{ false: '#E5E7EB', true: '#BAE6FD' }}
            thumbColor={isSecret ? '#0EA5E9' : '#F3F4F6'}
            style={styles.secretSwitchSmall}
          />
        </View>

        {/* 하단: 입력창 + 전송 버튼 */}
        <View style={styles.composerBottomRow}>
          <TextInput
            style={styles.composerInputField}
            placeholder="댓글을 입력하세요"
            value={comment}
            onChangeText={setComment}
            returnKeyType="send"
            onSubmitEditing={handleAddComment}
          />
          <TouchableOpacity style={styles.sendBtnDark} onPress={handleAddComment}>
            <Text style={styles.sendBtnText}>전송</Text>
          </TouchableOpacity>
        </View>
      </View>


      {/* 가입 신청 / 관리 버튼 */}
      <TouchableOpacity
        style={[styles.joinBtn, joinDisabled && { backgroundColor: '#999' }]}
        onPress={onPressJoin}
        disabled={joinDisabled}
      >
        <Text style={styles.joinText}>{joinLabel}</Text>
      </TouchableOpacity>

      {/* 가입신청 메시지 모달 */}
      <Modal visible={showJoinModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>가입 신청 메시지</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="간단한 메시지를 입력하세요"
              value={joinMessage}
              onChangeText={setJoinMessage}
              multiline
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#ccc' }]}
                onPress={() => {
                  setShowJoinModal(false);
                  setJoinMessage('');
                }}
              >
                <Text>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#003366' }]}
                onPress={handleJoin}
              >
                <Text style={{ color: 'white' }}>신청</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingVertical: 16,
    paddingHorizontal: 10,
   },

  /* 상단 카드 */
  headerCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 22, fontWeight: '800', color: '#0A2540' },
  leaderRow: { marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 6 },
  leaderName: { fontSize: 14, color: '#334155', fontWeight: '600' },
  tagRow: { flexDirection: 'row', marginTop: 10, flexWrap: 'wrap' },
  tag: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    color: '#17A1FA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 6,
    fontSize: 12,
  },
  metaRow: { marginTop: 6, flexDirection: 'row', alignItems: 'center' },
  infoText: { fontSize: 13, color: '#475569' },
  dot: { marginHorizontal: 6, color: '#94A3B8' },

  /* 소개 카드 */
  descCard: {
    backgroundColor: '#FFFFFF',
    //borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  descTitle: { fontSize: 14, color: '#64748B', fontWeight: '700', marginBottom: 6 },
  description: { fontSize: 14, color: '#111827', lineHeight: 20 },

  /* 출석 */
  rankBox: {
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 15,
    marginBottom: 16,
  },
  rankText: { fontSize: 14, fontWeight: 'bold', color: '#333' },

  /* 리뷰 카드 */
  ratingCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  ratingLabel: { marginRight: 8, fontWeight: '700', fontSize: 14, color: '#0F172A' },
  ratingMeta: { marginLeft: 6, color: '#334155', fontSize: 12 },

  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginVertical: 8 },

  /* 댓글 리스트/카드 */
  commentList: { marginBottom: 12 },
  commentCard: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    marginBottom: 8,
  },
  commentLeft: { marginRight: 10, alignItems: 'center' },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 12, fontWeight: '700', color: '#3730A3' },
  commentBody: { flex: 1 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  commentUser: { fontWeight: '700', color: '#0F172A' },
  commentText: { color: '#334155' },
  moreCommentsBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  moreCommentsText: { color: '#2563EB', fontWeight: '600' },

 /* 댓글 컴포저 */
commentCardBox: {
  padding: 10,
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  borderWidth: StyleSheet.hairlineWidth,
  borderColor: '#E5E7EB',
  marginTop: 6,
  marginBottom: 12,
},

/* 상단: 비밀 토글 라인 */
secretRowTop: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 10,
},
secretTopLabel: {
  fontSize: 13,
  color: '#6B7280',
  marginRight: 6,
},
secretSwitchSmall: {
  transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }], // 작게
},

/* 하단: 입력 + 버튼 */
composerBottomRow: {
  flexDirection: 'row',
  alignItems: 'center',
},
composerInputField: {
  flex: 1,
  minHeight: 42,
  paddingHorizontal: 14,
  paddingVertical: 10,
  backgroundColor: '#F3F4F6',   // 연한 회색 배경
  borderRadius: 20,             // 둥근 캡슐
  fontSize: 14,
  color: '#111827',
  marginRight: 8,
},
sendBtnDark: {
  paddingHorizontal: 14,
  height: 42,
  borderRadius: 30,
  backgroundColor: '#003366',   // 진남색
  alignItems: 'center',
  justifyContent: 'center',
},
sendBtnText: {
  color: '#FFFFFF',
  fontWeight: '700',
  fontSize: 13,
},
  
  /* 가입 버튼 */
  joinBtn: {
    backgroundColor: '#003366',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  joinText: { color: 'white', fontSize: 16, fontWeight: 'bold' },

  /* 모달 */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
});