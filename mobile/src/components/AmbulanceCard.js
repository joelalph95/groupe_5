import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Linking
} from 'react-native';

export default function AmbulanceCard({ ambulance, onCall, onAlert }) {
    const getStatusColor = (status) => {
        return status === 'available' ? '#34C759' : '#FF9500';
    };

    const getStatusText = (status) => {
        return status === 'available' ? 'Disponible' : 'En intervention';
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <Text style={styles.icon}>🚑</Text>
                </View>
                <View style={styles.infoContainer}>
                    <Text style={styles.name}>{ambulance.name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ambulance.status) }]}>
                        <Text style={styles.statusText}>{getStatusText(ambulance.status)}</Text>
                    </View>
                </View>
            </View>
            
            <View style={styles.details}>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>📏 Distance:</Text>
                    <Text style={styles.detailValue}>{ambulance.distance} km</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>⏱️ Arrivée estimée:</Text>
                    <Text style={styles.detailValue}>{ambulance.estimatedArrival} min</Text>
                </View>
            </View>
            
            <View style={styles.actions}>
                <TouchableOpacity 
                    style={[styles.actionButton, styles.callButton]}
                    onPress={() => Linking.openURL(`tel:${ambulance.phone}`)}
                >
                    <Text style={styles.buttonText}>📞 Appeler</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.actionButton, styles.alertButton]}
                    onPress={() => onAlert(ambulance)}
                >
                    <Text style={styles.buttonText}>🚨 Alerte</Text>
                </TouchableOpacity>
            </View>
            
            {ambulance.status === 'intervention' && (
                <View style={styles.warningContainer}>
                    <Text style={styles.warningText}>
                        ⚠️ Cette ambulance est actuellement en intervention
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 15,
        marginBottom: 12,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconContainer: {
        marginRight: 12,
    },
    icon: {
        fontSize: 32,
    },
    infoContainer: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusText: {
        color: 'white',
        fontSize: 11,
        fontWeight: 'bold',
    },
    details: {
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingTop: 12,
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    detailLabel: {
        fontSize: 13,
        color: '#666',
    },
    detailValue: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#333',
    },
    actions: {
        flexDirection: 'row',
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
    warningContainer: {
        marginTop: 10,
        padding: 8,
        backgroundColor: '#FFE5E5',
        borderRadius: 6,
    },
    warningText: {
        fontSize: 12,
        color: '#FF3B30',
        textAlign: 'center',
    },
});