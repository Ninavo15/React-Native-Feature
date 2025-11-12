import React, { useEffect, useState } from 'react';
import {
  SafeAreaView, View, Text, TextInput, Pressable, Alert, ScrollView
} from 'react-native';
import { db } from './firebase';
import {
  addDoc, collection, onSnapshot, orderBy, query, serverTimestamp, where
} from 'firebase/firestore';

// Tap feedback helper
const tapStyle = (pressed, { bg = '#111827', bgPressed = '#0b0f18', radius = 14 }) => ([
  {
    backgroundColor: pressed ? bgPressed : bg,
    borderRadius: radius,
    transform: [{ scale: pressed ? 0.98 : 1 }],
    shadowColor: '#000',
    shadowOpacity: pressed ? 0.25 : 0.12,
    shadowRadius: pressed ? 8 : 6,
    shadowOffset: { width: 0, height: pressed ? 4 : 3 },
  }
]);

export default function App() {
  // Role chosen by buttons
  const [role, setRole] = useState('student'); // 'student' or 'staff'
  const [building, setBuilding] = useState('D102'); // student building filter

  // Student part
  const [announcements, setAnnouncements] = useState([]);

  // Staff part
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [date, setDate] = useState('MM/DD/YY');
  const [startTime, setStartTime] = useState('12:00 pm');
  const [endTime, setEndTime] = useState('3:00 pm');
  const [urgent, setUrgent] = useState(false);
  const [targetBuilding, setTargetBuilding] = useState('ALL');

  // Subscribe announcements 
  useEffect(() => {
    if (!building?.trim()) {
      setAnnouncements([]);
      return;
    }

    const buildingKey = building.trim().toUpperCase();
    const colRef = collection(db, 'announcements');
    const qRef = query(
      colRef,
      where('building', 'in', [buildingKey, 'ALL']),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(
      qRef,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAnnouncements(items);
      },
      (err) => {
        console.error('Announcements listener error:', err);
      }
    );

    return () => unsub();
  }, [building]);

  // Staff: create new announcements
  const postAnnouncement = async () => {
    const t = title.trim();
    const b = body.trim();
    const tgt = (targetBuilding || 'ALL').trim().toUpperCase();

    if (!t || !b) {
      Alert.alert('Missing', 'Please enter Title and Body.');
      return;
    }
    try {
      await addDoc(collection(db, 'announcements'), {
        title: t,
        body: b,
        building: tgt, 
        date: date.trim(),
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        urgent: !!urgent,
        createdAt: serverTimestamp(),
      });
      setTitle('');
      setBody('');
      Alert.alert('Posted', 'Announcement created successfully.');
    } catch (e) {
      console.error('addDoc failed:', e);
      Alert.alert('Error', 'Could not post the announcement. Please try again.');
    }
  };

  // UI 
  const Pill = ({ active, label, onPress }) => (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: '#1e4a6a', borderless: false }}
      style={({ pressed }) => ([
        {
          paddingVertical: 10,
          paddingHorizontal: 14,
          borderRadius: 999,
          marginRight: 10,
          borderWidth: 1,
          borderColor: active ? '#2A638C' : '#d1d5db',
          backgroundColor: pressed
            ? (active ? '#1e4a6a' : '#f0f0f0') 
            : (active ? '#2A638C' : '#ffffff'),
          transform: [{ scale: pressed ? 0.97 : 1 }],
          shadowColor: '#000',
          shadowOpacity: pressed ? 0.25 : 0.1,
          shadowRadius: pressed ? 6 : 4,
          shadowOffset: { width: 0, height: pressed ? 3 : 2 },
          elevation: pressed ? 5 : 2,
        }
      ])}
    >
      <Text style={{ fontWeight: '700', color: active ? '#fff' : '#111827' }}>
        {label}
      </Text>
    </Pressable>
  );

  const Field = ({ label, value, onChangeText, placeholder }) => (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ fontWeight: '600', marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        autoCapitalize="characters"
        style={{
          borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12,
          paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff'
        }}
      />
    </View>
  );

  const UrgentToggle = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
      <Pressable
        onPress={() => setUrgent(!urgent)}
        android_ripple={{ color: '#ffffff44' }}
        style={({ pressed }) => ({
          width: 48, height: 30, borderRadius: 999, padding: 3,
          backgroundColor: urgent ? '#ef4444' : '#d1d5db',
          justifyContent: 'center',
          transform: [{ scale: pressed ? 0.98 : 1 }],
        })}
      >
        <View style={{
          width: 24, height: 24, borderRadius: 999, backgroundColor: '#fff',
          transform: [{ translateX: urgent ? 18 : 0 }]
        }}/>
      </Pressable>
      <Text style={{ marginLeft: 10, fontWeight: '600' }}>{urgent ? 'Urgent' : 'Normal'}</Text>
    </View>
  );

  const AnnouncementCard = ({ a }) => {
    const urgentCard = a.urgent === true;
    const cardBg = urgentCard ? '#7a1f1f' : '#2f5f8b';
    const dateStr = a?.date || 'MM/DD/YY';
    const timeStr = `${a?.startTime || ''}${a?.endTime ? ` - ${a.endTime}` : ''}`;

    return (
      <View
        style={{
          backgroundColor: cardBg,
          padding: 16,
          borderRadius: 20,
          marginBottom: 14,
          shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>{a.title}</Text>
          <Text style={{ color: '#e5e7eb', fontWeight: '600' }}>{timeStr}</Text>
        </View>
        <Text style={{ color: '#e5e7eb', marginBottom: 8 }}>{dateStr}</Text>
        {!!a.body && <Text style={{ color: '#f3f4f6', marginBottom: 10 }}>{a.body}</Text>}

        {urgentCard ? (
          <View style={{ backgroundColor: '#b91c1c', alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 }}>
            <Text style={{ color: '#fff', fontWeight: '800' }}>Urgent</Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f6f7fb' }}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{
          backgroundColor: '#2f5f8b', paddingTop: 24, paddingBottom: 28,
          paddingHorizontal: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24
        }}>
          <Text style={{ color: '#d1d5db', fontWeight: '600' }}>DormMate App</Text>
          <Text style={{ color: '#f6f7fb', fontWeight: '900', fontSize: 34, marginTop: 4 }}>Announcement</Text>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 }}>
          {/* Role selector */}
          <View style={{ flexDirection: 'row', marginBottom: 12 }}>
            <Pill label="Student" active={role === 'student'} onPress={() => setRole('student')} />
            <Pill label="Staff" active={role === 'staff'} onPress={() => setRole('staff')} />
          </View>

          {role === 'student' && (
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 16 }}>
              <Text style={{ fontWeight: '800', color: '#1f2937', marginBottom: 10 }}>New Announcements</Text>

              {/* Student building filter */}
              <Field
                label="Your Building"
                value={building}
                onChangeText={setBuilding}
                placeholder="D102 or ALL"
              />

              {announcements.length === 0 ? (
                <Text style={{ color: '#6b7280' }}>No announcements yet.</Text>
              ) : (
                announcements.map((a) => <AnnouncementCard key={a.id} a={a} />)
              )}
            </View>
          )}

          {role === 'staff' && (
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 16 }}>
              <Text style={{ fontWeight: '800', color: '#1f2937', marginBottom: 10 }}>Create New Announcements</Text>

              <Field label="Title" value={title} onChangeText={setTitle} placeholder="Title of Announcement" />
              <Field label="Description" value={body} onChangeText={setBody} placeholder="Details about the announcement" />
              <View style={{ flexDirection: 'row' }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Field label="Date" value={date} onChangeText={setDate} placeholder="MM/DD/YY" />
                </View>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Field label="Start Time" value={startTime} onChangeText={setStartTime} placeholder="12:00 pm" />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="End Time" value={endTime} onChangeText={setEndTime} placeholder="3:00 pm" />
                </View>
              </View>
              <Field
                label="Target Building"
                value={targetBuilding}
                onChangeText={setTargetBuilding}
                placeholder="D102 or ALL"
              />
              <Text style={{ fontWeight: '600', marginTop: 6 }}>Urgency</Text>
              <UrgentToggle />
              <View style={{ height: 16 }} />
              <Pressable
                onPress={postAnnouncement}
                android_ripple={{ color: '#1e4a6a' }}
                style={({ pressed }) => tapStyle(pressed, { bg: '#2A638C', bgPressed: '#1e4a6a', radius: 14 })}
              >
                <View style={{ paddingVertical: 14, alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '800' }}>Post Announcement</Text>
                </View>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
