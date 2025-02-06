import axios from 'axios';
import config from '../../config/env.js';

const MAX_RETRIES = 3;

const sendToWhatsApp = async (data, retries = MAX_RETRIES, delayMs = 1000) => {
  if (!config.API_TOKEN || !config.BUSINESS_PHONE) {
    throw new Error('Configuración de WhatsApp incompleta');
  }

  const url = `https://graph.facebook.com/${config.API_VERSION}/${config.BUSINESS_PHONE}/messages`;
  const headers = {
    'Authorization': `Bearer ${config.API_TOKEN}`,
    'Content-Type': 'application/json'
  };

  // Ensure the data sent in the request meets the WhatsApp API requirements
  if (!data.to || !data.type || (data.type === 'interactive' && !data.interactive)) {
    throw new Error('Datos de solicitud incompletos o incorrectos');
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.post(url, data, {
        headers,
        timeout: 10000,
        validateStatus: status => status >= 200 && status < 300
      });
      return response.data;
    } catch (error) {
      if (attempt < retries) {
        console.warn(`Intento ${attempt} fallido. Reintentando en ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs *= 2; // Backoff exponencial
      } else {
        if (error.response) {
          console.error('Error de WhatsApp API:', {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers
          });
        } else if (error.request) {
          console.error('Error de red:', error.message);
        } else {
          console.error('Error de configuración:', error.message);
        }
        throw error;
      }
    }
  }
};

export default sendToWhatsApp;
