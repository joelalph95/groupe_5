import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Linking
} from 'react-native';

export default function WellnessScreen() {
    const [selectedGender, setSelectedGender] = useState('all');

    // Section BIEN-ÊTRE SANTÉ avec conseils et suivi réguliers
    const healthTips = [
        { id: 1, title: '💧 Hydratation', tip: 'Buvez au moins 1.5L d\'eau par jour', category: 'all' },
        { id: 2, title: '😴 Sommeil', tip: 'Dormez 7-8h par nuit pour une bonne récupération', category: 'all' },
        { id: 3, title: '🥗 Alimentation', tip: 'Mangez 5 fruits et légumes par jour', category: 'all' },
        { id: 4, title: '🏃 Exercice', tip: '30 minutes d\'activité physique par jour', category: 'all' },
        { id: 5, title: '🧘 Méditation', tip: 'Prenez 10 minutes pour méditer chaque jour', category: 'all' },
        { id: 6, title: '👩 Grossesse', tip: 'Consultez régulièrement votre médecin', category: 'women' },
        { id: 7, title: '🩸 Règles', tip: 'Suivez votre cycle avec notre calendrier', category: 'women' },
        { id: 8, title: '🩺 Prostate', tip: 'Dépistage recommandé après 50 ans', category: 'men' },
    ];

    const regularFollowUps = [
        { id: 1, title: '📅 Rappels médicaux', description: 'Vaccins, examens périodiques', icon: '⏰' },
        { id: 2, title: '📊 Carnet de santé', description: 'Historique médical', icon: '📓' },
        { id: 3, title: '📈 Statistiques', description: 'Évolution de votre santé', icon: '📊' },
        { id: 4, title: '🤰 Suivi grossesse', description: 'Semaines, conseils, dates', icon: '👶' },
        { id: 5, title: '🩸 Cycle menstruel', description: 'Calendrier des règles', icon: '📅' },
        { id: 6, title: '💪 Activité physique', description: 'Suivi sport personnalisé', icon: '🏃' },
    ];

    const emergencyContacts = [
        { name: 'SAMU', number: '124', icon: '🚑' },
        { name: 'Police', number: '117', icon: '👮' },
        { name: 'Pompiers', number: '118', icon: '🔥' },
    ];

    const filteredTips = healthTips.filter(tip => 
        selectedGender === 'all' ? true : tip.category === selectedGender || tip.category === 'all'
    );

    const callEmergency = (number) => {
        Linking.openURL(`tel:${number}`);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
            
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>🧘 Bien-être Santé</Text>
                    <Text style={styles.headerSubtitle}>Conseils et suivi réguliers</Text>
                </View>

                {/* Sélecteur de genre */}
                <View style={styles.genderSelector}>
                    <TouchableOpacity 
                        style={[styles.genderButton, selectedGender === 'all' && styles.genderActive]}
                        onPress={() => setSelectedGender('all')}
                    >
                        <Text style={[styles.genderText, selectedGender === 'all' && styles.genderTextActive]}>Tous</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.genderButton, selectedGender === 'women' && styles.genderActive]}
                        onPress={() => setSelectedGender('women')}
                    >
                        <Text style={[styles.genderText, selectedGender === 'women' && styles.genderTextActive]}>👩 Femmes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.genderButton, selectedGender === 'men' && styles.genderActive]}
                        onPress={() => setSelectedGender('men')}
                    >
                        <Text style={[styles.genderText, selectedGender === 'men' && styles.genderTextActive]}>👨 Hommes</Text>
                    </TouchableOpacity>
                </View>

                {/* Conseils santé */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>💡 Conseils santé</Text>
                    {filteredTips.map((tip) => (
                        <View key={tip.id} style={styles.tipCard}>
                            <Text style={styles.tipTitle}>{tip.title}</Text>
                            <Text style={styles.tipText}>{tip.tip}</Text>
                        </View>
                    ))}
                </View>

                {/* Suivi régulier */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📋 Suivi régulier</Text>
                    <View style={styles.followUpGrid}>
                        {regularFollowUps.map((item) => (
                            <TouchableOpacity 
                                key={item.id}
                                style={styles.followUpCard}
                            >
                                <Text style={styles.followUpIcon}>{item.icon}</Text>
                                <Text style={styles.followUpTitle}>{item.title}</Text>
                                <Text style={styles.followUpDescription}>{item.description}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Numéros d'urgence */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🚨 Numéros d'urgence</Text>
                    <View style={styles.emergencyGrid}>
                        {emergencyContacts.map((contact, index) => (
                            <TouchableOpacity 
                                key={index}
                                style={styles.emergencyCard}
                                onPress={() => callEmergency(contact.number)}
                            >
                                <Text style={styles.emergencyIcon}>{contact.icon}</Text>
                                <Text style={styles.emergencyName}>{contact.name}</Text>
                                <Text style={styles.emergencyNumber}>{contact.number}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Rappel */}
                <View style={styles.reminderBox}>
                    <Text style={styles.reminderText}>
                        ⚠️ En cas d'urgence médicale grave, appelez immédiatement le 124 (SAMU)
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
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: 5,
    },
    genderSelector: {
        flexDirection: 'row',
        padding: 15,
        gap: 10,
        backgroundColor: 'white',
    },
    genderButton: {
        flex: 1,
        padding: 12,
        borderRadius: 10,
        backgroundColor: '#F0F0F0',
        alignItems: 'center',
    },
    genderActive: {
        backgroundColor: '#FF3B30',
    },
    genderText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    genderTextActive: {
        color: 'white',
    },
    section: {
        backgroundColor: 'white',
        margin: 15,
        padding: 15,
        borderRadius: 15,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    tipCard: {
        backgroundColor: '#F8F9FA',
        padding: 12,
        borderRadius: 10,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E5E5E5',
    },
    tipTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    tipText: {
        fontSize: 13,
        color: '#666',
    },
    followUpGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    followUpCard: {
        width: '48%',
        backgroundColor: '#F8F9FA',
        padding: 12,
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E5E5E5',
        alignItems: 'center',
    },
    followUpIcon: {
        fontSize: 30,
        marginBottom: 8,
    },
    followUpTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 4,
    },
    followUpDescription: {
        fontSize: 11,
        color: '#666',
        textAlign: 'center',
    },
    emergencyGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    emergencyCard: {
        flex: 1,
        backgroundColor: '#FF3B30',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    emergencyIcon: {
        fontSize: 30,
        marginBottom: 8,
        color: 'white',
    },
    emergencyName: {
        color: 'white',
        fontWeight: 'bold',
        marginBottom: 4,
    },
    emergencyNumber: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    reminderBox: {
        backgroundColor: '#FFE5E5',
        margin: 15,
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FF3B30',
        marginBottom: 30,
    },
    reminderText: {
        fontSize: 13,
        color: '#333',
        textAlign: 'center',
    },
});