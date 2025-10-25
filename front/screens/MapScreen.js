//수정완료
// screens/MapScreen.js 
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Platform, Modal, Pressable, Alert, Linking, FlatList, Animated, PanResponder, Dimensions
} from 'react-native';
import { WebView } from 'react-native-webview';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { BACKEND_URL, KAKAO_JS_KEY } from '@env'; // ✅ env에서 불러옴
import * as Location from 'expo-location';        // ✅ 정적 import
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

// ---------- 색상/상수 ----------
const COLORS = {
  primary: '#4F46E5',
  primaryLight: '#818CF8',
  bg: '#F8FAFC',
  card: '#FFFFFF',
  text: '#0F172A',
  textLight: '#475569',
  muted: '#94A3B8',
  border: '#E2E8F0',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  star: '#FBBF24',
};
const DEFAULT_CENTER = { latitude: 35.1335, longitude: 129.105 };

// 바텀시트 스냅(디자인은 2단, 로직은 동일)
const SNAP_POINTS = [0.0, 0.5];
const MAX_SHEET_PCT = 0.85;
const WIN_H = Dimensions.get('window').height;

// ---------- 메인 컴포넌트 ----------
export default function MapScreen({ route, navigation }) {
  const webRef = useRef(null);
  const [userId, setUserId] = useState(null);

  // 지도/필터 상태
  const [region, setRegion] = useState(DEFAULT_CENTER);
  const [myLocation, setMyLocation] = useState(null);
  const [query, setQuery] = useState('');
  const [onlyOutlets, setOnlyOutlets] = useState(false);
  const [only24h, setOnly24h] = useState(false);
  const [maxNoise, setMaxNoise] = useState(5); // 디자인 버전 유지
  const [typeCafe, setTypeCafe] = useState(true);
  const [typeStudy, setTypeStudy] = useState(true);
  const [typeLibrary, setTypeLibrary] = useState(true);
  const [typeOther, setTypeOther] = useState(true);
  const [onlyGroup, setOnlyGroup] = useState(false); // ✅ 2번 코드 확장
  const [onlyWifi, setOnlyWifi] = useState(false);   // ✅ 2번 코드 확장
  const [onlyFav, setOnlyFav] = useState(false);

  const [places, setPlaces] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [selected, setSelected] = useState(null);

  const [visiblePlaces, setVisiblePlaces] = useState([]); // ✅ bounds 기반
  const boundsTimeout = useRef(null);

  const [showFilter, setShowFilter] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [ratingMap, setRatingMap] = useState({});

  // 바텀시트
  const [sheetHeight] = useState(new Animated.Value(0));
  const sheetRatioRef = useRef(SNAP_POINTS[1]);
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderMove: (_, g) => {
        const delta = -g.dy / (WIN_H * MAX_SHEET_PCT);
        let next = Math.max(0, Math.min(1, sheetRatioRef.current + delta));
        sheetHeight.setValue(next);
      },
      onPanResponderRelease: (_, g) => {
        sheetRatioRef.current = snapTo(sheetHeight, g.vy);
      },
    })
  ).current;
  const animatedSheetHeight = Animated.multiply(sheetHeight, WIN_H * MAX_SHEET_PCT);
  const sheetAnimatedStyle = { height: animatedSheetHeight };

  // 즐겨찾기/장소 불러오기
  const fetchFavorites = async (uid = userId) => {
    try {
      if (!uid) return;
      const res = await axios.get(`${BACKEND_URL}/favorites`, { params: { userId: uid } });
      const arr = Array.isArray(res.data) ? res.data : [];
      setFavorites(new Set(arr.map(it => (it.place?._id || it.place))));
    } catch (e) {
      console.log('getFavorites fail', e?.response?.data || e.message);
    }
  };

  const fetchPlaces = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND_URL}/places`);
      const list = Array.isArray(res.data) ? res.data : [];
      // 각 장소 평균 평점 보강 (가능하면 /avg API 먼저 사용)
      const withAvg = await Promise.all(list.map(async (p) => {
        try {
          const avgRes = await axios.get(`${BACKEND_URL}/reviews/place/${p._id}/avg`);
          return { ...p, avg: avgRes.data?.avg ?? 0, reviewCount: avgRes.data?.count ?? 0 };
        } catch {
          return { ...p, avg: 0, reviewCount: 0 };
        }
      }));
      setPlaces(withAvg);
    } catch (err) {
      console.error('장소 불러오기 실패:', err.message);
      Alert.alert('실패', '장소 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchPlaces(); }, []));
  useEffect(() => { (async () => { const id = await AsyncStorage.getItem('userId'); if (id) setUserId(id); })(); }, []);
  useEffect(() => { if (userId) fetchFavorites(); }, [userId]);

  // 초기가동: 시트 위치
  useEffect(() => {
    Animated.timing(sheetHeight, { toValue: SNAP_POINTS[1], duration: 0, useNativeDriver: false }).start();
    sheetRatioRef.current = SNAP_POINTS[1];
  }, []);

  // 필터링
  const filteredPlaces = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (places || [])
      .filter(p => (q ? (p.name?.toLowerCase().includes(q) || p.address?.toLowerCase().includes(q)) : true))
      .filter(p => {
        const t = p.type || 'other';
        return (typeCafe && t === 'cafe') || (typeStudy && t === 'study') ||
               (typeLibrary && t === 'library') || (typeOther && t === 'other');
      })
      .filter(p => (onlyOutlets ? p.powerOutlet : true))
      .filter(p => (only24h ? p.open_24h : true))
      .filter(p => (onlyGroup ? p.groupAvailable : true))   // ✅ 확장
      .filter(p => (onlyWifi ? p.wifi : true))               // ✅ 확장
      .filter(p => ((p.noise || 1) <= maxNoise))             // 디자인 항목 유지
      .filter(p => (onlyFav ? favorites.has(p._id) : true));
  }, [places, query, typeCafe, typeStudy, typeLibrary, typeOther, onlyOutlets, only24h, onlyGroup, onlyWifi, maxNoise, onlyFav, favorites]);

  // 리스트 데이터: 즐겨찾기 모드면 filtered 중 즐겨찾기만, 아니면 bounds 안의 보이는 장소
  const listData = useMemo(() => {
    if (onlyFav) return filteredPlaces.filter(p => favorites.has(p._id));
    const idsInBounds = new Set(visiblePlaces.map(p => p._id));
    return filteredPlaces.filter(p => idsInBounds.has(p._id));
  }, [onlyFav, filteredPlaces, visiblePlaces, favorites]);

  // Kakao HTML (기능 확장: updatePlaces/moveToLocation/updateMyLocation/bounds_changed)
  const html = useMemo(() => buildKakaoHtml(KAKAO_JS_KEY, DEFAULT_CENTER, [], null), []);

  // WebView로 places/myLocation 반영
  useEffect(() => {
    if (webRef.current) {
      webRef.current.injectJavaScript(`
        window.updatePlaces(${JSON.stringify(filteredPlaces)});
        true;
      `);
    }
  }, [filteredPlaces]);

  // 메시지 처리 (마커클릭/경계변화)
  const onMessage = (e) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === 'marker_click') {
        setSelected(msg.place);
        setShowDetail(true);
      } else if (msg.type === 'bounds_changed') {
        if (boundsTimeout.current) clearTimeout(boundsTimeout.current);
        boundsTimeout.current = setTimeout(() => {
          const ids = new Set((msg.places || []).map(p => p._id));
          const matched = (filteredPlaces || []).filter(p => ids.has(p._id));
          setVisiblePlaces(matched);
        }, 300); // 디바운스
      }
    } catch {}
  };

  // 즐겨찾기 토글
  const toggleFav = async (placeId) => {
    try {
      if (!placeId) return;
      const uid = userId || await AsyncStorage.getItem('userId');
      if (!uid) {
        Alert.alert('로그인이 필요합니다', '다시 로그인해주세요.');
        return;
      }
      const res = await axios.post(`${BACKEND_URL}/favorites/toggle`, { userId: uid, placeId });
      const { isFavorite } = res.data || {};
      setFavorites(prev => {
        const next = new Set(prev);
        if (isFavorite) next.add(placeId); else next.delete(placeId);
        return next;
      });
    } catch (e) {
      console.log('toggleFav fail', e?.response?.data || e.message);
      Alert.alert('실패', '즐겨찾기 반영 실패');
    }
  };

  // 특정 장소로 초점 이동
  const focusOnPlace = (place) => {
    if (!place?.latitude || !place?.longitude) return;
    webRef.current?.injectJavaScript(`window.moveToLocation(${place.latitude}, ${place.longitude}); true;`);
    setSelected(place);
    setShowDetail(true);
  };

  // 현재 위치
  const [locating, setLocating] = useState(false);
  const jumpToCurrent = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '위치 권한을 허용해주세요.');
        return;
      }
      let loc = await Location.getLastKnownPositionAsync().catch(() => null);
      if (!loc) {
        loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          mayShowUserSettingsDialog: false,
        });
      }
      const me = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setRegion(me);
      setMyLocation(me);
      webRef.current?.injectJavaScript(`window.updateMyLocation(${me.latitude}, ${me.longitude}); true;`);
    } catch {
      Alert.alert('현재 위치 사용 불가');
    } finally {
      setLocating(false);
    }
  };

  // 장소 추가 모달 상태
  const [newName, setNewName] = useState('');
  const [newAddr, setNewAddr] = useState('');
  const [newHours, setNewHours] = useState('');
  const [newTables, setNewTables] = useState('');
  const [newOutlets, setNewOutlets] = useState('');
  const [newType, setNewType] = useState('other');
  const [newWifi, setNewWifi] = useState(false);

  const handleAddPlace = async () => {
    if (!newName.trim() || !newAddr.trim()) {
      Alert.alert('알림', '이름과 주소는 필수 입력입니다.');
      return;
    }
    try {
      await axios.post(`${BACKEND_URL}/places/request-add`, {
        requestType: 'add',
        type: newType || 'other',
        name: newName.trim(),
        address: newAddr.trim(),
        openingHours: newHours.trim(),
        seatCount: parseInt(newTables) || 0,
        powerOutlet: (parseInt(newOutlets) || 0) > 0,
        wifi: newWifi,
      }, { headers: { 'Content-Type': 'application/json' } });
      Alert.alert('완료', '추가 요청이 접수되었습니다.\n관리자 검토 후 반영됩니다.');
      setShowAddModal(false);
      setNewName(''); setNewAddr(''); setNewHours(''); setNewTables(''); setNewOutlets(''); setNewType('other'); setNewWifi(false);
      fetchPlaces();
    } catch (e) {
      console.error('❌ 장소 추가 요청 실패:', e);
      Alert.alert('실패', '추가 요청 전송에 실패했습니다.');
    }
  };

  // 리스트 뷰에 보일 때 평균 평점 지연 로딩(보조)
  const ensurePlaceRating = async (placeId) => {
    if (!placeId || ratingMap[placeId]) return;
    try {
      let avg = null, count = 0;
      try {
        const r1 = await axios.get(`${BACKEND_URL}/reviews/place/${placeId}/avg`);
        if (typeof r1.data?.avg === 'number') { avg = r1.data.avg; count = r1.data.count || 0; }
      } catch {}
      if (avg == null) {
        const r2 = await axios.get(`${BACKEND_URL}/reviews/place/${placeId}`);
        const arr = Array.isArray(r2.data) ? r2.data : [];
        if (arr.length) {
          const sum = arr.reduce((a, c) => a + (c.rating || 0), 0);
          avg = Math.round((sum / arr.length) * 10) / 10;
          count = arr.length;
        } else { avg = 0; count = 0; }
      }
      setRatingMap(prev => ({ ...prev, [placeId]: { avg, count } }));
    } catch {
      setRatingMap(prev => ({ ...prev, [placeId]: { avg: 0, count: 0 } }));
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Kakao 지도 */}
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={{ html }}
        onMessage={onMessage}
        style={StyleSheet.absoluteFillObject}
        onLoadEnd={() => {
          if (filteredPlaces) {
            webRef.current?.injectJavaScript(`window.updatePlaces(${JSON.stringify(filteredPlaces)}); true;`);
          }
          if (myLocation) {
            webRef.current?.injectJavaScript(`window.updateMyLocation(${myLocation.latitude}, ${myLocation.longitude}); true;`);
          }
        }}
        onError={(e) => console.error('❌ WebView 오류:', e.nativeEvent)}
      />

      {/* 상단 검색바 + 필터 버튼 (디자인 적용) */}
      <View style={styles.topBar}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={COLORS.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="장소 검색"
            placeholderTextColor={COLORS.muted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.muted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilter(true)}>
          <Ionicons name="options" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* 우측 플로팅 버튼들 (디자인 적용) */}
      <View style={styles.fabCol}>
        <TouchableOpacity style={[styles.fab, locating && { opacity: 0.6 }]} onPress={jumpToCurrent} disabled={locating}>
          <Ionicons name={locating ? 'locate-outline' : 'locate'} size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.fab, onlyFav && styles.fabActive]} onPress={() => setOnlyFav(v => !v)}>
          <Ionicons name={onlyFav ? 'star' : 'star-outline'} size={22} color={onlyFav ? '#fff' : COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* 바텀시트 리스트 (디자인 적용 + bounds 데이터 사용) */}
      <Animated.View style={[styles.listPanel, sheetAnimatedStyle]} {...panResponder.panHandlers}>
        <TouchableOpacity style={styles.grabber} onPress={() => { sheetRatioRef.current = nextSnap(sheetHeight); }}>
          <View style={styles.grabberBar} />
        </TouchableOpacity>

        <View style={styles.listHeader}>
          <Text style={styles.listHeaderText}>
            {onlyFav ? '즐겨찾기' : '장소'} {listData.length}개
          </Text>
          {onlyFav && (
            <View style={styles.favBadge}>
              <Ionicons name="star" size={12} color="#fff" />
              <Text style={styles.favBadgeText}>즐겨찾기 모드</Text>
            </View>
          )}
        </View>

        <FlatList
          data={listData}
          keyExtractor={(item, idx) => item?._id || item?.id || String(idx)}
          onViewableItemsChanged={({ viewableItems }) => {
            viewableItems.forEach(v => ensurePlaceRating(v.item?._id));
          }}
          viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="map-outline" size={48} color={COLORS.muted} />
              <Text style={styles.emptyText}>
                {onlyFav ? '즐겨찾기한 장소가 없습니다' : '조건/화면에 보이는 장소가 없습니다'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            if (!item) return null;
            const tagType = toTypeLabelIcon(item.type);
            const r = ratingMap[item._id];
            return (
              <TouchableOpacity style={styles.placeCard} onPress={() => focusOnPlace(item)} activeOpacity={0.7}>
                <View style={styles.placeLeft}>
                  <View style={[styles.typeIcon, { backgroundColor: getTypeColor(item.type) }]}>
                    <Ionicons name={tagType.icon} size={20} color="#fff" />
                  </View>
                  <View style={styles.placeInfo}>
                    <View style={styles.placeNameRow}>
                      <Text style={styles.placeName}>{item.name || '이름 없음'}</Text>
                      <View style={[styles.typeBadge, { backgroundColor: `${getTypeColor(item.type)}15` }]}>
                        <Text style={[styles.typeBadgeText, { color: getTypeColor(item.type) }]}>
                          {tagType.label}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.placeAddr} numberOfLines={1}>{item.address || '주소 없음'}</Text>

                    <View style={styles.tagRow}>
                      {item.powerOutlet && <Tag icon="flash" text="콘센트" />}
                      {(item.openingHours || item.open_24h) && (
                        <Tag icon="time" text={item.open_24h ? '24시간' : item.openingHours} />
                      )}
                      {item.wifi && <Tag icon="wifi" text="Wi-Fi" />}
                      {item.groupAvailable && <Tag icon="people" text="그룹 이용" />}
                    </View>

                    <View style={styles.ratingRow}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <Ionicons
                          key={n}
                          name={r && r.avg >= n ? 'star' : r && r.avg >= n - 0.5 ? 'star-half' : 'star-outline'}
                          size={12}
                          color={COLORS.star}
                        />
                      ))}
                      <Text style={styles.ratingText}>
                        {r ? `${(r.avg ?? 0).toFixed(1)}점 (${r.count ?? 0})` : '평점 계산 중'}
                      </Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity onPress={() => toggleFav(item._id)} style={styles.favButton}>
                  <Ionicons name={favorites.has(item._id) ? 'star' : 'star-outline'} size={22} color={COLORS.star} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
      </Animated.View>

      {/* 필터 모달 (디자인 + Wi-Fi/그룹 추가, 소음 슬라이더 유지) */}
      <Modal visible={showFilter} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.filterModal}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>필터</Text>

            <View style={styles.filterGroup}>
              <FilterToggle label="콘센트 있음" icon="flash" value={onlyOutlets} onToggle={() => setOnlyOutlets(v => !v)} />
              <FilterToggle label="24시간 운영" icon="time" value={only24h} onToggle={() => setOnly24h(v => !v)} />
            </View>

            <View style={styles.filterGroup}>
              <FilterToggle label="Wi-Fi 있음" icon="wifi" value={onlyWifi} onToggle={() => setOnlyWifi(v => !v)} />
              <FilterToggle label="그룹 이용" icon="people" value={onlyGroup} onToggle={() => setOnlyGroup(v => !v)} />
            </View>

            <View style={styles.sliderGroup}>
              <Text style={styles.sliderLabel}>최대 소음도</Text>
              <View style={styles.sliderValue}>
                <Text style={styles.sliderValueText}>{maxNoise}단계</Text>
              </View>
              <Slider
                minimumValue={1}
                maximumValue={5}
                step={1}
                value={maxNoise}
                onValueChange={setMaxNoise}
                minimumTrackTintColor={COLORS.primary}
                maximumTrackTintColor={COLORS.border}
                thumbTintColor={COLORS.primary}
              />
            </View>

            <View style={styles.typeGrid}>
              <TypeButton label="카페" icon="cafe" active={typeCafe} onPress={() => setTypeCafe(v => !v)} />
              <TypeButton label="스터디" icon="school" active={typeStudy} onPress={() => setTypeStudy(v => !v)} />
              <TypeButton label="도서관" icon="book" active={typeLibrary} onPress={() => setTypeLibrary(v => !v)} />
              <TypeButton label="기타" icon="location" active={typeOther} onPress={() => setTypeOther(v => !v)} />
            </View>

            <TouchableOpacity style={styles.applyButton} onPress={() => setShowFilter(false)}>
              <Text style={styles.applyButtonText}>적용</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 상세 모달 (디자인 유지 + 액션) */}
      <Modal visible={showDetail} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowDetail(false)} />
        {selected && (
          <View style={styles.detailModal}>
            <View style={styles.detailHeader}>
              <View style={styles.detailLeft}>
                <View style={[styles.detailTypeIcon, { backgroundColor: getTypeColor(selected.type) }]}>
                  <Ionicons name={toTypeLabelIcon(selected.type).icon} size={24} color="#fff" />
                </View>
                <View>
                  <Text style={styles.detailName}>{selected.name}</Text>
                  <Text style={styles.detailAddr} numberOfLines={1}>{selected.address}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => toggleFav(selected._id)} style={styles.detailFavButton}>
                <Ionicons name={favorites.has(selected._id) ? 'star' : 'star-outline'} size={24} color={COLORS.star} />
              </TouchableOpacity>
            </View>

            <View style={styles.detailTags}>
              {selected.powerOutlet && <DetailTag icon="flash" label="콘센트" />}
              {(selected.openingHours || selected.open_24h) && (
                <DetailTag icon="time" label={selected.open_24h ? '24시간' : selected.openingHours} />
              )}
              {selected.wifi && <DetailTag icon="wifi" label="Wi-Fi" />}
              {selected.groupAvailable && <DetailTag icon="people" label="그룹 이용" />}
              {typeof selected.seatCount === 'number' && selected.seatCount > 0 && (
                <DetailTag icon="grid" label={`좌석 ${selected.seatCount}`} />
              )}
              {selected.phone ? (
                <TouchableOpacity onPress={() => Linking.openURL(`tel:${selected.phone}`)}>
                  <DetailTag icon="call" label={selected.phone} />
                </TouchableOpacity>
              ) : null}
              {selected.website ? (
                <TouchableOpacity onPress={() => Linking.openURL(selected.website)}>
                  <DetailTag icon="globe" label="웹사이트" />
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.detailActions}>
              <TouchableOpacity
                style={styles.detailActionButton}
                onPress={() => {
                  const appUrl = `kakaomap://look?p=${selected.latitude},${selected.longitude}`;
                  const webUrl = `https://map.kakao.com/link/map/${encodeURIComponent(selected.name)},${selected.latitude},${selected.longitude}`;
                  Linking.openURL(appUrl).catch(() => Linking.openURL(webUrl));
                }}
              >
                <Ionicons name="navigate" size={20} color={COLORS.primary} />
                <Text style={styles.detailActionText}>길찾기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.detailActionButton, styles.detailActionButtonPrimary]}
                onPress={() => navigation.navigate('PlaceReviewScreen', { placeId: selected._id, placeName: selected.name })}
              >
                <Ionicons name="chatbox" size={20} color="#fff" />
                <Text style={[styles.detailActionText, { color: '#fff' }]}>리뷰</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.detailActionButton}
                onPress={() => navigation.navigate('PlaceEditRequestScreen', { placeId: selected._id, initial: selected })}
              >
                <Ionicons name="create" size={20} color={COLORS.primary} />
                <Text style={styles.detailActionText}>수정</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>

      {/* 장소 추가 모달 (디자인 베이스) */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.addModal}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>새 장소 추가</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>장소 이름 *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="장소 이름을 입력하세요"
                placeholderTextColor={COLORS.muted}
                value={newName}
                onChangeText={setNewName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>주소 *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="도로명 주소를 입력하세요"
                placeholderTextColor={COLORS.muted}
                value={newAddr}
                onChangeText={setNewAddr}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>운영시간</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="예: 09:00~22:00"
                placeholderTextColor={COLORS.muted}
                value={newHours}
                onChangeText={setNewHours}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>테이블 수</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="12"
                  placeholderTextColor={COLORS.muted}
                  value={newTables}
                  onChangeText={setNewTables}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>콘센트 수</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="8"
                  placeholderTextColor={COLORS.muted}
                  value={newOutlets}
                  onChangeText={setNewOutlets}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>유형</Text>
              <View style={styles.typeSelectGrid}>
                {['cafe', 'study', 'library', 'other'].map(t => {
                  const isSelected = newType === t;
                  const typeInfo = toTypeLabelIcon(t);
                  return (
                    <TouchableOpacity
                      key={t}
                      onPress={() => setNewType(t)}
                      style={[styles.typeSelectButton, isSelected && styles.typeSelectButtonActive]}
                    >
                      <Ionicons name={typeInfo.icon} size={18} color={isSelected ? '#fff' : COLORS.muted} />
                      <Text style={[styles.typeSelectText, isSelected && styles.typeSelectTextActive]}>
                        {typeInfo.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Wi-Fi</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <FilterToggle label={newWifi ? 'ON' : 'OFF'} icon="wifi" value={newWifi} onToggle={() => setNewWifi(v => !v)} />
              </View>
            </View>

            <View style={styles.addActions}>
              <TouchableOpacity style={styles.addCancelButton} onPress={() => setShowAddModal(false)}>
                <Text style={styles.addCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.addSaveButton, { backgroundColor: COLORS.primary }]} onPress={handleAddPlace}>
                <Text style={styles.addSaveText}>추가 요청</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {loading && (
        <View style={styles.loadingBadge}>
          <Ionicons name="sync" size={16} color={COLORS.primary} />
          <Text style={styles.loadingText}>불러오는 중</Text>
        </View>
      )}
    </View>
  );
}

/* -------------------- Kakao HTML -------------------- */
function buildKakaoHtml(appKey, center, places, myLocation) {
  const safePlaces = JSON.stringify(places || []);
  const me = myLocation ? JSON.stringify(myLocation) : 'null';

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
      <style>
        html, body, #map { margin:0; padding:0; width:100%; height:100%; }
        .pin { width:18px; height:18px; border-radius:50%; }
      </style>
      <script>
        window.onerror = function(message, source, lineno, colno, error) {
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
            type:'error', message, source, lineno, colno, error: error ? error.stack : null
          }));
        };
      </script>
      <script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false"></script>
    </head>
    <body>
      <div id="map"></div>
      <script>
        kakao.maps.load(function() {
          try {
            var center = { lat: ${center.latitude}, lng: ${center.longitude} };
            var map = new kakao.maps.Map(document.getElementById('map'), {
              center: new kakao.maps.LatLng(center.lat, center.lng),
              level: 4
            });

            function iconByType(t){
              if(t==='cafe') return '☕';
              if(t==='study') return '📚';
              if(t==='library') return '🏛️';
              if(t==='me') return '📍';
              return '📌';
            }

            // 이동/내위치/마커 업데이트
            var meMarker = null;
            if (!window.markers) window.markers = [];
            window.moveToLocation = function(lat, lng){
              try {
                if (!map || typeof lat !== 'number' || typeof lng !== 'number') return;
                var pos = new kakao.maps.LatLng(lat, lng);
                map.setCenter(pos);
                map.panTo(pos);
              } catch (e) {}
            };
            window.updateMyLocation = function(lat, lng){
              try{
                var pos = new kakao.maps.LatLng(lat, lng);
                if (meMarker) {
                  meMarker.setPosition(pos);
                } else {
                  var el = document.createElement('div');
                  el.style.fontSize = '20px'; el.textContent = '📍';
                  meMarker = new kakao.maps.CustomOverlay({ position: pos, content: el, yAnchor: 1 });
                  meMarker.setMap(map);
                }
                map.panTo(pos);
              }catch(e){}
            };
            window.updatePlaces = function(places){
              try {
                window.places = places || [];
                window.markers.forEach(m => m.setMap(null));
                window.markers = [];
                window.places.forEach(p => {
                  if(p && typeof p.latitude==='number' && typeof p.longitude==='number'){
                    var el = document.createElement('div');
                    el.style.fontSize = '20px';
                    el.style.cursor = 'pointer';
                    el.textContent = iconByType(p.type || 'other');
                    var marker = new kakao.maps.CustomOverlay({
                      position: new kakao.maps.LatLng(p.latitude, p.longitude),
                      content: el,
                      yAnchor: 1
                    });
                    marker.setMap(map);
                    el.onclick = function(){
                      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
                        JSON.stringify({type:'marker_click', place: p})
                      );
                    };
                    window.markers.push(marker);
                  }
                });
              } catch(e){}
            };

            // 초기 세팅
            window.places = ${safePlaces};
            window.updatePlaces(window.places);

            // bounds 이벤트 → RN으로 현재 화면 내 장소 전송
            kakao.maps.event.addListener(map, 'idle', function(){
              var bounds = map.getBounds();
              var visible = (window.places || []).filter(p => {
                try {
                  var latlng = new kakao.maps.LatLng(p.latitude, p.longitude);
                  return bounds.contain(latlng);
                } catch(e) { return false; }
              });
              window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'bounds_changed',
                places: visible
              }));
            });

            // 초기 내 위치 표시
            var me = ${me};
            if(me && typeof me.latitude==='number' && typeof me.longitude==='number'){
              var el = document.createElement('div');
              el.style.fontSize = '20px'; el.textContent = '📍';
              var myMarker = new kakao.maps.CustomOverlay({
                position: new kakao.maps.LatLng(me.latitude, me.longitude),
                content: el,
                yAnchor: 1
              });
              myMarker.setMap(map);
            }
          } catch (err) {
            window.ReactNativeWebView &&
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: String(err) }));
          }
        });
      </script>
    </body>
  </html>`;
}

/* -------------------- 작은 컴포넌트 -------------------- */
function FilterToggle({ label, icon, value, onToggle }) {
  return (
    <TouchableOpacity
      style={[styles.filterToggle, value && styles.filterToggleActive]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={18} color={value ? '#fff' : COLORS.muted} />
      <Text style={[styles.filterToggleText, value && styles.filterToggleTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}
function TypeButton({ label, icon, active, onPress }) {
  return (
    <TouchableOpacity style={[styles.typeButton, active && styles.typeButtonActive]} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={20} color={active ? '#fff' : COLORS.muted} />
      <Text style={[styles.typeButtonText, active && styles.typeButtonTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}
function Tag({ icon, text }) {
  return (
    <View style={styles.tag}>
      <Ionicons name={icon} size={10} color={COLORS.textLight} />
      <Text style={styles.tagText}>{text}</Text>
    </View>
  );
}
function DetailTag({ icon, label }) {
  return (
    <View style={styles.detailTag}>
      <Ionicons name={icon} size={14} color={COLORS.primary} />
      <Text style={styles.detailTagText}>{label}</Text>
    </View>
  );
}

/* -------------------- 유틸 -------------------- */
function snapTo(val, vy) {
  const current = val.__getValue();
  const points = SNAP_POINTS;
  let target = points[0];
  let min = 999;
  for (const p of points) {
    const d = Math.abs(current - p);
    if (d < min) { min = d; target = p; }
  }
  Animated.spring(val, { toValue: target, useNativeDriver: false, bounciness: 0 }).start();
  return target;
}
function nextSnap(val) {
  const current = val.__getValue();
  const points = SNAP_POINTS;
  const idx = points.findIndex(p => Math.abs(p - current) < 0.02);
  const next = points[(idx + 1) % points.length];
  Animated.spring(val, { toValue: next, useNativeDriver: false, bounciness: 0 }).start();
  return next;
}
function toTypeLabelIcon(t) {
  switch (t) {
    case 'cafe': return { label: '카페', icon: 'cafe' };
    case 'study': return { label: '스터디', icon: 'school' };
    case 'library': return { label: '도서관', icon: 'book' };
    default: return { label: '기타', icon: 'location' };
  }
}
function getTypeColor(t) {
  switch (t) {
    case 'cafe': return '#EF4444';
    case 'study': return '#8B5CF6';
    case 'library': return '#3B82F6';
    default: return '#6B7280';
  }
}

/* -------------------- 스타일 (디자인 버전) -------------------- */
const styles = StyleSheet.create({
  topBar: {
    position: 'absolute',
    top: Platform.select({ ios: 60, android: 40 }),
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text },
  filterBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  fabCol: { position: 'absolute', right: 16, top: Platform.select({ ios: 140, android: 120 }), gap: 12, zIndex: 10 },
  fab: {
    width: 52, height: 52, borderRadius: 16, backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  fabActive: { backgroundColor: COLORS.primary },

  listPanel: {
    position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: COLORS.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 8, paddingHorizontal: 12, zIndex: 5, overflow: 'hidden',
    maxHeight: WIN_H * MAX_SHEET_PCT, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: -4 }, elevation: 8,
  },
  grabber: { alignItems: 'center', paddingVertical: 8 },
  grabberBar: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 12 },
  listHeaderText: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  favBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.star, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  favBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  placeCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.bg, borderRadius: 16, padding: 12, marginBottom: 8, gap: 12,
  },
  placeLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  typeIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  placeInfo: { flex: 1 },
  placeNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  placeName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  typeBadgeText: { fontSize: 10, fontWeight: '700' },
  placeAddr: { fontSize: 13, color: COLORS.textLight, marginBottom: 6 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 6 },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2,
  },
  tagText: { fontSize: 10, color: COLORS.textLight },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 12, fontWeight: '600', color: COLORS.textLight, marginLeft: 4 },
  favButton: { padding: 8 },

  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: COLORS.muted, marginTop: 12 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 20 },
  filterModal: { backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 34 },
  filterGroup: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  filterToggle: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: COLORS.bg, borderRadius: 12, paddingVertical: 12, borderWidth: 1, borderColor: COLORS.border,
  },
  filterToggleActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterToggleText: { fontSize: 14, fontWeight: '600', color: COLORS.textLight },
  filterToggleTextActive: { color: '#fff' },

  sliderGroup: { marginBottom: 20 },
  sliderLabel: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  sliderValue: { alignItems: 'center', marginBottom: 8 },
  sliderValueText: { fontSize: 24, fontWeight: '700', color: COLORS.primary },

  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  typeButton: {
    flex: 1, minWidth: '45%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.bg, borderRadius: 12, paddingVertical: 14, borderWidth: 1, borderColor: COLORS.border,
  },
  typeButtonActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.textLight },
  typeButtonTextActive: { color: '#fff' },
  applyButton: {
    backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center',
    shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  applyButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },

  detailModal: {
    position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: COLORS.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 34,
  },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  detailLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  detailTypeIcon: { width: 56, height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  detailName: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  detailAddr: { fontSize: 14, color: COLORS.textLight },
  detailFavButton: { padding: 8 },
  detailTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  detailTag: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: `${COLORS.primary}10`,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
  },
  detailTagText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  detailActions: { flexDirection: 'row', gap: 10 },
  detailActionButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: COLORS.bg, borderRadius: 12, paddingVertical: 14, borderWidth: 1, borderColor: COLORS.border,
  },
  detailActionButtonPrimary: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  detailActionText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },

  addModal: {
    backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 34, maxHeight: WIN_H * 0.9,
  },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  modalInput: {
    backgroundColor: COLORS.bg, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.text,
  },
  inputRow: { flexDirection: 'row', gap: 12 },
  typeSelectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeSelectButton: {
    flex: 1, minWidth: '45%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: COLORS.bg, borderRadius: 12, paddingVertical: 12, borderWidth: 1, borderColor: COLORS.border,
  },
  typeSelectButtonActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeSelectText: { fontSize: 13, fontWeight: '600', color: COLORS.textLight },
  typeSelectTextActive: { color: '#fff' },
  addActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  addCancelButton: {
    flex: 1, backgroundColor: COLORS.bg, borderRadius: 12, paddingVertical: 14, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  addCancelText: { fontSize: 15, fontWeight: '700', color: COLORS.textLight },
  addSaveButton: { flex: 1, backgroundColor: COLORS.success, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  addSaveText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  loadingBadge: {
    position: 'absolute', top: Platform.select({ ios: 60, android: 40 }), alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.card, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },
  loadingText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
});