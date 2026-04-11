// src/components/FloatingCartButton.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
  TextInput,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createCommande } from '../services/api';

export default function FloatingCartButton({ navigation }) {
  const { cartItems, cartCount, cartTotal, removeFromCart, updateQuantity, clearCart } = useCart();
  const [modalVisible, setModalVisible] = useState(false);
  const [checkoutModal, setCheckoutModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [nomComplet, setNomComplet] = useState('');
  const [telephone, setTelephone] = useState('');
  const [adresseLivraison, setAdresseLivraison] = useState('');
  const [modePaiement, setModePaiement] = useState('MOBILE_MONEY');

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const user = await AsyncStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        setNomComplet(`${userData.prenom || ''} ${userData.nom || ''}`.trim());
        setTelephone(userData.telephone || '');
      }
    } catch (error) {
      console.error('Erreur chargement user:', error);
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Panier vide', 'Ajoutez des produits à votre panier');
      return;
    }
    setModalVisible(false);
    setCheckoutModal(true);
  };

  const submitOrder = async () => {
    if (!adresseLivraison.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre adresse de livraison');
      return;
    }

    setLoading(true);
    try {
      const items = cartItems.map(item => ({
        medicament_id: item.id,
        quantite: item.quantity
      }));

      const response = await createCommande({
        items,
        adresse_livraison: adresseLivraison,
        mode_paiement: modePaiement,
        ordonnance_url: null
      });

      if (response.data.success) {
        Alert.alert(
          'Commande confirmée ✅',
          `Votre commande a été enregistrée.\nMontant total: ${cartTotal} Ar\nNuméro: #${response.data.commande.id}`,
          [{ text: 'OK', onPress: () => {
            clearCart();
            setCheckoutModal(false);
            if (navigation) navigation.navigate('PharmacyMain');
          }}]
        );
      }
    } catch (error) {
      console.error('Erreur commande:', error);
      Alert.alert(
        'Erreur',
        error.response?.data?.error || 'Erreur lors de la commande'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <View style={styles.cartItemInfo}>
        <Text style={styles.cartItemName}>{item.name}</Text>
        <Text style={styles.cartItemPrice}>{item.price} Ar x {item.quantity}</Text>
        <Text style={styles.cartItemTotal}>Total: {item.price * item.quantity} Ar</Text>
      </View>
      <View style={styles.cartItemActions}>
        <TouchableOpacity
          style={styles.quantityBtn}
          onPress={() => updateQuantity(item.id, item.quantity - 1)}
        >
          <Text style={styles.quantityBtnText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.quantityText}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.quantityBtn}
          onPress={() => updateQuantity(item.id, item.quantity + 1)}
        >
          <Text style={styles.quantityBtnText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => removeFromCart(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Ne pas afficher si le panier est vide
  if (cartCount === 0) return null;

  return (
    <>
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <View style={styles.cartIconContainer}>
          <Ionicons name="cart" size={28} color="#FFFFFF" />
          {cartCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartCount}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Modal du panier */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mon Panier ({cartCount})</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            {cartItems.length === 0 ? (
              <View style={styles.emptyCart}>
                <Ionicons name="cart-outline" size={80} color="#CCC" />
                <Text style={styles.emptyCartText}>Votre panier est vide</Text>
              </View>
            ) : (
              <>
                <FlatList
                  data={cartItems}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderCartItem}
                  style={styles.cartList}
                />
                <View style={styles.modalFooter}>
                  <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>Total:</Text>
                    <Text style={styles.totalAmount}>{cartTotal} Ar</Text>
                  </View>
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.clearButton]}
                      onPress={clearCart}
                    >
                      <Text style={styles.clearButtonText}>Vider</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.checkoutButton]}
                      onPress={handleCheckout}
                    >
                      <Text style={styles.checkoutButtonText}>Commander</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal de checkout */}
      <Modal
        visible={checkoutModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCheckoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.checkoutContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.checkoutHeader}>
              <Text style={styles.checkoutTitle}>Validation commande</Text>
              <TouchableOpacity onPress={() => setCheckoutModal(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.checkoutSection}>
              <Text style={styles.sectionTitle}>📍 Adresse de livraison</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Adresse complète *"
                placeholderTextColor="#999"
                value={adresseLivraison}
                onChangeText={setAdresseLivraison}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.checkoutSection}>
              <Text style={styles.sectionTitle}>💳 Mode de paiement</Text>
              
              <TouchableOpacity
                style={[styles.paymentOption, modePaiement === 'MOBILE_MONEY' && styles.paymentSelected]}
                onPress={() => setModePaiement('MOBILE_MONEY')}
              >
                <Ionicons name="phone-portrait-outline" size={24} color={modePaiement === 'MOBILE_MONEY' ? '#FF3B30' : '#666'} />
                <Text style={[styles.paymentText, modePaiement === 'MOBILE_MONEY' && styles.paymentTextSelected]}>
                  Mobile Money (Airtel, Orange, Telma)
                </Text>
                {modePaiement === 'MOBILE_MONEY' && <Ionicons name="checkmark-circle" size={24} color="#34C759" />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.paymentOption, modePaiement === 'CARTE' && styles.paymentSelected]}
                onPress={() => setModePaiement('CARTE')}
              >
                <Ionicons name="card-outline" size={24} color={modePaiement === 'CARTE' ? '#FF3B30' : '#666'} />
                <Text style={[styles.paymentText, modePaiement === 'CARTE' && styles.paymentTextSelected]}>
                  Carte bancaire
                </Text>
                {modePaiement === 'CARTE' && <Ionicons name="checkmark-circle" size={24} color="#34C759" />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.paymentOption, modePaiement === 'ESPECES' && styles.paymentSelected]}
                onPress={() => setModePaiement('ESPECES')}
              >
                <Ionicons name="cash-outline" size={24} color={modePaiement === 'ESPECES' ? '#FF3B30' : '#666'} />
                <Text style={[styles.paymentText, modePaiement === 'ESPECES' && styles.paymentTextSelected]}>
                  Espèces à la livraison
                </Text>
                {modePaiement === 'ESPECES' && <Ionicons name="checkmark-circle" size={24} color="#34C759" />}
              </TouchableOpacity>
            </View>

            <View style={styles.orderSummary}>
              <Text style={styles.summaryTitle}>Récapitulatif</Text>
              {cartItems.map(item => (
                <View key={item.id} style={styles.summaryItem}>
                  <Text style={styles.summaryName}>{item.name} x{item.quantity}</Text>
                  <Text style={styles.summaryPrice}>{item.price * item.quantity} Ar</Text>
                </View>
              ))}
              <View style={styles.summaryTotal}>
                <Text style={styles.summaryTotalLabel}>Total</Text>
                <Text style={styles.summaryTotalAmount}>{cartTotal} Ar</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.disabledButton]}
              onPress={submitOrder}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Confirmer la commande</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 12,
    backgroundColor: '#FF3B30',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 1000,
  },
  cartIconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -10,
    right: -15,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  cartList: {
    maxHeight: 400,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  cartItemInfo: {
    flex: 2,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  cartItemPrice: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  cartItemTotal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginTop: 2,
  },
  cartItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: 'bold',
    minWidth: 30,
    textAlign: 'center',
  },
  removeBtn: {
    padding: 5,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF3B30',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#F0F0F0',
  },
  clearButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  checkoutButton: {
    backgroundColor: '#FF3B30',
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  emptyCart: {
    alignItems: 'center',
    padding: 50,
  },
  emptyCartText: {
    marginTop: 10,
    fontSize: 16,
    color: '#999',
  },
  checkoutContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  checkoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  checkoutTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  checkoutSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
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
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 10,
    backgroundColor: '#F8F9FA',
  },
  paymentSelected: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF0F0',
  },
  paymentText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  paymentTextSelected: {
    color: '#FF3B30',
    fontWeight: '500',
  },
  orderSummary: {
    margin: 20,
    padding: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  summaryName: {
    fontSize: 14,
    color: '#666',
  },
  summaryPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF3B30',
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryTotalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF3B30',
  },
  submitButton: {
    backgroundColor: '#FF3B30',
    margin: 20,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});