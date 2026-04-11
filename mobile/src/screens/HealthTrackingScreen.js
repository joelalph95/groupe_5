import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    ScrollView,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
    ActivityIndicator,
    Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSuiviSante, createSuiviSante, updateSuiviSante, deleteSuiviSante } from '../services/api';

export default function HealthTrackingScreen() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [suiviCycle, setSuiviCycle] = useState(null);
    const [suiviGrossesse, setSuiviGrossesse] = useState(null);
    const [suiviPSA, setSuiviPSA] = useState(null);
    const [activites, setActivites] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState('');
    const [formData, setFormData] = useState({});
    const [activiteJour, setActiviteJour] = useState(false);
    const [joursActifs, setJoursActifs] = useState(0);

    useEffect(() => {
        loadUserData();
        loadSuiviData();
    }, []);

    const loadUserData = async () => {
        try {
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                setUser(JSON.parse(userData));
            }
        } catch (error) {
            console.error('Erreur chargement user:', error);
        }
    };

    const loadSuiviData = async () => {
        setLoading(true);
        try {
            // Charger cycle menstruel (femme)
            const cycleData = await getSuiviSante('CYCLE_MENSTRUEL');
            if (cycleData && cycleData.length > 0) {
                setSuiviCycle(cycleData[0]);
            }

            // Charger grossesse (femme)
            const grossesseData = await getSuiviSante('GROSSESSE');
            if (grossesseData && grossesseData.length > 0) {
                setSuiviGrossesse(grossesseData[0]);
            }

            // Charger PSA (homme)
            const psaData = await getSuiviSante('PSA');
            if (psaData && psaData.length > 0) {
                setSuiviPSA(psaData[0]);
            }

            // Charger activités physiques
            const activitesData = await getSuiviSante('ACTIVITE_PHYSIQUE');
            setActivites(activitesData || []);
            
            // Calculer jours actifs cette semaine
            const today = new Date();
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            const weekActivites = activitesData.filter(a => {
                const date = new Date(a.date_debut);
                return date >= startOfWeek;
            });
            setJoursActifs(weekActivites.length);
            
        } catch (error) {
            console.error('Erreur chargement suivis:', error);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (type, existingData = null) => {
        setModalType(type);
        if (existingData) {
            setFormData(existingData);
        } else {
            resetForm(type);
        }
        setModalVisible(true);
    };

    const resetForm = (type) => {
        const baseForm = { type, valeur: null, date_debut: '', observations: '' };
        if (type === 'CYCLE_MENSTRUEL') {
            setFormData({ ...baseForm, duree_cycle: 28, date_debut: new Date().toISOString().split('T')[0] });
        } else if (type === 'GROSSESSE') {
            setFormData({ ...baseForm, semaine_grossesse: 0, date_prevue_accouchement: '' });
        } else if (type === 'PSA') {
            setFormData({ ...baseForm, valeur: 0, unite: 'ng/mL' });
        } else if (type === 'ACTIVITE_PHYSIQUE') {
            setFormData({ ...baseForm, date_debut: new Date().toISOString().split('T')[0], duree: 30 });
        }
    };

    const handleSubmit = async () => {
        try {
            if (formData.id) {
                await updateSuiviSante(formData.id, formData);
                Alert.alert('Succès', 'Mise à jour effectuée');
            } else {
                await createSuiviSante(formData);
                Alert.alert('Succès', 'Ajout effectué');
            }
            setModalVisible(false);
            loadSuiviData();
        } catch (error) {
            console.error('Erreur sauvegarde:', error);
            Alert.alert('Erreur', 'Impossible de sauvegarder');
        }
    };

    const handleDelete = async (id, type) => {
        Alert.alert(
            'Confirmation',
            'Voulez-vous vraiment supprimer ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteSuiviSante(id);
                            Alert.alert('Succès', 'Supprimé');
                            loadSuiviData();
                        } catch (error) {
                            Alert.alert('Erreur', 'Impossible de supprimer');
                        }
                    }
                }
            ]
        );
    };

    const toggleActiviteJour = async () => {
        const newState = !activiteJour;
        setActiviteJour(newState);
        
        if (newState) {
            const today = new Date().toISOString().split('T')[0];
            const exists = activites.some(a => a.date_debut === today);
            if (!exists) {
                await createSuiviSante({
                    type: 'ACTIVITE_PHYSIQUE',
                    date_debut: today,
                    valeur: 1,
                    observations: 'Activité physique enregistrée'
                });
                loadSuiviData();
            }
        }
    };

    const renderProchainesRegles = () => {
        if (!suiviCycle || !suiviCycle.date_debut) return null;
        const lastDate = new Date(suiviCycle.date_debut);
        const cycleLength = suiviCycle.duree_cycle || 28;
        const nextDate = new Date(lastDate);
        nextDate.setDate(lastDate.getDate() + cycleLength);
        const today = new Date();
        const daysLeft = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
        const currentDay = ((today - lastDate) / (1000 * 60 * 60 * 24)) % cycleLength;
        
        return (
            <View style={styles.statsCard}>
                <Text style={styles.statsNumber}>{Math.floor(currentDay) + 1}</Text>
                <Text style={styles.statsLabel}>Jour du cycle</Text>
                <Text style={styles.statsSubtext}>Prochaines règles dans {daysLeft} jours</Text>
                <Text style={styles.statsSubtext}>Cycle de {cycleLength} jours</Text>
            </View>
        );
    };

    const renderGrossesse = () => {
        if (!suiviGrossesse) return null;
        const deliveryDate = suiviGrossesse.date_prevue_accouchement ? new Date(suiviGrossesse.date_prevue_accouchement) : null;
        const today = new Date();
        const weeksLeft = deliveryDate ? Math.ceil((deliveryDate - today) / (1000 * 60 * 60 * 24 * 7)) : 0;
        
        return (
            <View style={styles.statsCard}>
                <Text style={styles.statsNumber}>{suiviGrossesse.semaine_grossesse || 0}</Text>
                <Text style={styles.statsLabel}>semaines</Text>
                <Text style={styles.statsSubtext}>Accouchement: {deliveryDate ? deliveryDate.toLocaleDateString('fr-FR') : 'Non défini'}</Text>
            </View>
        );
    };

    const renderPSA = () => {
        if (!suiviPSA) return null;
        const isNormal = suiviPSA.valeur < 4;
        
        return (
            <View style={styles.statsCard}>
                <Text style={[styles.statsNumber, { color: isNormal ? '#34C759' : '#FF3B30' }]}>
                    {suiviPSA.valeur}
                </Text>
                <Text style={styles.statsLabel}>{suiviPSA.unite || 'ng/mL'}</Text>
                <Text style={styles.statsSubtext}>
                    {suiviPSA.date_debut ? new Date(suiviPSA.date_debut).toLocaleDateString('fr-FR') : 'Date non définie'}
                </Text>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FF3B30" />
                    <Text style={styles.loadingText}>Chargement...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const isFemale = user?.sexe === 'FEMININ';
    const isMale = user?.sexe === 'MASCULIN';

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
            
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>📊 Suivi Santé</Text>
                    <Text style={styles.headerSubtitle}>Personnalisé pour {isFemale ? 'vous' : 'vous'}</Text>
                </View>

                {/* Section Femme */}
                {isFemale && (
                    <>
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>🩸 Cycle menstruel</Text>
                                <TouchableOpacity onPress={() => openModal('CYCLE_MENSTRUEL', suiviCycle)}>
                                    <Text style={styles.addButton}>
                                        {suiviCycle ? 'Modifier' : '+ Ajouter'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            {suiviCycle ? renderProchainesRegles() : (
                                <TouchableOpacity style={styles.emptyCard} onPress={() => openModal('CYCLE_MENSTRUEL')}>
                                    <Text style={styles.emptyText}>Ajouter votre cycle</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>🤰 Grossesse</Text>
                                <TouchableOpacity onPress={() => openModal('GROSSESSE', suiviGrossesse)}>
                                    <Text style={styles.addButton}>
                                        {suiviGrossesse ? 'Modifier' : '+ Ajouter'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            {suiviGrossesse ? renderGrossesse() : (
                                <TouchableOpacity style={styles.emptyCard} onPress={() => openModal('GROSSESSE')}>
                                    <Text style={styles.emptyText}>Ajouter un suivi grossesse</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </>
                )}

                {/* Section Homme */}
                {isMale && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>🩺 Dépistages PSA</Text>
                            <TouchableOpacity onPress={() => openModal('PSA', suiviPSA)}>
                                <Text style={styles.addButton}>
                                    {suiviPSA ? 'Modifier' : '+ Ajouter'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        {suiviPSA ? (
                            <View style={styles.psaContainer}>
                                {renderPSA()}
                                <TouchableOpacity 
                                    style={styles.deleteButton}
                                    onPress={() => handleDelete(suiviPSA.id, 'PSA')}
                                >
                                    <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity style={styles.emptyCard} onPress={() => openModal('PSA')}>
                                <Text style={styles.emptyText}>Ajouter un dépistage PSA</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Section Activité physique (Homme et Femme) */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>🏃 Activités physiques</Text>
                        <TouchableOpacity onPress={() => openModal('ACTIVITE_PHYSIQUE')}>
                            <Text style={styles.addButton}>+ Ajouter</Text>
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.activityStats}>
                        <Text style={styles.activityNumber}>{joursActifs}</Text>
                        <Text style={styles.activityLabel}>jours actifs cette semaine</Text>
                    </View>

                    <View style={styles.dailySwitch}>
                        <Text style={styles.switchLabel}>Activité aujourd'hui</Text>
                        <Switch
                            value={activiteJour}
                            onValueChange={toggleActiviteJour}
                            trackColor={{ false: '#E5E5E5', true: '#FF3B30' }}
                            thumbColor={activiteJour ? '#FFFFFF' : '#FFFFFF'}
                        />
                    </View>

                    {activites.length > 0 && (
                        <View style={styles.activitiesList}>
                            <Text style={styles.listTitle}>Historique</Text>
                            {activites.slice(0, 5).map((act) => (
                                <View key={act.id} style={styles.activityItem}>
                                    <Text style={styles.activityDate}>
                                        {new Date(act.date_debut).toLocaleDateString('fr-FR')}
                                    </Text>
                                    <TouchableOpacity onPress={() => handleDelete(act.id, 'ACTIVITE_PHYSIQUE')}>
                                        <Ionicons name="trash-outline" size={18} color="#999" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Modal d'ajout/modification */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {modalType === 'CYCLE_MENSTRUEL' && 'Cycle menstruel'}
                                {modalType === 'GROSSESSE' && 'Suivi grossesse'}
                                {modalType === 'PSA' && 'Dépistage PSA'}
                                {modalType === 'ACTIVITE_PHYSIQUE' && 'Activité physique'}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            {modalType === 'CYCLE_MENSTRUEL' && (
                                <>
                                    <Text style={styles.inputLabel}>Date des dernières règles</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="YYYY-MM-DD"
                                        value={formData.date_debut}
                                        onChangeText={(text) => setFormData({ ...formData, date_debut: text })}
                                    />
                                    <Text style={styles.inputLabel}>Durée du cycle (jours)</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="28"
                                        keyboardType="numeric"
                                        value={formData.duree_cycle?.toString()}
                                        onChangeText={(text) => setFormData({ ...formData, duree_cycle: parseInt(text) || 28 })}
                                    />
                                </>
                            )}

                            {modalType === 'GROSSESSE' && (
                                <>
                                    <Text style={styles.inputLabel}>Date de début</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="YYYY-MM-DD"
                                        value={formData.date_debut}
                                        onChangeText={(text) => setFormData({ ...formData, date_debut: text })}
                                    />
                                    <Text style={styles.inputLabel}>Semaine actuelle</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="0"
                                        keyboardType="numeric"
                                        value={formData.semaine_grossesse?.toString()}
                                        onChangeText={(text) => setFormData({ ...formData, semaine_grossesse: parseInt(text) || 0 })}
                                    />
                                    <Text style={styles.inputLabel}>Date prévue accouchement</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="YYYY-MM-DD"
                                        value={formData.date_prevue_accouchement}
                                        onChangeText={(text) => setFormData({ ...formData, date_prevue_accouchement: text })}
                                    />
                                </>
                            )}

                            {modalType === 'PSA' && (
                                <>
                                    <Text style={styles.inputLabel}>Valeur PSA (ng/mL)</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="0.0"
                                        keyboardType="numeric"
                                        value={formData.valeur?.toString()}
                                        onChangeText={(text) => setFormData({ ...formData, valeur: parseFloat(text) || 0 })}
                                    />
                                    <Text style={styles.inputLabel}>Date du test</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="YYYY-MM-DD"
                                        value={formData.date_debut}
                                        onChangeText={(text) => setFormData({ ...formData, date_debut: text })}
                                    />
                                </>
                            )}

                            {modalType === 'ACTIVITE_PHYSIQUE' && (
                                <>
                                    <Text style={styles.inputLabel}>Date</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="YYYY-MM-DD"
                                        value={formData.date_debut}
                                        onChangeText={(text) => setFormData({ ...formData, date_debut: text })}
                                    />
                                    <Text style={styles.inputLabel}>Durée (minutes)</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="30"
                                        keyboardType="numeric"
                                        value={formData.duree?.toString()}
                                        onChangeText={(text) => setFormData({ ...formData, duree: parseInt(text) || 30 })}
                                    />
                                </>
                            )}

                            <Text style={styles.inputLabel}>Observations</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Notes supplémentaires..."
                                multiline
                                numberOfLines={3}
                                value={formData.observations}
                                onChangeText={(text) => setFormData({ ...formData, observations: text })}
                            />
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
                                <Text style={styles.saveButtonText}>Enregistrer</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 14,
        color: '#666',
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
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        marginTop: 5,
    },
    section: {
        backgroundColor: 'white',
        margin: 15,
        marginBottom: 0,
        padding: 15,
        borderRadius: 15,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    addButton: {
        fontSize: 14,
        color: '#FF3B30',
        fontWeight: '500',
    },
    statsCard: {
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#FFF0F0',
        borderRadius: 12,
    },
    statsNumber: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#FF3B30',
    },
    statsLabel: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
    statsSubtext: {
        fontSize: 12,
        color: '#999',
        marginTop: 5,
    },
    psaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    deleteButton: {
        marginLeft: 15,
        padding: 10,
    },
    emptyCard: {
        padding: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 12,
        borderStyle: 'dashed',
    },
    emptyText: {
        color: '#999',
        fontSize: 14,
    },
    activityStats: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#E8F5E9',
        borderRadius: 12,
        marginBottom: 15,
    },
    activityNumber: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#34C759',
    },
    activityLabel: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
    dailySwitch: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    switchLabel: {
        fontSize: 14,
        color: '#333',
    },
    activitiesList: {
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    listTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    activityItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    activityDate: {
        fontSize: 13,
        color: '#666',
    },
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
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 5,
        marginTop: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 10,
        padding: 12,
        fontSize: 14,
        backgroundColor: '#F8F9FA',
        marginBottom: 10,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    modalFooter: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
    },
    saveButton: {
        backgroundColor: '#FF3B30',
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