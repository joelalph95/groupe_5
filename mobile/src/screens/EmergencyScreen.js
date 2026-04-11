import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Linking,
    TextInput,
    ScrollView,
    SafeAreaView,
    StatusBar
} from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function EmergencyScreen({ route, navigation }) {
    const { location } = route.params;
    const [patientName, setPatientName] = useState('');
    const [nearbyHospital, setNearbyHospital] = useState(null);
    const [countdown, setCountdown] = useState(0);

    useEffect(() => {
        loadPatientName();
        findNearestHospital();
    }, []);

    const loadPatientName = async () => {
        const name = await AsyncStorage.getItem('patientName');
        if (name) setPatientName(name);
    };

    const findNearestHospital = async () => {
        const hospitals = await AsyncStorage.getItem('nearbyHospitals');
        if (hospitals) {
            const parsed = JSON.parse(hospitals);
            if (parsed.length > 0) {
                setNearbyHospital(parsed[0]);
            }
        }
    };

    const handleCallAmbulance = () => {
        const ambulanceNumber = '+261341234570';
        Linking.openURL(`tel:${ambulanceNumber}`);
    };

    const handleCallHospital = () => {
        if (nearbyHospital) {
            Linking.openURL(`tel:${nearbyHospital.phone}`);
        } else {
            Alert.alert('Info', 'Aucun hôpital trouvé, appelez le 117');
            Linking.openURL('tel:117');
        }
    };

    const handleSendAlert = async () => {
        if (!patientName) {
            Alert.alert('Info', 'Veuillez entrer votre nom');
            return;
        }

        Alert.alert(
            'Alerte envoyée!',
            'Les secours ont été notifiés avec votre position',
            [{ text: 'OK', onPress: () => startCountdown() }]
        );
    };

    const startCountdown = () => {
        setCountdown(10);
        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleBipMode = () => {
        Alert.alert(
            'Mode BIP',
            'Appeler le centre médical et raccrocher? Ils vous rappelleront',
            [
                { text: 'Annuler', style: 'cancel' },
                { 
                    text: 'BIP', 
                    onPress: () => {
                        Linking.openURL('tel:+261341234571');
                        setTimeout(() => {
                            Alert.alert('BIP envoyé', 'Le centre médical va vous rappeler');
                        }, 1000);
                    }
                }
            ]
        );
    };

    const handleCallTransporter = () => {
        Alert.alert(
            'Transporteur rural',
            'Appeler un taxi-brousse pour vous transporter?',
            [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Appeler', onPress: () => Linking.openURL('tel:+261341234572') }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#FF3B30" />
            
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>🚨 URGENCE</Text>
                    <Text style={styles.headerSubtitle}>Restez calme, les secours arrivent</Text>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Nom du patient:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Votre nom"
                        value={patientName}
                        onChangeText={setPatientName}
                    />
                </View>

                {countdown > 0 && (
                    <View style={styles.countdownContainer}>
                        <Text style={styles.countdownText}>
                            Les secours arrivent dans {countdown} minutes
                        </Text>
                    </View>
                )}

                <View style={styles.buttonGroup}>
                    <TouchableOpacity 
                        style={[styles.button, styles.ambulanceButton]}
                        onPress={handleCallAmbulance}
                    >
                        <Text style={styles.buttonIcon}>🚑</Text>
                        <Text style={styles.buttonText}>Appeler Ambulance</Text>
                        <Text style={styles.buttonSubtext}>SAMU - 24h/24</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.button, styles.hospitalButton]}
                        onPress={handleCallHospital}
                    >
                        <Text style={styles.buttonIcon}>🏥</Text>
                        <Text style={styles.buttonText}>Appeler Hôpital</Text>
                        <Text style={styles.buttonSubtext}>
                            {nearbyHospital ? nearbyHospital.name : 'Hôpital le plus proche'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.button, styles.alertButton]}
                        onPress={handleSendAlert}
                    >
                        <Text style={styles.buttonIcon}>📱</Text>
                        <Text style={styles.buttonText}>Envoyer Alerte SMS</Text>
                        <Text style={styles.buttonSubtext}>Avec votre position GPS</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.button, styles.bipButton]}
                        onPress={handleBipMode}
                    >
                        <Text style={styles.buttonIcon}>📡</Text>
                        <Text style={styles.buttonText}>Mode BIP</Text>
                        <Text style={styles.buttonSubtext}>Sans connexion internet</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.button, styles.transporterButton]}
                        onPress={handleCallTransporter}
                    >
                        <Text style={styles.buttonIcon}>🚗</Text>
                        <Text style={styles.buttonText}>Transporteur Rural</Text>
                        <Text style={styles.buttonSubtext}>Zones sans ambulance</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.infoBox}>
                    <Text style={styles.infoTitle}>⚠️ Conseils importants:</Text>
                    <Text style={styles.infoText}>1. Restez calme et allongez le patient</Text>
                    <Text style={styles.infoText}>2. Ne donnez pas de médicaments sans avis médical</Text>
                    <Text style={styles.infoText}>3. Gardez le téléphone à portée de main</Text>
                    <Text style={styles.infoText}>4. Préparez les documents médicaux</Text>
                </View>

                <View style={styles.locationBox}>
                    <Text style={styles.locationTitle}>📍 Votre position:</Text>
                    <Text style={styles.locationText}>Lat: {location.latitude.toFixed(6)}</Text>
                    <Text style={styles.locationText}>Lon: {location.longitude.toFixed(6)}</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF5F5',
    },
    header: {
        backgroundColor: '#FF3B30',
        padding: 20,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'white',
        marginTop: 5,
    },
    inputContainer: {
        padding: 15,
        backgroundColor: 'white',
        margin: 15,
        borderRadius: 10,
        elevation: 2,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    input: {
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
    },
    countdownContainer: {
        backgroundColor: '#34C759',
        margin: 15,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    countdownText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    buttonGroup: {
        padding: 15,
    },
    button: {
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2,
    },
    ambulanceButton: {
        backgroundColor: '#FF3B30',
    },
    hospitalButton: {
        backgroundColor: '#007AFF',
    },
    alertButton: {
        backgroundColor: '#5856D6',
    },
    bipButton: {
        backgroundColor: '#FF9500',
    },
    transporterButton: {
        backgroundColor: '#34C759',
    },
    buttonIcon: {
        fontSize: 30,
        marginRight: 15,
    },
    buttonText: {
        flex: 1,
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
    buttonSubtext: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
    },
    infoBox: {
        backgroundColor: '#FFE5E5',
        margin: 15,
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FF3B30',
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF3B30',
        marginBottom: 10,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    locationBox: {
        backgroundColor: '#F0F0F0',
        margin: 15,
        padding: 15,
        borderRadius: 10,
        marginBottom: 30,
    },
    locationTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    locationText: {
        fontSize: 12,
        color: '#666',
    },
});