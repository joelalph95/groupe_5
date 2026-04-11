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
    Alert,
    ActivityIndicator,
    Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { updateUser } from '../services/api';

export default function SettingsScreen({ navigation }) {
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [notifications, setNotifications] = useState(true);
    const [autoLocation, setAutoLocation] = useState(true);
    
    // Formulaire modification profil
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editForm, setEditForm] = useState({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        adresse: '',
        date_naissance: '',
        groupe_sanguin: '',
        allergies: ''
    });

    useEffect(() => {
        loadUserData();
        loadSettings();
    }, []);

    const loadUserData = async () => {
        try {
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
                setEditForm({
                    nom: parsedUser.nom || '',
                    prenom: parsedUser.prenom || '',
                    email: parsedUser.email || '',
                    telephone: parsedUser.telephone || '',
                    adresse: parsedUser.adresse || '',
                    date_naissance: parsedUser.date_naissance || '',
                    groupe_sanguin: parsedUser.groupe_sanguin || '',
                    allergies: parsedUser.allergies || ''
                });
            }
        } catch (error) {
            console.error('Erreur chargement user:', error);
        }
    };

    const loadSettings = async () => {
        try {
            const notif = await AsyncStorage.getItem('notifications');
            const autoLoc = await AsyncStorage.getItem('autoLocation');
            if (notif) setNotifications(notif === 'true');
            if (autoLoc) setAutoLocation(autoLoc === 'true');
        } catch (error) {
            console.error('Erreur chargement settings:', error);
        }
    };

    const saveSettings = async () => {
        try {
            await AsyncStorage.setItem('notifications', notifications.toString());
            await AsyncStorage.setItem('autoLocation', autoLocation.toString());
            Alert.alert('Succès', 'Paramètres sauvegardés');
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de sauvegarder');
        }
    };

    const handleUpdateProfile = async () => {
        setLoading(true);
        try {
            const response = await updateUser(user.id, 'PATIENT', editForm);
            if (response.data.success) {
                const updatedUser = { ...user, ...editForm };
                await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
                Alert.alert('Succès', 'Profil mis à jour');
                setEditModalVisible(false);
            }
        } catch (error) {
            console.error('Erreur mise à jour profil:', error);
            Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Déconnexion',
            'Voulez-vous vraiment vous déconnecter ?',
            [
                { text: 'Annuler', style: 'cancel' },
                { 
                    text: 'Déconnexion', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await AsyncStorage.removeItem('token');
                            await AsyncStorage.removeItem('user');
                            // Utiliser reset au lieu de replace
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' }],
                            });
                        } catch (error) {
                            console.error('Erreur déconnexion:', error);
                        }
                    }
                }
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Supprimer le compte',
            'Cette action est irréversible. Voulez-vous vraiment supprimer votre compte ?',
            [
                { text: 'Annuler', style: 'cancel' },
                { 
                    text: 'Supprimer', 
                    style: 'destructive',
                    onPress: async () => {
                        Alert.alert('Info', 'Contactez le support pour supprimer votre compte');
                    }
                }
            ]
        );
    };

    const renderEditModal = () => (
        <Modal
            visible={editModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setEditModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Modifier mon profil</Text>
                        <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                        <TextInput
                            style={styles.input}
                            placeholder="Nom"
                            value={editForm.nom}
                            onChangeText={(text) => setEditForm({...editForm, nom: text})}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Prénom"
                            value={editForm.prenom}
                            onChangeText={(text) => setEditForm({...editForm, prenom: text})}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            value={editForm.email}
                            onChangeText={(text) => setEditForm({...editForm, email: text})}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Téléphone"
                            value={editForm.telephone}
                            onChangeText={(text) => setEditForm({...editForm, telephone: text})}
                            keyboardType="phone-pad"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Adresse"
                            value={editForm.adresse}
                            onChangeText={(text) => setEditForm({...editForm, adresse: text})}
                            multiline
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Date de naissance (YYYY-MM-DD)"
                            value={editForm.date_naissance}
                            onChangeText={(text) => setEditForm({...editForm, date_naissance: text})}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Groupe sanguin (A+, A-, B+, etc.)"
                            value={editForm.groupe_sanguin}
                            onChangeText={(text) => setEditForm({...editForm, groupe_sanguin: text})}
                        />
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Allergies"
                            value={editForm.allergies}
                            onChangeText={(text) => setEditForm({...editForm, allergies: text})}
                            multiline
                            numberOfLines={3}
                        />
                    </ScrollView>

                    <View style={styles.modalFooter}>
                        <TouchableOpacity 
                            style={[styles.modalButton, styles.cancelButton]} 
                            onPress={() => setEditModalVisible(false)}
                        >
                            <Text style={styles.cancelButtonText}>Annuler</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.modalButton, styles.saveModalButton]} 
                            onPress={handleUpdateProfile}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <Text style={styles.saveModalButtonText}>Enregistrer</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
            
            <View style={styles.header}>
                <Text style={styles.headerTitle}>⚙️ Paramètres</Text>
                <Text style={styles.headerSubtitle}>Personnalisez votre application</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Section Profil */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>👤 Mon profil</Text>
                        <TouchableOpacity onPress={() => setEditModalVisible(true)}>
                            <Text style={styles.editButton}>Modifier</Text>
                        </TouchableOpacity>
                    </View>
                    
                    {user && (
                        <View style={styles.profileInfo}>
                            <View style={styles.profileRow}>
                                <Text style={styles.profileLabel}>Nom:</Text>
                                <Text style={styles.profileValue}>{user.nom} {user.prenom}</Text>
                            </View>
                            <View style={styles.profileRow}>
                                <Text style={styles.profileLabel}>Email:</Text>
                                <Text style={styles.profileValue}>{user.email || 'Non renseigné'}</Text>
                            </View>
                            <View style={styles.profileRow}>
                                <Text style={styles.profileLabel}>Téléphone:</Text>
                                <Text style={styles.profileValue}>{user.telephone}</Text>
                            </View>
                            <View style={styles.profileRow}>
                                <Text style={styles.profileLabel}>Adresse:</Text>
                                <Text style={styles.profileValue}>{user.adresse || 'Non renseignée'}</Text>
                            </View>
                            {user.groupe_sanguin && (
                                <View style={styles.profileRow}>
                                    <Text style={styles.profileLabel}>Groupe sanguin:</Text>
                                    <Text style={styles.profileValue}>{user.groupe_sanguin}</Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>

                {/* Section Préférences */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🔔 Notifications</Text>
                    
                    <View style={styles.settingRow}>
                        <Text style={styles.settingLabel}>Notifications push</Text>
                        <Switch
                            value={notifications}
                            onValueChange={setNotifications}
                            trackColor={{ false: '#E5E5E5', true: '#FF3B30' }}
                        />
                    </View>
                    
                    <View style={styles.settingRow}>
                        <Text style={styles.settingLabel}>Envoi automatique position</Text>
                        <Switch
                            value={autoLocation}
                            onValueChange={setAutoLocation}
                            trackColor={{ false: '#E5E5E5', true: '#FF3B30' }}
                        />
                    </View>

                    <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
                        <Text style={styles.saveButtonText}>Sauvegarder les préférences</Text>
                    </TouchableOpacity>
                </View>

                {/* Section Sécurité */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🔒 Sécurité</Text>
                    
                    <TouchableOpacity style={styles.menuItem}>
                        <Text style={styles.menuText}>Changer le mot de passe</Text>
                        <Ionicons name="chevron-forward" size={20} color="#CCC" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.menuItem}>
                        <Text style={styles.menuText}>Confidentialité des données</Text>
                        <Ionicons name="chevron-forward" size={20} color="#CCC" />
                    </TouchableOpacity>
                </View>

                {/* Section À propos */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ℹ️ À propos</Text>
                    
                    <TouchableOpacity style={styles.menuItem}>
                        <Text style={styles.menuText}>Version 1.0.0</Text>
                        <Ionicons name="chevron-forward" size={20} color="#CCC" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.menuItem}>
                        <Text style={styles.menuText}>Conditions d'utilisation</Text>
                        <Ionicons name="chevron-forward" size={20} color="#CCC" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.menuItem}>
                        <Text style={styles.menuText}>Politique de confidentialité</Text>
                        <Ionicons name="chevron-forward" size={20} color="#CCC" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.menuItem}>
                        <Text style={styles.menuText}>Mentions légales</Text>
                        <Ionicons name="chevron-forward" size={20} color="#CCC" />
                    </TouchableOpacity>
                </View>

                {/* Section Compte */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>👥 Compte</Text>
                    
                    <TouchableOpacity 
                        style={[styles.menuItem, styles.logoutItem]} 
                        onPress={handleLogout}
                    >
                        <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
                        <Text style={styles.logoutText}>Se déconnecter</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.menuItem, styles.deleteItem]} 
                        onPress={handleDeleteAccount}
                    >
                        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                        <Text style={styles.deleteText}>Supprimer mon compte</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {renderEditModal()}
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
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    editButton: {
        fontSize: 14,
        color: '#FF3B30',
        fontWeight: '500',
    },
    profileInfo: {
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingTop: 10,
    },
    profileRow: {
        flexDirection: 'row',
        paddingVertical: 6,
    },
    profileLabel: {
        width: 120,
        fontSize: 14,
        color: '#666',
    },
    profileValue: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    menuText: {
        fontSize: 14,
        color: '#666',
    },
    logoutItem: {
        borderBottomWidth: 0,
        justifyContent: 'flex-start',
        gap: 10,
    },
    logoutText: {
        fontSize: 16,
        color: '#FF3B30',
        fontWeight: '500',
    },
    deleteItem: {
        borderBottomWidth: 0,
        justifyContent: 'flex-start',
        gap: 10,
        marginTop: 5,
    },
    deleteText: {
        fontSize: 14,
        color: '#FF3B30',
    },
    saveButton: {
        backgroundColor: '#FF3B30',
        marginTop: 15,
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    saveButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
    },
    modalContainer: {
        backgroundColor: 'white',
        margin: 20,
        borderRadius: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    modalBody: {
        padding: 20,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 10,
        padding: 12,
        fontSize: 14,
        backgroundColor: '#F8F9FA',
        marginBottom: 12,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    modalFooter: {
        flexDirection: 'row',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
        gap: 10,
    },
    modalButton: {
        flex: 1,
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#F0F0F0',
    },
    cancelButtonText: {
        color: '#666',
        fontWeight: 'bold',
    },
    saveModalButton: {
        backgroundColor: '#FF3B30',
    },
    saveModalButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});