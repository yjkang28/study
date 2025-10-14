// screens/PlaceEditRequestScreen.js (모던 버전)
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, Switch, Platform, KeyboardAvoidingView, ScrollView
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
  success: '#10B981',
  danger: '#EF4444',
};

const TYPES = [
  { label: '카페', value: 'cafe', icon: 'cafe' },
  { label: '스터디카페', value: 'study', icon: 'school' },
  { label: '도서관', value: 'library', icon: 'book' },
  { label: '기타', value: 'etc', icon: 'options' },
];

const PRICE_OPTIONS = ['무료', '저렴', '보통', '비쌈'];

export default function PlaceEditRequestScreen({ route, navigation }) {
  const { placeId, initial = {} } = route.params || {};
  const [name, setName] = useState(initial.name || '');
  const [address, setAddress] = useState(initial.address || '');
  const [type, setType] = useState(initial.type || 'etc');
  const [seatCount, setSeatCount] = useState(
    typeof initial.seatCount === 'number' ? String(initial.seatCount) : ''
  );
  const [powerOutlet, setPowerOutlet] = useState(!!initial.powerOutlet);
  const [wifi, setWifi] = useState(!!initial.wifi);
  const [groupAvailable, setGroupAvailable] = useState(!!initial.groupAvailable);
  const [price, setPrice] = useState(initial.price || '보통');

  const submit = async () => {
    if (!placeId) {
      Alert.alert('오류', 'placeId가 없습니다.');
      return;
    }
    if (!name.trim() || !address.trim()) {
      Alert.alert('알림', '이름과 주소는 필수입니다.');
      return;
    }
    try {
      await axios.patch(`${BACKEND_URL}/places/${placeId}`, {
        name: name.trim(),
        address: address.trim(),
        type,
        seatCount: Number(seatCount) || 0,
        powerOutlet,
        wifi,
        groupAvailable,
        price,
      });
      Alert.alert('완료', '수정 요청이 전송되었습니다.\n검토 후 반영됩니다.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('실패', '수정 요청 전송에 실패했습니다.');
    }
  };

  useEffect(() => {
    navigation.setOptions({
      title: '정보 수정 요청',
      headerStyle: { backgroundColor: COLORS.card },
      headerTitleStyle: { fontWeight: '700', color: COLORS.text },
    });
  }, [navigation]);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 안내 */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={COLORS.primary} />
          <Text style={styles.infoText}>
            장소 정보를 수정하여 다른 사용자들에게 정확한 정보를 제공해주세요
          </Text>
        </View>

        {/* 기본 정보 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>기본 정보</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              이름 <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="storefront-outline" size={18} color={COLORS.muted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="장소 이름을 입력하세요"
                placeholderTextColor={COLORS.muted}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              주소 <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="location-outline" size={18} color={COLORS.muted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="도로명 주소를 입력하세요"
                placeholderTextColor={COLORS.muted}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>유형</Text>
            <View style={styles.typeGrid}>
              {TYPES.map(t => {
                const isSelected = type === t.value;
                return (
                  <TouchableOpacity
                    key={t.value}
                    onPress={() => setType(t.value)}
                    style={[styles.typeCard, isSelected && styles.typeCardSelected]}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.typeIconWrap, isSelected && styles.typeIconWrapSelected]}>
                      <Ionicons 
                        name={t.icon} 
                        size={22} 
                        color={isSelected ? COLORS.primary : COLORS.muted} 
                      />
                    </View>
                    <Text style={[styles.typeLabel, isSelected && styles.typeLabelSelected]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* 상세 정보 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>상세 정보</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>좌석 수</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="people-outline" size={18} color={COLORS.muted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={seatCount}
                onChangeText={setSeatCount}
                keyboardType="numeric"
                placeholder="예: 24"
                placeholderTextColor={COLORS.muted}
              />
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureRow}>
              <View style={styles.featureLeft}>
                <View style={styles.featureIconWrap}>
                  <Ionicons name="flash" size={18} color={powerOutlet ? COLORS.primary : COLORS.muted} />
                </View>
                <View>
                  <Text style={styles.featureLabel}>콘센트</Text>
                  <Text style={styles.featureDesc}>충전이 가능해요</Text>
                </View>
              </View>
              <Switch
                value={powerOutlet}
                onValueChange={setPowerOutlet}
                trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                thumbColor={powerOutlet ? COLORS.primary : '#f4f3f4'}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.featureRow}>
              <View style={styles.featureLeft}>
                <View style={styles.featureIconWrap}>
                  <Ionicons name="wifi" size={18} color={wifi ? COLORS.primary : COLORS.muted} />
                </View>
                <View>
                  <Text style={styles.featureLabel}>Wi-Fi</Text>
                  <Text style={styles.featureDesc}>무선 인터넷 제공</Text>
                </View>
              </View>
              <Switch
                value={wifi}
                onValueChange={setWifi}
                trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                thumbColor={wifi ? COLORS.primary : '#f4f3f4'}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.featureRow}>
              <View style={styles.featureLeft}>
                <View style={styles.featureIconWrap}>
                  <Ionicons name="people" size={18} color={groupAvailable ? COLORS.primary : COLORS.muted} />
                </View>
                <View>
                  <Text style={styles.featureLabel}>그룹 이용</Text>
                  <Text style={styles.featureDesc}>여러 명이 함께 이용 가능</Text>
                </View>
              </View>
              <Switch
                value={groupAvailable}
                onValueChange={setGroupAvailable}
                trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                thumbColor={groupAvailable ? COLORS.primary : '#f4f3f4'}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>가격대</Text>
            <View style={styles.priceGrid}>
              {PRICE_OPTIONS.map(p => {
                const isSelected = price === p;
                return (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setPrice(p)}
                    style={[styles.priceChip, isSelected && styles.priceChipSelected]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.priceText, isSelected && styles.priceTextSelected]}>
                      {p}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* 제출 버튼 */}
        <TouchableOpacity style={styles.submitBtn} onPress={submit} activeOpacity={0.8}>
          <Ionicons name="checkmark-circle" size={22} color="#fff" />
          <Text style={styles.submitText}>수정 요청 보내기</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: `${COLORS.primary}20`,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  required: {
    color: COLORS.danger,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    height: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  typeGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  typeCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}08`,
  },
  typeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIconWrapSelected: {
    backgroundColor: `${COLORS.primary}15`,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  typeLabelSelected: {
    color: COLORS.primary,
  },
  featureCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  featureLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    color: COLORS.muted,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  priceGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  priceChip: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingVertical: 12,
    alignItems: 'center',
  },
  priceChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  priceTextSelected: {
    color: '#fff',
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  submitText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});