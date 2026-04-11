import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    ScrollView
} from 'react-native';

export default function MedicineDetailScreen({ route, navigation }) {
    const { medicine } = route.params;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
            
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.icon}>{medicine.image}</Text>
                    <Text style={styles.name}>{medicine.name}</Text>
                    <Text style={styles.price}>{medicine.price} Ar</Text>
                    <View style={[styles.stockBadge, medicine.stock ? styles.inStock : styles.outStock]}>
                        <Text style={styles.stockText}>
                            {medicine.stock ? '✓ En stock' : '✗ Rupture de stock'}
                        </Text>
                    </View>
                </View>

                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>Informations</Text>
                    <Text style={styles.infoText}>
                        Ce médicament est disponible dans les pharmacies partenaires.
                        La livraison est assurée dans les 24h.
                    </Text>
                </View>

                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>Pharmacies partenaires</Text>
                    <TouchableOpacity style={styles.pharmacyItem}>
                        <Text style={styles.pharmacyName}>Pharmacie Centrale</Text>
                        <Text style={styles.pharmacyDistance}>2.5 km</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.pharmacyItem}>
                        <Text style={styles.pharmacyName}>Pharmacie Santé Plus</Text>
                        <Text style={styles.pharmacyDistance}>3.8 km</Text>
                    </TouchableOpacity>
                </View>

                {medicine.stock && (
                    <TouchableOpacity style={styles.orderButton}>
                        <Text style={styles.orderButtonText}>Ajouter au panier</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        backgroundColor: 'white',
        padding: 20,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    icon: {
        fontSize: 60,
        marginBottom: 10,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    price: {
        fontSize: 20,
        color: '#FF3B30',
        fontWeight: 'bold',
        marginBottom: 10,
    },
    stockBadge: {
        paddingHorizontal: 15,
        paddingVertical: 5,
        borderRadius: 20,
    },
    inStock: {
        backgroundColor: '#34C759',
    },
    outStock: {
        backgroundColor: '#FF3B30',
    },
    stockText: {
        color: 'white',
        fontWeight: 'bold',
    },
    infoCard: {
        backgroundColor: 'white',
        margin: 15,
        padding: 15,
        borderRadius: 12,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    pharmacyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    pharmacyName: {
        fontSize: 14,
        color: '#333',
    },
    pharmacyDistance: {
        fontSize: 12,
        color: '#999',
    },
    orderButton: {
        backgroundColor: '#FF3B30',
        margin: 15,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    orderButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});