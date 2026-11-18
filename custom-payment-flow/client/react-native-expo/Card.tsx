import React, {useState} from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  Text,
  Button,
} from 'react-native';
import {CardField, useConfirmPayment} from '@stripe/stripe-react-native';
import type {CardFieldInput} from '@stripe/stripe-react-native';
import {colors} from './colors';
import {API_URL} from './Config';

export default function Card() {
  const [name, setName] = useState('');
  const {confirmPayment, loading} = useConfirmPayment();

  const fetchPaymentIntentClientSecret = async () => {
    const response = await fetch(`${API_URL}/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentMethodType: 'card',
        currency: 'usd',
      }),
    });
    if (!response.ok) {
      throw new Error('Could not create a PaymentIntent.');
    }

    const {clientSecret} = await response.json();
    if (typeof clientSecret !== 'string' || !clientSecret) {
      throw new Error('The server did not return a payment client secret.');
    }
    return clientSecret;
  };

  const handlePayPress = async () => {
    let clientSecret: string;
    try {
      clientSecret = await fetchPaymentIntentClientSecret();
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Could not start the payment.'
      );
      return;
    }

    const {error, paymentIntent} = await confirmPayment(clientSecret, {
      paymentMethodType: 'Card',
      paymentMethodData: {billingDetails: {name}},
    });

    if (error) {
      Alert.alert(`Error code: ${error.code}`, error.message);
    } else if (paymentIntent) {
      Alert.alert(
        'Success',
        `The payment was confirmed successfully! currency: ${paymentIntent.currency}`
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text>Try a test card:</Text>
      <Text>4242424242424242 (Visa)</Text>
      <Text>5555555555554444 (Mastercard)</Text>
      <Text>4000002500003155 (Requires 3DSecure)</Text>
      <Text>
        Use any future expiration, any 3 digit CVC, and any postal code.
      </Text>
      <TextInput
        autoCapitalize="none"
        placeholder="Name"
        keyboardType="name-phone-pad"
        onChange={(value) => setName(value.nativeEvent.text)}
        style={styles.input}
      />
      <CardField
        placeholder={{
          number: '4242 4242 4242 4242',
        }}

        cardStyle={inputStyles}
        style={styles.cardField}
      />
      <Button onPress={handlePayPress} title="Pay" disabled={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  cardField: {
    width: '100%',
    height: 50,
    marginVertical: 30,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  text: {
    marginLeft: 12,
  },
  input: {
    height: 44,
    borderBottomColor: colors.slate,
    borderBottomWidth: 1.5,
  },
});

const inputStyles: CardFieldInput.Styles = {
  borderWidth: 1,
  backgroundColor: '#FFFFFF',
  borderColor: '#000000',
  borderRadius: 8,
  fontSize: 14,
  placeholderColor: '#999999',
};
