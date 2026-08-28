import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  StyleSheet, 
  Dimensions, 
  SafeAreaView, 
  Alert, 
  Animated, 
  Easing, 
  StatusBar, 
  ScrollView, 
  Modal, 
  Image, 
  Switch, 
  Clipboard, 
  Share, 
  ActivityIndicator, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform, 
  BackHandler, 
  PermissionsAndroid 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

const SUPABASE_PROJECT_REF = 'zyqlntdpftowobsrzbgv'; 
const SUPABASE_ANON_KEY = 'sb_publishable_DuyB_EEKvMkDk0QFxQykqg_ZXCMzTwo';
const SUPABASE_REST_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co/rest/v1`;

const AGORA_APP_ID = '110534b7d9ce4f1ea80f93494d69ffa5';

const { width } = Dimensions.get('window');
const BOARD_SIZE = Math.min(width - 12, 420);
const CELL_SIZE = BOARD_SIZE / 15;

const ENTRY_FEE_OPTIONS = [50, 100, 200, 500];

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('LOGIN');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');

  const [settingsModal, setSettingsModal] = useState(false);
  const [profileStatsModal, setProfileStatsModal] = useState(false);
  const [leaderboardModal, setLeaderboardModal] = useState(false);
  const [cloudLeaderboardData, setCloudLeaderboardData] = useState([]);
  const [avatarModal, setAvatarModal] = useState(false);
  const [userAvatar, setUserAvatar] = useState('👸');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [botSelectModal, setBotSelectModal] = useState(false);
  const [passPlayModal, setPassPlayModal] = useState(false);
  const [onlineScreen, setOnlineScreen] = useState(false);

  const [userStats, setUserStats] = useState({ totalPlayed: 0, totalWon: 0, totalLost: 0 });

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const saved = await AsyncStorage.getItem('@ludo_supreme_user');
        const savedSound = await AsyncStorage.getItem('@ludo_sound_setting');
        const savedAvatar = await AsyncStorage.getItem('@ludo_user_avatar');

        if (saved) {
          setCurrentUser(JSON.parse(saved));
        }
        if (savedSound !== null) setSoundEnabled(JSON.parse(savedSound));
        if (savedAvatar) setUserAvatar(savedAvatar);
      } catch (err) {}
    };
    restoreSession();
  }, []);

  // Heartbeat Presence Ping
  useEffect(() => {
    if (!currentUser) return;
    const sendHeartbeat = async () => {
      try {
        await fetch(`${SUPABASE_REST_URL}/ludo_users?player_id=eq.${currentUser.playerId}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ last_seen: new Date().toISOString() })
        });
      } catch (e) {}
    };
    sendHeartbeat();
    const heartbeatInterval = setInterval(sendHeartbeat, 10000);
    return () => clearInterval(heartbeatInterval);
  }, [currentUser]);

  const handleAuthSubmit = async () => {
    if (!emailInput.trim()) {
      Alert.alert('Error', 'Please enter email address.');
      return;
    }
    const cleanEmail = emailInput.trim().toLowerCase();

    try {
      if (authMode === 'SIGNUP') {
        if (!passwordInput.trim() || !usernameInput.trim()) {
          Alert.alert('Error', 'Please fill all fields.');
          return;
        }
        const newId = Math.floor(10000 + Math.random() * 90000).toString();
        const newUserObj = {
          name: usernameInput.trim(),
          email: cleanEmail,
          password: passwordInput.trim(),
          coins: 2000,
          player_id: newId,
          avatar: '👸'
        };

        await fetch(`${SUPABASE_REST_URL}/ludo_users`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(newUserObj)
        });

        const createdUser = { name: newUserObj.name, email: newUserObj.email, playerId: newUserObj.player_id, coins: 2000 };
        await AsyncStorage.setItem('@ludo_supreme_user', JSON.stringify(createdUser));
        setCurrentUser(createdUser);
      } else if (authMode === 'LOGIN') {
        if (!passwordInput.trim()) {
          Alert.alert('Error', 'Please enter password.');
          return;
        }
        const loginRes = await fetch(`${SUPABASE_REST_URL}/ludo_users?email=eq.${cleanEmail}`, {
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        });
        const users = await loginRes.json();

        if (!users || users.length === 0 || users[0].password !== passwordInput.trim()) {
          Alert.alert('Login Failed', 'Invalid credentials or account does not exist.');
          return;
        }

        const matched = { name: users[0].name, email: users[0].email, playerId: users[0].player_id, coins: users[0].coins || 2000 };
        await AsyncStorage.setItem('@ludo_supreme_user', JSON.stringify(matched));
        if (users[0].avatar) setUserAvatar(users[0].avatar);
        setCurrentUser(matched);
      }
    } catch (err) {
      Alert.alert('Network Error', 'Please check internet connection.');
    }
  };

  const handleGuestLogin = () => {
    const guestId = Math.floor(1000 + Math.random() * 9000);
    const guestObj = { name: `Guest_${guestId}`, email: `guest_${guestId}@ludo.app`, coins: 500, playerId: guestId.toString() };
    setCurrentUser(guestObj);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('@ludo_supreme_user');
    setCurrentUser(null);
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.royaleContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0f1d" />
        <View style={styles.brandHero}>
          <Text style={styles.crownEmoji}>👑</Text>
          <Text style={styles.brandGoldTitle}>LUDO SUPREME</Text>
          <View style={styles.goldPillBadge}><Text style={styles.goldPillText}>★ CLOUD AUTH & REALTIME ★</Text></View>
        </View>

        <View style={styles.glassCard}>
          <View style={styles.tabToggleRow}>
            <TouchableOpacity style={[styles.tabToggleBtn, authMode === 'LOGIN' && styles.tabToggleActive]} onPress={() => setAuthMode('LOGIN')}>
              <Text style={[styles.tabToggleText, authMode === 'LOGIN' && styles.tabToggleTextActive]}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabToggleBtn, authMode === 'SIGNUP' && styles.tabToggleActive]} onPress={() => setAuthMode('SIGNUP')}>
              <Text style={[styles.tabToggleText, authMode === 'SIGNUP' && styles.tabToggleTextActive]}>Create Account</Text>
            </TouchableOpacity>
          </View>

          {authMode === 'SIGNUP' && (
            <View style={{ marginTop: 12 }}>
              <Text style={styles.inputLabel}>CHOOSE USERNAME</Text>
              <TextInput style={styles.gameTextInput} placeholder="e.g. MasterRajeev" placeholderTextColor="#64748b" value={usernameInput} onChangeText={setUsernameInput} />
            </View>
          )}

          <View style={{ marginTop: 10 }}>
            <Text style={styles.inputLabel}>EMAIL / USER ID</Text>
            <TextInput style={styles.gameTextInput} placeholder="name@gmail.com" placeholderTextColor="#64748b" keyboardType="email-address" autoCapitalize="none" value={emailInput} onChangeText={setEmailInput} />
          </View>

          <View style={{ marginTop: 10 }}>
            <Text style={styles.inputLabel}>PASSWORD</Text>
            <TextInput style={styles.gameTextInput} placeholder="••••••••" placeholderTextColor="#64748b" secureTextEntry value={passwordInput} onChangeText={setPasswordInput} />
          </View>

          <TouchableOpacity activeOpacity={0.85} style={[styles.gold3DButton, { marginTop: 14 }]} onPress={handleAuthSubmit}>
            <Text style={styles.gold3DButtonText}>
              {authMode === 'LOGIN' ? 'LOGIN TO ACCOUNT  ➔' : 'SIGN UP PERMANENTLY  ➔'}
            </Text>
          </TouchableOpacity>

          <View style={styles.orDivider}><View style={styles.dividerLine} /><Text style={styles.orText}>OR</Text><View style={styles.dividerLine} /></View>
          <TouchableOpacity activeOpacity={0.85} style={styles.darkSecondaryButton} onPress={handleGuestLogin}>
            <Text style={styles.darkSecondaryButtonText}>⚡ Quick Guest Play</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.dashboardContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0f2b5c" />
      
      {/* Top Header */}
      <View style={styles.topHeaderBar}>
        <View style={styles.profileBadge}>
          <Text style={{ fontSize: 20 }}>{userAvatar}</Text>
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.headerUserName}>{currentUser.name}</Text>
            <Text style={styles.headerUserCoins}>🪙 {currentUser.coins}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Main Lobby Buttons */}
      <ScrollView contentContainerStyle={styles.lobbyScrollContent}>
        <View style={styles.lobbyBannerCard}>
          <Text style={{ fontSize: 32 }}>👑</Text>
          <Text style={styles.bannerTitle}>LUDO SUPREME 3D</Text>
          <Text style={styles.bannerSub}>Play with real friends & players online</Text>
        </View>

        <TouchableOpacity style={styles.lobbyMenuButton} onPress={() => Alert.alert('Online Mode', 'Starting Online Match Lobby...')}>
          <Text style={styles.lobbyMenuText}>🌐 Play Online Multiplayer</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.lobbyMenuButton} onPress={() => Alert.alert('Bot Mode', 'Starting vs Computer Match...')}>
          <Text style={styles.lobbyMenuText}>🤖 Play vs Computer (Bots)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.lobbyMenuButton} onPress={() => Alert.alert('Pass & Play', 'Starting Local Pass & Play...')}>
          <Text style={styles.lobbyMenuText}>👥 Pass & Play (Offline)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.lobbyMenuButton, { backgroundColor: '#0284c7' }]} onPress={() => Alert.alert('Friends', 'Opening Friends List...')}>
          <Text style={styles.lobbyMenuText}>🤝 Friends & Direct Invites</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  royaleContainer: { flex: 1, backgroundColor: '#0a0f1d', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16 },
  dashboardContainer: { flex: 1, backgroundColor: '#0f2b5c', width: '100%', height: '100%' },
  brandHero: { alignItems: 'center', marginTop: 4 },
  crownEmoji: { fontSize: 36, marginBottom: 2 },
  brandGoldTitle: { fontSize: 24, fontWeight: '900', color: '#facc15', letterSpacing: 1.5, textAlign: 'center' },
  goldPillBadge: { backgroundColor: '#78350f', borderColor: '#facc15', borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 3, marginTop: 4 },
  goldPillText: { color: '#fef08a', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  glassCard: { width: '100%', backgroundColor: '#131c31', borderRadius: 20, padding: 16, borderWidth: 1.5, borderColor: '#1e293b', elevation: 8 },
  inputLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  gameTextInput: { backgroundColor: '#0a0f1d', borderWidth: 1.5, borderColor: '#334155', borderRadius: 12, color: '#ffffff', paddingHorizontal: 16, paddingVertical: 12, fontSize: 15 },
  gold3DButton: { backgroundColor: '#eab308', borderColor: '#fef08a', borderWidth: 1.5, borderRadius: 14, paddingVertical: 14, alignItems: 'center', elevation: 6 },
  gold3DButtonText: { color: '#000000', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  tabToggleRow: { flexDirection: 'row', backgroundColor: '#0a0f1d', borderRadius: 12, padding: 4, borderWidth: 1, borderColor: '#334155' },
  tabToggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabToggleActive: { backgroundColor: '#0284c7' },
  tabToggleText: { color: '#94a3b8', fontSize: 11, fontWeight: 'bold' },
  tabToggleTextActive: { color: '#ffffff' },
  orDivider: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#334155' },
  orText: { color: '#64748b', paddingHorizontal: 12, fontSize: 11, fontWeight: 'bold' },
  darkSecondaryButton: { backgroundColor: '#1e293b', borderRadius: 14, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#475569' },
  darkSecondaryButtonText: { color: '#cbd5e1', fontSize: 13, fontWeight: '700' },
  
  topHeaderBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#0a0f1d', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  profileBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#38bdf8' },
  headerUserName: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },
  headerUserCoins: { color: '#facc15', fontWeight: 'bold', fontSize: 11 },
  logoutBtn: { backgroundColor: '#ef4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  
  lobbyScrollContent: { padding: 16, alignItems: 'center' },
  lobbyBannerCard: { width: '100%', backgroundColor: '#131c31', borderRadius: 20, padding: 20, alignItems: 'center', borderWidth: 2, borderColor: '#facc15', marginVertical: 10, elevation: 6 },
  bannerTitle: { color: '#facc15', fontSize: 20, fontWeight: '900', marginTop: 4, letterSpacing: 1 },
  bannerSub: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  
  lobbyMenuButton: { width: '100%', backgroundColor: '#10b981', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginVertical: 8, borderWidth: 1.5, borderColor: '#6ee7b7', elevation: 4 },
  lobbyMenuText: { color: '#ffffff', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 }
});
