import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, TouchableOpacity, TextInput, StyleSheet, Dimensions, SafeAreaView, 
  Alert, Animated, Easing, StatusBar, ScrollView, Modal, Image, Switch, Share, 
  ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, BackHandler, 
  PermissionsAndroid, AppState 
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

const SUPABASE_PROJECT_REF = 'zyqlntdpftowobsrzbgv'; 
const SUPABASE_ANON_KEY = 'sb_publishable_DuyB_EEKvMkDk0QFxQykqg_ZXCMzTwo';
const SUPABASE_REST_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co/rest/v1`;
const AGORA_APP_ID = '110534b7d9ce4f1ea80f93494d69ffa5';

const supabaseHeaders = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json'
};

const { width } = Dimensions.get('window');
const BOARD_SIZE = Math.min(width - 24, 420);
const CELL_SIZE = BOARD_SIZE / 15;

const ENTRY_FEE_OPTIONS = [50, 100, 200, 500];

const TRACK_COORDINATES = [
  [6,1],[6,2],[6,3],[6,4],[6,5],
  [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],
  [0,7],[0,8],
  [1,8],[2,8],[3,8],[4,8],[5,8],
  [6,9],[6,10],[6,11],[6,12],[6,13],[6,14],
  [7,14],[8,14],
  [8,13],[8,12],[8,11],[8,10],[8,9],
  [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],
  [14,7],[14,6],
  [13,6],[12,6],[11,6],[10,6],[9,6],
  [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],
  [7,0],[6,0]
];

const HOME_PATHS = {
  BLUE: [[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]],
  RED: [[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]],
  GREEN: [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]],
  YELLOW: [[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]]
};

const BASE_SPOTS = {
  BLUE: [[10.5,1.5],[10.5,3.5],[12.5,1.5],[12.5,3.5]],
  RED: [[1.5,1.5],[1.5,3.5],[3.5,1.5],[3.5,3.5]],
  GREEN: [[1.5,10.5],[1.5,12.5],[3.5,10.5],[3.5,12.5]],
  YELLOW: [[10.5,10.5],[10.5,12.5],[12.5,10.5],[12.5,12.5]]
};

const START_INDEX = { RED: 0, GREEN: 13, YELLOW: 26, BLUE: 39 };
const SAFE_INDEXES = [0, 8, 13, 21, 26, 34, 39, 47];
const ALL_COLORS = ['BLUE','RED','GREEN','YELLOW'];

const AVATAR_DATA = {
  MALE: [
    { id:'m1', label:'👦 Boy', icon:'👦' },
    { id:'m2', label:'🧔 Hero', icon:'🧔' },
    { id:'m3', label:'🧑‍🦱 Cool Guy', icon:'🧑‍🦱' },
    { id:'m4', label:'👨‍🦰 Smart', icon:'👨‍🦰' },
    { id:'m5', label:'🤠 Cowboy', icon:'🤠' },
    { id:'m6', label:'😎 Shades', icon:'😎' }
  ],
  FEMALE: [
    { id:'f1', label:'👧 Girl', icon:'👧' },
    { id:'f2', label:'👩‍🦰 Redhead', icon:'👩‍🦰' },
    { id:'f3', label:'👱‍♀️ Blonde', icon:'👱‍♀️' },
    { id:'f4', label:'👩‍🦱 Curly', icon:'👩‍🦱' },
    { id:'f5', label:'👒 Cute Cap', icon:'👒' },
    { id:'f6', label:'👸 Princess', icon:'👸' }
  ],
  ROYALE: [
    { id:'r1', label:'👑 King', icon:'👑' },
    { id:'r2', label:'🦁 Lion King', icon:'🦁' },
    { id:'r3', label:'🐯 Tiger Pro', icon:'🐯' },
    { id:'r4', label:'⚡ Flash', icon:'⚡' },
    { id:'r5', label:'🐉 Dragon', icon:'🐉' },
    { id:'r6', label:'💎 Diamond', icon:'💎' }
  ]
};

const QUICK_EMOJIS = ['😀','🔥','😂','👏','🎯','👑','😎','🤫'];

const getBoardRotationAngle = (myColor) => {
  const map = {
    RED: '-90deg',
    GREEN: '180deg',
    YELLOW: '90deg',
    BLUE: '0deg'
  };

  return map[myColor] || '0deg';
};
const getInverseRotationAngle = (myColor) => {
  const map = {
    RED: '90deg',
    GREEN: '180deg',
    YELLOW: '-90deg',
    BLUE: '0deg'
  };

  return map[myColor] || '0deg';
};
const getPerspectiveLayout = (myColor) => {
  const layouts = {

    RED: {
      leftColor: 'GREEN',
      topColor: 'YELLOW',
      bottomColor: 'RED',
      rightColor: 'BLUE'
    },

    GREEN: {
      leftColor: 'YELLOW',
      topColor: 'BLUE',
      bottomColor: 'GREEN',
      rightColor: 'RED'
    },

    YELLOW: {
      leftColor: 'BLUE',
      topColor: 'RED',
      bottomColor: 'YELLOW',
      rightColor: 'GREEN'
    },

    BLUE: {
      leftColor: 'RED',
      topColor: 'GREEN',
      bottomColor: 'BLUE',
      rightColor: 'YELLOW'
    }

  };

  return layouts[myColor] || layouts.BLUE;
};
const getPawnScreenCoords = (color, stepCount, idx) => {
  if (stepCount === -1) return BASE_SPOTS[color][idx];
  if (stepCount === 56) return [7,7];
  if (stepCount >= 51) return HOME_PATHS[color][stepCount - 51];
  return TRACK_COORDINATES[(START_INDEX[color] + stepCount) % 52];
};

const DiceFace = ({ value }) => {
  const dot = <View style={styles.diceDot} />;
  const empty = <View style={[styles.diceDot, { opacity: 0 }]} />;
  const getDots = () => {
    switch (value) {
      case 1: return <View style={styles.diceCenter}>{dot}</View>;
      case 2: return <View style={styles.diceRowSpace}><View style={styles.diceCol}>{dot}{empty}</View><View style={styles.diceCol}>{empty}{dot}</View></View>;
      case 3: return <View style={styles.diceRowSpace}><View style={styles.diceCol}>{dot}{empty}{empty}</View><View style={styles.diceCol}>{empty}{dot}{empty}</View><View style={styles.diceCol}>{empty}{empty}{dot}</View></View>;
      case 4: return <View style={styles.diceRowSpace}><View style={styles.diceCol}>{dot}{dot}</View><View style={styles.diceCol}>{dot}{dot}</View></View>;
      case 5: return <View style={styles.diceRowSpace}><View style={styles.diceCol}>{dot}{empty}{dot}</View><View style={styles.diceCol}>{empty}{dot}{empty}</View><View style={styles.diceCol}>{dot}{empty}{dot}</View></View>;
      case 6: return <View style={styles.diceRowSpace}><View style={styles.diceCol}>{dot}{dot}{dot}</View><View style={styles.diceCol}>{dot}{dot}{dot}</View></View>;
      default: return <View style={styles.diceCenter}>{dot}</View>;
    }
  };
  return <View style={styles.diceBox}>{getDots()}</View>;
};

const PinToken = ({ colorHex, stackCount }) => (
  <View style={styles.pinWrapper}>
    {stackCount > 1 && <View style={styles.stackBadgeBubble}><Text style={styles.stackBadgeText}>{stackCount}</Text></View>}
    <View style={[styles.pinPedestalRing, { borderColor: colorHex }]}>
      <View style={[styles.pinHeadCircle, { backgroundColor: colorHex }]}>
        <View style={styles.pinWhiteInnerCore}><View style={[styles.pinDotCenter, { backgroundColor: colorHex }]} /></View>
      </View>
      <View style={[styles.pinBottomPoint, { borderTopColor: colorHex }]} />
    </View>
  </View>
);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function App() {
  // ========== STATE ==========
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
  const [avatarCategory, setAvatarCategory] = useState('FEMALE');
  const [userAvatar, setUserAvatar] = useState('👸');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [chatModal, setChatModal] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInputText, setChatInputText] = useState('');
  const [isMicOn, setIsMicOn] = useState(false);
  const [isVoiceUnlocked, setIsVoiceUnlocked] = useState(false);
  const [voiceUsers, setVoiceUsers] = useState({});

  const [selectedEntryFee, setSelectedEntryFee] = useState(50);
  const [matchPrizePool, setMatchPrizePool] = useState(0);

  const [userStats, setUserStats] = useState({ totalPlayed:0, totalWon:0, totalLost:0 });
  const [turnTimeLeft, setTurnTimeLeft] = useState(30);
  const [playerMissCount, setPlayerMissCount] = useState({ BLUE:0, RED:0, GREEN:0, YELLOW:0 });
  const [finishedRankings, setFinishedRankings] = useState([]);
  const [showPodiumBoard, setShowPodiumBoard] = useState(false);

  const [friendsModal, setFriendsModal] = useState(false);
  const [friendsTab, setFriendsTab] = useState('LIST');
  const [friendsList, setFriendsList] = useState([]);
  const [recentPlayersList, setRecentPlayersList] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [incomingInvitesList, setIncomingInvitesList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedUserResult, setSearchedUserResult] = useState(null);
  const [isSearchingCloud, setIsSearchingCloud] = useState(false);
  const [incomingInvite, setIncomingInvite] = useState(null);

  const [gameMode, setGameMode] = useState(null);
  const [botSelectModal, setBotSelectModal] = useState(false);
  const [botPlayerCount, setBotPlayerCount] = useState(2);
  const [passPlayModal, setPassPlayModal] = useState(false);
  const [hybridTeamModal, setHybridTeamModal] = useState(false);
  const [onlineScreen, setOnlineScreen] = useState(false);
  const [onlineLobbyModal, setOnlineLobbyModal] = useState(false);

  const [playType, setPlayType] = useState('SOLO');
  const [selectedPlayerCount, setSelectedPlayerCount] = useState(2);
  const [onlinePlayType, setOnlinePlayType] = useState('SOLO');
  const [onlinePlayerCount, setOnlinePlayerCount] = useState(2);
  const [friendlyKill, setFriendlyKill] = useState(false);
  const [activeColors, setActiveColors] = useState(['BLUE','GREEN']);

  const [roomPlayers, setRoomPlayers] = useState({});
  const [playerSlots, setPlayerSlots] = useState({ BLUE:'LOCAL', GREEN:'BOT', RED:'BOT', YELLOW:'BOT' });
  const [roomCode, setRoomCode] = useState('');
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [teamJoinCode, setTeamJoinCode] = useState('');
  const [myColor, setMyColor] = useState('BLUE');
  const [isHost, setIsHost] = useState(false);
  const [isVerifyingRoom, setIsVerifyingRoom] = useState(false);
  const joinTimeoutRef = useRef(null);

  const [playerDices, setPlayerDices] = useState({ BLUE:1, RED:3, GREEN:6, YELLOW:2 });
  const [isRolling, setIsRolling] = useState(false);
  const [hasRolled, setHasRolled] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [turnIndex, setTurnIndex] = useState(0);

  const spinAnim = useRef(new Animated.Value(0)).current;
  const diceBounceAnim = useRef(new Animated.Value(1)).current;
  const arrowBounceAnim = useRef(new Animated.Value(0)).current;
  const arrowBlinkAnim = useRef(new Animated.Value(1)).current;

  const [pawns, setPawns] = useState({
    BLUE: [-1,-1,-1,-1],
    RED: [-1,-1,-1,-1],
    GREEN: [-1,-1,-1,-1],
    YELLOW: [-1,-1,-1,-1]
  });

  // ========== REFS ==========
  const pawnsRef = useRef(pawns);
  pawnsRef.current = pawns;
  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;
  const myColorRef = useRef(myColor);
  useEffect(() => { myColorRef.current = myColor; }, [myColor]);

  const roomCodeRef = useRef(roomCode);
  roomCodeRef.current = roomCode;
  const userAvatarRef = useRef(userAvatar);
  userAvatarRef.current = userAvatar;
  const playTypeRef = useRef(playType);
  playTypeRef.current = playType;
  const selectedEntryFeeRef = useRef(selectedEntryFee);
  selectedEntryFeeRef.current = selectedEntryFee;
  const isHostRef = useRef(isHost);
  useEffect(() => { isHostRef.current = isHost; }, [isHost]);

  const roomPlayersRef = useRef(roomPlayers);
  useEffect(() => { roomPlayersRef.current = roomPlayers; }, [roomPlayers]);
  const activeColorsRef = useRef(activeColors);
  useEffect(() => { activeColorsRef.current = activeColors; }, [activeColors]);
  const playerSlotsRef = useRef(playerSlots);
  useEffect(() => { playerSlotsRef.current = playerSlots; }, [playerSlots]);

  const ws = useRef(null);
  const agoraEngine = useRef(null);
  const currentTurn = activeColors[turnIndex] || activeColors[0] || 'BLUE';
  
// ========== 30 SECOND TURN TIMER ==========
useEffect(() => {
  if (!gameMode || showPodiumBoard) return;

  // Har naye turn par timer reset
  setTurnTimeLeft(30);

  const timer = setInterval(() => {
    setTurnTimeLeft((prev) => {
      if (prev <= 1) {
        clearInterval(timer);

        // Time khatam hone par next player's turn
        setTimeout(() => {
          nextTurn();
        }, 100);

        return 0;
      }

      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(timer);
}, [turnIndex, gameMode, showPodiumBoard]);
  
  // ========== SUPABASE USER UPSERT & HEARTBEAT ==========
  const syncUserToCloud = async (userObj) => {
    if (!userObj?.playerId) return;
    try {
      await fetch(`${SUPABASE_REST_URL}/ludo_users`, {
        method: 'POST',
        headers: {
          ...supabaseHeaders,
          Prefer: 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          player_id: String(userObj.playerId),
          name: userObj.name || 'Player',
          email: userObj.email,
          coins: Number(userObj.coins || 500),
          avatar: userObj.avatar || '👸',
          last_seen: new Date().toISOString()
        })
      });
    } catch (e) {
      console.log('Error syncing user to Supabase:', e);
    }
  };

  const updateLastSeen = async () => {
    if (!currentUserRef.current?.playerId) return;
    try {
      await fetch(
        `${SUPABASE_REST_URL}/ludo_users?player_id=eq.${encodeURIComponent(currentUserRef.current.playerId)}`,
        {
          method: 'PATCH',
          headers: {
            ...supabaseHeaders,
            Prefer: 'return=minimal'
          },
          body: JSON.stringify({
            last_seen: new Date().toISOString()
          })
        }
      );
    } catch (e) {}
  };

  // Auto Load User on App Launch
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('@ludo_supreme_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          setCurrentUser(parsed);
          if (parsed.avatar) setUserAvatar(parsed.avatar);
          await syncUserToCloud(parsed);
        }
      } catch (err) {}
    })();
  }, []);

  // Background Sync Interval (Every 4 seconds)
  useEffect(() => {
    if (!currentUser?.playerId) return;

    updateLastSeen();
    checkCloudFriendRequests();
    checkCloudGameInvites();
    fetchCloudFriendList(currentUser.playerId);

    const interval = setInterval(() => {
      updateLastSeen();
      checkCloudFriendRequests();
      checkCloudGameInvites();
      fetchCloudFriendList(currentUser.playerId);
    }, 4000);

    return () => clearInterval(interval);
  }, [currentUser?.playerId]);

  // ========== AUTH FUNCTIONS (UPDATED WITH CLOUD LOGIN/SIGNUP) ==========
  const handleAuthSubmit = async () => {
    try {
      const email = emailInput.trim().toLowerCase();
      const password = passwordInput.trim();
      const username = usernameInput.trim();

      if (!email) {
        Alert.alert('Error', 'Please enter your email.');
        return;
      }

      if (authMode === 'SIGNUP') {
        if (!username) {
          Alert.alert('Error', 'Please enter a username.');
          return;
        }
        if (password.length < 6) {
          Alert.alert('Error', 'Password must be at least 6 characters.');
          return;
        }

        const checkResponse = await fetch(
          `${SUPABASE_REST_URL}/ludo_users?email=eq.${encodeURIComponent(email)}&limit=1`,
          { headers: supabaseHeaders }
        );
        const existingUsers = await checkResponse.json();
        if (Array.isArray(existingUsers) && existingUsers.length > 0) {
          Alert.alert('Error', 'Account already exists. Please login.');
          return;
        }

        const newUser = {
          playerId: `player_${Date.now()}`,
          name: username,
          email,
          password,
          coins: 500,
          avatar: '👸'
        };

        const response = await fetch(
          `${SUPABASE_REST_URL}/ludo_users`,
          {
            method: 'POST',
            headers: {
              ...supabaseHeaders,
              Prefer: 'return=representation'
            },
            body: JSON.stringify({
              player_id: newUser.playerId,
              name: newUser.name,
              email: newUser.email,
              password: newUser.password,
              coins: newUser.coins,
              avatar: newUser.avatar,
              last_seen: new Date().toISOString()
            })
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.log('Signup database error:', errorText);
          Alert.alert('Error', 'Could not create account.');
          return;
        }

        await AsyncStorage.setItem('@ludo_supreme_user', JSON.stringify(newUser));
        setCurrentUser(newUser);
        Alert.alert('Success', 'Account created successfully!');
        return;
      }

      // ========== CLOUD LOGIN ==========
      if (authMode === 'LOGIN') {
        if (!password) {
          Alert.alert('Error', 'Please enter your password.');
          return;
        }

        const response = await fetch(
          `${SUPABASE_REST_URL}/ludo_users?email=eq.${encodeURIComponent(email)}&limit=1`,
          { headers: supabaseHeaders }
        );

        if (!response.ok) {
          Alert.alert('Login Failed', 'Could not connect to server.');
          return;
        }

        const users = await response.json();
        if (!Array.isArray(users) || users.length === 0) {
          Alert.alert('Login Failed', 'No account found with this email.');
          return;
        }

        const cloudUser = users[0];
        if (cloudUser.password !== password) {
          Alert.alert('Login Failed', 'Incorrect password.');
          return;
        }

        const user = {
          playerId: cloudUser.player_id,
          name: cloudUser.name || 'Player',
          email: cloudUser.email,
          password: cloudUser.password,
          coins: Number(cloudUser.coins || 0),
          avatar: cloudUser.avatar || '👤'
        };

        await AsyncStorage.setItem('@ludo_supreme_user', JSON.stringify(user));
        setCurrentUser(user);
        if (user.avatar) setUserAvatar(user.avatar);

        await fetch(
          `${SUPABASE_REST_URL}/ludo_users?player_id=eq.${encodeURIComponent(user.playerId)}`,
          {
            method: 'PATCH',
            headers: {
              ...supabaseHeaders,
              Prefer: 'return=minimal'
            },
            body: JSON.stringify({ last_seen: new Date().toISOString() })
          }
        );

        Alert.alert('Success', `Welcome back, ${user.name}!`);
        return;
      }

      // ========== FORGOT PASSWORD ==========
      if (authMode === 'FORGOT') {
        if (!newPasswordInput || newPasswordInput.length < 6) {
          Alert.alert('Error', 'New password must be at least 6 characters.');
          return;
        }

        const checkResponse = await fetch(
          `${SUPABASE_REST_URL}/ludo_users?email=eq.${encodeURIComponent(email)}&limit=1`,
          { headers: supabaseHeaders }
        );
        const users = await checkResponse.json();
        if (!Array.isArray(users) || users.length === 0) {
          Alert.alert('Error', 'No account found with this email.');
          return;
        }

        const cloudUser = users[0];
        const updateResponse = await fetch(
          `${SUPABASE_REST_URL}/ludo_users?id=eq.${cloudUser.id}`,
          {
            method: 'PATCH',
            headers: {
              ...supabaseHeaders,
              Prefer: 'return=minimal'
            },
            body: JSON.stringify({ password: newPasswordInput })
          }
        );

        if (!updateResponse.ok) {
          Alert.alert('Error', 'Password could not be updated.');
          return;
        }

        Alert.alert('Success', 'Password updated successfully!');
        setAuthMode('LOGIN');
        setPasswordInput('');
        setNewPasswordInput('');
      }
    } catch (error) {
      console.log('Auth Error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const handleGuestLogin = async () => {
    const guestUser = {
      playerId: `guest_${Date.now()}`,
      name: 'Guest Player',
      email: `guest_${Date.now()}@ludo.app`,
      coins: 500,
      isGuest: true,
      avatar: '👤'
    };

    setCurrentUser(guestUser);
    await AsyncStorage.setItem('@ludo_supreme_user', JSON.stringify(guestUser));
    await syncUserToCloud(guestUser);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('@ludo_supreme_user');
    setCurrentUser(null);
    setSettingsModal(false);
    resetGame();
  };

  const leaveAgoraVoiceChannel = async () => {
    try {
      if (agoraEngine.current) {
        await agoraEngine.current.leaveChannel();
        await agoraEngine.current.release();
        agoraEngine.current = null;
      }
    } catch (e) {
      console.warn('Error leaving voice channel:', e);
    }
  };

  // ========== HELPER FUNCTIONS ==========
  const deductUserCoins = async (amount) => {
    if (!currentUserRef.current) return false;
    if (currentUserRef.current.coins < amount) {
      Alert.alert('Low Coins', `You need at least 🪙 ${amount} coins.`);
      return false;
    }
    const updatedUser = { ...currentUserRef.current, coins: currentUserRef.current.coins - amount };
    setCurrentUser(updatedUser);
    await AsyncStorage.setItem('@ludo_supreme_user', JSON.stringify(updatedUser));
    syncUserCoinsToCloud(updatedUser.playerId, updatedUser.coins);
    return true;
  };

  const addWinnerCoins = async (amount) => {
    if (!currentUserRef.current) return;
    const updatedUser = { ...currentUserRef.current, coins: currentUserRef.current.coins + amount };
    setCurrentUser(updatedUser);
    await AsyncStorage.setItem('@ludo_supreme_user', JSON.stringify(updatedUser));
    syncUserCoinsToCloud(updatedUser.playerId, updatedUser.coins);
  };

  const syncUserCoinsToCloud = async (playerId, coins) => {
    try {
      await fetch(`${SUPABASE_REST_URL}/ludo_users?player_id=eq.${playerId}`, {
        method: 'PATCH',
        headers: {
          ...supabaseHeaders,
          Prefer: 'return=minimal'
        },
        body: JSON.stringify({ coins })
      });
    } catch (e) {}
  };

  const recordRecentPlayer = async (playerObj) => {
    if (!currentUserRef.current || !playerObj?.id || playerObj.id === currentUserRef.current.playerId) return;
    try {
      const stored = await AsyncStorage.getItem(`@ludo_recent_${currentUserRef.current.playerId}`);
      let currentList = stored ? JSON.parse(stored) : [];
      currentList = [
        {
          id: playerObj.id,
          name: playerObj.name || 'Player',
          avatar: playerObj.avatar || '👦',
          playedAt: new Date().toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        },
        ...currentList.filter(p => p.id !== playerObj.id)
      ].slice(0, 15);
      setRecentPlayersList(currentList);
      await AsyncStorage.setItem(`@ludo_recent_${currentUserRef.current.playerId}`, JSON.stringify(currentList));
    } catch (e) {}
  };

  const updateUserGameStats = async (didWin) => {
    if (!currentUserRef.current) return;
    try {
      const updated = {
        totalPlayed: (userStats.totalPlayed || 0) + 1,
        totalWon: didWin ? (userStats.totalWon || 0) + 1 : (userStats.totalWon || 0),
        totalLost: !didWin ? (userStats.totalLost || 0) + 1 : (userStats.totalLost || 0),
      };
      setUserStats(updated);
      await AsyncStorage.setItem(`@ludo_stats_${currentUserRef.current.playerId}`, JSON.stringify(updated));
    } catch (e) {}
  };

  const playSound = async (type) => {
    if (!soundEnabled) return;
    try {
      let soundAsset = null;
      if (type === 'dice') soundAsset = require('./assets/sounds/dice.mp3');
      else if (type === 'move') soundAsset = require('./assets/sounds/move.mp3');
      else if (type === 'cut') soundAsset = require('./assets/sounds/cut.mp3');
      else if (type === 'win') soundAsset = require('./assets/sounds/win.mp3');
      if (soundAsset) {
        const { sound } = await Audio.Sound.createAsync(soundAsset, { shouldPlay: true });
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) sound.unloadAsync().catch(() => {});
        });
      }
    } catch (e) {}
  };

  const sendChatMessage = (textToSend = null) => {
    const msg = (textToSend || chatInputText).trim();
    if (!msg) return;
    const newMsgObj = {
      id: Date.now().toString(),
      senderName: currentUserRef.current?.name,
      senderColor: myColorRef.current,
      avatar: userAvatarRef.current,
      text: msg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, newMsgObj]);
    setChatInputText('');
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        topic: `realtime:room_${roomCodeRef.current}`,
        event: 'broadcast',
        payload: { type: 'CHAT_MESSAGE', data: newMsgObj },
        ref: 'chat_1'
      }));
    }
  };

  const handleExitGame = () => {
    Alert.alert('Exit Game', 'Return to Main Lobby?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Quit Match', style: 'destructive', onPress: () => {
        if ((gameMode === 'ONLINE' || gameMode === 'HYBRID') && ws.current && ws.current.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({
            topic: `realtime:room_${roomCode}`,
            event: 'broadcast',
            payload: { type: 'PLAYER_LEFT_MATCH', data: { color: myColor, name: currentUser?.name } },
            ref: 'exit_match'
          }));
        }
        resetGame();
      }},
    ]);
  };

  const resetGame = () => {
    setPawns({ BLUE:[-1,-1,-1,-1], RED:[-1,-1,-1,-1], GREEN:[-1,-1,-1,-1], YELLOW:[-1,-1,-1,-1] });
    setPlayerMissCount({ BLUE:0, RED:0, GREEN:0, YELLOW:0 });
    setTurnIndex(0);
    setHasRolled(false);
    setIsMoving(false);
    setIsRolling(false);
    setIsHost(false);
    setChatMessages([]);
    setIsMicOn(false);
    setIsVoiceUnlocked(false);
    setVoiceUsers({});
    setFinishedRankings([]);
    setShowPodiumBoard(false);
    setGameMode(null);
    setBotSelectModal(false);
    setPassPlayModal(false);
    setHybridTeamModal(false);
    setOnlineScreen(false);
    setOnlineLobbyModal(false);
    setRoomPlayers({});
    leaveAgoraVoiceChannel();
    if (ws.current) ws.current.close();
  };

  const isTeammate = (c1, c2) => {
    if (playType !== 'TEAM') return false;
    return ( (c1 === 'BLUE' && c2 === 'GREEN') || (c1 === 'GREEN' && c2 === 'BLUE') ||
             (c1 === 'RED' && c2 === 'YELLOW') || (c1 === 'YELLOW' && c2 === 'RED') );
  };

  // ========== GAME LOGIC FUNCTIONS ==========
  const getValidMoves = (color, diceVal) => {
    const playerPawns = pawnsRef.current[color];
    if (!playerPawns) return [];
    const validIndexes = [];
    playerPawns.forEach((stepCount, idx) => {
      if (stepCount === -1 && diceVal === 6) validIndexes.push(idx);
      else if (stepCount >= 0 && stepCount + diceVal <= 56) validIndexes.push(idx);
    });
    return validIndexes;
  };

  const getStrategicMoveIndex = (color, diceVal, validMoves) => {
  const getStrategicMoveIndex = (color, diceVal, validMoves) => {
  if (!validMoves || validMoves.length === 0) return null;
  if (validMoves.length === 1) return validMoves[0];

  const playerPawns = pawnsRef.current[color];

  // ==========================================
  // EXTREME HARD COMPUTER AI
  // ==========================================

  const getEnemyThreat = (targetTrack, movingColor) => {
    let threatScore = 0;

    for (const enemy of activeColorsRef.current) {
      if (enemy === movingColor) continue;
      if (isTeammate(movingColor, enemy)) continue;

      for (const enemyStep of pawnsRef.current[enemy]) {
        if (enemyStep < 0 || enemyStep >= 51) continue;

        const enemyTrack =
          (START_INDEX[enemy] + enemyStep) % 52;

        // Enemy se target tak distance
        const distance =
          (targetTrack - enemyTrack + 52) % 52;

        // Enemy next dice roll mein capture kar sakta hai
        if (distance >= 1 && distance <= 6) {
          threatScore += (7 - distance) * 700;
        }
      }
    }

    return threatScore;
  };


  const canCaptureEnemy = (targetTrack, movingColor) => {
    let captureScore = 0;

    for (const enemy of activeColorsRef.current) {
      if (enemy === movingColor) continue;
      if (isTeammate(movingColor, enemy)) continue;

      for (const enemyStep of pawnsRef.current[enemy]) {
        if (enemyStep < 0 || enemyStep >= 51) continue;

        const enemyTrack =
          (START_INDEX[enemy] + enemyStep) % 52;

        if (enemyTrack === targetTrack) {
          captureScore += 10000;
        }
      }
    }

    return captureScore;
  };


  let bestMove = validMoves[0];
  let bestScore = -Infinity;


  for (const idx of validMoves) {
    const currentStep = playerPawns[idx];

    // Target position
    const targetStep =
      currentStep === -1
        ? 0
        : currentStep + diceVal;

    let score = 0;


    // ==========================================
    // 1. FINISH GOTI = VERY HIGH PRIORITY
    // ==========================================

    if (targetStep === 56) {
      score += 15000;
    }


    // ==========================================
    // 2. HOME LANE PRIORITY
    // ==========================================

    if (targetStep >= 51 && targetStep < 56) {
      score += 7000;

      // Home ke jitna paas utna better
      score += targetStep * 80;
    }


    // ==========================================
    // 3. MAIN BOARD POSITION
    // ==========================================

    if (targetStep >= 0 && targetStep < 51) {

      const targetTrack =
        (START_INDEX[color] + targetStep) % 52;


      // ======================================
      // CAPTURE ENEMY = HIGHEST ATTACK
      // ======================================

      score += canCaptureEnemy(targetTrack, color);


      // ======================================
      // SAFE CELL
      // ======================================

      if (SAFE_INDEXES.includes(targetTrack)) {
        score += 3500;
      } else {

        // Enemy attack danger check
        const danger =
          getEnemyThreat(targetTrack, color);

        score -= danger;
      }


      // ======================================
      // CURRENT PAWN DANGER CHECK
      // Agar goti already danger mein hai aur
      // move karke bach rahi hai
      // ======================================

      if (currentStep >= 0 && currentStep < 51) {

        const currentTrack =
          (START_INDEX[color] + currentStep) % 52;

        if (!SAFE_INDEXES.includes(currentTrack)) {

          const currentDanger =
            getEnemyThreat(currentTrack, color);

          const targetDanger =
            SAFE_INDEXES.includes(targetTrack)
              ? 0
              : getEnemyThreat(targetTrack, color);

          // Danger se escape karna smart move hai
          if (currentDanger > targetDanger) {
            score +=
              Math.min(
                currentDanger - targetDanger,
                5000
              );
          }
        }
      }


      // ======================================
      // FORWARD PROGRESS
      // ======================================

      score += targetStep * 35;
    }


    // ==========================================
    // 4. SIX PAR NEW GOTI NIKALNA
    // ==========================================

    if (
      diceVal === 6 &&
      currentStep === -1
    ) {
      const activePawnCount =
        playerPawns.filter(
          step => step >= 0 && step < 56
        ).length;

      // Board par kam goti ho to new goti
      // nikalna useful hai
      if (activePawnCount < 2) {
        score += 2800;
      } else if (activePawnCount < 3) {
        score += 1400;
      }
    }


    // ==========================================
    // 5. LAST PART OF JOURNEY PRIORITY
    // ==========================================

    if (
      currentStep >= 35 &&
      currentStep < 51
    ) {
      score += 1000;
    }


    // ==========================================
    // 6. RANDOM TIE BREAKER
    // Same score par har baar same move na ho
    // ==========================================

    score += Math.random() * 10;


    // ==========================================
    // BEST MOVE SELECT
    // ==========================================

    if (score > bestScore) {
      bestScore = score;
      bestMove = idx;
    }
  }


  return bestMove;
};
    
const handleTimeoutMiss = () => {
  const timedOutColor = currentTurn;
  const newMissCount = (playerMissCount[timedOutColor] || 0) + 1;

  setPlayerMissCount(prev => ({
    ...prev,
    [timedOutColor]: newMissCount
  }));

  // 3 chances khatam → player exit
  if (newMissCount >= 3) {
    const remainingColors = activeColors.filter(
      color => color !== timedOutColor
    );

    // ===== ONLY 2 PLAYERS THE =====
    if (remainingColors.length === 1) {
      const winnerColor = remainingColors[0];
      const finalRankings = [winnerColor, timedOutColor];

      setActiveColors(remainingColors);
      setFinishedRankings(finalRankings);
      setShowPodiumBoard(true);
      setHasRolled(false);
      setIsMoving(false);
      setIsRolling(false);

      if (winnerColor === myColorRef.current) {
        addWinnerCoins(matchPrizePool);
      }

      updateUserGameStats(
        winnerColor === myColorRef.current
      );

      Alert.alert(
        'PLAYER EXITED',
        `${getBaseDynamicLabel(timedOutColor)} missed 3 turns and has been removed. ${getBaseDynamicLabel(winnerColor)} wins!`
      );

      sendMultiplayerSync(
        pawnsRef.current,
        0,
        playerDices,
        false,
        finalRankings
      );

      return;
    }

    // ===== 3 YA 4 PLAYERS THE =====
    const nextIdx = turnIndex % remainingColors.length;

    setActiveColors(remainingColors);
    setTurnIndex(nextIdx);
    setHasRolled(false);
    setIsMoving(false);
    setIsRolling(false);
    setTurnTimeLeft(30);

    Alert.alert(
      'PLAYER EXITED',
      `${getBaseDynamicLabel(timedOutColor)} missed 3 turns and has been removed from the game.`
    );

    sendMultiplayerSync(
      pawnsRef.current,
      nextIdx,
      playerDices,
      false
    );

    return;
  }

  // 3 se kam miss hai → automatic dice roll
  rollDice(false, true);
};
  const nextTurn = (currentIdx = turnIndex, customActive = activeColors) => {
    const nextIdx = (currentIdx + 1) % customActive.length;
    setTurnIndex(nextIdx);
    setHasRolled(false);
    setIsMoving(false);
    return nextIdx;
  };

  const rollDice = async (isBot = false, isAutoTimeout = false) => {
    if (hasRolled || isMoving || isRolling || showPodiumBoard) return;
    if (!isBot && !isAutoTimeout) {
      if (gameMode === 'ONLINE' && currentTurn !== myColor) return;
      if (gameMode === 'HYBRID' && playerSlots[currentTurn] === 'ONLINE' && currentTurn !== myColor) return;
    }

    setIsRolling(true);
    playSound('dice');

    spinAnim.setValue(0);
    diceBounceAnim.setValue(1);

    Animated.parallel([
      Animated.timing(spinAnim, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      Animated.sequence([
        Animated.timing(diceBounceAnim, { toValue: 1.35, duration: 180, useNativeDriver: false }),
        Animated.timing(diceBounceAnim, { toValue: 0.85, duration: 180, useNativeDriver: false }),
        Animated.timing(diceBounceAnim, { toValue: 1, duration: 290, useNativeDriver: false }),
      ])
    ]).start();

    const shuffleSteps = [50, 70, 90, 110];
    for (let i = 0; i < shuffleSteps.length; i++) {
      const rand = Math.floor(Math.random() * 6) + 1;
      setPlayerDices(prev => ({ ...prev, [currentTurn]: rand }));
      await sleep(shuffleSteps[i]);
    }
    const finalVal = Math.floor(Math.random() * 6) + 1;
    setPlayerDices(prev => ({ ...prev, [currentTurn]: finalVal }));
    await sleep(200);

    setIsRolling(false);
    setHasRolled(true);

    const newDices = { ...playerDices, [currentTurn]: finalVal };
    const validMoves = getValidMoves(currentTurn, finalVal);

    if (validMoves.length === 0) {
      setTimeout(() => {
        const nextIdx = nextTurn();
        sendMultiplayerSync(pawnsRef.current, nextIdx, newDices, false);
      }, 700);
    } else if (isBot || isAutoTimeout || validMoves.length === 1) {
      const bestMove = getStrategicMoveIndex(currentTurn, finalVal, validMoves);
      setTimeout(() => executeStepMovement(currentTurn, bestMove, finalVal, newDices), 400);
    } else {
      sendMultiplayerSync(pawnsRef.current, turnIndex, newDices, true);
    }
  };

  const executeStepMovement = async (color, index, diceVal, currentDices = playerDices) => {
    setIsMoving(true);
    let startStep = pawnsRef.current[color][index];

    if (startStep === -1) {
      playSound('move');
      const updated = JSON.parse(JSON.stringify(pawnsRef.current));
      updated[color][index] = 0;
      setPawns(updated);
      await sleep(350);
      finalizeMove(color, index, 0, diceVal, updated, currentDices);
      return;
    }

    let currentStep = startStep;
    let currentPawnsState = JSON.parse(JSON.stringify(pawnsRef.current));

    for (let step = 1; step <= diceVal; step++) {
      currentStep += 1;
      playSound('move');
      currentPawnsState = JSON.parse(JSON.stringify(currentPawnsState));
      currentPawnsState[color][index] = currentStep;
      setPawns(currentPawnsState);
      await sleep(250);
    }

    finalizeMove(color, index, currentStep, diceVal, currentPawnsState, currentDices);
  };

  const finalizeMove = (color, index, finalStep, diceVal, finalState, currentDices) => {
    let updatedPawns = JSON.parse(JSON.stringify(finalState));
    let extraTurn = diceVal === 6 || finalStep === 56;

    if (finalStep >= 0 && finalStep < 51) {
      const myTrackIndex = (START_INDEX[color] + finalStep) % 52;
      const isSafeCell = SAFE_INDEXES.includes(myTrackIndex);

      if (!isSafeCell) {
        ALL_COLORS.forEach((enemyColor) => {
          if (enemyColor !== color) {
            const teammate = isTeammate(color, enemyColor);
            if (!teammate || (teammate && friendlyKill)) {
              updatedPawns[enemyColor] = updatedPawns[enemyColor].map((enemyStep) => {
                if (enemyStep >= 0 && enemyStep < 51) {
                  const enemyTrackIndex = (START_INDEX[enemyColor] + enemyStep) % 52;
                  if (enemyTrackIndex === myTrackIndex) {
                    playSound('cut');
                    extraTurn = true;
                    return -1;
                  }
                }
                return enemyStep;
              });
            }
          }
        });
      }
    }

    let currentFinished = [...finishedRankings];
    let isCurrentColorWinnerNow = false;

    const hasWonMatch = updatedPawns[color].every((s) => s === 56);
    const isPawnOut = updatedPawns[color].some((s) => s > 0);

    if (!currentFinished.includes(color) && hasWonMatch && isPawnOut) {
      currentFinished.push(color);
      setFinishedRankings(currentFinished);
      isCurrentColorWinnerNow = true;
      playSound('win');
      const rankTitle = currentFinished.length === 1 ? '🥇 1st Place' : currentFinished.length === 2 ? '🥈 2nd Place' : '🥉 3rd Place';
      Alert.alert('VICTORY!', `${getBaseDynamicLabel(color)} secured ${rankTitle}!`);
    }

    const activeRemaining = activeColors.filter((c) => !currentFinished.includes(c));

    if (activeRemaining.length <= 1 && currentFinished.length > 0) {
      if (activeRemaining.length === 1) {
        currentFinished.push(activeRemaining[0]);
      }
      setFinishedRankings(currentFinished);
      setShowPodiumBoard(true);
      setPawns(updatedPawns);
      setIsMoving(false);

      if (currentFinished[0] === myColorRef.current) {
        addWinnerCoins(matchPrizePool);
      }
      updateUserGameStats(currentFinished[0] === myColorRef.current);
      sendMultiplayerSync(updatedPawns, turnIndex, currentDices, false, currentFinished);
      return;
    }

    setPawns(updatedPawns);
    setIsMoving(false);

    let newActiveColors = activeColors.filter((c) => !currentFinished.includes(c));
    if (isCurrentColorWinnerNow) {
      setActiveColors(newActiveColors);
      const nextIdx = nextTurn(turnIndex, newActiveColors);
      sendMultiplayerSync(updatedPawns, nextIdx, currentDices, false, currentFinished);
    } else if (extraTurn) {
      setHasRolled(false);
      setTurnTimeLeft(30);
      sendMultiplayerSync(updatedPawns, turnIndex, currentDices, false, currentFinished);
    } else {
      const nextIdx = nextTurn(turnIndex, activeColors);
      sendMultiplayerSync(updatedPawns, nextIdx, currentDices, false);
    }
  };

  const sendMultiplayerSync = (newPawns, nextTurnIdx, updatedDices, rolled, rankings = null) => {
    if ((gameMode === 'ONLINE' || gameMode === 'HYBRID') && ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        topic: `realtime:room_${roomCode}`,
        event: 'broadcast',
        payload: {
          type: 'SYNC_GAME',
          data: { newPawns, nextTurnIdx, updatedDices, rolled, rankings, syncedColors: activeColors, syncedPlayType: playType }
        },
        ref: '2'
      }));
    }
  };

  // ========== WEB SOCKET HANDLER ==========
  useEffect(() => {
    if (!roomCode) return;

    const wsUrl = `wss://${SUPABASE_PROJECT_REF}.supabase.co/realtime/v1/websocket?apikey=${SUPABASE_ANON_KEY}&vsn=1.0.0`;
    const socket = new WebSocket(wsUrl);
    ws.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ topic: `realtime:room_${roomCode}`, event: 'phx_join', payload: {}, ref: 'room_join_ref' }));

      if (isHostRef.current && currentUserRef.current) {
        socket.send(JSON.stringify({
          topic: `realtime:room_${roomCode}`,
          event: 'broadcast',
          payload: {
            type: 'PLAYER_JOINED',
            data: {
              color: myColorRef.current,
              name: currentUserRef.current.name,
              id: currentUserRef.current.playerId,
              avatar: userAvatarRef.current
            }
          },
          ref: 'p_join_host'
        }));
      }
    };

    socket.onmessage = async (e) => {
      try {
        const message = JSON.parse(e.data);
        if (message.event !== 'broadcast') return;
        const type = message.payload?.type;
        const data = message.payload?.data;

        if (type === 'CHECK_ROOM_EXISTS') {
          if (!isHostRef.current || !currentUserRef.current) return;

          const occupied = new Set([
            ...Object.keys(roomPlayersRef.current),
            myColorRef.current
          ]);
          const available = activeColorsRef.current.filter(c => !occupied.has(c));
          const assignedColor = available[0];

          if (!assignedColor) {
            socket.send(JSON.stringify({
              topic: `realtime:room_${roomCodeRef.current}`,
              event: 'broadcast',
              payload: { type: 'ROOM_FULL', data: {} },
              ref: 'room_full'
            }));
            return;
          }

          socket.send(JSON.stringify({
            topic: `realtime:room_${roomCodeRef.current}`,
            event: 'broadcast',
            payload: {
              type: 'ROOM_EXISTS_CONFIRMED',
              data: {
                hostName: currentUserRef.current.name,
                hostAvatar: userAvatarRef.current,
                hostColor: myColorRef.current,
                activeColors: activeColorsRef.current,
                playType: playTypeRef.current,
                entryFee: selectedEntryFeeRef.current,
                syncedPlayerSlots: playerSlotsRef.current,
                syncedRoomPlayers: roomPlayersRef.current,
                assignedColor: assignedColor
              }
            },
            ref: 'confirm_ack'
          }));
        }
        else if (type === 'CHAT_MESSAGE') {
          setChatMessages(prev => [...prev, data]);
        }
        else if (type === 'VOICE_STATUS_UPDATE') {
          setVoiceUsers(prev => ({ ...prev, [data.color]: data.isMicOn }));
        }
        else if (type === 'PLAYER_JOINED') {
          const updatedRoster = {
            ...roomPlayersRef.current,
            [data.color]: { name: data.name, id: data.id, avatar: data.avatar }
          };
          roomPlayersRef.current = updatedRoster;
          setRoomPlayers(updatedRoster);
          recordRecentPlayer({ id: data.id, name: data.name, avatar: data.avatar });

          if (isHostRef.current && currentUserRef.current) {
            socket.send(JSON.stringify({
              topic: `realtime:room_${roomCodeRef.current}`,
              event: 'broadcast',
              payload: { type: 'ROSTER_UPDATE_FULL', data: updatedRoster },
              ref: 'roster_full'
            }));
          }
        }
        else if (type === 'ROSTER_UPDATE_FULL') {
          roomPlayersRef.current = data;
          setRoomPlayers(data);
        }
        else if (type === 'ROSTER_UPDATE') {
          const merged = { ...roomPlayersRef.current, [data.color]: { name: data.name, id: data.id, avatar: data.avatar } };
          roomPlayersRef.current = merged;
          setRoomPlayers(merged);
          recordRecentPlayer({ id: data.id, name: data.name, avatar: data.avatar });
        }
        else if (type === 'PLAYER_LEFT_MATCH') {
          const leftColor = data.color;
          const leftName = data.name || leftColor;
          if (activeColorsRef.current.length <= 2) {
            Alert.alert('Opponent Left', `${leftName} has left the match. You won!`);
            setShowPodiumBoard(true);
            setFinishedRankings([myColorRef.current, leftColor]);
            if (myColorRef.current === activeColorsRef.current.find(c => c !== leftColor)) {
              addWinnerCoins(matchPrizePool);
            }
            updateUserGameStats(true);
          } else {
            const remainingActive = activeColorsRef.current.filter(c => c !== leftColor);
            setActiveColors(remainingActive);
            Alert.alert('Player Disconnected', `${leftName} has left the match.`);
            if (currentTurn === leftColor) {
              const nextIdx = nextTurn();
              sendMultiplayerSync(pawnsRef.current, nextIdx, playerDices, false);
            }
          }
        }
        else if (type === 'START_MATCH') {
          if (!isHostRef.current) {
            await deductUserCoins(data.entryFee || 50);
          }
          if (data.activeColors) setActiveColors(data.activeColors);
          if (data.playType) setPlayType(data.playType);
          if (data.prizePool) setMatchPrizePool(data.prizePool);
          if (data.syncedRoomPlayers) {
            roomPlayersRef.current = data.syncedRoomPlayers;
            setRoomPlayers(data.syncedRoomPlayers);
          }
          if (data.playerSlots) {
            playerSlotsRef.current = data.playerSlots;
            setPlayerSlots(data.playerSlots);
          }
          setOnlineLobbyModal(false);
          setGameMode(data.playType === 'TEAM' ? 'HYBRID' : 'ONLINE');
        }
        else if (type === 'SYNC_GAME') {
          setOnlineLobbyModal(false);
          setGameMode((current) => current || (playType === 'TEAM' ? 'HYBRID' : 'ONLINE'));
          if (data.newPawns) setPawns(data.newPawns);
          if (data.nextTurnIdx !== undefined) setTurnIndex(data.nextTurnIdx);
          if (data.updatedDices) setPlayerDices(data.updatedDices);
          if (data.rolled !== undefined) setHasRolled(data.rolled);
          if (data.syncedColors) setActiveColors(data.syncedColors);
          if (data.syncedPlayType) setPlayType(data.syncedPlayType);
          if (data.rankings && data.rankings.length > 0) {
            setFinishedRankings(data.rankings);
            setShowPodiumBoard(true);
            if (data.rankings[0] === myColorRef.current) {
              addWinnerCoins(matchPrizePool);
            }
            updateUserGameStats(data.rankings[0] === myColorRef.current);
          }
        }
      } catch (err) {}
    };

    return () => { socket.close(); };
  }, [roomCode]);

  // ========== JOIN FUNCTIONS (WITH FORCED CODE SUPPORT) ==========
  const joinOnlineRoom = (forcedCode = null) => {
    const code = (forcedCode || inputRoomCode).trim();
    if (code.length < 4) {
      Alert.alert('Invalid Code', 'Please enter a valid room code');
      return;
    }

    setIsVerifyingRoom(true);
    setIsHost(false);

    const wsUrl = `wss://${SUPABASE_PROJECT_REF}.supabase.co/realtime/v1/websocket?apikey=${SUPABASE_ANON_KEY}&vsn=1.0.0`;
    const tempWs = new WebSocket(wsUrl);
    let joined = false;

    tempWs.onopen = () => {
      tempWs.send(JSON.stringify({ topic: `realtime:room_${code}`, event: 'phx_join', payload: {}, ref: 'chk_join' }));
      tempWs.send(JSON.stringify({
        topic: `realtime:room_${code}`,
        event: 'broadcast',
        payload: { type: 'CHECK_ROOM_EXISTS', data: { guestId: currentUser?.playerId } },
        ref: 'chk_req'
      }));
    };

    tempWs.onmessage = (e) => {
      try {
        const message = JSON.parse(e.data);
        if (message.event !== 'broadcast') return;
        if (message.payload?.type === 'ROOM_FULL') {
          Alert.alert('Room Full', 'This room already has all players.');
          tempWs.close();
          setIsVerifyingRoom(false);
          return;
        }
        if (message.payload?.type === 'ROOM_EXISTS_CONFIRMED') {
          if (joinTimeoutRef.current) clearTimeout(joinTimeoutRef.current);
          const data = message.payload.data;
          const assignedColor = data.assignedColor;
          const basePlayers = data.syncedRoomPlayers || {};
          const updatedPlayers = {
            ...basePlayers,
            [assignedColor]: { name: currentUser.name, id: currentUser.playerId, avatar: userAvatar }
          };

          setMyColor(assignedColor);
          myColorRef.current = assignedColor;
          setRoomCode(code);
          setActiveColors(data.activeColors || ['BLUE','GREEN']);
          setPlayType(data.playType || 'SOLO');
          setSelectedEntryFee(data.entryFee || 50);
          if (data.syncedPlayerSlots) setPlayerSlots(data.syncedPlayerSlots);
          roomPlayersRef.current = updatedPlayers;
          setRoomPlayers(updatedPlayers);
          setIsVerifyingRoom(false);
          setOnlineScreen(false);
          setOnlineLobbyModal(true);

          if (currentUserRef.current) {
            tempWs.send(JSON.stringify({
              topic: `realtime:room_${code}`,
              event: 'broadcast',
              payload: {
                type: 'PLAYER_JOINED',
                data: { color: assignedColor, name: currentUserRef.current.name, id: currentUserRef.current.playerId, avatar: userAvatarRef.current }
              },
              ref: 'p_join_guest'
            }));
          }
          joined = true;
          tempWs.close();
        }
      } catch (err) {}
    };

    joinTimeoutRef.current = setTimeout(() => {
      tempWs.close();
      if (!joined) {
        setIsVerifyingRoom(false);
        Alert.alert('Room Not Found', 'No active host found with this code.');
      }
    }, 4500);
  };

  const joinTeamOnlineRoom = (forcedCode = null) => {
    const code = (forcedCode || teamJoinCode).trim();
    if (code.length < 4) {
      Alert.alert('Invalid Code', 'Please enter a valid room code to join');
      return;
    }

    setIsVerifyingRoom(true);
    setIsHost(false);

    const wsUrl = `wss://${SUPABASE_PROJECT_REF}.supabase.co/realtime/v1/websocket?apikey=${SUPABASE_ANON_KEY}&vsn=1.0.0`;
    const tempWs = new WebSocket(wsUrl);
    let joined = false;

    tempWs.onopen = () => {
      tempWs.send(JSON.stringify({ topic: `realtime:room_${code}`, event: 'phx_join', payload: {}, ref: 'chk_join_team' }));
      tempWs.send(JSON.stringify({
        topic: `realtime:room_${code}`,
        event: 'broadcast',
        payload: { type: 'CHECK_ROOM_EXISTS', data: { guestId: currentUser?.playerId } },
        ref: 'chk_req_team'
      }));
    };

    tempWs.onmessage = (e) => {
      try {
        const message = JSON.parse(e.data);
        if (message.event !== 'broadcast') return;
        if (message.payload?.type === 'ROOM_FULL') {
          Alert.alert('Room Full', 'This team room already has all players.');
          tempWs.close();
          setIsVerifyingRoom(false);
          return;
        }
        if (message.payload?.type === 'ROOM_EXISTS_CONFIRMED') {
          if (joinTimeoutRef.current) clearTimeout(joinTimeoutRef.current);
          const data = message.payload.data;
          const assignedColor = data.assignedColor;
          const basePlayers = data.syncedRoomPlayers || {};
          const updatedPlayers = {
            ...basePlayers,
            [assignedColor]: { name: currentUser.name, id: currentUser.playerId, avatar: userAvatar }
          };

          setMyColor(assignedColor);
          myColorRef.current = assignedColor;
          setRoomCode(code);
          setActiveColors(['BLUE','RED','GREEN','YELLOW']);
          setPlayType('TEAM');
          setGameMode('HYBRID');
          setSelectedEntryFee(data.entryFee || 50);
          if (data.syncedPlayerSlots) setPlayerSlots(data.syncedPlayerSlots);
          roomPlayersRef.current = updatedPlayers;
          setRoomPlayers(updatedPlayers);
          setIsVerifyingRoom(false);
          setHybridTeamModal(false);
          setOnlineLobbyModal(true);

          if (currentUserRef.current) {
            tempWs.send(JSON.stringify({
              topic: `realtime:room_${code}`,
              event: 'broadcast',
              payload: {
                type: 'PLAYER_JOINED',
                data: { color: assignedColor, name: currentUserRef.current.name, id: currentUserRef.current.playerId, avatar: userAvatarRef.current }
              },
              ref: 'p_join_guest_team'
            }));
          }
          joined = true;
          tempWs.close();
        }
      } catch (err) {}
    };

    joinTimeoutRef.current = setTimeout(() => {
      tempWs.close();
      if (!joined) {
        setIsVerifyingRoom(false);
        Alert.alert('Room Not Found', 'No active team host found with this code.');
      }
    }, 4500);
  };

  // ========== START HOST / BOT / PASS & PLAY ==========
  const startOnlineHost = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setRoomCode(code);
    setMyColor('BLUE');
    myColorRef.current = 'BLUE';
    setIsHost(true);
    setPlayerSlots({ BLUE:'LOCAL', GREEN:'ONLINE', RED:'ONLINE', YELLOW:'ONLINE' });
    let colors = ['BLUE','GREEN'];
    if (onlinePlayType === 'SOLO') {
      if (onlinePlayerCount === 2) colors = ['BLUE','GREEN'];
      else if (onlinePlayerCount === 3) colors = ['BLUE','RED','GREEN'];
      else colors = ['BLUE','RED','GREEN','YELLOW'];
    } else {
      colors = ['BLUE','RED','GREEN','YELLOW'];
    }
    setActiveColors(colors);
    setPlayType(onlinePlayType);
    setRoomPlayers({ BLUE: { name: currentUser.name, id: currentUser.playerId, avatar: userAvatar } });
    setOnlineScreen(false);
    setOnlineLobbyModal(true);
  };

  const startBotMatch = (count) => {
    let colors = ['BLUE','GREEN'], pool = 100;
    if (count === 2) { colors = ['BLUE','GREEN']; pool = 100; setRoomPlayers({ BLUE:{name:currentUser.name}, GREEN:{name:'Computer (Green)'} }); }
    else if (count === 3) { colors = ['BLUE','RED','GREEN']; pool = 200; setRoomPlayers({ BLUE:{name:currentUser.name}, RED:{name:'Bot 1 (Red)'}, GREEN:{name:'Bot 2 (Green)'} }); }
    else { colors = ['BLUE','RED','GREEN','YELLOW']; pool = 300; setRoomPlayers({ BLUE:{name:currentUser.name}, RED:{name:'Bot 1'}, GREEN:{name:'Bot 2'}, YELLOW:{name:'Bot 3'} }); }
    setPlayerMissCount({ BLUE:0, RED:0, GREEN:0, YELLOW:0 });
    setMatchPrizePool(pool);
    setActiveColors(colors);
    setPlayType('SOLO');
    setTurnIndex(0);
    setHasRolled(false);
    setIsMoving(false);
    setFinishedRankings([]);
    setShowPodiumBoard(false);
    setBotSelectModal(false);
    setGameMode('BOT');
  };
// ========== COMPUTER AUTO PLAY ==========
useEffect(() => {
  if (gameMode !== 'BOT') return;

  // BLUE = real player
  // Baaki colors = computer
  if (currentTurn === 'BLUE') return;

  // Agar koi move/animation already chal raha hai to wait karo
  if (hasRolled || isMoving || isRolling || showPodiumBoard) return;

  const botTimer = setTimeout(() => {
    rollDice(true);
  }, 800);

  return () => clearTimeout(botTimer);

}, [
  gameMode,
  currentTurn,
  turnIndex,
  hasRolled,
  isMoving,
  isRolling,
  showPodiumBoard
]);
  const startCustomPassPlay = () => {
    let colors, defaultRoomPlayers = {};
    if (playType === 'SOLO') {
      if (selectedPlayerCount === 2) { colors = ['BLUE','GREEN']; defaultRoomPlayers = { BLUE:{name:currentUser?.name||'Player 1'}, GREEN:{name:'Player 2'} }; }
      else if (selectedPlayerCount === 3) { colors = ['BLUE','RED','GREEN']; defaultRoomPlayers = { BLUE:{name:currentUser?.name||'Player 1'}, RED:{name:'Player 2'}, GREEN:{name:'Player 3'} }; }
      else { colors = ['BLUE','RED','GREEN','YELLOW']; defaultRoomPlayers = { BLUE:{name:currentUser?.name||'Player 1'}, RED:{name:'Player 2'}, GREEN:{name:'Player 3'}, YELLOW:{name:'Player 4'} }; }
    } else {
      colors = ['BLUE','RED','GREEN','YELLOW'];
      defaultRoomPlayers = { BLUE:{name:currentUser?.name||'Team A (1)'}, GREEN:{name:'Team A (2)'}, RED:{name:'Team B (1)'}, YELLOW:{name:'Team B (2)'} };
    }
    setRoomPlayers(defaultRoomPlayers);
    setActiveColors(colors);
    setPlayerMissCount({ BLUE:0, RED:0, GREEN:0, YELLOW:0 });
    setTurnIndex(0);
    setHasRolled(false);
    setIsMoving(false);
    setFinishedRankings([]);
    setShowPodiumBoard(false);
    setPassPlayModal(false);
    setGameMode('OFFLINE');
  };

  const handleSlotTypeChange = (col, newType) => {
    const updatedSlots = { ...playerSlots, [col]: newType };
    const hasLocal = Object.values(updatedSlots).some(t => t === 'LOCAL');
    if (!hasLocal) {
      Alert.alert('Local Player Required', 'At least 1 player slot must remain set to Local to control your turn.');
      return;
    }
    setPlayerSlots(updatedSlots);
  };

  const getEffectiveReadyCount = () => {
    let count = 0;
    activeColors.forEach((colorKey) => {
      if (roomPlayers[colorKey] || (gameMode === 'HYBRID' && (playerSlots[colorKey] === 'BOT' || playerSlots[colorKey] === 'LOCAL'))) count++;
    });
    return count;
  };

  const startMatchFromLobby = async () => {
    if (!isHost) { Alert.alert('Permission Denied', 'Only the room Host can start the game!'); return; }
    const currentReady = getEffectiveReadyCount();
    if (currentReady < activeColors.length) {
      Alert.alert('Waiting for Players', `Please wait for all players to join (${currentReady}/${activeColors.length}).`);
      return;
    }
    const canPlay = await deductUserCoins(selectedEntryFee);
    if (!canPlay) return;
    const totalPool = selectedEntryFee * activeColors.length;
    setMatchPrizePool(totalPool);
    Object.keys(roomPlayers).forEach((col) => {
      const p = roomPlayers[col];
      if (p && p.id && p.id !== currentUser.playerId) recordRecentPlayer(p);
    });
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        topic: `realtime:room_${roomCode}`,
        event: 'broadcast',
        payload: { type: 'START_MATCH', data: { activeColors, playType, syncedRoomPlayers: roomPlayers, entryFee: selectedEntryFee, prizePool: totalPool, playerSlots } },
        ref: 'start_1'
      }));
    }
    setOnlineLobbyModal(false);
    setTurnIndex(0);
    setHasRolled(false);
    setIsMoving(false);
    setFinishedRankings([]);
    setShowPodiumBoard(false);
    setGameMode(playType === 'TEAM' ? 'HYBRID' : 'ONLINE');
  };

  // ========== OTHER UI HELPERS ==========
  const copyMyPlayerId = async () => {
    if (!currentUser?.playerId) return;
    await Clipboard.setStringAsync(currentUser.playerId);
    Alert.alert('Copied!', `Your Player ID #${currentUser.playerId} copied.`);
  };

  const handleCopyAndShareRoomCode = async () => {
    if (!roomCode) return;
    try {
      await Clipboard.setStringAsync(roomCode);
      await Share.share({ message: `Join my Ludo Supreme game! Room Code: ${roomCode}` });
    } catch (error) {
      Alert.alert('Copied!', `Room Code ${roomCode} copied.`);
    }
  };

  const toggleVoiceMic = async () => {
    if (!isVoiceUnlocked) {
      Alert.alert(
        'Unlock Live Voice Chat',
        'You have to pay 500 coins to use online live voice chat. Do you want to unlock it?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Pay 500 Coins', onPress: async () => {
            const success = await deductUserCoins(500);
            if (success) {
              setIsVoiceUnlocked(true);
              executeMicToggle(true);
            }
          }}
        ]
      );
      return;
    }
    executeMicToggle(!isMicOn);
  };

  const executeMicToggle = async (nextState) => {
    setIsMicOn(nextState);
    try {
      if (agoraEngine.current) {
        await agoraEngine.current.muteLocalAudioStream(!nextState);
      }
    } catch (e) {}
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        topic: `realtime:room_${roomCodeRef.current}`,
        event: 'broadcast',
        payload: { type: 'VOICE_STATUS_UPDATE', data: { color: myColorRef.current, name: currentUserRef.current?.name, isMicOn: nextState } },
        ref: 'voice_1'
      }));
    }
  };

  const toggleSound = async (val) => {
    setSoundEnabled(val);
    await AsyncStorage.setItem('@ludo_sound_setting', JSON.stringify(val));
  };

  const selectAvatar = async (avatar) => {
    setUserAvatar(avatar);
    await AsyncStorage.setItem('@ludo_user_avatar', avatar);
    if (currentUser) {
      const updated = { ...currentUser, avatar };
      setCurrentUser(updated);
      await AsyncStorage.setItem('@ludo_supreme_user', JSON.stringify(updated));
      await syncUserToCloud(updated);
    }
  };

  // ========== SUPABASE CLOUD FUNCTIONS ==========
  const fetchCloudFriendList = async (myPlayerId) => {
    if (!myPlayerId) return;

    try {
      const filter = `(user_a.eq.${myPlayerId},user_b.eq.${myPlayerId})`;

      const response = await fetch(
        `${SUPABASE_REST_URL}/ludo_friendships?or=${encodeURIComponent(filter)}`,
        { headers: supabaseHeaders }
      );

      const friendships = await response.json();
      if (!Array.isArray(friendships)) return;

      const friendIds = friendships.map((row) =>
        String(row.user_a) === String(myPlayerId) ? row.user_b : row.user_a
      );

      if (friendIds.length === 0) {
        setFriendsList([]);
        return;
      }

      const usersResponse = await fetch(
        `${SUPABASE_REST_URL}/ludo_users?player_id=in.(${friendIds.join(',')})`,
        { headers: supabaseHeaders }
      );

      const users = await usersResponse.json();
      if (!Array.isArray(users)) return;

      const formattedFriends = users.map((user) => ({
        id: user.player_id,
        playerId: user.player_id,
        name: user.name || 'Player',
        email: user.email,
        avatar: user.avatar || '👤',
        online: user.last_seen
          ? Date.now() - new Date(user.last_seen).getTime() < 2 * 60 * 1000
          : false
      }));

      setFriendsList(formattedFriends);
    } catch (error) {
      console.log('Friend list error:', error);
    }
  };

  const checkCloudFriendRequests = async () => {
    if (!currentUserRef.current?.playerId) return;

    try {
      const response = await fetch(
        `${SUPABASE_REST_URL}/ludo_friend_requests?to_id=eq.${encodeURIComponent(
          currentUserRef.current.playerId
        )}&status=eq.pending&order=created_at.desc`,
        { headers: supabaseHeaders }
      );

      const data = await response.json();
      if (Array.isArray(data)) {
        setPendingRequests(data);
      }
    } catch (error) {
      console.log('Friend request check error:', error);
    }
  };

  const checkCloudGameInvites = async () => {
    if (!currentUserRef.current?.playerId) return;

    try {
      const response = await fetch(
        `${SUPABASE_REST_URL}/ludo_game_invites?to_id=eq.${encodeURIComponent(
          currentUserRef.current.playerId
        )}&status=eq.pending&order=created_at.desc`,
        { headers: supabaseHeaders }
      );

      const data = await response.json();
      if (Array.isArray(data)) {
        setIncomingInvitesList(data);
        if (data.length > 0) {
          setIncomingInvite({
            inviteRowId: data[0].id,
            fromName: data[0].from_name,
            fromId: data[0].from_id,
            roomCode: data[0].room_code,
            playType: data[0].play_type,
            entryFee: data[0].entry_fee
          });
        }
      }
    } catch (error) {
      console.log('Invite check error:', error);
    }
  };

  const handleSearchUser = async () => {
    const query = searchQuery.trim();

    if (!query) {
      Alert.alert('Search', 'Please enter Player ID or Email.');
      return;
    }

    if (!currentUserRef.current?.playerId) return;

    setIsSearchingCloud(true);
    setSearchedUserResult(null);

    try {
      const filter = `(player_id.eq.${query},email.eq.${query})`;
      const response = await fetch(
        `${SUPABASE_REST_URL}/ludo_users?or=${encodeURIComponent(filter)}&limit=1`,
        { headers: supabaseHeaders }
      );

      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        Alert.alert('Not Found', 'No player found with this Player ID or Email.');
        return;
      }

      const user = data[0];
      if (String(user.player_id) === String(currentUserRef.current.playerId)) {
        Alert.alert('Oops', 'You cannot add yourself.');
        return;
      }

      setSearchedUserResult({
        id: user.player_id,
        playerId: user.player_id,
        name: user.name || 'Player',
        email: user.email,
        avatar: user.avatar || '👤'
      });
    } catch (error) {
      console.log('Search user error:', error);
      Alert.alert('Error', 'Could not search player.');
    } finally {
      setIsSearchingCloud(false);
    }
  };

  const sendRealtimeFriendRequest = async (targetUser) => {
    if (!currentUserRef.current?.playerId || (!targetUser?.playerId && !targetUser?.id)) {
      return;
    }

    const targetId = targetUser.playerId || targetUser.id;
    const myId = currentUserRef.current.playerId;

    if (String(targetId) === String(myId)) {
      Alert.alert('Error', 'You cannot add yourself.');
      return;
    }

    try {
      const friendshipFilter = `(user_a.eq.${myId},user_b.eq.${targetId}),(user_a.eq.${targetId},user_b.eq.${myId})`;
      const existingFriend = await fetch(
        `${SUPABASE_REST_URL}/ludo_friendships?or=${encodeURIComponent(`(${friendshipFilter})`)}`,
        { headers: supabaseHeaders }
      );

      const friendshipData = await existingFriend.json();
      if (Array.isArray(friendshipData) && friendshipData.length > 0) {
        Alert.alert('Already Friends', 'This player is already in your friend list.');
        return;
      }

      const existingRequestResponse = await fetch(
        `${SUPABASE_REST_URL}/ludo_friend_requests?from_id=eq.${encodeURIComponent(myId)}&to_id=eq.${encodeURIComponent(targetId)}&status=eq.pending`,
        { headers: supabaseHeaders }
      );

      const existingRequests = await existingRequestResponse.json();
      if (Array.isArray(existingRequests) && existingRequests.length > 0) {
        Alert.alert('Already Sent', 'Friend request already sent.');
        return;
      }

      const response = await fetch(`${SUPABASE_REST_URL}/ludo_friend_requests`, {
        method: 'POST',
        headers: {
          ...supabaseHeaders,
          Prefer: 'return=representation'
        },
        body: JSON.stringify({
          from_id: String(myId),
          from_name: currentUserRef.current.name || 'Player',
          to_id: String(targetId),
          status: 'pending'
        })
      });

      if (!response.ok) {
        Alert.alert('Error', 'Friend request could not be sent.');
        return;
      }

      Alert.alert('Success', 'Friend request sent successfully! 📩');
      setSearchedUserResult(null);
      setSearchQuery('');
    } catch (error) {
      console.log('Send friend request error:', error);
      Alert.alert('Error', 'Could not send friend request.');
    }
  };

  const acceptFriendRequest = async (reqUser) => {
    if (!reqUser || !currentUserRef.current?.playerId) return;
    const myId = currentUserRef.current.playerId;

    try {
      await fetch(`${SUPABASE_REST_URL}/ludo_friend_requests?id=eq.${reqUser.id}`, {
        method: 'PATCH',
        headers: {
          ...supabaseHeaders,
          Prefer: 'return=minimal'
        },
        body: JSON.stringify({ status: 'accepted' })
      });

      await fetch(`${SUPABASE_REST_URL}/ludo_friendships`, {
        method: 'POST',
        headers: {
          ...supabaseHeaders,
          Prefer: 'return=representation'
        },
        body: JSON.stringify({
          user_a: String(reqUser.from_id),
          user_b: String(myId)
        })
      });

      Alert.alert('Friend Added! 🎉', `${reqUser.from_name || 'Player'} is now your friend.`);
      await checkCloudFriendRequests();
      await fetchCloudFriendList(myId);
    } catch (error) {
      console.log('Accept friend error:', error);
      Alert.alert('Error', 'Could not accept friend request.');
    }
  };

  const sendFriendInvite = async (friend) => {
    if (!friend || !currentUserRef.current?.playerId) return;

    if (!roomCode) {
      Alert.alert('Create Room First', 'Please create an online room first, then invite your friend.');
      return;
    }

    const friendId = friend.playerId || friend.id;

    try {
      const response = await fetch(`${SUPABASE_REST_URL}/ludo_game_invites`, {
        method: 'POST',
        headers: {
          ...supabaseHeaders,
          Prefer: 'return=representation'
        },
        body: JSON.stringify({
          from_id: String(currentUserRef.current.playerId),
          from_name: currentUserRef.current.name || 'Player',
          to_id: String(friendId),
          room_code: String(roomCode),
          play_type: playType || 'SOLO',
          entry_fee: Number(selectedEntryFee || 50),
          status: 'pending'
        })
      });

      if (!response.ok) {
        Alert.alert('Error', 'Game invite could not be sent.');
        return;
      }

      Alert.alert('Invite Sent 🎮', `Invitation sent to ${friend.name}.`);

      setFriendsList((previous) =>
        previous.map((item) =>
          String(item.id) === String(friendId) ? { ...item, isInvited: true } : item
        )
      );
    } catch (error) {
      console.log('Send invite error:', error);
      Alert.alert('Error', 'Could not send game invite.');
    }
  };

  const acceptInvite = async (inviteObj = null) => {
    const invite = inviteObj || incomingInvite;
    if (!invite) return;

    try {
      if (invite.inviteRowId) {
        await fetch(`${SUPABASE_REST_URL}/ludo_game_invites?id=eq.${invite.inviteRowId}`, {
          method: 'PATCH',
          headers: {
            ...supabaseHeaders,
            Prefer: 'return=minimal'
          },
          body: JSON.stringify({ status: 'accepted' })
        });
      }

      setIncomingInvite(null);
      await checkCloudGameInvites();

      const code = String(invite.roomCode);

      if (invite.playType === 'TEAM') {
        setTeamJoinCode(code);
        setHybridTeamModal(true);
        setTimeout(() => {
          joinTeamOnlineRoom(code);
        }, 500);
      } else {
        setInputRoomCode(code);
        setOnlineScreen(true);
        setTimeout(() => {
          joinOnlineRoom(code);
        }, 500);
      }
    } catch (error) {
      console.log('Accept invite error:', error);
      Alert.alert('Error', 'Could not join the invited room.');
    }
  };

  const declineInvite = async (inviteObj = null) => {
    const invite = inviteObj || incomingInvite;
    if (!invite) return;

    try {
      if (invite.inviteRowId) {
        await fetch(`${SUPABASE_REST_URL}/ludo_game_invites?id=eq.${invite.inviteRowId}`, {
          method: 'PATCH',
          headers: {
            ...supabaseHeaders,
            Prefer: 'return=minimal'
          },
          body: JSON.stringify({ status: 'declined' })
        });
      }

      setIncomingInvite(null);
      await checkCloudGameInvites();
    } catch (error) {
      console.log('Decline invite error:', error);
    }
  };

  // ========== RENDER FUNCTIONS ==========
  const renderCell = (row, col) => {
    if (row < 6 && col < 6) return null;
    if (row < 6 && col > 8) return null;
    if (row > 8 && col < 6) return null;
    if (row > 8 && col > 8) return null;
    if (row >= 6 && row <= 8 && col >= 6 && col <= 8) return null;

    let bgColor = '#ffffff';
    if (row === 7 && col >= 1 && col <= 5) bgColor = '#ef4444';
    if (col === 7 && row >= 1 && row <= 5) bgColor = '#16a34a';
    if (row === 7 && col >= 9 && col <= 13) bgColor = '#eab308';
    if (col === 7 && row >= 9 && row <= 13) bgColor = '#2563eb';
    if (row === 6 && col === 1) bgColor = '#ef4444';
    if (row === 1 && col === 8) bgColor = '#16a34a';
    if (row === 8 && col === 13) bgColor = '#eab308';
    if (row === 13 && col === 6) bgColor = '#2563eb';

    const isStar = (row === 2 && col === 6) || (row === 6 && col === 12) || (row === 12 && col === 8) || (row === 8 && col === 2);
    let arrowIcon = '', arrowColor = '#000';
    if (row === 7 && col === 0) { arrowIcon = '➔'; arrowColor = '#ef4444'; }
    if (row === 0 && col === 7) { arrowIcon = '⬇'; arrowColor = '#16a34a'; }
    if (row === 7 && col === 14) { arrowIcon = '⬅'; arrowColor = '#eab308'; }
    if (row === 14 && col === 7) { arrowIcon = '⬆'; arrowColor = '#2563eb'; }

    const left = col * CELL_SIZE;
    const top = row * CELL_SIZE;
    const inverseRot = getInverseRotationAngle(myColor);

    return (
      <View key={`${row}-${col}`} style={[styles.cell, { left, top, backgroundColor: bgColor }]}>
        {isStar && <Text style={[styles.starCleanText, { transform: [{ rotate: inverseRot }] }]}>☆</Text>}
        {arrowIcon !== '' && <Text style={[
  styles.arrowCleanText,
  {
    color: arrowColor
  }
]}>
  {arrowIcon}
</Text>}
      </View>
    );
  };

  const getBaseDynamicLabel = (color) => {
    if (playType === 'TEAM') {
      if (roomPlayers[color]?.name) return roomPlayers[color].name;
      if (color === 'BLUE') return roomPlayers['BLUE']?.name || (myColor === 'BLUE' ? currentUser?.name : 'Team A (Blue)');
      if (color === 'GREEN') return roomPlayers['GREEN']?.name || (myColor === 'GREEN' ? currentUser?.name : 'Team A (Green)');
      if (color === 'RED') return roomPlayers['RED']?.name || 'Team B (Red)';
      if (color === 'YELLOW') return roomPlayers['YELLOW']?.name || 'Team B (Yellow)';
    } else {
      if (roomPlayers[color]?.name) return roomPlayers[color].name;
      if (color === myColor) return currentUser ? currentUser.name : 'You';
      if (color === 'BLUE') return 'You';
      if (color === 'GREEN') return selectedPlayerCount === 2 ? 'Computer' : 'Player 3';
      if (color === 'RED') return 'Player 2';
      if (color === 'YELLOW') return 'Player 4';
    }
    return '';
  };

  const renderBase = (color, posStyle, isVertical) => {
    const isPlayable = activeColors.includes(color) || finishedRankings.includes(color);
    const label = getBaseDynamicLabel(color);
    const isRanked = finishedRankings.indexOf(color);
    const inverseRot = getInverseRotationAngle(myColor);

    return (
      <View style={[styles.base, posStyle]}>
        <View style={styles.baseInnerWhite}>
          <View style={styles.pocketRow}>
            <View style={[styles.basePocket, { backgroundColor: getTurnColorHex(color) }]} />
            <View style={[styles.basePocket, { backgroundColor: getTurnColorHex(color) }]} />
          </View>
          <View style={styles.pocketRow}>
            <View style={[styles.basePocket, { backgroundColor: getTurnColorHex(color) }]} />
            <View style={[styles.basePocket, { backgroundColor: getTurnColorHex(color) }]} />
          </View>
        </View>
        {isRanked !== -1 && (
          <View style={[styles.baseRankBanner, { transform: [{ rotate: inverseRot }] }]}>
            <Text style={styles.baseRankBannerText}>
              {isRanked === 0 ? '🥇 1st' : isRanked === 1 ? '🥈 2nd' : isRanked === 2 ? '🥉 3rd' : '4th'}
            </Text>
          </View>
        )}
        {isPlayable && (
          <Text style={[styles.playerLabel, isVertical ? styles.playerLabelRotated : styles.playerLabelHorizontal, { transform: [{ rotate: inverseRot }] }]}>
            {label}
          </Text>
        )}
      </View>
    );
  };

  const renderAllTokens = () => {
    const cellGroups = {};
    const inverseRot = getInverseRotationAngle(myColor);

    ALL_COLORS.forEach((color) => {
      pawns[color].forEach((stepCount, idx) => {
        if (stepCount >= 0 && stepCount < 56) {
          const coords = getPawnScreenCoords(color, stepCount, idx);
          const cellKey = `${coords[0].toFixed(1)}_${coords[1].toFixed(1)}`;
          if (!cellGroups[cellKey]) cellGroups[cellKey] = [];
          cellGroups[cellKey].push({ color, idx, stepCount, coords });
        }
      });
    });

    const rendered = [];
    ALL_COLORS.forEach((color) => {
      pawns[color].forEach((stepCount, idx) => {
        const coords = getPawnScreenCoords(color, stepCount, idx);
        const isMyTurn = currentTurn === color;
        const colorHex = getTurnColorHex(color);
        let offsetX = 0, offsetY = 0, stackCount = 1;

        if (stepCount >= 0 && stepCount < 56) {
          const cellKey = `${coords[0].toFixed(1)}_${coords[1].toFixed(1)}`;
          const group = cellGroups[cellKey] || [];
          stackCount = group.length;
          if (stackCount > 1) {
            const idxInGroup = group.findIndex(p => p.color === color && p.idx === idx);
            if (idxInGroup === 0) { offsetX = -4; offsetY = -3; }
            else if (idxInGroup === 1) { offsetX = 5; offsetY = 3; }
            else if (idxInGroup === 2) { offsetX = 0; offsetY = 5; }
            else if (idxInGroup === 3) { offsetX = -4; offsetY = 5; }
          }
        }

        const finalLeft = coords[1] * CELL_SIZE + offsetX;
        const finalTop = coords[0] * CELL_SIZE - 7 + offsetY;

        rendered.push(
          <TouchableOpacity
            key={`${color}-${idx}`}
            disabled={!hasRolled || !isMyTurn || isMoving}
            onPress={() => executeStepMovement(color, idx, playerDices[color])}
            style={[
  styles.tokenWrapper,
  {
    left: finalLeft,
    top: finalTop,
    zIndex: isMyTurn ? 25 : 10 + idx
  },
  stepCount === 56 && { opacity: 0.3 }
]}
          >
            <PinToken colorHex={colorHex} stackCount={stackCount} />
          </TouchableOpacity>
        );
      });
    });
    return rendered;
  };

  const getTurnColorHex = (col) => {
    if (col === 'RED') return '#ef4444';
    if (col === 'GREEN') return '#16a34a';
    if (col === 'YELLOW') return '#eab308';
    return '#2563eb';
  };

  const renderPlayerCard = (color, pinHex, isLeftDice = false) => {
    const isPlayable = activeColors.includes(color) && !finishedRankings.includes(color);
    if (!isPlayable) return <View style={styles.playerCardPlaceholder} />;

    const isCurrent = currentTurn === color;
    const slotType = playerSlots[color];
    const misses = playerMissCount[color] || 0;
    const badgeText = gameMode === 'HYBRID' ? (slotType === 'LOCAL' ? '📱 Local' : slotType === 'ONLINE' ? '🌐 Online' : '🤖 Bot') : '';
    const userMicState = voiceUsers[color];

    const spinVal = spinAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '1080deg'],
    });

    return (
      <View style={styles.cardContainerWrapper}>
        {isCurrent && (
          <Animated.View 
            style={[
              styles.floatingArrowContainer, 
              styles.arrowTopPos, 
              { transform: [{ translateY: arrowBounceAnim }], opacity: arrowBlinkAnim }
            ]}
          >
            <View style={styles.arrowIconBubble}><Text style={styles.arrowIconText}>▼</Text></View>
          </Animated.View>
        )}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => isCurrent && rollDice()}
          style={[styles.playerCard, isCurrent && styles.activeCardGlow]}
        >
          {isLeftDice ? (
            <>
              <Animated.View style={[styles.cardDiceWrap, isCurrent && isRolling && { transform: [{ rotate: spinVal }, { scale: diceBounceAnim }] }]}>
                <DiceFace value={playerDices[color]} />
              </Animated.View>
              {isCurrent && (
                <View style={[styles.targetGapTimerBadge, turnTimeLeft <= 10 && styles.timerDangerPulse]}>
                  <Text style={styles.targetGapTimerText}>⏱️ {turnTimeLeft}s</Text>
                </View>
              )}
              <View style={styles.cardAvatarRight}>
                <PinToken colorHex={pinHex} stackCount={1} />
                {userMicState && <Text style={styles.micActiveIndicator}>🎙️</Text>}
                {misses > 0 && <Text style={styles.missCounterBadge}>⚠️ {misses}/3</Text>}
                {badgeText !== '' && <Text style={styles.slotSmallBadge}>{badgeText}</Text>}
              </View>
            </>
          ) : (
            <>
              <View style={styles.cardAvatarLeft}>
                <PinToken colorHex={pinHex} stackCount={1} />
                {userMicState && <Text style={styles.micActiveIndicator}>🎙️</Text>}
                {misses > 0 && <Text style={styles.missCounterBadge}>⚠️ {misses}/3</Text>}
                {badgeText !== '' && <Text style={styles.slotSmallBadge}>{badgeText}</Text>}
              </View>
              {isCurrent && (
                <View style={[styles.targetGapTimerBadge, turnTimeLeft <= 10 && styles.timerDangerPulse]}>
                  <Text style={styles.targetGapTimerText}>⏱️ {turnTimeLeft}s</Text>
                </View>
              )}
              <Animated.View style={[styles.cardDiceWrap, isCurrent && isRolling && { transform: [{ rotate: spinVal }, { scale: diceBounceAnim }] }]}>
                <DiceFace value={playerDices[color]} />
              </Animated.View>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // ========== RENDER FRIENDS MODAL ==========
  const renderFriendsSquadModal = () => (
    <Modal transparent animationType="slide" visible={friendsModal}>
      <View style={styles.inviteModalOverlay}>
        <View style={[styles.glassCard, { maxHeight: '92%', padding: 14 }]}>
          <View style={styles.squadTopHeaderRow}>
            <View>
              <Text style={styles.squadMainTitle}>👥 FRIENDS SQUAD</Text>
              <Text style={styles.squadSubTitle}>Play, Connect & Send Invites</Text>
            </View>
            <TouchableOpacity style={styles.squadCloseCrossBtn} onPress={() => setFriendsModal(false)}>
              <Text style={styles.squadCloseCrossText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.myIdPlankBar}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, marginRight: 6 }}>🪪</Text>
              <Text style={styles.myIdPlankText}>Your ID: <Text style={{ color: '#facc15', fontWeight: '900' }}>#{currentUser?.playerId || '9575'}</Text></Text>
            </View>
            <TouchableOpacity style={styles.copyIdPillBtn} onPress={copyMyPlayerId}><Text style={styles.copyIdPillText}>📋 Copy</Text></TouchableOpacity>
          </View>
          <View style={styles.topSquadSearchRow}>
            <TextInput style={styles.topSquadSearchInput} placeholder="Search by Player ID or Email..." placeholderTextColor="#64748b" autoCapitalize="none" value={searchQuery} onChangeText={setSearchQuery} />
            <TouchableOpacity style={styles.topSquadSearchBtn} onPress={handleSearchUser}>
              {isSearchingCloud ? <ActivityIndicator color="#000000" size="small" /> : <Text style={styles.topSquadSearchBtnText}>🔍 Search</Text>}
            </TouchableOpacity>
          </View>
          {searchedUserResult && (
            <View style={styles.searchedPlayerCardBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 24, marginRight: 8 }}>{searchedUserResult.avatar}</Text>
                <View><Text style={styles.friendCardNameText}>{searchedUserResult.name}</Text><Text style={styles.friendCardSubText}>ID: #{searchedUserResult.playerId}</Text></View>
              </View>
              <TouchableOpacity style={styles.addFriendActionBtn} onPress={() => sendRealtimeFriendRequest(searchedUserResult)}>
                <Text style={styles.addFriendActionText}>+ Add Friend</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.cleanTabsRow}>
            <TouchableOpacity style={[styles.cleanTabPill, friendsTab === 'LIST' && styles.cleanTabPillActive]} onPress={() => { setFriendsTab('LIST'); fetchCloudFriendList(currentUser?.playerId); }}>
              <Text style={[styles.cleanTabText, friendsTab === 'LIST' && styles.cleanTabTextActive]}>👥 Friends ({friendsList.length})</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.cleanTabPill, friendsTab === 'RECENT' && styles.cleanTabPillActive]} onPress={() => setFriendsTab('RECENT')}>
              <Text style={[styles.cleanTabText, friendsTab === 'RECENT' && styles.cleanTabTextActive]}>🕒 Recent ({recentPlayersList.length})</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.cleanTabPill, friendsTab === 'INVITES' && styles.cleanTabPillActive]} onPress={() => setFriendsTab('INVITES')}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.cleanTabText, friendsTab === 'INVITES' && styles.cleanTabTextActive]}>🎮 Invites</Text>
                {incomingInvitesList.length > 0 && <View style={styles.tabRedDotIndicator} />}
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.cleanTabPill, friendsTab === 'REQUESTS' && styles.cleanTabPillActive]} onPress={() => setFriendsTab('REQUESTS')}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.cleanTabText, friendsTab === 'REQUESTS' && styles.cleanTabTextActive]}>📩 Reqs</Text>
                {pendingRequests.length > 0 && <View style={styles.tabRedDotIndicator} />}
              </View>
            </TouchableOpacity>
          </View>
          {friendsTab === 'LIST' && (
            <ScrollView style={styles.squadTabScrollFeed}>
              {friendsList.length === 0 ? <Text style={styles.squadEmptyStateText}>No friends added yet. Type an ID in search box to add friends!</Text> :
                friendsList.map((friend) => (
                  <View key={friend.id} style={styles.friendItemCardWrap}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={styles.avatarWithRingBox}>
                        <Text style={{ fontSize: 24 }}>{friend.avatar || '👤'}</Text>
                        <View style={[styles.onlineIndicatorDot, { backgroundColor: friend.online ? '#10b981' : '#64748b' }]} />
                      </View>
                      <View style={{ marginLeft: 10 }}>
                        <Text style={styles.friendCardNameText}>{friend.name}</Text>
                        <Text style={styles.friendCardSubText}>ID: #{friend.id} • {friend.online ? 'Online' : 'Offline'}</Text>
                      </View>
                    </View>
                    <TouchableOpacity style={[styles.inviteFriendActionBtn, friend.isInvited && { backgroundColor: '#475569' }]} disabled={friend.isInvited} onPress={() => sendFriendInvite(friend)}>
                      <Text style={styles.inviteFriendActionText}>{friend.isInvited ? '✓ Invited' : '🎮 Invite'}</Text>
                    </TouchableOpacity>
                  </View>
                ))
              }
            </ScrollView>
          )}
          {friendsTab === 'RECENT' && (
            <ScrollView style={styles.squadTabScrollFeed}>
              {recentPlayersList.length === 0 ? <Text style={styles.squadEmptyStateText}>No recent players yet. Play online matches to see players here!</Text> :
                recentPlayersList.map((player) => {
                  const isAlreadyFriend = friendsList.some(f => f.id === player.id);
                  return (
                    <View key={player.id} style={styles.friendItemCardWrap}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 24, marginRight: 8 }}>{player.avatar || '👤'}</Text>
                        <View><Text style={styles.friendCardNameText}>{player.name}</Text><Text style={styles.friendCardSubText}>Played: {player.playedAt}</Text></View>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {!isAlreadyFriend && <TouchableOpacity style={[styles.inviteFriendActionBtn, { backgroundColor: '#3b82f6', marginRight: 6 }]} onPress={() => sendRealtimeFriendRequest(player)}>
                          <Text style={styles.inviteFriendActionText}>+ Friend</Text>
                        </TouchableOpacity>}
                        <TouchableOpacity style={styles.inviteFriendActionBtn} onPress={() => sendFriendInvite(player)}>
                          <Text style={styles.inviteFriendActionText}>🎮 Invite</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              }
            </ScrollView>
          )}
          {friendsTab === 'INVITES' && (
            <ScrollView style={styles.squadTabScrollFeed}>
              {incomingInvitesList.length === 0 ? <Text style={styles.squadEmptyStateText}>No match invites right now.</Text> :
                incomingInvitesList.map((inv) => (
                  <View key={inv.id} style={styles.friendItemCardWrap}>
                    <View><Text style={styles.friendCardNameText}>🎮 {inv.from_name}</Text><Text style={styles.friendCardSubText}>Room: #{inv.room_code} • Fee: 🪙 {inv.entry_fee}</Text></View>
                    <TouchableOpacity style={[styles.inviteFriendActionBtn, { backgroundColor: '#eab308' }]} onPress={() => acceptInvite({
                      inviteRowId: inv.id,
                      fromName: inv.from_name,
                      fromId: inv.from_id,
                      roomCode: inv.room_code,
                      playType: inv.play_type,
                      entryFee: inv.entry_fee,
                      targetColor: 'GREEN'
                    })}>
                      <Text style={[styles.inviteFriendActionText, { color: '#000000' }]}>✓ Join Match</Text>
                    </TouchableOpacity>
                  </View>
                ))
              }
            </ScrollView>
          )}
          {friendsTab === 'REQUESTS' && (
            <ScrollView style={styles.squadTabScrollFeed}>
              {pendingRequests.length === 0 ? <Text style={styles.squadEmptyStateText}>No pending friend requests.</Text> :
                pendingRequests.map((req) => (
                  <View key={req.id} style={styles.friendItemCardWrap}>
                    <View><Text style={styles.friendCardNameText}>{req.from_name || 'Player'}</Text><Text style={styles.friendCardSubText}>Sent you a friend request</Text></View>
                    <TouchableOpacity style={[styles.inviteFriendActionBtn, { backgroundColor: '#10b981' }]} onPress={() => acceptFriendRequest(req)}>
                      <Text style={styles.inviteFriendActionText}>✓ Accept</Text>
                    </TouchableOpacity>
                  </View>
                ))
              }
            </ScrollView>
          )}
          <TouchableOpacity activeOpacity={0.85} style={[styles.darkSecondaryButton, { marginTop: 10, width: '100%' }]} onPress={() => setFriendsModal(false)}>
            <Text style={styles.darkSecondaryButtonText}>Close Squad</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // ========== COMPLETE APP RENDER ==========
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
          {authMode !== 'FORGOT' ? (
            <View style={styles.tabToggleRow}>
              <TouchableOpacity style={[styles.tabToggleBtn, authMode === 'LOGIN' && styles.tabToggleActive]} onPress={() => setAuthMode('LOGIN')}>
                <Text style={[styles.tabToggleText, authMode === 'LOGIN' && styles.tabToggleTextActive]}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabToggleBtn, authMode === 'SIGNUP' && styles.tabToggleActive]} onPress={() => setAuthMode('SIGNUP')}>
                <Text style={[styles.tabToggleText, authMode === 'SIGNUP' && styles.tabToggleTextActive]}>Create Account</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.forgotHeaderBox}>
              <Text style={styles.forgotTitle}>🔑 Reset Your Password</Text>
              <Text style={styles.forgotSubtitle}>Enter registered email and set a new password</Text>
            </View>
          )}
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
          {authMode !== 'FORGOT' ? (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <TextInput style={styles.gameTextInput} placeholder="••••••••" placeholderTextColor="#64748b" secureTextEntry value={passwordInput} onChangeText={setPasswordInput} />
            </View>
          ) : (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.inputLabel}>NEW PASSWORD</Text>
              <TextInput style={styles.gameTextInput} placeholder="Enter new password" placeholderTextColor="#64748b" secureTextEntry value={newPasswordInput} onChangeText={setNewPasswordInput} />
            </View>
          )}
          {authMode === 'LOGIN' && (
            <TouchableOpacity style={styles.forgotLinkContainer} onPress={() => setAuthMode('FORGOT')}>
              <Text style={styles.forgotLinkText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity activeOpacity={0.85} style={[styles.gold3DButton, { marginTop: 14 }]} onPress={handleAuthSubmit}>
            <Text style={styles.gold3DButtonText}>
              {authMode === 'LOGIN' ? 'LOGIN TO ACCOUNT  ➔' : authMode === 'SIGNUP' ? 'SIGN UP PERMANENTLY  ➔' : 'CONFIRM RESET PASSWORD  ➔'}
            </Text>
          </TouchableOpacity>
          {authMode === 'FORGOT' && (
            <TouchableOpacity activeOpacity={0.85} style={[styles.darkSecondaryButton, { marginTop: 10 }]} onPress={() => setAuthMode('LOGIN')}>
              <Text style={styles.darkSecondaryButtonText}>⬅ Back to Sign In</Text>
            </TouchableOpacity>
          )}
          {authMode !== 'FORGOT' && (
            <>
              <View style={styles.orDivider}><View style={styles.dividerLine} /><Text style={styles.orText}>OR</Text><View style={styles.dividerLine} /></View>
              <TouchableOpacity activeOpacity={0.85} style={styles.darkSecondaryButton} onPress={handleGuestLogin}>
                <Text style={styles.darkSecondaryButtonText}>⚡ Quick Guest Play</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  if (botSelectModal) {
    return (
      <SafeAreaView style={styles.royaleContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0f1d" />
        <ScrollView style={{ width: '100%' }} contentContainerStyle={{ alignItems: 'center', paddingBottom: 20 }}>
          <View style={styles.brandHero}>
            <Text style={styles.crownEmoji}>🤖</Text>
            <Text style={styles.brandGoldTitle}>VS COMPUTER</Text>
            <Text style={styles.lobbySubtitle}>Practice & Win Free Coins</Text>
          </View>
          <View style={[styles.glassCard, { marginTop: 14 }]}>
            <Text style={styles.inputLabel}>HOW MANY PLAYERS?</Text>
            <View style={styles.playerCountRow}>
              {[2,3,4].map((count) => (
                <TouchableOpacity key={count} style={[styles.countPill, botPlayerCount === count && styles.countPillActive]} onPress={() => setBotPlayerCount(count)}>
                  <Text style={[styles.countPillText, botPlayerCount === count && styles.countPillTextActive]}>{count} Players</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.prizePoolPreviewBox}>
              <Text style={styles.prizePoolPreviewLabel}>🛡️ RISK FREE WINNER REWARD:</Text>
              <Text style={styles.prizePoolPreviewAmount}>🪙 Win {botPlayerCount === 2 ? '100' : botPlayerCount === 3 ? '200' : '300'} Coins on 1st Place!</Text>
            </View>
            <TouchableOpacity activeOpacity={0.85} style={[styles.gold3DButton, { marginTop: 16 }]} onPress={() => startBotMatch(botPlayerCount)}>
              <Text style={styles.gold3DButtonText}>START PRACTICE MATCH ➔</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} style={[styles.darkSecondaryButton, { marginTop: 10 }]} onPress={() => setBotSelectModal(false)}>
              <Text style={styles.darkSecondaryButtonText}>⬅ Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (passPlayModal) {
    return (
      <SafeAreaView style={styles.royaleContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0f1d" />
        <ScrollView style={{ width: '100%' }} contentContainerStyle={{ alignItems: 'center', paddingBottom: 20 }}>
          <View style={styles.brandHero}>
            <Text style={styles.crownEmoji}>👥</Text>
            <Text style={styles.brandGoldTitle}>PASS & PLAY</Text>
            <Text style={styles.lobbySubtitle}>Select Match Format</Text>
          </View>
          <View style={[styles.glassCard, { marginTop: 12 }]}>
            <Text style={styles.inputLabel}>SELECT GAMEPLAY TYPE:</Text>
            <View style={styles.tabToggleRow}>
              <TouchableOpacity style={[styles.tabToggleBtn, playType === 'SOLO' && styles.tabToggleActive]} onPress={() => setPlayType('SOLO')}>
                <Text style={[styles.tabToggleText, playType === 'SOLO' && styles.tabToggleTextActive]}>👤 Individual</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabToggleBtn, playType === 'TEAM' && styles.tabToggleActive]} onPress={() => setPlayType('TEAM')}>
                <Text style={[styles.tabToggleText, playType === 'TEAM' && styles.tabToggleTextActive]}>🤝 2v2 Team</Text>
              </TouchableOpacity>
            </View>
            {playType === 'SOLO' ? (
              <View style={{ marginTop: 14 }}>
                <Text style={styles.inputLabel}>HOW MANY PLAYERS?</Text>
                <View style={styles.playerCountRow}>
                  {[2,3,4].map((count) => (
                    <TouchableOpacity key={count} style={[styles.countPill, selectedPlayerCount === count && styles.countPillActive]} onPress={() => setSelectedPlayerCount(count)}>
                      <Text style={[styles.countPillText, selectedPlayerCount === count && styles.countPillTextActive]}>{count} Players</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              <View style={{ marginTop: 14 }}>
                <Text style={styles.inputLabel}>TEAM UP SETUP:</Text>
                <View style={styles.teamContainerBoxA}><Text style={styles.teamHeaderTitleA}>🛡️ Team A: Blue + Green</Text></View>
                <View style={[styles.teamContainerBoxB, { marginTop: 6 }]}><Text style={styles.teamHeaderTitleB}>⚔️ Team B: Red + Yellow</Text></View>
                <TouchableOpacity style={[styles.checkboxRow, { marginTop: 10 }]} onPress={() => setFriendlyKill(!friendlyKill)}>
                  <View style={[styles.checkSquare, friendlyKill && styles.checkSquareActive]}>{friendlyKill && <Text style={styles.checkTick}>✓</Text>}</View>
                  <View style={{ marginLeft: 10 }}><Text style={styles.checkboxLabel}>Enable Friendly Kill?</Text></View>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity activeOpacity={0.85} style={[styles.gold3DButton, { marginTop: 18 }]} onPress={startCustomPassPlay}>
              <Text style={styles.gold3DButtonText}>START GAME NOW ➔</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} style={[styles.darkSecondaryButton, { marginTop: 10 }]} onPress={() => setPassPlayModal(false)}>
              <Text style={styles.darkSecondaryButtonText}>⬅ Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (hybridTeamModal) {
    return (
      <SafeAreaView style={styles.royaleContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0f1d" />
        <ScrollView style={{ width: '100%' }} contentContainerStyle={{ alignItems: 'center', paddingBottom: 20 }}>
          <View style={styles.brandHero}>
            <Text style={styles.crownEmoji}>⚡</Text>
            <Text style={styles.brandGoldTitle}>HYBRID TEAM BATTLE</Text>
            <Text style={styles.lobbySubtitle}>Host or Join 2v2 Team Match</Text>
          </View>
          <View style={[styles.glassCard, { marginTop: 12 }]}>
            <Text style={styles.inputLabel}>SELECT ENTRY FEE PER PLAYER:</Text>
            <View style={styles.playerCountRow}>
              {ENTRY_FEE_OPTIONS.map((fee) => (
                <TouchableOpacity key={fee} style={[styles.countPill, selectedEntryFee === fee && styles.countPillActive]} onPress={() => setSelectedEntryFee(fee)}>
                  <Text style={[styles.countPillText, selectedEntryFee === fee && styles.countPillTextActive]}>🪙 {fee}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.inputLabel, { marginTop: 8 }]}>CREATE TEAM SLOTS:</Text>
            <View style={styles.teamContainerBoxA}>
              <View style={styles.teamHeaderRow}>
                <Text style={styles.teamHeaderTitleA}>🛡️ TEAM A (Blue & Green)</Text>
                <View style={styles.teamBadgeA}><Text style={styles.teamBadgeText}>Partners</Text></View>
              </View>
              {['BLUE','GREEN'].map((col) => (
                <View key={col} style={styles.slotRow}>
                  <Text style={[styles.slotColorText, { color: getTurnColorHex(col) }]}>{col}</Text>
                  <View style={styles.slotTypeSelector}>
                    {['LOCAL','ONLINE','BOT'].map((type) => (
                      <TouchableOpacity key={type} style={[styles.slotTypePill, playerSlots[col] === type && styles.slotTypePillActive]} onPress={() => handleSlotTypeChange(col, type)}>
                        <Text style={[styles.slotTypeText, playerSlots[col] === type && styles.slotTypeTextActive]}>
                          {type === 'LOCAL' ? '📱 Local' : type === 'ONLINE' ? '🌐 Online' : '🤖 Bot'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </View>
            <View style={styles.vsContainer}><View style={styles.vsLine} /><View style={styles.vsCircle}><Text style={styles.vsText}>VS</Text></View><View style={styles.vsLine} /></View>
            <View style={styles.teamContainerBoxB}>
              <View style={styles.teamHeaderRow}>
                <Text style={styles.teamHeaderTitleB}>⚔️ TEAM B (Red & Yellow)</Text>
                <View style={styles.teamBadgeB}><Text style={styles.teamBadgeText}>Partners</Text></View>
              </View>
              {['RED','YELLOW'].map((col) => (
                <View key={col} style={styles.slotRow}>
                  <Text style={[styles.slotColorText, { color: getTurnColorHex(col) }]}>{col}</Text>
                  <View style={styles.slotTypeSelector}>
                    {['LOCAL','ONLINE','BOT'].map((type) => (
                      <TouchableOpacity key={type} style={[styles.slotTypePill, playerSlots[col] === type && styles.slotTypePillActive]} onPress={() => handleSlotTypeChange(col, type)}>
                        <Text style={[styles.slotTypeText, playerSlots[col] === type && styles.slotTypeTextActive]}>
                          {type === 'LOCAL' ? '📱 Local' : type === 'ONLINE' ? '🌐 Online' : '🤖 Bot'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </View>
            <TouchableOpacity activeOpacity={0.85} style={[styles.gold3DButton, { marginTop: 14 }]} onPress={() => {
              const hasLocal = Object.values(playerSlots).some(t => t === 'LOCAL');
              if (!hasLocal) { Alert.alert('Configuration Error', 'At least 1 slot must be set to Local.'); return; }
              const code = Math.floor(100000 + Math.random() * 900000).toString();
              setRoomCode(code);
              setMyColor('BLUE');
              myColorRef.current = 'BLUE';
              setIsHost(true);
              setActiveColors(['BLUE','RED','GREEN','YELLOW']);
              setPlayType('TEAM');
              setGameMode('HYBRID');
              setMatchPrizePool(selectedEntryFee * 4);
              setRoomPlayers({ BLUE: { name: currentUser.name, id: currentUser.playerId, avatar: userAvatar } });
              setHybridTeamModal(false);
              setOnlineLobbyModal(true);
            }}>
              <Text style={styles.gold3DButtonText}>➕ CREATE TEAM ROOM (HOST)</Text>
            </TouchableOpacity>
            <View style={styles.orDivider}><View style={styles.dividerLine} /><Text style={styles.orText}>JOIN EXISTING TEAM</Text><View style={styles.dividerLine} /></View>
            <TextInput style={[styles.gameTextInput, { textAlign: 'center', fontSize: 18, letterSpacing: 4 }]} placeholder="ENTER TEAM ROOM CODE" placeholderTextColor="#64748b" keyboardType="number-pad" maxLength={6} value={teamJoinCode} onChangeText={setTeamJoinCode} />
            <TouchableOpacity activeOpacity={0.85} disabled={isVerifyingRoom} style={[styles.gold3DButton, { marginTop: 10, backgroundColor: '#0284c7', borderColor: '#38bdf8' }]} onPress={() => joinTeamOnlineRoom()}>
              {isVerifyingRoom ? <ActivityIndicator color="#ffffff" size="small" /> : <Text style={styles.gold3DButtonText}>🚪 JOIN TEAM ROOM NOW</Text>}
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} style={[styles.darkSecondaryButton, { marginTop: 10 }]} onPress={() => setHybridTeamModal(false)}>
              <Text style={styles.darkSecondaryButtonText}>⬅ Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (onlineScreen) {
    return (
      <SafeAreaView style={styles.royaleContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0f1d" />
        <ScrollView style={{ width: '100%' }} contentContainerStyle={{ alignItems: 'center', paddingBottom: 20 }}>
          <View style={styles.brandHero}><Text style={styles.crownEmoji}>🌐</Text><Text style={styles.brandGoldTitle}>ONLINE ARENA</Text><Text style={styles.lobbySubtitle}>Host or Join Room</Text></View>
          <View style={[styles.glassCard, { marginTop: 12 }]}>
            <Text style={styles.inputLabel}>SELECT MATCH TYPE:</Text>
            <View style={styles.tabToggleRow}>
              <TouchableOpacity style={[styles.tabToggleBtn, onlinePlayType === 'SOLO' && styles.tabToggleActive]} onPress={() => setOnlinePlayType('SOLO')}>
                <Text style={[styles.tabToggleText, onlinePlayType === 'SOLO' && styles.tabToggleTextActive]}>👤 Individual</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabToggleBtn, onlinePlayType === 'TEAM' && styles.tabToggleActive]} onPress={() => setOnlinePlayType('TEAM')}>
                <Text style={[styles.tabToggleText, onlinePlayType === 'TEAM' && styles.tabToggleTextActive]}>🤝 2v2 Team</Text>
              </TouchableOpacity>
            </View>
            {onlinePlayType === 'SOLO' ? (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.inputLabel}>PLAYERS COUNT:</Text>
                <View style={styles.playerCountRow}>
                  {[2,3,4].map((count) => (
                    <TouchableOpacity key={count} style={[styles.countPill, onlinePlayerCount === count && styles.countPillActive]} onPress={() => setOnlinePlayerCount(count)}>
                      <Text style={[styles.countPillText, onlinePlayerCount === count && styles.countPillTextActive]}>{count} Players</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              <View style={{ marginTop: 10 }}><Text style={styles.helperTip}>• 4 Real Online Players (Team A vs Team B)</Text></View>
            )}
            <Text style={[styles.inputLabel, { marginTop: 10 }]}>SELECT ENTRY FEE (BET):</Text>
            <View style={styles.playerCountRow}>
              {ENTRY_FEE_OPTIONS.map((fee) => (
                <TouchableOpacity key={fee} style={[styles.countPill, selectedEntryFee === fee && styles.countPillActive]} onPress={() => setSelectedEntryFee(fee)}>
                  <Text style={[styles.countPillText, selectedEntryFee === fee && styles.countPillTextActive]}>🪙 {fee}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity activeOpacity={0.85} style={[styles.gold3DButton, { marginTop: 12 }]} onPress={startOnlineHost}>
              <Text style={styles.gold3DButtonText}>➕ CREATE PRIVATE ROOM</Text>
            </TouchableOpacity>
            <View style={styles.orDivider}><View style={styles.dividerLine} /><Text style={styles.orText}>JOIN ROOM</Text><View style={styles.dividerLine} /></View>
            <TextInput style={[styles.gameTextInput, { textAlign: 'center', fontSize: 18, letterSpacing: 4 }]} placeholder="ENTER ROOM CODE" placeholderTextColor="#64748b" keyboardType="number-pad" maxLength={6} value={inputRoomCode} onChangeText={setInputRoomCode} />
            <TouchableOpacity activeOpacity={0.85} disabled={isVerifyingRoom} style={[styles.gold3DButton, { marginTop: 10, backgroundColor: '#0284c7', borderColor: '#38bdf8' }]} onPress={() => joinOnlineRoom()}>
              {isVerifyingRoom ? <ActivityIndicator color="#ffffff" size="small" /> : <Text style={styles.gold3DButtonText}>🚪 JOIN ROOM NOW</Text>}
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} style={[styles.darkSecondaryButton, { marginTop: 10 }]} onPress={() => setOnlineScreen(false)}>
              <Text style={styles.darkSecondaryButtonText}>⬅ Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Online Lobby
  if (onlineLobbyModal) {
    const isTeamMode = playType === 'TEAM';
    const opponentColors = activeColors.filter(c => c !== 'BLUE');
    const totalPotentialPool = selectedEntryFee * activeColors.length;
    const currentReady = getEffectiveReadyCount();
    const isRoomFull = currentReady === activeColors.length;

    const renderTeamSlot = (col, roleTag, badgeStyle, borderStyle) => {
      const slotSetting = playerSlots[col];
      const playerJoined = roomPlayers[col];
      if (slotSetting === 'BOT') {
        return (
          <View style={[styles.playerSquareActive, styles.slotBoxFilledYellow]}>
            <Text style={{ fontSize: 32 }}>🤖</Text>
            <Text style={styles.slotPlayerNameText}>AI Bot</Text>
            <Text style={styles.slotRoleTagYellow}>READY</Text>
          </View>
        );
      }
      if (slotSetting === 'LOCAL') {
        const isMeControlling = (col === myColor);
        return (
          <View style={[styles.playerSquareActive, badgeStyle]}>
            <Text style={{ fontSize: 32 }}>{isMeControlling ? userAvatar : '📱'}</Text>
            <Text style={styles.slotPlayerNameText} numberOfLines={1}>{isMeControlling ? currentUser.name : `Local (${col})`}</Text>
            <Text style={styles.slotRoleTagGreen}>LOCAL (READY)</Text>
          </View>
        );
      }
      if (playerJoined) {
        return (
          <View style={[styles.playerSquareActive, borderStyle]}>
            <Text style={{ fontSize: 32 }}>{playerJoined.avatar || '🎮'}</Text>
            <Text style={styles.slotPlayerNameText} numberOfLines={1}>{playerJoined.name}</Text>
            <Text style={styles.slotRoleTagGreen}>READY</Text>
          </View>
        );
      }
      return (
        <TouchableOpacity activeOpacity={0.8} style={styles.slotInviteBox} onPress={() => setFriendsModal(true)}>
          <Text style={styles.plusAvatarIcon}>👤+</Text>
          <Text style={styles.inviteSlotLabel}>Tap to Invite</Text>
        </TouchableOpacity>
      );
    };

    return (
      <SafeAreaView style={styles.matchmakingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#881337" />
        {renderFriendsSquadModal()}
        <View style={styles.matchLobbyHeader}>
          <Text style={styles.matchLobbyTitle}>ONLINE MULTIPLAYER</Text>
          <Text style={styles.matchFormatSub}>
            {isTeamMode ? '🤝 2v2 TEAM BATTLE' : `👤 ${activeColors.length} PLAYERS INDIVIDUAL`}
          </Text>
        </View>
        <View style={styles.matchCodeCard}>
          <Text style={styles.matchCodeLabel}>Room Code : </Text>
          <View style={styles.codePillBox}><Text style={styles.codePillText}>{roomCode}</Text></View>
          <TouchableOpacity activeOpacity={0.7} style={styles.shareCodeBtn} onPress={handleCopyAndShareRoomCode}>
            <Text style={styles.shareCodeText}>📋 Copy</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.prizePoolBadgeLobby}>
          <Text style={styles.prizePoolBadgeLobbyText}>🪙 Total Prize Pool: {totalPotentialPool.toLocaleString()} Coins</Text>
        </View>
        {isTeamMode ? (
          <View style={styles.teamMatchLobbyWrap}>
            <View style={styles.teamLobbyBoxA}>
              <Text style={styles.teamLobbyTitleA}>🛡️ TEAM A (Blue + Green)</Text>
              <View style={styles.teamSlotsRow}>
                {renderTeamSlot('BLUE', 'HOST (BLUE)', styles.slotBoxFilledBlue, styles.slotBoxFilledBlue)}
                {renderTeamSlot('GREEN', 'PARTNER', styles.slotBoxFilledGreen, styles.slotBoxFilledGreen)}
              </View>
            </View>
            <View style={styles.vsGlowBanner}><Text style={styles.vsGlowText}>⚡ VS ⚡</Text></View>
            <View style={styles.teamLobbyBoxB}>
              <Text style={styles.teamLobbyTitleB}>⚔️ TEAM B (Red + Yellow)</Text>
              <View style={styles.teamSlotsRow}>
                {renderTeamSlot('RED', 'OPPONENT', styles.slotBoxFilledRed, styles.slotBoxFilledRed)}
                {renderTeamSlot('YELLOW', 'OPPONENT', styles.slotBoxFilledYellow, styles.slotBoxFilledYellow)}
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.soloMatchLobbyWrap}>
            <View style={styles.hostProfileBox}>
              <View style={styles.hostAvatarSquare}>
                <Text style={{ fontSize: 44 }}>{isHost ? userAvatar : (roomPlayers['BLUE']?.avatar || '👑')}</Text>
              </View>
              <Text style={styles.hostNameText}>{roomPlayers['BLUE']?.name || 'Host'}</Text>
              <Text style={styles.hostBadgeText}>ROOM HOST (BLUE)</Text>
            </View>
            <View style={styles.vsGlowBanner}><Text style={styles.vsGlowText}>⚡ VS ⚡</Text></View>
            <View style={styles.opponentSlotsRow}>
              {opponentColors.map((colorKey) => {
                const playerJoined = roomPlayers[colorKey];
                return (
                  <TouchableOpacity key={colorKey} activeOpacity={0.8} style={[styles.slotInviteBox, playerJoined && { borderColor: getTurnColorHex(colorKey), backgroundColor: 'rgba(0,0,0,0.4)' }]} onPress={() => !playerJoined && setFriendsModal(true)}>
                    {playerJoined ? (
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 30 }}>{playerJoined.avatar || '🎮'}</Text>
                        <Text style={styles.joinedSlotName} numberOfLines={1}>{playerJoined.name}</Text>
                        <Text style={[styles.joinedSlotTag, { color: getTurnColorHex(colorKey) }]}>READY</Text>
                      </View>
                    ) : (
                      <View style={{ alignItems: 'center' }}>
                        <Text style={styles.plusAvatarIcon}>👤+</Text>
                        <Text style={styles.inviteSlotLabel}>Tap to Invite</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
        <View style={styles.matchBottomActions}>
          {isHost ? (
            <TouchableOpacity activeOpacity={0.85} disabled={!isRoomFull} style={[styles.startMatchGoldBtn, !isRoomFull && { backgroundColor: '#475569', borderColor: '#64748b' }]} onPress={startMatchFromLobby}>
              <Text style={[styles.startMatchGoldText, !isRoomFull && { color: '#94a3b8' }]}>
                {isRoomFull ? 'START MATCH NOW ➔' : `WAITING FOR PLAYERS (${currentReady}/${activeColors.length})...`}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.startMatchGoldBtn, { backgroundColor: '#334155', borderColor: '#64748b' }]}>
              <Text style={[styles.startMatchGoldText, { color: '#94a3b8', fontSize: 13 }]}>⏳ WAITING FOR HOST TO START...</Text>
            </View>
          )}
          <TouchableOpacity activeOpacity={0.85} style={styles.cancelMatchBtn} onPress={() => { setOnlineLobbyModal(false); resetGame(); }}>
            <Text style={styles.cancelMatchText}>✕ Leave Room</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Dashboard
  if (!gameMode) {
    const winPercentage = userStats.totalPlayed > 0 ? Math.round((userStats.totalWon / userStats.totalPlayed) * 100) : 0;
    return (
      <View style={styles.dashboardContainer}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <Image source={require('./lobby_bg.png')} style={styles.lobbyBgImage} resizeMode="cover" />
        {incomingInvite && (
          <Modal transparent animationType="fade" visible={!!incomingInvite}>
            <View style={styles.inviteModalOverlay}>
              <View style={[styles.glassCard, { borderColor: '#facc15', borderWidth: 2.5 }]}>
                <Text style={styles.cardHeading}>🎮 LIVE GAME INVITE!</Text>
                <View style={styles.inviteDetailsBox}>
                  <Text style={styles.invitePromptText}><Text style={{ fontWeight: 'bold', color: '#facc15', fontSize: 18 }}>{incomingInvite.fromName}</Text> invited you to play a match!</Text>
                  <Text style={styles.inviteRoomTag}>Room Code: #{incomingInvite.roomCode}</Text>
                  <Text style={styles.inviteModeTag}>Entry Bet: 🪙 {incomingInvite.entryFee || 50} Coins</Text>
                </View>
                <TouchableOpacity activeOpacity={0.85} style={styles.gold3DButton} onPress={() => acceptInvite()}>
                  <Text style={styles.gold3DButtonText}>ACCEPT & ENTER LOBBY ➔</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.85} style={[styles.darkSecondaryButton, { marginTop: 8 }]} onPress={() => declineInvite()}>
                  <Text style={styles.darkSecondaryButtonText}>Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
        {leaderboardModal && (
          <Modal transparent animationType="slide" visible={leaderboardModal}>
            <View style={styles.inviteModalOverlay}>
              <View style={[styles.glassCard, { borderColor: '#facc15', borderWidth: 2 }]}>
                <Text style={styles.podiumTitleHeader}>🏆 GLOBAL LEADERBOARD</Text>
                <Text style={styles.podiumSubHeader}>Top Royale Champions (Real Cloud)</Text>
                <ScrollView style={styles.leaderboardListWrap}>
                  {cloudLeaderboardData.map((player, index) => {
                    const isMe = player.player_id === currentUser.playerId;
                    const rankEmoji = index === 0 ? '🥇 1st' : index === 1 ? '🥈 2nd' : index === 2 ? '🥉 3rd' : `${index + 1}th`;
                    return (
                      <View key={player.player_id} style={[styles.leaderboardRowItem, isMe && styles.leaderboardHostRow]}>
                        <Text style={styles.rankBadgeText}>{rankEmoji}</Text>
                        <Text style={[styles.rankPlayerName, isMe && { color: '#facc15' }]}>{player.name} {isMe ? '(You)' : ''}</Text>
                        <Text style={styles.rankCoinText}>🪙 {player.coins.toLocaleString()}</Text>
                      </View>
                    );
                  })}
                </ScrollView>
                <TouchableOpacity activeOpacity={0.85} style={[styles.gold3DButton, { marginTop: 14 }]} onPress={() => setLeaderboardModal(false)}>
                  <Text style={styles.gold3DButtonText}>CLOSE LEADERBOARD</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
        {profileStatsModal && (
          <Modal transparent animationType="slide" visible={profileStatsModal}>
            <View style={styles.inviteModalOverlay}>
              <View style={[styles.glassCard, { borderColor: '#facc15', borderWidth: 2 }]}>
                <View style={styles.profileModalHeader}>
                  <Text style={styles.crownEmoji}>👑</Text>
                  <Text style={styles.profileStatsTitle}>{currentUser.name}</Text>
                  <Text style={styles.profileStatsSubId}>Player ID: #{currentUser?.playerId || '9575'}</Text>
                </View>
                <View style={styles.profileBigAvatarWrap}><Text style={{ fontSize: 44 }}>{userAvatar}</Text></View>
                <View style={styles.statsRowGrid}>
                  <View style={styles.statBoxCard}><Text style={styles.statBoxNumber}>{userStats.totalPlayed}</Text><Text style={styles.statBoxLabel}>Played</Text></View>
                  <View style={[styles.statBoxCard, { borderColor: '#10b981' }]}><Text style={[styles.statBoxNumber, { color: '#10b981' }]}>{userStats.totalWon}</Text><Text style={styles.statBoxLabel}>Won 🏆</Text></View>
                  <View style={[styles.statBoxCard, { borderColor: '#ef4444' }]}><Text style={[styles.statBoxNumber, { color: '#ef4444' }]}>{userStats.totalLost}</Text><Text style={styles.statBoxLabel}>Lost ❌</Text></View>
                  <View style={[styles.statBoxCard, { borderColor: '#facc15' }]}><Text style={[styles.statBoxNumber, { color: '#facc15' }]}>{winPercentage}%</Text><Text style={styles.statBoxLabel}>Win Rate</Text></View>
                </View>
                <View style={styles.infoLineRow}><Text style={styles.infoFieldLabel}>Gmail ID :</Text><Text style={styles.infoFieldValue} numberOfLines={1}>{currentUser.email}</Text></View>
                <View style={styles.infoLineRow}><Text style={styles.infoFieldLabel}>Coin Balance :</Text><Text style={[styles.infoFieldValue, { color: '#facc15' }]}>🪙 {currentUser.coins.toLocaleString()}</Text></View>
                <TouchableOpacity activeOpacity={0.85} style={[styles.gold3DButton, { marginTop: 14 }]} onPress={() => setProfileStatsModal(false)}>
                  <Text style={styles.gold3DButtonText}>CLOSE PROFILE ➔</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
        {settingsModal && (
          <Modal transparent animationType="slide" visible={settingsModal}>
            <View style={styles.inviteModalOverlay}>
              <View style={[styles.glassCard, { maxHeight: '90%' }]}>
                <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 10 }}>
                  <Text style={styles.cardHeading}>⚙️ GAME SETTINGS</Text>
                  <View style={styles.settingsSectionCard}>
                    <Text style={styles.settingsSectionTitle}>👤 USER PROFILE</Text>
                    <TouchableOpacity activeOpacity={0.8} style={styles.profileBigAvatarWrap} onPress={() => setAvatarModal(true)}>
                      <Text style={{ fontSize: 48 }}>{userAvatar}</Text>
                      <View style={styles.editAvatarBadge}><Text style={{ fontSize: 10, color: '#ffffff', fontWeight: 'bold' }}>✏️ Change</Text></View>
                    </TouchableOpacity>
                    <View style={styles.infoLineRow}><Text style={styles.infoFieldLabel}>Username :</Text><Text style={styles.infoFieldValue}>{currentUser.name}</Text></View>
                    <View style={styles.infoLineRow}><Text style={styles.infoFieldLabel}>Gmail ID :</Text><Text style={styles.infoFieldValue} numberOfLines={1}>{currentUser.email}</Text></View>
                    <View style={styles.infoLineRow}><Text style={styles.infoFieldLabel}>Player ID :</Text><Text style={styles.infoFieldValue}>#{currentUser.playerId || '9575'}</Text></View>
                    <TouchableOpacity style={styles.avatarPickerTriggerBtn} onPress={() => setAvatarModal(true)}><Text style={styles.avatarPickerTriggerText}>🎭 Select Cartoon Profile Picture ➔</Text></TouchableOpacity>
                  </View>
                  <View style={styles.settingsSectionCard}>
                    <Text style={styles.settingsSectionTitle}>🔊 AUDIO SETTINGS</Text>
                    <View style={styles.soundToggleRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}><Text style={{ fontSize: 22, marginRight: 8 }}>{soundEnabled ? '🔊' : '🔇'}</Text><Text style={styles.soundLabelText}>Game Sounds & FX</Text></View>
                      <Switch trackColor={{ false: '#475569', true: '#10b981' }} thumbColor={soundEnabled ? '#ffffff' : '#94a3b8'} onValueChange={toggleSound} value={soundEnabled} />
                    </View>
                  </View>
                  <View style={styles.settingsSectionCard}>
                    <Text style={styles.settingsSectionTitle}>ℹ️ ABOUT GAME</Text>
                    <Text style={styles.aboutGoldTitle}>LUDO SUPREME 3D</Text>
                    <Text style={styles.aboutVersionText}>Version: 1.0.0 (Royale Edition)</Text>
                    <View style={styles.dividerLine} />
                    <Text style={styles.aboutCreatorText}>App created by Rajeev Kumar sah</Text>
                    <Text style={styles.aboutContactText}>Gmail - razeevsah@gmail.com</Text>
                  </View>
                  <TouchableOpacity activeOpacity={0.85} style={styles.logoutSettingsBtn} onPress={handleLogout}>
                    <Text style={styles.logoutSettingsText}>🚪 LOGOUT ACCOUNT</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.gold3DButton, { width: '100%', marginTop: 8 }]} onPress={() => setSettingsModal(false)}>
                    <Text style={styles.gold3DButtonText}>SAVE & CLOSE</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}
        {avatarModal && (
          <Modal transparent animationType="fade" visible={avatarModal}>
            <View style={styles.inviteModalOverlay}>
              <View style={styles.avatarSelectionCard}>
                <View style={styles.avatarPreviewTopBox}>
                  <View style={styles.avatarPreviewCircle}><Text style={{ fontSize: 36 }}>{userAvatar}</Text></View>
                  <View style={styles.avatarPreviewNamePlank}><Text style={styles.avatarPreviewNameText}>{currentUser.name}</Text></View>
                </View>
                <View style={styles.avatarCategoryRow}>
                  <TouchableOpacity style={[styles.avatarTabBtn, avatarCategory === 'MALE' && styles.avatarTabActiveMale]} onPress={() => setAvatarCategory('MALE')}><Text style={styles.avatarTabText}>👦 Male</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.avatarTabBtn, avatarCategory === 'FEMALE' && styles.avatarTabActiveFemale]} onPress={() => setAvatarCategory('FEMALE')}><Text style={styles.avatarTabText}>👧 Female</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.avatarTabBtn, avatarCategory === 'ROYALE' && styles.avatarTabActiveRoyale]} onPress={() => setAvatarCategory('ROYALE')}><Text style={styles.avatarTabText}>👑 Special</Text></TouchableOpacity>
                </View>
                <Text style={styles.selectPicHeading}>SELECT PROFILE PICTURE</Text>
                <View style={styles.avatarGridContainer}>
                  {AVATAR_DATA[avatarCategory].map((item) => {
                    const isSelected = userAvatar === item.icon;
                    return (
                      <TouchableOpacity key={item.id} activeOpacity={0.7} style={[styles.avatarGridTile, isSelected && styles.avatarGridTileSelected]} onPress={() => selectAvatar(item.icon)}>
                        <Text style={{ fontSize: 38 }}>{item.icon}</Text>
                        <Text style={styles.avatarTileLabel} numberOfLines={1}>{item.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <TouchableOpacity activeOpacity={0.85} style={[styles.gold3DButton, { width: '100%', marginTop: 14 }]} onPress={() => setAvatarModal(false)}>
                  <Text style={styles.gold3DButtonText}>CONFIRM PICTURE ➔</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
        {renderFriendsSquadModal()}
        <SafeAreaView style={styles.fulfilledTopActionCenterBar}>
          <View style={styles.topActionCenterInnerRow}>
            <TouchableOpacity activeOpacity={0.85} style={styles.megaFulfilledButton} onPress={() => setLeaderboardModal(true)}>
              <Text style={styles.megaFulfilledEmoji}>🏆</Text><Text style={styles.megaFulfilledText}>Leaderboard</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} style={styles.megaFulfilledButton} onPress={() => { setFriendsModal(true); fetchCloudFriendList(currentUser?.playerId); }}>
              <Text style={styles.megaFulfilledEmoji}>👥</Text><Text style={styles.megaFulfilledText}>Friends Squad</Text>
              {(pendingRequests.length > 0 || incomingInvitesList.length > 0) && (
                <View style={styles.friendNotificationBadge}><Text style={styles.friendNotificationBadgeText}>{pendingRequests.length + incomingInvitesList.length}</Text></View>
              )}
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} style={styles.megaFulfilledButton} onPress={() => setSettingsModal(true)}>
              <Text style={styles.megaFulfilledEmoji}>⚙️</Text><Text style={styles.megaFulfilledText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        <View style={styles.centerBannerProfileWrapPerfect}>
          <TouchableOpacity activeOpacity={0.85} onPress={() => setProfileStatsModal(true)} style={styles.centerCrownPosition}>
            <Text style={{ fontSize: 30 }}>👑</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.85} onPress={() => setProfileStatsModal(true)} style={styles.centerBannerContainerPerfect}>
            <Text style={styles.centerBannerUsername} numberOfLines={1}>{currentUser.name}</Text>
            <View style={styles.centerBannerCoinsRow}>
              <Text style={{ fontSize: 13, marginRight: 4 }}>🪙</Text>
              <Text style={styles.centerBannerCoinsText}>{currentUser.coins.toLocaleString()} Coins</Text>
            </View>
            <Text style={styles.viewProfileSubHint}>Tap to view stats</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.podiumTouchLayer}>
          <TouchableOpacity activeOpacity={0.4} style={styles.podiumTouchSpot} onPress={() => setBotSelectModal(true)} />
          <TouchableOpacity activeOpacity={0.4} style={styles.podiumTouchSpot} onPress={() => setPassPlayModal(true)} />
          <TouchableOpacity activeOpacity={0.4} style={styles.podiumTouchSpot} onPress={() => setHybridTeamModal(true)} />
          <TouchableOpacity activeOpacity={0.4} style={styles.podiumTouchSpot} onPress={() => setOnlineScreen(true)} />
        </View>
      </View>
    );
  }

  // ========== GAME BOARD ==========
  const boardRotation = getBoardRotationAngle(myColor);
  const perspective = getPerspectiveLayout(myColor);

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0f2b5c" />
      <Image source={require('./lobby_bg.png')} style={styles.inGameBgCover} resizeMode="cover" blurRadius={12} />
      <View style={styles.inGameBackdropShade} />

      {/* Chat Modal */}
      <Modal transparent animationType="slide" visible={chatModal}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inviteModalOverlay}>
          <View style={[styles.glassCard, styles.chatModalBox]}>
            <View style={styles.chatHeaderRow}>
              <Text style={styles.chatTitleText}>💬 LIVE MATCH CHAT</Text>
              <TouchableOpacity onPress={() => setChatModal(false)} style={styles.closeChatBtn}><Text style={styles.closeChatText}>✕</Text></TouchableOpacity>
            </View>
            <FlatList
              data={chatMessages}
              keyExtractor={(item) => item.id}
              style={styles.chatListFeed}
              contentContainerStyle={{ paddingVertical: 8 }}
              renderItem={({ item }) => {
                const isMe = item.senderColor === myColor;
                return (
                  <View style={[styles.chatBubbleRow, isMe ? styles.chatBubbleRight : styles.chatBubbleLeft]}>
                    <View style={[styles.chatMessageBubble, isMe ? styles.chatBubbleMe : styles.chatBubbleOpponent]}>
                      <Text style={[styles.chatSenderName, { color: getTurnColorHex(item.senderColor) }]}>{item.senderName} ({item.senderColor})</Text>
                      <Text style={styles.chatMessageText}>{item.text}</Text>
                      <Text style={styles.chatTimeText}>{item.time}</Text>
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={<Text style={styles.noChatText}>No messages yet. Send a quick emoji or message!</Text>}
            />
            <View style={styles.quickEmojiRow}>
              {QUICK_EMOJIS.map((emoji, idx) => (
                <TouchableOpacity key={idx} style={styles.emojiCircleBtn} onPress={() => sendChatMessage(emoji)}>
                  <Text style={{ fontSize: 20 }}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.chatInputWrap}>
              <TextInput style={styles.chatTextInputField} placeholder="Type your message..." placeholderTextColor="#64748b" value={chatInputText} onChangeText={setChatInputText} />
              <TouchableOpacity style={styles.sendChatBtn} onPress={() => sendChatMessage()}><Text style={styles.sendChatBtnText}>Send ➔</Text></TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {showPodiumBoard && (
        <Modal transparent animationType="slide" visible={showPodiumBoard}>
          <View style={styles.inviteModalOverlay}>
            <View style={[styles.glassCard, { borderColor: '#facc15', borderWidth: 2.5 }]}>
              <Text style={styles.podiumTitleHeader}>🏆 MATCH LEADERBOARD 🏆</Text>
              <Text style={styles.podiumSubHeader}>Prize Pool Winner Payout</Text>
              <View style={styles.leaderboardListWrap}>
                {finishedRankings.map((colorKey, index) => {
                  const playerName = getBaseDynamicLabel(colorKey);
                  const isHostUser = colorKey === myColor;
                  const rankBadge = index === 0 ? '🥇 1st (Winner)' : index === 1 ? '🥈 2nd Place' : index === 2 ? '🥉 3rd Place' : '🎖️ 4th Place';
                  const coinReward = index === 0 ? `+🪙 ${matchPrizePool.toLocaleString()}` : '+🪙 0';
                  return (
                    <View key={colorKey} style={[styles.leaderboardRowItem, isHostUser && styles.leaderboardHostRow]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.rankBadgeText}>{rankBadge}</Text>
                        <View style={{ marginLeft: 10 }}>
                          <Text style={[styles.rankPlayerName, { color: getTurnColorHex(colorKey) }]}>{playerName}</Text>
                          <Text style={styles.rankColorSub}>{colorKey}</Text>
                        </View>
                      </View>
                      <View style={styles.rankCoinBox}><Text style={styles.rankCoinText}>{coinReward}</Text></View>
                    </View>
                  );
                })}
              </View>
              <TouchableOpacity activeOpacity={0.85} style={[styles.gold3DButton, { marginTop: 16 }]} onPress={resetGame}>
                <Text style={styles.gold3DButtonText}>COLLECT REWARD & EXIT ➔</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.exitBtn} onPress={handleExitGame}><Text style={styles.exitBtnText}>✕ Exit</Text></TouchableOpacity>
        <View style={styles.inGamePoolBox}><Text style={styles.inGamePoolText}>🪙 Pool: {matchPrizePool.toLocaleString()}</Text></View>
        {(gameMode === 'ONLINE' || gameMode === 'HYBRID') && (
          <View style={styles.onlineGameActions}>
            <TouchableOpacity activeOpacity={0.8} style={[styles.inGameIconBtn, isMicOn ? styles.micBtnActive : styles.micBtnInactive]} onPress={toggleVoiceMic}>
              <Text style={{ fontSize: 16 }}>{isMicOn ? '🎙️' : '🔇'}</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} style={[styles.inGameIconBtn, styles.chatTriggerBtn]} onPress={() => setChatModal(true)}>
              <Text style={{ fontSize: 16 }}>💬</Text>
              {chatMessages.length > 0 && <View style={styles.chatBadgeDot} />}
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.topCardsRow}>
        {renderPlayerCard(perspective.leftColor, getTurnColorHex(perspective.leftColor), false)}
        {renderPlayerCard(perspective.topColor, getTurnColorHex(perspective.topColor), true)}
      </View>

      <View style={styles.boardContainer}>
        <View style={[styles.board, { transform: [{ rotate: boardRotation }] }]}>
          {renderBase('RED', styles.redBase, true)}
          {renderBase('GREEN', styles.greenBase, false)}
          {renderBase('BLUE', styles.blueBase, false)}
          {renderBase('YELLOW', styles.yellowBase, false)}
          <View style={styles.centerHome}>
            <View style={styles.centerTriangleTop} />
            <View style={styles.centerTriangleRight} />
            <View style={styles.centerTriangleBottom} />
            <View style={styles.centerTriangleLeft} />
          </View>
          {Array.from({ length: 15 }).map((_, r) =>
            Array.from({ length: 15 }).map((_, c) => renderCell(r, c))
          )}
          {renderAllTokens()}
        </View>
      </View>

      <View style={styles.bottomCardsRow}>
        {renderPlayerCard(perspective.bottomColor, getTurnColorHex(perspective.bottomColor), false)}
        {renderPlayerCard(perspective.rightColor, getTurnColorHex(perspective.rightColor), true)}
      </View>
    </SafeAreaView>
  );
}

// ========== STYLES ==========
const styles = StyleSheet.create({
  royaleContainer: { flex:1, backgroundColor:'#0a0f1d', alignItems:'center', justifyContent:'space-between', paddingVertical:14, paddingHorizontal:16 },
  dashboardContainer: { flex:1, backgroundColor:'#0a0f1d', width:'100%', height:'100%' },
  lobbyBgImage: { width:'100%', height:'100%', position:'absolute', top:0, left:0, right:0, bottom:0 },
  fulfilledTopActionCenterBar: { width:'100%', alignItems:'center', paddingTop:22, zIndex:30 },
  topActionCenterInnerRow: { width:'90%', flexDirection:'row', justifyContent:'space-between', backgroundColor:'rgba(15,23,42,0.88)', borderWidth:1.5, borderColor:'#facc15', borderRadius:16, paddingVertical:8, paddingHorizontal:10, elevation:8 },
  megaFulfilledButton: { flex:1, alignItems:'center', justifyContent:'center', backgroundColor:'#1e293b', marginHorizontal:4, paddingVertical:6, borderRadius:10, borderWidth:1, borderColor:'#334155', position:'relative' },
  megaFulfilledEmoji: { fontSize:18, marginBottom:1 },
  megaFulfilledText: { color:'#ffffff', fontSize:10, fontWeight:'900', textAlign:'center' },
  friendNotificationBadge: { position:'absolute', top:-4, right:2, backgroundColor:'#ef4444', minWidth:16, height:16, borderRadius:8, justifyContent:'center', alignItems:'center', borderWidth:1.5, borderColor:'#ffffff', paddingHorizontal:2, elevation:6 },
  friendNotificationBadgeText: { color:'#ffffff', fontSize:9, fontWeight:'900' },
  tabRedDotIndicator: { width:7, height:7, borderRadius:3.5, backgroundColor:'#ef4444', marginLeft:4 },
  centerBannerProfileWrapPerfect: { width:'100%', alignItems:'center', marginTop:12, zIndex:15 },
  centerCrownPosition: { marginBottom:-13, zIndex:5, alignItems:'center' },
  centerBannerContainerPerfect: { width:'78%', backgroundColor:'rgba(20,30,50,0.95)', borderWidth:2, borderColor:'#facc15', borderRadius:16, paddingVertical:6, paddingHorizontal:12, alignItems:'center', shadowColor:'#facc15', shadowOpacity:0.5, shadowRadius:8, elevation:8 },
  centerBannerUsername: { color:'#ffffff', fontSize:15, fontWeight:'900', letterSpacing:0.5, textAlign:'center', maxWidth:'100%' },
  centerBannerCoinsRow: { flexDirection:'row', alignItems:'center', marginTop:2, justifyContent:'center' },
  centerBannerCoinsText: { color:'#facc15', fontSize:13, fontWeight:'800' },
  viewProfileSubHint: { color:'#38bdf8', fontSize:9, fontWeight:'bold', marginTop:2, letterSpacing:0.5 },
  podiumTouchLayer: { position:'absolute', top:'38%', left:'4%', right:'4%', height:360, flexDirection:'row', flexWrap:'wrap', justifyContent:'space-between', alignContent:'space-between', zIndex:20 },
  podiumTouchSpot: { width:'47%', height:165, borderRadius:24 },
  squadTopHeaderRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', width:'100%', borderBottomWidth:1, borderBottomColor:'#1e293b', paddingBottom:8 },
  squadMainTitle: { color:'#facc15', fontSize:18, fontWeight:'900', letterSpacing:1 },
  squadSubTitle: { color:'#94a3b8', fontSize:11, fontWeight:'600', marginTop:1 },
  squadCloseCrossBtn: { padding:6, backgroundColor:'#1e293b', borderRadius:14, borderWidth:1, borderColor:'#334155' },
  squadCloseCrossText: { color:'#ffffff', fontSize:13, fontWeight:'bold' },
  myIdPlankBar: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', width:'100%', backgroundColor:'#0a192f', paddingHorizontal:12, paddingVertical:8, borderRadius:10, borderWidth:1, borderColor:'#38bdf8', marginTop:10 },
  myIdPlankText: { color:'#ffffff', fontSize:13, fontWeight:'700' },
  copyIdPillBtn: { backgroundColor:'#0284c7', paddingHorizontal:10, paddingVertical:4, borderRadius:6 },
  copyIdPillText: { color:'#ffffff', fontWeight:'bold', fontSize:11 },
  topSquadSearchRow: { flexDirection:'row', width:'100%', marginTop:8 },
  topSquadSearchInput: { flex:1, backgroundColor:'#0a0f1d', borderWidth:1, borderColor:'#334155', borderRadius:10, color:'#ffffff', paddingHorizontal:12, paddingVertical:8, fontSize:12 },
  topSquadSearchBtn: { backgroundColor:'#eab308', borderRadius:10, paddingHorizontal:14, justifyContent:'center', alignItems:'center', marginLeft:6 },
  topSquadSearchBtnText: { color:'#000000', fontWeight:'900', fontSize:12 },
  searchedPlayerCardBox: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', width:'100%', backgroundColor:'#0a0f1d', padding:10, borderRadius:12, marginTop:8, borderWidth:1.5, borderColor:'#facc15' },
  addFriendActionBtn: { backgroundColor:'#10b981', paddingHorizontal:12, paddingVertical:6, borderRadius:8 },
  addFriendActionText: { color:'#ffffff', fontWeight:'900', fontSize:11 },
  cleanTabsRow: { flexDirection:'row', justifyContent:'space-between', width:'100%', marginTop:10, backgroundColor:'#0a0f1d', padding:3, borderRadius:10, borderWidth:1, borderColor:'#334155' },
  cleanTabPill: { flex:1, paddingVertical:7, alignItems:'center', borderRadius:8 },
  cleanTabPillActive: { backgroundColor:'#0284c7' },
  cleanTabText: { color:'#94a3b8', fontSize:10, fontWeight:'700' },
  cleanTabTextActive: { color:'#ffffff', fontWeight:'900' },
  squadTabScrollFeed: { maxHeight:220, width:'100%', marginTop:8 },
  squadEmptyStateText: { color:'#94a3b8', textAlign:'center', fontSize:12, marginTop:24, paddingHorizontal:16 },
  friendItemCardWrap: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', backgroundColor:'#0a0f1d', padding:10, borderRadius:12, marginVertical:4, borderWidth:1, borderColor:'#1e293b' },
  avatarWithRingBox: { position:'relative', width:34, height:34, borderRadius:17, backgroundColor:'#1e293b', justifyContent:'center', alignItems:'center', borderWidth:1.5, borderColor:'#38bdf8' },
  onlineIndicatorDot: { position:'absolute', bottom:-2, right:-2, width:9, height:9, borderRadius:4.5, borderWidth:1.5, borderColor:'#0a0f1d' },
  friendCardNameText: { color:'#ffffff', fontWeight:'bold', fontSize:13 },
  friendCardSubText: { color:'#94a3b8', fontSize:10, marginTop:1 },
  inviteFriendActionBtn: { backgroundColor:'#10b981', paddingHorizontal:12, paddingVertical:6, borderRadius:8 },
  inviteFriendActionText: { color:'#ffffff', fontWeight:'bold', fontSize:11 },
  profileModalHeader: { alignItems:'center', marginBottom:6 },
  profileStatsTitle: { color:'#facc15', fontSize:20, fontWeight:'900', letterSpacing:1 },
  profileStatsSubId: { color:'#38bdf8', fontSize:12, fontWeight:'bold', marginTop:2 },
  statsRowGrid: { flexDirection:'row', justifyContent:'space-between', width:'100%', marginVertical:12 },
  statBoxCard: { width:'23%', backgroundColor:'#0a0f1d', borderRadius:12, paddingVertical:10, alignItems:'center', borderWidth:1.5, borderColor:'#334155' },
  statBoxNumber: { color:'#ffffff', fontSize:18, fontWeight:'900' },
  statBoxLabel: { color:'#94a3b8', fontSize:10, fontWeight:'700', marginTop:2 },
  prizePoolPreviewBox: { backgroundColor:'#1e293b', borderRadius:12, padding:10, alignItems:'center', borderWidth:1.5, borderColor:'#facc15', marginTop:8 },
  prizePoolPreviewLabel: { color:'#94a3b8', fontSize:11, fontWeight:'bold' },
  prizePoolPreviewAmount: { color:'#facc15', fontSize:18, fontWeight:'900', marginTop:2 },
  prizePoolBadgeLobby: { backgroundColor:'#78350f', paddingHorizontal:14, paddingVertical:6, borderRadius:10, borderWidth:1.5, borderColor:'#facc15', marginVertical:4 },
  prizePoolBadgeLobbyText: { color:'#facc15', fontWeight:'900', fontSize:13 },
  inGamePoolBox: { backgroundColor:'#78350f', paddingHorizontal:10, paddingVertical:5, borderRadius:8, borderWidth:1, borderColor:'#facc15' },
  inGamePoolText: { color:'#facc15', fontWeight:'bold', fontSize:12 },
  settingsSectionCard: { width:'100%', backgroundColor:'#0a0f1d', borderRadius:14, padding:12, borderWidth:1, borderColor:'#334155', marginVertical:6, alignItems:'center' },
  settingsSectionTitle: { color:'#38bdf8', fontSize:12, fontWeight:'900', letterSpacing:1, marginBottom:8, alignSelf:'flex-start' },
  profileBigAvatarWrap: { width:75, height:75, borderRadius:38, backgroundColor:'#1e293b', justifyContent:'center', alignItems:'center', borderWidth:2.5, borderColor:'#facc15', marginVertical:6, position:'relative' },
  editAvatarBadge: { position:'absolute', bottom:-4, backgroundColor:'#0284c7', paddingHorizontal:6, paddingVertical:1, borderRadius:6, borderWidth:1, borderColor:'#ffffff' },
  infoLineRow: { flexDirection:'row', justifyContent:'space-between', width:'100%', paddingVertical:5, borderBottomWidth:0.5, borderBottomColor:'#1e293b' },
  infoFieldLabel: { color:'#94a3b8', fontSize:12, fontWeight:'bold' },
  infoFieldValue: { color:'#ffffff', fontSize:12, fontWeight:'bold', maxWidth:170 },
  avatarPickerTriggerBtn: { marginTop:10, backgroundColor:'#1e293b', paddingVertical:8, paddingHorizontal:12, borderRadius:10, borderWidth:1, borderColor:'#facc15', width:'100%', alignItems:'center' },
  avatarPickerTriggerText: { color:'#facc15', fontWeight:'bold', fontSize:12 },
  soundToggleRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', width:'100%', paddingVertical:4 },
  soundLabelText: { color:'#ffffff', fontSize:13, fontWeight:'bold' },
  aboutGoldTitle: { color:'#facc15', fontSize:16, fontWeight:'900', marginTop:2 },
  aboutVersionText: { color:'#94a3b8', fontSize:11, marginBottom:6 },
  aboutCreatorText: { color:'#ffffff', fontSize:12, fontWeight:'700' },
  aboutContactText: { color:'#38bdf8', fontSize:12, fontWeight:'600', marginTop:2 },
  logoutSettingsBtn: { width:'100%', backgroundColor:'#ef4444', borderRadius:12, paddingVertical:12, alignItems:'center', marginTop:10, borderWidth:1, borderColor:'#fca5a5' },
  logoutSettingsText: { color:'#ffffff', fontWeight:'900', fontSize:13, letterSpacing:0.5 },
  podiumTitleHeader: { color:'#facc15', fontSize:20, fontWeight:'900', textAlign:'center', letterSpacing:1 },
  podiumSubHeader: { color:'#94a3b8', fontSize:12, fontWeight:'700', textAlign:'center', marginBottom:14 },
  leaderboardListWrap: { width:'100%', maxHeight:240, marginVertical:6 },
  leaderboardRowItem: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', backgroundColor:'#0a0f1d', borderRadius:12, padding:10, marginVertical:4, borderWidth:1.5, borderColor:'#334155' },
  leaderboardHostRow: { borderColor:'#facc15', backgroundColor:'#1e293b' },
  rankBadgeText: { fontSize:14, fontWeight:'900', color:'#ffffff', width:45 },
  rankPlayerName: { fontSize:13, fontWeight:'bold', flex:1, marginLeft:6, color:'#ffffff' },
  rankColorSub: { fontSize:10, color:'#94a3b8', fontWeight:'600' },
  rankCoinBox: { backgroundColor:'#78350f', paddingHorizontal:8, paddingVertical:4, borderRadius:8, borderWidth:1, borderColor:'#facc15' },
  rankCoinText: { color:'#facc15', fontWeight:'900', fontSize:12 },
  baseRankBanner: { position:'absolute', top:4, backgroundColor:'#78350f', paddingHorizontal:6, paddingVertical:2, borderRadius:6, borderWidth:1, borderColor:'#facc15', zIndex:10 },
  baseRankBannerText: { color:'#fef08a', fontSize:10, fontWeight:'900' },
  avatarSelectionCard: { width:'95%', backgroundColor:'#022144', borderRadius:24, padding:14, borderWidth:3, borderColor:'#facc15', alignItems:'center', elevation:12 },
  avatarPreviewTopBox: { flexDirection:'row', alignItems:'center', justifyContent:'center', width:'100%', marginBottom:12 },
  avatarPreviewCircle: { width:56, height:56, borderRadius:28, backgroundColor:'#1e3a8a', borderWidth:2, borderColor:'#38bdf8', justifyContent:'center', alignItems:'center', marginRight:10 },
  avatarPreviewNamePlank: { backgroundColor:'#ffffff', borderWidth:2, borderColor:'#94a3b8', borderStyle:'dashed', borderRadius:10, paddingHorizontal:20, paddingVertical:8, minWidth:150, alignItems:'center' },
  avatarPreviewNameText: { color:'#000000', fontWeight:'900', fontSize:15 },
  avatarCategoryRow: { flexDirection:'row', justifyContent:'space-between', width:'100%', marginBottom:10 },
  avatarTabBtn: { flex:1, backgroundColor:'#0f172a', paddingVertical:8, alignItems:'center', borderRadius:10, marginHorizontal:3, borderWidth:1, borderColor:'#334155' },
  avatarTabActiveMale: { backgroundColor:'#0284c7', borderColor:'#38bdf8' },
  avatarTabActiveFemale: { backgroundColor:'#db2777', borderColor:'#f472b6' },
  avatarTabActiveRoyale: { backgroundColor:'#ca8a04', borderColor:'#facc15' },
  avatarTabText: { color:'#ffffff', fontWeight:'bold', fontSize:12 },
  selectPicHeading: { color:'#facc15', fontSize:16, fontWeight:'900', letterSpacing:1, marginVertical:6 },
  avatarGridContainer: { flexDirection:'row', flexWrap:'wrap', justifyContent:'space-between', width:'100%' },
  avatarGridTile: { width:'31%', height:85, backgroundColor:'#0a192f', borderRadius:12, borderWidth:1.5, borderColor:'#1e3a8a', justifyContent:'center', alignItems:'center', marginVertical:4 },
  avatarGridTileSelected: { borderColor:'#facc15', backgroundColor:'#1e3a8a', borderWidth:2.5, elevation:6 },
  avatarTileLabel: { color:'#94a3b8', fontSize:10, fontWeight:'bold', marginTop:2 },
  matchmakingContainer: { flex:1, backgroundColor:'#881337', alignItems:'center', justifyContent:'space-between', paddingVertical:18, paddingHorizontal:16 },
  matchLobbyHeader: { alignItems:'center', marginTop:4 },
  matchLobbyTitle: { color:'#facc15', fontSize:22, fontWeight:'900', letterSpacing:1.5 },
  matchFormatSub: { color:'#ffffff', fontSize:12, fontWeight:'800', marginTop:2, letterSpacing:1 },
  matchCodeCard: { flexDirection:'row', alignItems:'center', backgroundColor:'#450a0a', paddingHorizontal:14, paddingVertical:8, borderRadius:14, borderWidth:2, borderColor:'#f87171', marginTop:8 },
  matchCodeLabel: { color:'#ffffff', fontWeight:'bold', fontSize:15 },
  codePillBox: { backgroundColor:'#1e3a8a', paddingHorizontal:12, paddingVertical:4, borderRadius:8, borderWidth:1, borderColor:'#38bdf8' },
  codePillText: { color:'#facc15', fontWeight:'900', fontSize:18, letterSpacing:2 },
  shareCodeBtn: { backgroundColor:'#10b981', paddingHorizontal:12, paddingVertical:6, borderRadius:8, marginLeft:10 },
  shareCodeText: { color:'#ffffff', fontWeight:'bold', fontSize:12 },
  soloMatchLobbyWrap: { width:'100%', alignItems:'center', marginVertical:4 },
  hostProfileBox: { alignItems:'center', marginTop:6 },
  hostAvatarSquare: { width:84, height:84, borderRadius:18, backgroundColor:'#7f1d1d', borderWidth:2.5, borderColor:'#facc15', justifyContent:'center', alignItems:'center', elevation:8 },
  hostNameText: { color:'#ffffff', fontWeight:'900', fontSize:15, marginTop:4 },
  hostBadgeText: { color:'#38bdf8', fontWeight:'800', fontSize:10, marginTop:1 },
  vsGlowBanner: { marginVertical:6 },
  vsGlowText: { color:'#facc15', fontSize:20, fontWeight:'900', letterSpacing:2 },
  opponentSlotsRow: { flexDirection:'row', justifyContent:'center', width:'100%', marginVertical:6 },
  slotInviteBox: { width:88, height:95, borderRadius:16, backgroundColor:'#7f1d1d', borderWidth:2, borderColor:'#fca5a5', borderStyle:'dashed', justifyContent:'center', alignItems:'center', marginHorizontal:6, elevation:4 },
  plusAvatarIcon: { fontSize:28, color:'#fecaca' },
  inviteSlotLabel: { color:'#fecaca', fontSize:9, fontWeight:'bold', marginTop:4, textAlign:'center' },
  joinedSlotName: { color:'#ffffff', fontSize:11, fontWeight:'bold', maxWidth:75, textAlign:'center', marginTop:2 },
  joinedSlotTag: { fontSize:9, fontWeight:'900', marginTop:1 },
  teamMatchLobbyWrap: { width:'100%', marginVertical:2 },
  teamLobbyBoxA: { backgroundColor:'rgba(2,132,199,0.25)', borderWidth:1.5, borderColor:'#38bdf8', borderRadius:16, padding:8, alignItems:'center' },
  teamLobbyBoxB: { backgroundColor:'rgba(225,29,72,0.25)', borderWidth:1.5, borderColor:'#fb7185', borderRadius:16, padding:8, alignItems:'center' },
  teamLobbyTitleA: { color:'#38bdf8', fontWeight:'900', fontSize:12, marginBottom:6, letterSpacing:0.5 },
  teamLobbyTitleB: { color:'#fb7185', fontWeight:'900', fontSize:12, marginBottom:6, letterSpacing:0.5 },
  teamSlotsRow: { flexDirection:'row', justifyContent:'space-around', width:'100%' },
  playerSquareActive: { width:100, height:86, borderRadius:14, backgroundColor:'#1e3a8a', borderWidth:1.5, borderColor:'#38bdf8', justifyContent:'center', alignItems:'center' },
  slotBoxFilledBlue: { backgroundColor:'#1e3a8a', borderColor:'#38bdf8', borderStyle:'solid' },
  slotBoxFilledGreen: { backgroundColor:'#14532d', borderColor:'#4ade80', borderStyle:'solid' },
  slotBoxFilledRed: { backgroundColor:'#881337', borderColor:'#fb7185', borderStyle:'solid' },
  slotBoxFilledYellow: { backgroundColor:'#713f12', borderColor:'#facc15', borderStyle:'solid' },
  slotPlayerNameText: { color:'#ffffff', fontWeight:'bold', fontSize:11, maxWidth:85, textAlign:'center', marginTop:2 },
  slotRoleTagBlue: { color:'#38bdf8', fontSize:8, fontWeight:'900', marginTop:1 },
  slotRoleTagGreen: { color:'#4ade80', fontSize:8, fontWeight:'900', marginTop:1 },
  slotRoleTagRed: { color:'#fb7185', fontSize:8, fontWeight:'900', marginTop:1 },
  slotRoleTagYellow: { color:'#facc15', fontSize:8, fontWeight:'900', marginTop:1 },
  matchBottomActions: { width:'100%', alignItems:'center', marginBottom:6 },
  startMatchGoldBtn: { width:'90%', backgroundColor:'#eab308', borderWidth:1.5, borderColor:'#fef08a', borderRadius:14, paddingVertical:13, alignItems:'center', elevation:6 },
  startMatchGoldText: { color:'#000000', fontSize:15, fontWeight:'900', letterSpacing:1 },
  cancelMatchBtn: { marginTop:8, paddingVertical:4 },
  cancelMatchText: { color:'#fca5a5', fontWeight:'bold', fontSize:13 },
  inviteDetailsBox: { backgroundColor:'#0a0f1d', borderRadius:12, padding:12, marginVertical:12, alignItems:'center', borderWidth:1, borderColor:'#334155' },
  inviteRoomTag: { color:'#38bdf8', fontSize:14, fontWeight:'bold', marginTop:4 },
  inviteModeTag: { color:'#4ade80', fontSize:12, fontWeight:'800', marginTop:2 },
  brandHero: { alignItems:'center', marginTop:4 },
  crownEmoji: { fontSize:36, marginBottom:2 },
  brandGoldTitle: { fontSize:24, fontWeight:'900', color:'#facc15', letterSpacing:1.5, textAlign:'center' },
  goldPillBadge: { backgroundColor:'#78350f', borderColor:'#facc15', borderWidth:1, borderRadius:20, paddingHorizontal:12, paddingVertical:3, marginTop:4 },
  goldPillText: { color:'#fef08a', fontSize:10, fontWeight:'800', letterSpacing:1 },
  glassCard: { width:'100%', backgroundColor:'#131c31', borderRadius:20, padding:16, borderWidth:1.5, borderColor:'#1e293b', shadowColor:'#000', shadowOpacity:0.5, shadowRadius:15, elevation:8 },
  cardHeading: { fontSize:18, fontWeight:'bold', color:'#ffffff', textAlign:'center', marginBottom:14, letterSpacing:1 },
  inputLabel: { color:'#94a3b8', fontSize:12, fontWeight:'700', marginBottom:6, letterSpacing:0.5 },
  gameTextInput: { backgroundColor:'#0a0f1d', borderWidth:1.5, borderColor:'#334155', borderRadius:12, color:'#ffffff', paddingHorizontal:16, paddingVertical:12, fontSize:15, fontWeight:'600' },
  gold3DButton: { backgroundColor:'#eab308', borderColor:'#fef08a', borderWidth:1.5, borderRadius:14, paddingVertical:14, alignItems:'center', shadowColor:'#facc15', shadowOpacity:0.4, shadowRadius:8, elevation:6 },
  gold3DButtonText: { color:'#000000', fontSize:14, fontWeight:'900', letterSpacing:1 },
  forgotHeaderBox: { alignItems:'center', marginBottom:8 },
  forgotTitle: { color:'#facc15', fontSize:16, fontWeight:'bold' },
  forgotSubtitle: { color:'#94a3b8', fontSize:11, textAlign:'center', marginTop:2 },
  forgotLinkContainer: { alignSelf:'flex-end', marginTop:8, paddingVertical:4 },
  forgotLinkText: { color:'#38bdf8', fontSize:12, fontWeight:'bold' },
  orDivider: { flexDirection:'row', alignItems:'center', marginVertical:12 },
  dividerLine: { flex:1, height:1, backgroundColor:'#334155', marginVertical:6 },
  orText: { color:'#64748b', paddingHorizontal:12, fontSize:11, fontWeight:'bold' },
  darkSecondaryButton: { backgroundColor:'#1e293b', borderRadius:14, paddingVertical:12, alignItems:'center', borderWidth:1, borderColor:'#475569' },
  darkSecondaryButtonText: { color:'#cbd5e1', fontSize:13, fontWeight:'700' },
  tabToggleRow: { flexDirection:'row', backgroundColor:'#0a0f1d', borderRadius:12, padding:4, borderWidth:1, borderColor:'#334155' },
  tabToggleBtn: { flex:1, paddingVertical:10, alignItems:'center', borderRadius:8 },
  tabToggleActive: { backgroundColor:'#0284c7' },
  tabToggleText: { color:'#94a3b8', fontSize:11, fontWeight:'bold' },
  tabToggleTextActive: { color:'#ffffff' },
  playerCountRow: { flexDirection:'row', justifyContent:'space-between', marginVertical:8 },
  countPill: { flex:1, backgroundColor:'#0a0f1d', borderWidth:1.5, borderColor:'#334155', borderRadius:10, paddingVertical:10, alignItems:'center', marginHorizontal:4 },
  countPillActive: { borderColor:'#10b981', backgroundColor:'#064e3b' },
  countPillText: { color:'#94a3b8', fontWeight:'bold', fontSize:12 },
  countPillTextActive: { color:'#ffffff' },
  teamContainerBoxA: { backgroundColor:'rgba(2,132,199,0.12)', borderWidth:1.5, borderColor:'#0284c7', borderRadius:14, padding:10, marginBottom:4 },
  teamContainerBoxB: { backgroundColor:'rgba(225,29,72,0.12)', borderWidth:1.5, borderColor:'#e11d48', borderRadius:14, padding:10, marginTop:4 },
  teamHeaderRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:8, paddingHorizontal:4 },
  teamHeaderTitleA: { color:'#38bdf8', fontWeight:'900', fontSize:13, letterSpacing:0.5 },
  teamHeaderTitleB: { color:'#fb7185', fontWeight:'900', fontSize:13, letterSpacing:0.5 },
  teamBadgeA: { backgroundColor:'#0369a1', paddingHorizontal:8, paddingVertical:2, borderRadius:6 },
  teamBadgeB: { backgroundColor:'#9f1239', paddingHorizontal:8, paddingVertical:2, borderRadius:6 },
  teamBadgeText: { color:'#ffffff', fontSize:10, fontWeight:'bold' },
  vsContainer: { flexDirection:'row', alignItems:'center', justifyContent:'center', marginVertical:4 },
  vsLine: { flex:1, height:1, backgroundColor:'#334155' },
  vsCircle: { width:28, height:28, borderRadius:14, backgroundColor:'#f59e0b', justifyContent:'center', alignItems:'center', marginHorizontal:8 },
  vsText: { color:'#ffffff', fontWeight:'900', fontSize:11 },
  slotRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginVertical:4, backgroundColor:'#0a0f1d', padding:8, borderRadius:10, borderWidth:1, borderColor:'#334155' },
  slotColorText: { fontSize:13, fontWeight:'bold', width:65 },
  slotTypeSelector: { flexDirection:'row' },
  slotTypePill: { paddingHorizontal:8, paddingVertical:5, borderRadius:6, backgroundColor:'#1e293b', marginLeft:4 },
  slotTypePillActive: { backgroundColor:'#0284c7' },
  slotTypeText: { color:'#94a3b8', fontSize:11, fontWeight:'bold' },
  slotTypeTextActive: { color:'#ffffff' },
  slotSmallBadge: { color:'#facc15', fontSize:8, fontWeight:'bold', marginTop:1 },
  missCounterBadge: { color:'#ef4444', fontSize:9, fontWeight:'900', marginTop:1 },
  checkboxRow: { flexDirection:'row', alignItems:'center', backgroundColor:'#0a0f1d', padding:10, borderRadius:12, borderWidth:1, borderColor:'#334155' },
  checkSquare: { width:22, height:22, borderRadius:6, borderWidth:2, borderColor:'#64748b', justifyContent:'center', alignItems:'center' },
  checkSquareActive: { backgroundColor:'#ef4444', borderColor:'#ef4444' },
  checkTick: { color:'#ffffff', fontWeight:'900', fontSize:13 },
  checkboxLabel: { color:'#ffffff', fontSize:12, fontWeight:'bold' },
  helperTip: { color:'#94a3b8', fontSize:10, marginTop:4 },
  inviteModalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.85)', justifyContent:'center', alignItems:'center', padding:16 },
  invitePromptText: { color:'#ffffff', fontSize:16, textAlign:'center', marginBottom:6 },
  mainContainer: { flex:1, backgroundColor:'#0f2b5c', alignItems:'center', justifyContent:'space-between', paddingVertical:10 },
  inGameBgCover: { position:'absolute', top:0, bottom:0, left:0, right:0, width:'100%', height:'100%', opacity:0.38 },
  inGameBackdropShade: { position:'absolute', top:0, bottom:0, left:0, right:0, backgroundColor:'rgba(15,43,92,0.65)' },
  headerBar: { width:'94%', flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginVertical:4, zIndex:10 },
  exitBtn: { backgroundColor:'#ef4444', paddingHorizontal:12, paddingVertical:6, borderRadius:8, borderWidth:1.5, borderColor:'#ffffff' },
  exitBtnText: { color:'#ffffff', fontWeight:'bold', fontSize:13 },
  targetGapTimerBadge: { backgroundColor:'#0f172a', paddingHorizontal:6, paddingVertical:4, borderRadius:8, borderWidth:1.5, borderColor:'#38bdf8', alignItems:'center', justifyContent:'center', marginHorizontal:4 },
  targetGapTimerText: { color:'#ffffff', fontWeight:'900', fontSize:10 },
  timerDangerPulse: { borderColor:'#ef4444', backgroundColor:'#450a0a' },
  onlineGameActions: { flexDirection:'row', alignItems:'center' },
  inGameIconBtn: { width:36, height:36, borderRadius:18, justifyContent:'center', alignItems:'center', marginHorizontal:4, borderWidth:1.5 },
  micBtnActive: { backgroundColor:'#10b981', borderColor:'#6ee7b7' },
  micBtnInactive: { backgroundColor:'#334155', borderColor:'#64748b' },
  chatTriggerBtn: { backgroundColor:'#0284c7', borderColor:'#38bdf8', position:'relative' },
  chatBadgeDot: { position:'absolute', top:2, right:2, width:8, height:8, borderRadius:4, backgroundColor:'#facc15' },
  micActiveIndicator: { fontSize:10, position:'absolute', top:-4, right:-4 },
  chatModalBox: { width:'92%', height:'65%', padding:12, justifyContent:'space-between' },
  chatHeaderRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderBottomWidth:1, borderBottomColor:'#334155', paddingBottom:8 },
  chatTitleText: { color:'#facc15', fontWeight:'900', fontSize:15 },
  closeChatBtn: { padding:4 },
  closeChatText: { color:'#ffffff', fontSize:16, fontWeight:'bold' },
  chatListFeed: { flex:1, width:'100%' },
  chatBubbleRow: { width:'100%', marginVertical:3, flexDirection:'row' },
  chatBubbleLeft: { justifyContent:'flex-start' },
  chatBubbleRight: { justifyContent:'flex-end' },
  chatMessageBubble: { maxWidth:'78%', paddingHorizontal:10, paddingVertical:6, borderRadius:12 },
  chatBubbleMe: { backgroundColor:'#0284c7' },
  chatBubbleOpponent: { backgroundColor:'#334155' },
  chatSenderName: { fontSize:10, fontWeight:'bold', marginBottom:2 },
  chatMessageText: { color:'#ffffff', fontSize:13, fontWeight:'600' },
  chatTimeText: { color:'#cbd5e1', fontSize:8, alignSelf:'flex-end', marginTop:2 },
  noChatText: { color:'#64748b', textAlign:'center', fontSize:12, marginTop:20 },
  quickEmojiRow: { flexDirection:'row', justifyContent:'space-around', paddingVertical:6, borderTopWidth:1, borderTopColor:'#1e293b' },
  emojiCircleBtn: { padding:4, backgroundColor:'#1e293b', borderRadius:8 },
  chatInputWrap: { flexDirection:'row', alignItems:'center', marginTop:4 },
  chatTextInputField: { flex:1, backgroundColor:'#0a0f1d', borderWidth:1, borderColor:'#334155', borderRadius:10, color:'#ffffff', paddingHorizontal:12, paddingVertical:8, fontSize:13 },
  sendChatBtn: { backgroundColor:'#eab308', borderRadius:10, paddingHorizontal:12, paddingVertical:9, marginLeft:6 },
  sendChatBtnText: { color:'#000000', fontWeight:'900', fontSize:12 },
  topCardsRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', width:BOARD_SIZE, paddingHorizontal:4, minHeight:60 },
  bottomCardsRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', width:BOARD_SIZE, paddingHorizontal:4, minHeight:60 },
  cardContainerWrapper: { width:'46%', alignItems:'center' },
  playerCardPlaceholder: { width:'46%' },
  playerCard: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:'rgba(15,23,42,0.85)', paddingHorizontal:8, paddingVertical:6, borderRadius:12, borderWidth:1.5, borderColor:'#38bdf8', width:'100%' },
  activeCardGlow: { borderColor:'#facc15', backgroundColor:'rgba(30,58,138,0.9)', elevation:8, shadowColor:'#facc15', shadowOpacity:0.6, shadowRadius:10 },
  cardAvatarLeft: { flexDirection:'column', alignItems:'center', width:35 },
  cardAvatarRight: { flexDirection:'column', alignItems:'center', width:35 },
  cardDiceWrap: { padding:2 },
  floatingArrowContainer: { position:'absolute', alignSelf:'center', zIndex:30 },
  arrowTopPos: { top:-24 },
  arrowIconBubble: { backgroundColor:'#f59e0b', paddingHorizontal:8, paddingVertical:2, borderRadius:6, borderWidth:1.5, borderColor:'#ffffff', elevation:6 },
  arrowIconText: { color:'#ffffff', fontWeight:'900', fontSize:14 },
  diceBox: { width:42, height:42, backgroundColor:'#ffffff', borderRadius:8, borderWidth:2, borderColor:'#cbd5e1', justifyContent:'center', alignItems:'center', padding:3 },
  diceDot: { width:6.5, height:6.5, borderRadius:3.25, backgroundColor:'#0f172a', margin:1.5 },
  diceCenter: { justifyContent:'center', alignItems:'center' },
  diceRowSpace: { flexDirection:'row', justifyContent:'space-between', width:'100%', paddingHorizontal:2 },
  diceCol: { justifyContent:'space-between' },
  pinWrapper: { alignItems:'center', width:24, height:32, justifyContent:'center' },
  pinPedestalRing: { width:24, height:24, borderRadius:12, borderWidth:2.5, backgroundColor:'rgba(255,255,255,0.95)', justifyContent:'center', alignItems:'center', elevation:5 },
  pinHeadCircle: { width:15, height:15, borderRadius:7.5, justifyContent:'center', alignItems:'center' },
  pinWhiteInnerCore: { width:8, height:8, borderRadius:4, backgroundColor:'#ffffff', justifyContent:'center', alignItems:'center' },
  pinDotCenter: { width:4, height:4, borderRadius:2 },
  pinBottomPoint: { position:'absolute', bottom:-5, width:0, height:0, borderLeftWidth:3.5, borderRightWidth:3.5, borderTopWidth:5.5, borderLeftColor:'transparent', borderRightColor:'transparent' },
  stackBadgeBubble: { position:'absolute', top:-10, alignSelf:'center', backgroundColor:'#facc15', borderRadius:8, width:15, height:15, justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:'#000000', zIndex:30 },
  stackBadgeText: { color:'#000000', fontSize:9, fontWeight:'900' },
  boardContainer: { width:BOARD_SIZE, height:BOARD_SIZE, backgroundColor:'#ffffff', borderWidth:2, borderColor:'#334155', borderRadius:6, overflow:'hidden', elevation:12, shadowColor:'#000', shadowOpacity:0.4, shadowRadius:8 },
  board: { width:'100%', height:'100%', position:'relative', backgroundColor:'#ffffff' },
  cell: { position:'absolute', width:CELL_SIZE, height:CELL_SIZE, borderWidth:0.6, borderColor:'#94a3b8', justifyContent:'center', alignItems:'center' },
  starCleanText: { fontSize:18, color:'#334155', fontWeight:'bold' },
  arrowCleanText: { fontSize:15, fontWeight:'900' },
  base: { position:'absolute', width:CELL_SIZE * 6, height:CELL_SIZE * 6, justifyContent:'center', alignItems:'center', padding:8 },
  redBase: { top:0, left:0, backgroundColor:'#ef4444' },
  greenBase: { top:0, right:0, backgroundColor:'#16a34a' },
  blueBase: { bottom:0, left:0, backgroundColor:'#2563eb' },
  yellowBase: { bottom:0, right:0, backgroundColor:'#eab308' },
  baseInnerWhite: { width:'80%', height:'80%', backgroundColor:'#ffffff', borderRadius:6, justifyContent:'space-around', padding:8, borderWidth:1, borderColor:'#cbd5e1' },
  pocketRow: { flexDirection:'row', justifyContent:'space-around' },
  basePocket: { width:26, height:26, borderRadius:13 },
  playerLabel: { position:'absolute', fontSize:11, fontWeight:'900', color:'#ffffff', textShadowColor:'rgba(0,0,0,0.8)', textShadowRadius:3 },
  playerLabelHorizontal: { bottom:4 },
  playerLabelRotated: {
  left: 0,
  right: 0,
  top: 4,
  textAlign: 'center',
},
  centerHome: { position:'absolute', top:CELL_SIZE * 6, left:CELL_SIZE * 6, width:CELL_SIZE * 3, height:CELL_SIZE * 3, overflow:'hidden' },
  centerTriangleTop: { position:'absolute', top:0, left:0, width:0, height:0, borderLeftWidth:(CELL_SIZE * 3) / 2, borderRightWidth:(CELL_SIZE * 3) / 2, borderTopWidth:(CELL_SIZE * 3) / 2, borderLeftColor:'transparent', borderRightColor:'transparent', borderTopColor:'#16a34a' },
  centerTriangleRight: { position:'absolute', top:0, right:0, width:0, height:0, borderTopWidth:(CELL_SIZE * 3) / 2, borderBottomWidth:(CELL_SIZE * 3) / 2, borderRightWidth:(CELL_SIZE * 3) / 2, borderTopColor:'transparent', borderBottomColor:'transparent', borderRightColor:'#eab308' },
  centerTriangleBottom: { position:'absolute', bottom:0, left:0, width:0, height:0, borderLeftWidth:(CELL_SIZE * 3) / 2, borderRightWidth:(CELL_SIZE * 3) / 2, borderBottomWidth:(CELL_SIZE * 3) / 2, borderLeftColor:'transparent', borderRightColor:'transparent', borderBottomColor:'#2563eb' },
  centerTriangleLeft: { position:'absolute', top:0, left:0, width:0, height:0, borderTopWidth:(CELL_SIZE * 3) / 2, borderBottomWidth:(CELL_SIZE * 3) / 2, borderLeftWidth:(CELL_SIZE * 3) / 2, borderTopColor:'transparent', borderBottomColor:'transparent', borderLeftColor:'#ef4444' },
  tokenWrapper: { position:'absolute', width:CELL_SIZE, height:CELL_SIZE, justifyContent:'center', alignItems:'center' },
});
