import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Linking,
    ActivityIndicator,
    TextInput,
    SafeAreaView,
    StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HospitalsScreen({ route }) {
    const { location } = route.params;
    const [hospitals, setHospitals] = useState([]);
    const [filteredHospitals, setFilteredHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');

    useEffect(() => {
        loadHospitals();
    }, []);

    useEffect(() => {
        filterHospitals();
    }, [searchQuery, filterType, hospitals]);

    const loadHospitals = async () => {
        // Simuler des données d'hôpitaux
        const mockHospitals = [
            { id: 1, name: 'CHU Antananarivo', type: 'public', phone: '+261341234567', distance: '2.5', estimatedTime: 10, latitude: -18.8792, longitude: 47.5079 },
            { id: 2, name: 'Clinique Saint Michel', type: 'private', phone: '+261341234568', distance: '3.2', estimatedTime: 12, latitude: -18.8892, longitude: 47.5179 },
            { id: 3, name: 'CSB Andoharanofotsy', type: 'csb', phone: '+261341234569', distance: '5.0', estimatedTime: 20, latitude: -18.8992, longitude: 47.5279 },
            { id: 4, name: 'Hôpital Joseph Ravoahangy', type: 'public', phone: '+261341234570', distance: '4.1', estimatedTime: 16, latitude: -18.9092, longitude: 47.5379 },
            { id: 5, name: 'Clinique La Salette', type: 'private', phone: '+261341234571', distance: '6.3', estimatedTime: 25, latitude: -18.9192, longitude: 47.5479 },
        ];
        
        setHospitals(mockHospitals);
        setFilteredHospitals(mockHospitals);
        await AsyncStorage.setItem('nearbyHospitals', JSON.stringify(mockHospitals));
        setLoading(false);
    };

    const filterHospitals = () => {
        let filtered = [...hospitals];
        
        if (filterType !== 'all') {
            filtered = filtered.filter(h => h.type === filterType);
        }
        
        if (searchQuery) {
            filtered = filtered.filter(h => 
                h.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        
        setFilteredHospitals(filtered);
    };

    const callHospital = (phone) => {
        Linking.openURL(`tel:${phone}`);
    };

    const getTypeIcon = (type) => {
        switch(type) {
            case 'public': return '🏥';
            case 'private': return '💊';
            case 'csb': return '🏥';
            default: return '🏥';
        }
    };

    const getTypeName = (type) => {
        switch(type) {
            case 'public': return 'Hôpital Public';
            case 'private': return 'Clinique Privée';
            case 'csb': return 'CSB';
            default: return 'Centre Médical';
        }
    };

    const renderHospital = ({ item }) => (
        <TouchableOpacity style={styles.hospitalCard} onPress={() => callHospital(item.phone)}>
            <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                    <Text style={styles.hospitalIcon}>{getTypeIcon(item.type)}</Text>
                    <View>
                        <Text style={styles.hospitalName}>{item.name}</Text>
                        <Text style={styles.hospitalType}>{getTypeName(item.type)}</Text>
                    </View>
                </View>
                <View style={styles.distanceBadge}>
                    <Text style={styles.distanceText}>{item.distance} km</Text>
                </View>
            </View>
            
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>⏱️ Temps estimé:</Text>
                <Text style={styles.infoValue}>{item.estimatedTime} min</Text>
            </View>
            
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>📞 Téléphone:</Text>
                <Text style={styles.infoValue}>{item.phone}</Text>
            </View>
            
            <TouchableOpacity style={styles.callButton} onPress={() => callHospital(item.phone)}>
                <Text style={styles.callButtonText}>📞 Appeler</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#FF3B30" />
                <Text style={styles.loadingText}>Recherche des hôpitaux...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
            
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Rechercher un hôpital..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>
            
            <View style={styles.filterContainer}>
                <TouchableOpacity style={[styles.filterButton, filterType === 'all' && styles.filterActive]} onPress={() => setFilterType('all')}>
                    <Text style={[styles.filterText, filterType === 'all' && styles.filterTextActive]}>Tous</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.filterButton, filterType === 'public' && styles.filterActive]} onPress={() => setFilterType('public')}>
                    <Text style={[styles.filterText, filterType === 'public' && styles.filterTextActive]}>Publics</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.filterButton, filterType === 'private' && styles.filterActive]} onPress={() => setFilterType('private')}>
                    <Text style={[styles.filterText, filterType === 'private' && styles.filterTextActive]}>Privés</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.filterButton, filterType === 'csb' && styles.filterActive]} onPress={() => setFilterType('csb')}>
                    <Text style={[styles.filterText, filterType === 'csb' && styles.filterTextActive]}>CSB</Text>
                </TouchableOpacity>
            </View>
            
            <FlatList
                data={filteredHospitals}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderHospital}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
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
    searchContainer: {
        padding: 15,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    searchInput: {
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
    },
    filterContainer: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    filterButton: {
        flex: 1,
        paddingVertical: 8,
        marginHorizontal: 5,
        borderRadius: 5,
        backgroundColor: '#F0F0F0',
        alignItems: 'center',
    },
    filterActive: {
        backgroundColor: '#FF3B30',
    },
    filterText: {
        fontSize: 12,
        color: '#666',
    },
    filterTextActive: {
        color: 'white',
        fontWeight: 'bold',
    },
    listContainer: {
        padding: 15,
    },
    hospitalCard: {
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
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    hospitalIcon: {
        fontSize: 30,
        marginRight: 10,
    },
    hospitalName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    hospitalType: {
        fontSize: 12,
        color: '#666',
    },
    distanceBadge: {
        backgroundColor: '#FF3B30',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 5,
    },
    distanceText: {
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
    callButton: {
        backgroundColor: '#34C759',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    callButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
});