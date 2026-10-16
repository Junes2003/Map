
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { db } from './firebaseConfig';
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';

export default function App() {
  const [markers, setMarkers] = useState([]);

  const myRegion = {
    latitude: 55.3,
    longitude: 12,
    latitudeDelta: 0.8,
    longitudeDelta: 0.8,
  };

  // Hent markører fra Firebase
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'markers'),
      (snapshot) => {
        const savedMarkers = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setMarkers(savedMarkers);
      },
      (error) => {
        Alert.alert('Firebase-fejl', error.message);
      }
    );

    return unsubscribe;
  }, []);

  // Find nærmeste fodboldklub eller fodboldbane
  async function findFootballClub(latitude, longitude) {
    try {
      const query = `
        [out:json][timeout:15];
        (
          node["sport"="soccer"](around:10000,${latitude},${longitude});
          way["sport"="soccer"](around:10000,${latitude},${longitude});
          relation["sport"="soccer"](around:10000,${latitude},${longitude});
        );
        out center tags;
      `;

      const url =
        'https://overpass-api.de/api/interpreter?data=' +
        encodeURIComponent(query);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Kunne ikke hente kortdata.');
      }

      const data = await response.json();

      const clubs = data.elements
        .filter((item) => item.tags?.name)
        .map((item) => {
          const lat = item.lat ?? item.center?.lat;
          const lon = item.lon ?? item.center?.lon;

          const distance = Math.round(
            Math.hypot(
              (lat - latitude) * 111320,
              (lon - longitude) *
                111320 *
                Math.cos((latitude * Math.PI) / 180)
            )
          );

          return {
            name: item.tags.name,
            distance,
          };
        })
        .sort((a, b) => a.distance - b.distance);

      if (clubs.length > 0) {
        Alert.alert(
          'Nærmeste fodboldsted ⚽',
          `${clubs[0].name}\nCa. ${clubs[0].distance} meter væk`
        );
      } else {
        Alert.alert(
          'Ingen klub fundet',
          'Der blev ikke fundet et registreret fodboldsted inden for 10 km.'
        );
      }
    } catch (error) {
      Alert.alert(
        'Søgefejl',
        'Kunne ikke finde fodboldsteder lige nu. Prøv igen senere.'
      );
    }
  }

  // Gem lokation i Firebase og find nærmeste fodboldsted
  async function longPress(e) {
    const marker = e.nativeEvent.coordinate;

    try {
      await addDoc(collection(db, 'markers'), {
        latitude: marker.latitude,
        longitude: marker.longitude,
        createdAt: serverTimestamp(),
      });

      Alert.alert('Gemt!', 'Lokationen er gemt i Firebase.');

      findFootballClub(marker.latitude, marker.longitude);
    } catch (error) {
      Alert.alert('Firebase-fejl', error.message);
    }
  }

  function markerOnPress(e) {
    Alert.alert('Markør her', 'Denne lokation er gemt i Firebase.');
  }

  return (
    <View style={styles.container}>
      <MapView
        region={myRegion}
        style={styles.map}
        onLongPress={longPress}
      >
        {markers.map((m) => (
          <Marker
            coordinate={{
              latitude: m.latitude,
              longitude: m.longitude,
            }}
            key={m.id}
            onPress={markerOnPress}
          />
        ))}

        <Marker
          coordinate={{
            latitude: 55.5,
            longitude: 12,
          }}
        />
      </MapView>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});
