import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Linking,
    SafeAreaView,
    StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AmbulancesScreen({ route }) {
    const { location } = route.params;
    const [ambulances, setAmbulances] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAmbulances();
    }, []);

    const loadAmbulances = async () => {
        // Simuler des données d'ambulances
        const mockAmbulances = [
            { id: 1, name: 'Ambulance CHU', phone: '+261341234570', latitude: -18.8792, longitude: 47.5079, status: 'available', distance: '2.5', estimatedArrival: 8 },
            { id: 2, name: 'SAMU', phone: '+261341234571', latitude: -18.8692, longitude: 47.4979, status: 'available', distance: '3.8', estimatedArrival: 12 },
            { id: 3, name: 'Ambulance Croix Rouge', phone: '+261341234572', latitude: -18.8892, longitude: 47.5179, status: 'intervention', distance: '5.2', estimatedArrival: 20 },
        ];
        
        setAmbulances(mockAmbulances);
        setLoading(false);
    };

    const callAmbulance = (phone) => {
        Linking.openURL(`tel:${phone}`);
    };

    const sendAlert = (ambulance) => {
        Alert.alert(
            'Envoyer alerte',
            `Envoyer votre position à ${ambulance.name} ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Envoyer', onPress: () => {
                    Alert.alert('Succès', 'Alerte envoyée! Une ambulance va vous contacter');
                }}
            ]
        );
    };

    const renderAmbulance = ({ item }) => (
        <View style={styles.ambulanceCard}>
            <View style={styles.cardHeader}>
                <Text style={styles.ambulanceName}>🚑 {item.name}</Text>
                <View style={[styles.statusBadge, item.status === 'available' ? styles.available : styles.intervention]}>
                    <Text style={styles.statusText}>
                        {item.status === 'available' ? 'Disponible' : 'En intervention'}
                    </Text>
                </View>
            </View>
            
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Distance:</Text>
                <Text style={styles.infoValue}>{item.distance} km</Text>
            </View>
            
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Arrivée estimée:</Text>
                <Text style={styles.infoValue}>{item.estimatedArrival} min</Text>
            </View>
            
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={[styles.actionButton, styles.callButton]} onPress={() => callAmbulance(item.phone)}>
                    <Text style={styles.buttonText}>📞 Appeler</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.actionButton, styles.alertButton]} onPress={() => sendAlert(item)}>
                    <Text style={styles.buttonText}>🚨 Envoyer alerte</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#FF3B30" />
                <Text style={styles.loadingText}>Recherche des ambulances...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
            
            <FlatList
                data={ambulances}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderAmbulance}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>🚑 Aucune ambulance disponible</Text>
                        <Text style={styles.emptySubtext}>Veuillez réessayer dans quelques minutes</Text>
                    </View>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    listContainer: {
        padding: 15,
    },
    ambulanceCard: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    ambulanceName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 5,
    },
    available: {
        backgroundColor: '#34C759',
    },
    intervention: {
        backgroundColor: '#FF9500',
    },
    statusText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    infoLabel: {
        fontSize: 14,
        color: '#666',
    },
    infoValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    buttonContainer: {
        flexDirection: 'row',
        marginTop: 10,
        gap: 10,
    },
    actionButton: {
        flex: 1,
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    callButton: {
        backgroundColor: '#34C759',
    },
    alertButton: {
        backgroundColor: '#FF3B30',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    emptyContainer: {
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#666',
        marginBottom: 10,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
});