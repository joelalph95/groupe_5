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
    KeyboardAvoidingView,
    Platform
} from 'react-native';

export default function ChatbotScreen() {
    const [messages, setMessages] = useState([
        { id: 1, text: "Bonjour ! Je suis MindTrack, votre assistant bien-être. Comment vous sentez-vous aujourd'hui ?", isUser: false },
    ]);
    const [inputText, setInputText] = useState('');

    const getBotResponse = (userMessage) => {
        const lowerMessage = userMessage.toLowerCase();
        
        if (lowerMessage.includes('stress') || lowerMessage.includes('angoissé')) {
            return "Je comprends que vous vous sentez stressé. Essayons un exercice de respiration : Inspirez profondément pendant 4 secondes, retenez 4 secondes, expirez 4 secondes. Répétez 3 fois. 💆‍♂️";
        } else if (lowerMessage.includes('triste') || lowerMessage.includes('déprimé')) {
            return "Je suis désolé que vous vous sentiez triste. Parler à quelqu'un peut aider. Voulez-vous que je vous propose des exercices de méditation ? 🤗";
        } else if (lowerMessage.includes('fatigué') || lowerMessage.includes('épuisé')) {
            return "Le repos est important. Essayez de faire une pause de 10 minutes, buvez de l'eau et étirez-vous doucement. 😴";
        } else if (lowerMessage.includes('merci')) {
            return "Avec plaisir ! Je suis là pour vous aider. N'hésitez pas à revenir quand vous voulez. 🌟";
        } else {
            return "Merci de partager cela avec moi. Continuez à prendre soin de vous. Voulez-vous parler de quelque chose en particulier ? 💙";
        }
    };

    const sendMessage = () => {
        if (!inputText.trim()) return;

        // Ajouter message utilisateur
        const userMessage = {
            id: messages.length + 1,
            text: inputText,
            isUser: true,
        };
        
        // Ajouter réponse bot
        const botResponse = {
            id: messages.length + 2,
            text: getBotResponse(inputText),
            isUser: false,
        };
        
        setMessages([...messages, userMessage, botResponse]);
        setInputText('');
    };

    const renderMessage = ({ item }) => (
        <View style={[styles.messageContainer, item.isUser ? styles.userMessage : styles.botMessage]}>
            <Text style={[styles.messageText, item.isUser ? styles.userText : styles.botText]}>
                {item.text}
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
            
            <View style={styles.header}>
                <Text style={styles.headerTitle}>🤖 MindTrack</Text>
                <Text style={styles.headerSubtitle}>Votre assistant bien-être</Text>
            </View>

            <FlatList
                data={messages}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderMessage}
                contentContainerStyle={styles.messagesContainer}
                showsVerticalScrollIndicator={false}
            />

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.inputContainer}
            >
                <TextInput
                    style={styles.input}
                    placeholder="Écrivez votre message..."
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                />
                <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
                    <Text style={styles.sendButtonText}>Envoyer</Text>
                </TouchableOpacity>
            </KeyboardAvoidingView>
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
        backgroundColor: '#5856D6',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        marginTop: 5,
    },
    messagesContainer: {
        padding: 15,
    },
    messageContainer: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 15,
        marginBottom: 10,
    },
    userMessage: {
        backgroundColor: '#FF3B30',
        alignSelf: 'flex-end',
    },
    botMessage: {
        backgroundColor: '#E5E5E5',
        alignSelf: 'flex-start',
    },
    messageText: {
        fontSize: 14,
    },
    userText: {
        color: 'white',
    },
    botText: {
        color: '#333',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 15,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 8,
        marginRight: 10,
        fontSize: 14,
        maxHeight: 100,
    },
    sendButton: {
        backgroundColor: '#5856D6',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        justifyContent: 'center',
    },
    sendButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});