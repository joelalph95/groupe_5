import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Linking
} from 'react-native';

export default function HospitalCard({ hospital, onPress }) {
    const getTypeColor = (type) => {
        switch(type) {
            case 'public': return '#007AFF';
            case 'private': return '#5856D6';
            case 'csb': return '#34C759';
            default: return '#666';
        }
    };

    const getTypeIcon = (type) => {
        switch(type) {
            case 'public': return '🏥';
            case 'private': return '💊';
            case 'csb': return '🏥';
            default: return '🏥';
        }
    };

    return (
        <TouchableOpacity style={styles.container} onPress={onPress}>
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <Text style={styles.icon}>{getTypeIcon(hospital.type)}</Text>
                </View>
                <View style={styles.infoContainer}>
                    <Text style={styles.name}>{hospital.name}</Text>
                    <Text style={[styles.type, { color: getTypeColor(hospital.type) }]}>
                        {hospital.type === 'public' ? 'Hôpital Public' : 
                         hospital.type === 'private' ? 'Clinique Privée' : 'CSB'}
                    </Text>
                </View>
                <View style={styles.distanceContainer}>
                    <Text style={styles.distance}>{hospital.distance} km</Text>
                </View>
            </View>
            
            <View style={styles.details}>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>⏱️ Temps estimé:</Text>
                    <Text style={styles.detailValue}>{hospital.estimatedTime} min</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>📞 Téléphone:</Text>
                    <Text style={styles.detailValue}>{hospital.phone}</Text>
                </View>
            </View>
            
            <View style={styles.actions}>
                <TouchableOpacity 
                    style={styles.callButton}
                    onPress={() => Linking.openURL(`tel:${hospital.phone}`)}
                >
                    <Text style={styles.callButtonText}>📞 Appeler</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.navigateButton}
                    onPress={() => {}}
                >
                    <Text style={styles.navigateButtonText}>🗺️ Itinéraire</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 15,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
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
    type: {
        fontSize: 12,
    },
    distanceContainer: {
        backgroundColor: '#FF3B30',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    distance: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
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
        fontWeight: '500',
        color: '#333',
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
    },
    callButton: {
        flex: 1,
        backgroundColor: '#34C759',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    callButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    navigateButton: {
        flex: 1,
        backgroundColor: '#007AFF',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    navigateButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});