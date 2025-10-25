// screens/PlaceReviewScreen.js (모던 버전)
import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { BACKEND_URL } from '@env';

const COLORS = {
  primary: '#4F46E5',
  primaryLight: '#818CF8',
  bg: '#F8FAFC',
  card: '#FFFFFF',
  text: '#0F172A',
  textLight: '#475569',
  muted: '#94A3B8',
  border: '#E2E8F0',
  star: '#FBBF24',
  starBg: '#FEF3C7',
};

function Star({ filled, size = 20, onPress }) {
  return (
    <TouchableOpacity 
      onPress={onPress} 
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      activeOpacity={0.7}
    >
      <Ionicons 
        name={filled ? 'star' : 'star-outline'} 
        size={size} 
        color={COLORS.star} 
      />
    </TouchableOpacity>
  );
}

export default function PlaceReviewScreen({ route, navigation }) {
  const { placeId, placeName = '장소' } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const avgRating = useMemo(() => {
    if (!reviews.length) return 0;
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }, [reviews]);

  const fetchReviews = async () => {
    if (!placeId) return;
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND_URL}/reviews/place/${placeId}`);
      setReviews(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      Alert.alert('불러오기 실패', '리뷰 목록을 가져오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    if (!placeId) return;
    if (myRating < 1) {
      Alert.alert('알림', '별점을 선택해주세요.');
      return;
    }
    try {
      setSubmitting(true);
      await axios.post(`${BACKEND_URL}/reviews/place/${placeId}`, {
        userId: 'tester',
        rating: myRating,
        comment: myComment.trim(),
      });
      setMyRating(0);
      setMyComment('');
      fetchReviews();
      Alert.alert('완료', '리뷰가 등록되었습니다.');
    } catch (e) {
      Alert.alert('실패', '리뷰 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    navigation.setOptions({
      title: '리뷰',
      headerStyle: { backgroundColor: COLORS.card },
      headerTitleStyle: { fontWeight: '700', color: COLORS.text },
    });
    fetchReviews();
  }, [placeId]);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* 헤더: 평균 평점 카드 */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.placeInfo}>
            <Ionicons name="location" size={20} color={COLORS.primary} />
            <Text style={styles.placeName} numberOfLines={1}>{placeName}</Text>
          </View>
        </View>
        
        <View style={styles.ratingDisplay}>
          <View style={styles.ratingLeft}>
            <Text style={styles.ratingNumber}>{avgRating.toFixed(1)}</Text>
            <View style={styles.starsSmall}>
              {[1, 2, 3, 4, 5].map(n => (
                <Ionicons
                  key={n}
                  name={avgRating >= n ? 'star' : avgRating >= n - 0.5 ? 'star-half' : 'star-outline'}
                  size={16}
                  color={COLORS.star}
                  style={{ marginRight: 2 }}
                />
              ))}
            </View>
            <Text style={styles.reviewCount}>{reviews.length}개의 리뷰</Text>
          </View>
          
          {/* 별점 분포 미니 차트 */}
          <View style={styles.ratingBars}>
            {[5, 4, 3, 2, 1].map(rating => {
              const count = reviews.filter(r => r.rating === rating).length;
              const percentage = reviews.length ? (count / reviews.length) * 100 : 0;
              return (
                <View key={rating} style={styles.barRow}>
                  <Text style={styles.barLabel}>{rating}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${percentage}%` }]} />
                  </View>
                  <Text style={styles.barCount}>{count}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* 작성 영역 */}
      <View style={styles.editorCard}>
        <View style={styles.editorHeader}>
          <Ionicons name="create-outline" size={20} color={COLORS.primary} />
          <Text style={styles.editorTitle}>리뷰 작성하기</Text>
        </View>
        
        <View style={styles.starSelector}>
          <Text style={styles.starLabel}>별점을 선택하세요</Text>
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map(n => (
              <Star 
                key={n} 
                filled={myRating >= n} 
                size={32} 
                onPress={() => setMyRating(n)} 
              />
            ))}
          </View>
          {myRating > 0 && (
            <Text style={styles.ratingText}>{myRating}점</Text>
          )}
        </View>

        <TextInput
          style={styles.textArea}
          placeholder="이 장소를 이용한 경험을 공유해주세요 (선택)"
          placeholderTextColor={COLORS.muted}
          value={myComment}
          onChangeText={setMyComment}
          multiline
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.submitBtn, (submitting || myRating === 0) && styles.submitBtnDisabled]}
          onPress={submitReview}
          disabled={submitting || myRating === 0}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.submitText}>리뷰 등록</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* 리뷰 목록 */}
      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>전체 리뷰</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{reviews.length}</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            data={reviews}
            keyExtractor={(item, idx) => item._id || String(idx)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewStars}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <Ionicons
                        key={n}
                        name={item.rating >= n ? 'star' : 'star-outline'}
                        size={14}
                        color={COLORS.star}
                        style={{ marginRight: 2 }}
                      />
                    ))}
                    <Text style={styles.reviewRating}>{item.rating}.0</Text>
                  </View>
                  <Text style={styles.reviewDate}>
                    {new Date(item.createdAt).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </Text>
                </View>
                
                {item.comment ? (
                  <Text style={styles.reviewComment}>{item.comment}</Text>
                ) : (
                  <Text style={styles.reviewCommentEmpty}>작성된 리뷰 내용이 없습니다</Text>
                )}

                <View style={styles.reviewFooter}>
                  <View style={styles.userBadge}>
                    <Ionicons name="person-circle-outline" size={16} color={COLORS.muted} />
                    <Text style={styles.userId}>{item.userId || '익명'}</Text>
                  </View>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="chatbox-outline" size={48} color={COLORS.muted} />
                </View>
                <Text style={styles.emptyText}>첫 리뷰를 남겨주세요</Text>
                <Text style={styles.emptySubtext}>
                  이 장소에 대한 경험을 공유해주시면{'\n'}다른 사용자들에게 큰 도움이 됩니다
                </Text>
              </View>
            }
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  headerCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  headerTop: {
    marginBottom: 20,
  },
  placeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  placeName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  ratingDisplay: {
    flexDirection: 'row',
    gap: 20,
  },
  ratingLeft: {
    alignItems: 'center',
    paddingRight: 20,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  ratingNumber: {
    fontSize: 40,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  starsSmall: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  reviewCount: {
    fontSize: 13,
    color: COLORS.muted,
    fontWeight: '600',
  },
  ratingBars: {
    flex: 1,
    gap: 4,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textLight,
    width: 12,
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: COLORS.star,
    borderRadius: 3,
  },
  barCount: {
    fontSize: 11,
    color: COLORS.muted,
    width: 20,
    textAlign: 'right',
  },
  editorCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  editorTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  starSelector: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.starBg,
    borderRadius: 16,
  },
  starLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLight,
    marginBottom: 12,
  },
  starRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.star,
  },
  textArea: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    minHeight: 100,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.bg,
    marginBottom: 12,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    backgroundColor: COLORS.muted,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  listContainer: {
    flex: 1,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  countBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  loadingContainer: {
    paddingTop: 40,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  reviewCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewStars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewRating: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  reviewDate: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '500',
  },
  reviewComment: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  reviewCommentEmpty: {
    fontSize: 14,
    color: COLORS.muted,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  reviewFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userId: {
    fontSize: 13,
    color: COLORS.muted,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});