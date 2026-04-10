import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar } from 'react-native';

export default function HealthTrackingScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
            <View style={styles.content}>
                <Text style={styles.icon}>📈</Text>
                <Text style={styles.title}>Statistiques et Suivi</Text>
                <Text style={styles.subtitle}>Évolution de votre santé</Text>
                <Text style={styles.comingSoon}>Bientôt disponible</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    icon: {
        fontSize: 80,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
    },
    comingSoon: {
        fontSize: 14,
        color: '#FF3B30',
        fontWeight: 'bold',
    },
});