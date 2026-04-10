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

export default function OrderScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
            
            <View style={styles.header}>
                <Text style={styles.headerTitle}>🛒 Ma commande</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.emptyCart}>
                    <Text style={styles.emptyIcon}>🛍️</Text>
                    <Text style={styles.emptyText}>Votre panier est vide</Text>
                    <Text style={styles.emptySubtext}>
                        Ajoutez des médicaments depuis la pharmacie
                    </Text>
                </View>
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
        padding: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    emptyCart: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 50,
    },
    emptyIcon: {
        fontSize: 80,
        marginBottom: 20,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
});