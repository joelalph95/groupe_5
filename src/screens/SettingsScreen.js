import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Switch,
    TextInput,
    Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
    const [notifications, setNotifications] = useState(true);
    const [autoLocation, setAutoLocation] = useState(true);
    const [patientName, setPatientName] = useState('');
    const [emergencyContact, setEmergencyContact] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const name = await AsyncStorage.getItem('patientName');
        const contact = await AsyncStorage.getItem('emergencyContact');
        const notif = await AsyncStorage.getItem('notifications');
        const autoLoc = await AsyncStorage.getItem('autoLocation');
        
        if (name) setPatientName(name);
        if (contact) setEmergencyContact(contact);
        if (notif) setNotifications(notif === 'true');
        if (autoLoc) setAutoLocation(autoLoc === 'true');
    };

    const saveSettings = async () => {
        await AsyncStorage.setItem('patientName', patientName);
        await AsyncStorage.setItem('emergencyContact', emergencyContact);
        await AsyncStorage.setItem('notifications', notifications.toString());
        await AsyncStorage.setItem('autoLocation', autoLocation.toString());
        
        Alert.alert('Succès', 'Paramètres sauvegardés');
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
            
            <View style={styles.header}>
                <Text style={styles.headerTitle}>⚙️ Paramètres</Text>
                <Text style={styles.headerSubtitle}>Personnalisez votre application</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Informations personnelles</Text>
                    
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nom du patient</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Votre nom"
                            value={patientName}
                            onChangeText={setPatientName}
                        />
                    </View>
                    
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Contact d'urgence</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Numéro de téléphone"
                            value={emergencyContact}
                            onChangeText={setEmergencyContact}
                            keyboardType="phone-pad"
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notifications</Text>
                    
                    <View style={styles.settingRow}>
                        <Text style={styles.settingLabel}>Notifications push</Text>
                        <Switch
                            value={notifications}
                            onValueChange={setNotifications}
                            trackColor={{ false: '#E5E5E5', true: '#FF3B30' }}
                        />
                    </View>
                    
                    <View style={styles.settingRow}>
                        <Text style={styles.settingLabel}>Envoi auto position</Text>
                        <Switch
                            value={autoLocation}
                            onValueChange={setAutoLocation}
                            trackColor={{ false: '#E5E5E5', true: '#FF3B30' }}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>À propos</Text>
                    
                    <TouchableOpacity style={styles.menuItem}>
                        <Text style={styles.menuText}>Version 1.0.0</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.menuItem}>
                        <Text style={styles.menuText}>Conditions d'utilisation</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.menuItem}>
                        <Text style={styles.menuText}>Politique de confidentialité</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
                    <Text style={styles.saveButtonText}>Sauvegarder</Text>
                </TouchableOpacity>
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
        fontSize: 28,
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
    section: {
        backgroundColor: 'white',
        marginTop: 15,
        padding: 15,
        borderRadius: 12,
        marginHorizontal: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    inputGroup: {
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    input: {
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        padding: 10,
        fontSize: 14,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
    },
    settingLabel: {
        fontSize: 14,
        color: '#333',
    },
    menuItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    menuText: {
        fontSize: 14,
        color: '#666',
    },
    saveButton: {
        backgroundColor: '#FF3B30',
        margin: 15,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});