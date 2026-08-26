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
  Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

const SUPABASE_PROJECT_REF = 'zyqlntdpftowobsrzbgv'; 
const SUPABASE_ANON_KEY = 'sb_publishable_DuyB_EEKvMkDk0QFxQykqg_ZXCMzTwo';

const { width } = Dimensions.get('window');
const BOARD_SIZE = Math.min(width - 24, 380);
const CELL_SIZE = BOARD_SIZE / 15;

const TRACK_COORDINATES = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7], [0, 8],
  [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14], [8, 14],
  [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  [14, 7], [14, 6],
  [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0], [6, 0]
];

const HOME_PATHS = {
  BLUE: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]],
  RED: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]],
  GREEN: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]],
  YELLOW: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]],
};

const BASE_SPOTS = {
  BLUE: [[10.5, 1.5], [10.5, 3.5], [12.5, 1.5], [12.5, 3.5]],
  RED: [[1.5, 1.5], [1.5, 3.5], [3.5, 1.5], [3.5, 3.5]],
  GREEN: [[1.5, 10.5], [1.5, 12.5], [3.5, 10.5], [3.5, 12.5]],
  YELLOW: [[10.5, 10.5], [10.5, 12.5], [12.5, 10.5], [12.5, 12.5]],
};

const START_INDEX = { RED: 0, GREEN: 13, YELLOW: 26, BLUE: 39 };
const SAFE_INDEXES = [0, 8, 13, 21, 26, 34, 39, 47];
const ALL_COLORS = ['BLUE', 'RED', 'GREEN', 'YELLOW'];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const playSound = async (type) => {
  try {
    let soundAsset;
    if (type === 'dice') soundAsset = require('./assets/sounds/dice.mp3');
    else if (type === 'move') soundAsset = require('./assets/sounds/move.mp3');
    else if (type === 'cut') soundAsset = require('./assets/sounds/cut.mp3');
    else if (type === 'win') soundAsset = require('./assets/sounds/win.mp3');

    if (soundAsset) {
      const { sound } = await Audio.Sound.createAsync(soundAsset);
      await sound.playAsync();
    }
  } catch (error) {}
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

const PinToken = ({ colorHex, shadowColor }) => (
  <View style={styles.pinWrapper}>
    <View style={[styles.pinHead, { backgroundColor: colorHex, shadowColor: shadowColor }]}>
      <View style={styles.pinInnerGlow} />
      <View style={styles.pinCenterDot} />
    </View>
    <View style={[styles.pinPointer, { borderTopColor: colorHex }]} />
  </View>
);

const ActiveTurnArrow = ({ bounceAnim, isTopRow }) => (
  <Animated.View
    style={[
      styles.floatingArrowContainer,
      isTopRow ? styles.arrowTopPos : styles.arrowBottomPos,
      { transform: [{ translateY: bounceAnim }] }
    ]}
  >
    <View style={styles.arrowIconBubble}>
      <Text style={styles.arrowIconText}>{isTopRow ? '▼' : '▲'}</Text>
    </View>
  </Animated.View>
);

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('LOGIN'); // 'LOGIN' | 'SIGNUP' | 'FORGOT'
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');

  const [aboutModal, setAboutModal] = useState(false);
  const [friendsModal, setFriendsModal] = useState(false);
  const [friendsList, setFriendsList] = useState([
    { id: '101', name: 'Rohan_Gamer', online: true },
    { id: '102', name: 'Amit_Pro', online: true },
    { id: '103', name: 'Vanya_Player', online: false },
  ]);
  const [newFriendInput, setNewFriendInput] = useState('');
  const [incomingInvite, setIncomingInvite] = useState(null);

  const [gameMode, setGameMode] = useState(null); 
  const [passPlayModal, setPassPlayModal] = useState(false);
  const [hybridTeamModal, setHybridTeamModal] = useState(false);
  const [onlineScreen, setOnlineScreen] = useState(false);
  
  const [playType, setPlayType] = useState('SOLO');
  const [selectedPlayerCount, setSelectedPlayerCount] = useState(2);
  const [onlinePlayType, setOnlinePlayType] = useState('SOLO');
  const [onlinePlayerCount, setOnlinePlayerCount] = useState(2);
  const [friendlyKill, setFriendlyKill] = useState(false);
  const [activeColors, setActiveColors] = useState(['BLUE', 'GREEN']);

  const [playerSlots, setPlayerSlots] = useState({
    BLUE: 'LOCAL',
    GREEN: 'ONLINE',
    RED: 'LOCAL',
    YELLOW: 'BOT',
  });

  const [roomCode, setRoomCode] = useState('');
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [myColor, setMyColor] = useState('BLUE');

  const [playerDices, setPlayerDices] = useState({
    BLUE: 1,
    RED: 3,
    GREEN: 6,
    YELLOW: 2,
  });

  const [isRolling, setIsRolling] = useState(false);
  const [hasRolled, setHasRolled] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [turnIndex, setTurnIndex] = useState(0);
  const [winner, setWinner] = useState(null);

  const spinAnim = useRef(new Animated.Value(0)).current;
  const diceBounceAnim = useRef(new Animated.Value(1)).current;
  const arrowBounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(arrowBounceAnim, {
          toValue: -8,
          duration: 400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(arrowBounceAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const [pawns, setPawns] = useState({
    BLUE: [-1, -1, -1, -1],
    RED: [-1, -1, -1, -1],
    GREEN: [-1, -1, -1, -1],
    YELLOW: [-1, -1, -1, -1],
  });

  const pawnsRef = useRef(pawns);
  pawnsRef.current = pawns;
  const ws = useRef(null);
  const userWs = useRef(null);
  const currentTurn = activeColors[turnIndex] || activeColors[0];

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const saved = await AsyncStorage.getItem('@ludo_supreme_user');
        if (saved) {
          setCurrentUser(JSON.parse(saved));
        }
      } catch (err) {}
    };
    restoreSession();
  }, []);

  const handleAuthSubmit = async () => {
    if (!emailInput.trim()) {
      Alert.alert('Error', 'Please enter email address.');
      return;
    }

    try {
      const dbUsersRaw = await AsyncStorage.getItem('@ludo_registered_users');
      let dbUsers = dbUsersRaw ? JSON.parse(dbUsersRaw) : {};
      const userKey = emailInput.trim().toLowerCase();

      if (authMode === 'SIGNUP') {
        if (!passwordInput.trim() || !usernameInput.trim()) {
          Alert.alert('Error', 'Please fill all fields.');
          return;
        }
        if (dbUsers[userKey]) {
          Alert.alert('Error', 'Account already exists. Please Sign In.');
          return;
        }

        const newUser = {
          name: usernameInput.trim(),
          email: emailInput.trim(),
          password: passwordInput.trim(),
          coins: 2000,
          playerId: Math.floor(10000 + Math.random() * 90000).toString()
        };

        dbUsers[userKey] = newUser;
        await AsyncStorage.setItem('@ludo_registered_users', JSON.stringify(dbUsers));
        await AsyncStorage.setItem('@ludo_supreme_user', JSON.stringify(newUser));
        setCurrentUser(newUser);
        Alert.alert('Success', 'Account permanently created!');
      } else if (authMode === 'LOGIN') {
        if (!passwordInput.trim()) {
          Alert.alert('Error', 'Please enter password.');
          return;
        }
        const matched = dbUsers[userKey];
        if (!matched || matched.password !== passwordInput.trim()) {
          Alert.alert('Login Failed', 'Invalid credentials or account does not exist. Please sign up first.');
          return;
        }

        await AsyncStorage.setItem('@ludo_supreme_user', JSON.stringify(matched));
        setCurrentUser(matched);
      } else if (authMode === 'FORGOT') {
        if (!newPasswordInput.trim()) {
          Alert.alert('Error', 'Please enter your new password.');
          return;
        }
        if (!dbUsers[userKey]) {
          Alert.alert('Error', 'No account found with this email address.');
          return;
        }

        dbUsers[userKey].password = newPasswordInput.trim();
        await AsyncStorage.setItem('@ludo_registered_users', JSON.stringify(dbUsers));
        Alert.alert('Password Updated', 'Your password has been reset successfully. Please login with your new password.');
        setPasswordInput('');
        setNewPasswordInput('');
        setAuthMode('LOGIN');
      }
    } catch (err) {
      Alert.alert('Error', 'Authentication error occurred.');
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('@ludo_supreme_user');
      setCurrentUser(null);
      resetGame();
    } catch (err) {}
  };

  const handleGuestLogin = () => {
    const guestId = Math.floor(1000 + Math.random() * 9000);
    setCurrentUser({ name: `Guest_${guestId}`, email: `guest_${guestId}@ludo.app`, coins: 500, playerId: guestId.toString() });
  };

  useEffect(() => {
    if (!currentUser) return;
    const wsUrl = `wss://${SUPABASE_PROJECT_REF}.supabase.co/realtime/v1/websocket?apikey=${SUPABASE_ANON_KEY}&vsn=1.0.0`;
    userWs.current = new WebSocket(wsUrl);

    userWs.current.onopen = () => {
      userWs.current.send(JSON.stringify({
        topic: `realtime:user_${currentUser.playerId}`,
        event: 'phx_join',
        payload: {},
        ref: 'user_1'
      }));
    };

    userWs.current.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.event === 'broadcast' && msg.payload?.type === 'GAME_INVITE') {
          setIncomingInvite(msg.payload.data);
        }
      } catch (err) {}
    };

    return () => {
      if (userWs.current) userWs.current.close();
    };
  }, [currentUser]);

  const sendFriendInvite = (friend) => {
    if (userWs.current && userWs.current.readyState === WebSocket.OPEN) {
      const generatedRoom = Math.floor(1000 + Math.random() * 9000).toString();
      userWs.current.send(JSON.stringify({
        topic: `realtime:user_${friend.id}`,
        event: 'broadcast',
        payload: {
          type: 'GAME_INVITE',
          data: {
            fromName: currentUser.name,
            fromId: currentUser.playerId,
            roomCode: generatedRoom,
          }
        },
        ref: 'inv_1'
      }));
      setRoomCode(generatedRoom);
      setMyColor('BLUE');
      setActiveColors(['BLUE', 'GREEN']);
      setGameMode('ONLINE');
      setFriendsModal(false);
      Alert.alert('Invite Sent', `Match invitation sent to ${friend.name}`);
    }
  };

  const acceptInvite = () => {
    if (!incomingInvite) return;
    setRoomCode(incomingInvite.roomCode);
    setMyColor('GREEN');
    setActiveColors(['BLUE', 'GREEN']);
    setGameMode('ONLINE');
    setIncomingInvite(null);
  };

  const startCustomPassPlay = () => {
    let colors = ['BLUE', 'GREEN'];
    if (playType === 'SOLO') {
      if (selectedPlayerCount === 2) colors = ['BLUE', 'GREEN'];
      else if (selectedPlayerCount === 3) colors = ['BLUE', 'RED', 'GREEN'];
      else colors = ['BLUE', 'RED', 'GREEN', 'YELLOW'];
    } else {
      colors = ['BLUE', 'RED', 'GREEN', 'YELLOW'];
    }
    setActiveColors(colors);
    setTurnIndex(0);
    setPassPlayModal(false);
    setGameMode('OFFLINE');
  };

  const startOnlineHost = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setRoomCode(code);
    setMyColor('BLUE');
    let colors = ['BLUE', 'GREEN'];
    if (onlinePlayType === 'SOLO') {
      if (onlinePlayerCount === 2) colors = ['BLUE', 'GREEN'];
      else if (onlinePlayerCount === 3) colors = ['BLUE', 'RED', 'GREEN'];
      else colors = ['BLUE', 'RED', 'GREEN', 'YELLOW'];
    } else {
      colors = ['BLUE', 'RED', 'GREEN', 'YELLOW'];
    }
    
    setActiveColors(colors);
    setPlayType(onlinePlayType);
    setGameMode('ONLINE');
    setOnlineScreen(false);
    Alert.alert('Room Created!', `Room Code: ${code}`);
  };

  const joinOnlineRoom = () => {
    if (inputRoomCode.trim().length >= 3) {
      setRoomCode(inputRoomCode.trim());
      setMyColor('GREEN');
      setActiveColors(['BLUE', 'GREEN']);
      setPlayType('SOLO');
      setGameMode('ONLINE');
      setOnlineScreen(false);
    } else {
      Alert.alert('Invalid Code', 'Please enter a valid room code');
    }
  };

  const resetGame = () => {
    setPawns({
      BLUE: [-1, -1, -1, -1],
      RED: [-1, -1, -1, -1],
      GREEN: [-1, -1, -1, -1],
      YELLOW: [-1, -1, -1, -1],
    });
    setTurnIndex(0);
    setHasRolled(false);
    setIsMoving(false);
    setIsRolling(false);
    setWinner(null);
    setGameMode(null);
    setPassPlayModal(false);
    setHybridTeamModal(false);
    setOnlineScreen(false);
    if (ws.current) ws.current.close();
  };

  const handleExitGame = () => {
    Alert.alert('Exit Game', 'Return to Main Lobby?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Quit Match', style: 'destructive', onPress: resetGame },
    ]);
  };

  const isTeammate = (c1, c2) => {
    if (playType !== 'TEAM') return false;
    return ( (c1 === 'BLUE' && c2 === 'GREEN') || (c1 === 'GREEN' && c2 === 'BLUE') ||
             (c1 === 'RED' && c2 === 'YELLOW') || (c1 === 'YELLOW' && c2 === 'RED') );
  };

  useEffect(() => {
    if ((gameMode !== 'ONLINE' && gameMode !== 'HYBRID') || !roomCode) return;
    const wsUrl = `wss://${SUPABASE_PROJECT_REF}.supabase.co/realtime/v1/websocket?apikey=${SUPABASE_ANON_KEY}&vsn=1.0.0`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      ws.current.send(JSON.stringify({
        topic: `realtime:room_${roomCode}`,
        event: 'phx_join',
        payload: {},
        ref: '1'
      }));
    };

    ws.current.onmessage = (e) => {
      try {
        const message = JSON.parse(e.data);
        if (message.event === 'broadcast' && message.payload?.type === 'SYNC_GAME') {
          const { newPawns, nextTurnIdx, updatedDices, rolled, winPlayer, syncedColors, syncedPlayType } = message.payload.data;
          setPawns(newPawns);
          setTurnIndex(nextTurnIdx);
          setPlayerDices(updatedDices);
          setHasRolled(rolled);
          if (syncedColors) setActiveColors(syncedColors);
          if (syncedPlayType) setPlayType(syncedPlayType);
          if (winPlayer) setWinner(winPlayer);
        }
      } catch (err) {}
    };

    return () => {
      if (ws.current) ws.current.close();
    };
  }, [gameMode, roomCode]);

  const sendMultiplayerSync = (newPawns, nextTurnIdx, updatedDices, rolled, winPlayer = null) => {
    if ((gameMode === 'ONLINE' || gameMode === 'HYBRID') && ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        topic: `realtime:room_${roomCode}`,
        event: 'broadcast',
        payload: {
          type: 'SYNC_GAME',
          data: { newPawns, nextTurnIdx, updatedDices, rolled, winPlayer, syncedColors: activeColors, syncedPlayType: playType }
        },
        ref: '2'
      }));
    }
  };

  useEffect(() => {
    const isBotTurn = (gameMode === 'BOT' && currentTurn !== 'BLUE') || 
                     (gameMode === 'HYBRID' && playerSlots[currentTurn] === 'BOT');

    if (isBotTurn && !hasRolled && !isRolling && !isMoving && !winner) {
      const botTimer = setTimeout(() => rollDice(true), 800);
      return () => clearTimeout(botTimer);
    }
  }, [turnIndex, hasRolled, isMoving, gameMode, winner, currentTurn, playerSlots]);

  const nextTurn = (currentIdx = turnIndex) => {
    const nextIdx = (currentIdx + 1) % activeColors.length;
    setTurnIndex(nextIdx);
    setHasRolled(false);
    setIsMoving(false);
    return nextIdx;
  };

  const getValidMoves = (color, diceVal) => {
    const playerPawns = pawnsRef.current[color];
    const validIndexes = [];
    playerPawns.forEach((stepCount, idx) => {
      if (stepCount === -1 && diceVal === 6) validIndexes.push(idx);
      else if (stepCount >= 0 && stepCount + diceVal <= 56) validIndexes.push(idx);
    });
    return validIndexes;
  };

  // Fixed Dice Roll Engine - Zero Post-Stop Value Change
  const rollDice = async (isBot = false) => {
    if (hasRolled || isMoving || isRolling || winner) return;

    if (gameMode === 'ONLINE' && currentTurn !== myColor) return;
    if (gameMode === 'HYBRID' && playerSlots[currentTurn] === 'ONLINE' && currentTurn !== myColor) return;

    setIsRolling(true);
    playSound('dice');

    const finalVal = Math.floor(Math.random() * 6) + 1;

    spinAnim.setValue(0);
    diceBounceAnim.setValue(1);

    Animated.parallel([
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(diceBounceAnim, { toValue: 1.25, duration: 180, useNativeDriver: true }),
        Animated.timing(diceBounceAnim, { toValue: 0.9, duration: 180, useNativeDriver: true }),
        Animated.timing(diceBounceAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ])
    ]).start();

    // Fast face swapping during animation
    const shuffleDelays = [60, 70, 90, 120];
    for (let delay of shuffleDelays) {
      const rand = Math.floor(Math.random() * 6) + 1;
      setPlayerDices(prev => ({ ...prev, [currentTurn]: rand }));
      await sleep(delay);
    }

    // Set final number and freeze permanently
    const newDices = { ...playerDices, [currentTurn]: finalVal };
    setPlayerDices(prev => ({ ...prev, [currentTurn]: finalVal }));
    await sleep(200);

    setIsRolling(false);
    setHasRolled(true);

    const validMoves = getValidMoves(currentTurn, finalVal);

    if (validMoves.length === 0) {
      setTimeout(() => {
        const nextIdx = nextTurn();
        sendMultiplayerSync(pawnsRef.current, nextIdx, newDices, false);
      }, 700);
    } else if (validMoves.length === 1 || (gameMode === 'BOT' && currentTurn !== 'BLUE') || (gameMode === 'HYBRID' && playerSlots[currentTurn] === 'BOT')) {
      setTimeout(() => executeStepMovement(currentTurn, validMoves[0], finalVal, newDices), 400);
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
      await sleep(280);
    }

    finalizeMove(color, index, currentStep, diceVal, currentPawnsState, currentDices);
  };

  const finalizeMove = (color, index, finalStep, diceVal, finalState, currentDices) => {
    let updatedPawns = JSON.parse(JSON.stringify(finalState));
    let extraTurn = diceVal === 6;

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

    let winPlayer = null;
    if (playType === 'TEAM') {
      const partnerColor = color === 'BLUE' ? 'GREEN' : color === 'GREEN' ? 'BLUE' : color === 'RED' ? 'YELLOW' : 'RED';
      const myHome = updatedPawns[color].every(s => s === 56);
      const partnerHome = updatedPawns[partnerColor].every(s => s === 56);

      if (myHome && partnerHome) {
        playSound('win');
        winPlayer = color === 'BLUE' || color === 'GREEN' ? 'TEAM A (Blue & Green)' : 'TEAM B (Red & Yellow)';
        setWinner(winPlayer);
        Alert.alert('TEAM VICTORY!', `${winPlayer} won the match!`);
      }
    } else {
      if (updatedPawns[color].every((s) => s === 56)) {
        playSound('win');
        winPlayer = color;
        setWinner(color);
        Alert.alert('VICTORY!', `${color} has won the match!`);
      }
    }

    setPawns(updatedPawns);
    setIsMoving(false);

    if (extraTurn && !winPlayer) {
      setHasRolled(false);
      sendMultiplayerSync(updatedPawns, turnIndex, currentDices, false, winPlayer);
    } else {
      const nextIdx = nextTurn();
      sendMultiplayerSync(updatedPawns, nextIdx, currentDices, false, winPlayer);
    }
  };

  const getPawnScreenCoords = (color, stepCount, idx) => {
    if (stepCount === -1) return BASE_SPOTS[color][idx];
    if (stepCount === 56) return [7, 7];
    if (stepCount >= 51) return HOME_PATHS[color][stepCount - 51];
    return TRACK_COORDINATES[(START_INDEX[color] + stepCount) % 52];
  };

  const getTurnColorHex = (col) => {
    if (col === 'RED') return '#e11d48';
    if (col === 'GREEN') return '#16a34a';
    if (col === 'YELLOW') return '#eab308';
    return '#0284c7';
  };

  const renderCell = (row, col) => {
    if (row < 6 && col < 6) return null;
    if (row < 6 && col > 8) return null;
    if (row > 8 && col < 6) return null;
    if (row > 8 && col > 8) return null;
    if (row >= 6 && row <= 8 && col >= 6 && col <= 8) return null;

    let bgColor = '#ffffff';
    if (row === 7 && col >= 1 && col <= 5) bgColor = '#e11d48';
    if (col === 7 && row >= 1 && row <= 5) bgColor = '#16a34a';
    if (row === 7 && col >= 9 && col <= 13) bgColor = '#facc15';
    if (col === 7 && row >= 9 && row <= 13) bgColor = '#38bdf8';
    if (row === 6 && col === 1) bgColor = '#e11d48';
    if (row === 1 && col === 8) bgColor = '#16a34a';
    if (row === 8 && col === 13) bgColor = '#facc15';
    if (row === 13 && col === 6) bgColor = '#38bdf8';

    const isStar = (row === 2 && col === 6) ||
                   (row === 6 && col === 12) ||
                   (row === 12 && col === 8) ||
                   (row === 8 && col === 2);

    const isArrow = (row === 7 && col === 0) || (row === 0 && col === 7) || (row === 7 && col === 14) || (row === 14 && col === 7);

    let arrowIcon = '';
    if (row === 7 && col === 0) arrowIcon = '→';
    if (row === 0 && col === 7) arrowIcon = '↓';
    if (row === 7 && col === 14) arrowIcon = '←';
    if (row === 14 && col === 7) arrowIcon = '↑';

    return (
      <View key={`${row}-${col}`} style={[styles.cell, { left: col * CELL_SIZE, top: row * CELL_SIZE, backgroundColor: bgColor }]}>
        {isStar && <Text style={styles.starText}>☆</Text>}
        {isArrow && <Text style={styles.arrowText}>{arrowIcon}</Text>}
      </View>
    );
  };

  const getBaseDynamicLabel = (color) => {
    if (playType === 'TEAM') {
      if (color === 'BLUE') return 'Team A (Blue)';
      if (color === 'GREEN') return 'Team A (Green)';
      if (color === 'RED') return 'Team B (Red)';
      if (color === 'YELLOW') return 'Team B (Yellow)';
    } else {
      if (color === 'BLUE') return currentUser ? currentUser.name : 'Player 1';
      if (color === 'RED') return 'Player 2';
      if (color === 'GREEN') return selectedPlayerCount === 2 ? 'Player 2' : 'Player 3';
      if (color === 'YELLOW') return 'Player 4';
    }
    return '';
  };

  const renderBase = (color, posStyle, isVertical) => {
    const isPlayable = activeColors.includes(color);
    const label = getBaseDynamicLabel(color);

    return (
      <View style={[styles.base, posStyle, !isPlayable && { opacity: 0.35 }]}>
        <View style={styles.baseInnerWhite}>
          <View style={styles.pocketRow}>
            <View style={[styles.basePocket, { borderColor: getTurnColorHex(color) }]} />
            <View style={[styles.basePocket, { borderColor: getTurnColorHex(color) }]} />
          </View>
          <View style={styles.pocketRow}>
            <View style={[styles.basePocket, { borderColor: getTurnColorHex(color) }]} />
            <View style={[styles.basePocket, { borderColor: getTurnColorHex(color) }]} />
          </View>
        </View>
        {isPlayable && (
          <Text style={[styles.playerLabel, isVertical ? styles.playerLabelRotated : styles.playerLabelHorizontal]}>
            {label}
          </Text>
        )}
      </View>
    );
  };

  const renderPlayerTokens = (color, colorHex, shadowColor) => {
    if (!activeColors.includes(color)) return null;
    return pawns[color].map((stepCount, idx) => {
      const coords = getPawnScreenCoords(color, stepCount, idx);
      const isMyTurn = currentTurn === color;

      return (
        <TouchableOpacity
          key={`${color}-${idx}`}
          disabled={!hasRolled || !isMyTurn || isMoving}
          onPress={() => executeStepMovement(color, idx, playerDices[color])}
          style={[
            styles.tokenWrapper,
            { left: coords[1] * CELL_SIZE, top: coords[0] * CELL_SIZE - 6 },
            stepCount === 56 && { opacity: 0.3 }
          ]}
        >
          <PinToken colorHex={colorHex} shadowColor={shadowColor} />
        </TouchableOpacity>
      );
    });
  };

  const spinInterpolation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '720deg'],
  });

  const renderPlayerCard = (color, pinHex, shadowHex, isLeftDice = false, isTopRow = true) => {
    const isPlayable = activeColors.includes(color);
    if (!isPlayable) return <View style={{ width: '45%' }} />;

    const isCurrent = currentTurn === color;
    const slotType = playerSlots[color];
    const badgeText = gameMode === 'HYBRID' ? (slotType === 'LOCAL' ? '📱 Local' : slotType === 'ONLINE' ? '🌐 Online' : '🤖 Bot') : '';

    return (
      <View style={styles.cardContainerWrapper}>
        {isCurrent && <ActiveTurnArrow bounceAnim={arrowBounceAnim} isTopRow={isTopRow} />}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => isCurrent && rollDice()}
          style={[styles.playerCard, isCurrent && styles.activeCardGlow]}
        >
          {isLeftDice ? (
            <>
              <Animated.View style={[styles.cardDiceWrap, isCurrent && { transform: [{ rotate: spinInterpolation }, { scale: diceBounceAnim }] }]}>
                <DiceFace value={playerDices[color]} />
              </Animated.View>
              <View style={styles.cardAvatarRight}>
                <PinToken colorHex={pinHex} shadowColor={shadowHex} />
                {badgeText !== '' && <Text style={styles.slotSmallBadge}>{badgeText}</Text>}
              </View>
            </>
          ) : (
            <>
              <View style={styles.cardAvatarLeft}>
                <PinToken colorHex={pinHex} shadowColor={shadowHex} />
                {badgeText !== '' && <Text style={styles.slotSmallBadge}>{badgeText}</Text>}
              </View>
              <Animated.View style={[styles.cardDiceWrap, isCurrent && { transform: [{ rotate: spinInterpolation }, { scale: diceBounceAnim }] }]}>
                <DiceFace value={playerDices[color]} />
              </Animated.View>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // Auth Screen (Sign In / Sign Up / Forgot Password)
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
                  {[2, 3, 4].map((count) => (
                    <TouchableOpacity key={count} style={[styles.countPill, selectedPlayerCount === count && styles.countPillActive]} onPress={() => setSelectedPlayerCount(count)}>
                      <Text style={[styles.countPillText, selectedPlayerCount === count && styles.countPillTextActive]}>{count} Players</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.helperTip}>
                  {selectedPlayerCount === 2 && '• 2 Players: Blue vs Green (Head to Head)'}
                  {selectedPlayerCount === 3 && '• 3 Players: Blue, Red & Green (Triangle Battle)'}
                  {selectedPlayerCount === 4 && '• 4 Players: Full Board'}
                </Text>
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
            <Text style={styles.lobbySubtitle}>Configure Team A & Team B Slots</Text>
          </View>

          <View style={[styles.glassCard, { marginTop: 12 }]}>
            <View style={styles.teamContainerBoxA}>
              <View style={styles.teamHeaderRow}>
                <Text style={styles.teamHeaderTitleA}>🛡️ TEAM A (Blue & Green)</Text>
                <View style={styles.teamBadgeA}><Text style={styles.teamBadgeText}>Partners</Text></View>
              </View>
              {['BLUE', 'GREEN'].map((col) => (
                <View key={col} style={styles.slotRow}>
                  <Text style={[styles.slotColorText, { color: getTurnColorHex(col) }]}>{col}</Text>
                  <View style={styles.slotTypeSelector}>
                    {['LOCAL', 'ONLINE', 'BOT'].map((type) => (
                      <TouchableOpacity key={type} style={[styles.slotTypePill, playerSlots[col] === type && styles.slotTypePillActive]} onPress={() => setPlayerSlots({ ...playerSlots, [col]: type })}>
                        <Text style={[styles.slotTypeText, playerSlots[col] === type && styles.slotTypeTextActive]}>{type === 'LOCAL' ? '📱 Local' : type === 'ONLINE' ? '🌐 Online' : '🤖 Bot'}</Text>
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
              {['RED', 'YELLOW'].map((col) => (
                <View key={col} style={styles.slotRow}>
                  <Text style={[styles.slotColorText, { color: getTurnColorHex(col) }]}>{col}</Text>
                  <View style={styles.slotTypeSelector}>
                    {['LOCAL', 'ONLINE', 'BOT'].map((type) => (
                      <TouchableOpacity key={type} style={[styles.slotTypePill, playerSlots[col] === type && styles.slotTypePillActive]} onPress={() => setPlayerSlots({ ...playerSlots, [col]: type })}>
                        <Text style={[styles.slotTypeText, playerSlots[col] === type && styles.slotTypeTextActive]}>{type === 'LOCAL' ? '📱 Local' : type === 'ONLINE' ? '🌐 Online' : '🤖 Bot'}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity activeOpacity={0.85} style={[styles.gold3DButton, { marginTop: 16 }]} onPress={() => {
              const code = Math.floor(1000 + Math.random() * 9000).toString();
              setRoomCode(code);
              setMyColor('BLUE');
              setActiveColors(['BLUE', 'RED', 'GREEN', 'YELLOW']);
              setPlayType('TEAM');
              setGameMode('HYBRID');
              setHybridTeamModal(false);
              Alert.alert('Match Live!', `Room Code: ${code} (Share with remote players)`);
            }}>
              <Text style={styles.gold3DButtonText}>LAUNCH TEAM MATCH ➔</Text>
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
                  {[2, 3, 4].map((count) => (
                    <TouchableOpacity key={count} style={[styles.countPill, onlinePlayerCount === count && styles.countPillActive]} onPress={() => setOnlinePlayerCount(count)}>
                      <Text style={[styles.countPillText, onlinePlayerCount === count && styles.countPillTextActive]}>{count} Players</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.helperTip}>• Team A (Blue + Green) vs Team B (Red + Yellow)</Text>
              </View>
            )}

            <TouchableOpacity activeOpacity={0.85} style={[styles.gold3DButton, { marginTop: 10 }]} onPress={startOnlineHost}>
              <Text style={styles.gold3DButtonText}>➕ CREATE PRIVATE ROOM</Text>
            </TouchableOpacity>

            <View style={styles.orDivider}><View style={styles.dividerLine} /><Text style={styles.orText}>JOIN ROOM</Text><View style={styles.dividerLine} /></View>
            <TextInput style={[styles.gameTextInput, { textAlign: 'center', fontSize: 18, letterSpacing: 4 }]} placeholder="ENTER ROOM CODE" placeholderTextColor="#64748b" keyboardType="number-pad" maxLength={6} value={inputRoomCode} onChangeText={setInputRoomCode} />

            <TouchableOpacity activeOpacity={0.85} style={[styles.gold3DButton, { marginTop: 10, backgroundColor: '#0284c7', borderColor: '#38bdf8' }]} onPress={joinOnlineRoom}>
              <Text style={styles.gold3DButtonText}>🚪 JOIN ROOM NOW</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} style={[styles.darkSecondaryButton, { marginTop: 10 }]} onPress={() => setOnlineScreen(false)}>
              <Text style={styles.darkSecondaryButtonText}>⬅ Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (friendsModal) {
    return (
      <SafeAreaView style={styles.royaleContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0f1d" />
        <ScrollView style={{ width: '100%' }} contentContainerStyle={{ alignItems: 'center', paddingBottom: 20 }}>
          <View style={styles.brandHero}><Text style={styles.crownEmoji}>👥</Text><Text style={styles.brandGoldTitle}>FRIENDS SQUAD</Text><Text style={styles.lobbySubtitle}>Direct Live Invites</Text></View>
          <View style={[styles.glassCard, { marginTop: 12 }]}>
            <Text style={styles.inputLabel}>ADD NEW FRIEND BY ID:</Text>
            <View style={{ flexDirection: 'row' }}>
              <TextInput style={[styles.gameTextInput, { flex: 1 }]} placeholder="Enter Player ID / Email" placeholderTextColor="#64748b" value={newFriendInput} onChangeText={setNewFriendInput} />
              <TouchableOpacity style={[styles.gold3DButton, { marginLeft: 8, paddingHorizontal: 14 }]} onPress={() => {
                if (newFriendInput.trim()) {
                  setFriendsList([...friendsList, { id: Math.random().toString(), name: newFriendInput.trim(), online: true }]);
                  setNewFriendInput('');
                  Alert.alert('Friend Added!', 'Friend added to your list.');
                }
              }}>
                <Text style={styles.gold3DButtonText}>+ Add</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.orDivider}><View style={styles.dividerLine} /><Text style={styles.orText}>ONLINE FRIENDS</Text><View style={styles.dividerLine} /></View>
            {friendsList.map((friend) => (
              <View key={friend.id} style={styles.friendCardRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.onlineDot, { backgroundColor: friend.online ? '#10b981' : '#64748b' }]} />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.friendNameText}>{friend.name}</Text>
                    <Text style={styles.friendStatusText}>{friend.online ? 'Online' : 'Offline'}</Text>
                  </View>
                </View>
                <TouchableOpacity disabled={!friend.online} style={[styles.invitePillBtn, !friend.online && { opacity: 0.4 }]} onPress={() => sendFriendInvite(friend)}>
                  <Text style={styles.invitePillBtnText}>🎮 Invite</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity activeOpacity={0.85} style={[styles.darkSecondaryButton, { marginTop: 14 }]} onPress={() => setFriendsModal(false)}>
              <Text style={styles.darkSecondaryButtonText}>⬅ Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 3D ISOMETRIC DASHBOARD
  if (!gameMode) {
    return (
      <SafeAreaView style={styles.royaleContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0f1d" />

        {/* 3D Render Background Layer */}
        <View style={StyleSheet.absoluteFill}>
          <Image
            source={require('./lobby_bg.png')}
            style={styles.lobbyBgImage}
            resizeMode="cover"
          />
        </View>

        {aboutModal && (
          <Modal transparent animationType="fade" visible={aboutModal}>
            <View style={styles.inviteModalOverlay}>
              <View style={styles.glassCard}>
                <Text style={styles.cardHeading}>ℹ️ ABOUT APP</Text>
                <View style={styles.aboutCardBox}>
                  <Text style={styles.aboutGoldTitle}>LUDO SUPREME 3D</Text>
                  <Text style={styles.aboutVersionText}>Version: 1.0.0 (Royale Edition)</Text>
                  <View style={styles.dividerLine} />
                  <Text style={styles.aboutCreatorText}>App created by Rajeev Kumar sah</Text>
                  <Text style={styles.aboutContactText}>Gmail - razeevsah@gmail.com</Text>
                </View>
                <TouchableOpacity style={[styles.gold3DButton, { marginTop: 14 }]} onPress={() => setAboutModal(false)}>
                  <Text style={styles.gold3DButtonText}>CLOSE</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {incomingInvite && (
          <Modal transparent animationType="fade" visible={!!incomingInvite}>
            <View style={styles.inviteModalOverlay}>
              <View style={styles.glassCard}>
                <Text style={styles.cardHeading}>🎮 LIVE GAME INVITE!</Text>
                <Text style={styles.invitePromptText}><Text style={{ fontWeight: 'bold', color: '#facc15' }}>{incomingInvite.fromName}</Text> invited you to play!</Text>
                <TouchableOpacity style={styles.gold3DButton} onPress={acceptInvite}><Text style={styles.gold3DButtonText}>ACCEPT & PLAY NOW ➔</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.darkSecondaryButton, { marginTop: 8 }]} onPress={() => setIncomingInvite(null)}><Text style={styles.darkSecondaryButtonText}>Decline</Text></TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {/* Top Floating Control Bar */}
        <View style={styles.topTransparentBar}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity style={styles.headerActionBtn} onPress={() => setAboutModal(true)}>
              <Text style={{ fontSize: 16 }}>ℹ️</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionBtn} onPress={() => setFriendsModal(true)}>
              <Text style={styles.actionBtnText}>👥 Friends</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.headerActionBtn, { backgroundColor: '#ef4444' }]} onPress={handleLogout}>
              <Text style={styles.actionBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dynamic User Profile Overlay */}
        <View style={styles.liveUserBadgeCenter}>
          <Text style={styles.liveUserNameText}>👑 {currentUser.name}</Text>
          <Text style={styles.liveUserCoinsText}>🪙 {currentUser.coins.toLocaleString()} Coins</Text>
          <Text style={styles.liveUserIdText}>ID: {currentUser.playerId || '9575'} | Choose Arena</Text>
        </View>

        {/* Interactive 3D Island Hotspots */}
        <View style={styles.touchPodiumGrid}>
          {/* Top-Left: Vs Computer */}
          <TouchableOpacity
            activeOpacity={0.6}
            style={styles.podiumTouchSpot}
            onPress={() => {
              setActiveColors(['BLUE', 'RED', 'GREEN', 'YELLOW']);
              setPlayType('SOLO');
              setGameMode('BOT');
            }}
          />

          {/* Top-Right: Pass & Play */}
          <TouchableOpacity
            activeOpacity={0.6}
            style={styles.podiumTouchSpot}
            onPress={() => setPassPlayModal(true)}
          />

          {/* Bottom-Left: Team Up */}
          <TouchableOpacity
            activeOpacity={0.6}
            style={styles.podiumTouchSpot}
            onPress={() => setHybridTeamModal(true)}
          />

          {/* Bottom-Right: Online Arena */}
          <TouchableOpacity
            activeOpacity={0.6}
            style={styles.podiumTouchSpot}
            onPress={() => setOnlineScreen(true)}
          />
        </View>

        {/* Bottom Footer */}
        <View style={styles.bottomFooterPill}>
          <Text style={styles.footerPillText}>★ PERMANENT ACCOUNT • CLOUD BACKUP ★</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
      <View style={styles.patternBg} />

      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.exitBtn} onPress={handleExitGame}><Text style={styles.exitBtnText}>✕ Exit</Text></TouchableOpacity>
        <View style={styles.playerInfoTop}><Text style={styles.playerInfoTopText}>{playType === 'TEAM' ? '🤝 TEAM A vs TEAM B' : `👑 ${currentUser.name}`}</Text></View>
        {(gameMode === 'ONLINE' || gameMode === 'HYBRID') && (<View style={styles.roomTag}><Text style={styles.roomTagText}>Room: {roomCode}</Text></View>)}
      </View>

      <View style={styles.topCardsRow}>
        {renderPlayerCard('RED', '#e11d48', '#991b1b', false, true)}
        {renderPlayerCard('GREEN', '#16a34a', '#14532d', true, true)}
      </View>

      <View style={styles.boardContainer}>
        <View style={styles.board}>
          {renderBase('RED', styles.redBase, true)}
          {renderBase('GREEN', styles.greenBase, false)}
          {renderBase('BLUE', styles.blueBase, false)}
          {renderBase('YELLOW', styles.yellowBase, false)}

          <View style={styles.centerHome}>
            <View style={styles.triRed} />
            <View style={styles.triGreen} />
            <View style={styles.triYellow} />
            <View style={styles.triBlue} />
          </View>

          {Array.from({ length: 15 }).map((_, r) =>
            Array.from({ length: 15 }).map((_, c) => renderCell(r, c))
          )}

          {renderPlayerTokens('RED', '#e11d48', '#991b1b')}
          {renderPlayerTokens('GREEN', '#16a34a', '#14532d')}
          {renderPlayerTokens('YELLOW', '#eab308', '#a16207')}
          {renderPlayerTokens('BLUE', '#0284c7', '#0369a1')}
        </View>
      </View>

      <View style={styles.bottomCardsRow}>
        {renderPlayerCard('BLUE', '#0284c7', '#0369a1', false, false)}
        {renderPlayerCard('YELLOW', '#eab308', '#a16207', true, false)}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  royaleContainer: { flex: 1, backgroundColor: '#0a0f1d', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16 },
  lobbyBgImage: { width: '100%', height: '100%', position: 'absolute' },
  topTransparentBar: { width: '100%', flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 4, paddingTop: 4, zIndex: 20 },
  headerActionBtn: { backgroundColor: 'rgba(15, 23, 42, 0.75)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginLeft: 8, borderWidth: 1, borderColor: '#eab308' },
  actionBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 12 },
  liveUserBadgeCenter: { alignItems: 'center', marginTop: 85, zIndex: 10 },
  liveUserNameText: { color: '#ffffff', fontSize: 16, fontWeight: '900', textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
  liveUserCoinsText: { color: '#facc15', fontSize: 14, fontWeight: '800', marginTop: 2 },
  liveUserIdText: { color: '#cbd5e1', fontSize: 11, fontWeight: '600', marginTop: 48 },
  touchPodiumGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%', height: 320, paddingHorizontal: 12, marginTop: 20 },
  podiumTouchSpot: { width: '48%', height: 145, borderRadius: 24 },
  brandHero: { alignItems: 'center', marginTop: 4 },
  crownEmoji: { fontSize: 36, marginBottom: 2 },
  brandGoldTitle: { fontSize: 24, fontWeight: '900', color: '#facc15', letterSpacing: 1.5, textAlign: 'center' },
  goldPillBadge: { backgroundColor: '#78350f', borderColor: '#facc15', borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 3, marginTop: 4 },
  goldPillText: { color: '#fef08a', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  glassCard: { width: '100%', backgroundColor: '#131c31', borderRadius: 20, padding: 16, borderWidth: 1.5, borderColor: '#1e293b', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 15, elevation: 8 },
  cardHeading: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', marginBottom: 14, letterSpacing: 1 },
  inputLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '700', marginBottom: 6, letterSpacing: 0.5 },
  gameTextInput: { backgroundColor: '#0a0f1d', borderWidth: 1.5, borderColor: '#334155', borderRadius: 12, color: '#ffffff', paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, fontWeight: '600' },
  gold3DButton: { backgroundColor: '#eab308', borderColor: '#fef08a', borderWidth: 1.5, borderRadius: 14, paddingVertical: 14, alignItems: 'center', shadowColor: '#facc15', shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  gold3DButtonText: { color: '#000000', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  forgotHeaderBox: { alignItems: 'center', marginBottom: 8 },
  forgotTitle: { color: '#facc15', fontSize: 16, fontWeight: 'bold' },
  forgotSubtitle: { color: '#94a3b8', fontSize: 11, textAlign: 'center', marginTop: 2 },
  forgotLinkContainer: { alignSelf: 'flex-end', marginTop: 8, paddingVertical: 4 },
  forgotLinkText: { color: '#38bdf8', fontSize: 12, fontWeight: 'bold' },
  orDivider: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#334155', marginVertical: 6 },
  orText: { color: '#64748b', paddingHorizontal: 12, fontSize: 11, fontWeight: 'bold' },
  darkSecondaryButton: { backgroundColor: '#1e293b', borderRadius: 14, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#475569' },
  darkSecondaryButtonText: { color: '#cbd5e1', fontSize: 13, fontWeight: '700' },
  bottomFooterPill: { backgroundColor: '#131c31', borderWidth: 1, borderColor: '#334155', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 2 },
  footerPillText: { color: '#94a3b8', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  aboutCardBox: { backgroundColor: '#0a0f1d', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#334155', alignItems: 'center' },
  aboutGoldTitle: { color: '#facc15', fontSize: 18, fontWeight: '900', marginBottom: 2 },
  aboutVersionText: { color: '#94a3b8', fontSize: 12, marginBottom: 8 },
  aboutCreatorText: { color: '#ffffff', fontSize: 13, fontWeight: '700', marginTop: 6 },
  aboutContactText: { color: '#38bdf8', fontSize: 12, fontWeight: '600', marginTop: 2 },
  tabToggleRow: { flexDirection: 'row', backgroundColor: '#0a0f1d', borderRadius: 12, padding: 4, borderWidth: 1, borderColor: '#334155' },
  tabToggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabToggleActive: { backgroundColor: '#0284c7' },
  tabToggleText: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold' },
  tabToggleTextActive: { color: '#ffffff' },
  playerCountRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 },
  countPill: { flex: 1, backgroundColor: '#0a0f1d', borderWidth: 1.5, borderColor: '#334155', borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginHorizontal: 4 },
  countPillActive: { borderColor: '#10b981', backgroundColor: '#064e3b' },
  countPillText: { color: '#94a3b8', fontWeight: 'bold', fontSize: 12 },
  countPillTextActive: { color: '#ffffff' },
  teamContainerBoxA: { backgroundColor: 'rgba(2, 132, 199, 0.12)', borderWidth: 1.5, borderColor: '#0284c7', borderRadius: 14, padding: 10, marginBottom: 4 },
  teamContainerBoxB: { backgroundColor: 'rgba(225, 29, 72, 0.12)', borderWidth: 1.5, borderColor: '#e11d48', borderRadius: 14, padding: 10, marginTop: 4 },
  teamHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 },
  teamHeaderTitleA: { color: '#38bdf8', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },
  teamHeaderTitleB: { color: '#fb7185', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },
  teamBadgeA: { backgroundColor: '#0369a1', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  teamBadgeB: { backgroundColor: '#9f1239', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  teamBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: 'bold' },
  vsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 4 },
  vsLine: { flex: 1, height: 1, backgroundColor: '#334155' },
  vsCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f59e0b', justifyContent: 'center', alignItems: 'center', marginHorizontal: 8 },
  vsText: { color: '#ffffff', fontWeight: '900', fontSize: 11 },
  slotRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4, backgroundColor: '#0a0f1d', padding: 8, borderRadius: 10, borderWidth: 1, borderColor: '#334155' },
  slotColorText: { fontSize: 13, fontWeight: 'bold', width: 65 },
  slotTypeSelector: { flexDirection: 'row' },
  slotTypePill: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, backgroundColor: '#1e293b', marginLeft: 4 },
  slotTypePillActive: { backgroundColor: '#0284c7' },
  slotTypeText: { color: '#94a3b8', fontSize: 11, fontWeight: 'bold' },
  slotTypeTextActive: { color: '#ffffff' },
  slotSmallBadge: { color: '#facc15', fontSize: 8, fontWeight: 'bold', marginTop: 1 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a0f1d', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
  checkSquare: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#64748b', justifyContent: 'center', alignItems: 'center' },
  checkSquareActive: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  checkTick: { color: '#ffffff', fontWeight: '900', fontSize: 13 },
  checkboxLabel: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  helperTip: { color: '#94a3b8', fontSize: 10, marginTop: 4 },
  friendCardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0a0f1d', padding: 10, borderRadius: 12, marginVertical: 4, borderWidth: 1, borderColor: '#334155' },
  onlineDot: { width: 10, height: 10, borderRadius: 5 },
  friendNameText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  friendStatusText: { color: '#94a3b8', fontSize: 11 },
  invitePillBtn: { backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  invitePillBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 12 },
  inviteModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  invitePromptText: { color: '#ffffff', fontSize: 16, textAlign: 'center', marginBottom: 16 },
  mainContainer: { flex: 1, backgroundColor: '#1e3a8a', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  patternBg: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: '#1e40af' },
  headerBar: { width: '94%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4, zIndex: 10 },
  exitBtn: { backgroundColor: '#ef4444', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, borderWidth: 1.5, borderColor: '#ffffff' },
  exitBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  playerInfoTop: { backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  playerInfoTopText: { color: '#facc15', fontWeight: 'bold', fontSize: 13 },
  roomTag: { backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#38bdf8' },
  roomTagText: { color: '#38bdf8', fontWeight: 'bold', fontSize: 13 },
  topCardsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '94%', paddingHorizontal: 8 },
  bottomCardsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '94%', paddingHorizontal: 8 },
  cardContainerWrapper: { position: 'relative', alignItems: 'center' },
  playerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0284c7', borderWidth: 2, borderColor: '#facc15', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 },
  activeCardGlow: { borderColor: '#ffffff', elevation: 10, shadowColor: '#ffffff', shadowOpacity: 0.9, shadowRadius: 10 },
  cardDiceWrap: { marginHorizontal: 4 },
  cardAvatarLeft: { marginRight: 6, alignItems: 'center' },
  cardAvatarRight: { marginLeft: 6, alignItems: 'center' },
  floatingArrowContainer: { position: 'absolute', alignSelf: 'center', zIndex: 20 },
  arrowTopPos: { bottom: -22 },
  arrowBottomPos: { top: -22 },
  arrowIconBubble: { backgroundColor: '#f59e0b', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#ffffff' },
  arrowIconText: { color: '#ffffff', fontWeight: 'bold', fontSize: 12 },
  diceBox: { width: 44, height: 44, backgroundColor: '#ffffff', borderRadius: 8, borderWidth: 2, borderColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center', padding: 3 },
  diceDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#0f172a', margin: 1.5 },
  diceCenter: { justifyContent: 'center', alignItems: 'center' },
  diceRowSpace: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: 2 },
  diceCol: { justifyContent: 'space-between' },
  pinWrapper: { alignItems: 'center', width: 22, height: 28 },
  pinHead: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#ffffff', justifyContent: 'center', alignItems: 'center', elevation: 6 },
  pinInnerGlow: { position: 'absolute', top: 2, left: 4, width: 8, height: 5, borderRadius: 3, backgroundColor: 'rgba(255, 255, 255, 0.4)' },
  pinCenterDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ffffff', opacity: 0.9 },
  pinPointer: { width: 0, height: 0, borderLeftWidth: 4, borderRightWidth: 4, borderTopWidth: 7, borderLeftColor: 'transparent', borderRightColor: 'transparent', marginTop: -1 },
  boardContainer: { width: BOARD_SIZE, height: BOARD_SIZE, backgroundColor: '#000000', borderWidth: 2, borderColor: '#000000' },
  board: { width: '100%', height: '100%', position: 'relative', backgroundColor: '#ffffff' },
  cell: { position: 'absolute', width: CELL_SIZE, height: CELL_SIZE, borderWidth: 0.5, borderColor: '#94a3b8', justifyContent: 'center', alignItems: 'center' },
  starText: { fontSize: 14, color: '#0f172a', fontWeight: 'bold' },
  arrowText: { fontSize: 12, color: '#e11d48', fontWeight: 'bold' },
  base: { position: 'absolute', width: CELL_SIZE * 6, height: CELL_SIZE * 6, justifyContent: 'center', alignItems: 'center', padding: 10 },
  redBase: { top: 0, left: 0, backgroundColor: '#e11d48' },
  greenBase: { top: 0, right: 0, backgroundColor: '#16a34a' },
  blueBase: { bottom: 0, left: 0, backgroundColor: '#0284c7' },
  yellowBase: { bottom: 0, right: 0, backgroundColor: '#eab308' },
  baseInnerWhite: { width: '100%', height: '100%', backgroundColor: '#ffffff', borderRadius: 12, justifyContent: 'space-around', padding: 8 },
  pocketRow: { flexDirection: 'row', justifyContent: 'space-around' },
  basePocket: { width: 32, height: 32, borderRadius: 16, borderWidth: 3, backgroundColor: '#f8fafc' },
  playerLabel: { position: 'absolute', fontSize: 10, fontWeight: 'bold', color: '#0f172a' },
  playerLabelHorizontal: { bottom: 2 },
  playerLabelRotated: { left: -12, transform: [{ rotate: '-90deg' }] },
  centerHome: { position: 'absolute', top: CELL_SIZE * 6, left: CELL_SIZE * 6, width: CELL_SIZE * 3, height: CELL_SIZE * 3, overflow: 'hidden' },
  triRed: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 0, height: 0, borderTopWidth: (CELL_SIZE * 3) / 2, borderBottomWidth: (CELL_SIZE * 3) / 2, borderLeftWidth: (CELL_SIZE * 3) / 2, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: '#e11d48' },
  triGreen: { position: 'absolute', top: 0, left: 0, right: 0, width: 0, height: 0, borderLeftWidth: (CELL_SIZE * 3) / 2, borderRightWidth: (CELL_SIZE * 3) / 2, borderTopWidth: (CELL_SIZE * 3) / 2, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#16a34a' },
  triYellow: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 0, height: 0, borderTopWidth: (CELL_SIZE * 3) / 2, borderBottomWidth: (CELL_SIZE * 3) / 2, borderRightWidth: (CELL_SIZE * 3) / 2, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: '#eab308' },
  triBlue: { position: 'absolute', bottom: 0, left: 0, right: 0, width: 0, height: 0, borderLeftWidth: (CELL_SIZE * 3) / 2, borderRightWidth: (CELL_SIZE * 3) / 2, borderBottomWidth: (CELL_SIZE * 3) / 2, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#0284c7' },
  tokenWrapper: { position: 'absolute', width: CELL_SIZE, height: CELL_SIZE, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
});
