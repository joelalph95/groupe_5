import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    SafeAreaView,
    StatusBar,
    Linking,
    Alert
} from 'react-native';

export default function PharmacyScreen({ navigation }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTab, setSelectedTab] = useState('medicines');
    const [medicines, setMedicines] = useState([
        { id: 1, name: 'Paracétamol 500mg', price: 2000, stock: true, image: '💊', description: 'Antidouleur et antipyrétique' },
        { id: 2, name: 'Amoxicilline 500mg', price: 3500, stock: true, image: '💊', description: 'Antibiotique' },
        { id: 3, name: 'Vitamine C 1000mg', price: 1500, stock: true, image: '🍊', description: 'Complément alimentaire' },
        { id: 4, name: 'Ibuprofène 400mg', price: 2500, stock: false, image: '💊', description: 'Anti-inflammatoire' },
        { id: 5, name: 'Aspirine 500mg', price: 1800, stock: true, image: '💊', description: 'Anticoagulant' },
        { id: 6, name: 'Sirop Toux', price: 4500, stock: true, image: '🍯', description: 'Toux sèche et grasse' },
    ]);

    const [pharmacies, setPharmacies] = useState([
        { id: 1, name: 'Pharmacie Centrale', distance: '500m', phone: '+261341234567', openingHours: '08:00-20:00', stock: true, available: true },
        { id: 2, name: 'Pharmacie Santé Plus', distance: '1.2km', phone: '+261341234568', openingHours: '24h/24', stock: true, available: true },
        { id: 3, name: 'Pharmacie Express', distance: '2km', phone: '+261341234569', openingHours: '09:00-18:00', stock: false, available: false },
    ]);

    const [csbList, setCsbList] = useState([
        { id: 1, name: 'CSB Andoharanofotsy', distance: '1.5km', phone: '+261341234570', emergency: true, available24h: true },
        { id: 2, name: 'CSB Ambohidratrimo', distance: '3km', phone: '+261341234571', emergency: true, available24h: false },
        { id: 3, name: 'CSB Ankadindramamy', distance: '4km', phone: '+261341234572', emergency: false, available24h: true },
    ]);

    const [ambulances, setAmbulances] = useState([
        { id: 1, name: 'Ambulance CHU', distance: '2km', phone: '+261341234573', status: 'available', estimatedTime: '10 min' },
        { id: 2, name: 'SAMU', distance: '3.5km', phone: '+261341234574', status: 'available', estimatedTime: '15 min' },
        { id: 3, name: 'Croix Rouge', distance: '5km', phone: '+261341234575', status: 'intervention', estimatedTime: '25 min' },
    ]);

    const filteredMedicines = medicines.filter(med => 
        med.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredPharmacies = pharmacies.filter(pharm => 
        pharm.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredCsb = csbList.filter(csb => 
        csb.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredAmbulances = ambulances.filter(amb => 
        amb.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const callNumber = (phone) => {
        Linking.openURL(`tel:${phone}`);
    };

    const openMaps = (name, distance) => {
        Alert.alert(
            'Itinéraire',
            `Voulez-vous voir l'itinéraire vers ${name} ? (Distance: ${distance})`,
            [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Ouvrir Maps', onPress: () => {
                    Linking.openURL(`https://maps.google.com/?q=${name}`);
                }}
            ]
        );
    };

    const renderMedicineItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.itemCard}
            onPress={() => navigation.navigate('MedicineDetail', { medicine: item })}
        >
            <View style={styles.itemIcon}>
                <Text style={styles.iconText}>{item.image}</Text>
            </View>
            <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDescription}>{item.description}</Text>
                <Text style={styles.itemPrice}>{item.price} Ar</Text>
            </View>
            <View style={[styles.stockBadge, item.stock ? styles.inStock : styles.outStock]}>
                <Text style={styles.stockText}>
                    {item.stock ? 'Disponible' : 'Rupture'}
                </Text>
            </View>
        </TouchableOpacity>
    );

    const renderPharmacyItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.itemCard}
            onPress={() => openMaps(item.name, item.distance)}
        >
            <View style={styles.itemIcon}>
                <Text style={styles.iconText}>🏪</Text>
            </View>
            <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDescription}>Distance: {item.distance}</Text>
                <Text style={styles.itemDescription}>Horaires: {item.openingHours}</Text>
            </View>
            <View style={styles.buttonGroup}>
                <TouchableOpacity 
                    style={[styles.smallButton, styles.callButton]}
                    onPress={() => callNumber(item.phone)}
                >
                    <Text style={styles.smallButtonText}>📞</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.smallButton, styles.mapsButton]}
                    onPress={() => openMaps(item.name, item.distance)}
                >
                    <Text style={styles.smallButtonText}>🗺️</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    const renderCsbItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.itemCard}
            onPress={() => openMaps(item.name, item.distance)}
        >
            <View style={styles.itemIcon}>
                <Text style={styles.iconText}>🏥</Text>
            </View>
            <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDescription}>Distance: {item.distance}</Text>
                <View style={styles.badgeContainer}>
                    {item.emergency && <View style={[styles.badge, styles.emergencyBadge]}><Text style={styles.badgeText}>Urgence</Text></View>}
                    {item.available24h && <View style={[styles.badge, styles.twentyFourBadge]}><Text style={styles.badgeText}>24h/24</Text></View>}
                </View>
            </View>
            <View style={styles.buttonGroup}>
                <TouchableOpacity 
                    style={[styles.smallButton, styles.callButton]}
                    onPress={() => callNumber(item.phone)}
                >
                    <Text style={styles.smallButtonText}>📞</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.smallButton, styles.mapsButton]}
                    onPress={() => openMaps(item.name, item.distance)}
                >
                    <Text style={styles.smallButtonText}>🗺️</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    const renderAmbulanceItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.itemCard}
            onPress={() => callNumber(item.phone)}
        >
            <View style={styles.itemIcon}>
                <Text style={styles.iconText}>🚑</Text>
            </View>
            <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDescription}>Distance: {item.distance}</Text>
                <Text style={styles.itemDescription}>Arrivée: {item.estimatedTime}</Text>
            </View>
            <View style={[styles.statusBadge, item.status === 'available' ? styles.availableStatus : styles.interventionStatus]}>
                <Text style={styles.statusText}>
                    {item.status === 'available' ? 'Disponible' : 'En intervention'}
                </Text>
            </View>
        </TouchableOpacity>
    );

    const renderContent = () => {
        switch(selectedTab) {
            case 'medicines':
                return (
                    <FlatList
                        data={filteredMedicines}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderMedicineItem}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={() => (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>Aucun médicament trouvé</Text>
                            </View>
                        )}
                    />
                );
            case 'pharmacies':
                return (
                    <FlatList
                        data={filteredPharmacies}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderPharmacyItem}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={() => (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>Aucune pharmacie trouvée</Text>
                            </View>
                        )}
                    />
                );
            case 'csb':
                return (
                    <FlatList
                        data={filteredCsb}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderCsbItem}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={() => (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>Aucun CSB trouvé</Text>
                            </View>
                        )}
                    />
                );
            case 'ambulances':
                return (
                    <FlatList
                        data={filteredAmbulances}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderAmbulanceItem}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={() => (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>Aucune ambulance trouvée</Text>
                            </View>
                        )}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
            
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Medical</Text>
                <Text style={styles.headerSubtitle}>
                    Disponibilité des pharmacies, CSB, blocs d'urgence
                </Text>
            </View>

            <View style={styles.tabContainer}>
                <TouchableOpacity 
                    style={[styles.tab, selectedTab === 'medicines' && styles.activeTab]}
                    onPress={() => setSelectedTab('medicines')}
                >
                    <Text style={[styles.tabText, selectedTab === 'medicines' && styles.activeTabText]}>💊 Médicaments</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tab, selectedTab === 'pharmacies' && styles.activeTab]}
                    onPress={() => setSelectedTab('pharmacies')}
                >
                    <Text style={[styles.tabText, selectedTab === 'pharmacies' && styles.activeTabText]}>🏪 Pharmacies</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tab, selectedTab === 'csb' && styles.activeTab]}
                    onPress={() => setSelectedTab('csb')}
                >
                    <Text style={[styles.tabText, selectedTab === 'csb' && styles.activeTabText]}>🏥 CSB</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tab, selectedTab === 'ambulances' && styles.activeTab]}
                    onPress={() => setSelectedTab('ambulances')}
                >
                    <Text style={[styles.tabText, selectedTab === 'ambulances' && styles.activeTabText]}>🚑 Ambulances</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Rechercher..."
                    placeholderTextColor="#999"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {renderContent()}

            <TouchableOpacity 
                style={styles.mapsFooterButton}
                onPress={() => {
                    Linking.openURL('https://maps.google.com/?q=dispensaire+medical');
                }}
            >
                <Text style={styles.mapsFooterButtonText}>🗺️ Voir tous les dispensaires sur Maps</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        padding: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FF3B30',
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        marginTop: 5,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#FF3B30',
    },
    tabText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#666',
    },
    activeTabText: {
        color: '#FF3B30',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: 15,
        paddingHorizontal: 15,
        backgroundColor: 'white',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E5E5',
    },
    searchIcon: {
        fontSize: 18,
        marginRight: 10,
        color: '#999',
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
    },
    listContainer: {
        padding: 15,
        paddingBottom: 80,
    },
    itemCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    itemIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FFF0F0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    iconText: {
        fontSize: 28,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    itemDescription: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    itemPrice: {
        fontSize: 14,
        color: '#FF3B30',
        fontWeight: '600',
        marginTop: 4,
    },
    stockBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    inStock: {
        backgroundColor: '#34C759',
    },
    outStock: {
        backgroundColor: '#FF3B30',
    },
    stockText: {
        color: 'white',
        fontSize: 11,
        fontWeight: 'bold',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    availableStatus: {
        backgroundColor: '#34C759',
    },
    interventionStatus: {
        backgroundColor: '#FF9500',
    },
    statusText: {
        color: 'white',
        fontSize: 11,
        fontWeight: 'bold',
    },
    buttonGroup: {
        flexDirection: 'row',
        gap: 8,
    },
    smallButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    callButton: {
        backgroundColor: '#34C759',
    },
    mapsButton: {
        backgroundColor: '#007AFF',
    },
    smallButtonText: {
        fontSize: 18,
    },
    badgeContainer: {
        flexDirection: 'row',
        marginTop: 4,
        gap: 5,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    emergencyBadge: {
        backgroundColor: '#FF3B30',
    },
    twentyFourBadge: {
        backgroundColor: '#34C759',
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: '#666',
    },
    mapsFooterButton: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 5,
    },
    mapsFooterButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});