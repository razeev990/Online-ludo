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
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType
} from 'react-native-agora';
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

// ==========================================
// FIXED BASE SPOTS FOR PERFECT 4-CORNER ALIGNMENT
// ==========================================
const BASE_SPOTS = {
  BLUE: [[10.5, 2.0], [10.5, 4.0], [12.5, 2.0], [12.5, 4.0]],
  RED: [[2.0, 2.0], [2.0, 4.0], [4.0, 2.0], [4.0, 4.0]],
  GREEN: [[2.0, 11.0], [2.0, 13.0], [4.0, 11.0], [4.0, 13.0]],
  YELLOW: [[10.5, 11.0], [10.5, 13.0], [12.5, 11.0], [12.5, 13.0]]
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
const getPlayerLabelPositionStyle = (color, myColor) => {
  const perspective = getPerspectiveLayout(myColor);
  if (
    color === perspective.topColor ||
    color === perspective.leftColor
  ) {
    return 'playerLabelTop';
  }
  return 'playerLabelBottom';
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
    </View>
  </View>
);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
  const [dailyBonusModal, setDailyBonusModal] = useState(false);
  const [dailyBonusClaimed, setDailyBonusClaimed] = useState(false);
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
  const playerDicesRef = useRef({ BLUE:1, RED:3, GREEN:6, YELLOW:2 });
  const updatePlayerDice = (color, value) => {
    setPlayerDices(prev => {
      const next = { ...prev, [color]: value };
      playerDicesRef.current = next;
      return next;
    });
  };
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

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (avatarModal) { setAvatarModal(false); return true; }
      if (chatModal) { setChatModal(false); return true; }
      if (dailyBonusModal) { setDailyBonusModal(false); return true; }
      if (leaderboardModal) { setLeaderboardModal(false); return true; }
      if (profileStatsModal) { setProfileStatsModal(false); return true; }
      if (friendsModal) { setFriendsModal(false); return true; }
      if (onlineLobbyModal) { setOnlineLobbyModal(false); return true; }
      if (botSelectModal) { setBotSelectModal(false); return true; }
      if (passPlayModal) { setPassPlayModal(false); return true; }
      if (hybridTeamModal) { setHybridTeamModal(false); return true; }
      if (onlineScreen) { setOnlineScreen(false); return true; }
      if (showPodiumBoard) { setShowPodiumBoard(false); return true; }
      if (settingsModal) { setSettingsModal(false); return true; }
      if (incomingInvite) { setIncomingInvite(null); return true; }

      if (gameMode) {
        Alert.alert(
          'Exit Game',
          'Return to Main Lobby?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Quit Match',
              style: 'destructive',
              onPress: () => {
                if (
                  (gameMode === 'ONLINE' || gameMode === 'HYBRID') &&
                  ws.current &&
                  ws.current.readyState === WebSocket.OPEN
                ) {
                  ws.current.send(
                    JSON.stringify({
                      topic: `realtime:room_${roomCode}`,
                      event: 'broadcast',
                      payload: {
                        type: 'PLAYER_LEFT_MATCH',
                        data: { color: myColor, name: currentUser?.name },
                      },
                      ref: 'exit_match',
                    })
                  );
                }
                resetGame();
              },
            },
          ]
        );
        return true;
      }

      Alert.alert(
        'Exit App',
        'Are you sure you want to exit?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Exit', style: 'destructive', onPress: () => BackHandler.exitApp() },
        ]
      );
      return true;
    });

    return () => backHandler.remove();
  }, [
    avatarModal, chatModal, dailyBonusModal, leaderboardModal, profileStatsModal,
    friendsModal, onlineLobbyModal, botSelectModal, passPlayModal, hybridTeamModal,
    onlineScreen, showPodiumBoard, settingsModal, incomingInvite, gameMode
  ]);

  const initializeAgoraVoice = async () => {
    try {
      if (agoraEngine.current) return true;
      const engine = createAgoraRtcEngine();
      agoraEngine.current = engine;
      engine.initialize({
        appId: AGORA_APP_ID,
        channelProfile: ChannelProfileType.ChannelProfileCommunication,
      });
      engine.enableAudio();
      return true;
    } catch (error) {
      console.warn('Agora initialization error:', error);
      agoraEngine.current = null;
      return false;
    }
  };

  const currentTurn = activeColors[turnIndex] || activeColors[0] || 'BLUE';
  
  useEffect(() => {
    if (!gameMode || showPodiumBoard) return;
    if (hasRolled || isMoving || isRolling) return;
    setTurnTimeLeft(30);
    const timer = setInterval(() => {
      setTurnTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeout(() => {
            handleTimeoutMiss();
          }, 300);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [turnIndex, gameMode, showPodiumBoard, hasRolled, isMoving, isRolling]);
  
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
          coins: Number(userObj.coins || 2000),
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
          coins: 2000,
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
          Alert.alert('Error', 'Could not create account.');
          return;
        }

        await AsyncStorage.setItem('@ludo_supreme_user', JSON.stringify(newUser));
        setCurrentUser(newUser);
        Alert.alert('Success', 'Account created successfully!');
        return;
      }

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
      coins: 2000,
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

  const joinAgoraVoiceChannel = async () => {
    try {
      const roomId = roomCodeRef.current;
      if (!roomId) return false;
      const initialized = await initializeAgoraVoice();
      if (!initialized || !agoraEngine.current) return false;
      await agoraEngine.current.joinChannel(
        null,
        `ludo_${roomId}`,
        0,
        {
          clientRoleType: ClientRoleType.ClientRoleBroadcaster,
          channelProfile: ChannelProfileType.ChannelProfileCommunication,
        }
      );
      await agoraEngine.current.muteLocalAudioStream(!isMicOn);
      return true;
    } catch (error) {
      console.warn('Error joining Agora voice channel:', error);
      return false;
    }
  };

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

  const claimDailyBonus = async () => {
    if (!currentUserRef.current?.playerId) return;
    const playerId = currentUserRef.current.playerId;
    const bonusKey = `@ludo_daily_bonus_${playerId}`;
    const today = new Date().toDateString();

    try {
      const lastClaimDate = await AsyncStorage.getItem(bonusKey);
      if (lastClaimDate === today) {
        setDailyBonusClaimed(true);
        Alert.alert('Daily Bonus Already Claimed', '🎁 Aaj ka Daily Bonus already claim ho chuka hai.');
        return;
      }
      const reward = 200;
      const updatedUser = {
        ...currentUserRef.current,
        coins: Number(currentUserRef.current.coins || 0) + reward
      };
      currentUserRef.current = updatedUser;
      setCurrentUser(updatedUser);
      await AsyncStorage.setItem('@ludo_supreme_user', JSON.stringify(updatedUser));
      await AsyncStorage.setItem(bonusKey, today);
      setDailyBonusClaimed(true);
      await syncUserCoinsToCloud(updatedUser.playerId, updatedUser.coins);
      Alert.alert('🎉 Daily Bonus Claimed!', `🪙 ${reward} Coins added!`);
    } catch (error) {
      console.log('Daily Bonus Error:', error);
    }
  };

  const loadGlobalLeaderboard = async () => {
    try {
      const response = await fetch(
        `${SUPABASE_REST_URL}/ludo_users?select=player_id,name,coins&order=coins.desc`,
        { headers: supabaseHeaders }
      );
      if (!response.ok) return;
      const data = await response.json();
      if (Array.isArray(data)) {
        setCloudLeaderboardData([...data].sort((a, b) => Number(b.coins || 0) - Number(a.coins || 0)));
      }
    } catch (error) {
      console.log('Leaderboard error:', error);
    }
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
    if (!validMoves || validMoves.length === 0) return null;
    if (validMoves.length === 1) return validMoves[0];

    const playerPawns = pawnsRef.current[color];

    const getEnemyThreat = (targetTrack, movingColor) => {
      let threatScore = 0;
      for (const enemy of activeColorsRef.current) {
        if (enemy === movingColor) continue;
        if (isTeammate(movingColor, enemy)) continue;
        for (const enemyStep of pawnsRef.current[enemy]) {
          if (enemyStep < 0 || enemyStep >= 51) continue;
          const enemyTrack = (START_INDEX[enemy] + enemyStep) % 52;
          const distance = (targetTrack - enemyTrack + 52) % 52;
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
          const enemyTrack = (START_INDEX[enemy] + enemyStep) % 52;
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
      const targetStep = currentStep === -1 ? 0 : currentStep + diceVal;
      let score = 0;

      if (targetStep === 56) score += 15000;
      if (targetStep >= 51 && targetStep < 56) {
        score += 7000;
        score += targetStep * 80;
      }

      if (targetStep >= 0 && targetStep < 51) {
        const targetTrack = (START_INDEX[color] + targetStep) % 52;
        score += canCaptureEnemy(targetTrack, color);

        if (SAFE_INDEXES.includes(targetTrack)) {
          score += 3500;
        } else {
          const danger = getEnemyThreat(targetTrack, color);
          score -= danger;
        }

        if (currentStep >= 0 && currentStep < 51) {
          const currentTrack = (START_INDEX[color] + currentStep) % 52;
          if (!SAFE_INDEXES.includes(currentTrack)) {
            const currentDanger = getEnemyThreat(currentTrack, color);
            const targetDanger = SAFE_INDEXES.includes(targetTrack) ? 0 : getEnemyThreat(targetTrack, color);
            if (currentDanger > targetDanger) {
              score += Math.min(currentDanger - targetDanger, 5000);
            }
          }
        }
        score += targetStep * 35;
      }

      if (diceVal === 6 && currentStep === -1) {
        const activePawnCount = playerPawns.filter(step => step >= 0 && step < 56).length;
        if (activePawnCount < 2) score += 2800;
        else if (activePawnCount < 3) score += 1400;
      }

      if (currentStep >= 35 && currentStep < 51) score += 1000;
      score += Math.random() * 10;

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

    if (newMissCount >= 3) {
      const remainingColors = activeColors.filter(color => color !== timedOutColor);

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
        updateUserGameStats(winnerColor === myColorRef.current);

        Alert.alert('PLAYER EXITED', `${getBaseDynamicLabel(timedOutColor)} missed 3 turns and was removed.`);
        sendMultiplayerSync(pawnsRef.current, 0, playerDices, false, finalRankings);
        return;
      }

      const nextIdx = turnIndex % remainingColors.length;
      setActiveColors(remainingColors);
      setTurnIndex(nextIdx);
      setHasRolled(false);
      setIsMoving(false);
      setIsRolling(false);
      setTurnTimeLeft(30);

      Alert.alert('PLAYER EXITED', `${getBaseDynamicLabel(timedOutColor)} removed due to timeout.`);
      sendMultiplayerSync(pawnsRef.current, nextIdx, playerDices, false);
      return;
    }

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
      if (gameMode === 'HYBRID' && playerSlots[currentTurn] === 'BOT') return;
    }

    setIsRolling(true);
    playSound('dice');
    spinAnim.setValue(0);
    diceBounceAnim.setValue(1);

    Animated.parallel([
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 650,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false
      }),
      Animated.sequence([
        Animated.timing(diceBounceAnim, { toValue: 1.35, duration: 180, useNativeDriver: false }),
        Animated.timing(diceBounceAnim, { toValue: 0.85, duration: 180, useNativeDriver: false }),
        Animated.timing(diceBounceAnim, { toValue: 1, duration: 290, useNativeDriver: false }),
      ])
    ]).start();

    const lockedFinalVal = Math.floor(Math.random() * 6) + 1;
    const shuffleSteps = [50, 70, 90, 110];
    for (let i = 0; i < shuffleSteps.length; i++) {
      const rand = (i === shuffleSteps.length - 1) ? lockedFinalVal : Math.floor(Math.random() * 6) + 1;
      updatePlayerDice(currentTurn, rand);
      await sleep(shuffleSteps[i]);
    }

    updatePlayerDice(currentTurn, lockedFinalVal);
    await sleep(200);

    setIsRolling(false);
    setHasRolled(true);

    const newDices = { ...playerDicesRef.current, [currentTurn]: lockedFinalVal };
    playerDicesRef.current = newDices;

    const validMoves = getValidMoves(currentTurn, lockedFinalVal);

    if (validMoves.length === 0) {
      setTimeout(() => {
        const nextIdx = nextTurn();
        sendMultiplayerSync(pawnsRef.current, nextIdx, newDices, false);
      }, 700);
    } else if (isBot || isAutoTimeout || validMoves.length === 1) {
      const bestMove = getStrategicMoveIndex(currentTurn, lockedFinalVal, validMoves);
      setTimeout(() => executeStepMovement(currentTurn, bestMove, lockedFinalVal, newDices), 400);
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
      Alert.alert('VICTORY!', `${getBaseDynamicLabel(color)} secured placement!`);
    }

    const activeRemaining = activeColors.filter((c) => !currentFinished.includes(c));

    if (activeRemaining.length <= 1 && currentFinished.length > 0) {
      if (activeRemaining.length === 1) currentFinished.push(activeRemaining[0]);
      setFinishedRankings(currentFinished);
      setShowPodiumBoard(true);
      setPawns(updatedPawns);
      setIsMoving(false);

      if (currentFinished[0] === myColorRef.current) addWinnerCoins(matchPrizePool);
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
          data: { newPawns, nextTurnIdx, updatedDices, rolled, rankings, syncedColors: activeColors, syncedPlayType: playType, senderId: currentUserRef.current?.playerId || null }
        },
        ref: '2'
      }));
    }
  };

  // ==========================================
  // UPDATED WEBSOCKET WITH EXPONENTIAL BACKOFF
  // ==========================================
  useEffect(() => {
    if (!roomCode) return;

    let reconnectTimer = null;
    let isConnecting = false;
    let reconnectAttempts = 0;
    const maxReconnectDelay = 30000;

    const connectWebSocket = () => {
      if (isConnecting || (ws.current && ws.current.readyState === WebSocket.OPEN)) return;
      isConnecting = true;

      const wsUrl = `wss://${SUPABASE_PROJECT_REF}.supabase.co/realtime/v1/websocket?apikey=${SUPABASE_ANON_KEY}&vsn=1.0.0`;
      const socket = new WebSocket(wsUrl);
      ws.current = socket;

      socket.onopen = () => {
        isConnecting = false;
        reconnectAttempts = 0;
        console.log('WebSocket Connected Successfully');

        socket.send(JSON.stringify({
          topic: `realtime:room_${roomCode}`,
          event: 'phx_join',
          payload: {},
          ref: 'room_join_ref'
        }));

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
        } else if (!isHostRef.current && currentUserRef.current) {
          socket.send(JSON.stringify({
            topic: `realtime:room_${roomCode}`,
            event: 'broadcast',
            payload: {
              type: 'CHECK_ROOM_EXISTS',
              data: { guestId: currentUserRef.current.playerId }
            },
            ref: 'chk_req_guest_reconnect'
          }));
        }
      };

      socket.onclose = () => {
        isConnecting = false;
        console.log('WebSocket Disconnected.');

        if (reconnectTimer) clearTimeout(reconnectTimer);

        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), maxReconnectDelay);
        reconnectAttempts++;

        console.log(`Reconnecting in ${delay / 1000} seconds (Attempt ${reconnectAttempts})...`);

        reconnectTimer = setTimeout(() => {
          if (roomCodeRef.current) {
            connectWebSocket();
          }
        }, delay);
      };

      socket.onerror = (error) => {
        console.log('WebSocket Error:', error);
        socket.close();
      };

      socket.onmessage = async (e) => {
        try {
          const message = JSON.parse(e.data);
          if (message.event !== 'broadcast') return;

          const type = message.payload?.type;
          const data = message.payload?.data;

          if (type === 'CHECK_ROOM_EXISTS') {
            if (!isHostRef.current || !currentUserRef.current) return;

            const occupied = new Set([...Object.keys(roomPlayersRef.current), myColorRef.current]);
            const active = activeColorsRef.current || [];
            const slots = playerSlotsRef.current || {};
            const preferredOrder = playTypeRef.current === 'TEAM' ? ['GREEN', 'RED', 'YELLOW', 'BLUE'] : active;
            const available = preferredOrder.filter(
              color => active.includes(color) && slots[color] === 'ONLINE' && !occupied.has(color)
            );
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

            const currentRoster = roomPlayersRef.current || {};
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
                  syncedRoomPlayers: currentRoster,
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
              Alert.alert('Opponent Left', `${leftName} left. You won!`);
              setShowPodiumBoard(true);
              setFinishedRankings([myColorRef.current, leftColor]);
              if (myColorRef.current === activeColorsRef.current.find(c => c !== leftColor)) {
                addWinnerCoins(matchPrizePool);
              }
              updateUserGameStats(true);
            } else {
              const remainingActive = activeColorsRef.current.filter(c => c !== leftColor);
              setActiveColors(remainingActive);
              Alert.alert('Player Disconnected', `${leftName} left.`);
              if (currentTurn === leftColor) {
                const nextIdx = nextTurn();
                sendMultiplayerSync(pawnsRef.current, nextIdx, playerDicesRef.current, false);
              }
            }
          }
          else if (type === 'START_MATCH') {
            if (!isHostRef.current) await deductUserCoins(data.entryFee || 50);
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
            joinAgoraVoiceChannel();
          }
          else if (type === 'SYNC_GAME') {
            if (data.senderId && data.senderId === currentUserRef.current?.playerId) return;

            setOnlineLobbyModal(false);
            setGameMode((current) => current || (playType === 'TEAM' ? 'HYBRID' : 'ONLINE'));
            if (data.newPawns) setPawns(data.newPawns);
            if (data.nextTurnIdx !== undefined) setTurnIndex(data.nextTurnIdx);
            if (data.updatedDices) {
              playerDicesRef.current = data.updatedDices;
              setPlayerDices(data.updatedDices);
            }
            if (data.rolled !== undefined) setHasRolled(data.rolled);
            if (data.syncedColors) setActiveColors(data.syncedColors);
            if (data.syncedPlayType) setPlayType(data.syncedPlayType);
            if (data.rankings && data.rankings.length > 0) {
              setFinishedRankings(data.rankings);
              setShowPodiumBoard(true);
              if (data.rankings[0] === myColorRef.current) addWinnerCoins(matchPrizePool);
              updateUserGameStats(data.rankings[0] === myColorRef.current);
            }
          }
        } catch (err) {
          console.log('WebSocket message error:', err);
        }
      };
    };

    connectWebSocket();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws.current) ws.current.close();
    };
  }, [roomCode]);

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
          if (data.syncedPlayerSlots) {
            playerSlotsRef.current = data.syncedPlayerSlots;
            setPlayerSlots(data.syncedPlayerSlots);
          }
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
      Alert.alert('Invalid Code', 'Please enter a valid room code');
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
          if (data.syncedPlayerSlots) {
            playerSlotsRef.current = data.syncedPlayerSlots;
            setPlayerSlots(data.syncedPlayerSlots);
          }
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
        Alert.alert('Room Not Found', 'No active team host found.');
      }
    }, 4500);
  };

  const startOnlineHost = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setRoomCode(code);
    setMyColor('BLUE');
    myColorRef.current = 'BLUE';
    setIsHost(true);
    const initialSlots = { BLUE:'LOCAL', GREEN:'ONLINE', RED:'ONLINE', YELLOW:'ONLINE' };
    playerSlotsRef.current = initialSlots;
    setPlayerSlots(initialSlots);
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

  useEffect(() => {
    const isNormalBotTurn = gameMode === 'BOT' && currentTurn !== 'BLUE';
    const isHybridBotTurn = gameMode === 'HYBRID' && playerSlots[currentTurn] === 'BOT';

    if (!isNormalBotTurn && !isHybridBotTurn) return;
    if (hasRolled || isMoving || isRolling || showPodiumBoard) return;

    const botTimer = setTimeout(() => {
      rollDice(true);
    }, 800);

    return () => clearTimeout(botTimer);
  }, [gameMode, currentTurn, turnIndex, playerSlots, hasRolled, isMoving, isRolling, showPodiumBoard]);

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
      Alert.alert('Local Player Required', 'At least 1 player slot must remain set to Local.');
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
    if (!isHost) { Alert.alert('Permission Denied', 'Only Host can start!'); return; }
    const currentReady = getEffectiveReadyCount();
    if (currentReady < activeColors.length) {
      Alert.alert('Waiting for Players', `Waiting for players (${currentReady}/${activeColors.length}).`);
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
        payload: { 
          type: 'START_MATCH', 
          data: { 
            activeColors, 
            playType, 
            syncedRoomPlayers: roomPlayersRef.current,
            entryFee: selectedEntryFee, 
            prizePool: totalPool, 
            playerSlots: playerSlotsRef.current 
          } 
        },
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

  const copyMyPlayerId = async () => {
    if (!currentUser?.playerId) return;
    await Clipboard.setStringAsync(currentUser.playerId);
    Alert.alert('Copied!', `ID #${currentUser.playerId} copied.`);
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
        'Pay 500 coins to unlock online voice chat.',
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
      if (agoraEngine.current) await agoraEngine.current.muteLocalAudioStream(!nextState);
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
        {arrowIcon !== '' && <Text style={[styles.arrowCleanText, { color: arrowColor }]}>{arrowIcon}</Text>}
      </View>
    );
  };

  const renderBase = (color, posStyle, isVertical) => {
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
      </View>
    );
  };

  const renderAllTokens = () => {
    const cellGroups = {};

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
        const finalTop = coords[0] * CELL_SIZE  + offsetY;

        rendered.push(
          <TouchableOpacity
            key={`${color}-${idx}`}
            disabled={!hasRolled || !isMyTurn || isMoving}
            onPress={() => executeStepMovement(color, idx, playerDices[color])}
            style={[
              styles.tokenWrapper,
              { left: finalLeft, top: finalTop, zIndex: isMyTurn ? 25 : 10 + idx },
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
    const playerName = getBaseDynamicLabel(color);

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
          <View style={styles.cardRow}>
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
          </View>
          <View style={styles.cardNameRow}>
            <Text style={styles.cardPlayerName} numberOfLines={1}>{playerName}</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
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
              <TextInput style={styles.gameTextInput} placeholder="e.g. Master" placeholderTextColor="#64748b" value={usernameInput} onChangeText={setUsernameInput} />
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
            <TouchableOpacity activeOpacity={0.85} style={[styles.gold3DButton, { marginTop: 14 }]} onPress={() => {
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
            <TextInput style={[styles.gameTextInput, { textAlign: 'center', fontSize: 18, letterSpacing: 4, marginTop: 10 }]} placeholder="ROOM CODE" placeholderTextColor="#64748b" keyboardType="number-pad" maxLength={6} value={teamJoinCode} onChangeText={setTeamJoinCode} />
            <TouchableOpacity activeOpacity={0.85} disabled={isVerifyingRoom} style={[styles.gold3DButton, { marginTop: 10, backgroundColor: '#0284c7', borderColor: '#38bdf8' }]} onPress={() => joinTeamOnlineRoom()}>
              {isVerifyingRoom ? <ActivityIndicator color="#ffffff" size="small" /> : <Text style={styles.gold3DButtonText}>🚪 JOIN TEAM ROOM</Text>}
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
            <TouchableOpacity activeOpacity={0.85} style={[styles.gold3DButton, { marginTop: 12 }]} onPress={startOnlineHost}>
              <Text style={styles.gold3DButtonText}>➕ CREATE PRIVATE ROOM</Text>
            </TouchableOpacity>
            <TextInput style={[styles.gameTextInput, { textAlign: 'center', fontSize: 18, letterSpacing: 4, marginTop: 10 }]} placeholder="ROOM CODE" placeholderTextColor="#64748b" keyboardType="number-pad" maxLength={6} value={inputRoomCode} onChangeText={setInputRoomCode} />
            <TouchableOpacity activeOpacity={0.85} disabled={isVerifyingRoom} style={[styles.gold3DButton, { marginTop: 10, backgroundColor: '#0284c7', borderColor: '#38bdf8' }]} onPress={() => joinOnlineRoom()}>
              {isVerifyingRoom ? <ActivityIndicator color="#ffffff" size="small" /> : <Text style={styles.gold3DButtonText}>🚪 JOIN ROOM</Text>}
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} style={[styles.darkSecondaryButton, { marginTop: 10 }]} onPress={() => setOnlineScreen(false)}>
              <Text style={styles.darkSecondaryButtonText}>⬅ Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (onlineLobbyModal) {
    const isTeamMode = playType === 'TEAM';
    const opponentColors = activeColors.filter(c => c !== 'BLUE');
    const totalPotentialPool = selectedEntryFee * activeColors.length;
    const currentReady = getEffectiveReadyCount();
    const isRoomFull = currentReady === activeColors.length;

    const renderTeamSlot = (col, badgeStyle, borderStyle) => {
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
            <Text style={styles.slotPlayerNameText} numberOfLines={1}>{isMeControlling ? currentUser.name : `Local`}</Text>
            <Text style={styles.slotRoleTagGreen}>LOCAL</Text>
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
        <View style={styles.matchLobbyHeader}>
          <Text style={styles.matchLobbyTitle}>ONLINE MULTIPLAYER</Text>
          <Text style={styles.matchFormatSub}>{isTeamMode ? '🤝 2v2 TEAM' : `👤 ${activeColors.length} PLAYERS`}</Text>
        </View>
        <View style={styles.matchCodeCard}>
          <Text style={styles.matchCodeLabel}>Room Code : </Text>
          <View style={styles.codePillBox}><Text style={styles.codePillText}>{roomCode}</Text></View>
          <TouchableOpacity activeOpacity={0.7} style={styles.shareCodeBtn} onPress={handleCopyAndShareRoomCode}>
            <Text style={styles.shareCodeText}>📋 Copy</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.prizePoolBadgeLobby}>
          <Text style={styles.prizePoolBadgeLobbyText}>🪙 Prize Pool: {totalPotentialPool.toLocaleString()}</Text>
        </View>
        {isTeamMode ? (
          <View style={styles.teamMatchLobbyWrap}>
            <View style={styles.teamLobbyBoxA}>
              <Text style={styles.teamLobbyTitleA}>🛡️ TEAM A</Text>
              <View style={styles.teamSlotsRow}>
                {renderTeamSlot('BLUE', styles.slotBoxFilledBlue, styles.slotBoxFilledBlue)}
                {renderTeamSlot('GREEN', styles.slotBoxFilledGreen, styles.slotBoxFilledGreen)}
              </View>
            </View>
            <View style={styles.vsGlowBanner}><Text style={styles.vsGlowText}>⚡ VS ⚡</Text></View>
            <View style={styles.teamLobbyBoxB}>
              <Text style={styles.teamLobbyTitleB}>⚔️ TEAM B</Text>
              <View style={styles.teamSlotsRow}>
                {renderTeamSlot('RED', styles.slotBoxFilledRed, styles.slotBoxFilledRed)}
                {renderTeamSlot('YELLOW', styles.slotBoxFilledYellow, styles.slotBoxFilledYellow)}
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.soloMatchLobbyWrap}>
            <View style={styles.hostProfileBox}>
              <View style={styles.hostAvatarSquare}><Text style={{ fontSize: 44 }}>{userAvatar}</Text></View>
              <Text style={styles.hostNameText}>{currentUser.name}</Text>
            </View>
            <View style={styles.vsGlowBanner}><Text style={styles.vsGlowText}>⚡ VS ⚡</Text></View>
            <View style={styles.opponentSlotsRow}>
              {opponentColors.map((colorKey) => {
                const playerJoined = roomPlayers[colorKey];
                return (
                  <TouchableOpacity key={colorKey} activeOpacity={0.8} style={[styles.slotInviteBox, playerJoined && { borderColor: getTurnColorHex(colorKey) }]} onPress={() => !playerJoined && setFriendsModal(true)}>
                    {playerJoined ? (
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 30 }}>{playerJoined.avatar || '🎮'}</Text>
                        <Text style={styles.joinedSlotName} numberOfLines={1}>{playerJoined.name}</Text>
                      </View>
                    ) : (
                      <View style={{ alignItems: 'center' }}>
                        <Text style={styles.plusAvatarIcon}>👤+</Text>
                        <Text style={styles.inviteSlotLabel}>Invite</Text>
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
            <TouchableOpacity activeOpacity={0.85} disabled={!isRoomFull} style={[styles.startMatchGoldBtn, !isRoomFull && { backgroundColor: '#475569' }]} onPress={startMatchFromLobby}>
              <Text style={styles.startMatchGoldText}>{isRoomFull ? 'START MATCH ➔' : `WAITING (${currentReady}/${activeColors.length})...`}</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.startMatchGoldBtn, { backgroundColor: '#334155' }]}>
              <Text style={[styles.startMatchGoldText, { color: '#94a3b8' }]}>⏳ WAITING FOR HOST...</Text>
            </View>
          )}
          <TouchableOpacity activeOpacity={0.85} style={styles.cancelMatchBtn} onPress={() => { setOnlineLobbyModal(false); resetGame(); }}>
            <Text style={styles.cancelMatchText}>✕ Leave Room</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!gameMode) {
    const winPercentage = userStats.totalPlayed > 0 ? Math.round((userStats.totalWon / userStats.totalPlayed) * 100) : 0;
    return (
      <View style={styles.dashboardContainer}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <Image source={require('./lobby_bg.png')} style={styles.lobbyBgImage} resizeMode="cover" />
        <SafeAreaView style={styles.fulfilledTopActionCenterBar}>
          <View style={styles.topActionCenterInnerRow}>
            <TouchableOpacity activeOpacity={0.85} style={styles.megaFulfilledButton} onPress={() => { loadGlobalLeaderboard(); setLeaderboardModal(true); }}>
              <Text style={styles.megaFulfilledEmoji}>🏆</Text><Text style={styles.megaFulfilledText}>Leaderboard</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} style={styles.megaFulfilledButton} onPress={() => { setFriendsModal(true); fetchCloudFriendList(currentUser?.playerId); }}>
              <Text style={styles.megaFulfilledEmoji}>👥</Text><Text style={styles.megaFulfilledText}>Squad</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} style={styles.megaFulfilledButton} onPress={() => setSettingsModal(true)}>
              <Text style={styles.megaFulfilledEmoji}>⚙️</Text><Text style={styles.megaFulfilledText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} style={styles.megaFulfilledButton} onPress={() => setDailyBonusModal(true)}>
              <Text style={styles.megaFulfilledEmoji}>🎁</Text><Text style={styles.megaFulfilledText}>Bonus</Text>
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

  const boardRotation = getBoardRotationAngle(myColor);
  const perspective = getPerspectiveLayout(myColor);

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0f2b5c" />
      <Image source={require('./lobby_bg.png')} style={styles.inGameBgCover} resizeMode="cover" blurRadius={12} />
      <View style={styles.inGameBackdropShade} />

      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.exitBtn} onPress={handleExitGame}><Text style={styles.exitBtnText}>✕ Exit</Text></TouchableOpacity>
        <View style={styles.inGamePoolBox}><Text style={styles.inGamePoolText}>🪙 Pool: {matchPrizePool.toLocaleString()}</Text></View>
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

const styles = StyleSheet.create({
  royaleContainer: { flex:1, backgroundColor:'#0a0f1d', alignItems:'center', justifyContent:'space-between', paddingVertical:14, paddingHorizontal:16 },
  dashboardContainer: { flex:1, backgroundColor:'#0a0f1d', width:'100%', height:'100%' },
  lobbyBgImage: { width:'100%', height:'100%', position:'absolute', top:0, left:0, right:0, bottom:0 },
  fulfilledTopActionCenterBar: { width:'100%', alignItems:'center', paddingTop:22, zIndex:30 },
  topActionCenterInnerRow: { width:'90%', flexDirection:'row', justifyContent:'space-between', backgroundColor:'rgba(15,23,42,0.88)', borderWidth:1.5, borderColor:'#facc15', borderRadius:16, paddingVertical:8, paddingHorizontal:10, elevation:8 },
  megaFulfilledButton: { flex:1, alignItems:'center', justifyContent:'center', backgroundColor:'#1e293b', marginHorizontal:4, paddingVertical:6, borderRadius:10, borderWidth:1, borderColor:'#334155' },
  megaFulfilledEmoji: { fontSize:18, marginBottom:1 },
  megaFulfilledText: { color:'#ffffff', fontSize:10, fontWeight:'900', textAlign:'center' },
  centerBannerProfileWrapPerfect: { width:'100%', alignItems:'center', marginTop:12, zIndex:15 },
  centerCrownPosition: { marginBottom:-13, zIndex:5, alignItems:'center' },
  centerBannerContainerPerfect: { width:'78%', backgroundColor:'rgba(20,30,50,0.95)', borderWidth:2, borderColor:'#facc15', borderRadius:16, paddingVertical:6, paddingHorizontal:12, alignItems:'center' },
  centerBannerUsername: { color:'#ffffff', fontSize:15, fontWeight:'900', textAlign:'center', maxWidth:'100%' },
  centerBannerCoinsRow: { flexDirection:'row', alignItems:'center', marginTop:2, justifyContent:'center' },
  centerBannerCoinsText: { color:'#facc15', fontSize:13, fontWeight:'800' },
  podiumTouchLayer: { position:'absolute', top:'38%', left:'4%', right:'4%', height:360, flexDirection:'row', flexWrap:'wrap', justifyContent:'space-between', alignContent:'space-between', zIndex:20 },
  podiumTouchSpot: { width:'47%', height:165, borderRadius:24 },
  matchmakingContainer: { flex:1, backgroundColor:'#881337', alignItems:'center', justifyContent:'space-between', paddingVertical:18, paddingHorizontal:16 },
  matchLobbyHeader: { alignItems:'center', marginTop:4 },
  matchLobbyTitle: { color:'#facc15', fontSize:22, fontWeight:'900' },
  matchFormatSub: { color:'#ffffff', fontSize:12, fontWeight:'800', marginTop:2 },
  matchCodeCard: { flexDirection:'row', alignItems:'center', backgroundColor:'#450a0a', paddingHorizontal:14, paddingVertical:8, borderRadius:14, borderWidth:2, borderColor:'#f87171', marginTop:8 },
  matchCodeLabel: { color:'#ffffff', fontWeight:'bold', fontSize:15 },
  codePillBox: { backgroundColor:'#1e3a8a', paddingHorizontal:12, paddingVertical:4, borderRadius:8, borderWidth:1, borderColor:'#38bdf8' },
  codePillText: { color:'#facc15', fontWeight:'900', fontSize:18, letterSpacing:2 },
  shareCodeBtn: { backgroundColor:'#10b981', paddingHorizontal:12, paddingVertical:6, borderRadius:8, marginLeft:10 },
  shareCodeText: { color:'#ffffff', fontWeight:'bold', fontSize:12 },
  soloMatchLobbyWrap: { width:'100%', alignItems:'center', marginVertical:4 },
  hostProfileBox: { alignItems:'center', marginTop:6 },
  hostAvatarSquare: { width:84, height:84, borderRadius:18, backgroundColor:'#7f1d1d', borderWidth:2.5, borderColor:'#facc15', justifyContent:'center', alignItems:'center' },
  hostNameText: { color:'#ffffff', fontWeight:'900', fontSize:15, marginTop:4 },
  vsGlowBanner: { marginVertical:6 },
  vsGlowText: { color:'#facc15', fontSize:20, fontWeight:'900' },
  opponentSlotsRow: { flexDirection:'row', justifyContent:'center', width:'100%', marginVertical:6 },
  slotInviteBox: { width:88, height:95, borderRadius:16, backgroundColor:'#7f1d1d', borderWidth:2, borderColor:'#fca5a5', borderStyle:'dashed', justifyContent:'center', alignItems:'center', marginHorizontal:6 },
  plusAvatarIcon: { fontSize:28, color:'#fecaca' },
  inviteSlotLabel: { color:'#fecaca', fontSize:9, fontWeight:'bold', marginTop:4 },
  joinedSlotName: { color:'#ffffff', fontSize:11, fontWeight:'bold', maxWidth:75, textAlign:'center', marginTop:2 },
  teamMatchLobbyWrap: { width:'100%', marginVertical:2 },
  teamLobbyBoxA: { backgroundColor:'rgba(2,132,199,0.25)', borderWidth:1.5, borderColor:'#38bdf8', borderRadius:16, padding:8, alignItems:'center' },
  teamLobbyBoxB: { backgroundColor:'rgba(225,29,72,0.25)', borderWidth:1.5, borderColor:'#fb7185', borderRadius:16, padding:8, alignItems:'center' },
  teamLobbyTitleA: { color:'#38bdf8', fontWeight:'900', fontSize:12, marginBottom:6 },
  teamLobbyTitleB: { color:'#fb7185', fontWeight:'900', fontSize:12, marginBottom:6 },
  teamSlotsRow: { flexDirection:'row', justifyContent:'space-around', width:'100%' },
  playerSquareActive: { width:100, height:86, borderRadius:14, backgroundColor:'#1e3a8a', borderWidth:1.5, borderColor:'#38bdf8', justifyContent:'center', alignItems:'center' },
  slotBoxFilledBlue: { backgroundColor:'#1e3a8a', borderColor:'#38bdf8' },
  slotBoxFilledGreen: { backgroundColor:'#14532d', borderColor:'#4ade80' },
  slotBoxFilledRed: { backgroundColor:'#881337', borderColor:'#fb7185' },
  slotBoxFilledYellow: { backgroundColor:'#713f12', borderColor:'#facc15' },
  slotPlayerNameText: { color:'#ffffff', fontWeight:'bold', fontSize:11, maxWidth:85, textAlign:'center', marginTop:2 },
  slotRoleTagYellow: { color:'#facc15', fontSize:8, fontWeight:'900' },
  slotRoleTagGreen: { color:'#4ade80', fontSize:8, fontWeight:'900' },
  matchBottomActions: { width:'100%', alignItems:'center', marginBottom:6 },
  startMatchGoldBtn: { width:'90%', backgroundColor:'#eab308', borderWidth:1.5, borderColor:'#fef08a', borderRadius:14, paddingVertical:13, alignItems:'center' },
  startMatchGoldText: { color:'#000000', fontSize:15, fontWeight:'900' },
  cancelMatchBtn: { marginTop:8, paddingVertical:4 },
  cancelMatchText: { color:'#fca5a5', fontWeight:'bold', fontSize:13 },
  brandHero: { alignItems:'center', marginTop:4 },
  crownEmoji: { fontSize:36, marginBottom:2 },
  brandGoldTitle: { fontSize:24, fontWeight:'900', color:'#facc15', textAlign:'center' },
  goldPillBadge: { backgroundColor:'#78350f', borderColor:'#facc15', borderWidth:1, borderRadius:20, paddingHorizontal:12, paddingVertical:3, marginTop:4 },
  goldPillText: { color:'#fef08a', fontSize:10, fontWeight:'800' },
  glassCard: { width:'100%', backgroundColor:'#131c31', borderRadius:20, padding:16, borderWidth:1.5, borderColor:'#1e293b' },
  cardHeading: { fontSize:18, fontWeight:'bold', color:'#ffffff', textAlign:'center', marginBottom:14 },
  inputLabel: { color:'#94a3b8', fontSize:12, fontWeight:'700', marginBottom:6 },
  gameTextInput: { backgroundColor:'#0a0f1d', borderWidth:1.5, borderColor:'#334155', borderRadius:12, color:'#ffffff', paddingHorizontal:16, paddingVertical:12, fontSize:15 },
  gold3DButton: { backgroundColor:'#eab308', borderColor:'#fef08a', borderWidth:1.5, borderRadius:14, paddingVertical:14, alignItems:'center' },
  gold3DButtonText: { color:'#000000', fontSize:14, fontWeight:'900' },
  forgotHeaderBox: { alignItems:'center', marginBottom:8 },
  forgotTitle: { color:'#facc15', fontSize:16, fontWeight:'bold' },
  forgotSubtitle: { color:'#94a3b8', fontSize:11, textAlign:'center' },
  forgotLinkContainer: { alignSelf:'flex-end', marginTop:8 },
  forgotLinkText: { color:'#38bdf8', fontSize:12, fontWeight:'bold' },
  orDivider: { flexDirection:'row', alignItems:'center', marginVertical:12 },
  dividerLine: { flex:1, height:1, backgroundColor:'#334155' },
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
  teamHeaderTitleA: { color:'#38bdf8', fontWeight:'900', fontSize:13 },
  teamHeaderTitleB: { color:'#fb7185', fontWeight:'900', fontSize:13 },
  mainContainer: { flex:1, backgroundColor:'#0f2b5c', alignItems:'center', justifyContent:'space-between', paddingVertical:10 },
  inGameBgCover: { position:'absolute', top:0, bottom:0, left:0, right:0, width:'100%', height:'100%', opacity:0.38 },
  inGameBackdropShade: { position:'absolute', top:0, bottom:0, left:0, right:0, backgroundColor:'rgba(15,43,92,0.65)' },
  headerBar: { width:'94%', flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginVertical:4, zIndex:10 },
  exitBtn: { backgroundColor:'#ef4444', paddingHorizontal:12, paddingVertical:6, borderRadius:8, borderWidth:1.5, borderColor:'#ffffff' },
  exitBtnText: { color:'#ffffff', fontWeight:'bold', fontSize:13 },
  targetGapTimerBadge: { backgroundColor:'#0f172a', paddingHorizontal:6, paddingVertical:4, borderRadius:8, borderWidth:1.5, borderColor:'#38bdf8', alignItems:'center', justifyContent:'center', marginHorizontal:4 },
  targetGapTimerText: { color:'#ffffff', fontWeight:'900', fontSize:10 },
  timerDangerPulse: { borderColor:'#ef4444', backgroundColor:'#450a0a' },
  micActiveIndicator: { fontSize:10, position:'absolute', top:-4, right:-4 },
  missCounterBadge: { color:'#ef4444', fontSize:9, fontWeight:'900', marginTop:1 },
  slotSmallBadge: { color:'#facc15', fontSize:8, fontWeight:'bold', marginTop:1 },
  topCardsRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', width:BOARD_SIZE, paddingHorizontal:4, minHeight:60 },
  bottomCardsRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', width:BOARD_SIZE, paddingHorizontal:4, minHeight:60 },
  cardContainerWrapper: { width:'46%', alignItems:'center' },
  playerCardPlaceholder: { width:'46%' },
  playerCard: { flexDirection:'column', alignItems:'center', justifyContent:'space-between', backgroundColor:'rgba(15,23,42,0.85)', paddingHorizontal:8, paddingVertical:6, borderRadius:12, borderWidth:1.5, borderColor:'#38bdf8', width:'100%' },
  activeCardGlow: { borderColor:'#facc15', backgroundColor:'rgba(30,58,138,0.9)', elevation:8 },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  cardNameRow: { width: '100%', alignItems: 'center', marginTop: 2, paddingHorizontal: 4 },
  cardPlayerName: { color: '#ffffff', fontSize: 10, fontWeight: 'bold', textAlign: 'center', width: '100%' },
  cardAvatarLeft: { flexDirection:'column', alignItems:'center', width:35 },
  cardAvatarRight: { flexDirection:'column', alignItems:'center', width:35 },
  cardDiceWrap: { padding:2 },
  floatingArrowContainer: { position:'absolute', alignSelf:'center', zIndex:30 },
  arrowTopPos: { top:-24 },
  arrowIconBubble: { backgroundColor:'#f59e0b', paddingHorizontal:8, paddingVertical:2, borderRadius:6, borderWidth:1.5, borderColor:'#ffffff' },
  arrowIconText: { color:'#ffffff', fontWeight:'900', fontSize:14 },
  diceBox: { width:42, height:42, backgroundColor:'#ffffff', borderRadius:8, borderWidth:2, borderColor:'#cbd5e1', justifyContent:'center', alignItems:'center', padding:3 },
  diceDot: { width:6.5, height:6.5, borderRadius:3.25, backgroundColor:'#0f172a', margin:1.5 },
  diceCenter: { justifyContent:'center', alignItems:'center' },
  diceRowSpace: { flexDirection:'row', justifyContent:'space-between', width:'100%', paddingHorizontal:2 },
  diceCol: { justifyContent:'space-between' },
  pinWrapper: { alignItems:'center', width:24, height:32, justifyContent:'center' },
  pinPedestalRing: { width:24, height:24, borderRadius:12, borderWidth:2.5, backgroundColor:'rgba(255,255,255,0.95)', justifyContent:'center', alignItems:'center' },
  pinHeadCircle: { width:15, height:15, borderRadius:7.5, justifyContent:'center', alignItems:'center' },
  pinWhiteInnerCore: { width:8, height:8, borderRadius:4, backgroundColor:'#ffffff', justifyContent:'center', alignItems:'center' },
  pinDotCenter: { width:4, height:4, borderRadius:2 },
  stackBadgeBubble: { position:'absolute', top:-10, alignSelf:'center', backgroundColor:'#facc15', borderRadius:8, width:15, height:15, justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:'#000000', zIndex:30 },
  stackBadgeText: { color:'#000000', fontSize:9, fontWeight:'900' },
  boardContainer: { width:BOARD_SIZE, height:BOARD_SIZE, backgroundColor:'#ffffff', borderWidth:2, borderColor:'#334155', borderRadius:6, overflow:'hidden', elevation:12 },
  board: { width:'100%', height:'100%', position:'relative', backgroundColor:'#ffffff' },
  cell: { position:'absolute', width:CELL_SIZE, height:CELL_SIZE, borderWidth:0.6, borderColor:'#94a3b8', justifyContent:'center', alignItems:'center' },
  starCleanText: { fontSize:18, color:'#334155', fontWeight:'bold' },
  arrowCleanText: { fontSize:15, fontWeight:'900' },
  base: { position:'absolute', width:CELL_SIZE * 6, height:CELL_SIZE * 6, justifyContent:'center', alignItems:'center', padding:6 },
  redBase: { top:0, left:0, backgroundColor:'#ef4444' },
  greenBase: { top:0, right:0, backgroundColor:'#16a34a' },
  blueBase: { bottom:0, left:0, backgroundColor:'#2563eb' },
  yellowBase: { bottom:0, right:0, backgroundColor:'#eab308' },
  baseInnerWhite: { width:'84%', height:'84%', backgroundColor:'#ffffff', borderRadius:8, justifyContent:'space-around', alignItems:'center', padding:10, borderWidth:1.5, borderColor:'#cbd5e1' },
  pocketRow: { flexDirection:'row', justifyContent:'space-around', width:'100%', alignItems:'center' },
  basePocket: { width: CELL_SIZE * 1.3, height: CELL_SIZE * 1.3, borderRadius: (CELL_SIZE * 1.3) / 2 },
  centerHome: { position:'absolute', top:CELL_SIZE * 6, left:CELL_SIZE * 6, width:CELL_SIZE * 3, height:CELL_SIZE * 3, overflow:'hidden' },
  centerTriangleTop: { position:'absolute', top:0, left:0, width:0, height:0, borderLeftWidth:(CELL_SIZE * 3) / 2, borderRightWidth:(CELL_SIZE * 3) / 2, borderTopWidth:(CELL_SIZE * 3) / 2, borderLeftColor:'transparent', borderRightColor:'transparent', borderTopColor:'#16a34a' },
  centerTriangleRight: { position:'absolute', top:0, right:0, width:0, height:0, borderTopWidth:(CELL_SIZE * 3) / 2, borderBottomWidth:(CELL_SIZE * 3) / 2, borderRightWidth:(CELL_SIZE * 3) / 2, borderTopColor:'transparent', borderBottomColor:'transparent', borderRightColor:'#eab308' },
  centerTriangleBottom: { position:'absolute', bottom:0, left:0, width:0, height:0, borderLeftWidth:(CELL_SIZE * 3) / 2, borderRightWidth:(CELL_SIZE * 3) / 2, borderBottomWidth:(CELL_SIZE * 3) / 2, borderLeftColor:'transparent', borderRightColor:'transparent', borderBottomColor:'#2563eb' },
  centerTriangleLeft: { position:'absolute', top:0, left:0, width:0, height:0, borderTopWidth:(CELL_SIZE * 3) / 2, borderBottomWidth:(CELL_SIZE * 3) / 2, borderLeftWidth:(CELL_SIZE * 3) / 2, borderTopColor:'transparent', borderBottomColor:'transparent', borderLeftColor:'#ef4444' },
  tokenWrapper: { position:'absolute', width:CELL_SIZE, height:CELL_SIZE, justifyContent:'center', alignItems:'center' },
});
