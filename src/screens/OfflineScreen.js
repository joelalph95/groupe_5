import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Linking,
    ScrollView,
    SafeAreaView,
    StatusBar,
    Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OfflineScreen() {
    const [emergencyNumbers, setEmergencyNumbers] = useState([
        { name: 'SAMU - Urgences médicales', number: '+261341234570', icon: '🚑' },
        { name: 'Police Secours', number: '117', icon: '👮' },
        { name: 'Pompiers', number: '118', icon: '🔥' },
        { name: 'Centre Anti-Poison', number: '+261341234573', icon: '⚠️' },
    ]);
    
    const [nearbyHospitals, setNearbyHospitals] = useState([]);

    useEffect(() => {
        loadOfflineData();
    }, []);

    const loadOfflineData = async () => {
        const hospitals = await AsyncStorage.getItem('nearbyHospitals');
        if (hospitals) {
            setNearbyHospitals(JSON.parse(hospitals).slice(0, 3));
        }
    };

    const callNumber = (number) => {
        Linking.openURL(`tel:${number}`);
    };

    const sendBip = (number) => {
        Alert.alert(
            'Mode BIP',
            `Appeler ${number} et raccrocher? Ils vous rappelleront`,
            [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Envoyer BIP', onPress: () => {
                    Linking.openURL(`tel:${number}`);
                    setTimeout(() => {
                        Alert.alert('BIP envoyé', 'Vous serez rappelé dans quelques minutes');
                    }, 1000);
                }}
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#FF9500" />
            
            <View style={styles.header}>
                <Text style={styles.headerTitle}>📡 Mode Hors-ligne</Text>
                <Text style={styles.headerSubtitle}>
                    Numéros d'urgence disponibles sans internet
                </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🚨 Numéros d'urgence nationaux</Text>
                    {emergencyNumbers.map((item, index) => (
                        <TouchableOpacity key={index} style={styles.emergencyCard} onPress={() => callNumber(item.number)}>
                            <Text style={styles.emergencyIcon}>{item.icon}</Text>
                            <View style={styles.emergencyInfo}>
                                <Text style={styles.emergencyName}>{item.name}</Text>
                                <Text style={styles.emergencyNumber}>{item.number}</Text>
                            </View>
                            <TouchableOpacity style={styles.bipButton} onPress={() => sendBip(item.number)}>
                                <Text style={styles.bipText}>BIP</Text>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    ))}
                </View>

                {nearbyHospitals.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>🏥 Hôpitaux à proximité</Text>
                        {nearbyHospitals.map((hospital, index) => (
                            <TouchableOpacity key={index} style={styles.hospitalCard} onPress={() => callNumber(hospital.phone)}>
                                <Text style={styles.hospitalName}>{hospital.name}</Text>
                                <Text style={styles.hospitalDistance}>{hospital.distance} km</Text>
                                <Text style={styles.hospitalPhone}>{hospital.phone}</Text>
                                <TouchableOpacity style={styles.callButton} onPress={() => callNumber(hospital.phone)}>
                                    <Text style={styles.callButtonText}>📞 Appeler</Text>
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>💡 Conseils hors-ligne</Text>
                    <View style={styles.tipCard}>
                        <Text style={styles.tipText}>📱 Activez le mode BIP pour être rappelé</Text>
                        <Text style={styles.tipText}>📍 Notez votre position actuelle</Text>
                        <Text style={styles.tipText}>🔋 Gardez votre batterie chargée</Text>
                        <Text style={styles.tipText}>📝 Ayez vos médicaments à portée</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        backgroundColor: '#FF9500',
        padding: 20,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'white',
        marginTop: 5,
    },
    section: {
        margin: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    emergencyCard: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2,
    },
    emergencyIcon: {
        fontSize: 30,
        marginRight: 15,
    },
    emergencyInfo: {
        flex: 1,
    },
    emergencyName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    emergencyNumber: {
        fontSize: 14,
        color: '#666',
    },
    bipButton: {
        backgroundColor: '#FF9500',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 5,
    },
    bipText: {
        color: 'white',
        fontWeight: 'bold',
    },
    hospitalCard: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        elevation: 2,
    },
    hospitalName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    hospitalDistance: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    hospitalPhone: {
        fontSize: 14,
        color: '#007AFF',
        marginBottom: 10,
    },
    callButton: {
        backgroundColor: '#34C759',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    callButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    tipCard: {
        backgroundColor: '#E3F2FD',
        borderRadius: 10,
        padding: 15,
    },
    tipText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 8,
    },
});