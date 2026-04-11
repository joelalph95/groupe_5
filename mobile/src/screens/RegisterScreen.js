import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerPatient } from '../services/api';

export default function RegisterScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    mot_de_passe: '',
    confirmeMotDePasse: '',
    email: '',
    sexe: '',
    date_naissance: '',
    adresse: '',
    groupe_sanguin: '',
    allergies: '',
    contact_urgence: ''
  });
  const [showExtraFields, setShowExtraFields] = useState(false);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    // Validation
    if (!formData.nom || !formData.prenom || !formData.telephone || !formData.mot_de_passe) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (formData.mot_de_passe !== formData.confirmeMotDePasse) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.telephone.length < 9) {
      Alert.alert('Erreur', 'Numéro de téléphone invalide');
      return;
    }

    setLoading(true);
    try {
      const response = await registerPatient({
        nom: formData.nom,
        prenom: formData.prenom,
        telephone: formData.telephone,
        mot_de_passe: formData.mot_de_passe,
        email: formData.email || null,
        sexe: formData.sexe || null,
        date_naissance: formData.date_naissance || null,
        adresse: formData.adresse || null,
        groupe_sanguin: formData.groupe_sanguin || null,
        allergies: formData.allergies || null,
        contact_urgence: formData.contact_urgence || null,
      });

      const { token, user } = response.data;
      
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      Alert.alert('Succès', 'Inscription réussie');
    } catch (error) {
      console.error('Erreur inscription:', error);
      let errorMessage = 'Erreur lors de l\'inscription';
      
      if (error.offline) {
        errorMessage = 'Mode hors-ligne. Vérifiez votre connexion internet.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      Alert.alert('Erreur', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Inscription</Text>
          <Text style={styles.subtitle}>Créez votre compte MIAINA</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Informations personnelles</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Nom *"
            value={formData.nom}
            onChangeText={(v) => updateField('nom', v)}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Prénom *"
            value={formData.prenom}
            onChangeText={(v) => updateField('prenom', v)}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Téléphone *"
            value={formData.telephone}
            onChangeText={(v) => updateField('telephone', v)}
            keyboardType="phone-pad"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Email (optionnel)"
            value={formData.email}
            onChangeText={(v) => updateField('email', v)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Mot de passe *"
            value={formData.mot_de_passe}
            onChangeText={(v) => updateField('mot_de_passe', v)}
            secureTextEntry
          />
          
          <TextInput
            style={styles.input}
            placeholder="Confirmer mot de passe *"
            value={formData.confirmeMotDePasse}
            onChangeText={(v) => updateField('confirmeMotDePasse', v)}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.showMoreButton}
            onPress={() => setShowExtraFields(!showExtraFields)}
          >
            <Text style={styles.showMoreText}>
              {showExtraFields ? '▼ Moins d\'options' : '▶ Plus d\'options (médicales)'}
            </Text>
          </TouchableOpacity>

          {showExtraFields && (
            <View>
              <Text style={styles.sectionTitle}>Informations médicales</Text>
              
              <View style={styles.genderContainer}>
                <TouchableOpacity
                  style={[styles.genderButton, formData.sexe === 'MASCULIN' && styles.genderActive]}
                  onPress={() => updateField('sexe', 'MASCULIN')}
                >
                  <Text style={[styles.genderText, formData.sexe === 'MASCULIN' && styles.genderTextActive]}>
                    👨 Homme
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.genderButton, formData.sexe === 'FEMININ' && styles.genderActive]}
                  onPress={() => updateField('sexe', 'FEMININ')}
                >
                  <Text style={[styles.genderText, formData.sexe === 'FEMININ' && styles.genderTextActive]}>
                    👩 Femme
                  </Text>
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={styles.input}
                placeholder="Date de naissance (YYYY-MM-DD)"
                value={formData.date_naissance}
                onChangeText={(v) => updateField('date_naissance', v)}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Adresse"
                value={formData.adresse}
                onChangeText={(v) => updateField('adresse', v)}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Groupe sanguin (A+, A-, B+, etc.)"
                value={formData.groupe_sanguin}
                onChangeText={(v) => updateField('groupe_sanguin', v)}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Allergies"
                value={formData.allergies}
                onChangeText={(v) => updateField('allergies', v)}
                multiline
              />
              
              <TextInput
                style={styles.input}
                placeholder="Contact d'urgence"
                value={formData.contact_urgence}
                onChangeText={(v) => updateField('contact_urgence', v)}
                keyboardType="phone-pad"
              />
            </View>
          )}

          <TouchableOpacity
            style={styles.button}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>S'inscrire</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginText}>
              Déjà un compte ? <Text style={styles.loginBold}>Se connecter</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  backButton: {
    marginBottom: 15,
  },
  backText: {
    fontSize: 16,
    color: '#FF3B30',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF3B30',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  genderButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  genderActive: {
    backgroundColor: '#FF3B30',
  },
  genderText: {
    fontSize: 14,
    color: '#666',
  },
  genderTextActive: {
    color: 'white',
  },
  showMoreButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  showMoreText: {
    color: '#FF3B30',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  loginBold: {
    color: '#FF3B30',
    fontWeight: 'bold',
  },
});