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
  StatusBar
} from 'react-native';
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
const TURN_ORDER = ['BLUE', 'RED', 'GREEN', 'YELLOW'];

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
    <View style={[styles.pinHead, { borderColor: '#ffffff', backgroundColor: colorHex, shadowColor: shadowColor }]}>
      <View style={[styles.pinCenterDot, { backgroundColor: colorHex }]} />
    </View>
    <View style={[styles.pinPointer, { borderTopColor: '#ffffff' }]} />
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
  const [authInputName, setAuthInputName] = useState('');
  const [authInputPhone, setAuthInputPhone] = useState('');

  const [gameMode, setGameMode] = useState(null); 
  const [onlineScreen, setOnlineScreen] = useState(false);
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
  const currentTurn = TURN_ORDER[turnIndex];

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
    setOnlineScreen(false);
    if (ws.current) ws.current.close();
  };

  const handleExitGame = () => {
    Alert.alert(
      'Exit Game',
      'Do you want to quit this match and return to Main Menu?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Quit Match', style: 'destructive', onPress: resetGame },
      ]
    );
  };

  const handleLogin = (isGuest = false) => {
    if (isGuest) {
      const guestId = Math.floor(1000 + Math.random() * 9000);
      setCurrentUser({ name: `Guest_${guestId}`, coins: 500 });
      return;
    }
    if (!authInputName.trim()) {
      Alert.alert('Required', 'Please enter your username/name to continue.');
      return;
    }
    setCurrentUser({ name: authInputName.trim(), phone: authInputPhone, coins: 2500 });
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => { setCurrentUser(null); resetGame(); } },
    ]);
  };

  useEffect(() => {
    if (gameMode !== 'ONLINE' || !roomCode) return;
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
          const { newPawns, nextTurnIdx, updatedDices, rolled, winPlayer } = message.payload.data;
          setPawns(newPawns);
          setTurnIndex(nextTurnIdx);
          setPlayerDices(updatedDices);
          setHasRolled(rolled);
          if (winPlayer) setWinner(winPlayer);
        }
      } catch (err) {}
    };

    return () => {
      if (ws.current) ws.current.close();
    };
  }, [gameMode, roomCode]);

  const sendMultiplayerSync = (newPawns, nextTurnIdx, updatedDices, rolled, winPlayer = null) => {
    if (gameMode === 'ONLINE' && ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        topic: `realtime:room_${roomCode}`,
        event: 'broadcast',
        payload: {
          type: 'SYNC_GAME',
          data: { newPawns, nextTurnIdx, updatedDices, rolled, winPlayer }
        },
        ref: '2'
      }));
    }
  };

  useEffect(() => {
    if (gameMode === 'BOT' && currentTurn !== 'BLUE' && !hasRolled && !isRolling && !isMoving && !winner) {
      const botTimer = setTimeout(() => rollDice(true), 800);
      return () => clearTimeout(botTimer);
    }
  }, [turnIndex, hasRolled, isMoving, gameMode, winner]);

  const nextTurn = (currentIdx = turnIndex) => {
    const nextIdx = (currentIdx + 1) % 4;
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

  const rollDice = async (isBot = false) => {
    if (hasRolled || isMoving || isRolling || winner) return;
    if (gameMode === 'ONLINE' && currentTurn !== myColor) return;
    if (gameMode === 'BOT' && currentTurn === 'BLUE' && isBot) return;

    setIsRolling(true);
    playSound('dice');

    spinAnim.setValue(0);
    diceBounceAnim.setValue(1);

    Animated.parallel([
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(diceBounceAnim, { toValue: 1.2, duration: 250, useNativeDriver: true }),
        Animated.timing(diceBounceAnim, { toValue: 0.9, duration: 250, useNativeDriver: true }),
        Animated.timing(diceBounceAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ])
    ]).start();

    const shuffleDelays = [80, 90, 110, 140, 180, 220];
    for (let delay of shuffleDelays) {
      const rand = Math.floor(Math.random() * 6) + 1;
      setPlayerDices(prev => ({ ...prev, [currentTurn]: rand }));
      await sleep(delay);
    }

    const finalVal = Math.floor(Math.random() * 6) + 1;
    const newDices = { ...playerDices, [currentTurn]: finalVal };
    setPlayerDices(newDices);
    setIsRolling(false);
    setHasRolled(true);

    const validMoves = getValidMoves(currentTurn, finalVal);

    if (validMoves.length === 0) {
      setTimeout(() => {
        const nextIdx = nextTurn();
        sendMultiplayerSync(pawnsRef.current, nextIdx, newDices, false);
      }, 700);
    } else if (validMoves.length === 1 || (gameMode === 'BOT' && currentTurn !== 'BLUE')) {
      setTimeout(() => executeStepMovement(currentTurn, validMoves[0], finalVal, newDices), 450);
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
        TURN_ORDER.forEach((enemyColor) => {
          if (enemyColor !== color) {
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
        });
      }
    }

    let winPlayer = null;
    if (updatedPawns[color].every((s) => s === 56)) {
      playSound('win');
      winPlayer = color;
      setWinner(color);
      Alert.alert('VICTORY!', `${color} has won the match!`);
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

  const renderBase = (color, posStyle, label, isVertical) => (
    <View style={[styles.base, posStyle]}>
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
      <Text style={[styles.playerLabel, isVertical ? styles.playerLabelRotated : styles.playerLabelHorizontal]}>{label}</Text>
    </View>
  );

  const renderPlayerTokens = (color, colorHex, shadowColor) => {
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
    const isCurrent = currentTurn === color;
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
              <View style={styles.cardAvatarRight}><PinToken colorHex={pinHex} shadowColor={shadowHex} /></View>
            </>
          ) : (
            <>
              <View style={styles.cardAvatarLeft}><PinToken colorHex={pinHex} shadowColor={shadowHex} /></View>
              <Animated.View style={[styles.cardDiceWrap, isCurrent && { transform: [{ rotate: spinInterpolation }, { scale: diceBounceAnim }] }]}>
                <DiceFace value={playerDices[color]} />
              </Animated.View>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // 1. PREMIUM AUTH SCREEN
  if (!currentUser) {
    return (
      <SafeAreaView style={styles.royaleContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0f1d" />

        <View style={styles.brandHero}>
          <Text style={styles.crownEmoji}>👑</Text>
          <Text style={styles.brandGoldTitle}>LUDO SUPREME</Text>
          <View style={styles.goldPillBadge}>
            <Text style={styles.goldPillText}>★ ROYALE 3D EDITION ★</Text>
          </View>
        </View>

        <View style={styles.glassCard}>
          <Text style={styles.cardHeading}>PLAYER LOGIN</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>YOUR NICKNAME</Text>
            <TextInput
              style={styles.gameTextInput}
              placeholder="e.g. MasterRajeev"
              placeholderTextColor="#64748b"
              value={authInputName}
              onChangeText={setAuthInputName}
            />
          </View>

          <TouchableOpacity 
            activeOpacity={0.85}
            style={styles.gold3DButton}
            onPress={() => handleLogin(false)}
          >
            <Text style={styles.gold3DButtonText}>ENTER GAME  ➔</Text>
          </TouchableOpacity>

          <View style={styles.orDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity 
            activeOpacity={0.85}
            style={styles.darkSecondaryButton}
            onPress={() => handleLogin(true)}
          >
            <Text style={styles.darkSecondaryButtonText}>⚡ Quick Guest Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 2. PREMIUM ONLINE ROOM SCREEN
  if (onlineScreen) {
    return (
      <SafeAreaView style={styles.royaleContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0f1d" />
        
        <View style={styles.brandHero}>
          <Text style={styles.crownEmoji}>🌐</Text>
          <Text style={styles.brandGoldTitle}>PLAY WITH FRIENDS</Text>
          <View style={styles.goldPillBadge}>
            <Text style={styles.goldPillText}>MULTIPLAYER BATTLE</Text>
          </View>
        </View>
        
        <View style={styles.glassCard}>
          <TouchableOpacity 
            activeOpacity={0.85}
            style={[styles.mode3DCard, { borderColor: '#10b981', backgroundColor: '#064e3b' }]}
            onPress={() => {
              const code = Math.floor(1000 + Math.random() * 9000).toString();
              setRoomCode(code);
              setMyColor('BLUE');
              setGameMode('ONLINE');
              setOnlineScreen(false);
              Alert.alert('Room Created!', `Share Room Code: ${code} with your friend.`);
            }}
          >
            <View style={styles.modeIconCircle}><Text style={styles.modeIcon}>➕</Text></View>
            <View style={styles.modeTextWrap}>
              <Text style={styles.modeCardTitle}>Create Private Room</Text>
              <Text style={styles.modeCardSub}>Generate code & invite your friend</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.orDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.orText}>JOIN ROOM</Text>
            <View style={styles.dividerLine} />
          </View>

          <TextInput
            style={[styles.gameTextInput, { textAlign: 'center', fontSize: 20, letterSpacing: 4 }]}
            placeholder="ENTER 4-DIGIT CODE"
            placeholderTextColor="#64748b"
            keyboardType="number-pad"
            maxLength={6}
            value={inputRoomCode}
            onChangeText={setInputRoomCode}
          />

          <TouchableOpacity 
            activeOpacity={0.85}
            style={[styles.gold3DButton, { marginTop: 12 }]} 
            onPress={() => {
              if (inputRoomCode.trim().length >= 3) {
                setRoomCode(inputRoomCode.trim());
                setMyColor('RED');
                setGameMode('ONLINE');
                setOnlineScreen(false);
              } else {
                Alert.alert('Invalid Code', 'Please enter a valid 4-digit code');
              }
            }}
          >
            <Text style={styles.gold3DButtonText}>JOIN ROOM NOW ➔</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.85}
            style={[styles.darkSecondaryButton, { marginTop: 12 }]} 
            onPress={() => setOnlineScreen(false)}
          >
            <Text style={styles.darkSecondaryButtonText}>⬅ Back To Lobby</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 3. MAIN GAME MODE LOBBY SCREEN
  if (!gameMode) {
    return (
      <SafeAreaView style={styles.royaleContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0f1d" />

        <View style={styles.topProfileHeader}>
          <View style={styles.profileLeftGroup}>
            <View style={styles.profileAvatarGlow}>
              <Text style={styles.profileAvatarIcon}>👑</Text>
            </View>
            <View>
              <Text style={styles.profileUserName}>{currentUser.name}</Text>
              <View style={styles.coinBadge}>
                <Text style={styles.coinIcon}>🪙</Text>
                <Text style={styles.coinAmount}>{currentUser.coins.toLocaleString()}</Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity style={styles.logoutPill} onPress={handleLogout}>
            <Text style={styles.logoutPillText}>Logout ✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.lobbyCenterTitle}>
          <Text style={styles.brandGoldTitleSmall}>CHOOSE GAME MODE</Text>
          <Text style={styles.lobbySubtitle}>Select an arena to roll the dice</Text>
        </View>

        <View style={styles.modeList}>
          <TouchableOpacity 
            activeOpacity={0.85}
            style={[styles.mode3DCard, { borderColor: '#38bdf8', backgroundColor: '#0c4a6e' }]}
            onPress={() => setGameMode('BOT')}
          >
            <View style={[styles.modeIconCircle, { backgroundColor: '#0284c7' }]}>
              <Text style={styles.modeIcon}>🤖</Text>
            </View>
            <View style={styles.modeTextWrap}>
              <Text style={styles.modeCardTitle}>Play Vs Computer</Text>
              <Text style={styles.modeCardSub}>Practice matches offline</Text>
            </View>
            <Text style={styles.arrowChevron}>➔</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.85}
            style={[styles.mode3DCard, { borderColor: '#4ade80', backgroundColor: '#14532d' }]}
            onPress={() => setGameMode('OFFLINE')}
          >
            <View style={[styles.modeIconCircle, { backgroundColor: '#16a34a' }]}>
              <Text style={styles.modeIcon}>👥</Text>
            </View>
            <View style={styles.modeTextWrap}>
              <Text style={styles.modeCardTitle}>Pass & Play (4P)</Text>
              <Text style={styles.modeCardSub}>Single device local multiplayer</Text>
            </View>
            <Text style={styles.arrowChevron}>➔</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.85}
            style={[styles.mode3DCard, { borderColor: '#c084fc', backgroundColor: '#581c87' }]}
            onPress={() => setOnlineScreen(true)}
          >
            <View style={[styles.modeIconCircle, { backgroundColor: '#9333ea' }]}>
              <Text style={styles.modeIcon}>🌐</Text>
            </View>
            <View style={styles.modeTextWrap}>
              <Text style={styles.modeCardTitle}>Online Multiplayer</Text>
              <Text style={styles.modeCardSub}>Play with friends with room code</Text>
            </View>
            <Text style={styles.arrowChevron}>➔</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
      <View style={styles.patternBg} />

      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.exitBtn} onPress={handleExitGame}>
          <Text style={styles.exitBtnText}>✕ Exit</Text>
        </TouchableOpacity>
        
        <View style={styles.playerInfoTop}>
          <Text style={styles.playerInfoTopText}>👑 {currentUser.name}</Text>
        </View>

        {gameMode === 'ONLINE' && (
          <View style={styles.roomTag}>
            <Text style={styles.roomTagText}>Room: {roomCode}</Text>
          </View>
        )}
      </View>

      <View style={styles.topCardsRow}>
        {renderPlayerCard('RED', '#e11d48', '#991b1b', false, true)}
        {renderPlayerCard('GREEN', '#16a34a', '#14532d', true, true)}
      </View>

      <View style={styles.boardContainer}>
        <View style={styles.board}>
          {renderBase('RED', styles.redBase, 'Player 2', true)}
          {renderBase('GREEN', styles.greenBase, 'Player 3', false)}
          {renderBase('BLUE', styles.blueBase, currentUser.name, false)}
          {renderBase('YELLOW', styles.yellowBase, 'Player 4', false)}

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
  royaleContainer: {
    flex: 1,
    backgroundColor: '#0a0f1d',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  brandHero: {
    alignItems: 'center',
    marginTop: 10,
  },
  crownEmoji: {
    fontSize: 42,
    marginBottom: 4,
  },
  brandGoldTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#facc15',
    letterSpacing: 2,
    textShadowColor: 'rgba(250, 204, 21, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  brandGoldTitleSmall: {
    fontSize: 22,
    fontWeight: '900',
    color: '#facc15',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  goldPillBadge: {
    backgroundColor: '#78350f',
    borderColor: '#facc15',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginTop: 6,
  },
  goldPillText: {
    color: '#fef08a',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  glassCard: {
    width: '100%',
    backgroundColor: '#131c31',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1.5,
    borderColor: '#1e293b',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
  },
  cardHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 18,
    letterSpacing: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  gameTextInput: {
    backgroundColor: '#0a0f1d',
    borderWidth: 1.5,
    borderColor: '#334155',
    borderRadius: 12,
    color: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  gold3DButton: {
    backgroundColor: '#eab308',
    borderColor: '#fef08a',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#facc15',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  gold3DButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#334155',
  },
  orText: {
    color: '#64748b',
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: 'bold',
  },
  darkSecondaryButton: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  darkSecondaryButtonText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '700',
  },
  topProfileHeader: {
    width: '100%',
    backgroundColor: '#131c31',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  profileLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatarGlow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1e293b',
    borderWidth: 1.5,
    borderColor: '#facc15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileAvatarIcon: {
    fontSize: 22,
  },
  profileUserName: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  coinIcon: {
    fontSize: 13,
    marginRight: 4,
  },
  coinAmount: {
    color: '#facc15',
    fontWeight: '800',
    fontSize: 13,
  },
  logoutPill: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutPillText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  lobbyCenterTitle: {
    alignItems: 'center',
    marginVertical: 10,
  },
  lobbySubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 4,
  },
  modeList: {
    width: '100%',
  },
  mode3DCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  modeIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  modeIcon: {
    fontSize: 24,
  },
  modeTextWrap: {
    flex: 1,
  },
  modeCardTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modeCardSub: {
    color: '#e2e8f0',
    fontSize: 12,
    marginTop: 2,
    opacity: 0.8,
  },
  arrowChevron: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#1e3a8a',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  patternBg: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1e40af',
  },
  headerBar: {
    width: '94%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
    zIndex: 10,
  },
  exitBtn: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  exitBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  playerInfoTop: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  playerInfoTopText: {
    color: '#facc15',
    fontWeight: 'bold',
    fontSize: 13,
  },
  roomTag: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  roomTagText: {
    color: '#38bdf8',
    fontWeight: 'bold',
    fontSize: 13,
  },
  topCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '94%',
    paddingHorizontal: 8,
  },
  bottomCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '94%',
    paddingHorizontal: 8,
  },
  cardContainerWrapper: {
    position: 'relative',
    alignItems: 'center',
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    borderWidth: 2,
    borderColor: '#facc15',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  activeCardGlow: {
    borderColor: '#ffffff',
    elevation: 10,
    shadowColor: '#ffffff',
    shadowOpacity: 0.9,
    shadowRadius: 10,
  },
  cardDiceWrap: {
    marginHorizontal: 4,
  },
  cardAvatarLeft: {
    marginRight: 6,
  },
  cardAvatarRight: {
    marginLeft: 6,
  },
  floatingArrowContainer: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 20,
  },
  arrowTopPos: {
    bottom: -22,
  },
  arrowBottomPos: {
    top: -22,
  },
  arrowIconBubble: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  arrowIconText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  diceBox: {
    width: 44,
    height: 44,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 3,
  },
  diceDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#0f172a',
    margin: 1.5,
  },
  diceCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  diceRowSpace: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 2,
  },
  diceCol: {
    justifyContent: 'space-between',
  },
  pinWrapper: {
    alignItems: 'center',
    width: 22,
    height: 28,
  },
  pinHead: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  pinCenterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pinPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
  boardContainer: {
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#000000',
  },
  board: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: '#ffffff',
  },
  cell: {
    position: 'absolute',
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderWidth: 0.5,
    borderColor: '#94a3b8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  starText: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: 'bold',
  },
  arrowText: {
    fontSize: 12,
    color: '#e11d48',
    fontWeight: 'bold',
  },
  base: {
    position: 'absolute',
    width: CELL_SIZE * 6,
    height: CELL_SIZE * 6,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  redBase: { top: 0, left: 0, backgroundColor: '#e11d48' },
  greenBase: { top: 0, right: 0, backgroundColor: '#16a34a' },
  blueBase: { bottom: 0, left: 0, backgroundColor: '#0284c7' },
  yellowBase: { bottom: 0, right: 0, backgroundColor: '#eab308' },
  baseInnerWhite: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    justifyContent: 'space-around',
    padding: 8,
  },
  pocketRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  basePocket: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    backgroundColor: '#f8fafc',
  },
  playerLabel: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  playerLabelHorizontal: {
    bottom: 2,
  },
  playerLabelRotated: {
    left: -12,
    transform: [{ rotate: '-90deg' }],
  },
  centerHome: {
    position: 'absolute',
    top: CELL_SIZE * 6,
    left: CELL_SIZE * 6,
    width: CELL_SIZE * 3,
    height: CELL_SIZE * 3,
    overflow: 'hidden',
  },
  triRed: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 0,
    height: 0,
    borderTopWidth: (CELL_SIZE * 3) / 2,
    borderBottomWidth: (CELL_SIZE * 3) / 2,
    borderLeftWidth: (CELL_SIZE * 3) / 2,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#e11d48',
  },
  triGreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
    borderLeftWidth: (CELL_SIZE * 3) / 2,
    borderRightWidth: (CELL_SIZE * 3) / 2,
    borderTopWidth: (CELL_SIZE * 3) / 2,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#16a34a',
  },
  triYellow: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 0,
    height: 0,
    borderTopWidth: (CELL_SIZE * 3) / 2,
    borderBottomWidth: (CELL_SIZE * 3) / 2,
    borderRightWidth: (CELL_SIZE * 3) / 2,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: '#eab308',
  },
  triBlue: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
    borderLeftWidth: (CELL_SIZE * 3) / 2,
    borderRightWidth: (CELL_SIZE * 3) / 2,
    borderBottomWidth: (CELL_SIZE * 3) / 2,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#0284c7',
  },
  tokenWrapper: {
    position: 'absolute',
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});
