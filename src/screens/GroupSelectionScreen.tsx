import React from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, FlatList, 
  StatusBar, Platform 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import scheduleData from '../data/schedule.json';

const categories = Object.keys(scheduleData).sort();

interface GroupSelectionScreenProps {
  onSelectGroup: (category: string, course: string, group: string) => void;
}

export const GroupSelectionScreen: React.FC<GroupSelectionScreenProps> = ({ onSelectGroup }) => {
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);

  // Level 1: Select Category
  if (!selectedCategory) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.headerArea}>
          <Text style={styles.headerSmall}>ФМИАТ • УлГУ</Text>
          <Text style={styles.headerLarge}>Расписание</Text>
          <Text style={styles.headerSub}>Выберите направление</Text>
        </View>
        <FlatList
          data={categories}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <TouchableOpacity 
              style={styles.card} 
              onPress={() => setSelectedCategory(item)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={[theme.bgCard, theme.bgCardHover]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <View style={styles.cardLeft}>
                  <View style={[styles.cardIcon, { backgroundColor: getColor(index) }]}>
                    <Text style={styles.cardIconText}>{item.substring(0, 2)}</Text>
                  </View>
                  <Text style={styles.cardTitle}>{item}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
              </LinearGradient>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  // Level 2: Select Course -> auto-select group
  const courses = Object.keys((scheduleData as any)[selectedCategory]).sort();
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.headerArea}>
        <TouchableOpacity onPress={() => setSelectedCategory(null)} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={theme.accent} />
          <Text style={styles.backBtnText}>Назад</Text>
        </TouchableOpacity>
        <Text style={styles.headerLarge}>{selectedCategory}</Text>
        <Text style={styles.headerSub}>Выберите курс</Text>
      </View>
      <FlatList
        data={courses}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const groups = Object.keys((scheduleData as any)[selectedCategory][item]);
          const groupName = groups[0];
          const isNumber = /^\d+$/.test(item);
          return (
            <TouchableOpacity 
              style={styles.card} 
              onPress={() => onSelectGroup(selectedCategory, item, groupName)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={[theme.bgCard, theme.bgCardHover]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <View style={styles.cardLeft}>
                  <View style={[styles.cardIcon, { backgroundColor: getColor(index + 3) }]}>
                    <Text style={styles.cardIconText}>{isNumber ? item : '📚'}</Text>
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>
                      {isNumber ? `${item} курс` : item}
                    </Text>
                    <Text style={styles.cardSub}>{groupName}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
              </LinearGradient>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

const PALETTE = [
  'rgba(10, 132, 255, 0.2)',
  'rgba(94, 92, 230, 0.2)',
  'rgba(48, 209, 88, 0.2)',
  'rgba(255, 159, 10, 0.2)',
  'rgba(255, 69, 58, 0.2)',
  'rgba(191, 90, 242, 0.2)',
  'rgba(100, 210, 255, 0.2)',
  'rgba(255, 214, 10, 0.2)',
];

function getColor(index: number) {
  return PALETTE[index % PALETTE.length];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  headerArea: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: theme.paddingHorizontal,
    paddingBottom: 10,
  },
  headerSmall: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.accent,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  headerLarge: {
    fontSize: 34,
    fontWeight: '800',
    color: theme.textPrimary,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 15,
    color: theme.textSecondary,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: theme.paddingHorizontal,
    paddingTop: 12,
    paddingBottom: 40,
  },
  card: {
    marginBottom: 10,
    borderRadius: theme.borderRadius,
    overflow: 'hidden',
    ...theme.shadow,
  },
  cardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius,
    borderWidth: 1,
    borderColor: theme.separatorLight,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardIconText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  cardSub: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 2,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginLeft: -6,
  },
  backBtnText: {
    color: theme.accent,
    fontSize: 17,
  },
});
