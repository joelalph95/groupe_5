import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

export default function CustomMapView({ location, hospitals, ambulances, onMarkerPress }) {
    const initialRegion = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    };

    return (
        <View style={styles.container}>
            <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={initialRegion}
                showsUserLocation={true}
                showsMyLocationButton={true}
            >
                {/* Marqueur utilisateur */}
                <Marker
                    coordinate={{
                        latitude: location.latitude,
                        longitude: location.longitude,
                    }}
                    title="Votre position"
                    pinColor="#FF3B30"
                />
                
                {/* Marqueurs hôpitaux */}
                {hospitals.map((hospital) => (
                    <Marker
                        key={`hospital-${hospital.id}`}
                        coordinate={{
                            latitude: hospital.latitude,
                            longitude: hospital.longitude,
                        }}
                        title={hospital.name}
                        description={`${hospital.distance} km - ${hospital.phone}`}
                        pinColor="#007AFF"
                        onPress={() => onMarkerPress('hospital', hospital)}
                    />
                ))}
                
                {/* Marqueurs ambulances */}
                {ambulances.map((ambulance) => (
                    <Marker
                        key={`ambulance-${ambulance.id}`}
                        coordinate={{
                            latitude: ambulance.latitude,
                            longitude: ambulance.longitude,
                        }}
                        title={ambulance.name}
                        description={`${ambulance.status} - ${ambulance.estimatedArrival} min`}
                        pinColor="#34C759"
                        onPress={() => onMarkerPress('ambulance', ambulance)}
                    />
                ))}
            </MapView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: Dimensions.get('window').height * 0.5,
        width: '100%',
    },
    map: {
        flex: 1,
    },
});